# OQIM-STT v5.0 — resumable CTC Conformer + bounded-memory streaming inference
# Copyright (c) 2026. Use only datasets/audio you are licensed to process.
#
# Commands:
#   python oqim_stt_v5.py train
#   python oqim_stt_v5.py transcribe /path/to/long_audio.wav
#
# Configure values below or set the matching environment variables.

from __future__ import annotations

import os
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "4")

import sys
import io
import re
import gc
import json
import math
import time
import shutil
import random
import queue
import threading
import hashlib
import argparse
import subprocess
import unicodedata
from contextlib import nullcontext
from pathlib import Path
from typing import Iterator, Optional, Sequence

import numpy as np
import soundfile as sf
import pyarrow.parquet as pq
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchaudio
from scipy.signal import resample_poly

# Kaggle Secret is optional; environment variables take precedence.
if not os.getenv("HF_TOKEN"):
    try:
        from kaggle_secrets import UserSecretsClient
        os.environ["HF_TOKEN"] = UserSecretsClient().get_secret("HF_TOKEN")
    except Exception:
        pass
from huggingface_hub import HfApi, hf_hub_download

# =============================================================================
# 0. CONFIGURATION
# =============================================================================

DATASET_REPO = os.getenv("OQIM_DATASET_REPO", "shohruhakang89/uzbekvoice-kokoro-gold-private")
MODEL_REPO = os.getenv("OQIM_MODEL_REPO", "shohruhakang89/oqim-stt-conformer-uzbek-private")
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()

WORK_DIR = Path(os.getenv("OQIM_WORK_DIR", "/temp/oqim_stt_v5"))
CACHE_DIR = WORK_DIR / "hf_cache"
SHARD_DIR = WORK_DIR / "shards"
CKPT_DIR = WORK_DIR / "checkpoints"
METRIC_DIR = WORK_DIR / "metrics"
for _p in (WORK_DIR, CACHE_DIR, SHARD_DIR, CKPT_DIR, METRIC_DIR):
    _p.mkdir(parents=True, exist_ok=True)

SAMPLE_RATE = 16_000
N_MELS = 80
N_FFT = 512
WIN_LENGTH = 400
HOP_LENGTH = 160
D_MODEL = 320
N_HEADS = 8
ENC_LAYERS = 8
CONV_KERNEL = 15
DROPOUT = 0.10

MAX_EPOCHS = int(os.getenv("OQIM_MAX_EPOCHS", "50"))
MAX_STEPS = int(os.getenv("OQIM_MAX_STEPS", "100000"))
SAVE_EVERY = int(os.getenv("OQIM_SAVE_EVERY", "500"))
EVAL_EVERY = int(os.getenv("OQIM_EVAL_EVERY", "500"))
WARMUP_STEPS = int(os.getenv("OQIM_WARMUP_STEPS", "500"))
MAX_LR = float(os.getenv("OQIM_MAX_LR", "0.00025"))
MIN_LR = float(os.getenv("OQIM_MIN_LR", "0.00001"))
WEIGHT_DECAY = 0.01
GRAD_ACCUM = max(1, int(os.getenv("OQIM_GRAD_ACCUM", "2")))
GRAD_CLIP = 1.0

MAX_AUDIO_SECONDS = float(os.getenv("OQIM_MAX_AUDIO_SECONDS", "18"))
MIN_AUDIO_SECONDS = 0.25
MAX_TEXT_TOKENS = 240
VALIDATION_MOD = 100              # every 100th raw row is permanently held out
VALIDATION_EXAMPLES = 160
VALIDATION_SHARDS = 4
MAX_BATCH_EXAMPLES = int(os.getenv("OQIM_MAX_BATCH", "12"))
MAX_BATCH_AUDIO_SECONDS = float(os.getenv("OQIM_BATCH_AUDIO_SECONDS", "42"))
PARQUET_READ_BATCH = 64
PREFETCH_BATCHES = 3

INFER_CHUNK_SECONDS = float(os.getenv("OQIM_INFER_CHUNK_SECONDS", "16"))
INFER_OVERLAP_SECONDS = float(os.getenv("OQIM_INFER_OVERLAP_SECONDS", "2.0"))
INFER_BATCH_CHUNKS = int(os.getenv("OQIM_INFER_BATCH_CHUNKS", "8"))

LAST_CKPT = CKPT_DIR / "last.pt"
BEST_CKPT = CKPT_DIR / "best.pt"
LEGACY_CKPT = os.getenv("OQIM_LEGACY_CKPT", "").strip()

SEED = 3407
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

if torch.cuda.is_available():
    DEVICE = torch.device("cuda:0")
    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True
    _gpu_name = torch.cuda.get_device_name(0)
    _bf16 = bool(torch.cuda.is_bf16_supported())
    AMP_DTYPE = torch.bfloat16 if _bf16 else torch.float16
    print(f"[OQIM] CUDA: {_gpu_name} | AMP: {AMP_DTYPE}")
else:
    DEVICE = torch.device("cpu")
    AMP_DTYPE = torch.float32
    print("[OQIM] CUDA topilmadi — CPU rejimi (training ancha sekin bo'ladi).")
    if "OQIM_MAX_BATCH" not in os.environ:
        MAX_BATCH_EXAMPLES = 2
    if "OQIM_BATCH_AUDIO_SECONDS" not in os.environ:
        MAX_BATCH_AUDIO_SECONDS = 12.0

# =============================================================================
# 1. UZBEK NORMALIZATION + LEGACY-COMPATIBLE CHARACTER TOKENIZER
# =============================================================================

APOSTROPHES = "‘’ʻʼ`´ʽʾʿˈˊˋ"
DASHES = "–—―−"

CYRILLIC_TO_LATIN = {
    "а":"a", "б":"b", "в":"v", "г":"g", "ғ":"g'", "д":"d",
    "е":"e", "ё":"yo", "ж":"j", "з":"z", "и":"i", "й":"y",
    "к":"k", "қ":"q", "л":"l", "м":"m", "н":"n", "о":"o",
    "п":"p", "р":"r", "с":"s", "т":"t", "у":"u", "ў":"o'",
    "ф":"f", "х":"x", "ҳ":"h", "ц":"s", "ч":"ch", "ш":"sh",
    "ъ":"'", "ь":"", "э":"e", "ю":"yu", "я":"ya",
}


def normalize_text(text: str) -> str:
    if text is None:
        return ""
    t = unicodedata.normalize("NFC", str(text)).strip().lower()
    for ch in APOSTROPHES:
        t = t.replace(ch, "'")
    for ch in DASHES:
        t = t.replace(ch, "-")
    # Uzbek Cyrillic -> Uzbek Latin (mixed Latin/Cyrillic datasets are normalized consistently).
    t = "".join(CYRILLIC_TO_LATIN.get(ch, ch) for ch in t)
    t = t.replace("…", "...").replace("ё", "yo")
    t = re.sub(r"\s+", " ", t)
    # Preserve common punctuation and digits; remove only non-linguistic control characters.
    t = re.sub(r"[\u0000-\u001f\u007f]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


class UzbekTokenizer:
    """Keeps the original v4 token IDs, then appends missing symbols/digits."""
    def __init__(self):
        self.specials = ["<pad>", "<bos>", "<eos>"]
        # This exact prefix matches v4.9.1's old vocabulary order.
        self.chars = [
            " ", "'", "-", ".", ",", "!", "?", ":", ";",
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "x", "y", "z"
        ]
        self.digraphs = ["o'", "g'", "sh", "ch", "ng"]
        old_prefix = self.specials + self.chars + self.digraphs
        extras = ["w"] + list("0123456789") + ["(", ")", "/", "%", "+", "=", "_", "@", "&", '"']
        self.vocab = old_prefix + [x for x in extras if x not in old_prefix]
        self.stoi = {x: i for i, x in enumerate(self.vocab)}
        self.itos = {i: x for i, x in enumerate(self.vocab)}
        self.pad_id = 0
        self.blank_id = 0
        self.old_vocab_size = len(old_prefix)
        self.match_tokens = sorted(
            [x for x in self.vocab[3:] if x], key=lambda x: (-len(x), x)
        )

    @property
    def vocab_size(self) -> int:
        return len(self.vocab)

    def encode(self, text: str) -> list[int]:
        t = normalize_text(text)
        ids: list[int] = []
        i = 0
        while i < len(t):
            found = None
            for tok in self.match_tokens:
                if t.startswith(tok, i):
                    found = tok
                    break
            if found is not None:
                ids.append(self.stoi[found])
                i += len(found)
                continue
            # Unknown punctuation is converted to a space, never silently merged into a word.
            ch = t[i]
            if ch.isalpha() or ch.isdigit():
                return []
            i += 1
            if not ids or ids[-1] != self.stoi[" "]:
                ids.append(self.stoi[" "])
        while ids and ids[-1] == self.stoi[" "]:
            ids.pop()
        return ids

    def decode(self, ids: Sequence[int]) -> str:
        toks = [self.itos.get(int(i), "") for i in ids if int(i) not in (0, 1, 2)]
        s = "".join(toks)
        s = re.sub(r"\s+([.,!?;:%)])", r"\1", s)
        s = re.sub(r"([(])\s+", r"\1", s)
        s = re.sub(r"([.,!?;:])(?=[^\s])", r"\1 ", s)
        s = re.sub(r"\s+", " ", s).strip()
        # Display casing only. Acoustic labels are lowercased to keep the CTC alphabet compact.
        chars = list(s)
        cap_next = True
        for j, ch in enumerate(chars):
            if cap_next and ch.isalpha():
                chars[j] = ch.upper()
                cap_next = False
            elif cap_next and ch.isalnum():
                cap_next = False
            elif ch in ".!?":
                cap_next = True
        return "".join(chars)


tokenizer = UzbekTokenizer()

# =============================================================================
# 2. AUDIO FEATURE EXTRACTION (MASKED CMVN; NO PAD CONTAMINATION)
# =============================================================================

mel_extractor = torchaudio.transforms.MelSpectrogram(
    sample_rate=SAMPLE_RATE,
    n_fft=N_FFT,
    win_length=WIN_LENGTH,
    hop_length=HOP_LENGTH,
    n_mels=N_MELS,
    power=2.0,
    center=True,
).to(DEVICE)


def subsampled_length(lengths: torch.Tensor) -> torch.Tensor:
    # Two stride-2, kernel-3, padding-1 convolutions produce ceil(ceil(L/2)/2).
    return torch.div(lengths + 3, 4, rounding_mode="floor").clamp_min(1)


@torch.no_grad()
def wav_to_logmel(wavs: torch.Tensor, wav_lens: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
    mel = mel_extractor(wavs)
    mel = torch.log(mel.clamp_min(1e-5))
    mel_lens = torch.div(wav_lens, HOP_LENGTH, rounding_mode="floor") + 1
    mel_lens = mel_lens.clamp(min=1, max=mel.size(-1))
    t = torch.arange(mel.size(-1), device=mel.device).unsqueeze(0)
    valid = (t < mel_lens.unsqueeze(1)).unsqueeze(1)
    valid_f = valid.to(mel.dtype)
    denom = valid_f.sum(dim=-1, keepdim=True).clamp_min(1.0)
    mean = (mel * valid_f).sum(dim=-1, keepdim=True) / denom
    var = (((mel - mean) ** 2) * valid_f).sum(dim=-1, keepdim=True) / denom
    mel = (mel - mean) / torch.sqrt(var.clamp_min(1e-5))
    mel = mel.masked_fill(~valid, 0.0)
    return mel, mel_lens

# =============================================================================
# 3. CTC-ONLY CONFORMER (NO AUTOREGRESSIVE DECODER BOTTLENECK)
# =============================================================================


def sinusoidal_table(max_len: int, d_model: int) -> torch.Tensor:
    pe = torch.zeros(max_len, d_model)
    pos = torch.arange(max_len, dtype=torch.float32).unsqueeze(1)
    div = torch.exp(torch.arange(0, d_model, 2, dtype=torch.float32) * (-math.log(10000.0) / d_model))
    pe[:, 0::2] = torch.sin(pos * div)
    pe[:, 1::2] = torch.cos(pos * div)
    return pe.unsqueeze(0)


class Swish(nn.Module):
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x * torch.sigmoid(x)


class ConvSubsampling4x(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, D_MODEL // 2, kernel_size=3, stride=2, padding=1),
            nn.GELU(),
            nn.Conv2d(D_MODEL // 2, D_MODEL, kernel_size=3, stride=2, padding=1),
            nn.GELU(),
        )
        self.proj = nn.Linear(D_MODEL * (N_MELS // 4), D_MODEL)
        self.pos_emb = nn.Parameter(sinusoidal_table(1024, D_MODEL) * 0.1)

    def forward(self, x: torch.Tensor, x_lens: torch.Tensor):
        b, _, _ = x.shape
        h = self.conv(x.unsqueeze(1))
        _, c, m4, t4 = h.shape
        h = h.permute(0, 3, 1, 2).contiguous().view(b, t4, c * m4)
        h = self.proj(h)
        out_lens = subsampled_length(x_lens).clamp(max=t4)
        if t4 > self.pos_emb.size(1):
            raise RuntimeError(f"Encoder frame count {t4} exceeds positional table {self.pos_emb.size(1)}")
        h = h + self.pos_emb[:, :t4, :]
        pad_mask = torch.arange(t4, device=h.device).unsqueeze(0) >= out_lens.unsqueeze(1)
        h = h.masked_fill(pad_mask.unsqueeze(-1), 0.0)
        return h, out_lens, pad_mask


class ConformerConvModule(nn.Module):
    def __init__(self):
        super().__init__()
        self.norm = nn.LayerNorm(D_MODEL)
        self.pw1 = nn.Conv1d(D_MODEL, 2 * D_MODEL, kernel_size=1)
        self.dw = nn.Conv1d(D_MODEL, D_MODEL, kernel_size=CONV_KERNEL,
                            padding=CONV_KERNEL // 2, groups=D_MODEL)
        # LayerNorm operates per time step; unlike BatchNorm it is not contaminated by padded frames.
        self.bn = nn.LayerNorm(D_MODEL)
        self.act = Swish()
        self.pw2 = nn.Conv1d(D_MODEL, D_MODEL, kernel_size=1)
        self.drop = nn.Dropout(DROPOUT)

    def forward(self, x: torch.Tensor, pad_mask: torch.Tensor) -> torch.Tensor:
        residual = x
        z = self.norm(x).transpose(1, 2)
        z = F.glu(self.pw1(z), dim=1)
        z = self.dw(z).transpose(1, 2)
        z = self.bn(z).transpose(1, 2)
        z = self.act(z)
        z = self.drop(self.pw2(z).transpose(1, 2))
        x = residual + z
        return x.masked_fill(pad_mask.unsqueeze(-1), 0.0)


class FeedForwardModule(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.LayerNorm(D_MODEL),
            nn.Linear(D_MODEL, D_MODEL * 4),
            Swish(),
            nn.Dropout(DROPOUT),
            nn.Linear(D_MODEL * 4, D_MODEL),
            nn.Dropout(DROPOUT),
        )

    def forward(self, x: torch.Tensor, pad_mask: torch.Tensor) -> torch.Tensor:
        x = x + 0.5 * self.net(x)
        return x.masked_fill(pad_mask.unsqueeze(-1), 0.0)


class ConformerBlock(nn.Module):
    def __init__(self):
        super().__init__()
        self.ff1 = FeedForwardModule()
        self.norm_mha = nn.LayerNorm(D_MODEL)
        self.mha = nn.MultiheadAttention(D_MODEL, N_HEADS, dropout=DROPOUT, batch_first=True)
        self.drop_mha = nn.Dropout(DROPOUT)
        self.conv = ConformerConvModule()
        self.ff2 = FeedForwardModule()
        self.norm_out = nn.LayerNorm(D_MODEL)

    def forward(self, x: torch.Tensor, pad_mask: torch.Tensor) -> torch.Tensor:
        x = self.ff1(x, pad_mask)
        z = self.norm_mha(x)
        attn, _ = self.mha(z, z, z, key_padding_mask=pad_mask, need_weights=False)
        x = (x + self.drop_mha(attn)).masked_fill(pad_mask.unsqueeze(-1), 0.0)
        x = self.conv(x, pad_mask)
        x = self.ff2(x, pad_mask)
        return self.norm_out(x).masked_fill(pad_mask.unsqueeze(-1), 0.0)


class OqimSTTCTC(nn.Module):
    def __init__(self):
        super().__init__()
        self.sub = ConvSubsampling4x()
        self.enc_layers = nn.ModuleList([ConformerBlock() for _ in range(ENC_LAYERS)])
        self.ctc_head = nn.Linear(D_MODEL, tokenizer.vocab_size)
        nn.init.zeros_(self.ctc_head.bias)
        with torch.no_grad():
            self.ctc_head.bias[tokenizer.blank_id] = -1.5

    def forward(self, mel: torch.Tensor, mel_lens: torch.Tensor):
        enc, enc_lens, pad_mask = self.sub(mel, mel_lens)
        for layer in self.enc_layers:
            enc = layer(enc, pad_mask)
        return self.ctc_head(enc), enc_lens


# =============================================================================
# 4. AUDIO / PARQUET HELPERS — CURSOR IS A RAW PARQUET ROW OFFSET
# =============================================================================


def resample_audio(wav: np.ndarray, sr: int) -> np.ndarray:
    raw = np.asarray(wav)
    if np.issubdtype(raw.dtype, np.integer):
        peak_i = int(np.max(np.abs(raw))) if raw.size else 0
        if peak_i <= 255:
            scale = 255.0
        elif peak_i <= 32768:
            scale = 32768.0
        elif peak_i <= 2147483648:
            scale = 2147483648.0
        else:
            scale = float(np.iinfo(raw.dtype).max)
        wav = raw.astype(np.float32) / scale
    else:
        wav = raw.astype(np.float32)
    if wav.ndim == 2:
        wav = wav.mean(axis=1)
    elif wav.ndim > 2:
        wav = wav.reshape(-1)
    if sr != SAMPLE_RATE:
        if sr <= 0:
            raise ValueError(f"Invalid sample rate: {sr}")
        g = math.gcd(int(sr), SAMPLE_RATE)
        wav = resample_poly(wav, SAMPLE_RATE // g, int(sr) // g).astype(np.float32)
    if not np.isfinite(wav).all():
        raise ValueError("Audio contains NaN/Inf")
    return np.clip(wav, -1.0, 1.0).astype(np.float32, copy=False)


def extract_audio_cell(value) -> tuple[Optional[np.ndarray], Optional[int]]:
    if isinstance(value, dict):
        raw_bytes = value.get("bytes")
        if raw_bytes:
            arr, sr = sf.read(io.BytesIO(raw_bytes), dtype="float32", always_2d=False)
            if arr.ndim == 2:
                arr = arr.mean(axis=1)
            return arr, int(sr)
        arr = value.get("array")
        if arr is not None:
            sr = int(value.get("sampling_rate", value.get("sample_rate", SAMPLE_RATE)))
            return np.asarray(arr), sr
        path = value.get("path")
        if path and os.path.exists(path):
            arr, sr = sf.read(path, dtype="float32", always_2d=False)
            if arr.ndim == 2:
                arr = arr.mean(axis=1)
            return arr, int(sr)
    elif isinstance(value, (bytes, bytearray, memoryview)):
        arr, sr = sf.read(io.BytesIO(bytes(value)), dtype="float32", always_2d=False)
        if arr.ndim == 2:
            arr = arr.mean(axis=1)
        return arr, int(sr)
    elif isinstance(value, (list, np.ndarray)):
        return np.asarray(value), SAMPLE_RATE
    return None, None


def get_parquet_columns(pf: pq.ParquetFile) -> tuple[str, str]:
    cols = pf.schema_arrow.names
    audio_col = next((x for x in ("audio", "wav", "audio_bytes", "speech") if x in cols), None)
    text_col = next((x for x in ("text", "sentence", "transcript", "normalized_text") if x in cols), None)
    if audio_col is None or text_col is None:
        raise RuntimeError(f"Parquet columns not recognized. Found: {cols}")
    return audio_col, text_col


def ctc_min_frames(ids: Sequence[int]) -> int:
    repeats = sum(1 for i in range(1, len(ids)) if ids[i] == ids[i - 1])
    return len(ids) + repeats


def prepare_sample(audio_cell, text_value) -> Optional[tuple[np.ndarray, list[int]]]:
    if text_value is None:
        return None
    text = normalize_text(str(text_value))
    ids = tokenizer.encode(text)
    if not ids or len(ids) > MAX_TEXT_TOKENS:
        return None
    wav, sr = extract_audio_cell(audio_cell)
    if wav is None or sr is None:
        return None
    wav = resample_audio(wav, sr)
    dur = len(wav) / SAMPLE_RATE
    if dur < MIN_AUDIO_SECONDS or dur > MAX_AUDIO_SECONDS:
        return None
    peak = float(np.max(np.abs(wav))) if wav.size else 0.0
    if peak < 1e-4:
        return None
    mel_len = len(wav) // HOP_LENGTH + 1
    enc_len = (mel_len + 3) // 4
    if ctc_min_frames(ids) > enc_len:
        return None
    return wav, ids


def collate_samples(samples: list[tuple[np.ndarray, list[int]]]):
    if not samples:
        return None
    b = len(samples)
    wav_lens = [len(x[0]) for x in samples]
    max_w = max(wav_lens)
    wavs = np.zeros((b, max_w), dtype=np.float32)
    target_parts = []
    target_lens = []
    audio_seconds = 0.0
    for i, (wav, ids) in enumerate(samples):
        wavs[i, :len(wav)] = wav
        target_parts.extend(ids)
        target_lens.append(len(ids))
        audio_seconds += len(wav) / SAMPLE_RATE
    return (
        torch.from_numpy(wavs),
        torch.tensor(wav_lens, dtype=torch.long),
        torch.tensor(target_parts, dtype=torch.long),
        torch.tensor(target_lens, dtype=torch.long),
        audio_seconds,
        [ids for _, ids in samples],
    )


def iter_parquet_batches(shard_path: str, raw_skip_rows: int = 0,
                         validation_only: bool = False) -> Iterator[tuple[tuple, int]]:
    """Yield (batch, next_raw_row). Cursor is independent of filtering and batch size."""
    pf = pq.ParquetFile(shard_path)
    audio_col, text_col = get_parquet_columns(pf)
    row_base = 0
    buf: list[tuple[np.ndarray, list[int]]] = []
    buf_seconds = 0.0
    for record_batch in pf.iter_batches(batch_size=PARQUET_READ_BATCH, columns=[audio_col, text_col]):
        n = record_batch.num_rows
        if row_base + n <= raw_skip_rows:
            row_base += n
            continue
        a_values = record_batch.column(0).to_pylist()
        t_values = record_batch.column(1).to_pylist()
        first = max(0, raw_skip_rows - row_base)
        for local_i in range(first, n):
            raw_row = row_base + local_i
            is_val = (raw_row % VALIDATION_MOD == 0)
            if is_val != validation_only:
                continue
            try:
                item = prepare_sample(a_values[local_i], t_values[local_i])
            except Exception:
                item = None
            if item is None:
                continue
            buf.append(item)
            buf_seconds += len(item[0]) / SAMPLE_RATE
            if len(buf) >= MAX_BATCH_EXAMPLES or buf_seconds >= MAX_BATCH_AUDIO_SECONDS:
                packed = collate_samples(buf)
                if packed is not None:
                    yield packed, raw_row + 1
                buf = []
                buf_seconds = 0.0
        row_base += n
    if buf:
        packed = collate_samples(buf)
        if packed is not None:
            yield packed, pf.metadata.num_rows


# =============================================================================
# 5. SMALL PREFETCH QUEUE (EXCEPTION PROPAGATION; NO SILENT THREAD FAILURE)
# =============================================================================

class ParquetPrefetcher:
    def __init__(self, shard_path: str, raw_skip_rows: int, max_q: int = PREFETCH_BATCHES):
        self.q: queue.Queue = queue.Queue(maxsize=max_q)
        self.stop_event = threading.Event()
        self.thread = threading.Thread(
            target=self._worker, args=(shard_path, raw_skip_rows), daemon=True
        )
        self.thread.start()

    def _put(self, item):
        while not self.stop_event.is_set():
            try:
                self.q.put(item, timeout=0.25)
                return
            except queue.Full:
                continue

    def _worker(self, path, skip):
        try:
            for item in iter_parquet_batches(path, raw_skip_rows=skip, validation_only=False):
                if self.stop_event.is_set():
                    break
                if not self._put(("data", item)):
                    return
        except Exception as exc:
            self._put(("error", exc))
        finally:
            self._put(("end", None))

    def __iter__(self):
        while True:
            kind, payload = self.q.get()
            if kind == "end":
                break
            if kind == "error":
                raise payload
            yield payload

    def close(self):
        self.stop_event.set()
        self.thread.join(timeout=2.0)


# =============================================================================
# 6. METRICS: REAL CER/WER USING EDIT DISTANCE
# =============================================================================


def edit_distance(a: Sequence, b: Sequence) -> int:
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(current[-1] + 1, previous[j] + 1,
                               previous[j - 1] + (ca != cb)))
        previous = current
    return previous[-1]


def corpus_cer_wer(refs: list[str], hyps: list[str]) -> tuple[float, float]:
    char_err = char_total = word_err = word_total = 0
    for ref, hyp in zip(refs, hyps):
        r = normalize_text(ref)
        h = normalize_text(hyp)
        char_err += edit_distance(list(r), list(h))
        char_total += max(1, len(r))
        # Standard WER tokenization ignores punctuation-only differences.
        rw = re.findall(r"[a-z0-9']+", r)
        hw = re.findall(r"[a-z0-9']+", h)
        word_err += edit_distance(rw, hw)
        word_total += max(1, len(rw))
    return 100.0 * char_err / max(1, char_total), 100.0 * word_err / max(1, word_total)


@torch.inference_mode()
def greedy_decode_batch(logits: torch.Tensor, out_lens: torch.Tensor) -> list[str]:
    pred = logits.argmax(dim=-1)
    outputs = []
    for i in range(pred.size(0)):
        length = int(out_lens[i].item())
        seq = pred[i, :length].tolist()
        collapsed = []
        prev = -1
        for tok in seq:
            if tok != prev and tok != tokenizer.blank_id:
                collapsed.append(tok)
            prev = tok
        outputs.append(tokenizer.decode(collapsed))
    return outputs


def _logadd(a: float, b: float) -> float:
    if a == -math.inf:
        return b
    if b == -math.inf:
        return a
    m = max(a, b)
    return m + math.log(math.exp(a - m) + math.exp(b - m))


def ctc_prefix_beam_decode(logits_1d: torch.Tensor, length: int, beam_size: int = 6,
                            token_top_k: int = 12) -> str:
    """Small-vocabulary CTC prefix beam search; optional slower, often better than greedy."""
    logp = F.log_softmax(logits_1d[:length].float(), dim=-1)
    k = min(token_top_k, logp.size(-1))
    top_values, top_ids = torch.topk(logp, k=k, dim=-1)
    # prefix -> (p_blank, p_non_blank)
    beams: dict[tuple[int, ...], tuple[float, float]] = {(): (0.0, -math.inf)}
    for frame_values, frame_ids in zip(top_values.cpu().tolist(), top_ids.cpu().tolist()):
        next_beams: dict[tuple[int, ...], tuple[float, float]] = {}
        def add(prefix, pb=None, pnb=None):
            old_pb, old_pnb = next_beams.get(prefix, (-math.inf, -math.inf))
            if pb is not None:
                old_pb = _logadd(old_pb, pb)
            if pnb is not None:
                old_pnb = _logadd(old_pnb, pnb)
            next_beams[prefix] = (old_pb, old_pnb)
        for prefix, (pb, pnb) in beams.items():
            total = _logadd(pb, pnb)
            for tok, lp in zip(frame_ids, frame_values):
                if tok == tokenizer.blank_id:
                    add(prefix, pb=total + lp)
                elif prefix and tok == prefix[-1]:
                    # Same label without blank keeps the prefix; after blank it creates a repeated label.
                    add(prefix, pnb=pnb + lp)
                    add(prefix + (tok,), pnb=pb + lp)
                else:
                    add(prefix + (tok,), pnb=total + lp)
        beams = dict(sorted(next_beams.items(),
                            key=lambda kv: _logadd(kv[1][0], kv[1][1]), reverse=True)[:beam_size])
    best = max(beams.items(), key=lambda kv: _logadd(kv[1][0], kv[1][1]))[0]
    return tokenizer.decode(best)


@torch.inference_mode()
def evaluate_model(model: nn.Module, val_samples: list[tuple[np.ndarray, list[int]]]) -> tuple[float, float]:
    if not val_samples:
        return float("nan"), float("nan")
    was_training = model.training
    model.eval()
    refs: list[str] = []
    hyps: list[str] = []
    batch_size = max(1, min(8, MAX_BATCH_EXAMPLES))
    for start in range(0, len(val_samples), batch_size):
        part = val_samples[start:start + batch_size]
        packed = collate_samples(part)
        if packed is None:
            continue
        wavs, wav_lens, _, _, _, target_ids = packed
        wavs = wavs.to(DEVICE)
        wav_lens = wav_lens.to(DEVICE)
        mel, mel_lens = wav_to_logmel(wavs, wav_lens)
        with make_amp_context():
            logits, out_lens = model(mel, mel_lens)
        hyps.extend(greedy_decode_batch(logits.float(), out_lens))
        refs.extend(tokenizer.decode(ids) for ids in target_ids)
    if was_training:
        model.train()
    return corpus_cer_wer(refs, hyps)


def load_validation_samples(shard_paths: list[str], limit: int = VALIDATION_EXAMPLES):
    samples: list[tuple[np.ndarray, list[int]]] = []
    for path in shard_paths:
        for packed, _cursor in iter_parquet_batches(path, raw_skip_rows=0, validation_only=True):
            wavs, wav_lens, _flat, _lens, _secs, id_lists = packed
            for i, ids in enumerate(id_lists):
                n = int(wav_lens[i])
                samples.append((wavs[i, :n].numpy().copy(), ids))
                if len(samples) >= limit:
                    return samples
    return samples

# =============================================================================
# 7. CHECKPOINTS: ATOMIC SAVE + FULL OPTIMIZER/RNG/CURSOR RESTORE
# =============================================================================


def atomic_torch_save(payload: dict, path: Path):
    tmp = path.with_suffix(path.suffix + ".tmp")
    torch.save(payload, tmp)
    with open(tmp, "rb+") as f:
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def get_rng_state() -> dict:
    state = {
        "python": random.getstate(),
        "numpy": np.random.get_state(),
        "torch": torch.get_rng_state(),
    }
    if torch.cuda.is_available():
        state["cuda"] = torch.cuda.get_rng_state_all()
    return state


def set_rng_state(state: Optional[dict]):
    if not state:
        return
    random.setstate(state["python"])
    np.random.set_state(state["numpy"])
    torch.set_rng_state(state["torch"])
    if torch.cuda.is_available() and "cuda" in state:
        torch.cuda.set_rng_state_all(state["cuda"])


def shard_fingerprint(files: list[str]) -> str:
    raw = "\n".join(files).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def load_legacy_encoder(model: nn.Module, legacy_path: str) -> int:
    """Warm-start v4.9.1 encoder/CTC. This is NOT an exact v4->v5 resume."""
    ckpt = torch.load(legacy_path, map_location="cpu", weights_only=False)
    sd = ckpt.get("model", ckpt)
    if isinstance(sd, dict):
        sd = {((k[7:] if k.startswith("module.") else k)): v for k, v in sd.items()}
    target = model.state_dict()
    copied = 0
    with torch.no_grad():
        for key, dst in target.items():
            if key.startswith("sub.") or key.startswith("enc_layers."):
                src = sd.get(key)
                if src is not None and src.shape == dst.shape:
                    dst.copy_(src.to(dtype=dst.dtype))
                    copied += 1
            elif key in ("ctc_head.weight", "ctc_head.bias"):
                src = sd.get(key)
                if src is not None and src.ndim == dst.ndim:
                    n = min(src.shape[0], dst.shape[0])
                    if src.shape[1:] == dst.shape[1:]:
                        dst[:n].copy_(src[:n].to(dtype=dst.dtype))
                        copied += 1
        model.load_state_dict(target, strict=True)
    print(f"[OQIM] v4 legacy warm-start: {copied} tensor(lar) ko'chirildi. Optimizer/step 0 dan boshlanadi.")
    return copied


def make_checkpoint(model, optimizer, scaler, step, epoch, shard_idx, row_offset,
                    total_samples, best_wer, shard_files, metrics_history):
    return {
        "format_version": 5,
        "step": int(step),
        "epoch": int(epoch),
        "shard_idx": int(shard_idx),
        "shard_row_offset": int(row_offset),  # RAW Parquet row offset
        "total_samples_seen": int(total_samples),
        "best_wer": float(best_wer),
        "dataset_repo": DATASET_REPO,
        "shard_files": list(shard_files),
        "shard_fingerprint": shard_fingerprint(shard_files),
        "vocab": list(tokenizer.vocab),
        "model": model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "scaler": scaler.state_dict() if scaler is not None else None,
        "rng": get_rng_state(),
        "metrics_history": metrics_history[-200:],
        "config": {
            "sample_rate": SAMPLE_RATE, "n_mels": N_MELS, "d_model": D_MODEL,
            "heads": N_HEADS, "encoder_layers": ENC_LAYERS, "kernel": CONV_KERNEL,
        },
    }


def restore_v5_checkpoint(path: Path, model, optimizer, scaler, expected_files: list[str]):
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    if not isinstance(ckpt, dict) or ckpt.get("format_version") != 5:
        return None
    if ckpt.get("vocab") != list(tokenizer.vocab):
        raise RuntimeError("Checkpoint tokenizer/vocab hozirgi kod bilan mos emas.")
    if ckpt.get("shard_fingerprint") != shard_fingerprint(expected_files):
        raise RuntimeError("Dataset shard ro'yxati o'zgargan. Noto'g'ri cursor bilan davom ettirish to'xtatildi.")
    model.load_state_dict(ckpt["model"], strict=True)
    optimizer.load_state_dict(ckpt["optimizer"])
    if scaler is not None and ckpt.get("scaler"):
        scaler.load_state_dict(ckpt["scaler"])
    set_rng_state(ckpt.get("rng"))
    state = {
        "step": int(ckpt["step"]), "epoch": int(ckpt["epoch"]),
        "shard_idx": int(ckpt["shard_idx"]),
        "row_offset": int(ckpt["shard_row_offset"]),
        "total_samples": int(ckpt.get("total_samples_seen", 0)),
        "best_wer": float(ckpt.get("best_wer", float("inf"))),
        "metrics_history": list(ckpt.get("metrics_history", [])),
    }
    if not 0 <= state["shard_idx"] <= len(expected_files):
        raise RuntimeError("Checkpoint shard cursor diapazondan tashqarida.")
    return state


class HubUploadWorker:
    """Single writer; every queued snapshot has an immutable filename."""
    def __init__(self, token: str, repo_id: str):
        self.token = token
        self.repo_id = repo_id
        self.q: queue.Queue = queue.Queue(maxsize=2)
        self.status = "Hub upload navbatga tayyor"
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def submit(self, last_snapshot: Path, best_snapshot: Optional[Path] = None):
        self.q.put((str(last_snapshot), str(best_snapshot) if best_snapshot else None))

    def _run(self):
        api = HfApi(token=self.token)
        while True:
            item = self.q.get()
            if item is None:
                self.q.task_done()
                break
            last_path, best_path = item
            try:
                api.upload_file(path_or_fileobj=last_path, path_in_repo="checkpoints/last.pt",
                                repo_id=self.repo_id, repo_type="model", commit_message="OQIM-STT v5 last checkpoint")
                if best_path:
                    api.upload_file(path_or_fileobj=best_path, path_in_repo="checkpoints/best.pt",
                                    repo_id=self.repo_id, repo_type="model", commit_message="OQIM-STT v5 best checkpoint")
                self.status = f"Hub OK: {Path(last_path).name}"
            except Exception as exc:
                self.status = f"Hub upload xatosi: {type(exc).__name__}: {exc}"
            finally:
                for p in (last_path, best_path):
                    if p and os.path.exists(p):
                        try:
                            os.remove(p)
                        except OSError:
                            pass
                self.q.task_done()

    def close(self):
        # Upload is best-effort; local atomic checkpoints remain safe if the network stalls.
        try:
            self.q.put(None, timeout=1.0)
        except queue.Full:
            self.status = "Hub upload queue pending; local checkpoint saved"
        self.thread.join(timeout=8.0)

# =============================================================================
# 8. HF DATASET DISCOVERY / DOWNLOAD
# =============================================================================


def get_dataset_shards(api: HfApi) -> list[str]:
    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN topilmadi. Kaggle Secrets/Environment orqali yangi token bering.")
    files = api.list_repo_files(repo_id=DATASET_REPO, repo_type="dataset")
    shards = sorted(x for x in files if x.startswith("data/gold-") and x.endswith(".parquet"))
    if not shards:
        shards = sorted(x for x in files if x.endswith(".parquet"))
    if not shards:
        raise RuntimeError(f"Dataset repo ichida Parquet topilmadi: {DATASET_REPO}")
    return shards


def download_shard(api: HfApi, rel_path: str) -> str:
    # local_dir keeps only explicitly managed shard files; cache_dir would silently accumulate
    # every downloaded multi-GB shard and eventually fill the workspace disk.
    local = SHARD_DIR / rel_path
    local.parent.mkdir(parents=True, exist_ok=True)
    if local.exists() and local.stat().st_size > 1_000_000:
        return str(local)
    return hf_hub_download(repo_id=DATASET_REPO, filename=rel_path, repo_type="dataset",
                           token=HF_TOKEN, local_dir=str(SHARD_DIR))


def build_val_cache(api: HfApi, shards: list[str]):
    cache_file = WORK_DIR / "validation_v5.pt"
    fp = shard_fingerprint(shards)
    if cache_file.exists():
        try:
            saved = torch.load(cache_file, map_location="cpu", weights_only=False)
            if saved.get("fingerprint") == fp and saved.get("vocab") == list(tokenizer.vocab):
                return saved["samples"]
        except Exception:
            pass
    samples = []
    for rel in shards[:VALIDATION_SHARDS]:
        path = download_shard(api, rel)
        for packed, _ in iter_parquet_batches(path, raw_skip_rows=0, validation_only=True):
            wavs, wav_lens, _flat, _lens, _secs, id_lists = packed
            for i, ids in enumerate(id_lists):
                n = int(wav_lens[i])
                samples.append((wavs[i, :n].numpy().copy(), ids))
                if len(samples) >= VALIDATION_EXAMPLES:
                    break
            if len(samples) >= VALIDATION_EXAMPLES:
                break
        if len(samples) >= VALIDATION_EXAMPLES:
            break
    if not samples:
        raise RuntimeError("Validation uchun sample topilmadi. Dataset transcript/audio ustunlarini tekshiring.")
    atomic_torch_save({"fingerprint": fp, "vocab": list(tokenizer.vocab), "samples": samples}, cache_file)
    return samples

# =============================================================================
# 9. TRAINING LOOP
# =============================================================================


def learning_rate(step: int) -> float:
    if step < WARMUP_STEPS:
        return MAX_LR * (step + 1) / max(1, WARMUP_STEPS)
    progress = min(1.0, (step - WARMUP_STEPS) / max(1, MAX_STEPS - WARMUP_STEPS))
    return MIN_LR + 0.5 * (MAX_LR - MIN_LR) * (1.0 + math.cos(math.pi * progress))


def make_amp_context():
    if DEVICE.type == "cuda":
        return torch.autocast(device_type="cuda", dtype=AMP_DTYPE, enabled=True)
    return nullcontext()


def apply_specaugment(mel: torch.Tensor, mel_lens: torch.Tensor) -> torch.Tensor:
    """Light, length-aware masking; padding stays zero and valid frames only are masked."""
    out = mel.clone()
    batch, n_mels, _ = out.shape
    for i in range(batch):
        # Guard first; this ordering makes accidental line-joining easier to spot.
        if int(mel_lens[i].item()) < 12:
            continue
        length = int(mel_lens[i].item())
        if random.random() < 0.5:
            width = random.randint(1, min(10, max(1, n_mels // 5)))
            start = random.randint(0, max(0, n_mels - width))
            out[i, start:start + width, :length] = 0.0
        if random.random() < 0.5:
            width = random.randint(1, min(32, max(1, length // 5)))
            start = random.randint(0, max(0, length - width))
            out[i, :, start:start + width] = 0.0
    return out


def train():
    print("[OQIM] TRAINING BOSHLANDI — konfiguratsiya va dataset tekshirilmoqda...", flush=True)
    if not HF_TOKEN:
        raise RuntimeError(
            "HF_TOKEN topilmadi. Kaggle > Add-ons > Secrets bo'limida "
            "HF_TOKEN nomli secret yarating va Hugging Face tokenini kiriting."
        )
    print(f"[OQIM] Dataset: {DATASET_REPO}", flush=True)
    print(f"[OQIM] Model repo: {MODEL_REPO}", flush=True)
    print(f"[OQIM] Device: {DEVICE} | batch={MAX_BATCH_EXAMPLES} | grad_accum={GRAD_ACCUM}", flush=True)
    api = HfApi(token=HF_TOKEN)
    print("[OQIM] Dataset shardlari olinmoqda...", flush=True)
    shards = get_dataset_shards(api)
    if not shards:
        raise RuntimeError(f"Dataset repo ichida Parquet shard topilmadi: {DATASET_REPO}")
    print(f"[OQIM] {len(shards)} ta Parquet shard topildi.", flush=True)

    model = OqimSTTCTC().to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=MAX_LR, weight_decay=WEIGHT_DECAY,
                                  betas=(0.9, 0.98), eps=1e-8)
    scaler = torch.amp.GradScaler("cuda", enabled=(DEVICE.type == "cuda" and AMP_DTYPE == torch.float16))
    ctc_loss_fn = nn.CTCLoss(blank=tokenizer.blank_id, reduction="mean", zero_infinity=False)
    train_model = nn.DataParallel(model) if DEVICE.type == "cuda" and torch.cuda.device_count() > 1 else model

    state = {
        "step": 0, "epoch": 0, "shard_idx": 0, "row_offset": 0,
        "total_samples": 0, "best_wer": float("inf"), "metrics_history": [],
    }
    # Try local v5 last, then HF last. Never infer a cursor from training step.
    if LAST_CKPT.exists():
        restored = restore_v5_checkpoint(LAST_CKPT, model, optimizer, scaler, shards)
        if restored:
            state.update(restored)
            print(f"[OQIM] Exact v5 resume: step={state['step']} shard={state['shard_idx']} raw_row={state['row_offset']}")
    elif HF_TOKEN:
        try:
            remote = hf_hub_download(repo_id=MODEL_REPO, filename="checkpoints/last.pt", repo_type="model",
                                     token=HF_TOKEN, cache_dir=str(CACHE_DIR))
            restored = restore_v5_checkpoint(Path(remote), model, optimizer, scaler, shards)
            if restored:
                state.update(restored)
                print(f"[OQIM] HF exact v5 resume: step={state['step']} shard={state['shard_idx']} raw_row={state['row_offset']}")
        except Exception as exc:
            print(f"[OQIM] Remote v5 checkpoint yo'q yoki mos emas: {exc}")

    # v4.9.1 is a warm start only; it cannot provide exact v5 optimizer/cursor resume.
    if state["step"] == 0:
        legacy_path = LEGACY_CKPT
        if legacy_path and Path(legacy_path).exists():
            load_legacy_encoder(model, legacy_path)
        elif LAST_CKPT.exists():
            try:
                load_legacy_encoder(model, str(LAST_CKPT))
            except Exception as exc:
                print(f"[OQIM] Local legacy warm-start o'tkazib yuborildi: {exc}")
        elif HF_TOKEN:
            try:
                old_path = hf_hub_download(repo_id=MODEL_REPO, filename="checkpoints/last.pt",
                                           repo_type="model", token=HF_TOKEN, cache_dir=str(CACHE_DIR))
                old = torch.load(old_path, map_location="cpu", weights_only=False)
                if isinstance(old, dict) and old.get("format_version") != 5 and "model" in old:
                    load_legacy_encoder(model, old_path)
            except Exception as exc:
                print(f"[OQIM] Legacy warm-start o'tkazib yuborildi: {exc}")

    val_samples = build_val_cache(api, shards)
    print(f"[OQIM] Validation: {len(val_samples)} audio. Training rows: har shardda 1/100 holdout.")

    uploader = HubUploadWorker(HF_TOKEN, MODEL_REPO)
    optimizer.zero_grad(set_to_none=True)
    accum_count = 0
    last_log_time = time.time()
    rolling_loss = 0.0
    rolling_n = 0
    stop_reason = "normal"

    def save_now(is_best: bool = False, upload: bool = True):
        payload = make_checkpoint(model, optimizer, scaler, state["step"], state["epoch"],
                                 state["shard_idx"], state["row_offset"], state["total_samples"],
                                 state["best_wer"], shards, state["metrics_history"])
        atomic_torch_save(payload, LAST_CKPT)
        if is_best:
            atomic_torch_save(payload, BEST_CKPT)
        if upload:
            snap_last = CKPT_DIR / f"upload_last_step_{state['step']:09d}.pt"
            shutil.copy2(LAST_CKPT, snap_last)
            snap_best = None
            if is_best:
                snap_best = CKPT_DIR / f"upload_best_step_{state['step']:09d}.pt"
                shutil.copy2(BEST_CKPT, snap_best)
            uploader.submit(snap_last, snap_best)
        print(f"[OQIM] Checkpoint saved: step={state['step']} | shard={state['shard_idx']} row={state['row_offset']} | {uploader.status}")

    try:
        while state["epoch"] < MAX_EPOCHS and state["step"] < MAX_STEPS:
            start_shard = state["shard_idx"]
            for shard_i in range(start_shard, len(shards)):
                state["shard_idx"] = shard_i
                rel = shards[shard_i]
                shard_path = download_shard(api, rel)
                num_rows = pq.ParquetFile(shard_path).metadata.num_rows
                skip = state["row_offset"] if shard_i == start_shard else 0
                if skip > num_rows:
                    raise RuntimeError(f"Checkpoint raw cursor {skip} > shard row count {num_rows}: {rel}")
                print(f"[OQIM] Epoch {state['epoch'] + 1}/{MAX_EPOCHS} | shard {shard_i + 1}/{len(shards)} | raw row {skip}/{num_rows}")
                prefetch = ParquetPrefetcher(shard_path, skip)
                try:
                    for packed, raw_cursor_after in prefetch:
                        wavs, wav_lens, targets, target_lens, audio_seconds, id_lists = packed
                        # Move data and compute valid feature lengths.
                        wavs = wavs.to(DEVICE, non_blocking=True)
                        wav_lens = wav_lens.to(DEVICE, non_blocking=True)
                        targets = targets.to(DEVICE, non_blocking=True)
                        mel, mel_lens = wav_to_logmel(wavs, wav_lens)
                        if state["step"] >= 200:
                            mel = apply_specaugment(mel, mel_lens)
                        optimizer.param_groups[0]["lr"] = learning_rate(state["step"])

                        with make_amp_context():
                            logits, out_lens = train_model(mel, mel_lens)
                            log_probs = F.log_softmax(logits.float(), dim=-1).transpose(0, 1)
                            loss = ctc_loss_fn(log_probs, targets,
                                               out_lens.detach().to("cpu", dtype=torch.long),
                                               target_lens.to("cpu", dtype=torch.long))

                        # A non-finite batch is explicitly skipped and cursor is advanced; it cannot stall training.
                        if not torch.isfinite(loss):
                            # Keep earlier finite micro-batch gradients in the current accumulation.
                            state["row_offset"] = raw_cursor_after
                            print(f"[WARN] Non-finite CTC loss. Batch skipped at raw row {raw_cursor_after}.")
                            continue

                        scaler.scale(loss / GRAD_ACCUM).backward()
                        accum_count += 1
                        state["row_offset"] = raw_cursor_after
                        state["total_samples"] += len(id_lists)
                        rolling_loss += float(loss.detach().item())
                        rolling_n += 1

                        if accum_count >= GRAD_ACCUM:
                            scaler.unscale_(optimizer)
                            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
                            scaler.step(optimizer)
                            scaler.update()
                            optimizer.zero_grad(set_to_none=True)
                            accum_count = 0
                            state["step"] += 1

                            if state["step"] % 10 == 0:
                                now = time.time()
                                dt = max(1e-6, now - last_log_time)
                                avg_loss = rolling_loss / max(1, rolling_n)
                                samples_s = state["total_samples"]
                                vram = torch.cuda.max_memory_allocated() / 1024**3 if DEVICE.type == "cuda" else 0.0
                                print(f"step={state['step']:,} loss={avg_loss:.4f} lr={optimizer.param_groups[0]['lr']:.2e} "
                                      f"rows={state['row_offset']:,} samples={samples_s:,} vram={vram:.2f}GB "
                                      f"hub={uploader.status}")
                                rolling_loss = 0.0
                                rolling_n = 0
                                last_log_time = now

                            if state["step"] % EVAL_EVERY == 0:
                                cer, wer = evaluate_model(model, val_samples)
                                metric = {"step": state["step"], "cer": cer, "wer": wer,
                                          "loss": rolling_loss / max(1, rolling_n)}
                                state["metrics_history"].append(metric)
                                improved = math.isfinite(wer) and wer < state["best_wer"]
                                if improved:
                                    state["best_wer"] = wer
                                print(f"[VAL] step={state['step']} CER={cer:.2f}% WER={wer:.2f}% "
                                      f"best_WER={state['best_wer']:.2f}%")
                                with open(METRIC_DIR / "metrics.jsonl", "a", encoding="utf-8") as f:
                                    f.write(json.dumps(metric, ensure_ascii=False) + "\n")
                                    f.flush()
                                if improved:
                                    save_now(is_best=True)

                            if state["step"] % SAVE_EVERY == 0:
                                save_now(is_best=False, upload=True)
                            elif state["step"] % 100 == 0:
                                save_now(is_best=False, upload=False)

                        if state["step"] >= MAX_STEPS:
                            break
                finally:
                    prefetch.close()

                # If the iterator reached EOF, every raw row in this shard is now accounted for.
                if state["step"] < MAX_STEPS:
                    state["shard_idx"] = shard_i + 1
                    state["row_offset"] = 0
                    # Finish a partial gradient accumulation at the shard boundary.
                    if accum_count:
                        scaler.unscale_(optimizer)
                        correction = GRAD_ACCUM / accum_count
                        for p in model.parameters():
                            if p.grad is not None:
                                p.grad.mul_(correction)
                        torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
                        scaler.step(optimizer)
                        scaler.update()
                        optimizer.zero_grad(set_to_none=True)
                        accum_count = 0
                        state["step"] += 1
                    save_now(is_best=False, upload=False)
                    try:
                        Path(shard_path).unlink(missing_ok=True)
                    except Exception:
                        pass
                if state["step"] >= MAX_STEPS:
                    break
                gc.collect()

            if state["step"] >= MAX_STEPS:
                break
            state["epoch"] += 1
            state["shard_idx"] = 0
            state["row_offset"] = 0
            save_now(is_best=False, upload=False)

        # Persist the exact final cursor even when MAX_STEPS is not a multiple of SAVE_EVERY.
        save_now(is_best=False, upload=True)

    except KeyboardInterrupt:
        stop_reason = "keyboard interrupt"
        print("\n[OQIM] To'xtatish so'raldi. Qisman accumulation yakunlanib, checkpoint saqlanmoqda...")
        if accum_count:
            scaler.unscale_(optimizer)
            correction = GRAD_ACCUM / accum_count
            for p in model.parameters():
                if p.grad is not None:
                    p.grad.mul_(correction)
            torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad(set_to_none=True)
            accum_count = 0
            state["step"] += 1
        save_now(is_best=False)
    finally:
        uploader.close()
        print(f"[OQIM] Training yakunlandi ({stop_reason}). step={state['step']} best_WER={state['best_wer']:.2f}%")

# =============================================================================
# 10. BOUNDED-MEMORY STREAMING INFERENCE — 10-DAY FILE DOES NOT LOAD INTO RAM
# =============================================================================


def iter_ffmpeg_chunks(audio_path: str, start_seconds: float = 0.0):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg topilmadi. Kaggle/Colab'da ffmpeg o'rnating yoki WAV fayl ishlating.")
    chunk_n = int(INFER_CHUNK_SECONDS * SAMPLE_RATE)
    overlap_n = int(INFER_OVERLAP_SECONDS * SAMPLE_RATE)
    stride_n = chunk_n - overlap_n
    if stride_n <= 0:
        raise ValueError("INFER_OVERLAP_SECONDS chunk uzunligidan kichik bo'lishi shart.")
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin",
           "-ss", f"{start_seconds:.6f}", "-i", str(audio_path),
           "-vn", "-ac", "1", "-ar", str(SAMPLE_RATE),
           "-f", "s16le", "-acodec", "pcm_s16le", "pipe:1"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=2**20)
    pending = np.empty(0, dtype=np.float32)
    chunk_index = 0
    try:
        assert proc.stdout is not None
        while True:
            raw = proc.stdout.read(65536)
            if not raw:
                break
            pcm = np.frombuffer(raw[:len(raw) - (len(raw) % 2)], dtype="<i2").astype(np.float32) / 32768.0
            if pcm.size:
                pending = np.concatenate((pending, pcm))
            while pending.size >= chunk_n:
                chunk = pending[:chunk_n].copy()
                start = start_seconds + chunk_index * stride_n / SAMPLE_RATE
                yield chunk, start
                pending = pending[stride_n:].copy()
                chunk_index += 1
        # The remaining buffer contains overlap already seen plus the final unseen tail.
        if pending.size > overlap_n:
            chunk = pending.copy()
            start = start_seconds + chunk_index * stride_n / SAMPLE_RATE
            yield chunk, start
        code = proc.wait()
        if code != 0:
            raise RuntimeError(f"ffmpeg failed with exit code {code}")
    finally:
        if proc.poll() is None:
            proc.kill()
            proc.wait()


@torch.inference_mode()
def transcribe_chunk_batch(model: nn.Module, chunks: list[np.ndarray], beam_size: int = 1) -> list[str]:
    lengths = [len(x) for x in chunks]
    max_len = max(lengths)
    wavs_np = np.zeros((len(chunks), max_len), dtype=np.float32)
    for i, wav in enumerate(chunks):
        wavs_np[i, :len(wav)] = wav
    wavs = torch.from_numpy(wavs_np).to(DEVICE)
    wav_lens = torch.tensor(lengths, dtype=torch.long, device=DEVICE)
    mel, mel_lens = wav_to_logmel(wavs, wav_lens)
    with make_amp_context():
        logits, out_lens = model(mel, mel_lens)
    if beam_size <= 1:
        return greedy_decode_batch(logits.float(), out_lens)
    return [ctc_prefix_beam_decode(logits[i], int(out_lens[i].item()), beam_size=beam_size)
            for i in range(logits.size(0))]


def get_last_jsonl_record(path: Path) -> Optional[dict]:
    if not path.exists() or path.stat().st_size == 0:
        return None
    size = path.stat().st_size
    with open(path, "r+b") as f:
        start = max(0, size - 65536)
        f.seek(start)
        tail = f.read()
        # A crash may leave a partial JSON line. Truncate it before appending on resume.
        if tail and not tail.endswith(b"\n"):
            last_nl = tail.rfind(b"\n")
            truncate_at = start + last_nl + 1 if last_nl >= 0 else start
            f.truncate(truncate_at)
            tail = tail[:last_nl + 1] if last_nl >= 0 else b""
        lines = tail.splitlines()
    for raw in reversed(lines):
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            continue
    return None


def word_key(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", normalize_text(word))


def overlap_trim(previous_tail: list[str], new_words: list[str], max_overlap: int = 20) -> tuple[list[str], list[str]]:
    if not previous_tail or not new_words:
        merged = previous_tail + new_words
        return new_words, merged[-max_overlap:]
    a = [word_key(x) for x in previous_tail]
    b = [word_key(x) for x in new_words]
    best = 0
    for k in range(min(max_overlap, len(a), len(b)), 0, -1):
        if a[-k:] == b[:k] and all(a[-k:]):
            best = k
            break
    # Single boundary word can differ by punctuation; drop only exact lexical duplicates.
    if best == 0 and a and b and a[-1] and a[-1] == b[0]:
        best = 1
    trimmed = new_words[best:]
    updated = (previous_tail + trimmed)[-max_overlap:]
    return trimmed, updated


def rebuild_text_from_jsonl(jsonl_path: Path, txt_path: Path) -> list[str]:
    tail: list[str] = []
    with open(jsonl_path, "r", encoding="utf-8") as src, open(txt_path, "w", encoding="utf-8") as dst:
        first = True
        for line in src:
            try:
                item = json.loads(line)
                words = str(item.get("text", "")).strip().split()
            except Exception:
                continue
            new_words, tail = overlap_trim(tail, words)
            if new_words:
                if not first:
                    dst.write(" ")
                dst.write(" ".join(new_words))
                dst.flush()
                first = False
    return tail


def load_inference_model(checkpoint_path: Optional[str] = None) -> nn.Module:
    path = Path(checkpoint_path) if checkpoint_path else BEST_CKPT
    if not path.exists():
        path = LAST_CKPT
    if not path.exists() and HF_TOKEN:
        remote_name = "checkpoints/best.pt"
        try:
            p = hf_hub_download(repo_id=MODEL_REPO, filename=remote_name, repo_type="model",
                                token=HF_TOKEN, cache_dir=str(CACHE_DIR))
            path = Path(p)
        except Exception:
            p = hf_hub_download(repo_id=MODEL_REPO, filename="checkpoints/last.pt", repo_type="model",
                                token=HF_TOKEN, cache_dir=str(CACHE_DIR))
            path = Path(p)
    if not path.exists():
        raise FileNotFoundError(f"Model checkpoint topilmadi: {path}")
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    if ckpt.get("format_version") != 5:
        raise RuntimeError("Bu inference kodi v5 CTC checkpoint talab qiladi. v4.9.1 uchun avval v5 warm-start training kerak.")
    if ckpt.get("vocab") != list(tokenizer.vocab):
        raise RuntimeError("Checkpoint vocab va kod vocab mos emas.")
    model = OqimSTTCTC().to(DEVICE)
    model.load_state_dict(ckpt["model"], strict=True)
    model.eval()
    print(f"[OQIM] Model loaded: {path} | step={ckpt['step']} | best WER={ckpt['best_wer']:.2f}%")
    return model


def transcribe_file_streaming(audio_path: str, output_txt: Optional[str] = None,
                              checkpoint_path: Optional[str] = None, resume: bool = True,
                              max_chunks: Optional[int] = None):
    audio_path = str(Path(audio_path).expanduser().resolve())
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(audio_path)
    if output_txt is None:
        output_txt = str(Path(audio_path).with_suffix("")) + ".oqim.txt"
    txt_path = Path(output_txt)
    jsonl_path = txt_path.with_suffix(txt_path.suffix + ".chunks.jsonl")
    done_path = txt_path.with_suffix(txt_path.suffix + ".done")
    stride = INFER_CHUNK_SECONDS - INFER_OVERLAP_SECONDS
    if stride <= 0:
        raise ValueError("Chunk overlap must be shorter than chunk duration")
    source_stat = os.stat(audio_path)
    source_fingerprint = hashlib.sha256(f"{audio_path}|{source_stat.st_size}|{source_stat.st_mtime_ns}".encode()).hexdigest()
    last = get_last_jsonl_record(jsonl_path) if resume else None
    if last and last.get("source_fingerprint") != source_fingerprint:
        raise RuntimeError("Bu JSONL boshqa audio faylga tegishli. Noto'g'ri resume oldini olish uchun to'xtatildi.")
    if done_path.exists() and resume:
        if last is None:
            raise RuntimeError(".done mavjud, lekin chunks JSONL topilmadi; xavfsiz resume to'xtatildi.")
        print(f"[OQIM] Oldingi transkripsiya tugallangan: {txt_path}")
        return str(txt_path)

    model = load_inference_model(checkpoint_path)
    start_at = 0.0
    if last:
        start_at = float(last["start_sec"]) + stride
        print(f"[OQIM] Inference resume: next audio time={start_at:.2f}s")
    elif not resume and jsonl_path.exists():
        jsonl_path.unlink()

    if not resume:
        if jsonl_path.exists():
            jsonl_path.unlink()
        if done_path.exists():
            done_path.unlink()
    if jsonl_path.exists() and resume:
        previous_tail = rebuild_text_from_jsonl(jsonl_path, txt_path)
    else:
        previous_tail = []
        txt_path.write_text("", encoding="utf-8")
    mode = "a" if (resume and jsonl_path.exists()) else "w"
    chunk_batch: list[np.ndarray] = []
    meta_batch: list[tuple[float, float]] = []
    started = time.time()
    processed = 0
    total_audio_sec = 0.0

    def flush_batch(f, text_file):
        nonlocal processed, total_audio_sec, previous_tail
        if not chunk_batch:
            return
        texts = transcribe_chunk_batch(model, chunk_batch, beam_size=int(os.getenv("OQIM_BEAM_SIZE", "1")))
        for (wav, (start_sec, end_sec)), text in zip(zip(chunk_batch, meta_batch), texts):
            item = {
                "chunk_id": int(round(start_sec / stride)) if stride else processed,
                "source_fingerprint": source_fingerprint,
                "start_sec": round(start_sec, 3),
                "end_sec": round(end_sec, 3),
                "text": text,
            }
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())
            new_words, previous_tail = overlap_trim(previous_tail, text.split())
            if new_words:
                if text_file.tell() > 0:
                    text_file.write(" ")
                text_file.write(" ".join(new_words))
                text_file.flush()
                os.fsync(text_file.fileno())
            processed += 1
            unique_audio = max(0.0, end_sec - start_sec - (INFER_OVERLAP_SECONDS if start_sec > 0 else 0.0))
            total_audio_sec += unique_audio
        chunk_batch.clear()
        meta_batch.clear()
        if processed % 10 == 0:
            elapsed = max(1e-6, time.time() - started)
            print(f"[OQIM] chunks={processed} | RTF={total_audio_sec / elapsed:.2f}x | "
                  f"audio={total_audio_sec / 3600:.2f}h | RAM-bounded | elapsed={elapsed / 60:.1f}min")

    with open(jsonl_path, mode, encoding="utf-8") as out, open(txt_path, "a", encoding="utf-8") as text_out:
        for wav, start_sec in iter_ffmpeg_chunks(audio_path, start_seconds=start_at):
            chunk_batch.append(wav)
            meta_batch.append((start_sec, start_sec + len(wav) / SAMPLE_RATE))
            if len(chunk_batch) >= INFER_BATCH_CHUNKS:
                flush_batch(out, text_out)
            if max_chunks is not None and processed + len(chunk_batch) >= max_chunks:
                break
        flush_batch(out, text_out)

    # Rebuild once from the durable JSONL journal; it is the source of truth after an interruption.
    rebuild_text_from_jsonl(jsonl_path, txt_path)
    if max_chunks is None:
        done_path.write_text("completed\n", encoding="utf-8")
    elapsed = max(1e-6, time.time() - started)
    print(f"[OQIM] Yakun: {txt_path}\n[OQIM] Chunk JSONL: {jsonl_path}\n"
          f"[OQIM] Inference throughput: {total_audio_sec / elapsed:.2f}x real-time")
    return str(txt_path)

# =============================================================================
# 11. COMMAND LINE
# =============================================================================


def main(argv=None):
    # A notebook kernel adds its own JSON connection file to sys.argv.
    # If main() is called from a notebook, never parse those kernel arguments.
    if argv is None and ("ipykernel" in sys.modules or "google.colab" in sys.modules):
        print("[OQIM] Notebook muhiti aniqlandi. CLI ishga tushirilmadi.")
        print("[OQIM] Trening uchun alohida katakda train() ni chaqiring.")
        print("[OQIM] Audio uchun transcribe_file_streaming(AUDIO_PATH) ni chaqiring.")
        return

    parser = argparse.ArgumentParser(description="OQIM-STT v5.0")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("train")
    p_inf = sub.add_parser("transcribe")
    p_inf.add_argument("audio")
    p_inf.add_argument("--output", default=None)
    p_inf.add_argument("--checkpoint", default=None)
    p_inf.add_argument("--no-resume", action="store_true")
    args = parser.parse_args(argv)

    if args.cmd == "train":
        train()
    elif args.cmd == "transcribe":
        transcribe_file_streaming(
            args.audio,
            output_txt=args.output,
            checkpoint_path=args.checkpoint,
            resume=not args.no_resume,
        )


# Entry point:
# - Terminal: use python oqim_stt_v5.py train / transcribe ...
# - Kaggle/Colab: executing this file starts training by default.
#   Set OQIM_AUTO_TRAIN=0 to load definitions only.
if __name__ == "__main__":
    _in_notebook = "ipykernel" in sys.modules or "google.colab" in sys.modules
    if _in_notebook:
        _auto_train = os.getenv("OQIM_AUTO_TRAIN", "1").strip().lower()
        if _auto_train not in ("0", "false", "no", "off"):
            train()
        else:
            print("[OQIM] Faqat funksiyalar yuklandi. Trening uchun train() ni chaqiring.", flush=True)
    else:
        main()

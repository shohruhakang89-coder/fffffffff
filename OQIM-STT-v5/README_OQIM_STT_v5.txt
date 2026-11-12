# OQIM-STT v5.0

A resumable Uzbek CTC-Conformer training pipeline plus bounded-memory long-audio transcription.

## Deliverables

- `oqim_stt_v5.py` — standalone implementation (`train` / `transcribe`).
- `OQIM_STT_v5_2cell.ipynb` — two-cell notebook. Cell 1 defines the code and starts/resumes training; cell 2 transcribes a long audio file.

## Security — do this first

The Hugging Face token included in the earlier pasted notebook was exposed in plaintext. Revoke that token in Hugging Face settings and create a new one. Do not paste the replacement into source code. In Kaggle, create a secret named `HF_TOKEN` with read permission for the dataset repository and write permission for the model repository. The code reads this secret automatically; a normal `HF_TOKEN` environment variable also works.

## Environment

Use a runtime that already has a compatible PyTorch + `torchaudio` pair. Install remaining dependencies when missing:

```bash
pip install pyarrow soundfile scipy huggingface_hub
```

FFmpeg is required for streaming inference (`ffmpeg -version` to check). Do not blindly replace PyTorch/torchaudio with mismatched builds.

## Training

```bash
python oqim_stt_v5.py train
```

Defaults point to the private dataset and model repositories used in the previous version. Override with `OQIM_DATASET_REPO` or `OQIM_MODEL_REPO` as needed.

The first v5 run tries to warm-start compatible encoder and CTC weights from v4.9.1. Because v5 changes the training/inference architecture and token alphabet, v4 optimizer state and its estimated row cursor are **not** presented as an exact v5 resume. From the first v5 checkpoint onward, resume restores model weights, optimizer, AMP scaler, RNG states, epoch, shard index, and the exact raw Parquet row offset.

Every 100th raw Parquet row is held out from training for validation. Up to 160 validation examples are cached from the first four shards. This is a provisional row-wise holdout, not a speaker-disjoint test set; for a trustworthy final WER, use a separate test set with speakers not present in training.

Local atomic checkpoints are stored in `/temp/oqim_stt_v5/checkpoints`. Dataset shards are downloaded to a managed local directory and deleted after a shard finishes, rather than retaining every shard in the Hugging Face cache. Local full checkpoints include optimizer state. Periodic/best snapshots are pushed to the private Hugging Face model repo; the code never changes repo visibility or falls back to public.

Useful environment overrides:

```bash
OQIM_MAX_STEPS=100000
OQIM_SAVE_EVERY=500
OQIM_EVAL_EVERY=500
OQIM_GRAD_ACCUM=2
OQIM_MAX_BATCH=12
OQIM_BATCH_AUDIO_SECONDS=42
```

## Streaming transcription — including multi-day files

```bash
python oqim_stt_v5.py transcribe "/path/to/10-day-audio.wav"
```

Or set `AUDIO_PATH` in notebook cell 2 and run `transcribe_file_streaming(...)`.

FFmpeg decodes to 16 kHz mono and the program keeps only a small rolling audio buffer plus a bounded inference batch (default: 16-second chunks, 2-second overlap, up to 8 chunks per batch). The complete 10-day waveform is never loaded into RAM. Each completed chunk is journaled and flushed to disk before moving on.

Outputs:

- `*.oqim.txt` — assembled transcript, incrementally updated and rebuilt from the journal after resume/completion.
- `*.oqim.txt.chunks.jsonl` — durable per-chunk text and time ranges; this is the resume source of truth.
- `*.oqim.txt.done` — completion marker.

If a kernel stops, rerun the same command with the same source file and `resume=True`. A source fingerprint prevents mixing a different file into an existing transcript. Set `resume=False` for a fresh transcription. The journal and transcript use disk space proportional to text output; RAM use stays bounded. Keep enough disk space for the model checkpoints and output files.

`OQIM_BEAM_SIZE=1` uses fastest greedy CTC decoding. `5` or `8` enables slower CTC prefix-beam search. The reported RTF is approximately unique audio seconds per wall-clock second: `1x` equals real time; `10x` means ten days of audio would take about one day; `100x` would take about 2.4 hours. These are arithmetic examples, not speed guarantees. Actual throughput depends on GPU, batch size, audio codec, and runtime.

## What was corrected

- Correct ceil-based CTC output lengths for the two stride-2 convolutions.
- Padding-aware Mel normalization, so padded frames do not distort each sample's statistics.
- Replaced time-across-batch BatchNorm in the Conformer convolution with per-frame LayerNorm.
- Real gradient accumulation (including partial accumulation at shard boundaries and Ctrl+C).
- Exact cursor measured in **raw Parquet rows**, not accepted audio examples; prefetch read-ahead cannot move the saved cursor.
- Atomic v5 checkpoint with optimizer, scaler, RNG, shard list fingerprint, and raw row cursor.
- Single upload worker with immutable snapshot filenames; no concurrent uploads from a shared mutable `last.pt` path.
- No automatic public-repository fallback.
- CTC-only inference removes the repeated autoregressive Transformer decoder loop; optional CTC beam search is available.
- FFmpeg chunk streaming, durable JSONL chunk journal, restart/resume, and incremental transcript writing.

## Honest limitations

No STT can guarantee 100%/“1000%” accuracy for every speaker, accent, noise condition, or recording. This code is syntax-checked and smoke-tested for tokenizer behavior, model forward/length shapes, checkpoint round-trip, FFmpeg chunking, and interrupted inference resume using a dummy model. A full training epoch against the user's private dataset and GPU could not be run in this environment because the private dataset credentials/runtime are not available here. Confirm actual Parquet schema compatibility, GPU memory headroom, validation CER/WER trend, and measured RTF in the target Kaggle/Colab runtime before processing all ten days.
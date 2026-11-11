# ============================================================================
# UZBEKISTAN MAP PRO v2 — SATELLITE + SEARCH + GPS + DRAW TEST
# Kaggle CPU | Sentinel-2 COG | MapLibre GL | OpenFreeMap | Photon | Flask
# Bitta Kaggle Cell: ushbu faylning HAMMA kodini bitta cell'ga joylang.
# ============================================================================

import os
import sys
import time
import re
import socket
import threading
import subprocess
import importlib.util
from collections import OrderedDict
from functools import lru_cache
from io import BytesIO

# 1) Kutubxonalarni o'rnatish — importdan OLDIN
PACKAGES = {
    "numpy": "numpy",
    "requests": "requests",
    "rasterio": "rasterio",
    "mercantile": "mercantile",
    "PIL": "pillow",
    "flask": "flask",
    "waitress": "waitress",
}

for module_name, package_name in PACKAGES.items():
    if importlib.util.find_spec(module_name) is None:
        print(f"O'rnatilmoqda: {package_name}")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q", package_name
        ])

# GDAL / Rasterio sozlamalari
os.environ["GDAL_DISABLE_READDIR_ON_OPEN"] = "EMPTY_DIR"
os.environ["CPL_VSIL_CURL_ALLOWED_EXTENSIONS"] = ".tif"
os.environ["GDAL_HTTP_MULTIRANGE"] = "YES"
os.environ["GDAL_HTTP_MERGE_CONSECUTIVE_RANGES"] = "YES"
os.environ["GDAL_HTTP_MAX_RETRY"] = "3"
os.environ["GDAL_HTTP_RETRY_DELAY"] = "1"
os.environ["GDAL_CACHEMAX"] = "256"
os.environ["VSI_CACHE"] = "TRUE"
os.environ["VSI_CACHE_SIZE"] = "1048576"

import numpy as np
import requests
import mercantile
import rasterio

from PIL import Image
from flask import Flask, Response, jsonify
from waitress import serve
from rasterio.vrt import WarpedVRT
from rasterio.transform import from_bounds
from rasterio.enums import Resampling
from rasterio.warp import transform_bounds

print("1/8 — Kutubxonalar tayyor")

# 2) Dataset sozlamalari
COLLECTION = "sentinel2-yearly-mosaics-v7"
STAC_URL = f"https://stac.earthgenome.org/collections/{COLLECTION}/items"
IMAGE_BASE = "https://data.source.coop/earthgenome/earthindeximagery-v7"
UZ_BBOX = [55.9, 37.1, 73.2, 45.6]
TILE_SIZE = 256
MAX_TILE_ZOOM = 14  # Sentinel-2 10m tasviri uchun serverdagi maksimal haqiqiy zoom
MAX_TILE_CACHE = 512

# HTTP sessiya va retry
session = requests.Session()
session.headers.update({"User-Agent": "UzbekistanMapPro/2.0"})
try:
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    retry = Retry(
        total=3,
        connect=3,
        read=2,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=24, pool_maxsize=24)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
except Exception:
    pass

# 3) STAC'dan tasvir manbalarini olish
print("2/8 — Sentinel-2 manbalari olinmoqda...")
response = session.get(
    STAC_URL,
    params={"bbox": ",".join(map(str, UZ_BBOX)), "limit": 1000},
    timeout=(20, 120),
)
response.raise_for_status()
page_data = response.json()
features = list(page_data.get("features", []))
next_url = next(
    (link.get("href") for link in page_data.get("links", []) if link.get("rel") == "next"),
    None,
)

page_count = 1
while next_url:
    page_response = session.get(next_url, timeout=(20, 120))
    page_response.raise_for_status()
    page_data = page_response.json()
    features.extend(page_data.get("features", []))
    next_url = next(
        (link.get("href") for link in page_data.get("links", []) if link.get("rel") == "next"),
        None,
    )
    page_count += 1
    if page_count > 50:
        raise RuntimeError("STAC pagination xavfsizlik limiti oshdi.")

ITEMS = []
for feature in features:
    item_id = feature.get("id")
    bbox = feature.get("bbox")
    if not item_id or not bbox or len(bbox) < 4:
        continue
    if "TCI" not in feature.get("assets", {}):
        continue
    try:
        bbox = [float(v) for v in bbox[:4]]
    except (TypeError, ValueError):
        continue
    ITEMS.append({
        "id": item_id,
        "bbox": bbox,
        "date": feature.get("properties", {}).get("datetime", ""),
        "url": f"{IMAGE_BASE}/{item_id}/TCI.tif",
    })

ITEMS.sort(key=lambda item: item["date"], reverse=True)
if not ITEMS:
    raise RuntimeError("Sentinel-2 TCI tasvirlari topilmadi.")

print(f"   {len(ITEMS)} ta manba tayyor.")

# 4) COG manbalari va tile cache
# Har bir Waitress worker thread o'zining rasterio handle cache'iga ega.
# Bu bitta global lock sababli barcha tile renderlarining navbatga turishini kamaytiradi.
SOURCE_LOCAL = threading.local()
SOURCE_CACHE_PER_THREAD = 8

def get_source(url):
    cache = getattr(SOURCE_LOCAL, "cache", None)
    if cache is None:
        cache = OrderedDict()
        SOURCE_LOCAL.cache = cache
    src = cache.get(url)
    if src is not None and not src.closed:
        cache.move_to_end(url)
        return src
    src = rasterio.open("/vsicurl/" + url)
    cache[url] = src
    cache.move_to_end(url)
    while len(cache) > SOURCE_CACHE_PER_THREAD:
        _, old_src = cache.popitem(last=False)
        try:
            old_src.close()
        except Exception:
            pass
    return src


def intersects(a, b):
    return not (a[2] <= b[0] or a[0] >= b[2] or a[3] <= b[1] or a[1] >= b[3])


def transparent_png():
    arr = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)
    output = BytesIO()
    Image.fromarray(arr).save(output, format="PNG", compress_level=1)
    return output.getvalue()


def render_tile(z, x, y):
    if z < 0 or z > MAX_TILE_ZOOM:
        return None
    n = 1 << z
    if x < 0 or y < 0 or x >= n or y >= n:
        return None

    bounds = mercantile.xy_bounds(x, y, zoom=z)
    west, south, east, north = bounds.left, bounds.bottom, bounds.right, bounds.top
    tile_bbox = transform_bounds(
        "EPSG:3857", "EPSG:4326", west, south, east, north, densify_pts=12
    )
    dst_transform = from_bounds(west, south, east, north, TILE_SIZE, TILE_SIZE)

    canvas = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)
    filled = np.zeros((TILE_SIZE, TILE_SIZE), dtype=bool)
    matching = [item for item in ITEMS if intersects(item["bbox"], tile_bbox)]

    for item in matching:
        try:
            src = get_source(item["url"])
            if src.count < 3:
                continue
            with WarpedVRT(
                src,
                crs="EPSG:3857",
                transform=dst_transform,
                width=TILE_SIZE,
                height=TILE_SIZE,
                resampling=Resampling.bilinear,
            ) as vrt:
                rgb_data = vrt.read(indexes=[1, 2, 3], masked=True)
                invalid = np.ma.getmaskarray(rgb_data).any(axis=0)
                valid = (~invalid) & (vrt.dataset_mask() > 0) & (~filled)
                if not np.any(valid):
                    continue
                rgb = np.moveaxis(rgb_data.filled(0), 0, -1)
                rgb = np.clip(rgb, 0, 255).astype(np.uint8)
                canvas[valid, :3] = rgb[valid]
                canvas[valid, 3] = 255
                filled[valid] = True
            if filled.all():
                break
        except Exception as exc:
            print(f"[COG] {item['id']}: {str(exc)[:120]}")

    output = BytesIO()
    Image.fromarray(canvas).save(output, format="PNG", compress_level=2)
    return output.getvalue()


# LRU + bir xil tile uchun bir vaqtdagi takroriy hisoblashni birlashtirish
_TILE_CACHE = OrderedDict()
_TILE_INFLIGHT = {}
_TILE_CACHE_LOCK = threading.RLock()


def cached_tile(z, x, y):
    key = (int(z), int(x), int(y))
    owner = False
    with _TILE_CACHE_LOCK:
        cached = _TILE_CACHE.get(key)
        if cached is not None:
            _TILE_CACHE.move_to_end(key)
            return cached
        event = _TILE_INFLIGHT.get(key)
        if event is None:
            event = threading.Event()
            _TILE_INFLIGHT[key] = event
            owner = True

    if not owner:
        event.wait(timeout=120)
        with _TILE_CACHE_LOCK:
            cached = _TILE_CACHE.get(key)
            if cached is not None:
                _TILE_CACHE.move_to_end(key)
            return cached

    result = None
    try:
        result = render_tile(*key)
        return result
    finally:
        with _TILE_CACHE_LOCK:
            if result is not None:
                _TILE_CACHE[key] = result
                _TILE_CACHE.move_to_end(key)
                while len(_TILE_CACHE) > MAX_TILE_CACHE:
                    _TILE_CACHE.popitem(last=False)
            finished = _TILE_INFLIGHT.pop(key, None)
            if finished:
                finished.set()


print("3/8 — Satellite tile renderer tayyor")

# 5) Web ilova
app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

HTML = r'''<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#101b2a">
<title>Uzbekistan Map Pro</title>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css">
<script src="https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js"></script>
<style>
:root{
  --ink:#172638;--muted:#718096;--line:rgba(20,42,65,.12);
  --blue:#2678e8;--blue2:#165fc6;--surface:rgba(255,255,255,.96);
  --shadow:0 12px 36px rgba(15,35,58,.18);--radius:15px;
}
*{box-sizing:border-box}
html,body,#map{width:100%;height:100%;margin:0}
body{overflow:hidden;background:#dce5e9;color:var(--ink);font-family:Inter,"Segoe UI",system-ui,Arial,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
#map{position:absolute;inset:0}
button,input{font:inherit}
button{ -webkit-tap-highlight-color:transparent }
.topbar{position:absolute;z-index:8;top:14px;left:14px;display:flex;align-items:center;gap:12px;max-width:min(610px,calc(100vw - 92px))}
.brand{display:flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid var(--line);border-radius:13px;background:var(--surface);box-shadow:var(--shadow);white-space:nowrap}
.brand-mark{display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:linear-gradient(145deg,#287fe9,#1bb7a2);color:#fff;font-size:14px;font-weight:700}
.brand-name{font-size:13px;font-weight:650;letter-spacing:.15px;color:#183047}
.brand-sub{font-size:9px;font-weight:450;color:#7d8c9a;margin-top:1px}
.searchbox{position:relative;display:flex;align-items:center;min-width:0;width:min(390px,calc(100vw - 200px));height:48px;padding:0 6px 0 14px;border:1px solid var(--line);border-radius:13px;background:var(--surface);box-shadow:var(--shadow)}
.search-icon{color:#708297;font-size:18px;margin-right:8px}
#place-search{min-width:0;flex:1;height:42px;border:0;outline:0;background:transparent;color:#172638;font-size:13px;font-weight:400}
#place-search::placeholder{color:#91a0ad}
.search-go{width:36px;height:36px;border:0;border-radius:10px;color:#fff;background:var(--blue);cursor:pointer;font-size:17px}
.search-go:hover{background:var(--blue2)}
#search-results{display:none;position:absolute;z-index:20;top:55px;left:0;width:100%;max-height:min(360px,55vh);overflow:auto;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:var(--shadow)}
.result{padding:11px 13px;border-bottom:1px solid #edf1f5;cursor:pointer}
.result:last-child{border-bottom:0}.result:hover{background:#f3f8ff}
.result-name{font-size:12px;font-weight:600;color:#1d3146}.result-address{margin-top:3px;font-size:10px;line-height:1.4;color:#7b8b99;font-weight:400}.result-type{margin-top:5px;font-size:9px;color:#2775d5;font-weight:500}
.right-tools{position:absolute;z-index:9;top:14px;right:14px;display:flex;flex-direction:column;gap:9px}
.tool-btn{display:grid;place-items:center;width:44px;height:44px;border:1px solid rgba(25,48,71,.12);border-radius:13px;background:var(--surface);color:#30465c;box-shadow:var(--shadow);cursor:pointer;transition:transform .15s,background .15s,border-color .15s}
.tool-btn:hover{transform:translateY(-1px);background:#fff;border-color:rgba(38,120,232,.35)}
.tool-btn.active{background:#eaf3ff;color:#1768d2;border-color:#8ebcff}
.tool-btn svg{width:19px;height:19px;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}
.settings{position:absolute;z-index:10;top:14px;right:68px;width:294px;max-height:calc(100vh - 28px);overflow:auto;padding:15px;border:1px solid var(--line);border-radius:17px;background:var(--surface);box-shadow:var(--shadow);transform:translateX(12px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s,transform .18s,visibility .18s}
.settings.open{transform:translateX(0);opacity:1;visibility:visible;pointer-events:auto}
.settings-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #e9eef3}
.settings-title{font-size:14px;font-weight:650;color:#20364b}.settings-sub{font-size:10px;color:#8795a3;margin-top:3px;font-weight:400}
.close-btn{width:29px;height:29px;border:0;border-radius:8px;background:#f0f3f6;color:#5d7082;cursor:pointer;font-size:17px}
.section{margin-top:15px}.section-title{margin-bottom:9px;color:#617487;font-size:10px;font-weight:650;letter-spacing:.65px;text-transform:uppercase}
.mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.mode-btn{padding:9px 5px;border:1px solid #e1e8ef;border-radius:9px;background:#fff;color:#40566a;font-size:10px;font-weight:500;cursor:pointer}
.mode-btn:hover,.mode-btn.active{border-color:#9bc2f5;background:#eef6ff;color:#155fb9}
.slider-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;color:#506477;font-size:11px;font-weight:450}
.slider-val{color:#176bd0;font-size:10px;font-weight:650}
input[type=range]{width:100%;accent-color:#287de5;cursor:pointer}
.quick-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
.quick{padding:9px 8px;border:1px solid #e2e9ef;border-radius:9px;background:#fff;color:#40566a;font-size:10px;font-weight:500;cursor:pointer}
.quick:hover{background:#f1f7ff;border-color:#a7c9f4}
.draw-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.small-action{padding:9px 7px;border:1px solid #dfe7ee;border-radius:9px;background:#fff;color:#40566a;font-size:10px;font-weight:550;cursor:pointer}
.small-action.primary{background:#eaf3ff;border-color:#a8c9f3;color:#155fb9}
.hint{padding:10px 11px;border-radius:10px;background:#f1f7fc;color:#64798b;font-size:10px;line-height:1.55;font-weight:400}
#draw-hint{display:none;position:absolute;z-index:7;left:50%;bottom:28px;transform:translateX(-50%);padding:10px 14px;border:1px solid rgba(255,255,255,.5);border-radius:12px;background:rgba(20,39,58,.90);color:#fff;box-shadow:0 7px 25px rgba(0,0,0,.2);font-size:11px;font-weight:450;white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis}
#toast{position:absolute;z-index:30;left:50%;bottom:25px;transform:translate(-50%,12px);padding:10px 14px;border:1px solid rgba(255,255,255,.22);border-radius:11px;background:rgba(19,37,55,.94);color:#fff;font-size:11px;font-weight:450;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;max-width:calc(100vw - 28px);text-align:center}
#toast.show{opacity:1;transform:translate(-50%,0)}
.maplibregl-ctrl-group{overflow:hidden;border:1px solid rgba(25,48,71,.1)!important;border-radius:11px!important;box-shadow:0 5px 18px rgba(15,35,58,.12)!important}
.maplibregl-ctrl button{width:34px!important;height:34px!important}
.maplibregl-ctrl-scale{border-color:#60778b!important;background:rgba(255,255,255,.86)!important;color:#324a60!important;font-size:10px!important}
.maplibregl-popup-content{padding:10px 12px;border-radius:10px;box-shadow:0 5px 20px rgba(0,0,0,.16);font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:12px}
.maplibregl-popup-close-button{padding:4px 7px;color:#617487}
.user-marker{width:18px;height:18px;border:3px solid #fff;border-radius:50%;background:#1478ed;box-shadow:0 0 0 5px rgba(20,120,237,.22),0 2px 10px rgba(0,0,0,.25)}
.draw-cursor,#map.draw-cursor canvas{cursor:crosshair!important}
.footer-note{margin-top:12px;padding-top:10px;border-top:1px solid #e9eef3;color:#8a98a5;font-size:9px;line-height:1.55;font-weight:400}
@media(max-width:650px){
 .topbar{top:9px;left:9px;right:62px;max-width:none;gap:7px;align-items:stretch;flex-direction:column}
 .brand{align-self:flex-start;padding:7px 10px}.brand-mark{width:23px;height:23px}.brand-name{font-size:12px}
 .searchbox{width:100%;height:44px}.right-tools{top:9px;right:9px;gap:7px}.tool-btn{width:40px;height:40px;border-radius:12px}
 .settings{top:9px;right:56px;width:min(294px,calc(100vw - 72px));max-height:calc(100vh - 18px);padding:13px}
 #draw-hint{bottom:18px;font-size:10px;white-space:normal;text-align:center;width:calc(100vw - 24px)}
}
</style>
</head>
<body>
<div id="map"></div>

<div class="topbar">
  <div class="brand">
    <div class="brand-mark">U</div>
    <div><div class="brand-name">UZ MAP</div><div class="brand-sub">Uzbekistan · Map Pro</div></div>
  </div>
  <div class="searchbox">
    <span class="search-icon">⌕</span>
    <input id="place-search" type="search" placeholder="Shahar, ko‘cha yoki joyni qidiring..." autocomplete="off">
    <button class="search-go" id="search-button" aria-label="Qidirish">⌕</button>
    <div id="search-results"></div>
  </div>
</div>

<div class="right-tools">
  <button class="tool-btn" id="locate-button" title="Meni top" aria-label="Meni top">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="2.1"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
  </button>
  <button class="tool-btn" id="draw-button" title="Hududni sichqoncha bilan chizish" aria-label="Hudud chizish">
    <svg viewBox="0 0 24 24"><path d="M4 19.5 6.2 14 16.8 3.4a2.1 2.1 0 0 1 3 3L9.2 17 4 19.5Z"/><path d="m14.9 5.3 3 3M4 19.5l5.2-2.5"/></svg>
  </button>
  <button class="tool-btn" id="settings-button" title="Sozlamalar" aria-label="Sozlamalar">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.9-1.5 2.6-1.4-.5a7.8 7.8 0 0 1-1.6.9l-.2 1.5h-3l-.2-1.5a7.8 7.8 0 0 1-1.6-.9l-1.4.5-1.5-2.6 1.1-.9a7.6 7.6 0 0 1 0-1.9l-1.1-.9 1.5-2.6 1.4.5a7.8 7.8 0 0 1 1.6-.9l.2-1.5h3l.2 1.5a7.8 7.8 0 0 1 1.6.9l1.4-.5 1.5 2.6-1.1.9a7.6 7.6 0 0 1 0 1.9Z" transform="translate(-1 -1) scale(1.05)"/></svg>
  </button>
</div>

<aside class="settings" id="settings-panel" aria-hidden="true">
  <div class="settings-head">
    <div><div class="settings-title">Xarita sozlamalari</div><div class="settings-sub">Ko‘rinish va test boshqaruvi</div></div>
    <button class="close-btn" id="close-settings" aria-label="Yopish">×</button>
  </div>

  <div class="section">
    <div class="section-title">Xarita rejimi</div>
    <div class="mode-grid">
      <button class="mode-btn active" data-mode="satellite">Satellite</button>
      <button class="mode-btn" data-mode="hybrid">Aralash</button>
      <button class="mode-btn" data-mode="street">Oddiy</button>
    </div>
  </div>

  <div class="section">
    <div class="slider-row"><span>Satellite shaffofligi</span><span class="slider-val" id="opacity-value">100%</span></div>
    <input id="opacity" type="range" min="0" max="100" value="100">
  </div>

  <div class="section">
    <div class="section-title">Kamera</div>
    <div class="mode-grid">
      <button class="mode-btn active" id="two-d-button">2D tepadan</button>
      <button class="mode-btn" id="three-d-button">3D qiya</button>
      <button class="mode-btn" id="north-button">Shimol ↑</button>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Tezkor manzillar</div>
    <div class="quick-grid">
      <button class="quick" data-lon="69.2401" data-lat="41.2995" data-zoom="11">Toshkent</button>
      <button class="quick" data-lon="66.9597" data-lat="39.6542" data-zoom="11">Samarqand</button>
      <button class="quick" data-lon="64.4286" data-lat="39.7681" data-zoom="11">Buxoro</button>
      <button class="quick" data-lon="71.6726" data-lat="40.9983" data-zoom="11">Farg‘ona</button>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Hudud chizish — test</div>
    <div class="hint">“Hudud chizish” tugmasini yoqing. Xarita ustida sichqonchaning chap tugmasini bosib ushlab, shaklni chizing. Tugmani qo‘yib yuborsangiz, hudud rangli poligon bo‘lib hosil bo‘ladi.</div>
    <div class="draw-actions" style="margin-top:8px">
      <button class="small-action primary" id="start-draw">Chizishni boshlash</button>
      <button class="small-action" id="clear-territories">Hammasini tozalash</button>
    </div>
    <div class="hint" id="draw-stats" style="margin-top:8px">Hozircha chizilgan hudud yo‘q.</div>
  </div>

  <div class="footer-note">Tasvir: Sentinel-2 / Earth Genome · Xarita: OpenFreeMap / OpenStreetMap · Qidiruv: Photon. 3D qiya rejim kamerani egadi; bu fotorealistik 3D bino modeli emas.</div>
</aside>

<div id="draw-hint">Sichqoncha chap tugmasini bosib ushlab, hududni chizing. Qo‘yib yuborish — yakunlash.</div>
<div id="toast" role="status"></div>

<script>
(() => {
'use strict';

const UZ_BBOX = '55.9,37.1,73.2,45.6';
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [66.9, 41.0],
  zoom: 5.25,
  minZoom: 3,
  maxZoom: 19,
  pitch: 0,
  bearing: 0,
  attributionControl: true,
  renderWorldCopies: false,
  fadeDuration: 150,
  cooperativeGestures: true
});

map.addControl(new maplibregl.NavigationControl({visualizePitch:true}), 'bottom-right');
map.addControl(new maplibregl.ScaleControl({maxWidth:110,unit:'metric'}), 'bottom-left');
map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

const $ = (id) => document.getElementById(id);
let currentMode = 'satellite';
let searchAbort = null;
let searchTimer = null;
let searchSequence = 0;
let toastTimer = null;
let userMarker = null;
let drawingEnabled = false;
let pointerDrawing = false;
let drawPoints = [];
let drawnFeatures = [];
let lastPointer = null;
let dragPanWasEnabled = true;
let doubleClickWasEnabled = true;

function toast(message, duration=2800) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

function setStatusQuietly() {
  // Xaritadagi har bir tile hodisasida panelni qayta chizmaymiz.
}

function setSatelliteOpacity(value) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  if (map.getLayer('satellite-layer')) {
    map.setPaintProperty('satellite-layer', 'raster-opacity', v / 100);
  }
  $('opacity-value').textContent = `${v}%`;
  $('opacity').value = String(v);
}

function setMapMode(mode) {
  currentMode = mode;
  let opacity = 1;
  if (mode === 'hybrid') opacity = 0.62;
  if (mode === 'street') opacity = 0;
  setSatelliteOpacity(Math.round(opacity * 100));
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function setCameraMode(mode) {
  if (mode === '2d') {
    map.easeTo({pitch:0,bearing:0,duration:650});
  } else if (mode === '3d') {
    map.easeTo({pitch:42,bearing:-10,duration:750});
  } else {
    map.easeTo({bearing:0,duration:450});
  }
  $('two-d-button').classList.toggle('active', mode === '2d');
  $('three-d-button').classList.toggle('active', mode === '3d');
}

function openSettings(force) {
  const panel = $('settings-panel');
  const open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  $('settings-button').classList.toggle('active', open);
}
$('settings-button').addEventListener('click', () => openSettings());
$('close-settings').addEventListener('click', () => openSettings(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { openSettings(false); hideSearchResults(); if (drawingEnabled) stopDrawing(); }});

function hideSearchResults() { $('search-results').style.display = 'none'; }

// Search results safely inserted with textContent (HTML injectiondan himoya)
function renderSearchResults(features) {
  const box = $('search-results');
  box.replaceChildren();
  if (!features || !features.length) {
    const empty = document.createElement('div');
    empty.className = 'result';
    empty.textContent = 'Hech narsa topilmadi. Boshqa nom bilan qidirib ko‘ring.';
    box.appendChild(empty);
    box.style.display = 'block';
    return;
  }

  features.forEach(feature => {
    const p = feature.properties || {};
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return;
    const name = p.name || p.street || p.city || p.locality || 'Nomsiz joy';
    const address = [p.housenumber, p.street, p.district, p.city || p.locality, p.state, p.country]
      .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
    const type = [p.osm_key, p.osm_value || p.type].filter(Boolean).join(' · ');

    const row = document.createElement('div');
    row.className = 'result';
    const title = document.createElement('div');
    title.className = 'result-name';
    title.textContent = name;
    const sub = document.createElement('div');
    sub.className = 'result-address';
    sub.textContent = address || 'Manzil tafsiloti mavjud emas';
    const kind = document.createElement('div');
    kind.className = 'result-type';
    kind.textContent = type;
    row.append(title, sub, kind);
    row.addEventListener('click', () => selectSearchResult(feature, name, address));
    box.appendChild(row);
  });
  box.style.display = 'block';
}

function selectSearchResult(feature, name, address) {
  const coords = feature.geometry.coordinates;
  const lon = Number(coords[0]), lat = Number(coords[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lat) > 85) {
    toast('Bu qidiruv natijasida koordinata xato.');
    return;
  }
  if (userMarker) { userMarker.remove(); userMarker = null; }
  const popup = new maplibregl.Popup({offset:18,closeButton:true})
    .setText(name + (address ? ' — ' + address : ''));
  const markerEl = document.createElement('div');
  markerEl.style.cssText = 'width:13px;height:13px;border:2px solid #fff;border-radius:50%;background:#287fe9;box-shadow:0 1px 8px #0005';
  userMarker = new maplibregl.Marker({element:markerEl,anchor:'center'})
    .setLngLat([lon,lat]).setPopup(popup).addTo(map);

  const extent = feature.properties && feature.properties.extent;
  if (Array.isArray(extent) && extent.length === 4 && extent.every(Number.isFinite)) {
    const sw = [Math.min(extent[0], extent[2]), Math.min(extent[1], extent[3])];
    const ne = [Math.max(extent[0], extent[2]), Math.max(extent[1], extent[3])];
    if (sw[0] !== ne[0] && sw[1] !== ne[1]) {
      map.fitBounds([sw, ne], {padding:70,maxZoom:16,duration:850});
    } else {
      map.flyTo({center:[lon,lat],zoom:16,duration:800});
    }
  } else {
    const layer = feature.properties && feature.properties.type;
    const zoom = ['city','district','state','county'].includes(layer) ? 11 : 16;
    map.flyTo({center:[lon,lat],zoom,duration:800});
  }
  popup.addTo(map);
  hideSearchResults();
}

async function searchPlaces() {
  const query = $('place-search').value.trim();
  if (query.length < 2) { toast('Qidirish uchun kamida 2 ta belgi kiriting.'); return; }
  const box = $('search-results');
  box.replaceChildren();
  const loading = document.createElement('div');
  loading.className = 'result';
  loading.textContent = 'Qidirilmoqda…';
  box.appendChild(loading);
  box.style.display = 'block';

  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();
  const seq = ++searchSequence;

  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '8');
    url.searchParams.set('bbox', UZ_BBOX);
    url.searchParams.set('countrycode', 'UZ');
    url.searchParams.set('lat', String(map.getCenter().lat));
    url.searchParams.set('lon', String(map.getCenter().lng));
    url.searchParams.set('zoom', String(Math.round(map.getZoom())));
    url.searchParams.set('location_bias_scale', '0.25');
    const response = await fetch(url.toString(), {signal:searchAbort.signal,headers:{'Accept':'application/geo+json'}});
    if (!response.ok) throw new Error(`Qidiruv serveri: HTTP ${response.status}`);
    const data = await response.json();
    if (seq !== searchSequence) return;
    renderSearchResults(data.features || []);
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (seq !== searchSequence) return;
    console.warn('Photon search:', err);
    box.replaceChildren();
    const errorEl = document.createElement('div');
    errorEl.className = 'result';
    errorEl.textContent = 'Qidiruv vaqtincha ishlamadi. Internetni tekshirib, qayta urinib ko‘ring.';
    box.appendChild(errorEl);
    box.style.display = 'block';
  }
}

$('search-button').addEventListener('click', searchPlaces);
$('place-search').addEventListener('keydown', e => {
  if (e.key === 'Enter') { clearTimeout(searchTimer); searchPlaces(); }
  if (e.key === 'Escape') hideSearchResults();
});
// Search-as-you-type: public Photon serveriga ortiqcha so'rov yubormaslik uchun debounce.
$('place-search').addEventListener('input', () => {
  clearTimeout(searchTimer);
  const query = $('place-search').value.trim();
  if (query.length < 3) { hideSearchResults(); return; }
  searchTimer = setTimeout(searchPlaces, 650);
});
document.addEventListener('click', e => {
  if (!e.target.closest('.searchbox')) hideSearchResults();
});

// GPS: faqat foydalanuvchi tugmani bosganda so'raladi; koordinata serverga yuborilmaydi.
function locateMe() {
  if (!window.isSecureContext || !navigator.geolocation) {
    toast('Joylashuv uchun HTTPS va brauzer geolokatsiyasi kerak. Cloudflare HTTPS havolasini oching.');
    return;
  }
  $('locate-button').classList.add('active');
  toast('Joylashuvingiz aniqlanmoqda…', 5000);
  navigator.geolocation.getCurrentPosition(position => {
    $('locate-button').classList.remove('active');
    const lon = position.coords.longitude;
    const lat = position.coords.latitude;
    const accuracy = Math.max(10, Number(position.coords.accuracy) || 50);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lat) > 85) {
      toast('Brauzer noto‘g‘ri koordinata qaytardi.');
      return;
    }
    const markerEl = document.createElement('div');
    markerEl.className = 'user-marker';
    if (userMarker) userMarker.remove();
    userMarker = new maplibregl.Marker({element:markerEl,anchor:'center'})
      .setLngLat([lon,lat]).setPopup(new maplibregl.Popup({offset:18}).setText(`Sizning joylashuvingiz · aniqlik ±${Math.round(accuracy)} m`)).addTo(map);
    map.flyTo({center:[lon,lat],zoom:Math.min(17,Math.max(14,map.getZoom())),duration:900});
    toast(`Joylashuv topildi · aniqlik taxminan ${Math.round(accuracy)} metr.`);
  }, error => {
    $('locate-button').classList.remove('active');
    const messages = {
      1:'Joylashuvga ruxsat berilmadi. Brauzer manzil satridan Location ruxsatini yoqing.',
      2:'Joylashuv aniqlanmadi. GPS yoki qurilma joylashuv xizmatini tekshiring.',
      3:'Joylashuv so‘rovi vaqti tugadi. Yana urinib ko‘ring.'
    };
    toast(messages[error.code] || 'Joylashuvni aniqlashda xatolik yuz berdi.');
  }, {enableHighAccuracy:false,timeout:15000,maximumAge:45000});
}
$('locate-button').addEventListener('click', locateMe);

// Draw test: sichqoncha bilan erkin chizilgan chiziqni yopiq poligonga aylantiradi.
function emptyFC() { return {type:'FeatureCollection',features:[]}; }
function updateGeoSource(id, data) {
  const source = map.getSource(id);
  if (source) source.setData(data);
}
function previewDraw() {
  if (drawPoints.length < 2) return;
  const coords = drawPoints.map(p => [p.lng,p.lat]);
  const features = [{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:coords}}];
  if (coords.length >= 3) {
    const ring = coords.concat([[coords[0][0],coords[0][1]]]);
    features.push({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}});
  }
  updateGeoSource('draw-preview-source',{type:'FeatureCollection',features});
}
function updateTerritoryStats() {
  const count = drawnFeatures.length;
  if (!count) { $('draw-stats').textContent = 'Hozircha chizilgan hudud yo‘q.'; return; }
  const total = drawnFeatures.reduce((sum,f) => sum + (f.properties.area_km2 || 0),0);
  $('draw-stats').textContent = `${count} ta hudud · jami taxminan ${total < 1 ? (total*1000000).toFixed(0)+' m²' : total.toFixed(3)+' km²'}`;
}
function polygonAreaKm2(coords) {
  if (!coords || coords.length < 4) return 0;
  const lat0 = coords.reduce((s,p)=>s+p[1],0)/coords.length;
  const kmLon = 111.32 * Math.cos(lat0 * Math.PI / 180);
  const kmLat = 110.574;
  let area = 0;
  for (let i=0;i<coords.length-1;i++) {
    const x1 = coords[i][0]*kmLon, y1 = coords[i][1]*kmLat;
    const x2 = coords[i+1][0]*kmLon, y2 = coords[i+1][1]*kmLat;
    area += x1*y2 - x2*y1;
  }
  return Math.abs(area/2);
}
function stopDrawing() {
  drawingEnabled = false;
  pointerDrawing = false;
  drawPoints = [];
  map.getCanvas().classList.remove('draw-cursor');
  map.getCanvas().style.cursor = '';
  if (!map.dragPan.isEnabled() && dragPanWasEnabled) map.dragPan.enable();
  if (!map.doubleClickZoom.isEnabled() && doubleClickWasEnabled) map.doubleClickZoom.enable();
  updateGeoSource('draw-preview-source', emptyFC());
  $('draw-button').classList.remove('active');
  $('draw-hint').style.display = 'none';
  $('start-draw').textContent = 'Chizishni boshlash';
}
function startDrawing() {
  if (!map.getSource('draw-preview-source')) { toast('Xarita hali yuklanmoqda.'); return; }
  drawingEnabled = true;
  pointerDrawing = false;
  drawPoints = [];
  dragPanWasEnabled = map.dragPan.isEnabled();
  doubleClickWasEnabled = map.doubleClickZoom.isEnabled();
  map.dragPan.disable();
  map.doubleClickZoom.disable();
  map.getCanvas().classList.add('draw-cursor');
  map.getCanvas().style.cursor = 'crosshair';
  $('draw-button').classList.add('active');
  $('draw-hint').style.display = 'block';
  $('start-draw').textContent = 'Chizish rejimini o‘chirish';
  openSettings(false);
  toast('Chap tugmani bosib ushlab, xaritada shakl chizing.');
}
function clearTerritories() {
  drawnFeatures = [];
  updateGeoSource('territory-source', emptyFC());
  updateGeoSource('draw-preview-source', emptyFC());
  updateTerritoryStats();
  stopDrawing();
  toast('Chizilgan hududlar tozalandi.');
}
$('draw-button').addEventListener('click', () => drawingEnabled ? stopDrawing() : startDrawing());
$('start-draw').addEventListener('click', () => drawingEnabled ? stopDrawing() : startDrawing());
$('clear-territories').addEventListener('click', clearTerritories);

function addDrawPoint(event) {
  const rect = map.getCanvas().getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (lastPointer) {
    const dx = x-lastPointer.x, dy = y-lastPointer.y;
    if (dx*dx + dy*dy < 16) return;
  }
  const ll = map.unproject([x,y]);
  if (!Number.isFinite(ll.lng) || !Number.isFinite(ll.lat)) return;
  if (drawPoints.length < 700) {
    drawPoints.push({lng:ll.lng,lat:ll.lat,x,y});
    lastPointer = {x,y};
    previewDraw();
  }
}
function finishDrawing() {
  if (!pointerDrawing) return;
  pointerDrawing = false;
  if (drawPoints.length < 8) {
    updateGeoSource('draw-preview-source', emptyFC());
    drawPoints = [];
    lastPointer = null;
    toast('Hudud uchun chiziq juda qisqa. Kattaroq shakl chizing.');
    return;
  }
  const coords = drawPoints.map(p => [p.lng,p.lat]);
  const first = coords[0], last = coords[coords.length-1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push([first[0],first[1]]);
  const area = polygonAreaKm2(coords);
  if (!Number.isFinite(area) || area < 0.000001) {
    updateGeoSource('draw-preview-source', emptyFC());
    drawPoints = []; lastPointer = null;
    toast('Hudud hosil bo‘lmadi. Yana kattaroq shakl chizing.');
    return;
  }
  const feature = {
    type:'Feature',
    properties:{id:Date.now(),area_km2:area},
    geometry:{type:'Polygon',coordinates:[coords]}
  };
  drawnFeatures.push(feature);
  updateGeoSource('territory-source',{type:'FeatureCollection',features:drawnFeatures});
  updateGeoSource('draw-preview-source',emptyFC());
  drawPoints = []; lastPointer = null;
  stopDrawing();
  updateTerritoryStats();
  const areaText = area < 1 ? `${(area*1000000).toFixed(0)} m²` : `${area.toFixed(3)} km²`;
  toast(`Hudud hosil bo‘ldi · taxminiy maydon ${areaText}.`);
}

const canvas = map.getCanvas();
canvas.addEventListener('pointerdown', event => {
  if (!drawingEnabled || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  pointerDrawing = true;
  drawPoints = [];
  lastPointer = null;
  try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  addDrawPoint(event);
}, true);
canvas.addEventListener('pointermove', event => {
  if (!drawingEnabled || !pointerDrawing) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  addDrawPoint(event);
}, true);
canvas.addEventListener('pointerup', event => {
  if (!drawingEnabled || !pointerDrawing) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  addDrawPoint(event);
  finishDrawing();
}, true);
canvas.addEventListener('pointercancel', () => {
  if (pointerDrawing) {
    pointerDrawing = false;
    drawPoints = [];
    lastPointer = null;
    updateGeoSource('draw-preview-source', emptyFC());
    toast('Chizish bekor qilindi.');
  }
}, true);

// Buttons
$('opacity').addEventListener('input', e => setSatelliteOpacity(e.target.value));
document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => setMapMode(btn.dataset.mode)));
$('two-d-button').addEventListener('click', () => setCameraMode('2d'));
$('three-d-button').addEventListener('click', () => setCameraMode('3d'));
$('north-button').addEventListener('click', () => setCameraMode('north'));
document.querySelectorAll('.quick').forEach(btn => btn.addEventListener('click', () => {
  map.flyTo({center:[Number(btn.dataset.lon),Number(btn.dataset.lat)],zoom:Number(btn.dataset.zoom),pitch:0,bearing:0,duration:850});
}));

map.on('load', () => {
  // Satellite manbasi
  map.addSource('satellite-source', {
    type:'raster',
    tiles:[location.origin + '/tiles/{z}/{x}/{y}.png'],
    tileSize:256,
    minzoom:0,
    maxzoom:14,
    attribution:'Sentinel-2 / Earth Genome'
  });

  const styleLayers = map.getStyle().layers || [];
  const firstOverlay = styleLayers.find(layer => layer.type === 'line' || layer.type === 'symbol');
  map.addLayer({
    id:'satellite-layer',type:'raster',source:'satellite-source',
    paint:{
      'raster-opacity':1,
      'raster-saturation':0.04,
      'raster-contrast':0.07,
      'raster-brightness-min':0.015,
      'raster-brightness-max':0.985,
      'raster-fade-duration':150,
      'raster-resampling':'linear'
    }
  }, firstOverlay ? firstOverlay.id : undefined);

  // Hudud poligonlari: rangli yarim shaffof yashil + aniq kontur
  map.addSource('territory-source',{type:'geojson',data:emptyFC()});
  map.addLayer({
    id:'territory-fill',type:'fill',source:'territory-source',
    paint:{'fill-color':'#20c889','fill-opacity':0.30,'fill-outline-color':'#087f61'}
  }, firstOverlay ? firstOverlay.id : undefined);
  map.addLayer({
    id:'territory-outline',type:'line',source:'territory-source',
    paint:{'line-color':'#087f61','line-width':2.8,'line-opacity':0.98}
  }, firstOverlay ? firstOverlay.id : undefined);

  map.addSource('draw-preview-source',{type:'geojson',data:emptyFC()});
  map.addLayer({
    id:'draw-preview-fill',type:'fill',source:'draw-preview-source',
    filter:['==',['geometry-type'],'Polygon'],
    paint:{'fill-color':'#ffca55','fill-opacity':0.24,'fill-outline-color':'#e28b19'}
  }, firstOverlay ? firstOverlay.id : undefined);
  map.addLayer({
    id:'draw-preview-line',type:'line',source:'draw-preview-source',
    paint:{'line-color':'#ff9d24','line-width':3.2,'line-opacity':1,'line-dasharray':[1.2,1.3]}
  }, firstOverlay ? firstOverlay.id : undefined);

  // Qatlamlarni nomlardan pastga qo'yish; vektor yo'llar/yozuvlar ko'rinib qoladi.
  setMapMode('satellite');
  toast('Xarita tayyor. O‘ngdagi tugmalardan foydalaning.',3200);
});

map.on('error', event => {
  if (event && event.error) console.warn('MapLibre:', event.error.message || event.error);
});

})();
</script>
</body>
</html>'''


@app.route("/")
def home():
    return Response(HTML, mimetype="text/html", headers={"Cache-Control": "no-store"})


@app.route("/favicon.ico")
def favicon():
    return Response(status=204)


@app.route("/health")
def health():
    with _TILE_CACHE_LOCK:
        cache_size = len(_TILE_CACHE)
        inflight = len(_TILE_INFLIGHT)
    return jsonify({
        "status": "ok",
        "dataset": COLLECTION,
        "satellite_sources": len(ITEMS),
        "max_tile_zoom": MAX_TILE_ZOOM,
        "tile_cache_items": cache_size,
        "tiles_being_rendered": inflight,
        "note": "Kaggle demo server; production scale uchun CDN/static tiles kerak.",
    })


@app.route("/tiles/<int:z>/<int:x>/<int:y>.png")
def tile(z, x, y):
    if z < 0 or z > MAX_TILE_ZOOM:
        return Response(status=404)
    try:
        result = cached_tile(z, x, y)
        if result is None:
            return Response(status=503, headers={"Retry-After": "3"})
        return Response(
            result,
            mimetype="image/png",
            headers={
                # Yillik dataset o'zgarmas tile bo'lgani uchun CDN cache qilishga mos.
                "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
            },
        )
    except Exception as exc:
        print(f"[TILE ERROR] z={z} x={x} y={y}: {str(exc)[:200]}")
        return Response(status=500, headers={"Cache-Control": "no-store"})


print("4/8 — UI va API tayyor")
# 6) Waitress server

def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]

PORT = free_port()
LOCAL_URL = f"http://127.0.0.1:{PORT}"

server_thread = threading.Thread(
    target=lambda: serve(app, host="0.0.0.0", port=PORT, threads=8),
    daemon=True,
    name="waitress-server",
)
server_thread.start()

for _ in range(45):
    try:
        check = requests.get(LOCAL_URL + "/health", timeout=3)
        if check.ok:
            break
    except requests.RequestException:
        time.sleep(1)
else:
    raise RuntimeError("Waitress server ishga tushmadi.")

print(f"5/8 — Server ishlayapti: {LOCAL_URL}")

# 7) Cloudflare Quick Tunnel
CLOUDFLARED = "/kaggle/working/cloudflared"
if not os.path.exists(CLOUDFLARED) or os.path.getsize(CLOUDFLARED) < 1_000_000:
    download_url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
    print("6/8 — Cloudflared yuklanmoqda...")
    download = requests.get(download_url, timeout=(20, 180))
    download.raise_for_status()
    temp_path = CLOUDFLARED + ".tmp"
    with open(temp_path, "wb") as f:
        f.write(download.content)
    os.replace(temp_path, CLOUDFLARED)
    os.chmod(CLOUDFLARED, 0o755)

# Eski tunnel jarayoni bo'lsa, to'xtatishga urinib ko'ramiz.
try:
    if "tunnel_process" in globals() and tunnel_process.poll() is None:
        tunnel_process.terminate()
except Exception:
    pass

tunnel_process = subprocess.Popen(
    [CLOUDFLARED, "tunnel", "--url", LOCAL_URL, "--no-autoupdate"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
)
PUBLIC_URL = None
TUNNEL_ERROR = None


def tunnel_reader():
    global PUBLIC_URL, TUNNEL_ERROR
    for line in tunnel_process.stdout:
        line = line.strip()
        if line:
            print("[TUNNEL]", line[:220])
        match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
        if match and PUBLIC_URL is None:
            PUBLIC_URL = match.group(0)
            print("\n" + "=" * 62)
            print("UZBEKISTAN MAP PRO v2 — TAYYOR")
            print("MAP:", PUBLIC_URL)
            print("HEALTH:", PUBLIC_URL + "/health")
            print("=" * 62)
        if "ERR" in line or "error" in line.lower():
            TUNNEL_ERROR = line[:220]

threading.Thread(target=tunnel_reader, daemon=True, name="cloudflared-reader").start()
print("7/8 — HTTPS tunnel ochilmoqda...")

for _ in range(90):
    if PUBLIC_URL:
        break
    if tunnel_process.poll() is not None:
        raise RuntimeError("Cloudflare tunnel to'xtadi. Yuqoridagi tunnel loglarini tekshiring.")
    time.sleep(1)

if PUBLIC_URL:
    print("\nXARITA HAVOLASI:", PUBLIC_URL)
else:
    print("Tunnel manzili hali kelmadi.")
    if TUNNEL_ERROR:
        print("Oxirgi tunnel xabari:", TUNNEL_ERROR)

print("8/8 — ISHGA TAYYOR. Kaggle cell'ni ishlashda qoldiring.")
print("Eslatma: test chizilgan hududlar brauzerda vaqtincha turadi; serverga saqlanmaydi.")
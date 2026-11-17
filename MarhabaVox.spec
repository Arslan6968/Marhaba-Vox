# -*- mode: python ; coding: utf-8 -*-
import sys
import os
from pathlib import Path

block_cipher = None

PROJ_DIR = Path.cwd().resolve()
site_packages = Path(sys.executable).parent / "Lib" / "site-packages"

demucs_remote = site_packages / "demucs" / "remote"
soundfile_data = site_packages / "_soundfile_data"

datas = [
    (str(PROJ_DIR / "frontend" / "dist"), "frontend/dist"),
    (str(PROJ_DIR / "app_icon.ico"), "."),
]

if demucs_remote.exists():
    datas.append((str(demucs_remote), "demucs/remote"))

if soundfile_data.exists():
    datas.append((str(soundfile_data), "_soundfile_data"))

# Include pre-cached Demucs weights so it works 100% offline
hf_cache = Path.home() / ".cache" / "huggingface" / "hub" / "models--adefossez--HTDemucs"
if hf_cache.exists():
    datas.append((str(hf_cache), "models--adefossez--HTDemucs"))

binaries = []
# Find ffmpeg
winget_packages = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/WinGet/Packages"
ffmpeg_candidates = list(winget_packages.glob("**/ffmpeg.exe"))
if ffmpeg_candidates:
    binaries.append((str(ffmpeg_candidates[0]), "."))
else:
    import shutil
    ffmpeg_sys = shutil.which("ffmpeg")
    if ffmpeg_sys:
        binaries.append((ffmpeg_sys, "."))

hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespans',
    'uvicorn.lifespans.on',
    'uvicorn.lifespans.off',
    'fastapi',
    'pydantic',
    'sqlalchemy',
    'soundfile',
    'cffi',
    'demucs',
    'demucs.apply',
    'demucs.pretrained',
    'demucs.htdemucs',
    'demucs.hdemucs',
    'demucs.demucs',
    'torch',
    'torchaudio',
    'scipy',
    'scipy.signal',
    'webview',
    'webview.platforms.winforms',
    'webview.platforms.edgechromium',
    'clr',
]

a = Analysis(
    ['desktop_app.py'],
    pathex=[str(PROJ_DIR)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'notebook', 'IPython', 'pytest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
    optimize=2,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='MarhabaVox',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(PROJ_DIR / 'app_icon.ico'),
    version=str(PROJ_DIR / 'installer' / 'version_info.txt'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='MarhabaVox',
)

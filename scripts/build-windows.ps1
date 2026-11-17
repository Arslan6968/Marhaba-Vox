# Marhaba Vox — Automated Windows Build & Release Script
# Author: Abdul Rasheed Anjum | MarhabaPrinters
# Target: Windows 10 / 11 64-bit (x64)

[CmdletBinding()]
param(
    [switch]$SkipFrontendBuild,
    [switch]$SkipPyInstaller,
    [string]$InnoCompilerPath = "$env:LOCALAPPDATA\Programs\InnoSetup\ISCC.exe"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MARHABA VOX — Windows Build & Packaging System" -ForegroundColor Cyan
Write-Host "  Product: Marhaba Vox | Brand: MarhabaPrinters" -ForegroundColor Cyan
Write-Host "  Owner: Abdul Rasheed Anjum (Hujra Shah Muqeem, Punjab, PK)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Validate Inno Setup Compiler
if (-not (Test-Path $InnoCompilerPath)) {
    $wingetIscc = Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\InnoSetup\ISCC.exe", "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($wingetIscc) {
        $InnoCompilerPath = $wingetIscc.FullName
    } else {
        throw "Inno Setup Compiler (ISCC.exe) not found at '$InnoCompilerPath'. Please install Inno Setup 6."
    }
}
Write-Host "[✓] Inno Setup Compiler found: $InnoCompilerPath" -ForegroundColor Green

# 2. Build Frontend (if requested)
if (-not $SkipFrontendBuild) {
    if (Test-Path "$ProjectRoot\frontend\package.json") {
        Write-Host "`n[*] Building React Frontend SPA..." -ForegroundColor Yellow
        Push-Location "$ProjectRoot\frontend"
        try {
            npm run build
            Write-Host "[✓] Frontend production bundle built in frontend/dist" -ForegroundColor Green
        } finally {
            Pop-Location
        }
    }
}

# 3. Compile Python Application with PyInstaller
if (-not $SkipPyInstaller) {
    Write-Host "`n[*] Packaging Desktop Executable with PyInstaller (Optimized PYZ bytecode)..." -ForegroundColor Yellow
    pyinstaller.exe MarhabaVox.spec --noconfirm
    
    if (-not (Test-Path "$ProjectRoot\dist\MarhabaVox\MarhabaVox.exe")) {
        throw "PyInstaller build failed: dist\MarhabaVox\MarhabaVox.exe was not created."
    }
    Write-Host "[✓] Standalone executable compiled successfully." -ForegroundColor Green
}

# 4. Check Source Code Protection (Ensure no raw .py files in dist)
$leakedPy = Get-ChildItem -Path "$ProjectRoot\dist\MarhabaVox" -Recurse -Filter "*.py" -ErrorAction SilentlyContinue
if ($leakedPy.Count -gt 0) {
    Write-Host "[!] Warning: Found $($leakedPy.Count) raw .py files in dist directory. Removing for source protection..." -ForegroundColor Yellow
    $leakedPy | Remove-Item -Force
}
Write-Host "[✓] Source code protected: zero raw .py files exposed in distribution bundle." -ForegroundColor Green

# 5. Compile Windows Setup Installer with Inno Setup
Write-Host "`n[*] Compiling Inno Setup Installer with LZMA2/ultra64 solid compression..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$ProjectRoot\release" | Out-Null

& $InnoCompilerPath "$ProjectRoot\installer\MarhabaVoxInstaller.iss"

$SetupExe = "$ProjectRoot\release\MarhabaVox-Setup.exe"
if (-not (Test-Path $SetupExe)) {
    throw "Installer compilation failed: $SetupExe was not found."
}
Write-Host "[✓] Installer compiled successfully: $SetupExe" -ForegroundColor Green

# 6. Generate Checksums
Write-Host "`n[*] Generating SHA-256 and MD5 checksums..." -ForegroundColor Yellow
$sha256 = (Get-FileHash -Path $SetupExe -Algorithm SHA256).Hash
$md5 = (Get-FileHash -Path $SetupExe -Algorithm MD5).Hash
$fileSizeMB = [math]::Round((Get-Item $SetupExe).Length / 1MB, 2)

$checksumContent = @"
# Marhaba Vox v1.0.0 — Release Checksums
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Product: Marhaba Vox
# Publisher: MarhabaPrinters (Abdul Rasheed Anjum)

File:    MarhabaVox-Setup.exe
Size:    $fileSizeMB MB ($((Get-Item $SetupExe).Length) bytes)
SHA-256: $sha256
MD5:     $md5
"@

Set-Content -Path "$ProjectRoot\release\checksums.txt" -Value $checksumContent -Encoding UTF8
Write-Host "[✓] Checksums saved to release\checksums.txt" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  BUILD COMPLETE: $SetupExe" -ForegroundColor Green
Write-Host "  File Size: $fileSizeMB MB" -ForegroundColor Green
Write-Host "  SHA-256:   $sha256" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

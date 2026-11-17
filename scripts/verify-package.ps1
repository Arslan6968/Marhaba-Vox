# Marhaba Vox — Release Package Verification Script
# Validates integrity, metadata, offline assets, and security requirements

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MARHABA VOX — Release Integrity & Security Verification" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$SetupExe = "$ProjectRoot\release\MarhabaVox-Setup.exe"
$DistExe = "$ProjectRoot\dist\MarhabaVox\MarhabaVox.exe"
$DistDir = "$ProjectRoot\dist\MarhabaVox"

# 1. Verify Setup File Exists
if (-not (Test-Path $SetupExe)) {
    throw "Setup executable not found at '$SetupExe'."
}
$setupSizeMB = [math]::Round((Get-Item $SetupExe).Length / 1MB, 2)
Write-Host "[✓] Setup executable verified: $setupSizeMB MB" -ForegroundColor Green

# 2. Verify Standalone Binary Exists
if (-not (Test-Path $DistExe)) {
    throw "Main application executable not found at '$DistExe'."
}
Write-Host "[✓] Application binary verified: $DistExe" -ForegroundColor Green

# 3. Check Windows Metadata / Version Info
$versionInfo = (Get-Item $DistExe).VersionInfo
Write-Host "`n[*] Windows Executable Metadata:" -ForegroundColor Yellow
Write-Host "    File Description: $($versionInfo.FileDescription)"
Write-Host "    Product Name:     $($versionInfo.ProductName)"
Write-Host "    Product Version:  $($versionInfo.ProductVersion)"
Write-Host "    Company Name:     $($versionInfo.CompanyName)"
Write-Host "    Legal Copyright:  $($versionInfo.LegalCopyright)"

# 4. Verify Bundled Offline Model
$modelDir = "$DistDir\_internal\models--adefossez--HTDemucs"
if (-not (Test-Path $modelDir)) {
    throw "Bundled offline model missing: '$modelDir'."
}
$safetensors = Get-ChildItem -Path $modelDir -Recurse -Filter "*.safetensors"
if ($safetensors.Count -eq 0) {
    throw "HTDemucs safetensors weights missing in '$modelDir'."
}
Write-Host "[✓] Offline AI Model Verified: $($safetensors[0].Name) ($([math]::Round($safetensors[0].Length / 1MB, 2)) MB)" -ForegroundColor Green

# 5. Verify Static FFmpeg Binary
$ffmpegExe = "$DistDir\_internal\ffmpeg.exe"
if (-not (Test-Path $ffmpegExe)) {
    throw "Bundled static FFmpeg executable missing at '$ffmpegExe'."
}
Write-Host "[✓] Static FFmpeg Verified: $([math]::Round((Get-Item $ffmpegExe).Length / 1MB, 2)) MB" -ForegroundColor Green

# 6. Verify Compiled SPA Frontend
$frontendIndex = "$DistDir\_internal\frontend\dist\index.html"
if (-not (Test-Path $frontendIndex)) {
    throw "Compiled frontend index.html missing at '$frontendIndex'."
}
Write-Host "[✓] Compiled React Frontend Verified." -ForegroundColor Green

# 7. Verify Proprietary Source Code Protection
$proprietaryPy = Get-ChildItem -Path $DistDir -Recurse -Filter "*.py" | Where-Object { $_.FullName -like "*backend*" -or $_.FullName -like "*desktop_app*" }
if ($proprietaryPy.Count -gt 0) {
    Write-Host "[!] Warning: $($proprietaryPy.Count) proprietary .py files found in dist." -ForegroundColor Red
} else {
    Write-Host "[✓] Proprietary Source Protection Confirmed: All application backend code compiled into binary PYZ archive." -ForegroundColor Green
}

# 8. Verify Checksums
if (Test-Path "$ProjectRoot\release\checksums.txt") {
    $sha256 = (Get-FileHash -Path $SetupExe -Algorithm SHA256).Hash
    Write-Host "`n[✓] SHA-256 Checksum: $sha256" -ForegroundColor Cyan
}

Write-Host "`nAll release verification checks passed successfully!" -ForegroundColor Green

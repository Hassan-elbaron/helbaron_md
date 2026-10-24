<#
  Build Helbaron (Windows installer) from source.

  Everything is installed on drive D: (Node, pnpm store, Rust toolchain and
  build cache), so drive C: is not filled up.

  Usage (PowerShell, from the project folder):
      powershell -ExecutionPolicy Bypass -File scripts\windows\build-helbaron.ps1
  Optional: -ToolsRoot E:\dev   to use another drive.
#>
param(
  [string]$ToolsRoot = "D:\dev"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

function Write-Step($message) { Write-Host "`n==> $message" -ForegroundColor Cyan }

New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null

# Keep every toolchain and cache on the chosen drive.
$env:RUSTUP_HOME = Join-Path $ToolsRoot "rustup"
$env:CARGO_HOME = Join-Path $ToolsRoot "cargo"
$env:CARGO_TARGET_DIR = Join-Path $ToolsRoot "helbaron-target"
$env:PNPM_HOME = Join-Path $ToolsRoot "pnpm"
$env:npm_config_cache = Join-Path $ToolsRoot "npm-cache"
$env:Path = "$($env:CARGO_HOME)\bin;$($env:PNPM_HOME);$($env:Path)"

Write-Step "Checking Node.js (22 or newer)"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install Node.js 22 LTS (choose a folder on D:) from https://nodejs.org and run this script again."
}
node --version

Write-Step "Checking pnpm"
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  npm install -g pnpm@10 --prefix $env:PNPM_HOME
}
pnpm config set store-dir (Join-Path $ToolsRoot "pnpm-store")
pnpm --version

Write-Step "Checking Rust"
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
  $rustupInit = Join-Path $ToolsRoot "rustup-init.exe"
  Invoke-WebRequest "https://win.rustup.rs/x86_64" -OutFile $rustupInit
  & $rustupInit -y --default-toolchain stable --profile minimal
}
cargo --version

Write-Step "Microsoft C++ Build Tools are required by Rust on Windows"
Write-Host "If the build fails with 'link.exe not found', install 'Desktop development with C++' from"
Write-Host "https://visualstudio.microsoft.com/visual-cpp-build-tools/ (you can choose an install location on D:)."

Set-Location $ProjectRoot

Write-Step "Installing dependencies"
pnpm install --frozen-lockfile

Write-Step "Building the Windows installer"
pnpm tauri build --bundles nsis

$installer = Get-ChildItem -Path (Join-Path $env:CARGO_TARGET_DIR "release\bundle\nsis") -Filter "*.exe" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "`nDone. Installer:" -ForegroundColor Green
Write-Host $installer.FullName

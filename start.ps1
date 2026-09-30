<#
.SYNOPSIS
    iSeed(아이씨드) 전체 서비스 실행 스크립트

.DESCRIPTION
    환경 검사 → 디렉터리/ChromaDB 확인 → Docker 빌드 → 기동 → 헬스체크 까지 수행합니다.

.EXAMPLE
    .\start.ps1
    .\start.ps1 -NoBuild        # 이미 빌드된 이미지로 바로 기동
#>

[CmdletBinding()]
param(
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step($msg) { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✔ $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "  ✘ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "   iSeed (아이씨드) 서비스 시작" -ForegroundColor Magenta
Write-Host "   아이의 작은 마음 신호를 발견하고, 함께 키워요." -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta

# ── 1. Docker 확인 ────────────────────────────────────────────────
Write-Step "1/6  Docker 확인"
try {
    $dockerVersion = docker --version
    Write-Ok $dockerVersion
} catch {
    Write-Err "Docker 를 찾을 수 없습니다. Docker Desktop 을 설치하고 실행해 주세요."
    Write-Host "     https://www.docker.com/products/docker-desktop/"
    exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker 데몬이 실행 중이 아닙니다. Docker Desktop 을 먼저 켜 주세요."
    exit 1
}
Write-Ok "Docker 데몬 정상"

# ── 2. .env 확인 ─────────────────────────────────────────────────
Write-Step "2/6  환경변수(.env) 확인"
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Warn2 ".env 가 없어 .env.example 로 생성했습니다. GEMINI_API_KEY 를 채워 주세요."
    } else {
        Write-Err ".env / .env.example 이 모두 없습니다."
        exit 1
    }
} else {
    Write-Ok ".env 존재"
}

# 서비스별 .env (AiModels 는 필수)
if (-not (Test-Path ".\iSeed-AiModels-Docker\.env")) {
    Write-Err "iSeed-AiModels-Docker\.env 가 없습니다. GEMINI_API_KEY 가 필요합니다."
    Write-Host "     예시:  GEMINI_API_KEY=AIza...   AIMODELS_PORT=8080"
    exit 1
}
$aiEnv = Get-Content ".\iSeed-AiModels-Docker\.env" -Raw
if ($aiEnv -notmatch "GEMINI_API_KEY\s*=\s*\S" -and $aiEnv -notmatch "GEMINI_API_KEYS\s*=\s*\S") {
    Write-Warn2 "AiModels .env 에 GEMINI_API_KEY 값이 비어 있습니다. 그림 해석이 동작하지 않습니다."
} else {
    Write-Ok "AiModels API 키 설정됨"
}
if (-not (Test-Path ".\iSeed-Backend-Docker\.env")) {
    Write-Warn2 "Backend .env 없음 - 로그인/기록 저장 기능은 비활성 상태로 기동됩니다."
    New-Item -ItemType File ".\iSeed-Backend-Docker\.env" -Force | Out-Null
}

# ── 3. 필요한 디렉터리 / ChromaDB 확인 ───────────────────────────
Write-Step "3/6  RAG(ChromaDB) / 논문 확인"
foreach ($d in @("rag\chroma", "rag\papers", "rag\dataset", "docs")) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force $d | Out-Null }
}

$paperCount = (Get-ChildItem "rag\papers" -Filter *.pdf -ErrorAction SilentlyContinue).Count
Write-Ok "논문 PDF ${paperCount}편"

$chromaSqlite = "rag\chroma\chroma.sqlite3"
if (Test-Path $chromaSqlite) {
    $size = [math]::Round((Get-Item $chromaSqlite).Length / 1KB, 1)
    Write-Ok "ChromaDB 존재 (${size} KB)"
    Write-Host "     적재 상태는 기동 후 http://localhost:8080/rag/status 에서 확인할 수 있습니다." -ForegroundColor DarkGray
} else {
    Write-Warn2 "ChromaDB 가 없습니다. RAG 근거 검색 없이 LLM 해석만 수행됩니다."
    Write-Host "     구축하려면:  docker compose run --rm aimodels python /app/rag/scripts/init_rag.py" -ForegroundColor DarkGray
}

# ── 4. 빌드 ──────────────────────────────────────────────────────
$composeArgs = @("compose")

if (-not $NoBuild) {
    Write-Step "4/6  Docker 이미지 빌드 (최초 실행은 10~20분 걸릴 수 있습니다)"
    & docker @composeArgs build
    if ($LASTEXITCODE -ne 0) { Write-Err "빌드 실패"; exit 1 }
    Write-Ok "빌드 완료"
} else {
    Write-Step "4/6  빌드 건너뜀 (-NoBuild)"
}

# ── 5. 기동 ──────────────────────────────────────────────────────
Write-Step "5/6  컨테이너 기동"
& docker @composeArgs up -d
if ($LASTEXITCODE -ne 0) { Write-Err "기동 실패"; exit 1 }
Write-Ok "컨테이너 기동 요청 완료"

# ── 6. 헬스체크 ──────────────────────────────────────────────────
Write-Step "6/6  헬스체크 (최대 3분 대기)"

$targets = @(
    @{ Name = "Frontend "; Url = "http://localhost:3000";        Required = $true  },
    @{ Name = "AiModels "; Url = "http://localhost:8080/health"; Required = $true  },
    @{ Name = "Backend  "; Url = "http://localhost:8000/health"; Required = $false }
)

$deadline = (Get-Date).AddMinutes(3)
$pending = [System.Collections.ArrayList]::new()
foreach ($t in $targets) { [void]$pending.Add($t) }

while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    $done = @()
    foreach ($t in $pending) {
        try {
            $r = Invoke-WebRequest -Uri $t.Url -TimeoutSec 5 -UseBasicParsing
            if ($r.StatusCode -eq 200) {
                Write-Ok "$($t.Name) OK   $($t.Url)"
                $done += $t
            }
        } catch { }
    }
    foreach ($t in $done) { $pending.Remove($t) }
    if ($pending.Count -gt 0) { Start-Sleep -Seconds 5 }
}

$failedRequired = $false
foreach ($t in $pending) {
    if ($t.Required) { Write-Err "$($t.Name) 응답 없음   $($t.Url)"; $failedRequired = $true }
    else { Write-Warn2 "$($t.Name) 응답 없음 (선택 서비스)   $($t.Url)" }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
if ($failedRequired) {
    Write-Host "   일부 필수 서비스가 준비되지 않았습니다" -ForegroundColor Red
    Write-Host "   로그 확인:  docker compose logs -f" -ForegroundColor Yellow
} else {
    Write-Host "   iSeed 준비 완료!" -ForegroundColor Green
}
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Frontend   http://localhost:3000"
Write-Host "  Backend    http://localhost:8000/health"
Write-Host "  AiModels   http://localhost:8080/health"
Write-Host "  RAG 상태   http://localhost:8080/rag/status"
Write-Host ""
Write-Host "  종료하려면:  .\stop.ps1" -ForegroundColor DarkGray
Write-Host ""

if ($failedRequired) { exit 1 }

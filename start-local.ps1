<#
.SYNOPSIS
    iSeed 로컬 실행 (Docker 없이) — 대체 실행 경로

.DESCRIPTION
    Docker Desktop 이 설치되어 있지 않은 PC에서 Frontend + AiModels 를 직접 실행합니다.
    핵심 플로우(그림검사 → AI분석 → 마음 리포트 → 마음활동 → 씨앗성장)를 모두 사용할 수 있습니다.
    (로그인 / 분석기록 저장이 필요하면 Docker 경로인 .\start.ps1 을 사용하세요.)

    필요 조건
      - Python 3.11 또는 3.12
      - Node.js 20 이상
      - iSeed-AiModels-Docker\.env 에 GEMINI_API_KEY

.EXAMPLE
    .\start-local.ps1
    .\start-local.ps1 -SkipInstall     # 의존성 설치 건너뛰기 (2회차 이후)
#>

[CmdletBinding()]
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$ai = Join-Path $root "iSeed-AiModels-Docker"
$fe = Join-Path $root "iSeed-Frontend-Docker"
$venvPy = Join-Path $ai ".venv-local\Scripts\python.exe"

function Write-Step($m) { Write-Host "`n▶ $m" -ForegroundColor Cyan }
function Write-Ok($m)   { Write-Host "  ✔ $m" -ForegroundColor Green }
function Write-Err($m)  { Write-Host "  ✘ $m" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "   iSeed 로컬 실행 (Docker 미사용)" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta

# 1. 사전 확인
Write-Step "1/4  실행 환경 확인"
try { Write-Ok (python --version) } catch { Write-Err "Python 을 찾을 수 없습니다."; exit 1 }
try { Write-Ok ("Node " + (node --version)) } catch { Write-Err "Node.js 를 찾을 수 없습니다."; exit 1 }
if (-not (Test-Path (Join-Path $ai ".env"))) {
    Write-Err "iSeed-AiModels-Docker\.env 가 없습니다. GEMINI_API_KEY 를 넣어 주세요."
    exit 1
}
Write-Ok "AiModels .env 확인"

# 2. 의존성
if (-not $SkipInstall) {
    Write-Step "2/4  의존성 설치 (최초 1회, 10~20분 소요)"

    if (-not (Test-Path $venvPy)) {
        python -m venv (Join-Path $ai ".venv-local")
    }
    & $venvPy -m pip install --upgrade pip --quiet

    # uvloop 은 Windows 를 지원하지 않으므로 제외한 사본을 사용 (원본 requirements.txt 는 그대로 둠)
    $reqWin = Join-Path $env:TEMP "iseed-req-win.txt"
    Get-Content (Join-Path $ai "requirements.txt") |
        Where-Object { $_ -notmatch '^uvloop' } |
        Out-File -FilePath $reqWin -Encoding utf8
    & $venvPy -m pip install -r $reqWin
    if ($LASTEXITCODE -ne 0) { Write-Err "Python 의존성 설치 실패"; exit 1 }
    Write-Ok "Python 의존성 설치 완료"

    Push-Location $fe
    npm ci
    Pop-Location
    if ($LASTEXITCODE -ne 0) { Write-Err "npm 의존성 설치 실패"; exit 1 }
    Write-Ok "Node 의존성 설치 완료"
} else {
    Write-Step "2/4  의존성 설치 건너뜀 (-SkipInstall)"
}

# 3. 서버 기동
Write-Step "3/4  서버 기동"
$chroma = Join-Path $root "rag\chroma"

$aiJob = Start-Process -FilePath $venvPy `
    -ArgumentList @("-m","uvicorn","main:app","--host","127.0.0.1","--port","8080") `
    -WorkingDirectory $ai -PassThru -WindowStyle Minimized `
    -Environment @{ HTP_DB_PATH = $chroma }
Write-Ok "AiModels 기동 (PID $($aiJob.Id)) — 모델 로딩에 30초 정도 걸립니다"

$feJob = Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/c","npm run dev") `
    -WorkingDirectory $fe -PassThru -WindowStyle Minimized
Write-Ok "Frontend 기동 (PID $($feJob.Id))"

@{ aimodels = $aiJob.Id; frontend = $feJob.Id } | ConvertTo-Json |
    Out-File -FilePath (Join-Path $root ".local-pids.json") -Encoding utf8

# 4. 헬스체크
Write-Step "4/4  헬스체크 (최대 3분)"
$deadline = (Get-Date).AddMinutes(3)
$aiOk = $false; $feOk = $false
while ((Get-Date) -lt $deadline -and (-not ($aiOk -and $feOk))) {
    if (-not $aiOk) {
        try { if ((Invoke-WebRequest "http://localhost:8080/health" -TimeoutSec 4 -UseBasicParsing).StatusCode -eq 200) { $aiOk = $true; Write-Ok "AiModels OK" } } catch {}
    }
    if (-not $feOk) {
        try { if ((Invoke-WebRequest "http://localhost:3000" -TimeoutSec 4 -UseBasicParsing).StatusCode -eq 200) { $feOk = $true; Write-Ok "Frontend OK" } } catch {}
    }
    if (-not ($aiOk -and $feOk)) { Start-Sleep -Seconds 5 }
}

Write-Host ""
if ($aiOk -and $feOk) {
    Write-Host "  iSeed 준비 완료!  →  http://localhost:3000" -ForegroundColor Green
    try {
        $rag = Invoke-RestMethod "http://localhost:8080/rag/status" -TimeoutSec 5
        if ($rag.ready) { Write-Ok "RAG 적재됨 ($($rag.embedding_count) 벡터)" }
        else { Write-Host "  ! RAG 미적재 — 논문 근거 없이 LLM 해석만 수행됩니다." -ForegroundColor Yellow }
    } catch {}
} else {
    Write-Err "일부 서비스가 기동되지 않았습니다. 각 창의 로그를 확인해 주세요."
}
Write-Host ""
Write-Host "  종료:  .\stop-local.ps1" -ForegroundColor DarkGray
Write-Host ""

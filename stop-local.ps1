<#
.SYNOPSIS
    start-local.ps1 로 띄운 iSeed 서버를 종료합니다 (Docker 미사용 경로).
#>

$ErrorActionPreference = "SilentlyContinue"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "▶ iSeed 로컬 서버를 종료합니다..." -ForegroundColor Cyan

$pidFile = ".local-pids.json"
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile -Raw | ConvertFrom-Json
    foreach ($name in @("aimodels", "frontend")) {
        $procId = $pids.$name
        if ($procId) {
            $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($p) {
                # 자식 프로세스(node, python)까지 함께 정리
                taskkill /PID $procId /T /F *> $null
                Write-Host "  ✔ $name 종료 (PID $procId)" -ForegroundColor Green
            } else {
                Write-Host "  · $name 는 이미 종료됨" -ForegroundColor DarkGray
            }
        }
    }
    Remove-Item $pidFile -Force
} else {
    Write-Host "  · .local-pids.json 이 없습니다. 포트 기준으로 정리합니다." -ForegroundColor DarkGray
    foreach ($port in @(3000, 8080)) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            taskkill /PID $c.OwningProcess /T /F *> $null
            Write-Host "  ✔ 포트 $port 사용 프로세스 종료 (PID $($c.OwningProcess))" -ForegroundColor Green
        }
    }
}

Write-Host "  ✔ 종료 완료" -ForegroundColor Green
Write-Host ""

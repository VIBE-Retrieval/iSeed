<#
.SYNOPSIS
    iSeed(아이씨드) 서비스 종료 스크립트

.EXAMPLE
    .\stop.ps1                # 컨테이너만 정지/삭제 (데이터 볼륨 유지)
    .\stop.ps1 -RemoveVolumes # 분석 산출물 볼륨까지 삭제
#>

[CmdletBinding()]
param(
    [switch]$RemoveVolumes
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "▶ iSeed 서비스를 종료합니다..." -ForegroundColor Cyan

if ($RemoveVolumes) {
    Write-Host "  ! 분석 산출물 볼륨도 함께 삭제합니다." -ForegroundColor Yellow
    docker compose down -v
} else {
    docker compose down
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✔ 종료 완료" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ※ rag/chroma (RAG 지식베이스)는 호스트 폴더라 삭제되지 않습니다." -ForegroundColor DarkGray
} else {
    Write-Host "  ✘ 종료 중 오류가 발생했습니다. docker compose ps 로 확인해 주세요." -ForegroundColor Red
    exit 1
}
Write-Host ""

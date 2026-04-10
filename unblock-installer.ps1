# 解除安装包锁定的 PowerShell 脚本
# 使用方法：右键此文件 → 使用 PowerShell 运行

$filePath = "$PSScriptRoot\OpenClaw Desktop Setup 1.0.0.exe"

if (Test-Path $filePath) {
    Unblock-File -Path $filePath
    Write-Host "✅ 文件已解除锁定！" -ForegroundColor Green
    Write-Host "现在可以双击运行安装程序了" -ForegroundColor Cyan
} else {
    Write-Host "❌ 未找到安装包文件" -ForegroundColor Red
    Write-Host "请确保安装包和此脚本在同一文件夹" -ForegroundColor Yellow
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

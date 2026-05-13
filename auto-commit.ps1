# Auto-commit i push przy zmianach plikow w projekcie
# Uruchom: .\auto-commit.ps1

$projectPath = $PSScriptRoot
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $name = $Event.SourceEventArgs.Name
    $changeType = $Event.SourceEventArgs.ChangeType

    # Ignoruj pliki git i skrypt sam w sobie
    if ($name -match "^\.git" -or $name -eq "auto-commit.ps1") { return }

    Start-Sleep -Seconds 1  # bufor na zapis pliku

    Set-Location $projectPath
    $status = git status --porcelain
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git add -A
        git commit -m "auto: $changeType $name [$timestamp]"
        git push origin HEAD
        Write-Host "[AUTO] Wypchnięto: $changeType $name" -ForegroundColor Green
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

Write-Host "Obserwuję zmiany w: $projectPath" -ForegroundColor Cyan
Write-Host "Naciśnij Ctrl+C aby zatrzymać..." -ForegroundColor Yellow

try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
}

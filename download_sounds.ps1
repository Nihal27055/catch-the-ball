# PowerShell script to download game sound effects

# Create directory if it doesn't exist
if (-not (Test-Path -Path "sounds")) {
    New-Item -ItemType Directory -Path "sounds"
}

# URLs for sound effects
$catchSoundUrl = "https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3"
$missSoundUrl = "https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3"
$levelUpSoundUrl = "https://assets.mixkit.co/sfx/preview/mixkit-game-level-completed-2059.mp3"

# Download files
Write-Host "Downloading catch.mp3..." -ForegroundColor Green
Invoke-WebRequest -Uri $catchSoundUrl -OutFile "sounds/catch.mp3"
Write-Host "Downloading miss.mp3..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $missSoundUrl -OutFile "sounds/miss.mp3"
Write-Host "Downloading levelup.mp3..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $levelUpSoundUrl -OutFile "sounds/levelup.mp3"

Write-Host "All sound files downloaded successfully!" -ForegroundColor Green 
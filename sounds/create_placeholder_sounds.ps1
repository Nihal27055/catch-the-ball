# PowerShell script to create placeholder sound files

# Check if FFmpeg is available (for creating proper MP3 files)
$ffmpegAvailable = $false
try {
    if (Get-Command "ffmpeg" -ErrorAction SilentlyContinue) {
        $ffmpegAvailable = $true
        Write-Host "FFmpeg found. Will create proper audio files." -ForegroundColor Green
    }
} catch {
    Write-Host "FFmpeg not found. Will create empty placeholder files." -ForegroundColor Yellow
}

# Create empty files for each sound
$soundFiles = @("catch.mp3", "miss.mp3", "levelup.mp3")

foreach ($file in $soundFiles) {
    $filePath = Join-Path -Path "." -ChildPath $file
    
    if (Test-Path $filePath) {
        Write-Host "$file already exists. Skipping..." -ForegroundColor Cyan
    } else {
        if ($ffmpegAvailable) {
            # Create a short beep sound using FFmpeg if available
            $freq = switch ($file) {
                "catch.mp3" { "800" }    # Higher tone for catch
                "miss.mp3" { "300" }     # Lower tone for miss
                "levelup.mp3" { "1200" } # Highest tone for level up
            }
            
            $duration = switch ($file) {
                "catch.mp3" { "0.3" }    # Short duration
                "miss.mp3" { "0.5" }     # Medium duration
                "levelup.mp3" { "1.0" }  # Longer duration
            }
            
            Write-Host "Creating $file with tone at ${freq}Hz for ${duration}s..." -ForegroundColor Green
            ffmpeg -f lavfi -i "sine=frequency=${freq}:duration=${duration}" -q:a 0 $filePath -y
        } else {
            # Create empty file as placeholder
            New-Item -ItemType File -Path $filePath -Force | Out-Null
            Write-Host "Created empty placeholder file for $file" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nPlaceholder sound files created!" -ForegroundColor Green
Write-Host "Please replace these with real sound files for the best experience." -ForegroundColor Yellow
Write-Host "See sound_instructions.html for links to download proper sound effects." -ForegroundColor Cyan 
# Check if MongoDB is already running
$mongodProcess = Get-Process mongod -ErrorAction SilentlyContinue

if ($mongodProcess) {
    Write-Host "MongoDB is already running with process ID: $($mongodProcess.Id)" -ForegroundColor Green
} else {
    Write-Host "MongoDB is not running. Attempting to start it..." -ForegroundColor Yellow
    
    # Try to find MongoDB installation
    $possiblePaths = @(
        "C:\Program Files\MongoDB\Server\7.0\bin",
        "C:\Program Files\MongoDB\Server\6.0\bin",
        "C:\Program Files\MongoDB\Server\5.0\bin",
        "C:\Program Files\MongoDB\Server\4.4\bin",
        "C:\mongodb\bin"
    )
    
    $mongodPath = $null
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\mongod.exe") {
            $mongodPath = "$path\mongod.exe"
            break
        }
    }
    
    if ($mongodPath) {
        # Create data directory if it doesn't exist
        if (-not (Test-Path "C:\data\db")) {
            New-Item -ItemType Directory -Path "C:\data\db" -Force
        }
        
        # Start MongoDB
        Write-Host "Starting MongoDB from $mongodPath" -ForegroundColor Cyan
        Start-Process -FilePath $mongodPath -ArgumentList "--dbpath=C:\data\db" -WindowStyle Minimized
        
        Write-Host "MongoDB started successfully!" -ForegroundColor Green
    } else {
        Write-Host "MongoDB executable not found in common locations." -ForegroundColor Red
        Write-Host "Please install MongoDB or specify the correct path to mongod.exe" -ForegroundColor Red
        
        # Try to use MongoDB Compass to start MongoDB
        Write-Host "Checking if MongoDB Compass is installed..." -ForegroundColor Yellow
        $compassPath = "C:\Program Files\MongoDB Compass\MongoDBCompass.exe"
        if (Test-Path $compassPath) {
            Write-Host "MongoDB Compass found. Starting it to connect to MongoDB..." -ForegroundColor Cyan
            Start-Process -FilePath $compassPath
        }
    }
}
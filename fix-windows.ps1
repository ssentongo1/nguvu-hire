# fix-windows.ps1 - Complete Windows Fix for NguvuHire
Write-Host "=== NguvuHire Supabase Fix for Windows ===" -ForegroundColor Cyan
Write-Host "Fixing all Supabase connection issues..." -ForegroundColor Yellow

# 1. Stop running processes
Write-Host "`n1. Stopping running processes..." -ForegroundColor Green
Get-Process node, npm, next -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Clear cache
Write-Host "`n2. Clearing cache..." -ForegroundColor Green
if (Test-Path .next) {
    Remove-Item -Path .next -Recurse -Force
    Write-Host "   Removed .next folder" -ForegroundColor White
}
if (Test-Path node_modules) {
    Write-Host "   Note: node_modules exists (skipping deletion)" -ForegroundColor Gray
}

npm cache clean --force
Write-Host "   Cleared npm cache" -ForegroundColor White

# 3. Check .env.local
Write-Host "`n3. Checking .env.local..." -ForegroundColor Green
$envPath = ".\.env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL" -and $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        Write-Host "   ✅ .env.local is correct" -ForegroundColor Green
        
        # Show key info
        $keyLine = $envContent -split "`n" | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=" }
        if ($keyLine) {
            $key = $keyLine.Split('=')[1].Trim()
            Write-Host "   Key length: $($key.Length) chars" -ForegroundColor Gray
            Write-Host "   Key starts: $($key.Substring(0, [Math]::Min(10, $key.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ .env.local missing Supabase config" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env.local not found!" -ForegroundColor Red
    Write-Host "   Creating .env.local with your credentials..." -ForegroundColor Yellow
    
    $newEnv = @"
NEXT_PUBLIC_SUPABASE_URL=https://tlcrmsoiufiubyfqnstj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY3Jtc29pdWJ5ZnFuc3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTQ4MzYsImV4cCI6MjA3Mzk5MDgzNn0.AaQt66XK-VaLYMfpPkqAz3lSqbyF-nY03C94DWNEoFU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsY3Jtc29pdWJ5ZnFuc3RqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQxNDgzNiwiZXhwIjoyMDczOTkwODM2fQ.A6cRhJHCMh3vaBA_5BwMGICnKJAL49tYvVTd1MiGHpU
NODE_ENV=development
"@
    
    Set-Content -Path $envPath -Value $newEnv
    Write-Host "   ✅ Created .env.local" -ForegroundColor Green
}

# 4. Install dependencies
Write-Host "`n4. Installing dependencies..." -ForegroundColor Green
npm install
Write-Host "   ✅ Dependencies installed" -ForegroundColor White

# 5. Instructions
Write-Host "`n5. IMPORTANT MANUAL STEPS:" -ForegroundColor Yellow
Write-Host "   a) Go to: https://app.supabase.com" -ForegroundColor White
Write-Host "   b) Select project: tlcrmsoiufiubyfqnstj" -ForegroundColor White
Write-Host "   c) Go to Authentication → URL Configuration" -ForegroundColor White
Write-Host "   d) Add these URLs:" -ForegroundColor Cyan
Write-Host "      - http://localhost:3000" -ForegroundColor Cyan
Write-Host "      - http://localhost:3000/auth/callback" -ForegroundColor Cyan
Write-Host "      - https://www.nguvuhire.com" -ForegroundColor Cyan
Write-Host "      - https://www.nguvuhire.com/auth/callback" -ForegroundColor Cyan
Write-Host "   e) Save changes" -ForegroundColor White
Write-Host "`n   f) Go to SQL Editor and run fix-rls.sql" -ForegroundColor White

# 6. Start dev server
Write-Host "`n6. Starting development server..." -ForegroundColor Cyan
Write-Host "`n=== SERVER STARTING ===" -ForegroundColor Green
Write-Host "After server starts:" -ForegroundColor White
Write-Host "1. Open: http://localhost:3000" -ForegroundColor Green
Write-Host "2. Test: Click 'Sign In / Join' button" -ForegroundColor Green
Write-Host "3. Test: Click 'Browse Jobs & Talent'" -ForegroundColor Green
Write-Host "`nIf issues:" -ForegroundColor Yellow
Write-Host "- Check browser console (F12)" -ForegroundColor White
Write-Host "- Clear browser cache" -ForegroundColor White
Write-Host "- Try incognito mode" -ForegroundColor White
Write-Host "`nStarting now..." -ForegroundColor Green

npm run dev
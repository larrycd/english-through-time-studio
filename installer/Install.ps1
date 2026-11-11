#requires -version 5.1
<#
  English Through Time Studio installer - by Larry Dalton
  Installs for the current Windows account only (no administrator rights), in %LOCALAPPDATA%\EnglishThroughTimeStudio.
  Steps: back up any previous version, free port 8772 only if the previous English Through Time Studio holds it,
  copy the files, start the server, verify it over HTTP, add a sign-in shortcut, open the studio.
  On any failure the previous version is restored. The result is written to %TEMP%\EnglishThroughTimeStudio-install-result.txt.
#>
param(
    [string]$Source = '',
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$Port = 8772
$Version = '1.0.0'
$ResultFile = Join-Path $env:TEMP 'EnglishThroughTimeStudio-install-result.txt'
if (-not $Source) { $Source = Join-Path $PSScriptRoot 'payload' }
$App = Join-Path $env:LOCALAPPDATA 'EnglishThroughTimeStudio'
$Startup = [Environment]::GetFolderPath('Startup')
$StartupLnk = Join-Path $Startup 'English Through Time Studio.lnk'
$PsExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$Backup = $null

function Write-Result([string]$Text) { [System.IO.File]::WriteAllText($ResultFile, $Text, [System.Text.Encoding]::ASCII) }
function Step([string]$Text) { Write-Host ('  - ' + $Text) }
function Get-Response([string]$Url, [int]$TimeoutMs = 4000) {
    $rq = [System.Net.WebRequest]::Create($Url)
    $rq.Proxy = $null; $rq.Timeout = $TimeoutMs
    $rs = $rq.GetResponse()
    try {
        $ms = New-Object System.IO.MemoryStream
        $rs.GetResponseStream().CopyTo($ms)
        return @{ Bytes = $ms.ToArray(); Type = $rs.ContentType }
    } finally { $rs.Close() }
}
function Get-Url([string]$Url, [int]$TimeoutMs = 4000) { return , (Get-Response $Url $TimeoutMs).Bytes }
function Get-Text([string]$Url, [int]$TimeoutMs = 4000) { return [System.Text.Encoding]::UTF8.GetString((Get-Url $Url $TimeoutMs)) }
function Stop-Studio {
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match '\\EnglishThroughTimeStudio\\server\.ps1' -and $_.ProcessId -ne $PID } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 800
}
function Test-PortFree {
    try { $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port); $l.Start(); $l.Stop(); return $true } catch { return $false }
}
function Start-Studio {
    $srv = Join-Path $App 'server.ps1'
    Start-Process -FilePath $PsExe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', ('"' + $srv + '"')) -WindowStyle Hidden | Out-Null
}

Write-Host ''
Write-Host "English Through Time Studio $Version installer - by Larry Dalton" -ForegroundColor Yellow
Write-Host ''
try {
    if ($PSVersionTable.PSVersion.Major -lt 5) { throw 'Windows PowerShell 5.1 or later is required.' }
    $files = @('server.ps1', 'app\index.html', 'app\icon.svg',
        'app\js\data.js', 'app\js\translate.js', 'app\js\pron.js', 'app\js\render.js', 'app\js\ui.js',
        'app\data\parts.json', 'app\data\align.json', 'app\data\parallel.json', 'app\data\heldout.json', 'app\data\eval.json', 'app\data\cmu.tsv', 'app\data\glyphs.json',
        'app\fonts\ETCA.ttf', 'app\fonts\ETFE.ttf', 'app\fonts\ETBL.ttf', 'app\fonts\ETUN.ttf', 'app\fonts\ETRU.ttf',
        'app\vendor\hb.js', 'app\vendor\hb.wasm', 'app\vendor\hbjs.js', 'app\vendor\espeak-ng.js', 'app\vendor\espeak-ng.wasm.part1', 'app\vendor\espeak-ng.wasm.part2',
        'app\licenses\Wiktionary-CC-BY-SA-4.0.txt', 'app\licenses\eSpeak-NG-GPL-3.0.txt')
    # the dictionaries are kept in parts; parts.json says how many
    $parts = Get-Content -LiteralPath (Join-Path $Source 'app\data\parts.json') -Raw | ConvertFrom-Json
    foreach ($d in @('ang', 'enm')) { for ($i = 1; $i -le [int]$parts.$d; $i++) { $files += "app\data\$d$i.json" } }
    foreach ($f in $files) {
        if (-not (Test-Path -LiteralPath (Join-Path $Source $f))) { throw "Package file missing: $f" }
    }
    Step 'Package files present'

    $hadOld = Test-Path -LiteralPath $App
    Stop-Studio
    if (-not (Test-PortFree)) { throw "Port $Port is in use by another program. English Through Time Studio did not stop it and did not change the port." }
    Step "Port $Port is free"

    if ($hadOld) {
        $Backup = $App + '-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Move-Item -LiteralPath $App -Destination $Backup
        Step "Previous version backed up to $Backup"
    }
    New-Item -ItemType Directory -Path $App -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $Source 'server.ps1') -Destination $App -Force
    Copy-Item -LiteralPath (Join-Path $Source 'app') -Destination $App -Recurse -Force
    foreach ($f in @('Uninstall.ps1', 'english.ico')) { $p = Join-Path $Source $f; if (Test-Path -LiteralPath $p) { Copy-Item -LiteralPath $p -Destination $App -Force } }
    Step "Files written to $App"

    Start-Studio
    $health = $null
    for ($i = 0; $i -lt 40 -and -not $health; $i++) {
        Start-Sleep -Milliseconds 500
        try { $health = Get-Text "http://localhost:$Port/api/health" } catch { }
    }
    if (-not $health -or $health -notmatch '"English Through Time Studio"') { throw 'The server did not start (no answer from /api/health).' }
    Step 'Server started'

    $page = Get-Text "http://localhost:$Port/"
    if ($page -notmatch 'English Through Time Studio') { throw 'The studio page was not served correctly.' }
    foreach ($js in @('data', 'translate', 'pron', 'render')) {
        if ((Get-Text "http://localhost:$Port/js/$js.js") -notmatch 'English Through Time Studio engine') { throw "The engine part $js.js was not served correctly." }
    }
    $rows = @{}
    foreach ($d in @('ang', 'enm')) {
        $rows[$d] = 0
        for ($i = 1; $i -le [int]$parts.$d; $i++) { $rows[$d] += ([regex]::Matches((Get-Text "http://localhost:$Port/data/$d$i.json" 30000), '\["[^"\\]*","[a-z ]+",\[')).Count }
    }
    $angRows = $rows['ang']; $enmRows = $rows['enm']
    if ($angRows -lt 60000) { throw "Old English dictionary incomplete ($angRows entries)." }
    if ($enmRows -lt 50000) { throw "Middle English dictionary incomplete ($enmRows entries)." }
    $par = Get-Text "http://localhost:$Port/data/parallel.json" 30000
    $verses = ([regex]::Matches($par, '\d+:\d+":\[')).Count
    if ($verses -lt 7900) { throw "Parallel texts incomplete ($verses verses)." }
    $r = Get-Response "http://localhost:$Port/vendor/hb.wasm" 30000
    if ($r.Type -notmatch 'application/wasm') { throw "vendor/hb.wasm is not served as WebAssembly ($($r.Type))." }
    $w1 = Get-Url "http://localhost:$Port/vendor/espeak-ng.wasm.part1" 30000
    if ($w1.Length -lt 8 -or $w1[0] -ne 0 -or $w1[1] -ne 0x61 -or $w1[2] -ne 0x73 -or $w1[3] -ne 0x6D) { throw 'The speech engine (espeak-ng.wasm.part1) is not a WebAssembly file.' }
    foreach ($rel in $files | Where-Object { $_ -like 'app\*' }) {
        $local = (Get-Item -LiteralPath (Join-Path $App $rel)).Length
        $served = (Get-Url ("http://localhost:$Port/" + $rel.Substring(4).Replace('\', '/')) 30000).Length
        if ($local -ne $served) { throw ('Not served correctly: ' + $rel) }
    }
    $bad = $false; try { Get-Url "http://localhost:$Port/..%5Cserver.ps1" | Out-Null; $bad = $true } catch { }
    if ($bad) { throw 'The server allowed access outside the studio folder.' }
    Step ("Verified over HTTP: page, engine, $angRows Old English and $enmRows Middle English entries, $verses verses, " + 'speech and shaping engines, every file''s size, folder protection')

    $ws = New-Object -ComObject WScript.Shell
    $lnk = $ws.CreateShortcut($StartupLnk)
    $lnk.TargetPath = $PsExe
    $lnk.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $App 'server.ps1') + '"'
    $lnk.WindowStyle = 7
    $lnk.Description = 'English Through Time Studio server (http://localhost:8772/)'
    $ico = Join-Path $App 'english.ico'; if (Test-Path -LiteralPath $ico) { $lnk.IconLocation = $ico }
    $lnk.Save()
    Step 'Starts automatically when you sign in'

    Write-Result ("OK English Through Time Studio $Version installed at http://localhost:$Port/")
    Write-Host ''
    Write-Host "English Through Time Studio is installed and running at http://localhost:$Port/" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }
    exit 0
}
catch {
    $msg = $_.Exception.Message
    Write-Host ''
    Write-Host ('Install failed: ' + $msg) -ForegroundColor Red
    try {
        Stop-Studio
        if ($Backup -and (Test-Path -LiteralPath $Backup)) {
            if (Test-Path -LiteralPath $App) { Remove-Item -LiteralPath $App -Recurse -Force }
            Move-Item -LiteralPath $Backup -Destination $App
            Start-Studio
            Write-Host 'The previous version has been restored.'
        }
    } catch { Write-Host ('Restore problem: ' + $_.Exception.Message) }
    Write-Result ('FAIL ' + ($msg -replace '[^\x20-\x7E]', '?'))
    exit 1
}

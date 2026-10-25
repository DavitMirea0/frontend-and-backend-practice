$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$taskJava = if (Test-Path 'runtime/bin/java.exe') { (Resolve-Path 'runtime/bin/java.exe').Path }
    elseif ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME/bin/java.exe")) { "$env:JAVA_HOME/bin/java.exe" }
    else { (Get-Command java -ErrorAction Stop).Source }
$taskInfo = New-Object System.Diagnostics.ProcessStartInfo
$taskInfo.FileName = $taskJava
$taskInfo.Arguments = '-version'
$taskInfo.UseShellExecute = $false
$taskInfo.CreateNoWindow = $true
$taskInfo.RedirectStandardError = $true
$taskProcess = [System.Diagnostics.Process]::Start($taskInfo)
$taskVersion = $taskProcess.StandardError.ReadToEnd()
$taskProcess.WaitForExit()
$taskProcess.Dispose()
if ($taskVersion -notmatch 'version "(\d+)') { throw 'Cannot determine Java version.' }
if ([int]$Matches[1] -lt 17) { throw 'Java 17+ required. Set JAVA_HOME to a JDK 17+ folder or put a runtime in runtime/.' }
if (-not (Test-Path 'app/it-equipment-fx-2.0.0.jar')) { throw 'Application missing. Build with Maven and run scripts/package.ps1.' }
$taskCache = Join-Path (Get-Location).Path '.cache/javafx'
& $taskJava '-Dfile.encoding=UTF-8' "-Djavafx.cachedir=$taskCache" '-cp' 'app/it-equipment-fx-2.0.0.jar;app/lib/*' 'ru.mirea.project.Launcher'
exit $LASTEXITCODE

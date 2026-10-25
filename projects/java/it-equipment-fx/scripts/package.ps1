$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force app/lib | Out-Null
Copy-Item 'target/it-equipment-fx-2.0.0.jar' 'app/it-equipment-fx-2.0.0.jar' -Force
Copy-Item 'target/lib/*.jar' 'app/lib/' -Force
Write-Host 'Packaged. Start the database, then run run.cmd.'

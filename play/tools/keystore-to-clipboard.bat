@echo off
rem Double-click this. It opens a file picker: choose upload.keystore. The encoded key
rem lands on your clipboard, ready to paste into the PLAY_KEYSTORE_B64 secret on GitHub.
rem Nothing is written anywhere and nothing is sent anywhere.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Title = Pick upload.keystore; $d.Filter = Keystore (*.keystore)|*.keystore|All files (*.*)|*.*; if ($d.ShowDialog() -eq OK) { [Convert]::ToBase64String([IO.File]::ReadAllBytes($d.FileName)) | Set-Clipboard; Write-Host Copied to clipboard. Now paste it into the PLAY_KEYSTORE_B64 secret on GitHub, then clear the clipboard. } else { Write-Host Cancelled. }"
pause

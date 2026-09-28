# Pick upload.keystore in the file dialog; its base64 text goes to the clipboard.
# Nothing is written to disk and nothing is sent anywhere.
Add-Type -AssemblyName System.Windows.Forms
$d = New-Object System.Windows.Forms.OpenFileDialog
$d.Title = 'Pick upload.keystore'
$d.Filter = 'Keystore (*.keystore)|*.keystore|All files (*.*)|*.*'
if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($d.FileName))
  Set-Clipboard -Value $b64
  Write-Host ''
  Write-Host ("Copied " + $b64.Length + " characters to the clipboard.")
  Write-Host 'Now paste into the PLAY_KEYSTORE_B64 secret on GitHub, then clear the clipboard.'
} else {
  Write-Host 'Cancelled.'
}

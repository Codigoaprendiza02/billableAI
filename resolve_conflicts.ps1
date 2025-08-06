# PowerShell script to resolve merge conflicts in extension files
$extensionPath = "extension\src"
$conflictFiles = @(
    "services\authService.js",
    "pages\Settings.jsx", 
    "pages\Popup.jsx",
    "pages\Assistant.jsx",
    "context\AppContext.jsx",
    "components\WorkHistoryComponent.jsx"
)

foreach ($file in $conflictFiles) {
    $filePath = Join-Path $extensionPath $file
    if (Test-Path $filePath) {
        Write-Host "Resolving conflicts in: $filePath"
        $content = Get-Content $filePath -Raw
        
        # Remove conflict markers and keep the updated version (after =======)
        $resolved = $content -replace '<<<<<<< HEAD[\s\S]*?=======\s*', '' -replace '>>>>>>> 5189f8f \(updations\)', ''
        
        Set-Content -Path $filePath -Value $resolved -NoNewline
        Write-Host "Resolved conflicts in: $filePath"
    } else {
        Write-Host "File not found: $filePath"
    }
}

Write-Host "All merge conflicts resolved!"

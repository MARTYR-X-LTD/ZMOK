# Check if Photoshop is running
$photoshopProcesses = Get-Process | Where-Object { $_.ProcessName -eq "Photoshop" }

if ($photoshopProcesses.Count -gt 0) {
    # Create a COM object for Photoshop
    $objApp = New-Object -ComObject "Photoshop.Application"

    # Use dialog mode 3 for showing no dialogs
    $dialogMode = 3

    # Define the string ID for "placedLayerUpdateAllModified"
    $idplacedLayerUpdateAllModified = $objApp.StringIDToTypeID("placedLayerUpdateAllModified")

    # Execute the action
    $objApp.ExecuteAction($idplacedLayerUpdateAllModified, $null, $dialogMode)
}

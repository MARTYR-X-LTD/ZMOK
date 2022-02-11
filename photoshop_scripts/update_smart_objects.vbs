sComputerName = "."
Set objWMIService = GetObject("winmgmts:\\" & sComputerName & "\root\cimv2")
sQuery = "SELECT * FROM Win32_Process WHERE Name LIKE '%Photoshop%'"
Set objItems = objWMIService.ExecQuery(sQuery)
'iterate all item(s)
If objItems.Count >= 1 Then
   DIM objApp
   SET objApp = CreateObject("Photoshop.Application")
   REM Use dialog mode 3 for show no dialogs
   DIM dialogMode
   dialogMode = 3
   DIM idplacedLayerUpdateAllModified
   idplacedLayerUpdateAllModified = objApp.StringIDToTypeID( "placedLayerUpdateAllModified" )
   Call objApp.ExecuteAction( idplacedLayerUpdateAllModified, , dialogMode )
End if
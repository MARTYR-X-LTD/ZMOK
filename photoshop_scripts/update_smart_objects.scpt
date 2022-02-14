if application id ("com.adobe.Photoshop") is running then
    tell application id ("com.adobe.Photoshop")
        do javascript "var idplacedLayerUpdateAllModified = stringIDToTypeID( 'placedLayerUpdateAllModified' ); executeAction( idplacedLayerUpdateAllModified, undefined, DialogModes.NO );"
    end tell
end if
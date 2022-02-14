use scripting additions

set appString to "Adobe Photoshop"
set appName to my get_app_version(appString)
display dialog appName

# you may need to use my appName's quoted form in the next line
# this script is broken though for some reason "do javascript" won't 
# work unless "Adobe Photoshop 2021" is explicitly declared insead of variable appName
tell application my appName
    do javascript "var idplacedLayerUpdateAllModified = stringIDToTypeID( 'placedLayerUpdateAllModified' ); executeAction( idplacedLayerUpdateAllModified, undefined, DialogModes.NO );"
end tell
return

on get_app_version(appStr)
	return do shell script "zsh -s <<'EOF' - " & appStr's quoted form & "
#!/bin/zsh

pathName=$(stat -f '%N' /Applications/\"${1}\"*)
# return just the application name without .app
print \"${pathName:r:t}\"
EOF"
end get_app_version

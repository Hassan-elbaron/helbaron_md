!macro HelbaronRegisterExplorerMenu OBJECT ARGUMENT
  WriteRegStr SHCTX "Software\Classes\${OBJECT}\shell\Helbaron.open" "" "Open with Helbaron"
  WriteRegStr SHCTX "Software\Classes\${OBJECT}\shell\Helbaron.open" "Icon" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr SHCTX "Software\Classes\${OBJECT}\shell\Helbaron.open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"${ARGUMENT}$\""
!macroend

!macro HelbaronUnregisterExplorerMenu OBJECT ARGUMENT
  ReadRegStr $R0 SHCTX "Software\Classes\${OBJECT}\shell\Helbaron.open\command" ""
  ; Preserve a verb that another installation may have replaced after this one was installed.
  ${If} $R0 == "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"${ARGUMENT}$\""
    DeleteRegKey SHCTX "Software\Classes\${OBJECT}\shell\Helbaron.open"
  ${EndIf}
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; Markdown associations already provide their own Open with Helbaron verb.
  !insertmacro HelbaronRegisterExplorerMenu "SystemFileAssociations\.txt" "%1"
  !insertmacro HelbaronRegisterExplorerMenu "Directory" "%1"
  !insertmacro HelbaronRegisterExplorerMenu "Directory\Background" "%V"
  ; Tell Explorer to refresh its cached file-association data.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro HelbaronUnregisterExplorerMenu "SystemFileAssociations\.txt" "%1"
  !insertmacro HelbaronUnregisterExplorerMenu "Directory" "%1"
  !insertmacro HelbaronUnregisterExplorerMenu "Directory\Background" "%V"
  ; Tell Explorer to refresh its cached file-association data.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

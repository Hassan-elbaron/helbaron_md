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

; A ProgID that opens a file type with Helbaron without becoming that type's default.
!macro HelbaronRegisterProgId PROGID DESCRIPTION
  WriteRegStr SHCTX "Software\Classes\${PROGID}" "" "${DESCRIPTION}"
  WriteRegStr SHCTX "Software\Classes\${PROGID}" "FriendlyTypeName" "${DESCRIPTION}"
  WriteRegStr SHCTX "Software\Classes\${PROGID}\DefaultIcon" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr SHCTX "Software\Classes\${PROGID}\shell\open" "FriendlyAppName" "Helbaron"
  WriteRegStr SHCTX "Software\Classes\${PROGID}\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""
!macroend

; Lists Helbaron under "Open with" for an extension (OpenWithProgids + SupportedTypes).
!macro HelbaronAddOpenWith EXT PROGID
  WriteRegStr SHCTX "Software\Classes\.${EXT}\OpenWithProgids" "${PROGID}" ""
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".${EXT}" ""
  WriteRegStr SHCTX "Software\Helbaron\Capabilities\FileAssociations" ".${EXT}" "${PROGID}"
!macroend

!macro HelbaronRemoveOpenWith EXT PROGID
  DeleteRegValue SHCTX "Software\Classes\.${EXT}\OpenWithProgids" "${PROGID}"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; Markdown associations already provide their own Open with Helbaron verb.
  !insertmacro HelbaronRegisterExplorerMenu "SystemFileAssociations\.txt" "%1"
  !insertmacro HelbaronRegisterExplorerMenu "SystemFileAssociations\.docx" "%1"
  !insertmacro HelbaronRegisterExplorerMenu "Directory" "%1"
  !insertmacro HelbaronRegisterExplorerMenu "Directory\Background" "%V"

  ; The app itself, as Windows lists it in "Open with" and "Choose another app".
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe" "FriendlyAppName" "Helbaron"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\DefaultIcon" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\shell\open\command" "" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\" $\"%1$\""

  !insertmacro HelbaronRegisterProgId "Helbaron.Markdown" "Markdown document"
  !insertmacro HelbaronRegisterProgId "Helbaron.Text" "Text document"
  !insertmacro HelbaronRegisterProgId "Helbaron.Word" "Word document (opens as Markdown)"

  ; Default apps (Settings > Apps > Default apps > Helbaron).
  WriteRegStr SHCTX "Software\Helbaron\Capabilities" "ApplicationName" "Helbaron"
  WriteRegStr SHCTX "Software\Helbaron\Capabilities" "ApplicationDescription" "Arabic-first Markdown editor that works like Word."
  WriteRegStr SHCTX "Software\Helbaron\Capabilities" "ApplicationIcon" "$\"$INSTDIR\${MAINBINARYNAME}.exe$\",0"
  WriteRegStr SHCTX "Software\RegisteredApplications" "Helbaron" "Software\Helbaron\Capabilities"

  !insertmacro HelbaronAddOpenWith "md" "Helbaron.Markdown"
  !insertmacro HelbaronAddOpenWith "markdown" "Helbaron.Markdown"
  !insertmacro HelbaronAddOpenWith "txt" "Helbaron.Text"
  !insertmacro HelbaronAddOpenWith "docx" "Helbaron.Word"

  ; Tell Explorer to refresh its cached file-association data.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro HelbaronUnregisterExplorerMenu "SystemFileAssociations\.txt" "%1"
  !insertmacro HelbaronUnregisterExplorerMenu "SystemFileAssociations\.docx" "%1"
  !insertmacro HelbaronUnregisterExplorerMenu "Directory" "%1"
  !insertmacro HelbaronUnregisterExplorerMenu "Directory\Background" "%V"

  !insertmacro HelbaronRemoveOpenWith "md" "Helbaron.Markdown"
  !insertmacro HelbaronRemoveOpenWith "markdown" "Helbaron.Markdown"
  !insertmacro HelbaronRemoveOpenWith "txt" "Helbaron.Text"
  !insertmacro HelbaronRemoveOpenWith "docx" "Helbaron.Word"

  DeleteRegKey SHCTX "Software\Classes\Helbaron.Markdown"
  DeleteRegKey SHCTX "Software\Classes\Helbaron.Text"
  DeleteRegKey SHCTX "Software\Classes\Helbaron.Word"
  DeleteRegKey SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe"
  DeleteRegValue SHCTX "Software\RegisteredApplications" "Helbaron"
  DeleteRegKey SHCTX "Software\Helbaron\Capabilities"
  DeleteRegKey /ifempty SHCTX "Software\Helbaron"

  ; Tell Explorer to refresh its cached file-association data.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

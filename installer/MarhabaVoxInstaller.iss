; Script generated for Inno Setup 6
; Marhaba Vox — Production-Grade AI Audio Vocal Platform Windows Setup Script
; Owner: Abdul Rasheed Anjum | Brand: MarhabaPrinters | Location: Hujra Shah Muqeem, Punjab, Pakistan

#define MyAppName "Marhaba Vox"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "MarhabaPrinters"
#define MyAppURL "https://github.com/Arslan6968/Marhaba-Vox"
#define MyAppExeName "MarhabaVox.exe"
#define MyAppContact "marhabapress@gmail.com"

[Setup]
; Unique application GUID
AppId={{5E4C2046-E936-4C18-97A8-C01235B47B89}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
AppContact={#MyAppContact}
AppComments=Marhaba Vox — Every Voice. Every Detail. AI Audio Vocal & Acapella Isolation Platform.
AppCopyright=Copyright (C) 2026 MarhabaPrinters. All rights reserved.

; Installation directories
DefaultDirName={autopf}\Marhaba Vox
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
PrivilegesRequired=none
PrivilegesRequiredOverridesAllowed=commandline dialog

; Output package
OutputBaseFilename=MarhabaVox-Setup
OutputDir=..\release
SetupIconFile=..\app_icon.ico
UninstallDisplayIcon={app}\app_icon.ico

; Compression (Maximum solid LZMA2 compression)
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardResizable=no
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
english.WelcomeLabel1=Welcome to [name] Setup
english.WelcomeLabel2=This will install [name] on your computer.%n%nMarhaba Vox is an AI-powered offline audio separation platform for isolating pristine vocals, acapellas, and backing instrumentals.%n%nParent Brand: MarhabaPrinters%nLocation: Hujra Shah Muqeem, Punjab, Pakistan%nEmail: marhabapress@gmail.com%n%nClick Next to continue, or Cancel to exit Setup.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "..\dist\MarhabaVox\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Close running instance before install
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM MarhabaVox.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;

// Close running instance before uninstall
function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM MarhabaVox.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Result := True;
end;

// Ask user whether to remove personal app settings & history on uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  UserDataDir: String;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    UserDataDir := ExpandConstant('{localappdata}\MarhabaVox');
    if DirExists(UserDataDir) then
    begin
      if MsgBox('Would you like to keep your Marhaba Vox preferences and job history?' + #13#10#13#10 +
                'Click Yes to preserve settings, or No to remove all local application data.' + #13#10 +
                '(Note: Exported songs in your Music folder are never deleted).',
                mbConfirmation, MB_YESNO) = IDNO then
      begin
        DelTree(UserDataDir, True, True, True);
      end;
    end;
  end;
end;

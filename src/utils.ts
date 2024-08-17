import * as vscode from "vscode";


export function getDefaultTerminalType(): string | undefined {
    const platform = process.platform;
    let defaultProfileSetting = '';
    if (platform.includes('win32')) {defaultProfileSetting = 'terminal.integrated.defaultProfile.windows';} 
    else if (platform === 'linux') {defaultProfileSetting = 'terminal.integrated.defaultProfile.linux';}
    else if (platform === 'darwin') {defaultProfileSetting = 'terminal.integrated.defaultProfile.osx';}
    const defaultProfile = vscode.workspace.getConfiguration().get<string>(defaultProfileSetting);
    if (defaultProfile) {return defaultProfile.toLowerCase();}
    return "cmd";
}

export function getDivider(): string {
    const terminalType = getDefaultTerminalType();
    if(terminalType?.includes("powershell")){return ";&";}
    return "&&";
}

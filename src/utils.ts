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

export function getFileUri() : string | undefined{
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    let fileUri: string | undefined = undefined;
    if (tabInput instanceof vscode.TabInputText || tabInput instanceof vscode.TabInputCustom) {
        fileUri = tabInput.uri.toString().replace("file:///", "").replace("%3A", ":");
    }
    return fileUri;
}
import * as vscode from "vscode";
import { exec } from "child_process";

export function getDefaultTerminalType(): string | undefined {
    const platform = process.platform;
    let defaultProfileSetting = '';
    if (platform.includes('win32')) {defaultProfileSetting = 'terminal.integrated.defaultProfile.windows';} 
    else if (platform === 'linux') {defaultProfileSetting = 'terminal.integrated.defaultProfile.linux';}
    else if (platform === 'darwin') {defaultProfileSetting = 'terminal.integrated.defaultProfile.osx';}
    const defaultProfile = vscode.workspace.getConfiguration().get<string>(defaultProfileSetting);
    // vscode.window.showInformationMessage(`Default Profile: ${defaultProfile}`);
    if (defaultProfile) {return defaultProfile.toLowerCase();}
    return "powershell";
}

export function getPathSpecifier(): string | undefined {
    const defaultProfile = getDefaultTerminalType();
    if (defaultProfile?.includes("powershell") || defaultProfile?.includes("bash")) {return "./";}
    return "";
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
        fileUri = tabInput.uri.toString().replace("file:///", "").replace("%3A", ":").replace("%20", " ");
    }
    return fileUri;
}

export const envSetup = async (outputChannel:vscode.OutputChannel, isWin:boolean) => {
    if (!isWin) {return vscode.window.showErrorMessage("This feature is only available on Windows.");}
    exec("rundll32.exe sysdm.cpl,EditEnvironmentVariables", (err, stdout, stderr) => {
                if (err){outputChannel.appendLine(`Error: ${err.message}`);}
                if(stdout){outputChannel.appendLine(`stdout: ${stdout}`);}
                if(stderr){outputChannel.appendLine(`stderr: ${stderr}`);}
        });
    }
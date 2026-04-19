import * as vscode from "vscode";
import { exec } from "child_process";
import configs from "./configs";
import { basename, dirname, extname } from "path";



export default class Utils {


    static placeholders = {
        '{filepath}': () => {
            const fileUri = Utils.getFileUri();
            if (!fileUri) {
                vscode.window.showErrorMessage(
                    "No active file found."
                );
                return '';
            }
            return fileUri;
        },
        '{filepathNoExt}': () => {
            const fileUri = Utils.getFileUri();
            if (!fileUri) {
                vscode.window.showErrorMessage(
                    "No active file found."
                );
                return '';
            }
            return fileUri.replace(extname(fileUri), '');
        },
        '{filename}': () => {
            const fileUri = Utils.getFileUri();
            if (!fileUri) {
                vscode.window.showErrorMessage(
                    "No active file found."
                );
                return '';
            }
            return basename(fileUri);
        },
        '{workspace}': () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage(
                    "No workspace folder found."
                );
                return '';
            }
            return workspaceFolders[0].uri.fsPath;
        },
        '{filedir}': () => {
            const fileUri = Utils.getFileUri();
            if (!fileUri) {
                vscode.window.showErrorMessage(
                    "No active file found."
                );
                return '';
            }
            return dirname(fileUri);
        },
        '{filenameNoExt}': () => {
            const fileUri = Utils.getFileUri();
            if (!fileUri) {
                vscode.window.showErrorMessage(
                    "No active file found."
                );
                return '';
            }
            return basename(fileUri, extname(fileUri));
        },
        '{ext}': () => {
            const fileUri = Utils.getFileUri();
            if (!fileUri) {
                vscode.window.showErrorMessage(
                    "No active file found."
                );
                return '';
            }
            return extname(fileUri);
        },
    }
    
    static getDefaultTerminalType(): string | undefined {
        const platform = process.platform;
        let defaultProfileSetting = '';
        if (platform.includes('win32')) { defaultProfileSetting = 'terminal.integrated.defaultProfile.windows'; }
        else if (platform === 'linux') { defaultProfileSetting = 'terminal.integrated.defaultProfile.linux'; }
        else if (platform === 'darwin') { defaultProfileSetting = 'terminal.integrated.defaultProfile.osx'; }
        const defaultProfile = vscode.workspace.getConfiguration().get<string>(defaultProfileSetting);
        // vscode.window.showInformationMessage(`Default Profile: ${defaultProfile}`);
        if (defaultProfile) { return defaultProfile.toLowerCase(); }
        return "powershell";
    }


    static getFileUri(): string | undefined {
        const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
        let fileUri: string | undefined = undefined;
        if (tabInput instanceof vscode.TabInputText || tabInput instanceof vscode.TabInputCustom) {
            fileUri = tabInput.uri.fsPath;
        }
        return fileUri;
    }

    static replacePlaceholders(command: string): string {
        let result = command;
        for (const [placeholder, func] of Object.entries(Utils.placeholders)) {
            const esc = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(esc, 'g'), func());
        }
        return result;
    }

    
    static getTerminal(name: string=configs.name): vscode.Terminal{
        const terminals = vscode.window.terminals;
        let _terminal = terminals.find(terminal => terminal.name === name);
        if (!_terminal) {
            _terminal = vscode.window.createTerminal({ name });
        }
        return _terminal;
    }


    static getCommand() {
        const file = Utils.getFileUri();
        if (!file) {
            vscode.window.showErrorMessage(
                "No active file found."
            );
            return '';
        }
        const ext = extname(file).replace('.', '');
        const commands = configs.core.get<Record<string, string>>("commands");

        if (!commands) {
            vscode.window.showErrorMessage(
                "No commands configured."
            );
            return '';
        }

        const commandTemplate = commands![ext];
        
        if (!commandTemplate) {
            vscode.window.showErrorMessage(
                `No command configured for ${ext} files.`
            );
            return '';
        }
        return Utils.replacePlaceholders(commandTemplate);
    }


    static async envSetup() {
        if (!configs.isWin) {
            vscode.window.showErrorMessage(
                `Environment management is only for Windows users with no admin permissions!!`
            );
            return;
        }
        exec("rundll32.exe sysdm.cpl,EditEnvironmentVariables", (err, stdout, stderr) => {
            if (err) { configs.outputChannel.appendLine(`Error: ${err.message}`); }
            if (stdout) { configs.outputChannel.appendLine(`stdout: ${stdout}`); }
            if (stderr) { configs.outputChannel.appendLine(`stderr: ${stderr}`); }
        });
    }

}
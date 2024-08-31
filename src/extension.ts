import { basename, dirname, extname } from "path";
import * as vscode from "vscode";
import * as utils from "./utils";
import * as configs from "./configs";
// let extensionUri: vscode.Uri;
let stopDisposable: vscode.Disposable;
let runDisposable: vscode.Disposable;
let restartDisposable: vscode.Disposable;
let showEnvironment:  vscode.Disposable;


export function activate(context: vscode.ExtensionContext) {
    let terminal: vscode.Terminal | undefined;
    const run = async () => {
        try{
            let document = vscode.window.activeTextEditor?.document;
            let fileUri = utils.getFileUri() || "";
            configs.outputChannel.appendLine("File URI: " + fileUri);
            if (!configs.extNames.includes(extname(fileUri))){ 
                return vscode.window.showErrorMessage("Unsupported file type: " + extname(document?.fileName || ""));
            }
            else if(document){
                vscode.commands.executeCommand("setContext", "dry-runner.running", true);
                await document.save();
                terminal = vscode.window.createTerminal({name: 'Dry Runner',});
                let command = utils.getCommand(document, fileUri) as string;
                terminal.sendText(command);
                terminal.show();
            }
        }
        catch(err){
            configs.outputChannel.appendLine("Error: " + err);
            configs.outputChannel.show();
        }
    };

    const stop = async () => {
        vscode.commands.executeCommand("setContext", "dry-runner.running", false);
        terminal?.dispose();
    }

    const restart = async () => {
        terminal?.dispose();
        run();
    }

    const sysEnv = async () => {
        utils.envSetup(configs.outputChannel, configs.isWin);
    }

    // Registering Commands to the extension
    runDisposable = vscode.commands.registerCommand("dry-runner.run", run);
    showEnvironment = vscode.commands.registerCommand("dry-runner.environ", sysEnv);
    stopDisposable = vscode.commands.registerCommand("dry-runner.stop", stop);
    restartDisposable = vscode.commands.registerCommand("dry-runner.restart", restart); 
}


export function deactivate() {
    stopDisposable.dispose();
    runDisposable.dispose();
    restartDisposable.dispose();
    showEnvironment.dispose();
}

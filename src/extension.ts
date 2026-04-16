import * as vscode from "vscode";
import utils from "./utils";
import  configs from "./configs";
import commands from "./commands";

// let extensionUri: vscode.Uri;
let stopDisposable: vscode.Disposable;
let runDisposable: vscode.Disposable;
let restartDisposable: vscode.Disposable;
let showEnvironment:  vscode.Disposable;


export function activate(context: vscode.ExtensionContext) {
    let terminal: vscode.Terminal | undefined;
    const run = async () => commands.run(terminal!);

    const stop = async () => {
        commands.stop(terminal!);
        terminal = undefined;
    }

    const restart = async () => {
        terminal?.dispose();
        commands.restart(terminal!);
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

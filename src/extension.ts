import * as vscode from "vscode";
import utils from "./utils";
import commands from "./commands";

// let extensionUri: vscode.Uri;
let stopDisposable: vscode.Disposable;
let runDisposable: vscode.Disposable;
let restartDisposable: vscode.Disposable;
let showEnvironment:  vscode.Disposable;


export function activate(context: vscode.ExtensionContext) {

    // Registering Commands to the extension
    runDisposable = vscode.commands.registerCommand("dry-runner.run", commands.run);
    showEnvironment = vscode.commands.registerCommand("dry-runner.environ", utils.envSetup);
    stopDisposable = vscode.commands.registerCommand("dry-runner.stop", commands.stop);
    restartDisposable = vscode.commands.registerCommand("dry-runner.restart", commands.restart); 
}


export function deactivate() {
    stopDisposable.dispose();
    runDisposable.dispose();
    restartDisposable.dispose();
    showEnvironment.dispose();
}

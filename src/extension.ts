import { exec, spawn, spawnSync, execSync } from "child_process";
import { basename, dirname, extname } from "path";
import * as vscode from "vscode";

// let extensionUri: vscode.Uri;
let stopDisposable: vscode.Disposable;
let runDisposable: vscode.Disposable;
let restartDisposable: vscode.Disposable;


export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('dry-runner'); //package.json
    const compilerPath = config.get('compilerPath') as string;
    let isEnv = process.env.path?.toLowerCase().includes("mingw");
    const outputChannel = vscode.window.createOutputChannel("Dry Runner");
    const outlog = (message: string) => outputChannel.appendLine(message);
    const errlog = (message: string) => vscode.window.showErrorMessage(message);
    const isWin = process.platform === 'win32';
    let terminal: vscode.Terminal | undefined;
    let compiler:string;
    let c_compiler:string;
    let cpp_compiler:string;
    if(isWin && isEnv==false){
        c_compiler = `${compilerPath}\\gcc.exe`;
        cpp_compiler = `${compilerPath}\\g++.exe`;
    }else{
        c_compiler = 'gcc';
        cpp_compiler = 'g++';
    }

  const run = async () => {
    outputChannel.clear();
    let document: vscode.TextDocument | undefined = undefined;
    for (let textEditor of vscode.window.visibleTextEditors) {
      const fileName = textEditor.document?.fileName || "";
      if (extname(fileName) === '.c' || extname(fileName) === '.cpp'){
        document = textEditor.document;
        }
    }
    if (document!==undefined) {
        const fileName = document?.fileName || "";
        vscode.commands.executeCommand("setContext", "dry-runner.running", true);
        await document?.save();
        const fileBaseName = basename(fileName);
        const fileBaseNameWithoutExt = basename(fileName, extname(fileName)).replace(" ", "_");
        const fileDirectory = dirname(fileName);
        terminal = vscode.window.createTerminal({name: 'Dry Runner',});
        if(document?.languageId==='c'){compiler = c_compiler;}
        else if (document?.languageId==='cpp'){compiler = cpp_compiler;}
        if(isWin){
            terminal.sendText(`${compiler}  "${fileDirectory}\\${fileBaseName}" -o "${fileDirectory}\\${fileBaseNameWithoutExt}.exe"; ${fileDirectory}\\${fileBaseNameWithoutExt}.exe`);
        }
        else{
            terminal.sendText(`${compiler}  "${fileBaseName}" -o "${fileBaseNameWithoutExt}.exe"; ./${fileBaseNameWithoutExt}.exe`);
        }
        terminal.show();
    }
};

  runDisposable = vscode.commands.registerCommand("dry-runner.run", run);
  stopDisposable = vscode.commands.registerCommand("dry-runner.stop", () => {
    vscode.commands.executeCommand("setContext", "dry-runner.running", false);
    terminal?.dispose();});

  restartDisposable = vscode.commands.registerCommand("dry-runner.restart", async () => {
    terminal?.dispose();run();
  });

  context.subscriptions.push(runDisposable);
  context.subscriptions.push(stopDisposable);
  context.subscriptions.push(restartDisposable);
}

vscode.window.onDidCloseTerminal(t => {
    if (t.exitStatus && t.exitStatus.code) {
        vscode.window.showInformationMessage(`Exit code: ${t.exitStatus.code}`);
    }
  });

export function deactivate() {
    stopDisposable.dispose();
    runDisposable.dispose();
    restartDisposable.dispose();
}
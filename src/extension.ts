import { exec, spawn, spawnSync, execSync } from "child_process";
import { basename, dirname, extname } from "path";
import * as vscode from "vscode";
let terminal: vscode.Terminal | undefined;
// let extensionUri: vscode.Uri;


function isCommandAvailable(command: string): boolean {
    try {
        const commandToRun = process.platform === 'win32' ? 'where' : 'which';
        execSync(`${commandToRun} ${command}`);
        return true;
    } catch (error) {
        return false;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('dryrun');
    const isWin = process.platform === 'win32';
    const outputChannel = vscode.window.createOutputChannel("Dry Runner");
    if(!isCommandAvailable('gcc') || !isCommandAvailable('g++')){
        vscode.window.showErrorMessage("You can update compiler path in settings.");}
    const compilerPath = 'C:\\mingw64\\bin' || config.get('compilerPath');
    vscode.window.showInformationMessage(`Current compiler path: ${compilerPath} | ${config.get('compilerPath')}`);
    if (!process.env.path?.includes(compilerPath)) {
        process.env.path += compilerPath + ';';
  }

  const run = async () => {
    outputChannel.clear();
    let document;
    for (let textEditor of vscode.window.visibleTextEditors) {
      const fileName = textEditor.document?.fileName || "";
      if (extname(fileName) === '.c' || extname(fileName) === '.cpp') {
        document = textEditor.document;
      }
    }
    const fileName = document?.fileName || "";
    vscode.commands.executeCommand("setContext", "dry-runner.running", true);
    await document?.save();
    const fileBaseName = basename(fileName);
    const fileBaseNameWithoutExt = basename(fileName, extname(fileName)).replace(" ", "_");
    const fileDirectory = dirname(fileName);
    let compiler;
    
    if (document?.languageId === 'c') {
        if(isWin){compiler = `gcc.exe`;}
        else{compiler = 'gcc';}
    }
    else {
        if(isWin){compiler = `g++.exe`;}
        else{compiler = 'g++';}
        }
    
    terminal = terminal ?? vscode.window.createTerminal({name: 'Dry Runner',});
    terminal.sendText(`g++ "${fileBaseName}" -o "${fileBaseNameWithoutExt}.exe"; ./${fileBaseNameWithoutExt}.exe`);
    terminal.show();
    vscode.commands.executeCommand("setContext", "dry-runner.running", false);
  };

  const runDisposable = vscode.commands.registerCommand("dry-runner.run", run);
  const stopDisposable = vscode.commands.registerCommand("dry-runner.stop", () => {
    terminal?.dispose();
});
  const restartDisposable = vscode.commands.registerCommand("dry-runner.restart", async () => {
    vscode.commands.executeCommand("setContext", "dry-runner.running", false);
    terminal?.dispose();
    run();
  });

  context.subscriptions.push(runDisposable);
  context.subscriptions.push(stopDisposable);
  context.subscriptions.push(restartDisposable);
}


export function deactivate() { }


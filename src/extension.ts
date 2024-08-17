// import { exec, spawn, spawnSync, execSync } from "child_process";
import { basename, dirname, extname } from "path";
import * as vscode from "vscode";
import * as utils from "./utils";
// let extensionUri: vscode.Uri;
let stopDisposable: vscode.Disposable;
let runDisposable: vscode.Disposable;
let restartDisposable: vscode.Disposable;
const extNames = ['.c', '.cpp', '.java', '.py', '.js', '.php'];
let paths = {
    mingw: "",
    java: "",
    python: "",
    node : "",
    php : "",
};

export function activate(context: vscode.ExtensionContext) {
    const Env = process.env;
    Env.path?.toLowerCase().split(";").forEach(path => {
        if (path.includes("mingw")) {paths["mingw"] = path; }
        if (path.includes("jdk")) {paths["java"] = path; }
        if (path.includes("python") && path.includes("scripts")!=true) {paths["python"] = path; }
        if (path.includes("node")) {paths["node"] = path; }
        if (path.includes("php")) {paths["php"] = path; }
    });
    const config = vscode.workspace.getConfiguration('dry-runner'); //package.json
    const mingwpath = config.get('mingwPath') || paths.mingw as string;
    const javapath = config.get('jdkPath') || paths.java as string;
    const pythonpath = config.get('pythonPath') || paths.python as string;
    const nodepath = config.get('nodePath') || paths.node as string;
    const phppath = config.get('phpPath') || paths.php as string;
    const isWin = process.platform === 'win32';
    let terminal: vscode.Terminal | undefined;
    
    function getCommand(document:vscode.TextDocument){
        const divider = utils.getDivider();
        const prefix = divider === "&&"? null:"& ";
        
        let dir = dirname(document.fileName);
        let ext = extname(document.fileName).toString();
        let noExt = basename(document.fileName, extname(document.fileName)).replace(" ", "_")
        let binPath: { [key: string]: string } = {
            c:  `${mingwpath}\\gcc`,
            cpp: `${mingwpath}\\g++`,
            javac: `${javapath}\\javac`,
            java : `${javapath}\\java`,
            py : `${pythonpath}\\python`,
            js : `${nodepath}\\node`,
            php : `${phppath}\\php`,
        }
        let runCmd: { [key: string]: string } = {
            ".c"   : `"${binPath.c}" "${dir}\\${basename(document.fileName)}" -o "${dir}\\${noExt}" ${divider} ${dir}\\${noExt}`,
            ".cpp" : `"${binPath.cpp}" "${dir}\\${basename(document.fileName)}" -o "${dir}\\${noExt}" ${divider} "${dir}\\${noExt}"`,
            ".java": `cd "${dir}" ${divider} "${binPath.javac}" "${basename(document.fileName)}" ${divider} "${binPath.java}" "${basename(document.fileName).replace(".java","")}"`,
            ".py"  : `"${binPath.py}" "${dir}\\${basename(document.fileName)}"`,
            ".js"  : `"${binPath.js}" "${dir}\\${basename(document.fileName)}"`,
            ".php" : `"${binPath.php}" "${dir}\\${basename(document.fileName)}"`,
        }
        if(prefix){return prefix + runCmd[ext];}
        return  runCmd[ext];
    }

    const run = async () => {
        let document:vscode.TextDocument | undefined = undefined;
        for (let textEditor of vscode.window.visibleTextEditors) {
            const fileName = textEditor.document?.fileName || "";
            if (extNames.includes(extname(fileName))){document = textEditor.document; }
        }
        if(document){
            const fileName = document.fileName;
            vscode.commands.executeCommand("setContext", "dry-runner.running", true);
            await document.save();
            terminal = vscode.window.createTerminal({name: 'Dry Runner',});
            let command = getCommand(document) as string;
            terminal.sendText(command);
            terminal.show();
        }
    };
    
    runDisposable = vscode.commands.registerCommand("dry-runner.run", run);
    stopDisposable = vscode.commands.registerCommand("dry-runner.stop", () => {
      vscode.commands.executeCommand("setContext", "dry-runner.running", false);
      terminal?.dispose();});
  
    restartDisposable = vscode.commands.registerCommand("dry-runner.restart", async () => {
      terminal?.dispose();
      run();
    });  
}

export function deactivate() {
    stopDisposable.dispose();
    runDisposable.dispose();
    restartDisposable.dispose();
}

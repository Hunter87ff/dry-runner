// import { exec, spawn, spawnSync, execSync } from "child_process";
import { basename, dirname, extname } from "path";
import * as vscode from "vscode";
import * as utils from "./utils";
// let extensionUri: vscode.Uri;
let stopDisposable: vscode.Disposable;
let runDisposable: vscode.Disposable;
let restartDisposable: vscode.Disposable;
const extNames = ['.c', '.cpp', '.java', '.py', '.js', '.php', '.kt', '.bat', '.exe', '.sh', '.ps1', '.pyz', '.jar', '.class'];
let paths = {
    mingw: "",
    java: "",
    python: "",
    node : "",
    php : "",
    kt : ""
};

export function activate(context: vscode.ExtensionContext) {
    const Env = process.env;
    Env.path?.toLowerCase().split(";").forEach(path => {
        if (path.includes("mingw")) {paths["mingw"] = path; }
        if (path.includes("jdk")) {paths["java"] = path; }
        if (path.includes("python") && path.includes("scripts")!=true) {paths["python"] = path; }
        if (path.includes("node")) {paths["node"] = path; }
        if (path.includes("php")) {paths["php"] = path; }
        if (path.includes("kotlinc")) {paths["kt"] = path; }
    });
    
    const outputChannel = vscode.window.createOutputChannel("Dry Runner");
    const config = vscode.workspace.getConfiguration('dry-runner'); //package.json
    const mingwpath = config.get('mingwPath') || paths.mingw as string;
    const javapath = config.get('jdkPath') || paths.java as string;
    const pythonpath = config.get('pythonPath') || paths.python as string;
    const nodepath = config.get('nodePath') || paths.node as string;
    const phppath = config.get('phpPath') || paths.php as string;
    const ktcpath = config.get("ktPath");
    const isWin = process.platform === 'win32';
    let terminal: vscode.Terminal | undefined;
    
    function getCommand(document:vscode.TextDocument, fileUri:string){
        try{
            const divider = utils.getDivider();
            const prefix = divider === "&&"? null:"& "; //prefix syntax for powershell
            const psPathSpecifier = utils.getPathSpecifier() //special executable path specifier for powershell
            
            let dir = dirname(document.fileName) || fileUri;
            let ext = extname(document.fileName).toString() || extname(fileUri);
            let noExt = basename(document.fileName, extname(document.fileName)).replace(" ", "_") || basename(fileUri, extname(fileUri)).replace(" ", "_");
            let binPath: { [key: string]: string } = {
                c:  `${mingwpath}\\gcc`,
                cpp: `${mingwpath}\\g++`,
                javac: `${javapath}\\javac`,
                java : `${javapath}\\java`,
                py : `${pythonpath}\\python`,
                js : `${nodepath}\\node`,
                php : `${phppath}\\php`,
                kt : (isWin && ktcpath)? `${ktcpath}\\kotlinc.bat`: "kotlinc"
            }
            let runCmd: { [key: string]: string } = {
                ".c"   : `cd "${dir}" ${divider} "${binPath.c}" "${dir}\\${basename(document.fileName)}" -o "${dir}\\${noExt}" ${divider} "${psPathSpecifier}${noExt}"`,
                ".cpp" : `cd "${dir}" ${divider} "${binPath.cpp}" "${dir}\\${basename(document.fileName)}" -o "${dir}\\${noExt}" ${divider} "${psPathSpecifier}${noExt}"`,
                ".java": `cd "${dir}" ${divider} "${binPath.javac}" "${basename(document.fileName)}" ${divider} "${binPath.java}" "${noExt}"`,
                ".py"  : `cd "${dir}" ${divider} "${binPath.py}" "${dir}\\${basename(document.fileName)}"`,
                ".js"  : `cd "${dir}" ${divider} "${binPath.js}" "${dir}\\${basename(document.fileName)}"`,
                ".php" : `cd "${dir}" ${divider} "${binPath.php}" "${dir}\\${basename(document.fileName)}"`,
                ".kt"  : `cd "${dir}" ${divider} "${binPath.kt}" "${dir}\\${basename(document.fileName)}" -include-runtime -d ${noExt}.jar ${divider} java -jar ${noExt}.jar`,
                ".bat" : `cd "${dir}" ${divider} "${dir}\\${basename(document.fileName)}"`,
                ".exe" : `cd "${dir}" ${divider} "${dir}\\${basename(fileUri, extname(fileUri))}.exe"`,
                ".sh"  : `cd "${dir}" ${divider} "bash" "${dir}\\${basename(document.fileName)}"`,
                ".ps1" : `cd "${dir}" ${divider} "powershell" "${dir}\\${basename(document.fileName)}"`,
                ".pyz" : `cd "${dir}" ${divider} "${binPath.py}" "${dir}\\${basename(document.fileName)}"`,
                ".jar" : `cd "${dir}" ${divider} "java" -jar "${dir}\\${basename(fileUri, extname(fileUri))}.jar"`,
                ".class":`cd "${dir}" ${divider} "java" "${basename(fileUri, extname(fileUri))}"`,
            }
            if(prefix){return prefix + runCmd[ext];}
            return  runCmd[ext];
        }
        catch(err){
            outputChannel.appendLine("Error: " + err);
        }
    }

    const run = async () => {
        try{
            let document = vscode.window.activeTextEditor?.document;
            let fileUri = utils.getFileUri() || "";
            outputChannel.appendLine("File URI: " + fileUri);
            if (!extNames.includes(extname(fileUri))){ 
                return vscode.window.showErrorMessage("Unsupported file type: " + extname(document?.fileName || ""));
            }

            if(document){
                vscode.commands.executeCommand("setContext", "dry-runner.running", true);
                await document.save();
                terminal = vscode.window.createTerminal({name: 'Dry Runner',});
                let command = getCommand(document, fileUri) as string;
                terminal.sendText(command);
                terminal.show();
            }
        }catch(err){
            outputChannel.appendLine("Error: " + err);
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

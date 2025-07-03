import * as vscode from "vscode";
import { exec } from "child_process";
import * as configs from "./configs";
import { basename, dirname, extname } from "path";


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

/*
this could be implimented in a better way, but this works for now
ps   : cd "d:\github\dry-runner\test\" ; if ($?) { g++ test.cpp -o test } ; if ($?) { .\test }
cmd  : cd "d:\github\dry-runner\test\" && g++ test.cpp -o test && "d:\github\dry-runner\test\"test
bash : cd "d:\github\dry-runner\test\" && g++ test.cpp -o test && "d:\github\dry-runner\test\"test
*/

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

export function getCommand(document:vscode.TextDocument, fileUri:string){
    try{
        const divider = getDivider();
        const prefix = divider === "&&"? null:"& "; //prefix syntax for powershell
        const psPathSpecifier = getPathSpecifier() //special executable path specifier for powershell
        
        let dir = dirname(document.fileName) || fileUri;
        let ext = extname(document.fileName).toString() || extname(fileUri); 
        let noExt = basename(document.fileName, extname(document.fileName)).replace(" ", "_") || basename(fileUri, extname(fileUri)).replace(" ", "_"); //just the file name without extension
        let binPath: { [key: string]: string } = {
            c:  `${configs.mingwpath}\\gcc`,
            cpp: `${configs.mingwpath}\\g++`,
            javac: `${configs.javapath}\\javac`,
            java : `${configs.javapath}\\java`,
            py : `${configs.pythonpath}\\python`,
            js : `${configs.nodepath}\\node`,
            php : `${configs.phppath}\\php`,
            kt : (configs.isWin && configs.ktcpath)? `${configs.ktcpath}\\kotlinc.bat`: "kotlinc",
            dart : `${configs.dartpath}\\dart`,
            go : `${configs.gopath}\\go`,
        }
        let runCmd: { [key: string]: string } = {
            // Executable files
            ".sh"  : `cd "${dir}" ${divider} "bash" "${dir}\\${basename(document.fileName)}"`,
            ".ps1" : `cd "${dir}" ${divider} "powershell" "${dir}\\${basename(document.fileName)}"`,
            ".pyz" : `cd "${dir}" ${divider} "${binPath.py}" "${dir}\\${basename(document.fileName)}"`,
            ".jar" : `cd "${dir}" ${divider} "java" -jar "${dir}\\${basename(fileUri, extname(fileUri))}.jar"`,
            ".bat" : `cd "${dir}" ${divider} "${dir}\\${basename(document.fileName)}"`,
            ".exe" : `cd "${dir}" ${divider} "${dir}\\${basename(fileUri, extname(fileUri))}.exe"`,
            ".class":`cd "${dir}" ${divider} "java" "${basename(fileUri, extname(fileUri))}"`,

            // Compilation and execution commands
            ".c"   : `cd "${dir}" ${divider} "${binPath.c}" "${dir}\\${basename(document.fileName)}" -o "${dir}\\${noExt}" ${divider} "${psPathSpecifier}${noExt}"`,
            ".cpp" : `cd "${dir}" ${divider} "${binPath.cpp}" "${dir}\\${basename(document.fileName)}" -o "${dir}\\${noExt}" ${divider} "${psPathSpecifier}${noExt}"`,
            ".java": `cd "${dir}" ${divider} "${binPath.javac}" "${basename(document.fileName)}" ${divider} "${binPath.java}" "${noExt}"`,
            ".py"  : `cd "${dir}" ${divider} "${binPath.py}" "${dir}\\${basename(document.fileName)}"`,
            ".js"  : `cd "${dir}" ${divider} "${binPath.js}" "${dir}\\${basename(document.fileName)}"`,
            ".php" : `cd "${dir}" ${divider} "${binPath.php}" "${dir}\\${basename(document.fileName)}"`,
            ".kt"  : `cd "${dir}" ${divider} "${binPath.kt}" "${dir}\\${basename(document.fileName)}" -include-runtime -d ${noExt}.jar ${divider} java -jar ${noExt}.jar`,
            ".dart": `cd "${dir}" ${divider} "${binPath.dart}" "${dir}\\${basename(document.fileName)}"`,
            ".ts"  : `cd "${dir}" ${divider} ts-node "${dir}\\${basename(document.fileName)}"`,
            ".go"  : `cd "${dir}" ${divider} "${binPath.go}" run "${dir}\\${basename(document.fileName)}"`,
        }
        if(prefix){return prefix + runCmd[ext];}
        return  runCmd[ext];
    }
    catch(err){
        configs.outputChannel.appendLine("Error: " + err);
    }
}

export async function envSetup(outputChannel:vscode.OutputChannel, isWin:boolean){
    if (!isWin) {return vscode.window.showErrorMessage("This feature is only available on Windows.");}
    exec("rundll32.exe sysdm.cpl,EditEnvironmentVariables", (err, stdout, stderr) => {
                if (err){outputChannel.appendLine(`Error: ${err.message}`);}
                if(stdout){outputChannel.appendLine(`stdout: ${stdout}`);}
                if(stderr){outputChannel.appendLine(`stderr: ${stderr}`);}
    });
}


import {window, workspace} from 'vscode';

export const extNames = ['.c', '.cpp', '.java', '.py', '.js', '.php', '.kt', '.bat', '.exe', '.sh', '.ps1', '.pyz', '.jar', '.class', '.dart', '.ts']; //supported file extensions
let paths = {
    mingw: "",
    java: "",
    python: "",
    node : "",
    php : "",
    kt : "",
    dart : ""
};

const Env = process.env;
/* You might say why im accessing them one by one instead of whole to string?
So the problem is the path!! i won't get the simple executable bin path in that case. so thats why im checking one by one..
If you have any other optimized solution please don't forget to raise a pull request..
Your contributions are much appriciated. Thanks*/
Env.path?.toLowerCase().split(";").forEach(path => {
    if (path.includes("mingw")) {paths["mingw"] = path; }
    if (path.includes("jdk")) {paths["java"] = path; }
    if (path.includes("python") && path.includes("scripts")!=true) {paths["python"] = path; }
    if (path.includes("node")) {paths["node"] = path; }
    if (path.includes("php")) {paths["php"] = path; }
    if (path.includes("kotlinc")) {paths["kt"] = path; }
    if (path.includes("dart")) {paths["dart"] = path; }
});

export const isWin = process.platform === 'win32';
export const outputChannel = window.createOutputChannel("Dry Runner");
export const core = workspace.getConfiguration('dry-runner'); //core.json
export const mingwpath = core.get('mingwPath') || paths.mingw as string;
export const javapath = core.get('jdkPath') || paths.java as string;
export const pythonpath = core.get('pythonPath') || paths.python as string;
export const nodepath = core.get('nodePath') || paths.node as string;
export const phppath = core.get('phpPath') || paths.php as string;
export const ktcpath = core.get("ktPath") || paths.kt as string;
export const dartpath = core.get("dartPath") || paths.dart as string;
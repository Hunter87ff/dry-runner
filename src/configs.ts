import {window, workspace} from 'vscode';

const configs = workspace.getConfiguration('dry-runner');

export default {
    name : 'Dry Runner',
    identifier: "dry-runner",
    isWin: process.platform === 'win32',
    outputChannel: window.createOutputChannel("Dry Runner"),
    core: configs
}
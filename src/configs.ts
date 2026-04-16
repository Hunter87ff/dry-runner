import {window, workspace} from 'vscode';

const configs = workspace.getConfiguration('dry-runner');

export default {
    isWin: process.platform === 'win32',
    outputChannel: window.createOutputChannel("Dry Runner"),
    core: configs
}
import * as vscode from 'vscode';
import configs from './configs';
import utils from './utils';


export default class Commands {

    static async run() {
        try {
            let document = vscode.window.activeTextEditor?.document;
            let fileUri = utils.getFileUri() || "";
            configs.outputChannel.appendLine("File URI: " + fileUri);
            let command = utils.getCommand();
            if (!command) { return }

            else if (document) {
                vscode.commands.executeCommand("setContext", "dry-runner.running", true);
                await document.save();
                const terminal = utils.getTerminal();
                terminal.sendText(command);
                terminal.show();
            }
        }
        catch (err) {
            configs.outputChannel.appendLine("Error: " + err);
            configs.outputChannel.show();
        }
    };


    static async stop() {
        vscode.commands.executeCommand("setContext", "dry-runner.running", false);
        const terminal = utils.getTerminal();
        terminal?.dispose();
    }

    static async restart() {
        const terminal = utils.getTerminal();
        terminal?.dispose();
        Commands.run();
    }
}
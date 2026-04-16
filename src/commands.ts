import * as vscode from 'vscode';
import configs from './configs';
import utils from './utils';


export default class Commands {

    static async run(terminal: vscode.Terminal) {
        try {
            let document = vscode.window.activeTextEditor?.document;
            let fileUri = utils.getFileUri() || "";
            configs.outputChannel.appendLine("File URI: " + fileUri);
            let command = utils.getCommand();
            if (!command) { return }

            else if (document) {
                vscode.commands.executeCommand("setContext", "dry-runner.running", true);
                await document.save();
                terminal = vscode.window.createTerminal({ name: 'Dry Runner', });
                terminal.sendText(command);
                terminal.show();
            }
        }
        catch (err) {
            configs.outputChannel.appendLine("Error: " + err);
            configs.outputChannel.show();
        }
    };


    static async stop(terminal: vscode.Terminal) {
        vscode.commands.executeCommand("setContext", "dry-runner.running", false);
        terminal?.dispose();
    }

    static async restart(terminal: vscode.Terminal) {
        terminal?.dispose();
        Commands.run(terminal);
    }
}
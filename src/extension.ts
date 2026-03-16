import * as vscode from "vscode";
import { exec } from "child_process";

let lastBranch: string | undefined;

function execGit(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (err, stdout) => {
      if (err) {
        resolve("");
        return;
      }

      resolve(stdout.trim());
    });
  });
}

async function getBranch(): Promise<string> {
  const folder = vscode.workspace.workspaceFolders?.[0];

  if (!folder) return "";

  return execGit("git rev-parse --abbrev-ref HEAD", folder.uri.fsPath);
}

function applyColor(color: string) {
  const colors = {
    "statusBar.background": color,
    "statusBar.noFolderBackground": color,

    "titleBar.activeBackground": color,
    "titleBar.inactiveBackground": color,

    "activityBar.background": color,
  };

  vscode.workspace
    .getConfiguration()
    .update(
      "workbench.colorCustomizations",
      colors,
      vscode.ConfigurationTarget.Workspace,
    );
}

async function updateColor() {
  const branch = await getBranch();

  if (!branch || branch === lastBranch) return;

  lastBranch = branch;

  const config = vscode.workspace.getConfiguration("gitBranchColor");

  const rules = config.get<any[]>("rules") || [];

  let color = "#444444";

  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern);

      if (regex.test(branch)) {
        color = rule.color;
        break;
      }
    } catch {}
  }

  applyColor(color);
}

async function addRuleUI() {

 const pattern = await vscode.window.showInputBox({
  prompt: "Enter branch name or regex pattern",
  placeHolder: "example: feature/.* or main"
 })

 if (!pattern) return

 const color = await vscode.window.showInputBox({
  prompt: "Enter color (hex)",
  placeHolder: "#ff0000"
 })

 if (!color) return

 const config = vscode.workspace.getConfiguration("gitBranchColor")

 const rules = config.get<any[]>("rules") || []

 rules.push({
  pattern: pattern,
  color: color
 })

 await config.update(
  "rules",
  rules,
  vscode.ConfigurationTarget.Global
 )

 vscode.window.showInformationMessage(
  `Branch rule added: ${pattern} → ${color}`
 )

 updateColor()
}

export function activate(context: vscode.ExtensionContext) {
  updateColor();

  const watcher = vscode.workspace.createFileSystemWatcher("**/.git/HEAD");

  watcher.onDidChange(updateColor);
  watcher.onDidCreate(updateColor);

  const refreshCommand = vscode.commands.registerCommand(
    "gitBranchColor.refresh",
    updateColor,
  );

  const addRuleCommand = vscode.commands.registerCommand(
    "gitBranchColor.addRule",
    addRuleUI
  );

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("gitBranchColor")) {
      updateColor();
    }
  });

  context.subscriptions.push(watcher, refreshCommand, addRuleCommand, configListener);
}

export function deactivate() {}

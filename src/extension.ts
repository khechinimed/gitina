import * as vscode from "vscode";
import { exec } from "child_process";
import { COLOR_PALETTE } from "./colorPalette";

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

type BranchRuleOption = vscode.QuickPickItem & {
 mode: "preset" | "branchName" | "customRegex"
 pattern?: string
}

function escapeRegExp(value: string): string {
 return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function pickColor(): Promise<string | undefined> {

 const selected = await vscode.window.showQuickPick(
  COLOR_PALETTE.map(c => ({
   label: c,
   description: "Preview",
   detail: `Color ${c}`
  })),
  {
   placeHolder: "Pick a color for this branch"
  }
 )

 return selected?.label
}

async function addRuleWizard() {

 const branchType = await vscode.window.showQuickPick<BranchRuleOption>([
  { label: "main", description: "Main production branch", mode: "preset", pattern: "^main$" },
  { label: "develop", description: "Development branch", mode: "preset", pattern: "^develop$" },
  { label: "release/*", description: "Release branches", mode: "preset", pattern: "^release\\/.*$" },
  { label: "feature/*", description: "Feature branches", mode: "preset", pattern: "^feature\\/.*$" },
  { label: "hotfix/*", description: "Hotfix branches", mode: "preset", pattern: "^hotfix\\/.*$" },
  { label: "bugfix/*", description: "Bugfix branches", mode: "preset", pattern: "^bugfix\\/.*$" },
  { label: "chore/*", description: "Maintenance branches", mode: "preset", pattern: "^chore\\/.*$" },
  { label: "refactor/*", description: "Refactor branches", mode: "preset", pattern: "^refactor\\/.*$" },
  { label: "docs/*", description: "Documentation branches", mode: "preset", pattern: "^docs\\/.*$" },
  { label: "test/*", description: "Test branches", mode: "preset", pattern: "^test\\/.*$" },
  { label: "branch name", description: "Type an exact branch name", mode: "branchName" },
  { label: "custom regex", description: "Custom regex pattern", mode: "customRegex" }
 ], {
  placeHolder: "Select branch type"
 })

 if (!branchType) return

 let pattern = branchType.pattern || ""
 let displayPattern = branchType.label

 if (branchType.mode === "branchName") {

  const branchName = await vscode.window.showInputBox({
   prompt: "Enter branch name",
   placeHolder: "example: sprint-42"
  })

  if (!branchName) return

  displayPattern = branchName
  pattern = `^${escapeRegExp(branchName)}$`
 }

 if (branchType.mode === "customRegex") {

  const custom = await vscode.window.showInputBox({
   prompt: "Enter regex for branch"
  })

  if (!custom) return

  displayPattern = custom
  pattern = custom
 }

 if (!pattern) return

 const color = await pickColor()

 if (!color) return

 const config = vscode.workspace.getConfiguration("gitBranchColor")

 const rules = config.get<any[]>("rules") || []

 rules.push({
  pattern,
  color
 })

 await config.update(
  "rules",
  rules,
  vscode.ConfigurationTarget.Global
 )

 vscode.window.showInformationMessage(
  `Rule added: ${displayPattern} → ${color}`
 )

}

async function removeRuleUI() {

 const config = vscode.workspace.getConfiguration("gitBranchColor")

 const rules = config.get<any[]>("rules") || []

 if (rules.length === 0) {
  vscode.window.showInformationMessage("No rules configured")
  return
 }

 const pick = await vscode.window.showQuickPick(

  rules.map((r, i) => ({
   label: r.pattern,
   description: r.color,
   index: i
  })),

  {
   placeHolder: "Select rule to remove"
  }

 )

 if (!pick) return

 rules.splice(pick.index, 1)

 await config.update(
  "rules",
  rules,
  vscode.ConfigurationTarget.Global
 )

 vscode.window.showInformationMessage("Rule removed")
}

async function listRulesUI() {

 const config = vscode.workspace.getConfiguration("gitBranchColor")

 const rules = config.get<any[]>("rules") || []

 if (rules.length === 0) {
  vscode.window.showInformationMessage("No rules configured")
  return
 }

 const items = rules.map(r => ({
  label: r.pattern,
  description: r.color
 }))

 vscode.window.showQuickPick(items, {
  placeHolder: "Configured branch color rules"
 })
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
    addRuleWizard
  );

  const removeRuleCommand = vscode.commands.registerCommand(
    "gitBranchColor.removeRule",
    removeRuleUI
  );

  const listRulesCommand = vscode.commands.registerCommand(
    "gitBranchColor.listRules",
    listRulesUI
  );

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("gitBranchColor")) {
      updateColor();
    }
  });

  context.subscriptions.push(watcher, refreshCommand, addRuleCommand, removeRuleCommand, listRulesCommand, configListener);
}

export function deactivate() {}

import * as vscode from "vscode";
import {
  addRuleWizard,
  listRulesUI,
  removeRuleUI,
} from "./commands/rulesCommands";
import { getBranch } from "./services/gitService";
import { getConfiguredRules } from "./services/rulesService";
import { GitinaSidebarProvider } from "./ui/sidebarProvider";
import { updateBranchStatus } from "./ui/statusBar";
import { applyColor } from "./theme/themeService";

let lastBranch: string | undefined;
let lastColor: string | undefined;
let branchStatusItem: vscode.StatusBarItem | undefined;
let sidebarProvider: GitinaSidebarProvider | undefined;

async function updateColor(force = false) {
  const branch = await getBranch();
  const rules = getConfiguredRules();

  if (!branch) {
    branchStatusItem?.hide();
    sidebarProvider?.setState({
      rules,
    });
    return;
  }

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

  updateBranchStatus(branchStatusItem, branch, color);
  sidebarProvider?.setState({
    branch,
    color,
    rules,
  });

  if (!force && branch === lastBranch && color === lastColor) return;

  lastBranch = branch;
  lastColor = color;

  await applyColor(color);
}

export function activate(context: vscode.ExtensionContext) {
  branchStatusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  branchStatusItem.name = "Git Branch Color";
  branchStatusItem.command = "gitBranchColor.refresh";

  sidebarProvider = new GitinaSidebarProvider();

  const sidebarRegistration = vscode.window.registerTreeDataProvider(
    "gitBranchColor.sidebarView",
    sidebarProvider,
  );

  void updateColor(true);

  const watcher = vscode.workspace.createFileSystemWatcher("**/.git/HEAD");
  const refreshFromGit = () => {
    void updateColor();
  };

  watcher.onDidChange(refreshFromGit);
  watcher.onDidCreate(refreshFromGit);

  const refreshCommand = vscode.commands.registerCommand(
    "gitBranchColor.refresh",
    async () => {
      await updateColor(true);
    },
  );

  const addRuleCommand = vscode.commands.registerCommand(
    "gitBranchColor.addRule",
    async () => {
      await addRuleWizard();
      await updateColor(true);
    },
  );

  const removeRuleCommand = vscode.commands.registerCommand(
    "gitBranchColor.removeRule",
    async () => {
      await removeRuleUI();
      await updateColor(true);
    },
  );

  const listRulesCommand = vscode.commands.registerCommand(
    "gitBranchColor.listRules",
    listRulesUI
  );

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("gitBranchColor")) {
      void updateColor(true);
    }
  });

  context.subscriptions.push(
    branchStatusItem,
    sidebarRegistration,
    watcher,
    refreshCommand,
    addRuleCommand,
    removeRuleCommand,
    listRulesCommand,
    configListener,
  );
}

export function deactivate() {}
import * as vscode from "vscode";
import {
  addRuleWizard,
  editRuleColorUI,
  listRulesUI,
  manageSensitiveBranchesUI,
  removeRuleUI,
} from "./commands/rulesCommands";
import { getBranch } from "./services/gitService";
import { getConfiguredRules, getAllRules, toggleRule } from "./services/rulesService";
import { exportProfile, importProfile } from "./services/teamProfileService";
import { GitinaSidebarProvider, RuleTreeItem } from "./ui/sidebarProvider";
import { updateBranchStatus } from "./ui/statusBar";
import { applyColor } from "./theme/themeService";

let lastBranch: string | undefined;
let lastColor: string | undefined;
let branchStatusItem: vscode.StatusBarItem | undefined;
let sidebarProvider: GitinaSidebarProvider | undefined;

async function updateColor(force = false) {
  const branch = await getBranch();
  const activeRules = getConfiguredRules();
  const allRules = getAllRules();

  if (!branch) {
    branchStatusItem?.hide();
    sidebarProvider?.setState({
      rules: allRules,
    });
    return;
  }

  let color = "#444444";

  for (const rule of activeRules) {
    try {
      const regex = new RegExp(rule.pattern);

      if (regex.test(branch)) {
        color = rule.color;
        break;
      }
    } catch {}
  }

  const isSensitive = isSensitiveBranch(branch);

  updateBranchStatus(branchStatusItem, branch, color, isSensitive);
  sidebarProvider?.setState({
    branch,
    color,
    rules: allRules,
    isSensitive,
  });

  if (!force && branch === lastBranch && color === lastColor) { return; }

  lastBranch = branch;
  lastColor = color;

  await applyColor(color);
}

function isSensitiveBranch(branch: string): boolean {
  const config = vscode.workspace.getConfiguration("gitBranchColor");
  if (!config.get<boolean>("sensitiveBranchesEnabled", true)) { return false; }
  const patterns = config.get<string[]>("sensitiveBranches", ["main", "production", "release"]);
  return patterns.some((p) => {
    try { return new RegExp(`^${p}$`).test(branch); } catch { return branch === p; }
  });
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

  const disableRuleCommand = vscode.commands.registerCommand(
    "gitBranchColor.disableRule",
    async (item: RuleTreeItem) => {
      await toggleRule(item.ruleIndex);
      await updateColor(true);
    },
  );

  const enableRuleCommand = vscode.commands.registerCommand(
    "gitBranchColor.enableRule",
    async (item: RuleTreeItem) => {
      await toggleRule(item.ruleIndex);
      await updateColor(true);
    },
  );

  const editRuleColorCommand = vscode.commands.registerCommand(
    "gitBranchColor.editRuleColor",
    async (item: RuleTreeItem) => {
      await editRuleColorUI(item.ruleIndex);
      await updateColor(true);
    },
  );

  const exportProfileCommand = vscode.commands.registerCommand(
    "gitBranchColor.exportProfile",
    exportProfile,
  );

  const importProfileCommand = vscode.commands.registerCommand(
    "gitBranchColor.importProfile",
    async () => {
      await importProfile();
      await updateColor(true);
    },
  );

  const listRulesCommand = vscode.commands.registerCommand(
    "gitBranchColor.listRules",
    listRulesUI
  );

  const manageSensitiveBranchesCommand = vscode.commands.registerCommand(
    "gitBranchColor.manageSensitiveBranches",
    async () => {
      await manageSensitiveBranchesUI();
      await updateColor(true);
    },
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
    disableRuleCommand,
    enableRuleCommand,
    editRuleColorCommand,
    exportProfileCommand,
    importProfileCommand,
    listRulesCommand,
    manageSensitiveBranchesCommand,
    configListener,
  );
}

export function deactivate() {}
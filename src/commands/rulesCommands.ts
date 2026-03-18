import * as vscode from "vscode";
import { COLOR_PALETTE } from "../constants/colorPalette";
import { getConfiguredRules, getAllRules, saveRules } from "../services/rulesService";
import { applyColor } from "../theme/themeService";
import { BranchRuleOption, ColorPickOption } from "../types";

function escapeRegExp(value: string): string {
 return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function pickColor(): Promise<string | undefined> {
 const config = vscode.workspace.getConfiguration();
 const originalColors =
  config.get<Record<string, unknown>>("workbench.colorCustomizations") || {};

 const quickPick = vscode.window.createQuickPick<ColorPickOption>();

 quickPick.matchOnDescription = true;
 quickPick.matchOnDetail = true;
 quickPick.placeholder = "Pick a color (arrows = live preview, Enter = confirm)";
 quickPick.items = COLOR_PALETTE.map((color) => ({
  label: color,
  description: "Live preview",
  detail: `Apply ${color} while browsing`,
  color,
 }));

 return new Promise((resolve) => {
  let acceptedColor: string | undefined;

  quickPick.onDidChangeActive((items) => {
   const activeColor = items[0]?.color;

   if (!activeColor) return;

   void applyColor(activeColor);
  });

  quickPick.onDidAccept(() => {
   acceptedColor = quickPick.selectedItems[0]?.color;

   if (acceptedColor) {
    void applyColor(acceptedColor);
   }

   quickPick.hide();
  });

  quickPick.onDidHide(() => {
   if (!acceptedColor) {
    void config.update(
     "workbench.colorCustomizations",
     originalColors,
     vscode.ConfigurationTarget.Workspace,
    );
   }

   quickPick.dispose();
   resolve(acceptedColor);
  });

  quickPick.show();
 });
}

export async function addRuleWizard(): Promise<void> {
 const branchType = await vscode.window.showQuickPick<BranchRuleOption>(
  [
   {
    label: "main",
    description: "Main production branch",
    mode: "preset",
    pattern: "^main$",
   },
   {
    label: "develop",
    description: "Development branch",
    mode: "preset",
    pattern: "^develop$",
   },
   {
    label: "release/*",
    description: "Release branches",
    mode: "preset",
    pattern: "^release\\/.*$",
   },
   {
    label: "feature/*",
    description: "Feature branches",
    mode: "preset",
    pattern: "^feature\\/.*$",
   },
   {
    label: "hotfix/*",
    description: "Hotfix branches",
    mode: "preset",
    pattern: "^hotfix\\/.*$",
   },
   {
    label: "bugfix/*",
    description: "Bugfix branches",
    mode: "preset",
    pattern: "^bugfix\\/.*$",
   },
   {
    label: "chore/*",
    description: "Maintenance branches",
    mode: "preset",
    pattern: "^chore\\/.*$",
   },
   {
    label: "refactor/*",
    description: "Refactor branches",
    mode: "preset",
    pattern: "^refactor\\/.*$",
   },
   {
    label: "docs/*",
    description: "Documentation branches",
    mode: "preset",
    pattern: "^docs\\/.*$",
   },
   {
    label: "test/*",
    description: "Test branches",
    mode: "preset",
    pattern: "^test\\/.*$",
   },
   {
    label: "branch name",
    description: "Type an exact branch name",
    mode: "branchName",
   },
   {
    label: "custom regex",
    description: "Custom regex pattern",
    mode: "customRegex",
   },
  ],
  {
   placeHolder: "Select branch type",
  },
 );

 if (!branchType) return;

 let pattern = branchType.pattern || "";
 let displayPattern = branchType.label;

 if (branchType.mode === "branchName") {
  const branchName = await vscode.window.showInputBox({
   prompt: "Enter branch name",
   placeHolder: "example: sprint-42",
  });

  if (!branchName) return;

  displayPattern = branchName;
  pattern = `^${escapeRegExp(branchName)}$`;
 }

 if (branchType.mode === "customRegex") {
  const custom = await vscode.window.showInputBox({
   prompt: "Enter regex for branch",
  });

  if (!custom) return;

  displayPattern = custom;
  pattern = custom;
 }

 if (!pattern) return;

 const color = await pickColor();

 if (!color) return;

 const rules = getConfiguredRules();

 rules.push({
  pattern,
  color,
 });

 await saveRules(rules);

 vscode.window.showInformationMessage(`Rule added: ${displayPattern} -> ${color}`);
}

export async function removeRuleUI(): Promise<void> {
 const rules = getConfiguredRules();

 if (rules.length === 0) {
  vscode.window.showInformationMessage("No rules configured");
  return;
 }

 type RulePickItem = vscode.QuickPickItem & { index: number };

 const pick = await vscode.window.showQuickPick<RulePickItem>(
  rules.map((rule, index) => ({
   label: rule.pattern,
   description: rule.color,
   index,
  })),
  {
   placeHolder: "Select rule to remove",
  },
 );

 if (!pick) return;

 rules.splice(pick.index, 1);

 await saveRules(rules);

 vscode.window.showInformationMessage("Rule removed");
}

export async function editRuleColorUI(index: number): Promise<void> {
 const rules = getAllRules();

 if (index < 0 || index >= rules.length) return;

 const rule = rules[index];
 const newColor = await pickColor();

 if (!newColor) return;

 rules[index] = { ...rule, color: newColor };
 await saveRules(rules);

 vscode.window.showInformationMessage(`Rule updated: ${rule.pattern} → ${newColor}`);
}

export async function manageSensitiveBranchesUI(): Promise<void> {
 const config = vscode.workspace.getConfiguration("gitBranchColor");
 const current = config.get<string[]>("sensitiveBranches", ["main", "production", "release"]);

 const suggestions = ["main", "master", "production", "release", "staging", "develop"];
 const allLabels = Array.from(new Set([...suggestions, ...current]));

 const picks = await vscode.window.showQuickPick(
  allLabels.map((label) => ({
   label,
   picked: current.includes(label),
  })),
  {
   canPickMany: true,
   placeHolder: "Select branches to mark as sensitive (status bar warning)",
  },
 );

 if (!picks) { return; }

 const selected = picks.map((p) => p.label);
 await config.update("sensitiveBranches", selected, vscode.ConfigurationTarget.Global);

 vscode.window.showInformationMessage(
  selected.length > 0
   ? `Sensitive branches updated: ${selected.join(", ")}`
   : "No sensitive branches configured.",
 );
}

export async function listRulesUI(): Promise<void> {
 const rules = getConfiguredRules();

 if (rules.length === 0) {
  vscode.window.showInformationMessage("No rules configured");
  return;
 }

 const items = rules.map((rule) => ({
  label: rule.pattern,
  description: rule.color,
 }));

 await vscode.window.showQuickPick(items, {
  placeHolder: "Configured branch color rules",
 });
}

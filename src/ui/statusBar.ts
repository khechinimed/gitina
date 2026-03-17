import * as vscode from "vscode";

function getStatusBarIcon(): string | undefined {
 const config = vscode.workspace.getConfiguration("gitBranchColor");
 const icon = config.get<string>("statusBarIcon")?.trim();

 if (!icon) {
  return undefined;
 }

 return icon;
}

function getStatusBarTextThemeColor(): string | undefined {
 const config = vscode.workspace.getConfiguration("gitBranchColor");
 const themeColor = config.get<string>("statusBarTextThemeColor")?.trim();

 if (!themeColor) {
  return undefined;
 }

 return themeColor;
}

export function updateBranchStatus(
 statusItem: vscode.StatusBarItem | undefined,
 branch: string,
 color: string,
 isSensitive = false,
) {
 if (!statusItem) return;

 const icon = getStatusBarIcon();
 const themeColor = getStatusBarTextThemeColor();

 if (isSensitive) {
  statusItem.text = `$(alert) ${branch}`;
  statusItem.tooltip = `⚠️ Sensitive branch: ${branch} (${color})`;
  statusItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
  statusItem.color = undefined;
 } else {
  statusItem.text = icon ? `${icon} ${branch}` : branch;
  statusItem.tooltip = `Current branch: ${branch} (${color})`;
  statusItem.color = themeColor ? new vscode.ThemeColor(themeColor) : undefined;
  statusItem.backgroundColor = undefined;
 }

 statusItem.show();
}

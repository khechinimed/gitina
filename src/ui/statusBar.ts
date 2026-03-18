import * as vscode from "vscode";

export function updateBranchStatus(
 statusItem: vscode.StatusBarItem | undefined,
 branch: string,
 color: string,
 isSensitive = false,
) {
 if (!statusItem) { return; }

 if (isSensitive) {
  statusItem.text = `⚠️ Sensitive branch:  ${branch}`;
  statusItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
  statusItem.color = undefined;
  statusItem.show();
 } else {
  statusItem.hide();
 }
}

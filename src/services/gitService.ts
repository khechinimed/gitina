import * as vscode from "vscode";
import { exec } from "child_process";

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

export async function getBranch(): Promise<string> {
 const folder = vscode.workspace.workspaceFolders?.[0];

 if (!folder) {
  return "";
 }

 return execGit("git rev-parse --abbrev-ref HEAD", folder.uri.fsPath);
}

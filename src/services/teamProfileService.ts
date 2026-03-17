import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BranchColorRule } from "../types";
import { getAllRules, saveRules } from "./rulesService";

const PROFILE_FILENAME = ".gitinarc.json";

export async function exportProfile(): Promise<void> {
 const workspaceFolders = vscode.workspace.workspaceFolders;
 const defaultUri = workspaceFolders?.length
  ? vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, PROFILE_FILENAME))
  : undefined;

 const saveUri = await vscode.window.showSaveDialog({
  defaultUri,
  filters: { "Gitina Profile": ["json"] },
  title: "Export Gitina Team Profile",
 });

 if (!saveUri) return;

 const rules = getAllRules();
 const content = JSON.stringify({ rules }, null, 2);
 fs.writeFileSync(saveUri.fsPath, content, "utf8");

 vscode.window.showInformationMessage(
  `Profile exported to ${path.basename(saveUri.fsPath)}. Commit this file to share colors with your team.`,
 );
}

export async function importProfile(): Promise<void> {
 const workspaceFolders = vscode.workspace.workspaceFolders;
 const defaultUri = workspaceFolders?.length
  ? vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, PROFILE_FILENAME))
  : undefined;

 const uris = await vscode.window.showOpenDialog({
  defaultUri,
  canSelectFiles: true,
  canSelectFolders: false,
  canSelectMany: false,
  filters: { "Gitina Profile": ["json"] },
  title: "Import Gitina Team Profile",
 });

 const fileUri = uris?.[0];
 if (!fileUri) return;

 let profile: { rules: BranchColorRule[] };
 try {
  const raw = fs.readFileSync(fileUri.fsPath, "utf8");
  profile = JSON.parse(raw) as { rules: BranchColorRule[] };
 } catch {
  vscode.window.showErrorMessage(
   "Failed to read profile file. Make sure it is valid JSON.",
  );
  return;
 }

 if (!Array.isArray(profile?.rules)) {
  vscode.window.showErrorMessage(
   "Invalid profile: missing 'rules' array.",
  );
  return;
 }

 await saveRules(profile.rules);
 vscode.window.showInformationMessage(
  `Imported ${profile.rules.length} rule(s) from profile.`,
 );
}

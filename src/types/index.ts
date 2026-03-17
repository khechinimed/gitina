import * as vscode from "vscode";

export type BranchRuleOption = vscode.QuickPickItem & {
 mode: "preset" | "branchName" | "customRegex"
 pattern?: string
}

export type BranchColorRule = {
 pattern: string
 color: string
}

export type ColorPickOption = vscode.QuickPickItem & {
 color: string
}

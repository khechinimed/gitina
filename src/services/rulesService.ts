import * as vscode from "vscode";
import { BranchColorRule } from "../types";

const CONFIG_SECTION = "gitBranchColor";
const RULES_KEY = "rules";

export function getConfiguredRules(): BranchColorRule[] {
 const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
 const rules = config.get<BranchColorRule[]>(RULES_KEY) || [];

 return rules.filter(
  (rule) =>
   typeof rule?.pattern === "string" &&
   typeof rule?.color === "string" &&
   rule.pattern.length > 0 &&
   rule.color.length > 0,
 );
}

export async function saveRules(rules: BranchColorRule[]): Promise<void> {
 const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

 await config.update(RULES_KEY, rules, vscode.ConfigurationTarget.Global);
}

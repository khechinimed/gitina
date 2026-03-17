import * as vscode from "vscode";
import { BranchColorRule } from "../types";

const CONFIG_SECTION = "gitBranchColor";
const RULES_KEY = "rules";

function isValidRule(rule: unknown): rule is BranchColorRule {
 const r = rule as BranchColorRule;
 return (
  typeof r?.pattern === "string" &&
  typeof r?.color === "string" &&
  r.pattern.length > 0 &&
  r.color.length > 0
 );
}

export function getAllRules(): BranchColorRule[] {
 const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
 const rules = config.get<BranchColorRule[]>(RULES_KEY) || [];
 return rules.filter(isValidRule);
}

export function getConfiguredRules(): BranchColorRule[] {
 return getAllRules().filter((r) => r.enabled !== false);
}

export async function saveRules(rules: BranchColorRule[]): Promise<void> {
 const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
 await config.update(RULES_KEY, rules, vscode.ConfigurationTarget.Global);
}

export async function toggleRule(index: number): Promise<void> {
 const rules = getAllRules();
 if (index < 0 || index >= rules.length) return;
 const rule = rules[index];
 rules[index] = { ...rule, enabled: rule.enabled === false ? undefined : false };
 await saveRules(rules);
}

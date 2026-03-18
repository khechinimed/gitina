import * as vscode from "vscode";
import { BranchColorRule } from "../types";
import { getColorSwatchIcon, normalizeHexColor } from "../theme/themeService";

const ACTIONS_GROUP_ID = "gitinaActionsGroup";
const RULES_GROUP_ID = "gitinaRulesGroup";

export class RuleTreeItem extends vscode.TreeItem {
   constructor(
      public readonly ruleIndex: number,
      public readonly rule: BranchColorRule,
   ) {
      super(rule.pattern, vscode.TreeItemCollapsibleState.None);
      const normalizedColor = normalizeHexColor(rule.color);
      const isDisabled = rule.enabled === false;
      this.description = isDisabled
         ? `${normalizedColor || rule.color} (disabled)`
         : normalizedColor || rule.color;
      this.tooltip = `${rule.pattern} → ${normalizedColor || rule.color}${isDisabled ? " [disabled]" : ""}`;
      this.iconPath = isDisabled
         ? new vscode.ThemeIcon("eye-closed", new vscode.ThemeColor("disabledForeground"))
         : getColorSwatchIcon(normalizedColor);
      this.contextValue = isDisabled ? "gitinaRuleDisabled" : "gitinaRuleEnabled";
   }
}

export class GitinaSidebarProvider
   implements vscode.TreeDataProvider<vscode.TreeItem>
{
   private readonly onDidChangeTreeDataEmitter =
      new vscode.EventEmitter<void>();

   readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

   private branch: string | undefined;
   private color: string | undefined;
   private rules: BranchColorRule[] = [];
   private isSensitive = false;

   setState(state: {
      branch?: string;
      color?: string;
      rules: BranchColorRule[];
      isSensitive?: boolean;
   }) {
      this.branch = state.branch;
      this.color = state.color;
      this.rules = state.rules;
      this.isSensitive = state.isSensitive ?? false;
      this.onDidChangeTreeDataEmitter.fire();
   }

   getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
      return element;
   }

   getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
      if (element?.id === RULES_GROUP_ID) {
         if (this.rules.length === 0) {
            const emptyRulesItem = new vscode.TreeItem(
               "No rules configured",
               vscode.TreeItemCollapsibleState.None,
            );
            emptyRulesItem.iconPath = new vscode.ThemeIcon("circle-slash");

            return [emptyRulesItem];
         }

         return this.rules.map((rule, index) => new RuleTreeItem(index, rule));
      }

      if (element?.id === ACTIONS_GROUP_ID) {
         return [
            createSidebarActionItem(
               "Refresh colors",
               "Re-apply rules on current branch",
               "refresh",
               "gitBranchColor.refresh",
               "gitinaActionRefresh",
            ),
            createSidebarActionItem(
               "Add rule",
               "Create a new branch color rule",
               "add",
               "gitBranchColor.addRule",
               "gitinaActionAddRule",
            ),
            createSidebarActionItem(
               "Remove rule",
               "Delete an existing rule",
               "trash",
               "gitBranchColor.removeRule",
               "gitinaActionRemoveRule",
            ),
            createSidebarActionItem(
               "Sensitive branches",
               "Select which branches trigger a warning",
               "shield",
               "gitBranchColor.manageSensitiveBranches",
               "gitinaActionSensitiveBranches",
            ),
         ];
      }

      if (element) {
         return [];
      }

      const branchItem = new vscode.TreeItem(
         "Current branch",
         vscode.TreeItemCollapsibleState.None,
      );
      branchItem.description = this.branch || "No branch";
      branchItem.iconPath = this.isSensitive
         ? new vscode.ThemeIcon("alert", new vscode.ThemeColor("problemsWarningIcon.foreground"))
         : new vscode.ThemeIcon("git-branch");
      branchItem.tooltip = this.isSensitive
         ? `⚠️ Sensitive branch: ${this.branch}`
         : `Branch: ${this.branch || "No branch"}`;

      const colorItem = new vscode.TreeItem(
         "Active color",
         vscode.TreeItemCollapsibleState.None,
      );
      const normalizedColor = this.color
         ? normalizeHexColor(this.color)
         : undefined;
      colorItem.description = normalizedColor || "-";
      colorItem.tooltip = normalizedColor
         ? `Current color: ${normalizedColor}`
         : "Current color: -";
      colorItem.iconPath = getColorSwatchIcon(normalizedColor);

      const rulesCountItem = new vscode.TreeItem(
         "Rules configured",
         vscode.TreeItemCollapsibleState.Expanded,
      );
      rulesCountItem.id = RULES_GROUP_ID;
      rulesCountItem.description = `${this.rules.length}`;
      rulesCountItem.tooltip = `Total rules: ${this.rules.length}`;
      rulesCountItem.iconPath = new vscode.ThemeIcon(
         "symbol-number",
         new vscode.ThemeColor("charts.blue"),
      );

      const actionsItem = new vscode.TreeItem(
         "Actions",
         vscode.TreeItemCollapsibleState.Expanded,
      );
      actionsItem.id = ACTIONS_GROUP_ID;
      actionsItem.iconPath = new vscode.ThemeIcon("tools");

      return [
         branchItem,
         colorItem,
         rulesCountItem,
         createSidebarSeparatorItem(),
         actionsItem,
      ];
   }
}

function createSidebarActionItem(
   label: string,
   description: string,
   iconName: string,
   commandId: string,
   contextValue: string,
): vscode.TreeItem {
   const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);

   item.description = description;
   item.iconPath = new vscode.ThemeIcon(iconName);
   item.contextValue = contextValue;
   item.command = {
      title: label,
      command: commandId,
   };

   return item;
}

function createSidebarSeparatorItem(): vscode.TreeItem {
   const item = new vscode.TreeItem(
      "----------------------",
      vscode.TreeItemCollapsibleState.None,
   );

   item.description = " ";
   item.tooltip = " ";

   return item;
}

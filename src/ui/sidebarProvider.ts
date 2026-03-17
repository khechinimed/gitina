import * as vscode from "vscode";
import { BranchColorRule } from "../types";
import { getColorSwatchIcon, normalizeHexColor } from "../theme/themeService";

const ACTIONS_GROUP_ID = "gitinaActionsGroup";
const RULES_GROUP_ID = "gitinaRulesGroup";

export class GitinaSidebarProvider
   implements vscode.TreeDataProvider<vscode.TreeItem>
{
   private readonly onDidChangeTreeDataEmitter =
      new vscode.EventEmitter<void>();

   readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

   private branch: string | undefined;
   private color: string | undefined;
   private rules: BranchColorRule[] = [];

   setState(state: {
      branch?: string;
      color?: string;
      rules: BranchColorRule[];
   }) {
      this.branch = state.branch;
      this.color = state.color;
      this.rules = state.rules;
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

         return this.rules.map((rule) => createSidebarRuleItem(rule));
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
      branchItem.iconPath = new vscode.ThemeIcon("git-branch");

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

function createSidebarRuleItem(rule: BranchColorRule): vscode.TreeItem {
   const normalizedColor = normalizeHexColor(rule.color);
   const item = new vscode.TreeItem(
      rule.pattern,
      vscode.TreeItemCollapsibleState.None,
   );

   item.description = normalizedColor || rule.color;
   item.tooltip = `${rule.pattern} -> ${normalizedColor || rule.color}`;
   item.iconPath = getColorSwatchIcon(normalizedColor);

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

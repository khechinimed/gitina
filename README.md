<div align="center">

# Gitina

**Automatically color your VS Code interface based on your current Git branch.**

> Stay aware of where you are. Never accidentally push to `main` again.

![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.80.0-blue?style=flat-square&logo=visual-studio-code)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## What is Gitina?

Gitina watches your active Git branch and instantly changes the VS Code status bar color to match a rule you defined. At a glance, you know:

- 🟡 You're on a feature branch
- 🔴 You're on a hotfix branch
- ⚠️ You're on `main` — the editor shows a warning alert

No configuration required to get started. Rules are stored in your VS Code settings and survive restarts.

---

## Features

### 🎨 Branch → Color Rules

Define regex patterns that map to colors. The first matching rule wins.

```
^main$       →  #444444  (dark grey)
^develop$    →  #2ecc71  (green)
^feature/.*  →  #f1c40f  (yellow)
^hotfix/.*   →  #e74c3c  (red)
```

The status bar background and the editor's `workbench.colorCustomizations` update automatically every time you switch branch.

---

### ⚠️ Sensitive Branch Alerts

When you're on a branch considered sensitive (`main`, `production`, `release` by default), Gitina shows a **visual warning** so you never forget:

- Status bar turns orange with a `⚠` icon
- Sidebar shows an alert icon next to the branch name

You can customize the list of sensitive branches or disable the feature entirely in settings.

---

### 🗂️ Sidebar Overview

Open the **Gitina panel** in the Activity Bar for a full overview:

| Section | What you'll see |
|---|---|
| **Current branch** | Active branch name + warning icon if sensitive |
| **Active color** | Hex code + live color swatch |
| **Rules configured** | All rules, expandable, with color swatches |
| **Actions** | Refresh, Add rule, Remove rule |

**Disable / Enable a rule** directly from the sidebar — hover a rule row and click the eye icon to toggle it without deleting it. Disabled rules appear greyed out with a closed eye icon.

---

### 👥 Team Profile (Share Your Rules)

Share your branch color setup with your entire team:

- **Export** — saves your rules to a `.gitinarc.json` file  
- **Import** — loads rules from any `.gitinarc.json` file  

Commit that file to your repository and every developer runs the same color scheme.

```json
// .gitinarc.json
{
  "rules": [
    { "pattern": "^main$", "color": "#e74c3c" },
    { "pattern": "^develop$", "color": "#2ecc71" },
    { "pattern": "^feature/.*", "color": "#f1c40f" },
    { "pattern": "^hotfix/.*", "color": "#c0392b" }
  ]
}
```

---

## Commands

All commands are available via the **Command Palette** (`⌘ Shift P` / `Ctrl Shift P`) and the Gitina sidebar toolbar.

| Command | Description |
|---|---|
| `Git Branch Color: Add Rule` | Launch the wizard to create a new rule |
| `Git Branch Color: Remove Rule` | Pick and delete an existing rule |
| `Git Branch Color: List Rules` | Display all configured rules |
| `Git Branch Color: Refresh` | Re-apply colors to the current branch |
| `Git Branch Color: Export Team Profile` | Save rules to `.gitinarc.json` |
| `Git Branch Color: Import Team Profile` | Load rules from `.gitinarc.json` |

---

## Settings

All settings live under the `gitBranchColor.*` namespace in your VS Code settings.

| Setting | Type | Default | Description |
|---|---|---|---|
| `gitBranchColor.rules` | `array` | *(4 default rules)* | Regex-to-color mapping rules |
| `gitBranchColor.statusBarIcon` | `string` | `""` | Icon prefix in the status bar. Accepts codicons (`$(git-branch)`) or emoji. Leave empty to hide. |
| `gitBranchColor.statusBarTextThemeColor` | `string` | `""` | VS Code theme color token for status bar text (e.g. `statusBar.foreground`). Leave empty for default. |
| `gitBranchColor.sensitiveBranchesEnabled` | `boolean` | `true` | Enable/disable the sensitive branch alert. |
| `gitBranchColor.sensitiveBranches` | `array` | `["main", "production", "release"]` | Branch name patterns (regex) that trigger the warning alert. |

### Rule format

Each entry in `gitBranchColor.rules` is an object:

```jsonc
{
  "pattern": "^feature/.*",  // JavaScript regex
  "color": "#f1c40f",        // Hex color string
  "enabled": true            // Optional. false = rule is disabled
}
```

### Example configuration

```jsonc
// settings.json
"gitBranchColor.statusBarIcon": "$(git-branch)",
"gitBranchColor.sensitiveBranches": ["main", "master", "production"],
"gitBranchColor.rules": [
  { "pattern": "^main$",       "color": "#e74c3c" },
  { "pattern": "^master$",     "color": "#e74c3c" },
  { "pattern": "^develop$",    "color": "#2ecc71" },
  { "pattern": "^release/.*",  "color": "#9b59b6" },
  { "pattern": "^feature/.*",  "color": "#f1c40f" },
  { "pattern": "^hotfix/.*",   "color": "#e67e22" },
  { "pattern": "^chore/.*",    "color": "#95a5a6" }
]
```

---

## How rules are matched

- Rules are evaluated **top to bottom**
- The **first matching rule** wins — order matters
- Patterns are standard **JavaScript regular expressions**
- Disabled rules (`"enabled": false`) are skipped entirely

---

## Data & persistence

| Data | Storage location |
|---|---|
| Rules & settings | `~/Library/Application Support/Code/User/settings.json` (macOS) |
| Active branch | Read from `git rev-parse` at runtime — not stored |
| Active color | Re-applied from rules on every branch switch |
| Team profile | `.gitinarc.json` in your project — you choose where |

Gitina only writes to VS Code's standard settings. It never touches your code, your git history, or any system files.

---

## ⚠️ Behavior & Permissions

Gitina modifies the **`workbench.colorCustomizations`** entry in your VS Code settings to change the visual appearance of the editor interface (status bar, title bar, activity bar) based on your current Git branch.

**What this means in practice:**

- Every time you switch branch, Gitina writes the matched color into `workbench.colorCustomizations` in your global `settings.json`
- This is the only setting Gitina writes to — it never touches your code, your git history, or any other configuration
- If no rule matches, the last applied color remains (a manual Refresh will re-evaluate)

**To reset colors at any time:**

```jsonc
// Remove or clear this block in your settings.json
"workbench.colorCustomizations": {}
```

Or run **Git Branch Color: Refresh** from the Command Palette after removing all rules.

> If you share your machine or use a synced VS Code profile, be aware that these color changes will be visible to others using the same profile.

---

## Requirements

- VS Code `^1.80.0`
- A workspace with a `.git` folder (the extension activates automatically)

---

## Release Notes

### 0.0.1
Initial release — branch coloring, sidebar overview, add/remove rules, sensitive branch alerts, disable/enable rules, team profile export/import.

---

<div align="center">

Made with ☕ by [khechini mohamed](https://github.com/khechinimed/)

</div>

import * as vscode from "vscode";

export function applyColor(color: string): Thenable<void> {
 const config = vscode.workspace.getConfiguration();
 const currentColors =
  config.get<Record<string, unknown>>("workbench.colorCustomizations") || {};
 const foreground = getReadableForeground(color);
 const inactiveForeground = withAlpha(foreground, "B3");

 const colors: Record<string, unknown> = {
  ...currentColors,
  "statusBar.background": color,
  "statusBar.noFolderBackground": color,
  "statusBar.foreground": foreground,
  "statusBar.noFolderForeground": foreground,
  "titleBar.activeBackground": color,
  "titleBar.inactiveBackground": color,
  "titleBar.activeForeground": foreground,
  "titleBar.inactiveForeground": inactiveForeground,
  "activityBar.background": color,
  "activityBar.foreground": foreground,
  "activityBar.inactiveForeground": inactiveForeground,
 };

 return config.update(
  "workbench.colorCustomizations",
  colors,
  vscode.ConfigurationTarget.Workspace,
 );
}

export function normalizeHexColor(color: string): string | undefined {
 const parsed = parseHexColor(color);

 if (!parsed) {
  return undefined;
 }

 const [r, g, b] = parsed;

 return `#${r.toString(16).padStart(2, "0")}${g
  .toString(16)
  .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function getColorSwatchIcon(
 color: string | undefined,
): vscode.ThemeIcon | vscode.Uri {
 if (!color) {
  return new vscode.ThemeIcon("paintcan");
 }

 const border =
  getReadableForeground(color) === "#ffffff" ? "#ffffff99" : "#00000066";
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect x="1.25" y="1.25" width="13.5" height="13.5" rx="3" fill="${color}" stroke="${border}" stroke-width="1.5"/></svg>`;

 return vscode.Uri.parse(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
}

function getReadableForeground(color: string): string {
 const parsed = parseHexColor(color);

 if (!parsed) {
  return "#ffffff";
 }

 const [r, g, b] = parsed;
 const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

 return luminance > 0.6 ? "#111111" : "#ffffff";
}

function parseHexColor(color: string): [number, number, number] | undefined {
 const normalized = color.trim();

 if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
  const r = parseInt(normalized[1] + normalized[1], 16);
  const g = parseInt(normalized[2] + normalized[2], 16);
  const b = parseInt(normalized[3] + normalized[3], 16);

  return [r, g, b];
 }

 if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  return [r, g, b];
 }

 return undefined;
}

function withAlpha(color: string, alpha: string): string {
 if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
  return color;
 }

 return `${color}${alpha}`;
}

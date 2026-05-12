import * as fs from "fs"
import * as vscode from "vscode"

/**
 * HtmlPreviewProvider opens plan HTML files in a lightweight webview panel.
 * Plan HTML is self-contained (inline CSS), so we render it directly without
 * an iframe to avoid localResourceRoots and path resolution issues.
 */
export class HtmlPreviewProvider implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined

  constructor(private readonly extensionUri: vscode.Uri) {}

  public open(uri: vscode.Uri): void {
    const filename = uri.path.split("/").pop() ?? uri.fsPath
    const title = `Plan: ${filename}`

    if (this.panel) {
      this.panel.title = title
      this.panel.reveal(vscode.ViewColumn.One)
      this.setContent(uri)
      return
    }

    const panel = vscode.window.createWebviewPanel("kilo-code.new.HtmlPreview", title, vscode.ViewColumn.One, {
      enableScripts: true,
    })

    panel.iconPath = {
      light: vscode.Uri.joinPath(this.extensionUri, "assets", "icons", "kilo-light.svg"),
      dark: vscode.Uri.joinPath(this.extensionUri, "assets", "icons", "kilo-dark.svg"),
    }

    panel.onDidDispose(() => {
      this.panel = undefined
    })

    this.panel = panel
    this.setContent(uri)
  }

  private setContent(uri: vscode.Uri): void {
    if (!this.panel) return
    try {
      const html = fs.readFileSync(uri.fsPath, "utf-8")
      this.panel.webview.html = html
    } catch (err) {
      this.panel.webview.html = `<!DOCTYPE html><html><body style="color:red;padding:20px;font-family:sans-serif;">
        Failed to load plan HTML: ${(err as Error).message}
      </body></html>`
    }
  }

  public dispose(): void {
    this.panel?.dispose()
    this.panel = undefined
  }
}

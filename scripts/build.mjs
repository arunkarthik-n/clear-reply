import * as esbuild from "esbuild"
import { cpSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(root, "dist")

mkdirSync(dist, { recursive: true })

await esbuild.build({
  absWorkingDir: root,
  entryPoints: {
    background: "src/Background.res.mjs",
    panel: "src/Panel.res.mjs",
    options: "src/Options.res.mjs",
  },
  bundle: true,
  outdir: "dist",
  format: "iife",
  target: ["chrome114"],
  logLevel: "info",
})

cpSync(join(root, "public/manifest.json"), join(dist, "manifest.json"))
cpSync(join(root, "public/panel.html"), join(dist, "panel.html"))
cpSync(join(root, "public/options.html"), join(dist, "options.html"))
cpSync(join(root, "public/app.css"), join(dist, "app.css"))
cpSync(join(root, "public/icons"), join(dist, "icons"), { recursive: true })

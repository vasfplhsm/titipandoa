import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
export function pwaPlugin() {
  let root;
  let project;
  return {
    name: "titipandoa-offline-shell",
    apply: "build",
    configResolved(config) {
      project = config.root;
      root = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = [];
      function walk(dir) {
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const file = path.join(dir, item.name);
          if (item.isDirectory()) walk(file);
          else if (!["sw.js"].includes(item.name) && !file.endsWith(".map"))
            files.push(path.relative(root, file).replaceAll("\\", "/"));
        }
      }
      walk(root);
      const version = crypto.createHash("sha256");
      for (const file of files.sort()) {
        version.update(file);
        version.update(fs.readFileSync(path.join(root, file)));
      }
      const code = fs
        .readFileSync(path.join(project, "src/offline/sw-template.js"), "utf8")
        .replace("__PRECACHE__", JSON.stringify(files))
        .replace("__VERSION__", version.digest("hex").slice(0, 16));
      fs.writeFileSync(path.join(root, "sw.js"), code);
    },
  };
}

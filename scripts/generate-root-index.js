const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  ".git", ".github", "node_modules", "dist", "build"
]);

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const subdirs = fs.readdirSync(ROOT)
  .filter(f => isDir(path.join(ROOT, f)) && !SKIP_DIRS.has(f))
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

const listItems = subdirs.length
  ? subdirs.map(d => `<li><a href="${encodeURIComponent(d)}/">${d}</a></li>`).join("\n")
  : `<li><em>No sub-folders</em></li>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hult Vibes</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.6; }
  h1 { margin-bottom: 1rem; }
</style>
</head>
<body>
  <h1>Hult Vibes</h1>
  <ul>
    ${listItems}
  </ul>
  <footer><small>Generated automatically from repository structure.</small></footer>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log("✅ Root index.html generated");

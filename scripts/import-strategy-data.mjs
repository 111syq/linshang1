import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const candidates = [
  process.env.PYTHON,
  "/Users/qiuqiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  "python3",
].filter(Boolean);

const python = candidates.find((candidate) => candidate === "python3" || existsSync(candidate));
if (!python) {
  console.error("未找到可用 Python，无法解析 Excel/Word 源文件。");
  process.exit(1);
}

const result = spawnSync(python, [join(root, "scripts/strategy_importer.py")], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

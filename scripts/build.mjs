import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of ["index.html", "mini.html", "README.md", "netlify.toml"]) {
  cpSync(join(root, file), join(dist, file));
}
for (const dir of ["assets", "public", "shared"]) {
  cpSync(join(root, dir), join(dist, dir), { recursive: true });
}
writeFileSync(join(dist, "_redirects"), "/* /index.html 200\n", "utf-8");
console.log("静态构建完成：dist/");

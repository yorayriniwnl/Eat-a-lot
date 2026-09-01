import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const tokens = JSON.parse(await readFile(new URL("design/yor-tokens.json", root), "utf8"));
const publicPage = await readFile(new URL("public/index.html", root), "utf8");
const adminPage = await readFile(new URL("public/admin.html", root), "utf8");
const readme = await readFile(new URL("README.md", root), "utf8");
const required = [...Object.values(tokens.palette), tokens.gradient];
const missing = required.flatMap((value) => [
  !publicPage.toLowerCase().includes(value.toLowerCase()) ? `${value} in public/index.html` : null,
  !adminPage.toLowerCase().includes(value.toLowerCase()) ? `${value} in public/admin.html` : null,
].filter(Boolean));
missing.push(...tokens.evidenceStates.filter((state) => !readme.includes(state)));
if (missing.length) {
  console.error(`YOR design contract failed:\n- ${missing.join("\n- ")}`);
  process.exit(1);
}
console.log("YOR design contract: PASS");

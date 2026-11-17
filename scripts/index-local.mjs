import { readdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const kinds = {
  skills: "skills",
  agents: "agents",
  tools: "tools",
  commands: "commands",
  mcpServers: "mcp",
  officeEngines: "office",
  providers: "providers",
  surfaces: "surfaces",
  previewers: "previewers",
  interceptors: "interceptors",
};
const entries = [];
for (const directory of (
  await readdir(path.join(root, "plugins"), { withFileTypes: true })
).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!directory.isDirectory()) continue;
  const packageRoot = await realpath(
    path.join(root, "plugins", directory.name),
  );
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "plugin.json"), "utf8"),
  );
  if (
    manifest.apiVersion !== 2 ||
    !manifest.name ||
    !manifest.version ||
    !manifest.contributes
  ) {
    throw new Error(`${directory.name}: incomplete native manifest`);
  }
  const resources = Object.values(manifest.contributes)
    .flat()
    .flatMap((item) => {
      if (typeof item === "string") return [item];
      return [item.entry, item.prompt?.file, item.source?.file].filter(
        (value) => typeof value === "string",
      );
    });
  for (const resource of resources) {
    const target = await realpath(path.resolve(packageRoot, resource));
    const relative = path.relative(packageRoot, target);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new Error(
        `${directory.name}: contribution escapes package: ${resource}`,
      );
    }
  }
  const capabilities = Object.entries(manifest.contributes)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key]) => kinds[key] ?? key)
    .sort();
  entries.push({
    packageId: directory.name,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description ?? "",
    path: `plugins/${directory.name}`,
    categories: manifest.categories ?? [],
    capabilities,
    runtimeTargets: ["novaway-v2"],
  });
}
const content =
  JSON.stringify({ schemaVersion: 1, channel: "local", entries }, null, 2) +
  "\n";
const destination = path.join(root, "catalog/local.json");
if (process.argv.includes("--check")) {
  if ((await readFile(destination, "utf8")) !== content)
    throw new Error("Local index is stale; run node scripts/index-local.mjs");
} else {
  await writeFile(destination, content);
}
console.log(
  `Validated ${entries.length} local packages; stable catalog unchanged`,
);

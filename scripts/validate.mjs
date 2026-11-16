import { readFile } from "node:fs/promises"

const catalogPath = new URL("../catalog/index.json", import.meta.url)
const catalog = JSON.parse(await readFile(catalogPath, "utf8"))

if (catalog.schemaVersion !== 1) throw new Error("unsupported catalog schemaVersion")
if (catalog.marketId !== "novaway-official") throw new Error("unexpected marketId")
if (!Array.isArray(catalog.entries)) throw new Error("catalog.entries must be an array")

const seen = new Set()
for (const entry of catalog.entries) {
  if (!entry || typeof entry !== "object") throw new Error("catalog entry must be an object")
  for (const field of ["packageId", "name", "version"]) {
    if (typeof entry[field] !== "string" || entry[field].length === 0) throw new Error(`${field} is required`)
  }
  const identity = `${entry.packageId}@${entry.version}`
  if (seen.has(identity)) throw new Error(`duplicate catalog entry: ${identity}`)
  seen.add(identity)
  if (!Array.isArray(entry.runtimeTargets) || entry.runtimeTargets.length === 0) {
    throw new Error(`${identity}: runtimeTargets is required`)
  }
  if (!Array.isArray(entry.capabilities) || entry.capabilities.length === 0) {
    throw new Error(`${identity}: capabilities is required`)
  }
  if (!Array.isArray(entry.artifacts) || entry.artifacts.length === 0) {
    throw new Error(`${identity}: artifacts is required`)
  }
  for (const artifact of entry.artifacts) {
    if (!/^https:\/\//i.test(artifact.url ?? "")) throw new Error(`${identity}: artifact URL must use HTTPS`)
    if (!/^[a-f0-9]{64}$/i.test(artifact.sha256 ?? "")) {
      throw new Error(`${identity}: artifact SHA-256 is required`)
    }
  }
}

console.log(`Validated ${catalog.entries.length} stable catalog entries`)

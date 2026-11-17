export default { id: "capability-lsp", languages: ["capability"], command: ["capability-lsp"], diagnostics: "on-save", async probe() { return { ready: true, language: "capability" } } }

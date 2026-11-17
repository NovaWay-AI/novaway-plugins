export default { id: "capability-verifier", version: "1.0.0", async verify(input) { return { ok: true, evidence: ["marketplace-capability-smoke", input] } } }

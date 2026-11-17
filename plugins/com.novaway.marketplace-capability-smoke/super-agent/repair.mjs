export default {
  id: "capability-repair",
  version: "1.0.0",
  create(input) {
    const now = Date.now()
    const source = input?.sourceTask
    return {
      id: `capability-repair:${now}`,
      graphID: source?.graphID ?? "marketplace-capability-smoke",
      kind: "repair",
      title: "Marketplace Capability Repair",
      objective: "Repair a failed marketplace capability check.",
      status: "pending",
      dependencies: source?.dependencies?.slice() ?? [],
      acceptanceCriteria: [],
      retryPolicy: { maxAttempts: 1, backoffMs: 0, retryable: false },
      attempts: 0,
      evidenceIDs: [],
      verificationIDs: [],
      createdAt: now,
      updatedAt: now,
    }
  },
}

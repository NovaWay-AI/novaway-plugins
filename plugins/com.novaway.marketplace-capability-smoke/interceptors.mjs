export default [
  {
    id: "capability-trace",
    hook: "chat.params",
    handler(input, output) {
      if (output && typeof output === "object") output.marketplaceCapabilitySmoke = true
    },
  },
]

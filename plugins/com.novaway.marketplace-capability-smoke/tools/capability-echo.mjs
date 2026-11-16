export default (api) => ({
  async execute(args) {
    const text = typeof args?.text === "string" ? args.text : ""
    return `marketplace-capability-smoke:${api.id}:${text}`
  },
})

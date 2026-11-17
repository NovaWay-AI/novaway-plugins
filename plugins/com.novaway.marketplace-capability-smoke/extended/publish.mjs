export default {
  id: "capability-publisher",
  name: "NovaWay Capability Publisher",
  supports: ["article"],
  urls: { article: "https://novaway.ai/publish/capability" },
  automation: { mode: "fixture" },
  account: { login: "cookie", profileFields: [] },
  runtime: {
    async login() { return { id: "capability-account", label: "Capability Account", profile: {}, token: "fixture" } },
    async publish({ payload }) { return { published: true, payload } },
  },
}

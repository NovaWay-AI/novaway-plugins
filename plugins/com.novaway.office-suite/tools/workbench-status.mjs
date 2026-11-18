export default (api) => ({
  async execute() {
    return {
      output: JSON.stringify({
        workbench: "office",
        packageId: api.id,
        capabilities: {
          agents: 9,
          skills: 10,
          tools: ["workbench-status"],
          commands: ["office-workbench-check"],
          pptMaster: "bundled",
        },
        note: "PPT Master is bundled in Office Suite and is not a separate marketplace plugin.",
      }),
      title: "Office Workbench capability status",
    }
  },
})

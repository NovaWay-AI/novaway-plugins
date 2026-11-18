export default (api) => ({
  async execute() {
    return {
      output: JSON.stringify({
        workbench: "office",
        packageId: api.id,
        capabilities: {
          agents: 9,
          skills: 14,
          tools: ["workbench-status"],
          commands: ["office-workbench-check"],
          pptMaster: "bundled",
          officialAnthropicOfficeSkills: ["docx", "pdf", "pptx", "xlsx"],
        },
        note: "PPT Master and the official Anthropic DOCX/PDF/PPTX/XLSX guidance skills are bundled in Office Suite; none is a separate marketplace plugin.",
      }),
      title: "Office Workbench capability status",
    }
  },
})

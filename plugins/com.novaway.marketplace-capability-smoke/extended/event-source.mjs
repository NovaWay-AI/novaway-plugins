export default { id: "capability-events", async start(emit) { emit({ type: "capability", properties: { installed: true } }); return { dispose() {} } } }

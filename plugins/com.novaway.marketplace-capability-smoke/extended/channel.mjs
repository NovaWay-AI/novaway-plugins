export default { id: "capability-channel", kind: "structured", async publish(message) { return message }, subscribe() { return { dispose() {} } } }

export default {
  async read(input) {
    return { text: String(input ?? "") }
  },
  async write(value) {
    return String(value?.text ?? value ?? "")
  },
}


export default {
  name: 'Main',
  data() {
    return {
      mediaList: [],
      mediaIndex: 0,
      onClose: () => {}
    }
  },
  mounted() {
    document.addEventListener('keydown', this.keydownHandle)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.keydownHandle)
  },
  methods: {
    close() {
      this.onClose()
      this.$destroy()
    },
    keydownHandle(e) {
      if (e.key === 'Escape') {
        this.close()
      }
    },
    prev() {
      if (this.mediaIndex <= 0) return

      this.mediaIndex--
    },
    next() {
      if (this.mediaIndex >= this.mediaList.length - 1) return

      this.mediaIndex++
    }
  }
}

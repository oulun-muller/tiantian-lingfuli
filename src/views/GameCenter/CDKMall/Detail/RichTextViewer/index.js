import { parseUrl } from '@/utils'

export default {
  name: 'RichTextViewer',
  props: {
    rt: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      plainText: false
    }
  },
  created() {
    let rtContainer = document.createElement('div')
    rtContainer.innerHTML = this.rt
    this.plainText = [...rtContainer.children].filter(o => o.tagName !== 'A' && o.tagName !== 'BR').length <= 0
    rtContainer = null
  },
  mounted() {
    const rootEl = this.getRootElement()
    if (!rootEl) return

    rootEl.querySelectorAll('a').forEach(link => {
      link.href = parseUrl(link.getAttribute('href'))
    })
    rootEl.querySelectorAll('img').forEach(image => {
      image.src = parseUrl(image.getAttribute('src'))
      if (image.dataset.href) {
        image.dataset.href = parseUrl(image.dataset.href)
      }
    })
  },
  methods: {
    getRootElement() {
      const node = this.$el
      if (!node || node.nodeType !== 1) return null
      return node
    },
    clickHandle(e) {
      const rootNode = this.getRootElement()
      if (!rootNode) return

      if (e.target.tagName === 'IMG' && e.target.dataset.href) {
        const imgHref = e.target.dataset.href.trim()

        if (imgHref) {
          window.open(imgHref, '_blank')
          return
        }
      }

      let findLink = null
      let currentNode = e.target
      while (currentNode && currentNode !== rootNode) {
        if (currentNode.tagName === 'A') {
          findLink = currentNode
          break
        }

        currentNode = currentNode.parentNode
      }

      if (findLink) {
        e.preventDefault()
        if (findLink.href && findLink.href.trim()) {
          window.open(findLink.href.trim(), '_blank')
          return
        }
      }
    }
  }
}

<template>
  <canvas ref="canvas" class="welfare-ascii-sweep" aria-hidden="true" />
</template>

<script>
export default {
  name: 'WelfareAsciiSweep',
  data() { return { frame: null, target: null } },
  mounted() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const canvas = this.$refs.canvas
    const context = canvas.getContext('2d')
    const target = canvas.closest('.welfare-streak')
    if (!context || !target) return
    this.target = target
    const bounds = canvas.getBoundingClientRect()
    const { width, height } = bounds
    if (!width || !height) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    context.scale(ratio, ratio)
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    // Sample local text and imagery so the character density follows the actual content.
    const source = document.createElement('canvas')
    source.width = Math.ceil(width)
    source.height = Math.ceil(height)
    const ink = source.getContext('2d', { willReadFrequently: true })
    if (!ink) return
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim() || node.parentElement.closest('.welfare-streak__sweep-layer')) continue
      const style = getComputedStyle(node.parentElement)
      const range = document.createRange()
      // Per-character bounds preserve wrapped labels and the title's real geometry.
      for (let index = 0; index < node.textContent.length; index++) {
        const char = node.textContent[index]
        if (!char.trim()) continue
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        const rect = range.getBoundingClientRect()
        if (!rect.width || !rect.height) continue
        ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        ink.fillStyle = '#fff'
        ink.textBaseline = 'middle'
        ink.fillText(char, rect.left - bounds.left, rect.top - bounds.top + rect.height / 2)
      }
    }
    target.querySelectorAll('img').forEach((image) => {
      if (!image.complete || !image.naturalWidth) return
      const rect = image.getBoundingClientRect()
      ink.drawImage(image, rect.left - bounds.left, rect.top - bounds.top, rect.width, rect.height)
    })
    target.querySelectorAll('.welfare-streak__reward, .welfare-streak__completed, .welfare-streak__pending')
      .forEach((element) => {
        const rect = element.getBoundingClientRect()
        ink.strokeStyle = '#fff'
        ink.lineWidth = 1.5
        ink.beginPath()
        ink.arc(rect.left - bounds.left + rect.width / 2, rect.top - bounds.top + rect.height / 2,
          rect.width / 2 - 1, 0, Math.PI * 2)
        ink.stroke()
      })
    const layers = [...target.querySelectorAll('.welfare-streak__heading, .welfare-streak__days')]
    let pixels
    try { pixels = ink.getImageData(0, 0, source.width, source.height).data } catch { return }
    const glyphs = '.:+*#%@'
    const cell = 5
    const band = Math.max(120, width * 0.65)
    const start = performance.now()
    const draw = (now) => {
      const progress = Math.min(1, (now - start) / 1200)
      const head = -band + progress * (width + band * 2)
      layers.forEach((layer) => {
        const left = layer.getBoundingClientRect().left - bounds.left
        layer.style.setProperty('--ascii-head', `${head - left}px`)
        layer.style.setProperty('--ascii-radius', `${width * 0.35}px`)
      })
      context.clearRect(0, 0, width, height)
      context.shadowColor = '#ee5555'
      context.shadowBlur = 4
      const fade = Math.min(1, progress * 10, (1 - progress) * 10)
      for (let row = 0; row * cell < height; row++) {
        const drift = Math.sin(row * 1.7 + progress * 5) * 9
        for (let column = 0; column * cell < width; column++) {
          const x = column * cell + cell / 2
          const y = row * cell + cell / 2
          const offset = (Math.floor(y) * source.width + Math.floor(x)) * 4
          const density = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) / 255
            * pixels[offset + 3] / 255
          const seed = (row * 37 + column * 17) % 97
          const distance = (x - head - drift) / band
          const intensity = Math.exp(-distance * distance * 4)
          const edge = Math.min(1, y / 10, (height - y) / 10, x / 10, (width - x) / 10)
          const alpha = intensity * fade * edge * (density > 0.1 ? 0.95 : 0.1)
          if (alpha < 0.025 || (density < 0.1 && seed < 65)) continue
          const glyph = Math.min(glyphs.length - 1, Math.floor(density * 6 + (seed + progress * 12) % 2))
          context.font = `${density > 0.1 ? 8 : 6}px monospace`
          context.fillStyle = `rgba(238, 85, 85, ${alpha})`
          context.fillText(glyphs[glyph], x + Math.sin(row + progress * 14) * intensity * 3, y)
        }
      }
      if (progress < 1) this.frame = window.requestAnimationFrame(draw)
      else {
        context.clearRect(0, 0, width, height)
        layers.forEach((layer) => {
          layer.style.removeProperty('--ascii-head')
          layer.style.removeProperty('--ascii-radius')
        })
        this.frame = null
      }
    }
    this.frame = window.requestAnimationFrame(draw)
  },
  beforeUnmount() {
    window.cancelAnimationFrame(this.frame)
    this.target?.querySelectorAll('.welfare-streak__heading, .welfare-streak__days')
      .forEach((layer) => {
        layer.style.removeProperty('--ascii-head')
        layer.style.removeProperty('--ascii-radius')
      })
  }
}
</script>

<style lang="scss" scoped>
.welfare-ascii-sweep { display: block; width: 100%; height: 100%; pointer-events: none; }
</style>

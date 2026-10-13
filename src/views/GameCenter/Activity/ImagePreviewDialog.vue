<template>
  <div
    v-if="visible"
    class="image-preview-dialog"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <button type="button" aria-label="关闭预览" @click="close">×</button>
    <video v-if="type === 'video'" :src="src" controls autoplay class="preview-video" />
    <img v-else :src="src" alt="游戏图片预览">
  </div>
</template>
<script>
export default {
  name: 'ImagePreviewDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    src: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'image'
    }
  },
  methods: {
    close() {
      this.$emit('close')
    }
  }
}
</script>
<style lang="scss" scoped>
.image-preview-dialog {
  position: fixed;
  z-index: 2100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .85);
}

.image-preview-dialog img {
  max-width: 90vw;
  max-height: 88vh;
  object-fit: contain;
}

.image-preview-dialog video {
  max-width: 90vw;
  max-height: 88vh;
  object-fit: contain;
}

.image-preview-dialog button {
  position: absolute;
  top: 24px;
  right: 30px;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 36px;
  font-weight: 100;
}
</style>

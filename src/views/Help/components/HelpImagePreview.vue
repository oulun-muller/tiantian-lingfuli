<template>
  <div
    v-if="state.visible"
    class="help-image-preview"
    role="dialog"
    aria-modal="true"
    aria-label="图片预览"
    @click.self="close">
    <button
      type="button"
      class="help-image-preview__close"
      aria-label="关闭图片预览"
      @click="close">
      关闭
    </button>
    <img
      class="help-image-preview__image"
      :src="state.src"
      alt=""
      @click.stop>
  </div>
</template>

<script>
import { imagePreviewState, closeImagePreview } from '../utils/imagePreview'

export default {
  name: 'HelpImagePreview',
  data() {
    return { state: imagePreviewState }
  },
  methods: {
    close() {
      closeImagePreview()
    }
  }
}
</script>

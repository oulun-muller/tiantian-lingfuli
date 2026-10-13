import { reactive } from 'vue'

export const imagePreviewState = reactive({ visible: false, src: '' })

export function openImagePreview(src) {
  if (!src) return
  imagePreviewState.src = src
  imagePreviewState.visible = true
}

export function closeImagePreview() {
  imagePreviewState.visible = false
  imagePreviewState.src = ''
}

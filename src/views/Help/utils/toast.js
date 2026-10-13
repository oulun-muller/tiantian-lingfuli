import { reactive } from 'vue'

export const toastState = reactive({ visible: false, message: '', variant: 'default' })
let timer = null

export function toast(message, variant) {
  const text = String(message || '').trim()
  if (!text) return
  if (timer) clearTimeout(timer)
  toastState.message = text
  toastState.variant = ['success', 'error'].includes(variant) ? variant : 'default'
  toastState.visible = true
  timer = setTimeout(() => {
    toastState.visible = false
    timer = null
  }, 2000)
}

export const toastSuccess = message => toast(message, 'success')
export const toastError = message => toast(message, 'error')

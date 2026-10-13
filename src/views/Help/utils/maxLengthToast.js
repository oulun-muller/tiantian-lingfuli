import { toast } from './toast'

export function isInsertEvent(event) {
  return typeof InputEvent !== 'undefined' && event instanceof InputEvent && event.inputType?.startsWith('insert')
}

export function createMaxLengthToast(maxLength, message) {
  const tip = message || `最多可输入${maxLength}字`
  return {
    onBeforeInput(event, value) {
      if (!isInsertEvent(event)) return
      const target = event.target
      if (target && target.selectionStart === target.selectionEnd && value.length >= maxLength) toast(tip)
    },
    onInput(event) {
      if (isInsertEvent(event) && event.target.value.length === maxLength) toast(tip)
    }
  }
}

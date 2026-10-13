<template>
  <div
    v-if="state.visible"
    class="help-toast-root"
    role="status"
    aria-live="polite">
    <div class="help-toast">
      <img
        class="help-toast__icon"
        :src="icon"
        width="18"
        height="18"
        alt="">
      <div class="help-toast__text-wrap">
        <p class="help-toast__text">{{ state.message }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { toastState } from '../utils/toast'
import iconToastSuccess from '../images/icon-toast-success.svg'
import iconToastError from '../images/icon-toast-error.svg'
import iconToastCaution from '../images/icon-toast-caution.svg'

export default {
  name: 'HelpToast',
  data() {
    return { state: toastState }
  },
  computed: {
    icon() {
      if (this.state.variant === 'success') return iconToastSuccess
      if (this.state.variant === 'error') return iconToastError
      return iconToastCaution
    }
  }
}
</script>

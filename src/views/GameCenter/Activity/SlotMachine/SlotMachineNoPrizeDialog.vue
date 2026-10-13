<template>
  <transition name="slot-dialog-fade">
    <div v-if="visible" class="slot-no-prize-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <section class="slot-no-prize-dialog">
        <button class="close-button" type="button" aria-label="关闭" @click="$emit('close')">x</button>
        <h2>谢谢参与</h2>
        <p>再接再厉，下次好运！</p>
        <button ref="confirmButton" class="confirm-button" type="button" @click="$emit('close')">知道了</button>
      </section>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'SlotMachineNoPrizeDialog',
  emits: ['close'],
  props: { visible: { type: Boolean, default: false } },
  watch: {
    visible: {
      immediate: true,
      handler(visible) {
        if (visible) this.$nextTick(() => this.$refs.confirmButton?.focus())
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.slot-no-prize-overlay { position: fixed; z-index: 9999; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgb(0 0 0 / 60%); }
.slot-no-prize-dialog { position: relative; box-sizing: border-box; width: 430px; max-width: calc(100vw - 32px); min-height: 245px; padding: 60px 40px 42px; border: 1px solid rgb(143 151 160 / 28%); background: #191d23; box-shadow: 0 18px 50px rgb(0 0 0 / 48%); color: #edf1f5; text-align: center; h2 { margin: 0; font-size: 22px; line-height: 30px; } p { margin: 10px 0 28px; color: #8f969e; font-size: 18px; line-height: 26px; } }
.close-button { position: absolute; top: 10px; right: 14px; width: 30px; height: 30px; padding: 0; border: 0; background: transparent; color: #747c85; cursor: pointer; font-size: 22px; }
.confirm-button { min-width: 128px; height: 40px; padding: 0 34px; border: 1px solid #f0f3f5; background: #dce2e6; color: #11151a; cursor: pointer; font-size: 18px; font-weight: 700; }
.slot-dialog-fade-enter-active, .slot-dialog-fade-leave-active { transition: opacity .18s ease; }
.slot-dialog-fade-enter-from, .slot-dialog-fade-leave-to { opacity: 0; }
</style>

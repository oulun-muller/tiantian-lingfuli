<template>
  <div v-if="visible" class="Dialog">
    <div class="wrap">
      <div class="header">
        <div class="title">{{ title }}</div>
        <span
          class="close"
          role="button"
          tabindex="0"
          aria-label="关闭"
          @click="$emit('close')"
          @keydown.enter.prevent="$emit('close')"
          @keydown.space.prevent="$emit('close')"/>
      </div>
      <div class="content">
        <slot/>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '标题'
    }
  }
}
</script>
<style lang="scss" scoped>
.Dialog {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999;
  .wrap {
    width: 600px;
    min-height: 300px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #171c21;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    height: 39px;
    background: linear-gradient(270deg, #1E232B 0.32%, #2A313C 51.32%, #1E232B 99.78%);
    color: #EAF7FF99;
    .close {
      cursor: pointer;
      display: inline-block;
      width: 10px;
      height: 10px;
      background: transparent url('~@/images/Index/close.png') no-repeat center center/ contain;
    }
  }
}

.PhoneDevice {
  .Dialog {
    .wrap {
      width: 340px;
    }
  }
}

@media screen and (max-width: 550px) {
  .Dialog .wrap {
    width: calc(100vw - 40px);
  }
}

</style>

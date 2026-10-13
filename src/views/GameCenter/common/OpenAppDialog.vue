<template>
  <Dialog class="open-app-dialog" :visible="visible" title="参与活动" @close="$emit('close')">
    <p class="text">
      请在Legion Zone最新版本（2.0.16及以上版本）客户端内参与活动。
      <br>
      如果未安装Legion Zone或Legion Zone版本过旧，请下载并安装最新版本。
    </p>
    <div class="btn-wrap">
      <a class="trans-btn" href="https://legionzone.lenovo.com/" target="_blank">下载Legion Zone</a>
      <a class="grey-btn" :href="openAppUrl">在Legion Zone打开</a>
    </div>
  </Dialog>
</template>
<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      openAppUrl: `lenovo-legionzone:#/gamecenter/online/index?id=${this.$route.query.id}&source=browser`
    }
  }
}
</script>
<style lang="scss" scoped>
.open-app-dialog {
  padding: 23px 0 23px 23px;
  .text {
    margin: 23px 24px;
    color: #EAF7FF;
    font-size: 14px;
    line-height: 28px;
  }
  .btn-wrap {
    padding-top: 50px;
    text-align: center;
    .trans-btn {
      display: inline-block;
      width: 160px;
      padding: 6px 0;
      color: #EAF7FF;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      line-height: 22px;
      border: 1px solid #fff;
    }
    .grey-btn {
      margin-left: 20px;
      display: inline-block;
      width: 160px;
      padding: 6px 0;
      color: #000;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      line-height: 22px;
      border: 1px solid #fff;
      background: linear-gradient(to bottom, rgba(146, 146, 146, 1), rgba(234, 247, 255, 1));
    }
  }
}

.PhoneDevice {
  .open-app-dialog .btn-wrap .trans-btn {
    width: 110px;
  }
  .open-app-dialog .btn-wrap .grey-btn {
    width: 112px;
  }
}

.open-app-dialog .btn-wrap .trans-btn:focus-visible,
.open-app-dialog .btn-wrap .grey-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

@media (forced-colors: active) {
  .open-app-dialog .btn-wrap .trans-btn:focus-visible,
  .open-app-dialog .btn-wrap .grey-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

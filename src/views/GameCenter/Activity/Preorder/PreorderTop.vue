<template>
  <section>
    <div class="preorder-top" :style="topStyle">
      <div class="top-content">
        <div class="top-overlay" v-if="config.overlay" :style="{ backgroundImage: `url(${config.overlay})` }" />
        <div class="top-overlay2" v-if="config.overlay2" :style="{ backgroundImage: `url(${config.overlay2})` }" />
        <div
          class="top-buy-btn"
          v-if="config.buyButton"
          :style="{ backgroundImage: `url(${config.buyButton})` }"
          role="button"
          tabindex="0"
          aria-label="顶部购买按钮图"
          @click="$emit('buy')"
          @keydown.enter.prevent="$emit('buy')"
          @keydown.space.prevent="$emit('buy')"
        />
        <h1>
          <span @click="handleMyOrder">我的订单</span>
          <i>|</i>
          <span @click="$emit('intro')">游戏介绍</span>
        </h1>
      </div>
    </div>

    <div class="top-content-min-840">
      <div class="top-overlay" v-if="config.overlay" :style="{ backgroundImage: `url(${config.overlay})` }" />
      <div class="top-overlay2" v-if="config.overlay2" :style="{ backgroundImage: `url(${config.overlay2})` }" />
      <div
        class="top-buy-btn"
        v-if="config.buyButton"
        :style="{ backgroundImage: `url(${config.buyButton})` }"
        role="button"
        tabindex="0"
        aria-label="顶部购买按钮图"
        @click="$emit('buy')"
        @keydown.enter.prevent="$emit('buy')"
        @keydown.space.prevent="$emit('buy')"
      />
      <h1>
        <span @click="handleMyOrder">我的订单</span>
        <i>|</i>
        <span @click="$emit('intro')">游戏介绍</span>
      </h1>
    </div>
  </section>
</template>

<script>
export default {
  name: 'PreorderTop',
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportUrl'],
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      exposeObserver: null,
      exposeTimer: null,
      isExposed: false
    }
  },
  mounted() {
    // 顶部模块进入视口即上报曝光；划出再划入视为新的曝光，重复上报。
    // 注意：活动页滚动发生在 .Activity 容器内，必须把该容器设为 root，否则监听不到。
    if (typeof IntersectionObserver === 'undefined') {
      this.reportTopShow()
      return
    }
    const rootContainer = this.$el.closest('.Activity') || null
    this.exposeObserver = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && !this.isExposed) {
        this.isExposed = true
        this.exposeTimer = setTimeout(() => {
          clearTimeout(this.exposeTimer)
          this.exposeTimer = null
          this.reportTopShow()
        }, 500)
      } else if (!entry.isIntersecting && this.isExposed) {
        this.isExposed = false
        if (this.exposeTimer) {
          clearTimeout(this.exposeTimer)
          this.exposeTimer = null
        }
      }
    }, {
      root: rootContainer,
      threshold: 0
    })
    this.exposeObserver.observe(this.$el)
  },
  beforeUnmount() {
    if (this.exposeTimer) {
      clearTimeout(this.exposeTimer)
      this.exposeTimer = null
    }
    if (this.exposeObserver) {
      this.exposeObserver.disconnect()
      this.exposeObserver = null
    }
  },
  computed: {
    // 新增字段：top.background，预购页顶部背景图；
    topStyle() {
      return {
        backgroundImage: this.config.background ? `url(${this.config.background})` : 'none',
        backgroundSize: 'contain',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    channelInfo() {
      return this.$store.state.channelInfo
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') return 4
      if (this.$route.query.source === 'browser') return 9
      return this.$route.query.firstLocal || ''
    }
  },
  methods: {
    handleMyOrder() {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_preOrderH5TopMyOrderClick',
        'click',
        {
          detail: JSON.stringify({
            firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
            secondLocal: 11,
            plateName: this.getActivityName(),
            activityid: this.activityId,
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isLabel: this.$route.query.isLabel ? 'yes' : 'no',
            configPolicy: this.$route.query?.configPolicy ? '1' : '0',
            isPreOrder: 'yes',
            url: this.getReportUrl()
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
      this.$emit('orders')
    },
    reportTopShow() {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_preOrderH5TopPageShow',
        'pv',
        {
          detail: JSON.stringify({
            firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
            secondLocal: 11,
            plateName: this.getActivityName(),
            activityid: this.activityId,
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isLabel: this.$route.query.isLabel ? 'yes' : 'no',
            configPolicy: this.$route.query?.configPolicy ? '1' : '0',
            isPreOrder: 'yes',
            url: this.getReportUrl()
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
    }
  }
}
</script>

<style lang="scss" scoped>
.top-content-min-840 {
  display: none;
}
section {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 9%;
    height: 100%;
    background: linear-gradient(270deg, #000 0%, rgba(0, 0, 0, 0.00) 100%);
  }
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(270deg, rgba(0, 0, 0, 0.00) 0%, #000 100%);
    z-index: 1;
  }
}
.preorder-top {
  position: relative;
  width: 100%;
  height: 60vw;
  max-height: 720px;
  min-height: 231px;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 10%;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.00) 0%, #000 100%);
  }
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 10%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #000 100%);
  }
  .top-content {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 40px;
    text-align: center;
    z-index: 2;
    .top-overlay {
      width: 316px;
      height: 88px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .top-overlay2 {
      margin-top: 16px;
      width: 316px;
      height: 181px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .top-buy-btn {
      margin-top: 16px;
      top: 448px;
      width: 316px;
      height: 88px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      cursor: pointer;
      opacity: 0.9;
      &:hover {
        opacity: 1;
      }
    }
    h1 {
      margin-top: 16px;
      color: rgba(255, 255, 255, 0.60);
      font-family: "Microsoft YaHei";
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      i {
        color: rgba(255, 255, 255, 0.35);
        padding: 0 16px;
        box-sizing: border-box;
        font-weight: 100;
      }
      span {
        cursor: pointer;
        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }
}

@media (max-width: 840px) {
  section {
    &::after {
      display: none;
    }
    &::before {
      display: none;
    }
  }
  .preorder-top {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 10%;
      background: linear-gradient(0deg, rgba(0, 0, 0, 0.00) 0%, #000 100%);
    }
    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 40%;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #000 100%);
    }
  }
  .preorder-top .top-content {
    display: none;
  }
  .top-content-min-840 {
    position: relative;
    z-index: 9;
    top: -89px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: auto;
    .top-overlay {
      width: 316px;
      height: 88px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .top-overlay2 {
      margin-top: 16px;
      width: 316px;
      height: 181px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
    }
    .top-buy-btn {
      margin-top: 16px;
      top: 448px;
      width: 316px;
      height: 88px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      cursor: pointer;
    }
    h1 {
      margin-top: 16px;
      color: rgba(255, 255, 255, 0.60);
      font-family: "Microsoft YaHei";
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      i {
        color: rgba(255, 255, 255, 0.35);
        padding: 0 16px;
        box-sizing: border-box;
        font-weight: 100;
      }
      span {
        cursor: pointer;
        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }
}
</style>

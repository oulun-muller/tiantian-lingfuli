<template>
  <div
    ref="scrollWrapper"
    :class="`infinite-scroll-component-box-${direction}`"
    :style="{ '--speed-': `${speed}s` }">
    <div
      ref="scrollContent"
      class="scroll-content">
      <template v-if="content && content.length">
        <div
          v-for="(item, index) in content"
          v-exposure="{
            handler: ()=>onExposure(item,index),
            options: { threshold: 0 },
            once: true,
            delay: 1000,
          }"
          :key="'item' + index"
          class="loop-item 1">
          <slot :item="item" :index="index" />
        </div>
        <template v-if="loop">
          <div
            v-for="(item, index) in content"
            :key="'itemCopy' + index"
            class="loop-item 2"
            aria-hidden="true">
            <slot :item="item" :index="index" />
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfiniteScroll',
  props: {
    direction: {
      type: String,
      default: 'left'
    },
    content: {
      type: Array,
      default: null
    },
    speedRate: {
      type: Number,
      default: 20 // 速率倍速，越大越快，默认值20
    }
  },
  data() {
    return {
      speed: 0,
      loop: false,
      isFirstMark: false
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
    const wrapperRef = this.$refs.scrollWrapper
    const wrapperEl = wrapperRef?.$el || wrapperRef
    if (wrapperEl && wrapperEl.nodeType === 1) {
      this.resizeObserver.observe(wrapperEl)
    }
  },
  beforeUnmount() {
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  methods: {
    async init() {
      // 获取外容器宽度
      const _scrollWrapper = this.$refs.scrollWrapper.offsetWidth
      // 获取item 总宽度
      const itemWidth = this.$refs.scrollWrapper.getElementsByClassName('scroll-content')[0].offsetWidth
      // 如果item总宽度大于外容器宽度，则开始循环滚动
      if (itemWidth > _scrollWrapper) {
        if (this.direction === 'right') {
          if (!this.isFirstMark) {
            this.isFirstMark = true
            this.$refs.scrollContent.style.left = '-' + (itemWidth - _scrollWrapper) + 'px'
          } else {
            this.$refs.scrollContent.style.left = '-' + (itemWidth / 2 - _scrollWrapper) + 'px'
          }
        }
        this.loop = true
        this.speed = itemWidth / this.speedRate
      } else {
        // 不循环滚动
        this.speed = 0
        this.$refs.scrollWrapper.getElementsByClassName('scroll-content')[0].style.transform = 'translateX(0)'
        this.loop = false
      }
    },
    resizeObserverHandle(entries) {
      if (!entries || entries.length <= 0 || entries[0].borderBoxSize.length <= 0) return

      this.$nextTick(() => {
        this.init()
      })
    },
    onExposure(item, index) {
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeEventsZoneOperatBitsShow',
        'pv',
        {
          detail: JSON.stringify({
            activityName: item.name,
            activityid: item.id,
            actstatus: {
              1: '进行中',
              0: '即将开始',
              2: '已结束'
            }[item.validStatus],
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            subscribed: 3
          })
        }
      )
    }
  }

}
</script>

<style lang="scss" scoped>
.infinite-scroll-component-box-left,
.infinite-scroll-component-box-right {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 202px;
  &::before {
    position: absolute;
    left: 0;
    top: 0;
    content: '';
    width: 42px;
    height: 100%;
    background: linear-gradient(90deg, rgba(0,0,0,.2) 25.22%, rgba(13, 15, 19, 0) 100%);
    z-index: 2;
  }
  &::after {
    position: absolute;
    right: 0;
    top: 0;
    content: '';
    width: 42px;
    height: 100%;
    background: linear-gradient(-90deg, rgba(0,0,0,.2) 25.22%, rgba(13, 15, 19, 0) 100%);
    z-index: 2;
  }
  .scroll-content {
    height: 100%;
    position: absolute;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    .loop-item {
      margin-right: 20px;
      position: relative;
      :deep(.banner-img-item) {
        width: 360px;
        height: 202px;
        border-radius: 16px;
        object-fit: cover;
      }
    }
    &:hover {
      animation-play-state: paused;
      .loop-item:not(:hover) {
        opacity: .5;
      }
    }
  }
}
.infinite-scroll-component-box-left {
  .scroll-content {
    flex-direction: row;
    animation: var(--speed-) move-left linear infinite;
    .loop-item:nth-last-child(1) {
      margin-right: 0;
    }
    @keyframes move-left {
      0% {
          transform: translateX(0);
      }
      100% {
          transform: translateX(-50%);
      }
    }
  }
}
.infinite-scroll-component-box-right {
  margin-top: 20px;
  .scroll-content {
    flex-direction: row-reverse;
    animation: var(--speed-) move-right linear infinite;
    .loop-item:first-child {
      margin-right: 0;
    }
    @keyframes move-right {
      0% {
          transform: translateX(-50%);
      }
      100% {
          transform: translateX(0);
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .infinite-scroll-component-box-left,
  .infinite-scroll-component-box-right {
    .scroll-content {
      animation: none;
    }
  }
}

.PadDevice {
  @media screen and (max-width: 800px) {
    .infinite-scroll-component-box-left,
.infinite-scroll-component-box-right {
          height: 154px
}
  }
}

</style>

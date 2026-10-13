<template>
  <section
    tabindex="0"
    role="button"
    :aria-label="(gameData && gameData.appName) ? gameData.appName + '，点击打开' : '点击打开'"
    @click="open"
    @keydown.enter.prevent.stop="open"
    @keydown.space.prevent.stop="open">
    <i :style="{ backgroundImage: `url('${(gameData && gameData.iconUrl) || defaultImg}')` }" aria-hidden="true"></i>
    <div :class="{ content: true, 'has-button': showDownloadButton }">
      <div class="name">{{ gameData && gameData.appName }}</div>
      <div class="des">{{ totalTimeFormat((gameData && gameData.sumSeconds) || 0) }}</div>
    </div>
    <div class="button" v-if="showDownloadButton">
    </div>
  </section>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'

import { StoreLZRunStoreApp } from '@/nativeApiPad/download'
export default {
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png')
    }
  },
  props: {
    gameData: {
      type: Object,
      default: null
    },
    showDownloadButton: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    drinfo() {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: `` || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: ''
        })
      }
    }
  },
  mounted() {
    if (!this.observer) {
      this.observer = new IntersectionObserver(entries => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          if (!this.timer) {
            this.timer = setTimeout(() => {
              clearTimeout(this.timer)
              this.timer = null
              this.dataReport()
              this.observer.unobserve(entry.target)
            }, 1000)
          }
          // 可选：如果只需要检测一次，进入后可以停止监听
          // observer.unobserve(target);
        } else {
          if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
          }
        }
      }, {
        root: null, // 监听的根元素，null 表示视口
        threshold: 0, // 触发回调的可见比例（0=只要有1像素可见就触发，1=元素完全可见才触发）
        rootMargin: '0px' // 根元素的外边距，类似 CSS margin，可扩展/收缩检测区域
      })
    }
    this.observer.observe(this.$el)
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  },
  methods: {
    totalTimeFormat(value) {
      return value / (1000 * 60 * 60) > 1
        ? `共玩${(value / (1000 * 60 * 60)).toFixed(0)}小时`
        : `共玩${(value / (1000 * 60)).toFixed(0)}分钟`
    },
    open() {
      StoreLZRunStoreApp(this.gameData.packageName)
      this.$dataReport('LZ_gamingCenter', 'LZ_recentGamesClick', 'click', {
        detail: JSON.stringify({ skuName: this.gameData.appName, package: this.gameData.packageName, lid: getLegacyLenovoId() })
      })
    },
    dataReport() {
      this.$dataReport('LZ_gamingCenter', 'LZ_recentGamesShow', 'pv', {
        detail: JSON.stringify({ skuName: this.gameData.appName, package: this.gameData.packageName, lid: getLegacyLenovoId() })
      })
    }
  }
}
</script>
<style lang="scss" scoped>
section {
  display: flex;
  align-items: center;
  border-radius: 8px;
  height: 96px;
  width: 100%;
  z-index: 1;
  box-sizing: border-box;
  position: relative;
  background: linear-gradient(to right, rgba(30, 34, 39, 0.4), rgba(112, 118, 150, 0.4));
  gap: 16px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    /* 继承按钮圆角 */
    padding: 1px;
    /* 边框宽度：1px */
    background: linear-gradient(to right, rgba(234, 247, 255, 0.15), rgba(255, 255, 255, 0.15));
    /* 渐变方向和颜色 */
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: -1;
    pointer-events: none;
    /* 不影响按钮点击 */
  }

  i {
    width: 96px;
    height: 96px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 15px;
    flex: none;
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      /* 继承按钮圆角 */
      padding: 1px;
      /* 边框宽度：1px */
      background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(252, 252, 252, 0.2));
      /* 渐变方向和颜色 */
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      z-index: -1;
      pointer-events: none;
      /* 不影响按钮点击 */
    }
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: rgba(234, 247, 255, 1);
    gap: 12px;
    max-width: calc(100% - 96px - 12px);

    &.has-button {
      max-width: calc(100% - 96px - 12px - 68px - 24px);
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 15px;
      font-weight: 700;
    }

    .des {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
    }
  }

  >div.button {
    //  position: absolute;
    margin-right: 10px;
    margin-left: auto;
    // right: 10px;
    // top: 50%;
    // transform: translateY(-50%);
    width: 68px;
    height: 34px;
    background-image: url('./runtime-btn.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
}

.PhoneDevice {
  section {
    height: 60px;

    .content {
      gap: 2px;
    }

    i {
      height: 60px;
      width: 60px;
      border-radius: 16px;
    }

    .button {
      width: 60px;
      height: 28px;
      margin-right: 18px;
    }

    .des {
      color: rgba(234, 247, 255, 0.60);
    }
  }
}

section:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

@media (forced-colors: active) {
  section:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

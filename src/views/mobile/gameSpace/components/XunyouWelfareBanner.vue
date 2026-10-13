<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="xunyou-welfare-banner"
      :class="`is-${welfareType}`"
      :style="bannerPositionStyle">
      <!-- 底图是照片级插画（桌面 + 金色 VIP 徽章），整体随图出；标题与副标题是矢量轮廓，见 __text -->
      <img class="xunyou-welfare-banner__bg" :src="bannerBackground" alt="" aria-hidden="true" />
      <span class="xunyou-welfare-banner__shade" aria-hidden="true"></span>
      <img class="xunyou-welfare-banner__text" :src="textImage" alt="" aria-hidden="true" />

      <button
        type="button"
        class="xunyou-welfare-banner__claim"
        :disabled="claiming"
        aria-label="领取"
        @click.stop="onClaim">
        <img :src="claimButton" alt="" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="xunyou-welfare-banner__close"
        aria-label="关闭"
        @click.stop="onClose">
        <img :src="closeIcon" alt="" aria-hidden="true" />
      </button>
    </div>
  </Teleport>
</template>

<script>
import bannerBackground from '../image/xunyou-welfare-banner-bg.webp'
import newcomerText from '../image/xunyou-welfare-banner-text-newcomer.svg'
import returningText from '../image/xunyou-welfare-banner-text-returning.svg'
import claimButton from '../image/xunyou-welfare-banner-claim.svg'
import closeIcon from '../image/xunyou-welfare-banner-close.svg'
import {
  claimGift as claimSharedGift,
  claiming as sharedClaiming,
  currentWelfare,
  currentWelfareType
} from '@/utils/xunyouGiftState'

// 「每天弹一次」：关闭后把当天日期落到本地，当天不再出现，次日恢复。
const DISMISS_STORAGE_KEY = 'XUNYOU_WELFARE_BANNER_DISMISSED_DATE'

function todayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export default {
  name: 'XunyouWelfareBanner',
  props: {
    // #35 / #36 的 source：福利露出位靠本参数区分 —— 本横幅是游戏空间页的悬浮弹层，报 homePop；
    // 会员页的福利卡报 memberPage（见 acceleratorBuy/index.vue）。
    // 原先游戏空间页有第二个露出位（会员卡的福利态，报 home），已按设计改版移除。
    source: {
      type: String,
      default: 'homePop'
    }
  },
  data() {
    return {
      bannerBackground,
      newcomerText,
      returningText,
      claimButton,
      closeIcon,
      dismissedToday: window.localStorage.getItem(DISMISS_STORAGE_KEY) === todayKey(),
      gameIconCenterY: null,
      acceleratorCardCenterY: null,
      acceleratorCardBottom: null,
      acceleratorCardRight: null,
      gameIconLayoutObserver: null,
      bannerPositionFrame: undefined,
      // #35 曝光去重：一次挂载只报 1 条
      showReported: false
    }
  },
  computed: {
    loginStatus() {
      return this.$store.state.user.loginStatus
    },
    welfare() {
      return currentWelfare.value
    },
    welfareType() {
      return currentWelfareType.value
    },
    claiming() {
      return sharedClaiming.value
    },
    textImage() {
      return this.welfareType === 'newcomer' ? this.newcomerText : this.returningText
    },
    bannerPositionStyle() {
      const style = {}
      if (this.gameIconCenterY !== null) {
        style['--xunyou-welfare-banner-center-y'] = `${this.gameIconCenterY}px`
      }
      if (this.acceleratorCardCenterY !== null) {
        style['--xunyou-welfare-banner-accelerator-center-y'] = `${this.acceleratorCardCenterY}px`
      }
      if (this.acceleratorCardBottom !== null) {
        style['--xunyou-welfare-banner-accelerator-bottom'] = `${this.acceleratorCardBottom}px`
      }
      if (this.acceleratorCardRight !== null) {
        style['--xunyou-welfare-banner-accelerator-right'] = `${this.acceleratorCardRight}px`
      }
      return Object.keys(style).length ? style : undefined
    },
    visible() {
      return !this.dismissedToday && this.loginStatus === 'yes' && !!this.welfare
    }
  },
  watch: {
    // 福利数据是异步到的，所以曝光不能在 mounted 里报 —— 要等它真的显示出来
    visible: {
      handler(visible) {
        if (visible) {
          this.reportShow()
          this.scheduleBannerPositionUpdate()
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.gameIconLayoutObserver = new MutationObserver(() => this.scheduleBannerPositionUpdate())
    const gameSpace = document.querySelector('.my-games')
    if (gameSpace) {
      this.gameIconLayoutObserver.observe(gameSpace, { childList: true, subtree: true })
    }
    window.addEventListener('resize', this.scheduleBannerPositionUpdate)
    this.scheduleBannerPositionUpdate()
  },
  beforeUnmount() {
    this.gameIconLayoutObserver?.disconnect()
    window.removeEventListener('resize', this.scheduleBannerPositionUpdate)
    if (this.bannerPositionFrame !== undefined) cancelAnimationFrame(this.bannerPositionFrame)
  },
  methods: {
    scheduleBannerPositionUpdate() {
      if (this.bannerPositionFrame !== undefined) cancelAnimationFrame(this.bannerPositionFrame)
      this.bannerPositionFrame = requestAnimationFrame(() => {
        this.bannerPositionFrame = undefined
        const gameIcon = document.querySelector('.my-games .game-snap-carousel .snap-item.active')
          || document.querySelector('.my-games .game-snap-carousel .snap-item')
        const acceleratorCard = document.querySelector('.my-games .xunyou-member-card-slot')
        const isLandscape = window.matchMedia('(orientation: landscape)').matches
        if (!gameIcon && !acceleratorCard) {
          this.gameIconCenterY = null
          this.acceleratorCardCenterY = null
          this.acceleratorCardBottom = null
          this.acceleratorCardRight = null
          return
        }
        if (gameIcon) {
          const rect = gameIcon.getBoundingClientRect()
          this.gameIconCenterY = rect.top + rect.height / 2
        }
        if (acceleratorCard) {
          const rect = acceleratorCard.getBoundingClientRect()
          this.acceleratorCardCenterY = rect.top + rect.height / 2
          this.acceleratorCardBottom = rect.bottom
          this.acceleratorCardRight = window.innerWidth - rect.right
        }
        if (isLandscape && !acceleratorCard) {
          this.acceleratorCardCenterY = null
          this.acceleratorCardBottom = null
          this.acceleratorCardRight = null
        }
      })
    },
    /* ============ 埋点（需求文档 3.4「会员与福利」）============
       福利的露出位有两个：游戏空间的福利横幅（本组件，source=homePop）、会员页的福利卡
       （source=memberPage）。曝光 #35 与点击 #36 都是「哪处露出就报哪处」，参数一致。
       原先游戏空间还有会员卡的福利态（source=home），已按设计改版移除。 */
    reportShow() {
      if (this.showReported) return
      this.showReported = true
      this.report('LZ_accelWelfareCardShow', 'pv')
    },
    reportClaim() {
      this.report('LZ_accelWelfareCardClaimClick', 'click')
    },
    report(event, type) {
      const detail = {
        source: this.source,
        welfareType: this.welfareType
      }
      console.log(`[XunyouAccel] H5 ${event}`, detail)
      this.$dataReport('LZ_myGames', event, type, { detail: JSON.stringify(detail) })
    },
    onClaim() {
      if (this.claiming) return
      // #36 点「领取」即上报，与领取结果无关（去重靠 claiming 守卫）
      this.reportClaim()
      claimSharedGift(this.welfare).catch(err => {
        this.$errorMessage(err?.message || '领取失败，请稍后重试')
      })
    },
    onClose() {
      this.dismissedToday = true
      window.localStorage.setItem(DISMISS_STORAGE_KEY, todayKey())
    }
  }
}
</script>

<style lang="scss" scoped>
/* 380×96 悬浮横幅 = 照片底图 + 右侧压暗渐变 + 标题/副标题（矢量轮廓随图出）
   + 「领取」按钮 + 关闭。文案不随数据变（只有新人/回归两种固定形态），所以全部随图出。 */
.xunyou-welfare-banner {
  position: fixed;
  z-index: 900;
  width: 380px;
  height: 96px;
  box-sizing: border-box;
  border-radius: 12px;
  overflow: hidden;
  background-color: #07090d;
  box-shadow: 0 0 9.4px 0 #000, 0 0 40px 0 #000;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &__bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 358px;
    height: 96px;
    display: block;
  }

  /* 设计稿里是 196 宽的渐变矩形整体镜像过的，等价于「左透明 → 45.752% 起纯 #102039」，
     给右侧的「领取」按钮垫一层深色，别把照片的花纹透到按钮边上。 */
  &__shade {
    position: absolute;
    right: 0;
    top: 0;
    width: 196px;
    height: 96px;
    display: block;
    background-image: linear-gradient(to right, rgba(16, 32, 57, 0) 0%, #102039 45.752%);
  }

  &__text {
    position: absolute;
    left: 99px;
    /* 设计稿组件区里的母版是 top 22，但游戏空间页/横屏页上的两个实例都把底图与文字一起下移了 2px，
       以实例为准（这也是用户给的那两个节点）。 */
    top: 24px;
    width: 140px;
    height: 49px;
    display: block;
  }

  &__claim {
    position: absolute;
    left: 282px;
    top: 32px;
    width: 66px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;

    img {
      display: block;
      width: 66px;
      height: 32px;
    }

    &:disabled {
      cursor: default;
      opacity: 0.85;
    }
  }

  /* 视觉仍是设计稿的 16×16（图标靠 8px 内边距落回 left 356 / top 8），
     但点击区扩到 32×32 —— 16px 在真机上太难点。 */
  &__close {
    position: absolute;
    left: 348px;
    top: 0;
    width: 32px;
    height: 32px;
    padding: 8px;
    border: none;
    background: transparent;
    cursor: pointer;

    img {
      display: block;
      width: 16px;
      height: 16px;
    }
  }

  /* 描边画在底图上层：用 border 会挤压内容区，底图跟着缩 0.5px 而错位 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 0.5px solid rgba(255, 255, 255, 0.24);
    border-radius: 12px;
    box-sizing: border-box;
    pointer-events: none;
  }
}

/* 设计稿给的是两套版式：phone 竖屏压在底部游戏图标条上方，pad 横屏悬浮在右上角。
   与卡片一样按 orientation 切（不是按设备），否则手机横屏会拿到 pad 的位置。 */
@media (orientation: portrait) {
  .xunyou-welfare-banner {
    /* 横幅中心水平线由运行时读取活动游戏图标的实际矩形得出；fallback 仅用于游戏列表尚未就绪的瞬间。 */
    left: 50%;
    top: calc(var(--xunyou-welfare-banner-center-y, calc(100vh - 253px)) - 48px);
    bottom: auto;
    transform: translateX(-50%);
  }
}

@media (orientation: landscape) {
  .xunyou-welfare-banner {
    /* 右边界与游戏空间入口行里的加速器 VIP 会员卡右边界对齐；底部停在会员卡下缘上方 12px，
       让会员卡下边缘和上方的天天领好礼入口都保留少量可见区域：
       该入口行 `.action-group-new` 横屏是 padding 0 20 + space-between，
       卡片右边界落在距屏幕右 20px，横幅跟齐（原设计稿 1024×640 的 31px 会偏左 11px）。 */
    right: var(--xunyou-welfare-banner-accelerator-right, 20px);
    top: calc(var(--xunyou-welfare-banner-accelerator-bottom, 183px) - 118px);
  }
}
</style>

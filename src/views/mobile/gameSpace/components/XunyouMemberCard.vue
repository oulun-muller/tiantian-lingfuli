<template>
  <div
    class="xunyou-member-card"
    :class="{ 'is-loading': cardState === 'loading' }"
    @click="onClick">
    <img class="xunyou-member-card__bg" :src="cardBackground" alt="" aria-hidden="true" />
    <span class="xunyou-member-card__subtitle" :class="{ 'is-le7': cardState === 'memberLe7' }">{{ cardSubtitle }}</span>
    <img v-if="cardState === 'unopened'" class="xunyou-member-card__open-btn" :src="openButton" alt="" aria-hidden="true" />
  </div>
</template>

<script>
import memberCardBg from '../image/xunyou-member-card-bg.svg'
import unopenedCardBg from '../image/xunyou-member-card-bg-unopened.svg'
import openButton from '../image/xunyou-member-card-open-btn.svg'
import {
  accelRemainDays,
  formatAccelExpireDate
} from '@/utils/xunyouAccel'

const LOAD_TIMEOUT_MS = 8000

export default {
  name: 'XunyouMemberCard',
  emits: ['click'],
  data() {
    return {
      memberCardBg,
      unopenedCardBg,
      openButton,
      loadTimedOut: false,
      loadTimer: null,
      // #33 曝光去重：一张卡一次生命周期只报 1 条（需求文档 1.2）
      cardShowReported: false
    }
  },
  computed: {
    loginStatus() {
      return this.$store.state.user.loginStatus
    },
    accelStatus() {
      return this.$store.state.user.accelStatus
    },
    remainDays() {
      return accelRemainDays(this.accelStatus)
    },
    expireDateText() {
      return formatAccelExpireDate(this.accelStatus && this.accelStatus.vipExpireTime)
    },
    // 权益状态已定：已登录且拿到了有效的权益回包（errorCode -1 表示还在请求中）
    stateSettled() {
      return this.loginStatus === 'yes'
        && !!this.accelStatus
        && Number(this.accelStatus.errorCode) !== -1
    },
    /**
     * 卡片四态（三态样式 + 一个过渡态）：
     *   loading    权益加载中（过渡态，设计稿没有这一态，复用未开通底图但不显示「开通」按钮）
     *   unopened   未开通    —— 底图无右箭头，右侧是「开通」按钮
     *   memberGt7  会员，剩余 > 7 天
     *   memberLe7  会员，剩余 ≤ 7 天
     * 未登录直接按未开通展示（点卡片会拉起原生登录，登录成功后由父级继续进套餐页）。
     */
    cardState() {
      if (this.loginStatus === 'no') return 'unopened'
      if (!this.stateSettled && !this.loadTimedOut) return 'loading'

      const status = this.accelStatus
      if (Number(status?.errorCode) === 0) {
        const userState = Number(status.userState)
        if (userState === 2 || userState === 4) {
          if (this.remainDays > 7) return 'memberGt7'
          if (this.remainDays >= 1) return 'memberLe7'
        }
      }
      return 'unopened'
    },
    cardSubtitle() {
      switch (this.cardState) {
        case 'loading': return '权益加载中'
        case 'memberLe7': return `剩余 ${this.remainDays} 天`
        case 'memberGt7': return `有效期至 ${this.expireDateText}`
        default: return '双链路加速，极速竞技'
      }
    },
    // 会员态底图带右侧箭头；未开通态的箭头位置让给了「开通」按钮，带箭头的图不能复用
    cardBackground() {
      return (this.cardState === 'memberGt7' || this.cardState === 'memberLe7')
        ? this.memberCardBg
        : this.unopenedCardBg
    }
  },
  watch: {
    // 卡片是状态机多态卡：#33 的曝光、#34 的点击都按当前态分流，
    // 所以状态一变就尝试曝光（loading 态不报，等状态定下来再报）。
    cardState: {
      handler(state) {
        this.reportCardShow(state)
      },
      immediate: true
    }
  },
  mounted() {
    // 权益状态迟迟不定时不要一直卡在「权益加载中」，到点按未开通展示；
    // 之后状态真到了会自然切过去（cardState 是计算属性）。
    this.startLoadTimeout()
  },
  beforeUnmount() {
    this.clearLoadTimeout()
  },
  methods: {
    /* ============ 迅游会员卡埋点（需求文档 3.4「会员与福利」）============
       三态卡整卡只有一个 @click，内部按状态分流：
         曝光 —— #33 LZ_accelVipCardShow（未开通 / 会员态）
         点击 —— #34 LZ_accelVipCardButtonClick
       category 都是 LZ_myGames；单参数平铺在 params 顶层。

       福利态（新人 / 回归）已从本卡片移除 —— 游戏空间页的福利入口只剩底部的福利横幅
       （XunyouWelfareBanner），#35 / #36 的 source 由三个取值收敛为 homePop / memberPage 两个。 */

    /**
     * #33 曝光：卡片态定下来时上报（需求文档 3.4）。
     * 去重：一次卡片生命周期只报 1 条（需求文档 1.2）——首个定下来的态就是最终态；
     * loading 态（状态未定）不报，等状态定下来再报。
     */
    reportCardShow(state) {
      if (this.cardShowReported) return
      if (state === 'loading') return
      this.cardShowReported = true
      this.reportVipCardShow(state)
    },
    // #33 会员卡片曝光（pv，单参数平铺）：未开通态与会员态都报这条。
    // memberStatus 只有 vip / nonVip 两档，不按剩余天数分流（需求文档 3.4 #33）
    reportVipCardShow(state) {
      const memberStatus = (state === 'memberGt7' || state === 'memberLe7') ? 'vip' : 'nonVip'
      console.log('[XunyouAccel] H5 #33 会员卡片曝光', { memberStatus })
      this.$dataReport('LZ_myGames', 'LZ_accelVipCardShow', 'pv', { memberStatus })
    },
    /**
     * #34 会员卡片按钮点击（click，单参数平铺）。
     * H5 卡片上没有独立的按钮元素，「按钮点击」就是整卡点击（需求文档 3.4 #34 已确认），
     * 未开通态右侧那个「开通」按钮只是视觉引导、不单独绑事件；
     * 映射：unopened → subscribe 开通，memberGt7 / memberLe7 → renew 续费。
     */
    reportVipCardButtonClick() {
      const clickAction = (this.cardState === 'memberGt7' || this.cardState === 'memberLe7')
        ? 'renew'
        : 'subscribe'
      console.log('[XunyouAccel] H5 #34 会员卡片按钮点击', { clickAction })
      this.$dataReport('LZ_myGames', 'LZ_accelVipCardButtonClick', 'click', { clickAction })
    },
    startLoadTimeout() {
      this.clearLoadTimeout()
      this.loadTimedOut = false
      this.loadTimer = setTimeout(() => {
        this.loadTimedOut = true
        this.loadTimer = null
      }, LOAD_TIMEOUT_MS)
    },
    clearLoadTimeout() {
      if (this.loadTimer) {
        clearTimeout(this.loadTimer)
        this.loadTimer = null
      }
    },
    onClick(event) {
      if (this.cardState === 'loading') return
      // #34 整卡点击即「开通 / 续费」按钮点击。放在登录分支之前：未登录时这条点击的意义
      // 同样是「想开通」，转由原生拉起登录（与原 LZ_xunyouEntryClick 的时机一致）
      this.reportVipCardButtonClick()
      if (this.loginStatus !== 'yes') {
        // 登录成功后不要回放 onClick：卡片会先进入 loading，回放会被提前 return。
        // 直接把「已登录后的开通点击」交给父级进套餐页。
        this.$loginForAccel(() => this.$emit('click', event))
        return
      }
      this.$emit('click', event)
    }
  }
}
</script>

<style lang="scss" scoped>
/* 182×52 会员卡 = 底图（卡形 / 装饰 / 图标 / 标题 / 右箭头）+ 副标题（代码渲染）。
   图标与标题用的字体端上拿不到，按既有约定留在图里；副标题是动态文案，走代码。
   卡内坐标都是设计稿 px，所以父级只能通过 --xunyou-card-scale 让整张卡等比缩放
   （入口行按设备档位给不同宽度），直接改盒子的宽高会把底图拉变形、文字错位。 */
.xunyou-member-card {
  --xunyou-card-scale: 1;
  position: relative;
  width: calc(182px * var(--xunyou-card-scale));
  height: calc(52px * var(--xunyou-card-scale));
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.85;
  }

  &.is-loading {
    cursor: default;
  }

  &__bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  &__subtitle {
    position: absolute;
    left: calc(30.4px * var(--xunyou-card-scale));
    top: calc(25.571px * var(--xunyou-card-scale));
    font-size: calc(9px * var(--xunyou-card-scale));
    line-height: calc(16px * var(--xunyou-card-scale));
    white-space: nowrap;
    color: rgba(255, 255, 255, 0.7);
  }

  &__subtitle.is-le7 {
    color: #FF9940;
  }

  /* 未开通态右侧的「开通」按钮（设计稿 44×24 @ 130,14）。整卡可点，它只是视觉引导。 */
  &__open-btn {
    position: absolute;
    left: calc(130px * var(--xunyou-card-scale));
    top: calc(14px * var(--xunyou-card-scale));
    width: calc(44px * var(--xunyou-card-scale));
    height: calc(24px * var(--xunyou-card-scale));
    display: block;
    pointer-events: none;
  }
}
</style>

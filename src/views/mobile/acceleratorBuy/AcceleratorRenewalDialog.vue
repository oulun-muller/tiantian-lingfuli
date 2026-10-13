<template>
  <!--
    迅游加速器「续费管理」弹窗（对齐雷神 RenewalManagement 的交互形态）：
    单弹窗三态 —— 生效列表(1) / 二次确认(2) / 空态(-1)，不再跳独立路由页。
    接口仍走迅游专属端点（签约在迅游独立 Pay+ appId 下完成，雷神接口解约会报 100005）。
  -->
  <div v-if="visible" class="renewal-layer" :class="placement === 'bottom' ? 'is-sheet' : 'is-modal'">
    <div class="renewal-mask" />

    <div class="renewal-dialog" :class="`renewal-dialog--${placement}`">
      <header class="renewal-header">
        <p class="renewal-header__title">续费管理</p>
        <button type="button" class="renewal-header__close" aria-label="关闭" @click="handleClose">
          <img :src="iconClose" alt="" />
        </button>
      </header>

      <!-- 生效中的自动续费服务（进入二次确认态时列表仍保留，确认卡片浮在其上） -->
      <div v-if="ready && (pageType === 1 || pageType === 2)" class="renewal-body">
        <h1 class="renewal-title">当前生效的自动续费服务</h1>
        <ul
          v-for="item in agreements"
          :key="item.id"
          class="renewal-item"
        >
          <li>
            <span class="label">服务内容</span>
            <span class="value">{{ item.serviceContent || '-' }}</span>
          </li>
          <li>
            <span class="label">签约渠道</span>
            <span class="value">{{ item.productChannelName || '-' }}</span>
          </li>
          <li>
            <span class="label">签约时间</span>
            <span class="value">{{ formatTime(item.startTime) }}</span>
          </li>
          <li>
            <span class="label">下次扣费时间</span>
            <span class="value">{{ formatTime(item.nextPayTime) }}</span>
          </li>
          <li>
            <span class="label">下次扣费金额</span>
            <span class="value">¥{{ formatPrice(item.nextPayPrize) }}</span>
          </li>
          <button type="button" class="renewal-unsubscribe" @click="toContract(item.id)">解约</button>
        </ul>
      </div>

      <!-- 加载失败：不能当成「无生效服务」，否则会误导用户以为自动续费已关闭 -->
      <div v-else-if="loadFailed" class="renewal-empty">
        <h4>获取自动续费信息失败</h4>
        <button type="button" class="renewal-btn renewal-btn--ghost renewal-btn--retry" @click="initAgreements">重新加载</button>
      </div>

      <!-- 空态 -->
      <div v-else-if="ready" class="renewal-empty">
        <img class="renewal-empty__icon" :src="emptyIcon" alt="" aria-hidden="true" />
        <p class="renewal-empty__text">当前没有生效中的自动续费服务</p>
      </div>

      <!-- 加载中 -->
      <div v-else class="renewal-loading">加载中…</div>
    </div>

    <!-- 二次确认：居中小卡片，覆盖在续费管理弹窗之上（列表在卡片后仍可见） -->
    <div v-if="ready && pageType === 2" class="renewal-confirm">
      <div class="renewal-confirm__card" role="dialog" aria-modal="true">
        <h2 class="renewal-confirm__title">确定要关闭自动续费吗？</h2>
        <p class="renewal-confirm__desc">关闭后将无法享受自动续费功能，加速器会员权益可能过期哦！</p>
        <div class="renewal-confirm__actions">
          <button
            type="button"
            class="renewal-confirm__btn"
            :disabled="cancelling"
            @click="toReserve">狠心关闭</button>
          <button
            type="button"
            class="renewal-confirm__btn is-primary"
            @click="handleClose(2)">保留续费</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import iconClose from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-close.svg'
// 空态插画：与设计稿一致的手柄圆盘图（176×176，约 10KB）
import emptyIcon from '@/images/gamecenter/nothing.png'
import { getXunyouAgreements, cancelXunyouAgreement } from '@/api/accelerator.js'

export default {
  name: 'AcceleratorRenewalDialog',
  emits: ['close'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // #44~#47 的套餐字段，由会员页按「连续包月套餐」传入（协议接口不返回套餐 ID）
    plan: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      iconClose,
      emptyIcon,
      pageType: -1,
      agreements: [],
      ready: false,
      loadFailed: false,
      agreementOrderId: '',
      cancelling: false,
      // #44 续费管理页面曝光去重：弹窗每次打开算一次生命周期
      renewManagePageShown: false,
      // #46 关闭自动续费弹窗曝光去重：同一次生命周期只报一次
      termContractPopupShown: false,
      // 在途请求版本号：关闭弹窗 / 重新打开 / 重新加载时自增。
      // 慢网下旧请求可能在新周期才返回，若不作废会污染下一次打开的列表数据，
      // 并提前吃掉 #44 的曝光去重（新周期反而报不出来）。
      requestToken: 0,
      placement: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'bottom' : 'center') : 'bottom'
    }
  },
  computed: {
    // #44~#47 公共字段：口径与 #39/#41 的套餐字段一致。
    // 没有生效中的续费套餐（空态）时套餐字段传空：此时用户并无在续的套餐，
    // 不能把「购买页可买的连续包月套餐」当成他的续费套餐报上去。
    renewPlanFields() {
      if (!this.agreements.length) {
        return { planId: '', planName: '', amount: 0 }
      }
      const amount = Number(this.plan?.amount)
      return {
        planId: String(this.plan?.planId ?? ''),
        planName: String(this.plan?.planName || ''),
        amount: Number.isNaN(amount) ? 0 : amount
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.updatePlacement()
        this.reset()
        this.lockScroll()
        this.initAgreements()
      } else {
        this.unlockScroll()
        // 关闭即作废在途请求：其回调不再回写数据、不再上报，#44 去重标记留给下一次打开
        this.requestToken += 1
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.updatePlacement)
  },
  beforeUnmount() {
    this.unlockScroll()
    // 离开页面同样作废在途请求，避免其回调打到已销毁的组件上
    this.requestToken += 1
    window.removeEventListener('resize', this.updatePlacement)
  },
  methods: {
    updatePlacement() {
      this.placement = window.innerWidth < 768 ? 'bottom' : 'center'
    },
    // 弹窗打开时锁定背后页面滚动，避免移动端拖动遮罩/抽屉时穿透（与 AcceleratorPayDialog 一致）
    lockScroll() {
      const root = document.documentElement
      root.style.overflow = 'hidden'
      if (document.body) document.body.style.overflow = 'hidden'
    },
    unlockScroll() {
      const root = document.documentElement
      if (document.body) document.body.style.overflow = ''
      root.style.overflow = ''
    },
    reset() {
      this.pageType = -1
      this.agreements = []
      this.ready = false
      this.loadFailed = false
      this.agreementOrderId = ''
      this.cancelling = false
      this.renewManagePageShown = false
      this.termContractPopupShown = false
    },
    initAgreements() {
      this.loadFailed = false
      this.ready = false
      // 每次加载占用一个新版本号：只有最后一次发起的请求允许回写与上报
      const token = this.requestToken + 1
      this.requestToken = token
      getXunyouAgreements()
        .then(list => {
          if (token !== this.requestToken) return
          this.agreements = list
          this.pageType = list.length ? 1 : -1
        })
        .catch(err => {
          if (token !== this.requestToken) return
          this.agreements = []
          this.pageType = -1
          this.loadFailed = true
          this.$warningMessage(err?.message || '获取自动续费信息失败，请稍后重试')
        })
        .finally(() => {
          if (token !== this.requestToken) return
          this.ready = true
          if (this.loadFailed) return
          // this.$dataReport('user', 'LZ_renewalManagePopupShow', 'pv', {
          //   showType: this.agreements.length ? 1 : 0
          // })
          // #44 续费管理页面曝光：与存量 user 埋点同口径，加载成功后才算页面展示
          this.reportRenewManagePageShow()
        })
    },
    // #44 续费管理页面曝光（pv）：同一次弹窗生命周期只报一次
    reportRenewManagePageShow() {
      if (this.renewManagePageShown) return
      this.renewManagePageShown = true
      this.$dataReport('LZ_myGames', 'LZ_accelRenewManagepageShow', 'pv', {
        detail: JSON.stringify(this.renewPlanFields)
      })
    },
    /**
     * #45 续费管理页面点击（click）
     * clickType=termContract：点「解约」进入关闭自动续费二次确认；
     * clickType=cancel：在生效列表态点「X」关闭弹窗。
     */
    reportRenewManagePageClick(clickType) {
      this.$dataReport('LZ_myGames', 'LZ_accelRenewManagepageclick', 'click', {
        detail: JSON.stringify({ ...this.renewPlanFields, clickType })
      })
    },
    // #46 关闭自动续费弹窗曝光（pv）：同一次弹窗生命周期只报一次
    reportTermContractPopupShow() {
      if (this.termContractPopupShown) return
      this.termContractPopupShown = true
      this.$dataReport('LZ_myGames', 'LZ_accelRenewManageTermContractPopupShow', 'pv', {
        detail: JSON.stringify(this.renewPlanFields)
      })
    },
    /**
     * #47 关闭自动续费弹窗点击（click）
     * clickType=cancel：点「狠心关闭」确认解约；
     * clickType=Keep：点「保留续费」继续续费。
     */
    reportTermContractPopupClick(clickType) {
      this.$dataReport('LZ_myGames', 'LZ_accelRenewManageTermContractPopupClick', 'click', {
        detail: JSON.stringify({ ...this.renewPlanFields, clickType })
      })
    },
    // 关闭弹窗；二次确认态下区分「保留续费(2)」与「直接关闭(3)」两类埋点
    handleClose(type) {
      if (this.cancelling) return
      // #45/#47 续费管理新增埋点：页面已展示（生效列表 / 空态）时点 X 关闭按 cancel 上报；
      // 加载中、加载失败也走 pageType=-1，但此时 #44 曝光没上报，不能产生孤儿点击。
      if (this.pageType === 1 || (this.ready && this.pageType === -1 && !this.loadFailed)) {
        this.reportRenewManagePageClick('cancel')
      } else if (this.pageType === 2 && type === 2) {
        this.reportTermContractPopupClick('Keep')
      }
      this.$emit('close')
      // if (this.pageType === 2) {
      //   this.$dataReport('user', 'LZ_unsubscribePopupClick', 'click', {
      //     clickType: type === 2 ? 2 : 3
      //   })
      // }
    },
    toContract(agreementOrderId) {
      this.pageType = 2
      this.agreementOrderId = agreementOrderId
      // #45 点「解约」：进入关闭自动续费二次确认
      this.reportRenewManagePageClick('termContract')
      // #46 二次确认弹窗曝光
      this.reportTermContractPopupShow()
      // this.$dataReport('user', 'LZ_renManPopupUnsubscribeBtnClick', 'click')
      // this.$dataReport('user', 'LZ_unsubscribePopupShow', 'pv')
    },
    toReserve() {
      if (this.cancelling) return
      this.cancelling = true
      // #47 点「狠心关闭」确认解约
      this.reportTermContractPopupClick('cancel')
      // this.$dataReport('user', 'LZ_unsubscribePopupClick', 'click', {
      //   clickType: 1
      // })
      cancelXunyouAgreement(this.agreementOrderId)
        .then(() => {
          this.$successMessage('解约成功！')
          this.$emit('close')
        })
        .catch(err => {
          this.$warningMessage(err?.message || '取消失败，请稍后重试')
        })
        .finally(() => {
          this.cancelling = false
        })
    },
    // 兼容后端返回的 "yyyy-MM-dd'T'HH:mm:ss" 与 "yyyy-MM-dd HH:mm:ss" 两种格式
    formatTime(time) {
      if (!time) return '-'
      if (typeof time !== 'string') return String(time)
      return time.substring(0, 16).replace('T', ' ')
    },
    formatPrice(price) {
      const value = Number(price)
      return Number.isNaN(value) ? '0.00' : value.toFixed(2)
    }
  }
}
</script>

<style lang="scss" scoped>
.renewal-layer {
  position: fixed;
  inset: 0;
  z-index: 1100;
}

.renewal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.renewal-dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #1e232a 0%, #1a1e24 100%);
  color: #eaf7ff;

  &--bottom {
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: min(594px, calc(100vh - 40px));
    border-radius: 8px 8px 0 0;
    animation: renewal-sheet-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &--center {
    top: 50%;
    left: 50%;
    width: min(600px, calc(100% - 32px));
    max-height: min(594px, calc(100vh - 40px));
    border-radius: 8px;
    box-shadow: 0 0 0 0.5px #39404d, 0 2px 20px rgba(13, 13, 13, 0.8);
    transform: translate(-50%, -50%);
  }
}

@keyframes renewal-sheet-in {
  from {
    transform: translate3d(0, 100%, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}

.renewal-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;

  &__title {
    margin: 0;
    color: #eaf7ff;
    font-size: 16px;
    line-height: 22px;
    font-weight: 500;
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    margin-right: -10px;

    img {
      display: block;
      width: 38px;
      height: 38px;
    }
  }
}

.renewal-body {
  flex: 1;
  min-height: 0;
  padding: 0 20px 24px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    display: none;
  }
}

.renewal-title {
  margin: 8px 0;
  color: #eaf7ff;
  font-size: 20px;
  font-weight: 700;
  line-height: 30px;
  text-align: center;
}

.renewal-item {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 20px;

    .label {
      flex-shrink: 0;
      color: rgba(234, 247, 255, 0.6);
      font-size: 14px;
      line-height: 22px;
    }

    .value {
      min-width: 0;
      color: #eaf7ff;
      font-size: 14px;
      font-weight: 700;
      line-height: 22px;
      text-align: right;
      overflow-wrap: anywhere;
    }
  }
}

/* 解约按钮：通栏描边按钮，与设计稿一致（此前是 120px 居中窄按钮） */
.renewal-unsubscribe {
  display: block;
  width: 100%;
  height: 52px;
  margin: 40px 0 8px;
  border-radius: 4px;
  border: 1px solid rgba(234, 247, 255, 0.24);
  background: none;
  color: #eaf7ff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }
}

/* 二次确认：居中小卡片浮层。列表仍在卡片下方可见，额外压暗一层背景突出卡片 */
.renewal-confirm {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
  background: rgba(0, 0, 0, 0.45);

  &__card {
    width: 100%;
    max-width: 260px;
    overflow: hidden;
    border-radius: 12px;
    background: #2a2d33;
  }

  &__title {
    margin: 0;
    padding: 28px 20px 0;
    color: #eaf7ff;
    font-size: 17px;
    font-weight: 700;
    line-height: 24px;
    text-align: center;
  }

  &__desc {
    margin: 0;
    padding: 12px 24px 24px;
    color: rgba(234, 247, 255, 0.6);
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    text-align: center;
  }

  &__actions {
    display: flex;
    border-top: 0.5px solid rgba(255, 255, 255, 0.12);
  }

  &__btn {
    flex: 1;
    height: 50px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #eaf7ff;
    font-size: 14px;
    cursor: pointer;

    & + & {
      border-left: 0.5px solid rgba(255, 255, 255, 0.12);
    }

    &.is-primary {
      color: #3d7eff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.renewal-btn {
  width: 120px;
  height: 36px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  line-height: 34px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--ghost {
    border: 1px solid #fff;
    background: none;
    color: #eaf7ff;
  }
}

.renewal-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 60px;

  h4 {
    margin: 0;
    color: #eaf7ff;
    font-size: 20px;
    font-weight: 700;
    line-height: 30px;
    text-align: center;
  }

  /* 空态插画 + 说明文案（设计稿：手柄圆盘图 + 灰色说明；2 倍图下圆盘约 128 CSS px） */
  &__icon {
    display: block;
    width: 128px;
    height: 128px;
  }

  &__text {
    margin: 20px 0 0;
    color: rgba(234, 247, 255, 0.7);
    font-size: 15px;
    line-height: 22px;
    text-align: center;
  }
}

.renewal-btn--retry {
  margin-top: 24px;
}

.renewal-loading {
  flex: 1;
  padding: 60px 20px;
  color: rgba(234, 247, 255, 0.6);
  font-size: 14px;
  text-align: center;
}
</style>

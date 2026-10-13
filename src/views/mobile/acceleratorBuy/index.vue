<template>
  <!-- 迅游加速器 VIP 开通页：选择套餐 -> 立即开通（微信/支付宝 / 连续包月走支付宝代扣） -->
  <div class="accelerator-buy">
    <!-- 页面角落光带装饰（宽屏右侧再补一条），纯背景元素 -->
    <img class="corner corner--left" :src="cornerLeft" alt="" aria-hidden="true" />
    <img class="corner corner--right" :src="cornerRight" alt="" aria-hidden="true" />

    <header class="hdr">
      <button type="button" class="hdr__back" aria-label="返回" @click="goBack">
        <img :src="iconBack" alt="" />
      </button>
      <div class="hdr__actions">
        <!-- 续费管理：连续包月协议查询与取消（弹窗，对齐雷神入口） -->
        <button type="button" class="hdr__link" @click="goAgreement">续费管理</button>
        <span class="hdr__divider" aria-hidden="true"></span>
        <!-- 我的订单：跳转到订单中心（加速器订单 Tab 由订单中心按客户端版本决定是否展示） -->
        <button type="button" class="hdr__link" @click="goOrders">我的订单</button>
      </div>
    </header>

    <div class="scroll">
      <div class="scroll__inner">
        <!-- 套餐接口失败：整页替换为加载失败提示，避免展示不可购买的空壳页面 -->
        <div v-if="pkgLoadFailed" class="page-error">
          <p class="page-error__msg">{{ errorMsg }}</p>
          <button type="button" class="page-error__retry" @click="loadPackages">重试</button>
        </div>

        <template v-else>
        <!-- 会员信息区：头像/昵称取登录态，有效期取迅游 accel_status 权益 -->
        <section class="hero">
          <div class="hero__user">
            <img class="hero__avatar" :src="avatarUrl" alt="" />
            <div class="hero__meta">
              <p class="hero__nick">{{ nickname }}</p>
              <p class="hero__slogan">开通后可享专属权益</p>
              <!-- 权益状态文案：无权益（未开通/已过期）提示开通；剩余 ≤7 天追加橙色到期提醒 -->
              <p class="hero__expire">
                <template v-if="!hasAccelBenefit">开通后可享专属福利</template>
                <template v-else>
                  有效期至{{ expireDateText }}
                  <span v-if="isAccelExpiring" class="hero__expire-hl">剩余{{ accelRemainDayCount }}天到期</span>
                </template>
              </p>
            </div>
          </div>
          <img class="hero__badge" :src="vipBadge" alt="" aria-hidden="true" />
        </section>

        <!-- 新人 / 回归福利：资格与领取共用游戏空间页的迅游福利状态，领取成功后就地弹出结果弹窗。 -->
        <section v-if="welfareGift" class="welfare-card">
          <img class="welfare-card__image" :src="welfareImage" alt="" aria-hidden="true" />
          <button
            type="button"
            class="welfare-card__claim"
            :disabled="welfareClaiming"
            @click="claimWelfare">
            <img :src="welfareClaimButton" alt="领取" />
          </button>
        </section>

        <!-- 套餐列表 -->
        <section class="pkgs">
          <div v-if="loading" class="state-tip">套餐加载中…</div>
          <div v-else-if="!packages.length" class="state-tip">暂无可购买的套餐</div>
          <div v-else class="pkgs__list">
            <div
              v-for="pkg in packages"
              :key="pkg.id"
              class="pkg-item"
              :class="{ 'is-dimmed': selectedId !== pkg.id }">
              <!-- 促销信息：左上红色角标，上沿高出卡片 10px（由外层留白实现，卡片本体仍裁切圆角与斜光条） -->
              <p v-if="pkg.promotionInfo" class="pkg__badge">{{ pkg.promotionInfo }}</p>
              <div
                class="pkg"
                :class="{ 'is-selected': selectedId === pkg.id }"
                @click="selectPackage(pkg)">
                <p class="pkg__name">{{ pkg.productName }}</p>
                <!-- 均价：连续包月=实价/月；其他套餐按天数折算 均价/月 或 均价/天 -->
                <div class="pkg__price">
                  <span class="pkg__amount">
                    <span class="pkg__cur">{{ avgPrice(pkg) }}</span>
                    <span v-if="avgPriceUnit(pkg)" class="pkg__unit">/{{ avgPriceUnit(pkg) }}</span>
                  </span>
                  <span v-if="hasOldPrice(pkg)" class="pkg__old">¥{{ pkg.productOriginalPriceYuan }}</span>
                </div>
                <!-- 合计位置展示付款金额（实付现价） -->
                <p class="pkg__total">合计 ¥{{ pkg.productCurrentPriceYuan }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 付款方式：仅页面内选中态，不参与支付流程 -->
        <section class="pay">
          <h2 class="section-title">付款方式</h2>
          <div class="pay__list" :class="{ 'is-single': payMethods.length === 1 }">
            <button
              v-for="method in payMethods"
              :key="method.key"
              type="button"
              class="pay__item"
              :class="{ 'is-selected': payMethod === method.key }"
              @click="payMethod = method.key">
              <img class="pay__icon" :src="method.icon" alt="" />
              <span class="pay__label">{{ method.label }}</span>
              <img
                v-if="payMethod === method.key"
                class="pay__check"
                :src="iconPkgSelected"
                alt=""
                aria-hidden="true" />
            </button>
          </div>
        </section>

        <!-- VIP 专属权益：静态展示文案 -->
        <section class="benefits">
          <img class="benefits__bg benefits__bg--wide" :src="benefitKuanBg" alt="" aria-hidden="true" />
          <h2 class="benefits__title">VIP专属权益</h2>
          <ul class="benefits__grid">
            <li
              v-for="item in benefits"
              :key="item.title"
              class="benefit"
              :class="{ 'is-action': item.action === 'service' }"
              @click="onBenefitClick(item)">
              <img class="benefit__icon" :src="item.icon" alt="" aria-hidden="true" />
              <p class="benefit__title">
                {{ item.title }}
                <img v-if="item.arrow" class="benefit__arrow" :src="arrowIcon" alt="" aria-hidden="true" />
              </p>
              <p class="benefit__desc">{{ item.desc }}</p>
            </li>
          </ul>
        </section>
        </template>
      </div>
    </div>

    <!-- 底部开通栏：套餐加载失败时整页只展示失败提示，底部栏一并隐藏 -->
    <footer v-if="!pkgLoadFailed" class="footer">
      <div class="footer__inner">
        <div class="footer__bar">
          <p class="footer__price">
            <span class="footer__cur"><span class="footer__symbol">¥</span>{{ selectedPackage ? selectedPackage.productCurrentPriceYuan : '--' }}</span>
            <span v-if="selectedPackage && isYearly(selectedPackage)" class="footer__unit">/年</span>
            <span v-if="selectedPackage && hasOldPrice(selectedPackage)" class="footer__old">
              ¥{{ selectedPackage.productOriginalPriceYuan }}
            </span>
          </p>
          <button class="footer__btn" :disabled="!selectedPackage" @click="handlePay">
            立即开通
            <img class="footer__btn-back" :src="blueBtnBack" alt="" aria-hidden="true" />
          </button>
        </div>
        <!-- 协议勾选：仅连续包月（自动续费）需要，其他套餐无需勾选；未勾选时点击立即开通会晃动提示。
             外层固定占位，保证有无协议时底部按钮区域高度一致，切换套餐不跳动。 -->
        <div class="agreement-slot">
          <div
            v-if="showAutoRenewAgreement"
            class="agreement"
            :class="{ 'is-shake': agreementShake }">
            <input id="accelerator-agreement" v-model="agreed" class="agreement__box" type="checkbox" />
            <span class="agreement__text">
              <label for="accelerator-agreement">我已阅读并同意</label>
              <button type="button" class="agreement__link" @click="openAutoRenewAgreement">《自动续费服务协议》</button>
            </span>
          </div>
        </div>
      </div>
    </footer>

    <!-- 迅游加速器专属支付弹窗（独立实现，不复用 CDK 商城弹窗） -->
    <AcceleratorPayDialog
      :visible="showPayDialog"
      :pkg="selectedPackage"
      :pay-method="payMethod"
      :plan-local="selectedPlanLocal"
      @close="showPayDialog = false"
      @pay-success="onPaySuccess"
    />

    <!-- 续费管理弹窗（对齐雷神 RenewalManagement：单弹窗三态） -->
    <AcceleratorRenewalDialog
      :visible="showRenewalDialog"
      :plan="autoRenewPlanReport"
      @close="showRenewalDialog = false"
    />

    <!-- 领取福利结果弹窗：与游戏空间页共用同一个组件与福利状态，领取成功后展示 -->
    <XunyouGiftClaimDialog
      v-model:visible="claimDialogVisible"
      :duration-days="claimedDurationDays" />
  </div>
</template>

<script>
import { getXunyouPackages } from '@/api/accelerator.js'
import { getAccelStatusSync } from '@/bridge/legionZoneMobile'
import { accelRemainDays, formatAccelExpireDate, hasAccelRight, refreshXunyouAccelStatus } from '@/utils/xunyouAccel'
import { openExternalUrl } from '@/nativeApiPad/common'
import iconBack from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-back.svg'
import iconAlipay from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-alipay.svg'
import iconWechat from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-wechat.svg'
import iconPkgSelected from './images/pkg-selected.png'
import vipBadge from './images/vip-badge.png'
import avatarImg from './images/avatar.svg'
import benefitDualPath from './images/benefit-dual-path.png'
import benefitMobilePriority from './images/benefit-mobile-priority.png'
import benefitEsports from './images/benefit-esports.png'
import benefitDedicated from './images/benefit-dedicated.png'
import benefitService from './images/benefit-service.png'
import cornerLeft from './images/corner-left.svg'
import cornerRight from './images/corner-right.svg'
import blueBtnBack from './images/blue-btn-back.png'
import arrowIcon from './images/arrow-left.png'
import benefitKuanBg from './images/benefit-kuan-bac.png'
// 素材文件名与画面内容相反：new-fuli 是回归文案，huigui-fuli 是新人文案，按画面内容映射。
import newcomerWelfareImage from './images/huigui-fuli.png'
import returningWelfareImage from './images/new-fuli.png'
import welfareClaimButton from './images/get-btn.png'
import AcceleratorPayDialog from './AcceleratorPayDialog.vue'
import AcceleratorRenewalDialog from './AcceleratorRenewalDialog.vue'
import XunyouGiftClaimDialog from '@/views/mobile/components/XunyouGiftClaimDialog/index.vue'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'
import {
  claimDialogVisible as sharedClaimDialogVisible,
  claimGift as claimSharedGift,
  claimedDurationDays as sharedClaimedDurationDays,
  claiming as sharedWelfareClaiming,
  currentWelfare,
  currentWelfareType,
  loadGifts,
  resetGifts
} from '@/utils/xunyouGiftState'

// 商品类型：3-连续包月（自动续费）
const PRODUCT_TYPE_AUTO_RENEW = 3
// #37 memberStatus 的「即将到期」阈值：剩余会员天数 ≤ 7 天（与会员卡 memberLe7 同一分界）
const EXPIRING_REMAIN_DAYS = 7
// #37 曝光等权益状态就绪的兜底时长：超时后按当时已知状态上报，避免曝光丢失
const VIP_CENTER_STATUS_WAIT_MS = 2000

export default {
  name: 'AcceleratorBuy',
  components: { AcceleratorPayDialog, AcceleratorRenewalDialog, XunyouGiftClaimDialog },
  data() {
    return {
      iconBack,
      iconPkgSelected,
      vipBadge,
      avatarImg,
      cornerLeft,
      cornerRight,
      blueBtnBack,
      arrowIcon,
      benefitKuanBg,
      newcomerWelfareImage,
      returningWelfareImage,
      welfareClaimButton,
      // 本页自己的福利取数状态：共享模块可能残留上一页数据，取数落定前不渲染福利卡。
      welfareReady: false,
      welfareLoadToken: 0,
      welfareShowReported: false,
      welfareUnmounted: false,
      // 全部可选付款方式；实际展示由 payMethods 计算属性按套餐类型过滤
      allPayMethods: [
        { key: 'alipay', label: '支付宝', icon: iconAlipay },
        { key: 'wechat', label: '微信', icon: iconWechat }
      ],
      benefits: [
        { icon: benefitDualPath, title: '双链路加速', desc: 'WiFi + 移动数据双通道智能调度，弱网不卡顿' },
        { icon: benefitMobilePriority, title: '移动网络优先通道', desc: '运营商级 QoS 优先转发，4G/5G 全程护航' },
        { icon: benefitEsports, title: '极速竞技模式', desc: '电竞级低延迟优化，团战操作零拖影' },
        { icon: benefitDedicated, title: '专用加速通道', desc: 'IPLC 国际专线直连，海外服延迟直降 60%' },
        { icon: benefitService, title: 'VIP 专属客服', desc: '1 对 1 人工客服快速响应，问题 10 分钟内跟进处理', arrow: true, action: 'service' }
      ],
      payMethod: 'alipay',
      agreed: false,
      // 协议未勾选时点击开通的晃动提示（仅连续包月会展示协议）
      agreementShake: false,
      agreementShakeTimer: null,
      // 自动续费协议地址（与 PC 端雷神一致）
      autoRenewAgreementUrl: process.env.WEB.autoPayAgreement,
      // 在线客服地址（智齿客服）
      customerServiceUrl: process.env.WEB.gameOnline,
      loading: false,
      errorMsg: '',
      packages: [],
      selectedId: null,
      showPayDialog: false,
      showRenewalDialog: false,
      // #37 会员中心页曝光去重标记：一次页面生命周期只报一次
      vipCenterShowReported: false,
      vipCenterShowTimer: null
    }
  },
  computed: {
    selectedPackage() {
      return this.packages.find(item => item.id === this.selectedId) || null
    },
    // 迅游入口专用登录态：用 native 同步推送的标志，避免异步 userInfo 造成的窗口期误判
    loginStatus() {
      return this.$store.state.user.loginStatus
    },
    // 登录态头像信息：native 推送的 { avatar, nickName, lenovoId }
    avatarInfo() {
      return this.$store.state.user.avatar || {}
    },
    // 头像统一取 user 模块；native 推送与启动补拉都会写入 user.avatar，取不到才回落默认图
    avatarUrl() {
      return this.avatarInfo?.avatar || avatarImg
    },
    // 调试用：当前 Lenovo ID，口径与埋点公共字段一致（userInfo.UserID，兜底 avatar.lenovoId）
    lenovoId() {
      return getLegacyLenovoId() || this.avatarInfo?.lenovoId || ''
    },
    nickname() {
      return this.avatarInfo.nickName || this.$store.state.user.userInfo?.UserName || '游戏玩家'
    },
    // 迅游加速权益：null 未获取/获取中，{ errorCode, userState, vipExpireTime } 已获取
    accelStatus() {
      return this.$store.state.user.accelStatus
    },
    // 有效期取 vipExpireTime 的北京时间日期，无有效数据时占位显示
    expireDateText() {
      return formatAccelExpireDate(this.accelStatus?.vipExpireTime) || '--'
    },
    // 是否持有有效加速权益（未开通 / 已过期 / 无数据均为 false），口径与会员卡一致
    hasAccelBenefit() {
      return hasAccelRight(this.accelStatus)
    },
    // 剩余会员天数（向上取整）；无有效到期时间时为 0
    accelRemainDayCount() {
      return accelRemainDays(this.accelStatus)
    },
    // 即将到期：剩余 ≤7 天（与会员卡 memberLe7、本页 memberStatus 同一分界）
    isAccelExpiring() {
      return this.hasAccelBenefit && this.accelRemainDayCount <= EXPIRING_REMAIN_DAYS
    },
    // 是否端内（与支付弹窗判断一致）：端内协议走原生 external bridge 打开
    isApp() {
      return !!this.$store.state.system.version
    },
    // 付款方式：连续包月（自动续费）仅支持支付宝代扣，与支付弹窗的规则保持一致
    payMethods() {
      if (this.isAutoRenew(this.selectedPackage)) {
        return this.allPayMethods.filter(item => item.key === 'alipay')
      }
      return this.allPayMethods
    },
    // 自动续费服务协议仅在选中连续包月（自动续费）商品时展示
    showAutoRenewAgreement() {
      return this.isAutoRenew(this.selectedPackage)
    },
    // 当前选中套餐在展示列表中的序号（从左到右，从 1 开始），#39 / #41 的 planLocal
    selectedPlanLocal() {
      const index = this.packages.findIndex(item => item.id === this.selectedId)
      return index >= 0 ? index + 1 : 0
    },
    /**
     * 续费管理链路埋点（#44~#47）的套餐字段：取套餐列表里的连续包月套餐。
     * 自动续费协议接口（getXunyouAgreements）不返回套餐 ID，只能从页面套餐列表取；
     * 套餐未加载/加载失败时上报空值与 0，保持 detail 字段结构稳定。
     */
    autoRenewPlanReport() {
      const pkg = this.packages.find(item => this.isAutoRenew(item))
      const amount = Number(pkg?.productCurrentPriceYuan)
      return {
        planId: String(pkg?.id ?? ''),
        planName: String(pkg?.productName || ''),
        amount: Number.isNaN(amount) ? 0 : Number(amount.toFixed(2))
      }
    },
    // 套餐接口失败：整页展示加载失败（loading 期间不判定，避免首屏闪烁）
    pkgLoadFailed() {
      return !this.loading && !!this.errorMsg
    },
    welfareGift() {
      return this.welfareReady ? currentWelfare.value : null
    },
    welfareType() {
      return currentWelfareType.value
    },
    welfareClaiming() {
      return sharedWelfareClaiming.value
    },
    // 领取结果弹窗由共享福利状态驱动：开关与时长都取共享模块，本页不留副本
    // （领取成功后由 claimGift 置为可见，组件倒计时结束或点关闭再写回 false）
    claimDialogVisible: {
      get() {
        return sharedClaimDialogVisible.value
      },
      set(visible) {
        sharedClaimDialogVisible.value = visible
      }
    },
    claimedDurationDays() {
      return sharedClaimedDurationDays.value
    },
    welfareImage() {
      return this.welfareType === 'newcomer' ? this.newcomerWelfareImage : this.returningWelfareImage
    },
    /**
     * #37 会员中心页曝光的 memberStatus（页面态）：
     *   expiring 即将到期（剩余 ≤7 天）/ active 正常 / nonVip 非会员
     * 注意与 #33 卡片态的 vip / nonVip 是两套取值，不要统一。
     */
    memberStatus() {
      if (!hasAccelRight(this.accelStatus)) return 'nonVip'
      return accelRemainDays(this.accelStatus) <= EXPIRING_REMAIN_DAYS ? 'expiring' : 'active'
    },
    // 会员态是否已可判定：未登录必然非会员；已登录要等权益状态**真正**到位。
    // errorCode === -1 不算「到位」：它表示安全校验未过 / 尚未鉴权（口径同 loadAccelStatus 的过滤
    // 与会员卡 stateSettled 的判定），此时 hasAccelRight 必然为 false，
    // 直接上报会把会员误报成 nonVip —— 正是需求文档 #37 备注要避免的那种情况。
    memberStatusReady() {
      if (this.loginStatus === 'no') return true
      return !!this.accelStatus && Number(this.accelStatus.errorCode) !== -1
    }
  },
  watch: {
    // 切到连续包月后微信不可用，自动回落到仍可用的付款方式
    payMethods(list) {
      if (list.length && !list.some(item => item.key === this.payMethod)) {
        this.payMethod = list[0].key
      }
    },
    // 登录态后到时重新校验福利资格（loadGifts 内部会作废旧登录态的在途请求）
    loginStatus() {
      this.loadWelfare()
    },
    // 调试用：Lenovo ID 可能在挂载后异步到位，就绪或变化时打印一次
    lenovoId: {
      handler(id) {
        if (id) console.log('[XunyouAccel] Lenovo ID:', id)
      },
      immediate: true
    },
    // #35 福利卡片曝光：本页没有游戏空间页的福利横幅，卡片自身就绪后上报一次
    welfareGift: {
      handler(gift) {
        if (gift) this.reportWelfareShow()
      },
      immediate: true
    },
    // 领取结果弹窗关闭（自动倒计时结束或手动关闭）时重拉一次页面数据：
    // 福利资格、会员权益、套餐都可能因这次领取而变化，不重载页面、只刷新数据。
    claimDialogVisible(visible, prev) {
      if (prev && !visible) this.refreshPageData()
    },
    // 权益状态晚于挂载就绪时（native 推送 / 同步接口返回）补报 #37 曝光
    memberStatusReady(ready) {
      if (ready && !this.vipCenterShowReported) {
        this.reportVipCenterShow()
      }
    }
  },
  mounted() {
    this.loadAccelStatus()
    this.loadPackages()
    this.loadWelfare()
    this.scheduleVipCenterShow()
  },
  beforeUnmount() {
    if (this.agreementShakeTimer) {
      clearTimeout(this.agreementShakeTimer)
      this.agreementShakeTimer = null
    }
    if (this.vipCenterShowTimer) {
      clearTimeout(this.vipCenterShowTimer)
      this.vipCenterShowTimer = null
    }
  },
  unmounted() {
    // 共享福利状态会跨页面存活，离开本页时复位，避免下一处入口先闪一帧旧数据。
    this.welfareUnmounted = true
    this.welfareLoadToken += 1
    resetGifts()
  },
  methods: {
    // #37 会员中心页曝光：调度一次上报，权益状态未就绪时先等（最多 VIP_CENTER_STATUS_WAIT_MS）
    scheduleVipCenterShow() {
      if (this.memberStatusReady) {
        this.reportVipCenterShow()
        return
      }
      this.vipCenterShowTimer = setTimeout(() => {
        this.vipCenterShowTimer = null
        this.reportVipCenterShow()
      }, VIP_CENTER_STATUS_WAIT_MS)
    },
    // #37 会员中心页曝光（pv，去重：一次页面生命周期只报一次）
    reportVipCenterShow() {
      if (this.vipCenterShowReported) return
      this.vipCenterShowReported = true
      if (this.vipCenterShowTimer) {
        clearTimeout(this.vipCenterShowTimer)
        this.vipCenterShowTimer = null
      }
      this.$dataReport('LZ_myGames', 'LZ_accelVipCenterPageShow', 'pv', {
        memberStatus: this.memberStatus
      })
    },
    // #35 福利卡片曝光（pv）：本页只有这一处福利入口，按卡片生命周期去重一次
    reportWelfareShow() {
      if (this.welfareShowReported) return
      this.welfareShowReported = true
      const detail = { source: 'memberPage', welfareType: this.welfareType }
      console.log('[XunyouAccel] H5 #35 福利卡片曝光', detail)
      this.$dataReport('LZ_myGames', 'LZ_accelWelfareCardShow', 'pv', {
        detail: JSON.stringify(detail)
      })
    },
    // 套餐埋点公共字段（#39 用，与支付弹窗 #41 同口径）
    planReportFields(pkg) {
      const amount = Number(pkg?.productCurrentPriceYuan)
      const index = this.packages.findIndex(item => item.id === pkg?.id)
      return {
        payMethod: this.payMethod,
        planId: String(pkg?.id ?? ''),
        planName: String(pkg?.productName || ''),
        // 套餐序号：展示时从左到右第几个（从 1 开始）
        planLocal: index >= 0 ? index + 1 : 0,
        // 金额单位元，保留两位小数
        amount: Number.isNaN(amount) ? 0 : Number(amount.toFixed(2))
      }
    },
    // 路由直达时 gameSpace 的权益补拉不会执行，挂载后同步一次兜底
    loadAccelStatus() {
      const accelStatus = getAccelStatusSync()
      if (accelStatus && accelStatus.errorCode !== -1) {
        this.$store.dispatch('syncAccelStatus', accelStatus).catch(() => {})
        this.$store.dispatch('user/syncAccelStatus', accelStatus).catch(() => {})
      }
    },
    loadPackages() {
      this.loading = true
      this.errorMsg = ''
      getXunyouPackages()
        .then(list => {
          this.packages = list
          // 当前选中项仍在新列表里就保留（重新拉取数据时不打断用户已选的套餐），
          // 否则默认选中第一个
          const keepSelected = list.some(item => item.id === this.selectedId)
          this.selectedId = keepSelected ? this.selectedId : (list.length ? list[0].id : null)
        })
        .catch(err => {
          this.errorMsg = err?.message || '获取套餐失败，请稍后重试'
        })
        .finally(() => {
          this.loading = false
        })
    },
    // 领取弹窗关闭后刷新本页数据：口径与 mounted 一致（权益 / 套餐 / 福利各拉一次），
    // 只更新数据、不重载页面，避免白屏与路由闪烁。
    refreshPageData() {
      this.loadAccelStatus()
      this.loadPackages()
      this.loadWelfare()
    },
    // 与游戏空间页共用新人 / 回归福利资格接口；未登录时 loadGifts 会清空福利且不发请求。
    loadWelfare() {
      const token = this.welfareLoadToken + 1
      this.welfareLoadToken = token
      this.welfareReady = false
      return loadGifts(this.loginStatus).finally(() => {
        if (token === this.welfareLoadToken) this.welfareReady = true
      })
    },
    // 连续包月套餐：productType === 3
    isAutoRenew(pkg) {
      return Number(pkg?.productType) === PRODUCT_TYPE_AUTO_RENEW
    },
    selectPackage(pkg) {
      // 重复点击当前套餐不算切换，避免误清用户已勾选的协议
      if (this.selectedId === pkg.id) return
      this.selectedId = pkg.id
      // 每次切换到连续包月（自动续费）套餐都必须重新勾选协议：
      // 用户可能在别的套餐上勾过、或上次已支付过，不能沿用旧的勾选状态
      if (this.isAutoRenew(pkg)) {
        this.agreed = false
      }
    },
    // 有划线价：原价存在且大于现价
    hasOldPrice(pkg) {
      const old = Number(pkg?.productOriginalPriceYuan)
      const cur = Number(pkg?.productCurrentPriceYuan)
      return old > 0 && old > cur
    },
    // 价格单位：按套餐名推断（含「年」显示 /年），不作业务判断
    isYearly(pkg) {
      return !!pkg && String(pkg.productName || '').includes('年')
    },
    // 套餐天数：后端在迅游扩展字段 xunyou.accelDays 下发，兼容平铺字段；非法值按 0（未知天数）处理
    pkgAccelDays(pkg) {
      const days = Number(pkg?.xunyou?.accelDays ?? pkg?.accelDays)
      return Number.isFinite(days) && days > 0 ? days : 0
    },
    /**
     * 卡片均价：连续包月固定「实价/月」；其他套餐按天数折算 ——
     * 天数 ≥30 以 1 月=30 天换算月数，均价/月；天数 <30 均价/天。
     * 天数缺失时退回实付价且不带单位，避免用错误口径误导用户。
     */
    avgPrice(pkg) {
      const price = Number(pkg?.productCurrentPriceYuan)
      if (!Number.isFinite(price) || price <= 0) return pkg?.productCurrentPriceYuan ?? '--'
      if (this.isAutoRenew(pkg)) return this.formatAvgPrice(price)
      const days = this.pkgAccelDays(pkg)
      if (!days) return this.formatAvgPrice(price)
      return this.formatAvgPrice(days >= 30 ? price / (days / 30) : price / days)
    },
    // 均价单位：连续包月固定「月」，其他按天数分档；天数缺失不展示单位
    avgPriceUnit(pkg) {
      if (this.isAutoRenew(pkg)) return '月'
      const days = this.pkgAccelDays(pkg)
      if (!days) return ''
      return days >= 30 ? '月' : '天'
    },
    // 折算结果保留两位小数并去掉无意义的尾随 0（15.00 -> 15，16.30 -> 16.3）
    formatAvgPrice(value) {
      return String(Number(Number(value).toFixed(2)))
    },
    // 返回兼容两种来源：H5 内跳转进来时栈里有上一页，走路由返回 H5 页面；
    // 端上页面直接打开本页时没有 H5 历史，交回原生 goBack 返回端上页面。
    // 端外 H5 落地且无历史时兜底回游戏中心首页，避免点击无响应。
    goBack() {
      const hasPrev = window.history.state && window.history.state.back != null
      if (hasPrev) {
        this.$router.back()
        return
      }
      if (this.isApp && window.LegionZoneMobile?.nativeCall) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'goBack').catch(() => {})
        return
      }
    },
    // 续费管理：打开弹窗（对齐雷神入口埋点命名）
    goAgreement() {
      // 会员中心-点击续费管理入口（无参数）
      this.$dataReport('LZ_myGames', 'LZ_accelVipCenterRenewManageClick', 'click')
      this.showRenewalDialog = true
      // this.$dataReport('user', 'LZ_orderCenterRenewalManageClick', 'click')
    },
    // 我的订单：跳转订单中心路由（复用既有 OrderCenter 页面）
    goOrders() {
      // 会员中心-我的订单列表入口点击（无参数）
      this.$dataReport('LZ_myGames', 'LZ_accelVipCenterOrderListClick', 'click')
      this.$router.push({ name: 'OrderCenter' })
    },
    // 立即开通：连续包月未勾选协议先晃动提示；其他套餐无需协议，直接打开支付弹窗
    handlePay() {
      if (!this.selectedPackage) {
        this.$message('请先选择套餐')
        return
      }
      if (this.showAutoRenewAgreement && !this.agreed) {
        this.shakeAgreement()
        return
      }
      // #39 点击支付按钮（触发前提：已勾选协议；未勾选时的无效点击不埋点）
      this.$dataReport('LZ_myGames', 'LZ_accelPayButtonClick', 'click', {
        detail: JSON.stringify(this.planReportFields(this.selectedPackage))
      })
      this.showPayDialog = true
    },
    onPaySuccess() {
      // this.$dataReport('LZ_myGames', 'LZ_xunyouPaySuccess', 'click')
      // 支付成功只代表我方订单已支付，权益由后端异步同步给迅游，所以这里等权益真正变化
      refreshXunyouAccelStatus({
        store: this.$store,
        waitUntilChanged: true,
        intervalMs: 5000,
        waitTimeoutMs: 90000
      }).catch(() => {})
    },
    claimWelfare() {
      if (!this.welfareGift || this.welfareClaiming) return
      const detail = { source: 'memberPage', welfareType: this.welfareType }
      console.log('[XunyouAccel] H5 #36 点击领取福利', detail)
      this.$dataReport('LZ_myGames', 'LZ_accelWelfareCardClaimClick', 'click', {
        detail: JSON.stringify(detail)
      })
      // 领取成功后由共享状态弹出结果弹窗，本页不再整页刷新：福利卡随领取态自己收起、
      // 会员有效期由 claimGift 内部的权益轮询回写，整页刷新反而会把刚弹出的弹窗打掉。
      claimSharedGift(this.welfareGift).catch(err => {
        // 用户可能在领取请求返回前离开本页；此时不要在他所在的下一处页面弹错误提示
        if (!this.welfareUnmounted) this.$errorMessage(err?.message || '领取失败，请稍后重试')
      })
    },
    openAutoRenewAgreement() {
      this.openExternalLink(this.autoRenewAgreementUrl)
    },
    // VIP 专属客服：与 PC 端一致，打开在线客服页面（App 内走 external bridge）
    openCustomerService() {
      this.openExternalLink(this.customerServiceUrl)
    },
    // 权益项点击：目前仅「VIP 专属客服」有动作，其余为纯展示
    onBenefitClick(item) {
      if (item?.action === 'service') {
        // #40 迅游客服入口点击（无参数）
        this.$dataReport('LZ_myGames', 'LZ_accelXunyouCustomerServiceClick', 'click')
        this.openCustomerService()
      }
    },
    // 外部页面：App 内走原生 external bridge，端外浏览器新开窗口（被拦截则当前窗口跳转）
    openExternalLink(url) {
      if (!url) return
      if (this.isApp) {
        openExternalUrl(url)
        return
      }
      const win = window.open(url, '_blank')
      if (!win) {
        window.location.href = url
      }
    },
    // 未勾选协议：晃动协定行提示，不打开支付弹窗
    shakeAgreement() {
      if (this.agreementShakeTimer) {
        clearTimeout(this.agreementShakeTimer)
        this.agreementShake = false
      }
      // 先移除再添加类名，保证连续点击都能重新触发动画
      this.$nextTick(() => {
        this.agreementShake = true
        this.agreementShakeTimer = setTimeout(() => {
          this.agreementShake = false
          this.agreementShakeTimer = null
        }, 600)
      })
    }
  }
}
</script>

<style scoped lang="scss">
.accelerator-buy {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  color: #eef2f8;
  background: #070c18;
}

/* 角落光带装饰：左下起始的斜向渐变，不参与交互 */
.corner {
  position: absolute;
  top: 0;
  z-index: 0;
  display: block;
  width: 297px;
  height: 341px;
  pointer-events: none;

  &--left {
    left: 0;
  }

  /* 右侧光带仅宽屏展示 */
  &--right {
    right: 0;
    display: none;
  }
}

.hdr {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;

  &__back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;

    /* 图标素材原生 32×32，按原尺寸渲染；此前压到 20px 导致返回箭头偏小 */
    img {
      display: block;
      width: 32px;
      height: 32px;
    }

    &:active {
      opacity: 0.7;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
  }

  &__link {
    padding: 4px 2px;
    border: 0;
    background: transparent;
    color: rgba(238, 242, 248, 0.8);
    font-size: 14px;
    cursor: pointer;

    &:active {
      opacity: 0.7;
    }
  }

  /* 两个入口之间的短竖线分隔 */
  &__divider {
    width: 1px;
    height: 12px;
    margin: 0 10px;
    background: rgba(238, 242, 248, 0.28);
  }
}

.scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.scroll__inner {
  padding: 12px 16px 24px;
}

/* ---------- 会员信息区 ---------- */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0px 0 20px 8px;

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    /* 头像与昵称整体左移 5px（只动用户区，不牵动右侧徽章位置） */
    margin-left: -5px;
  }

  &__avatar {
    flex-shrink: 0;
    display: block;
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }

  &__meta {
    min-width: 0;
  }

  &__nick {
    margin: 0 0 2px;
    color: rgba(238, 242, 248, 0.75);
    font-size: 12px;
    line-height: 17px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__slogan {
    margin: 0;
    /* 金色渐变文字：用 background-clip 裁到文字，文字填充透明后透出渐变 */
    background: linear-gradient(270deg, #ffd4a0 29.46%, #fffed5 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 16px;
    font-weight: 700;
    line-height: 22px;
  }

  &__expire {
    margin: 2px 0 0;
    color: rgba(238, 242, 248, 0.55);
    font-size: 12px;
    line-height: 17px;
  }

  /* 即将到期提醒：剩余 N 天到期（橙色高亮）。
     整段不折行，窄屏放不下时整体换到下一行，避免出现「剩余4天到 / 期」这种断字 */
  &__expire-hl {
    color: #ff9940;
    white-space: nowrap;
  }

  &__badge {
    flex-shrink: 0;
    display: block;
    width: 110px;
    height: 110px;
  }
}

/* ---------- 新人 / 回归福利 ---------- */
.welfare-card {
  position: relative;
  --border-strong: rgba(255, 255, 255, 0.24);
  width: 100%;
  max-width: 960px;
  height: 96px;
  margin: 0 auto 22px;
  overflow: hidden;
  border: 0.5px solid var(--border-strong);
  border-radius: 12px;
  background: #102039;

  /* 素材左侧是文案、右侧留白给按钮：窄屏以左对齐裁掉右侧留白，避免把文案等比缩小 */
  &__image {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: left center;
  }

  &__claim {
    position: absolute;
    top: 50%;
    right: 16px;
    width: 66px;
    height: 32px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    transform: translateY(-50%);

    img {
      display: block;
      width: 100%;
      height: 100%;
    }

    &:active:not(:disabled) {
      opacity: 0.85;
    }

    &:disabled {
      cursor: default;
      opacity: 0.7;
    }
  }
}

/* ---------- 套餐 ---------- */
.pkgs {
  /* 通栏滚动：抵消内容区左右内边距，卡片可横向滑到屏幕边缘 */
  margin-right: -16px;
  margin-bottom: 22px;
  margin-left: -16px;
}

.pkgs__list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 140px;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  /* 首尾留出内边距：首卡与内容区左对齐，末卡可滚到右边缘并留出收尾间距 */
  padding-right: 16px;
  padding-bottom: 2px;
  padding-left: 16px;
  scroll-padding-left: 16px;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* 卡片外层：只为角标留出伸出卡片的 10px 空间，卡片本体的裁切不影响角标 */
.pkg-item {
  position: relative;
  scroll-snap-align: start;
  width: 140px;
  min-width: 140px;
  /* 上内边距 = 角标伸出量：角标贴在容器顶，卡片从 10px 处开始 */
  padding-top: 10px;
}

.pkg {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 136px;
  min-width: 136px;
  height: 162px;
  padding: 14px 12px;
  border: 2px solid #2A66DB;
  border-radius: 8px;
  background: #032457;
  cursor: pointer;

  /* 未选中卡片压暗 50%；角标在卡片外层，不受影响，保持满亮度 */
  .pkg-item.is-dimmed & {
    opacity: 0.5;
  }

  /* 背景斜杠：设计稿 64×223，旋转 45° 后由卡片溢出裁切 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    right: -28px;
    z-index: -1;
    width: 64px;
    height: 423px;
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-47%) rotate(45deg);
    pointer-events: none;
  }

  &.is-selected {
    border: 2px solid #2A66DB;
    /* 选中态换为深蓝到亮蓝的对角渐变；斜光条仍由 ::before 绘制，角度与未选中态一致 */
    background: linear-gradient(144deg, #061f47 0%, #0f4cad 100%);
  }

  /* 固定让出角标高度：有无促销信息时标题都对齐，不会左右高低不齐 */
  &__name {
    margin: 16px 0 0;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
  }

  /* 促销信息：贴在卡片上方 10px 的红色角标，仅右下角大圆角收形 */
  &__badge {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    overflow: hidden;
    max-width: calc(100% - 24px);
    margin: 0;
    padding: 2px 10px 3px 9px;
    border-radius: 12px 12px 12px 0;
    background: #c0392b;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__price {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    /* 上外边距 auto 把均价压到卡片下部、紧贴合计条上方，与设计稿的纵向节奏一致 */
    margin: auto 0 0;
  }

  /* 均价：数字与 /月 | /天 单位按基线对齐 */
  &__amount {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    min-width: 0;
  }

  &__cur {
    display: inline-flex;
    align-items: baseline;
    color: #ffce8a;
    font-family: Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 28px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
  }

  &__unit {
    color: rgba(240, 185, 95, 0.9);
    font-size: 12px;
  }

  /* 划线原价：与均价同排靠右，底部对齐 */
  &__old {
    flex-shrink: 0;
    color: rgba(190, 212, 245, 0.5);
    font-size: 12px;
    line-height: 17px;
    text-decoration: line-through;
    white-space: nowrap;
  }

  /* 合计付款金额：通栏蓝条压到卡片底部（负外边距抵消卡片内边距），选中/未选中同色 */
  &__total {
    margin: 12px -12px -14px;
    padding: 8px 4px;
    background: #2a66db;
    color: #f5f5f5;
    font-family: 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: 22px;
    text-align: center;
    white-space: nowrap;
  }
}

/* 套餐接口失败：整页加载失败提示（页面其余内容与底部栏均不展示） */
.page-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 16px;
  text-align: center;

  &__msg {
    margin: 0;
    color: rgba(238, 242, 248, 0.65);
    font-size: 14px;
    line-height: 22px;
  }

  &__retry {
    margin-top: 18px;
    padding: 9px 26px;
    border: 1px solid rgba(90, 140, 220, 0.5);
    border-radius: 6px;
    background: #101d33;
    color: #eef2f8;
    font-size: 14px;
    cursor: pointer;

    &:active {
      opacity: 0.8;
    }
  }
}

.state-tip {
  padding: 40px 16px;
  color: rgba(238, 242, 248, 0.5);
  font-size: 13px;
  text-align: center;

  p {
    line-height: 1.7;
  }
}

/* ---------- 付款方式 ---------- */
.section-title {
  margin: 0 0 10px;
  color: #EAF7FF66;
  font-size: 13px;
  font-weight: 400;
  line-height: 19px;
  text-align: center;
}

.pay {
  margin-bottom: 22px;
}

.pay__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  /* 仅剩一种付款方式（连续包月仅支持支付宝）时占满整行 */
  &.is-single {
    grid-template-columns: minmax(0, 1fr);
  }
}

.pay__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #eef2f8;
  font-size: 15px;
  cursor: pointer;

  &.is-selected {
    border: 1px solid #3887FF;
    background: rgba(255, 255, 255, 0.04);
    overflow: hidden;
  }

  &:active {
    opacity: 0.85;
  }
}

.pay__icon {
  display: block;
  width: 20px;
  height: 20px;
}

.pay__check {
  position: absolute;
  right: 0;
  bottom: 0;
  display: block;
  width: 18px;
  height: 18px;
}

/* ---------- VIP 权益 ---------- */
.benefits {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
}

/* 权益区背景纹理：宽屏纹理图，作为底层铺满，不参与交互 */
.benefits__bg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;

  &--wide {
    display: none;
  }
}

.benefits__title,
.benefits__grid {
  position: relative;
  z-index: 1;
}

.benefits__title {
  margin: 0 0 16px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.benefits__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.benefit {
  padding: 12px 10px;
  border: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);

  /* 可点击的权益项（VIP 专属客服） */
  &.is-action {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.8;
    }
  }

  /* 窄屏 5 项时最后一项独占整行，避免网格出现空洞 */
  &:last-child {
    grid-column: 1 / -1;
  }

  &__icon {
    display: block;
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    line-height: 19px;
  }

  /* 客服项右侧箭头图标（arrow-left.png，32x32 设计图按 14px 展示） */
  &__arrow {
    flex-shrink: 0;
    display: block;
    width: 14px;
    height: 14px;
  }

  &__desc {
    margin: 4px 0 0;
    color: rgba(190, 212, 245, 0.62);
    font-size: 11px;
    line-height: 16px;
  }
}

/* ---------- 底部开通栏 ---------- */
.footer {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  border-top: 1px solid rgba(90, 140, 220, 0.28);
  background: #070c18;
}

.footer__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
}

.footer__bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 0 16px;
  border: 1px solid rgba(90, 140, 220, 0.5);
  border-radius: 4px;
  background: linear-gradient(90deg, #0b1a30 0%, #0e2444 60%, #102a52 100%);
}

.footer__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  margin: 0;
}

.footer__old {
  color: rgba(238, 242, 248, 0.5);
  font-size: 13px;
  text-decoration: line-through;
}

.footer__cur {
  display: inline-flex;
  align-items: baseline;
  color: #ffce8a;
  font-family: Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 24px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
}

/* 底部价格里的货币符号与数字底部对齐，并与数字留 3px 间距 */
.footer__symbol {
  margin-right: 3px;
  color: #ffce8a;
  font-family: Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
}

.footer__unit {
  color: rgba(240, 185, 95, 0.9);
  font-size: 12px;
}

.footer__btn {
  position: relative;
  flex-shrink: 0;
  /* 立即开通按钮占底栏宽度约 50% */
  width: 50%;
  margin-left: auto;
  height: 50px;
  padding: 0 32px 0 26px;
  border: 0;
  border-radius: 0 4px 4px 0;
  background: #2a66db;
  color: #f5f5f5;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:active {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 按钮左侧的斜切过渡图：贴在按钮左边缘并向外延伸，与按钮底色拼成斜角 */
.footer__btn-back {
  position: absolute;
  top: 0;
  right: 100%;
  display: block;
  width: 44px;
  height: 100%;
  pointer-events: none;
}

/* 协议行固定占位：总高 28px（10px 上间距 + 协议行），与改造前一致；
   无协议（非连续包月）时同样保留该高度，底部按钮区域高度不随套餐切换变化 */
.agreement-slot {
  min-height: 28px;
  padding-top: 10px;
  box-sizing: border-box;
}

.agreement {
  display: flex;
  /* 复选框与文案垂直居中（文案行高改为 auto 后不能再靠固定 margin 对齐） */
  align-items: center;
  justify-content: center;
  gap: 6px;
  /* 晃动提示靠 transform 实现，避免触发布局抖动 */
  transform-origin: center;

  &.is-shake {
    animation: agreement-shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
}

@keyframes agreement-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  15% {
    transform: translateX(-6px);
  }

  30% {
    transform: translateX(5px);
  }

  45% {
    transform: translateX(-4px);
  }

  60% {
    transform: translateX(3px);
  }

  75% {
    transform: translateX(-2px);
  }
}

.agreement__box {
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  /* 由 .agreement 的 align-items:center 负责与文案对齐，无需再按行高补偏移 */
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid #CCCCCC;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;

  &:checked {
    border: 0 none;
    background-color: #335EFF;
  }

  &:checked::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    color: #fff;
  }
}

.agreement__text {
  /* 「我已阅读并同意」： #f5f5f5 40% 透明 */
  color: rgba(245, 245, 245, 0.4);
  font-size: 11px;
  /* 行高 auto（normal），不再锁死 18px */
  line-height: normal;
}

/* 协议链接：《自动续费服务协议》用 #f5f5f5 实色，与说明文案区分 */
.agreement__link {
  display: inline;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f5;
  font: inherit;
  line-height: inherit;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
}

.agreement__text > label {
  cursor: pointer;
}

/* ---------- 宽屏 ---------- */
@media (min-width: 768px) {
  /* 宽屏右上角补一条光带，与左上角对称 */
  .corner--right {
    display: block;
  }

  .benefits__bg--wide {
    display: block;
  }

  .scroll__inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px 24px 40px;
  }

  .hero {
    padding: 12px 0 28px;
  }

  .hero__avatar {
    width: 44px;
    height: 44px;
  }

  .hero__badge {
    width: 110px;
    height: 110px;
  }

  .pkgs {
    /* 宽屏 4 列铺满内容区，不需要通栏滚动 */
    margin-right: 0;
    margin-left: 0;
  }

  .pkgs__list {
    /* 与窄屏保持一致，宽屏不改卡片间距 */
    gap: 10px;
    padding-right: 0;
    padding-left: 0;
    overflow: visible;
    scroll-snap-type: none;
    overflow-x: scroll;
  }

  .pkg {
    /* 宽屏由 4 等分网格决定宽度，取消窄屏的固定 140px */
    width: auto;
    min-width: 0;
  }

  .pay__list {
    max-width: 912px;
    margin: 0 auto;
  }

  .benefits__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  /* 宽屏 2 列时最后一项回到自己的列，与设计稿一致 */
  .benefit:last-child {
    grid-column: auto;
  }

  .footer__bar {
    /* 只留左侧内边距，按钮右贴边、上下满高，与窄屏一致 */
    padding: 0 0 0 24px;
  }

  /* 与内容区左右对齐（同为 max-width 1200 + 24px 内边距） */
  .footer__inner {
    padding-right: 24px;
    padding-left: 24px;
  }

  .footer__btn {
    min-width: 300px;
    height: 46px;
  }

  /* 斜切图跟随按钮高度，保持原始比例 */
  .footer__btn-back {
    width: 48px;
  }
}
</style>

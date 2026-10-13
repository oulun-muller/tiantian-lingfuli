<template>
  <div :class="['my-games', { handHeldDevice: $isHandHeldDevice }]">
    <AIGuideOverlay v-if="$isAIPartnerEnabled" />
    <div class="game-container">
      <!-- 顶部操作区。xunyou-layout 标记 18 版入口行：竖屏也贴屏幕两侧、横屏固定 220；
           17 版是竖屏居中 + 横屏 180 -->
      <div
        :class="[
          'top-banner-actions',
          {
            'has-global-connect': $isGlobalConnectEnabled,
            'welfare-layout': showWelfareEntry,
            'is-landscape': showWelfareEntry && isLandscape,
            'xunyou-layout': $isXunyouEnabled
          }
        ]">
        <div class="game-time">
          <div class="number-class">
            <div class="number">{{ totalDuration }}</div>
            <div class="text">游戏总时长</div>
          </div>
        </div>
        <!-- 顶栏浮层：设备入口在左、天天领好礼在右。18 版把 AI游戏伙伴换成圆球，插在游戏助手右侧。 -->
        <div class="top-float-row">
          <div class="action-row">
            <img v-if="isShowMyDevice" class="action-img" src="./image/equipment-entrance.svg" alt="" @click="toEquipment" />
            <img
              class="action-img"
              src="./image/gameHelper-entrance.svg"
              alt=""
              @click="toGameHelper" />
            <img
              v-if="$isXunyouEnabled && $isAIPartnerEnabled"
              class="action-img"
              src="@/images/padimg/game_partner_entry_logo.svg"
              alt="AI游戏伙伴"
              @click="handleAIAgentClick" />
          </div>
          <WelfareEntry
            v-if="showWelfareEntry"
            class="welfare-entry-float" />
        </div>
        <!-- 入口行：17 版是「AI游戏伙伴 + 全境畅连」；18 版 AI游戏伙伴上移为圆球，本行换成「全境畅连 + 会员卡」。 -->
        <div class="action-group-new" v-if="$isGlobalConnectEnabled">
          <img
            v-if="!$isXunyouEnabled"
            class="ai-partner-btn-new"
            src="./image/game_partner_entry.png"
            alt="AI游戏伙伴"
            @click="handleAIAgentClick" />
          <img
            class="global-connect-btn-new"
            src="./image/global_connect_entry.svg"
            alt="全境畅连"
            @click="handleGlobalConnectClick" />
          <XunyouMemberCard
            v-if="$isXunyouEnabled"
            class="xunyou-member-card-slot"
            @click="handleXunyouClick" />
        </div>
        <!-- <div :class="['action-group', { 'two-row': $isGlobalConnectEnabled }]">
          <img
            v-if="!$isGlobalConnectEnabled"
            class="global-connect-btn"
            src="./image/global_connect_entry.svg"
            alt="全境畅联"
            @click="handleGlobalConnectClick" />
        </div> -->
      </div>
      <GameCarousel :game-list="localGameList" />
    </div>

    <!-- 福利露出位：底部/右上的福利横幅（会员卡的福利态已按设计改版移除）；
         领取结果弹窗放在这个共同父级 —— 从横幅领完归它展示。两者都 Teleport 到 body，
         在组件树里的位置不影响显示。 -->
    <XunyouWelfareBanner v-if="$isXunyouEnabled" />
    <XunyouGiftClaimDialog
      v-model:visible="claimDialogVisible"
      :duration-days="claimedDurationDays" />
  </div>
</template>

<script>
import GameCarousel from './components/GameCarousel.vue'
import AIGuideOverlay from './components/AIGuideOverlay.vue'
import WelfareEntry from './components/WelfareEntry.vue'
import XunyouMemberCard from './components/XunyouMemberCard.vue'
import XunyouWelfareBanner from './components/XunyouWelfareBanner.vue'
import XunyouGiftClaimDialog from '@/views/mobile/components/XunyouGiftClaimDialog/index.vue'

import { openNativePage } from '@/nativeApiPad/common.js'
import Base64 from '@/utils/base64'
import { getLocalGameList, getTotalLocklTime } from '@/nativeApiPad/common.js'
import { clearLoginResume, getAccelStatusSync, syncAccelStateFromNative } from '@/bridge/legionZoneMobile'
import { DEVICE_TYPE } from '@/store/enum/buryingPoint.js'
import { isWelfareH5UiEnabled } from '@/utils/welfareVersionGate'
import { formatAccelVipStatusText, refreshXunyouAccelStatus } from '@/utils/xunyouAccel'
import {
  claimDialogVisible as sharedClaimDialogVisible,
  claimedDurationDays as sharedClaimedDurationDays,
  loadGifts,
  resetGifts
} from '@/utils/xunyouGiftState'

// #7 曝光新增的迅游参数 vip 就绪等待上限（毫秒）。
// vip 的数据源（native 权益状态）是异步就绪的，而本埋点的触发点是「本机游戏列表返回」——
// 状态没到就上报，会把会员误报成「暂未开通」。
// 超过该时长仍未就绪就按当时已知状态上报，宁可参数退化也不丢这次曝光。
const MY_GAMES_SHOW_XUNYOU_WAIT_MS = 2000

export default {
  name: '',
  components: {
    GameCarousel,
    AIGuideOverlay,
    WelfareEntry,
    XunyouMemberCard,
    XunyouWelfareBanner,
    XunyouGiftClaimDialog
  },
  props: {},
  data() {
    return {
      localGameList: [],
      isVerticalMobile: true,
      isLandscape: false,
      netTotalTime: 0,
      allGameDuration: 0,
      currentClientWidth: 0,
      // #7 等迅游参数就绪的兜底定时器
      myGamesShowTimer: null,
      padGameSpaceLayoutObserver: null,
      padGameSpaceLayoutFrame: undefined,
      padGameSpaceLayoutTimer: null
    }
  },
  computed: {
    isLogin() {
      return this.userInfo && this.userInfo.UserID
    },
    // 迅游加速权益：null 未获取/获取中，{ errorCode, userState, vipExpireTime } 已获取
    accelStatus() {
      return this.$store.state.user.accelStatus
    },
    // 迅游入口专用登录态：读 native 同步推送的 loginStatus 标志，而非依赖异步 userInfo，
    // 确保首屏（含已登录但 token/userID 尚未就绪的窗口期）不会误显示“未登录”。
    loginStatus() {
      return this.$store.state.user.loginStatus
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    // 领取结果弹窗由共享福利状态驱动：从福利横幅领取就归一到这里
    // （横幅在本页挂载，弹窗放在共同父级，不让自己持有它）
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
    showWelfareEntry() {
      return isWelfareH5UiEnabled(this.$store.state.system.version)
    },
    totalDuration() {
      const time = this.allGameDuration + this.netTotalTime
      const obj = this.millisecondToHour(time)
      console.log('totalDuration', obj)
      return `${obj.value}${obj.label}`
    },
    isShowMyDevice() {
      const name = this.$store.state.system.MTMInfo?.ReadableMachineName || ''
      return DEVICE_TYPE.some(item => name.includes(item))
    },
    /* ============ #7 游戏空间页曝光的新增参数（需求文档 3.1）============ */
    // vip：会员报剩余会员时长，非会员报「暂未开通」。取值与会员卡上显示的状态文案一致
    // （会员卡 >7 天显示到期日期、≤7 天显示剩余天数，需求原文：「根据当时页面显示的状态信息即可」）
    xunyouVipText() {
      return formatAccelVipStatusText(this.accelStatus)
    },
    // 迅游侧参数是否已就绪：
    //  - 客户端版本号还没到位时 $isXunyouEnabled 一定是 false（它按版本号判断，手机端版本号是 native 后推的），
    //    此刻不能断定「这个客户端没有迅游」，所以先等版本号，否则 2.0.18 客户端会被当成老版本上报；
    //  - 版本号就绪后：没开迅游、未登录都不用等；开了迅游且已登录则等权益状态到位（vip 的唯一数据源）。
    xunyouParamsReady() {
      if (!this.$store.state.system.version) return false
      if (!this.$isXunyouEnabled) return true
      if (this.loginStatus === 'no') return true
      return !!this.accelStatus
    }

  },
  watch: {
    isLogin: {
      handler(val) {
        this.handleFetchLocalGameList()
      },
      immediate: true
    },
    // #7：本机游戏列表已就绪、但迅游侧参数还没就绪时（定时器还挂着 = 尚欠一次上报），
    // 参数一就绪立刻补报，不用等满 MY_GAMES_SHOW_XUNYOU_WAIT_MS
    xunyouParamsReady(ready) {
      if (ready && this.myGamesShowTimer) this.reportMyGamesPageShow()
    },
    // 福利数据（底部福利横幅、会员页福利卡、加速前领取提醒三处共用）由本页统一拉取，
    // 见 ensureGiftsLoaded
    loginStatus() {
      this.ensureGiftsLoaded()
    },
    $isXunyouEnabled() {
      this.ensureGiftsLoaded()
      this.$nextTick(this.updatePadPortraitGameSpacePosition)
    },
    localGameList: {
      handler() {
        this.$nextTick(this.updatePadPortraitGameSpacePosition)
      },
      deep: true
    }
  },
  created() { },
  mounted() {
    const deviceType = this.$isPhoneDevice ? 'phone' : (this.$isPadDevice ? 'pad' : 'pc')
    console.log('[gameSpace] 当前设备类型:', deviceType)
    this.$emit('headerStatus', false)
    this.$store.dispatch('pageLoaded', false)

    // 同步接口自身兼容旧客户端：17 版无接口时返回 null；18 版可在版本号就绪前完成权益补拉。
    const accelStatus = getAccelStatusSync()
    console.log('[XunyouAccel] H5 gameSpace mounted 主动拉', { accelStatus, loginStatus: this.loginStatus })
    if (accelStatus && accelStatus.errorCode !== -1) {
      this.$store.dispatch('syncAccelStatus', accelStatus).catch(() => {})
      this.$store.dispatch('user/syncAccelStatus', accelStatus).catch(() => {})
    }

    // 加速状态同样要主动拉一次：accel_state 推送在页面不可见时会错过，而 SDK 的 VPNStateListener
    // 不保证覆盖所有断开场景，只靠推送会出现「VPN 已断、卡片仍显示加速中」且无法自愈。
    // 本方法取的是 native 实时查询结果，与新进页面时的真实状态对齐。
    syncAccelStateFromNative()

    // 注：原先这里有一条 LZ_xunyouEntryShow（pv，无参），按需求文档第五章已删除 ——
    // 它的职责拆成 #33 LZ_accelVipCardShow（会员卡）与 #35 LZ_accelWelfareCardShow（福利横幅）。
    if (this.$isXunyouEnabled) {
      refreshXunyouAccelStatus({ store: this.$store }).catch(() => {})
    }
    this.ensureGiftsLoaded()

    window?.LegionZoneMobile && window.LegionZoneMobile.addListener('local_game', this.refreshGameList)
    this.updateLandscape()
    window.addEventListener('resize', this.updateLandscape)
    window.addEventListener('orientationchange', this.updateLandscape)
    this.padGameSpaceLayoutObserver = new MutationObserver(() => this.schedulePadPortraitGameSpacePosition())
    this.padGameSpaceLayoutObserver.observe(this.$el, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    })
    this.$nextTick(this.updatePadPortraitGameSpacePosition)

    this.$dataReport('LZ_myGames', 'LZ_myGamesListTabShow', 'pv', {
      detail: JSON.stringify({
        listType: 'local',
        lid: this.isLogin
      })
    })

    if (this.$isGlobalConnectEnabled) {
      this.$dataReport('LZ_myGames', 'LZ_gameSpaceUnboundedSpaceEntryShow', 'pv')
    }
  },
  beforeUnmount() {
    clearLoginResume()
    window.removeEventListener('resize', this.updateLandscape)
    window.removeEventListener('orientationchange', this.updateLandscape)
    this.padGameSpaceLayoutObserver?.disconnect()
    if (this.padGameSpaceLayoutFrame !== undefined) cancelAnimationFrame(this.padGameSpaceLayoutFrame)
    if (this.padGameSpaceLayoutTimer) clearTimeout(this.padGameSpaceLayoutTimer)
    window?.LegionZoneMobile && window.LegionZoneMobile.removeListener?.('local_game', this.refreshGameList)
    if (this.myGamesShowTimer) {
      clearTimeout(this.myGamesShowTimer)
      this.myGamesShowTimer = null
    }
  },
  // 放在 unmounted（不是 beforeUnmount）：共享的福利状态复位时要保证消费它的组件都已销毁
  unmounted() {
    resetGifts()
  },
  methods: {
    updateLandscape() {
      const byMedia = window.matchMedia('(orientation: landscape)').matches
      const bySize = window.innerWidth >= window.innerHeight
      this.isLandscape = byMedia || bySize
      this.$nextTick(this.updatePadPortraitGameSpacePosition)
    },
    schedulePadPortraitGameSpacePosition() {
      if (this.padGameSpaceLayoutFrame !== undefined) cancelAnimationFrame(this.padGameSpaceLayoutFrame)
      if (this.padGameSpaceLayoutTimer) clearTimeout(this.padGameSpaceLayoutTimer)
      // GameCarousel 的 active/prev/next 状态有 0.3s CSS transition，等过渡结束后再测量最终位置。
      this.padGameSpaceLayoutTimer = setTimeout(() => {
        this.padGameSpaceLayoutTimer = null
        this.padGameSpaceLayoutFrame = requestAnimationFrame(() => {
          this.padGameSpaceLayoutFrame = undefined
          this.updatePadPortraitGameSpacePosition()
        })
      }, 350)
    },
    updatePadPortraitGameSpacePosition() {
      const carousel = this.$el.querySelector('.game-snap-carousel.is-xunyou')
      if (!carousel) return

      carousel.style.setProperty('--pad-portrait-game-space-offset-y', '0px')
      if (!this.$isPadDevice || this.isLandscape || !this.$isXunyouEnabled) return

      const acceleratorCard = this.$el.querySelector('.xunyou-member-card-slot')
      const gameCard = carousel.querySelector('.swiper-item.active .banner-item.portrait')
      const gameIcon = carousel.querySelector('.snap-item.active')
      if (!acceleratorCard || !gameCard || !gameIcon) return

      const acceleratorCardRect = acceleratorCard.getBoundingClientRect()
      const gameCardRect = gameCard.getBoundingClientRect()
      const gameIconRect = gameIcon.getBoundingClientRect()
      const groupTop = Math.min(gameCardRect.top, gameIconRect.top)
      const groupBottom = Math.max(gameCardRect.bottom, gameIconRect.bottom)
      const groupCenter = (groupTop + groupBottom) / 2
      const availableBottom = window.innerHeight - this.getPadBottomNavInset()
      const availableCenter = (acceleratorCardRect.bottom + availableBottom) / 2
      carousel.style.setProperty(
        '--pad-portrait-game-space-offset-y',
        `${availableCenter - groupCenter}px`
      )
    },
    getPadBottomNavInset() {
      // Android activity_main.xml 按 smallest-width 选择资源，导航高度加底部间距如下。
      // WebView CSS px 与 Android dp 在当前桥接环境中等值，直接使用对应数值。
      if (window.innerWidth >= 938) return 82 // sw938dp: 80 + 2
      if (window.innerWidth >= 640) return 70 // sw640dp: 66 + 4
      return 74 // sw600dp/default: 74 + 0
    },
    refreshGameList(res) {
      const base64data = Base64.decode(res)
      const result = JSON.parse(base64data)
      console.log('refreshGameList', result)
      if (result && result.length > 0) {
        this.localGameList = this.formatGmaeData(result)
        this.allGameDuration = result.reduce((total, item) => total + (item.usedDayTime || 0), 0)
      }
      return 1
    },
    formatGmaeData(list) {
      // 格式化数据，兼容 GameDownloadButton 组件
      const _list = JSON.parse(JSON.stringify(list))
      return _list.map(_ => {
        return Object.assign(_, {
          softId: _.softId || '',
          softName: _.appName,
          maxSeconds: _.maxSeconds || 0,
          gameSeconds: _.gameSeconds || 0,
          hlSoftName: null,
          showInfo: {
            vimg: '',
            himg: '',
            score: '',
            softLabels: [],
            hlSoftLabels: null,
            labelName: null,
            ruleLabelName: null,
            top: false,
            logoFile: _.imageUrl || '',
            isFastInstall: false,
            installFileSize: '',
            mediaScores: null,
            awardInfos: null,
            rankingLabelInfos: [],
            hotNum: 0,
            playersNum: 0,
            img354x285: '',
            img162x285: ''
          },
          productInfo: {
            userPurchasedStatus: 0
          },
          skuId: '0',
          currentTimeActivity: null,
          softPurpose: 2,
          downloadInfo: {
            downloadCount: '',
            pcStoreParam: '',
            webStoreUrl: '',
            tagUrls: [],
            bizType: 0,
            expectedReleaseTime: null,
            reservationCount: 0,
            testActivityStatus: null,
            testActivityName: null,
            testActivityId: null,
            testActivityQuestionUrl: null,
            userTestApplyStatus: null,
            userReservationStatus: null,
            installSize: null
          },
          softDesc: {
            captureFileList: [],
            videoUrl: '',
            videoCoverImg: [],
            supportPlatform: [],
            whatsNew: null,
            supportOsBit: [],
            introduction: '',
            followerCount: 0,
            pkgName: _.packageName || '',
            runConfigInfo: null,
            isAd: null,
            version: _.versionCode || '',
            versionCode: _.versionCode || ''
          },
          firstClassId: 0,
          status: true,
          rankingListLabelImg: null,
          sort: 0,
          resizeTimer: null
        })
      })
    },
    millisecondToHour(milliseconds) {
      // 根据毫秒数转换为合适的时间单位
      const totalSeconds = milliseconds / 1000
      const totalMinutes = totalSeconds / 60
      const totalHours = totalMinutes / 60
      // 判断时间单位并返回对应的值和标签
      if (totalHours >= 1) {
        // 满整小时的，保留两位小数
        return { value: Number(totalHours.toFixed(2)) || 0, label: 'h' }
      } else if (totalMinutes >= 1) {
        // 不够小时的，返回分钟
        return { value: Math.round(totalMinutes) || 0, label: 'm' }
      } else {
        // 不够分钟的，返回秒
        return { value: Math.round(totalSeconds) || 0, label: 's' }
      }
    },
    // 跳转装备
    toEquipment() {
      this.$dataReport('LZ_myGames', 'LZ_deviceControlEntryClick ', 'click')
      openNativePage('DevicePage')
    },
    // 跳转游戏助手
    toGameHelper() {
      this.$dataReport('LZ_myGames', 'LZ_myGamesAssistantSettingClick', 'click')
      window.LegionZoneMobile.nativeCall('LegionZone', 'intentGameAssistant')
    },
    handleAIAgentClick() {
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorAIAgent')
      }
    },
    handleGlobalConnectClick() {
      this.$dataReport('LZ_myGames', 'LZ_gameSpaceUnboundedSpaceEntryClick', 'click')
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorGlobalConnect')
      }
    },
    /**
     * 拉一次新人 / 回归福利。游戏空间的福利横幅、会员页的福利卡、加速前的领取提醒弹窗
     * 读的都是同一份数据（`@/utils/xunyouGiftState`），取数由本页统一触发，消费方只读不拉。
     *
     * 迅游开关 `$isXunyouEnabled` 按 native 后推的版本号判断，可能晚于 mounted 才为真，
     * 未登录时 `loadGifts` 也会先把状态置为空 —— 所以两个依赖任一就绪/变化都补拉一次，
     * 重复调用由 `loadGifts` 内部的 in-flight 去重兜住。
     */
    ensureGiftsLoaded() {
      if (this.$isXunyouEnabled) loadGifts(this.loginStatus)
    },
    // 迅游加速器卡片点击：未登录先拉起原生登录；已登录（含未鉴权、未开会员）进套餐购买页。
    // 注：#34 LZ_accelVipCardButtonClick 的点击上报已挪到卡片组件里（卡片是状态机多态卡，
    // 只有它知道当前是开通态还是续费态），原先这里的 LZ_xunyouEntryClick 按需求文档第五章已删除。
    handleXunyouClick() {
      if (this.loginStatus !== 'yes') {
        this.$loginForAccel(() => this.goAcceleratorBuy())
        return
      }
      this.goAcceleratorBuy()
    },
    goAcceleratorBuy() {
      this.$router.push({ name: 'AcceleratorBuy' })
    },
    /**
     * #7 游戏空间页曝光（pv）：本次在原参数上新增 vip（会员状态文案）。
     * 触发点是「本机游戏列表返回」，而 vip 的数据源是异步就绪的（native 权益），
     * 所以未就绪时先挂起：参数一就绪由 xunyouParamsReady 的 watcher 补报，最多等
     * MY_GAMES_SHOW_XUNYOU_WAIT_MS 后按当时已知状态兜底上报（不丢曝光）。
     * 本埋点是旧埋点补参数，上报次数与原实现保持一致（列表每次加载各报一次，不额外去重）。
     */
    scheduleMyGamesPageShow() {
      if (this.xunyouParamsReady) {
        this.reportMyGamesPageShow()
        return
      }
      if (this.myGamesShowTimer) clearTimeout(this.myGamesShowTimer)
      this.myGamesShowTimer = setTimeout(() => {
        this.myGamesShowTimer = null
        this.reportMyGamesPageShow()
      }, MY_GAMES_SHOW_XUNYOU_WAIT_MS)
    },
    reportMyGamesPageShow() {
      if (this.myGamesShowTimer) {
        clearTimeout(this.myGamesShowTimer)
        this.myGamesShowTimer = null
      }
      this.$dataReport('LZ_myGames', 'LZ_myGamesPageShow', 'pv', {
        detail: JSON.stringify({
          localCount: this.localGameList.length,
          lid: this.isLogin,
          vip: this.xunyouVipText
        })
      })
    },
    handleFetchLocalGameList() {
      // const list = [
      //   { softId: '1', appName: 'NINJA 4', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 264 },
      //   { softId: '2', appName: '紫色幻想', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/e003x4rk0i6q5cttbss8.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/e003x4rk0i6q5cttbss8.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 120 },
      //   { softId: '3', appName: '足球风云', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 89 },
      //   { softId: '4', appName: '冰雪奇缘', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 156 },
      //   { softId: '5', appName: '红黑骑士', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 201 },
      //   { softId: '7', appName: '红发传说', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 177 },
      //   { softId: '8', appName: '夜猫子', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 132 },
      //   { softId: '9', appName: '新的开始', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 182 },
      //   { softId: '10', appName: '神秘的世界', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 145 },
      //   { softId: '11', appName: '未来的城市', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 168 },
      //   { softId: '12', appName: '神秘的未来', coverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', verticalCoverUrl: 'https://imgs6.lenovomm.cn/ali/img/pc-appstore/wl4k1rplujc017ket60j.jpg', iconUrl: 'https://yyb-community-1258344701.file.myqcloud.com/logo/2ee2b8948a958c4b4c98a7967f6df940421de7520421875d81778af11f7bff02', playHours: 123 }
      // ]
      // this.localGameList = this.formatGmaeData(list)
      if (!this.isLogin) {
        this.$dataReport('LZ_myGames', 'LZ_noGamePageShow ', 'pv')
        return
      }
      try {
        getLocalGameList().then(res => {
          if (res) {
            const list = JSON.parse(res)
            if (list && list.length > 0) {
              this.localGameList = this.formatGmaeData(list)
              this.allGameDuration = list.reduce((total, item) => total + (item.usedDayTime || 0), 0)
            } else {
              this.$dataReport('LZ_myGames', 'LZ_noGamePageShow ', 'pv')
            }
            console.log('.........本机游戏', this.localGameList)

            // #7 游戏空间页曝光（pv）：见 scheduleMyGamesPageShow 的注释
            this.scheduleMyGamesPageShow()

            const needUpdateGames = this.localGameList.filter(item => {
              return item.isNeedUpdate
            })
            this.haveUpdatedGames = needUpdateGames
          } else {
            this.localGameList = []
            this.$dataReport('LZ_myGames', 'LZ_noGamePageShow ', 'pv')
          }
        })
        getTotalLocklTime().then(res => {
          if (res) {
            const totalTime = Number(res) || 0
            if (totalTime) {
              this.netTotalTime = totalTime
              console.log('.........本机游戏总时长', totalTime)
            }
          }
        })
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.my-games {
  height: 100%;
  width: 100%;
  scrollbar-width: none;

  // 隐藏滚动调
  ::-webkit-scrollbar {
    display: none;
  }

}

.game-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-image: url('./image/vertical-bg-h.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

/* 18 版入口行保留原有布局，不因福利横幅切换页面结构。 */

.top-banner-actions {
  position: relative;
  align-items: center;
  margin-bottom: 6px;

  .game-time {
    width: 100%;
    max-width: 986px;
    height: 112px;
    background-image: url('./image/top-number-bg-h.png');
    background-size: 100% 100%;
    background-position: center;
    position: relative;
    margin: 0 auto;
    overflow: visible;

    .number-class {
      position: absolute;
      bottom: 36px;
      left: 50%;
      transform: translate(-50%, 0%);
      font-size: 32px;
      font-weight: 900;

      .number {
        width: 100%;
        text-align: center;
        background: linear-gradient(180deg, #EAF7FF 0%, #8C9499 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transform: skew(-10deg);
        display: inline-block;
      }

      .text {
        font-weight: 400;
        color: rgba(234, 247, 255, 0.40);
        font-size: 14px;
        text-align: center;
      }
    }
  }

  /* 17 版福利布局：顶栏左右浮层。 */
  .top-float-row {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 50px 20px 0;
    box-sizing: border-box;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }

  .action-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;

    .action-img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
  }

  .welfare-entry-float {
    display: inline-flex;
    flex-shrink: 0;
  }

  &.welfare-layout {
    .top-float-row {
      justify-content: space-between;
      padding: 50px 20px 0;
    }
  }

  /* 17 / 18 共用的横屏入口行定位 */
  &.welfare-layout.is-landscape {
    margin-bottom: 50px;

    .action-group-new {
      position: absolute;
      left: 0;
      right: 0;
      top: 120px;
      margin: 0;
      padding: 0 20px;
      box-sizing: border-box;
      justify-content: space-between;
      z-index: 2;
    }
  }

  /* 17 版横屏入口尺寸（18 版走固定 220，不套用）。object-fit 由下面 .action-group-new 统一给 */
  &.welfare-layout.is-landscape:not(.xunyou-layout) {
    .action-group-new {
      .ai-partner-btn-new,
      .global-connect-btn-new {
        width: 180px !important;
        height: auto !important;
        flex-shrink: 0;
      }
    }
  }

  /* 18 版横屏入口尺寸：固定 220 宽（不分 pad/phone，也不跟竖屏尺寸走） */
  &.welfare-layout.is-landscape.xunyou-layout {
    .action-group-new {
      .global-connect-btn-new {
        width: 220px !important;
        height: auto !important;
        flex-shrink: 0;
      }

      .xunyou-member-card-slot {
        --xunyou-card-scale: 1.208791;
      }
    }
  }

  .action-group-new {
    display: flex;
    align-items: center;
    gap: 20px;
    justify-content: center;

    .ai-partner-btn-new,
    .global-connect-btn-new {
      width: 260px;
      height: 90px;
      object-fit: contain;
    }

    /* 会员卡是组件、没有 object-fit 可用，只能让卡片按设计稿 182×52 等比缩放，
       缩放比例 = 入口行宽度 / 182（此处 260 / 182） */
    .xunyou-member-card-slot {
      --xunyou-card-scale: 1.428571;
      flex-shrink: 0;
    }
  }

  /* 18 版：竖屏入口行也贴屏幕两侧，和横屏一致（17 版仍居中） */
  &.xunyou-layout .action-group-new {
    justify-content: space-between;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .action-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 30px;
    position: absolute;
    right: 0;
    top: 100px;

    .action-img {
      width: 50px;
      height: 50px;
    }

    .global-connect-btn {
      height: 50px;
      width: auto;
      margin-right: 20px;
      cursor: pointer;
      &:active {
        opacity: 0.7;
      }
    }
  }

  .ai-partner-btn {
    position: absolute;
    left: 30px;
    top: 100px;
    height: 50px;
    width: auto;
    z-index: 9999 !important;
    cursor: pointer;
    &:active {
      opacity: 0.7;
    }
  }

}

@media (max-width: 1000px) {
  .game-container {
    background-image: url('./image/vertical-bg.png');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
  }

  .top-banner-actions {
    display: block;
    margin-bottom: 50px;

    .game-time {
      //  height: 20.125vw;
      height: 116px;
      background-image: url('./image/top-number-bg.png');

      .number-class {
        bottom: 42px;
      }
    }

    .action-group {
      padding-right: 30px;
      align-items: center;
      top: auto;
      bottom: -40px;

      .action-img {
        width: 6.25vw;
        height: 6.25vw;
        min-width: 32px;
        min-height: 32px;
      }

      .global-connect-btn {
        height: 6.25vw;
        min-height: 32px;
      }
    }

    .ai-partner-btn {
      left: 30px;
      bottom: -40px;
      top: auto;
      height: 6.25vw;
      min-height: 32px;
    }
  }
}

@media (max-width: 600px) {
  .top-banner-actions {

    .ai-partner-btn {
      height: 32px;
    }

    .action-group {
      .action-img {
        width: 32px;
        height: 32px;
      }

      .global-connect-btn {
        height: 32px;
      }
    }
  }

  /* 窄屏只有 412 宽：两张 192 的卡加 20 间距已经占掉 404，只剩 8px 总余量，
     左右各留 4px 就是上限（再大就会挤压图片、甚至推出屏幕）。
     按屏宽判断而不是按设备类型，横屏时屏够宽就照常用的 20px 走。
     注：18 版 phone 竖屏已由文件末尾 `.PhoneDevice … .xunyou-layout` 那条接管
     （padding 16 + 卡片 182，412 下刚好占满），这里只剩非 phone 的窄屏会命中。 */
  .top-banner-actions.xunyou-layout .action-group-new {
    padding: 0 4px;
  }
}

@media (max-height: 550px) {
  .top-banner-actions {
    display: block;
    margin-bottom: 0;
  }
}

.PadDevice {
  .ai-partner-btn {
    top: 100px;
  }
  .action-group {
    top: 100px;
  }
  .top-banner-actions.has-global-connect .ai-partner-btn {
    bottom: auto;
    top: 100px;
  }

  @media (max-width: 1000px) {
    .ai-partner-btn {
      top: 106px;
      bottom: auto;
    }
    .action-group {
      top: 106px;
      bottom: auto;
    }
    .top-banner-actions.has-global-connect .ai-partner-btn {
      top: 106px;
      bottom: auto;
    }
  }
}

.PhoneDevice {
  .game-time {
    height: 116px;
      background-image: url('./image/top-number-bg-phone.png');
  }
  .top-banner-actions {
    margin-bottom: 90px;
  }
  .top-banner-actions .game-time .number-class .text {
    font-size: 12px;
  }
  .top-banner-actions .game-time .number-class .number {
    font-size: 28px;
  }
  .action-group.two-row {
    flex-direction: column;
    align-items: flex-end;
    bottom: -52px;

    .global-connect-btn {
      margin-right: 0;
    }
  }

  .action-row {
    gap: 24px;
  }

  .top-banner-actions.has-global-connect .ai-partner-btn {
    bottom: 0;
  }

  .action-group-new {
    display: flex;
    align-items: center;
    gap: 20px;
    justify-content: center;

    .ai-partner-btn-new,
    .global-connect-btn-new {
      width: 192px;
      height: 80px;
      object-fit: contain;
    }

    .xunyou-member-card-slot {
      --xunyou-card-scale: 1.054945;
    }
  }
}

@media (orientation: landscape) {
  /* 旧版布局：伙伴/畅连仍在原位（左上 top:50px） */
  .top-banner-actions:not(.welfare-layout) {
    .action-group-new {
      display: flex;
      align-items: center;
      gap: 20px;
      justify-content: center;
      margin-left: 20px;
      position: absolute;
      left: 0;
      top: 50px;
      z-index: 2;
      .ai-partner-btn-new,
      .global-connect-btn-new {
        width: 180px !important;
        height: auto !important;
        object-fit: contain;
      }
    }
  }

  /* welfare-layout 的横屏入口行（定位 + 17/18 各自的尺寸）统一由上面 .is-landscape 那三块负责，
     这里不再重复一份：is-landscape = matchMedia('(orientation: landscape)') || innerWidth >= innerHeight
     （见 updateLandscape），是媒体查询的超集，且在 mounted 里同步求值、首帧前就绪。 */

  .handHeldDevice .game-container {
    background-image: url('./image/vertical-bg-h.png');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
  }

  .handHeldDevice .top-banner-actions .game-time {
    background-image: url('./image/top-number-bg-h.png');
  }
}

@media (orientation: portrait) {
  .handHeldDevice .top-banner-actions .action-group-new {
    transform: scale(0.8);
  }
}

/* 18 版（迅游）phone 竖屏按设计稿「游戏空间」234:5257 还原的四组值：

   1) 游戏总时长画布 314×61（设计稿 737:10891，比旧稿 264×52 放大一档）。原来这块被
      拉成 100% 宽 × 116 高，顶框左斜边会伸到 AI 游戏伙伴圆球底下把它压住；还原后
      不再压框。
      ⚠️ 元素占位高度仍是 116，底图只画在上方 —— 占位改小会把入口行和底部游戏
      图标列一起顶上去。
   2) 顶栏浮层左右各 16：设计稿顶栏容器 234:5526 在 x=16、宽 376，
      设备管控与天天领好礼距屏幕两边都是 16（原来共用基类的 20）。
   3) 入口行左右各 16、卡片宽 182：设计稿 234:5580 与 500:15278 都是 182 宽、
      左边 9 右边 16；这里统一取 16，卡片同步收到 182（原来 192）。
   4) 入口行到游戏图标列的留白分配见 GameCarousel.vue 里
      `.PhoneDevice .game-snap-carousel.is-xunyou .top-banner`：margin-bottom 34
      + 那边 padding-bottom 68 = 102，底部图标列比 17 版高 48，游戏卡片在这段
      空隙里居中。

   只作用于 18 版竖屏；17 版与 pad 保持原样。 */
@media (orientation: portrait) {
  .PhoneDevice .top-banner-actions.xunyou-layout {
    margin-bottom: 34px;

    .top-float-row {
      padding-left: 16px;
      padding-right: 16px;
    }

    .action-group-new {
      padding: 0 16px;
      /* 基类 gap 是 20，412 宽下 16+182+20+182+16 会顶破；收到 16 后
         412 正好占满，更宽的屏由 space-between 撑开 */
      gap: 16px;

      .global-connect-btn-new {
        width: 182px;
      }

      /* 会员卡靠 --xunyou-card-scale 等比缩放，1 就是设计稿的 182×52 */
      .xunyou-member-card-slot {
        --xunyou-card-scale: 1;
      }
    }

    .game-time {
      width: 314px;
      /* 高度与上面 `.PhoneDevice .game-time` 同值，是刻意再写一遍的护栏：
         18 版整条竖向布局（入口行、游戏卡片、底部图标列）都挂在这个高度上，
         而那条是 17 版共用的规则，不该让 18 版的定位跟着它变。 */
      height: 116px;
      /* 边框换成设计稿导出的 SVG（造型不变，新稿 737:10891 只是把画布从 264×52
         放大到 314×61；同一素材拉伸后形状吻合，无需重新导出）。贴块顶画。 */
      background-image: url('./image/game-time-border-phone.svg');
      background-size: 314px 61px;
      background-position: 0 0;
      background-repeat: no-repeat;

      .number-class {
        /* 数字块底边（含标签）停在距元素顶 45，对齐新设计稿 314×61 里标签底 y≈42 */
        bottom: 71px;
        /* 基类是 32px，这层 strut 会把数字顶高一截；跟着数字字号一起给 18 */
        font-size: 18px;

        .number {
          font-size: 18px;
        }

        .text {
          font-size: 12px;
        }
      }
    }
  }
}
</style>

<template>
  <div
    class="welfare-center"
    :class="[
      isLandscape ? 'is-landscape' : 'is-portrait',
      $isPhoneDevice ? 'is-phone' : ($isPadDevice ? 'is-pad' : 'is-pc'),
      view === 'prizes' || view === 'rules' ? 'is-prizes-view' : '',
      !revealHome ? 'is-popup-entry' : ''
    ]">
    <!--
      范围说明：福利中心后续会有多模块；当前只实现「每日福利」
      （今日领取 / 下期预约 / 热门活动入口展示）。
    -->
    <!-- 天天领好礼等入口：先只进弹窗，关掉后再露首页，避免「先闪中心再弹窗」 -->
    <template v-if="revealHome">
      <div v-if="view === 'home'" class="welfare-center__bg" aria-hidden="true">
        <HeroBanner :landscape="isLandscape" />
      </div>
      <header v-if="view === 'prizes'" class="welfare-center__bar welfare-center__bar--prizes">
        <button type="button" class="welfare-center__back" aria-label="返回" @click="goBack">
          <img :src="backIcon" alt="" />
        </button>
        <h1 class="welfare-center__title">我的福利</h1>
        <span class="welfare-center__bar-spacer" aria-hidden="true" />
      </header>
      <header v-else-if="view === 'rules'" class="welfare-center__bar welfare-center__bar--prizes welfare-center__bar--rules">
        <button type="button" class="welfare-center__back" aria-label="返回" @click="goBack">
          <img :src="backIcon" alt="" />
        </button>
        <h1 class="welfare-center__title">规则</h1>
        <span class="welfare-center__bar-spacer" aria-hidden="true" />
      </header>
      <header v-else class="welfare-center__bar">
        <button type="button" class="welfare-center__back" aria-label="返回" @click="goBack">
          <img :src="backIcon" alt="" />
        </button>
        <div class="welfare-center__actions">
          <button type="button" class="welfare-center__action welfare-center__rules" @click="onRules">规则</button>
          <span class="welfare-center__action-divider" aria-hidden="true">|</span>
          <button type="button" class="welfare-center__action" @click="openPrizes">我的福利</button>
        </div>
      </header>

      <WelfareStreakDemo
        v-if="streakDemoEnabled && view === 'home'"
        :today-claim-version="todayClaimVersion" />
      <div v-if="view === 'prizes'" class="welfare-center__prizes">
        <MyPrizeList :landscape="isLandscape" @detail="openDetail" />
      </div>
      <div v-else-if="view === 'rules'" class="welfare-center__prizes">
        <WelfareRules />
      </div>
      <div v-else ref="welfareLayout" class="welfare-center__layout">
        <HeroSection
          class="welfare-center__hero"
          :list="todayList"
          :daily-receive-limit="todayActivity?.dailyReceiveLimit"
          :loading="loadingToday"
          :card-width="welfareCardWidth"
          :landscape="isLandscape"
          :claiming-ids="claimingIds"
          @claim="onClaim"
          @remind="onRemind"
          @view="openDetail" />
        <div class="welfare-center__side">
          <UpcomingGrid
            :list="upcomingList"
            :loading="loadingUpcoming"
            :card-width="welfareCardWidth"
            :start-time="upcomingActivity?.startTime"
            @remind="onRemind" />
          <HotActivity ref="hotActivity" />
        </div>
      </div>
      <div v-if="streakDemoEnabled && view === 'home'" id="welfare-streak-debug" />
    </template>
    <WelfareRecommendPopup
      :visible="showRecommendPopup"
      :list="recommendList"
      :daily-receive-limit="recommendActivity?.dailyReceiveLimit"
      :landscape="isLandscape"
      :phone="$isPhoneDevice"
      :claiming-ids="claimingIds"
      @close="closeRecommendPopup"
      @claim="onRecommendClaim"
      @view="onRecommendView" />
    <WelfareClaimSuccessPopup
      :visible="showClaimSuccessPopup"
      :item="claimSuccessItem"
      :reward-type="claimSuccessItem?.rewardType || 'standard'"
      :accelerator-days="claimSuccessItem?.acceleratorDays || 0"
      :bonus-days="claimSuccessItem?.bonusDays || 0"
      :next-reward="claimSuccessItem?.nextReward || null"
      :landscape="isLandscape"
      @close="closeClaimSuccessPopup"
      @closed="advanceStreakAfterReturn"
      @view-prizes="onViewPrizesFromClaimSuccess" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { welfareStreakProgress } from './welfareStreakProgress'
import HeroSection from './components/HeroSection.vue'
import HeroBanner from './components/HeroBanner.vue'
import UpcomingGrid from './components/UpcomingGrid.vue'
import HotActivity from './components/HotActivity.vue'
import MyPrizeList from './components/MyPrizeList.vue'
import WelfareRules from './WelfareRules.vue'
import WelfareRecommendPopup from './components/WelfareRecommendPopup.vue'
import WelfareClaimSuccessPopup from './components/WelfareClaimSuccessPopup.vue'
import {
  getTodayWelfare,
  getUpcomingWelfare,
  getRecommendWelfare,
  getPrizeList,
  receiveWelfare,
  reserveWelfare
} from '@/api/welfare'
import {
  SELF_TEST_CALENDAR_REMINDER,
  SELF_TEST_RESERVE_ALWAYS,
  SELF_TEST_RECOMMEND_POPUP_ALWAYS
} from './welfareSelfTest'
import { ensureWelfareLogin } from './welfareAuth'
import backIcon from './image/icon-back.svg'
import { installWelfareClusterBack, uninstallWelfareClusterBack } from '@/utils/welfareClusterBack'
import {
  resolveEntryTypeFromRoute,
  reportWelfarePv,
  reportWelfareClick,
  reportWelfareFail,
  benefitsDetail,
  todayBtnStatus,
  claimErrorType,
  loadErrorType,
  getLid
} from '@/utils/welfareTrack'

/** 连领模块 Demo：开发环境独立加载，生产环境不使用模拟数据。 */
const WelfareStreakDemo = import.meta.env.DEV
  ? defineAsyncComponent(() => import('./components/WelfareStreakDemo.vue'))
  : null

const TODAY_PREVIEW = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('welfarePreview') === '1'

/** 推荐弹窗入口：与天天领好礼同一套 */
const RECOMMEND_ENTRY_FROM = new Set(['gift', 'shortcut', 'push', 'widget', 'calendar'])
/** 记下「今天弹过」的自然日；当天 23:59 前不再弹，过 0 点换日后可再弹 */
const RECOMMEND_POPUP_DAY_KEY = 'lz_welfare_recommend_popup_day'

function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function hasShownRecommendPopupToday() {
  try {
    return localStorage.getItem(RECOMMEND_POPUP_DAY_KEY) === localDateKey()
  } catch (e) {
    return false
  }
}

function markRecommendPopupShownToday() {
  try {
    localStorage.setItem(RECOMMEND_POPUP_DAY_KEY, localDateKey())
  } catch (e) {
    /* 隐私模式等写失败：本次仍可弹，不阻塞主流程 */
  }
}

/** 指定入口 + 当天未真正弹过 → 去拉推荐列表，有数据再弹 */
function shouldTryRecommendPopup(route) {
  if (!route || route.query.tab === 'prizes' || route.query.tab === 'rules') return false
  if (!RECOMMEND_ENTRY_FROM.has(String(route.query.from || ''))) return false
  if (SELF_TEST_RECOMMEND_POPUP_ALWAYS) return true
  return !hasShownRecommendPopupToday()
}

export default {
  name: 'WelfareCenter',
  components: {
    HeroSection,
    WelfareStreakDemo,
    HeroBanner,
    UpcomingGrid,
    HotActivity,
    MyPrizeList,
    WelfareRules,
    WelfareRecommendPopup,
    WelfareClaimSuccessPopup
  },
  data() {
    const tryPopup = shouldTryRecommendPopup(this.$route)
    const entryType = resolveEntryTypeFromRoute(this.$route)
    return {
      backIcon,
      streakDemoEnabled: import.meta.env.DEV,
      todayClaimVersion: welfareStreakProgress.version,
      pendingStreakAdvance: welfareStreakProgress.pending,
      streakClaimDay: welfareStreakProgress.claimDay,
      isLandscape: false,
      loadingToday: false,
      loadingUpcoming: false,
      todayActivity: null,
      upcomingActivity: null,
      recommendActivity: null,
      todayList: [],
      upcomingList: [],
      /** 进页瞬间记下入口，strip from 后仍可用于 pageShow */
      entryType,
      reportedPageShow: false,
      /** 指定入口且当天未弹过：先拉推荐，有数据再弹 */
      pendingRecommendPopup: tryPopup,
      /** 方案A：首页始终渲染，弹窗蒙层靠 backdrop-filter 模糊背后首页内容 */
      revealHome: true,
      /** 必须等推荐列表有数据才为 true，空列表不弹 */
      showRecommendPopup: false,
      recommendList: [],
      homeBootstrapped: false,
      /** 领取成功确认弹窗（稿 143:3754 竖 / 143:4060 横） */
      showClaimSuccessPopup: false,
      claimSuccessItem: null,
      /** 领取进行中：同一 activityItemId 未回来前不打点、不发第二次请求 */
      claimingIds: {},
      todayNetFail: false,
      upcomingNetFail: false,
      todayDisplayFail: false,
      upcomingDisplayFail: false,
      reportedCenterLoadState: false,
      reportedDisplayFail: {},
      welfareCardWidth: 120,
      welfareLayoutObserver: null,
      todayRequestId: 0,
      upcomingRequestId: 0
    }
  },
  errorCaptured(err) {
    this.reportDisplayLoadFail(err)
    return false
  },
  computed: {
    view() {
      const tab = this.$route.query.tab
      if (tab === 'prizes') return 'prizes'
      if (tab === 'rules') return 'rules'
      return 'home'
    },
  },
  watch: {
    view(value) {
      if (value === 'home') this.$nextTick(() => this.advanceStreakAfterReturn())
    },
    '$route.query._t'() {
      this.fetchToday()
      this.fetchUpcoming()
      this.$refs.hotActivity?.reload()
    },
    todayList() {
      this.updateWelfareCardWidth()
    },
    upcomingList() {
      this.updateWelfareCardWidth()
    },
    view(v) {
      if (v !== 'home') return
      this.$nextTick(this.observeWelfareLayout)
      if (this.revealHome) this.reportCenterPageShow()
    },
    revealHome(v) {
      if (v && this.view === 'home') this.reportCenterPageShow()
    }
  },
  mounted() {
    document.documentElement.classList.add('lz-welfare-page')
    this.$emit('headerStatus', false)
    this.syncOrientation()
    window.addEventListener('resize', this.syncOrientation)
    window.addEventListener('orientationchange', this.syncOrientation)
    this.$nextTick(this.observeWelfareLayout)
    this.notifyHideTab()
    installWelfareClusterBack({
      closePopup: () => {
        if (!this.showRecommendPopup) return false
        this.closeRecommendPopup()
        return true
      },
      isClusterSubPage: () => this.view === 'prizes' || this.view === 'rules',
      vueBack: () => this.$router.back()
    })
    if (this.pendingRecommendPopup) {
      this.loadRecommendForEntryPopup()
      this.bootstrapHome()
    } else {
      if (this.isRecommendEntry()) this.stripRecommendEntryQuery()
      this.bootstrapHome()
      if (this.view === 'home') this.reportCenterPageShow()
    }
  },
  beforeUnmount() {
    document.documentElement.classList.remove('lz-welfare-page')
    uninstallWelfareClusterBack()
    window.removeEventListener('resize', this.syncOrientation)
    window.removeEventListener('orientationchange', this.syncOrientation)
    this.welfareLayoutObserver?.disconnect()
  },
  methods: {
    observeWelfareLayout() {
      const layout = this.$refs.welfareLayout
      if (!layout) return
      this.welfareLayoutObserver?.disconnect()
      this.updateWelfareCardWidth()
      if (typeof ResizeObserver === 'undefined') return
      this.welfareLayoutObserver = new ResizeObserver(() => this.updateWelfareCardWidth())
      this.welfareLayoutObserver.observe(layout)
    },
    updateWelfareCardWidth() {
      const layout = this.$refs.welfareLayout
      if (!layout) return
      const style = window.getComputedStyle(layout)
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      const contentWidth = layout.clientWidth - horizontalPadding
      const available = Math.max(120, contentWidth - 32)
      const maxColumns = Math.max(1, Math.floor((available + 8) / 128))
      const listColumns = [this.todayList.length, this.upcomingList.length]
        .filter((count) => count > 0)
        .map((count) => Math.min(maxColumns, count))
      // 若后续需按数量分别计算：今日数量 <= 即将开始时两块各自计算；
      // 今日数量 > 即将开始时，即将开始复用今日福利的卡片宽度。
      const columns = listColumns.length ? Math.max(...listColumns) : maxColumns
      this.welfareCardWidth = Math.min(200, (available - (columns - 1) * 8) / columns)
    },
    syncOrientation() {
      this.isLandscape = window.matchMedia('(orientation: landscape)').matches
        || window.innerWidth > window.innerHeight
    },
    notifyHideTab() {
      if (!window.LegionZoneMobile?.nativeCall) return
      window.LegionZoneMobile
        .nativeCall('LegionZone', 'notifyH5Route', {
          path: this.$route.fullPath || this.$route.path,
          hideMainTab: true
        })
        .catch(() => {})
    },
    isRecommendEntry() {
      return RECOMMEND_ENTRY_FROM.has(String(this.$route.query.from || ''))
    },
    async bootstrapHome() {
      this.revealHome = true
      if (this.homeBootstrapped) return
      this.homeBootstrapped = true
      await Promise.all([this.fetchToday(), this.fetchUpcoming()])
      this.reportCenterPageLoadState()
    },
    reportCenterPageLoadState() {
      if (this.reportedCenterLoadState) return
      if (this.todayDisplayFail || this.upcomingDisplayFail) {
        this.reportedCenterLoadState = true
        reportWelfareFail(this, 'LZ_welfareCenterLoadState', { errorType: 'loadFail' })
        return
      }
      if (this.todayList.length || this.upcomingList.length) return
      // 无数据空态不上报；只报网络异常
      if (!(this.todayNetFail || this.upcomingNetFail)) return
      this.reportedCenterLoadState = true
      reportWelfareFail(this, 'LZ_welfareCenterLoadState', { errorType: 'networkError' })
    },
    reportDisplayLoadFail() {
      if (this.showRecommendPopup && this.recommendList.length) {
        this.reportOnceDisplay('popup', 'LZ_welfareRecommendPopupLoadState')
        return
      }
      if (this.view !== 'home') return
      if (this.todayList.length || this.upcomingList.length) {
        this.reportOnceDisplay('center', 'LZ_welfareCenterLoadState')
      }
    },
    reportOnceDisplay(key, action) {
      if (this.reportedDisplayFail[key]) return
      this.reportedDisplayFail = { ...this.reportedDisplayFail, [key]: true }
      reportWelfareFail(this, action, { errorType: 'loadFail' })
    },
    applyShelfItems(activity) {
      const raw = activity?.items
      if (raw == null) return []
      if (!Array.isArray(raw)) {
        throw new Error('welfare items invalid')
      }
      return raw.map((item) => ({
        ...item,
        receiveStatus: Number(item?.receiveStatus) || 0
      }))
    },
    reportCenterPageShow() {
      if (this.reportedPageShow || this.view !== 'home' || !this.revealHome) return
      this.reportedPageShow = true
      const params = {}
      if (this.entryType) params.entryType = this.entryType
      reportWelfarePv(this, 'LZ_welfareCenterPageShow', params)
    },
    /** 拉推荐列表：有 items 才弹并记当天已弹（至 23:59）；无数据/失败不弹、不占额度 */
    async loadRecommendForEntryPopup() {
      this.stripRecommendEntryQuery()
      try {
        const activity = await getRecommendWelfare()
        this.recommendActivity = activity || null
        try {
          this.recommendList = this.applyShelfItems(activity)
        } catch (displayErr) {
          this.recommendList = []
          reportWelfareFail(this, 'LZ_welfareRecommendPopupLoadState', {
            errorType: loadErrorType(displayErr, false, true)
          })
          this.skipRecommendPopup()
          return
        }
        if (!this.recommendList.length) {
          this.skipRecommendPopup()
          return
        }
        markRecommendPopupShownToday()
        this.showRecommendPopup = true
        const ids = this.recommendList.map((i) => i.activityItemId || i.resourceId).join('_')
        const names = this.recommendList.map((i) => i.name || i.resourceName || '').join('_')
        const statuses = this.recommendList.map((i) => todayBtnStatus(i)).join('_')
        reportWelfarePv(this, 'LZ_welfareCenterRecommendPopupShow', {
          detail: JSON.stringify({
            benefitsID: ids,
            benefitsName: names,
            lid: getLid(this),
            btnStatus: statuses
          })
        })
      } catch (e) {
        this.recommendActivity = null
        this.recommendList = []
        reportWelfareFail(this, 'LZ_welfareRecommendPopupLoadState', {
          errorType: loadErrorType(e, false)
        })
        this.skipRecommendPopup()
      }
    },
    skipRecommendPopup() {
      this.showRecommendPopup = false
      this.bootstrapHome()
      this.reportCenterPageShow()
    },
    /** 点关闭 → 进福利中心首页 */
    closeRecommendPopup() {
      this.showRecommendPopup = false
      this.bootstrapHome()
      this.reportCenterPageShow()
    },
    onRecommendView(item) {
      if (!ensureWelfareLogin()) return
      reportWelfareClick(this, 'LZ_welfareMyRewardsEntranceClick', {
        entryType: 'rewcen_recomRec'
      })
      this.showRecommendPopup = false
      this.bootstrapHome()
      this.openDetail(item)
    },
    beginClaimLock(item) {
      const id = item?.activityItemId
      if (id == null || this.claimingIds[id]) return false
      this.claimingIds = { ...this.claimingIds, [id]: true }
      return true
    },
    endClaimLock(item) {
      const id = item?.activityItemId
      if (id == null) return
      const next = { ...this.claimingIds }
      delete next[id]
      this.claimingIds = next
    },
    async onRecommendClaim(item) {
      if (!item) return
      if (!ensureWelfareLogin()) return
      if (!this.beginClaimLock(item)) return
      reportWelfareClick(this, 'LZ_welfareCenterRecommendPopupClaimClick', {
        detail: benefitsDetail(item, {}, this)
      })
      try {
        const recordId = await receiveWelfare({ activityItemId: item.activityItemId })
        if (recordId) item.receiveRecordId = recordId
        this.markItemClaimedToday(item)
        this.showRecommendPopup = false
        this.bootstrapHome()
        this.reportCenterPageShow()
        await this.fetchToday()
        this.markItemClaimedToday(item)
        this.openClaimSuccessPopup(item)
      } catch (e) {
        reportWelfareFail(this, 'LZ_welfareClaimFail', {
          detail: benefitsDetail(
            item,
            { source: 'popup', errorType: claimErrorType(e) },
            this
          )
        })
        this.$errorMessage?.(e?.message || '领取失败')
      } finally {
        this.endClaimLock(item)
      }
    },
    openClaimSuccessPopup(item, advanceStreak = false) {
      this.pendingStreakAdvance = advanceStreak
      welfareStreakProgress.pending = advanceStreak
      this.claimSuccessItem = item
        ? { ...item, receiveStatus: 1 }
        : null
      this.showClaimSuccessPopup = true
    },
    /** 只把刚领的这一条标成已领，其它已领卡的章保持不动 */
    markItemClaimedToday(item) {
      const id = item?.activityItemId
      if (id == null) return
      const sameId = (row) => String(row?.activityItemId) === String(id)
      const mark = (list) =>
        (Array.isArray(list) ? list : []).map((row) =>
          sameId(row) ? { ...row, receiveStatus: 1 } : row
        )
      this.todayList = mark(this.todayList)
      this.recommendList = mark(this.recommendList)
    },
    advanceStreakAfterReturn() {
      if (!this.pendingStreakAdvance || this.showClaimSuccessPopup || this.view !== 'home') return
      this.pendingStreakAdvance = false
      welfareStreakProgress.pending = false
      const day = localDateKey()
      if (this.streakClaimDay === day) return
      this.streakClaimDay = day
      this.todayClaimVersion += 1
      welfareStreakProgress.version = this.todayClaimVersion
      welfareStreakProgress.claimDay = day
    },
    closeClaimSuccessPopup() {
      this.showClaimSuccessPopup = false
      this.claimSuccessItem = null
    },
    onViewPrizesFromClaimSuccess(item) {
      if (import.meta.env.DEV && item?.previewOnly) {
        this.openDetail(item)
        return
      }
      reportWelfareClick(this, 'LZ_welfareMyRewardsEntranceClick', {
        entryType: 'rewcen_recomRec'
      })
      this.closeClaimSuccessPopup()
      this.openDetail(item)
    },
    stripRecommendEntryQuery() {
      if (!this.isRecommendEntry()) return
      const query = { ...this.$route.query }
      delete query.from
      delete query.reportFrom
      this.$router.replace({ path: this.$route.path, query }).catch(() => {})
    },
    goBack() {
      // 「我 → 奖品福利」：列表回「我」
      if (this.view === 'prizes' && this.$route.query.from === 'mine') {
        if (window.LegionZoneMobile?.nativeCall) {
          window.LegionZoneMobile.nativeCall('LegionZone', 'welfareGoBack').catch(() => {})
          return
        }
        this.$router.back()
        return
      }
      // 规则 / 站内我的福利：簇内 Vue 上一页
      if (this.view === 'prizes' || this.view === 'rules') {
        const hasSpaPrev = window.history.state && window.history.state.back != null
        if (hasSpaPrev) {
          this.$router.back()
          return
        }
        this.$router.replace({ path: '/gameCenter/welfareCenter' }).catch(() => {})
        return
      }
      // 福利首页：离开整簇，回第一次进簇前那一页
      if (window.LegionZoneMobile?.nativeCall) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'welfareGoBack').catch(() => {
          this.$router.replace({ path: '/gameCenter/gameSpace' })
        })
        return
      }
      const hasPrev = window.history.state && window.history.state.back != null
      if (hasPrev) this.$router.back()
      else this.$router.replace({ path: '/gameCenter/gameSpace' })
    },
    async fetchToday() {
      const requestId = ++this.todayRequestId
      this.loadingToday = true
      this.todayNetFail = false
      this.todayDisplayFail = false
      try {
        const activity = TODAY_PREVIEW
          ? (await import('./welfarePreview.js')).todayPreview
          : await getTodayWelfare()
        if (requestId !== this.todayRequestId) return
        this.todayActivity = activity || null
        try {
          this.todayList = this.applyShelfItems(activity)
        } catch (e) {
          this.todayList = []
          this.todayDisplayFail = true
        }
      } catch (e) {
        if (requestId !== this.todayRequestId) return
        this.todayList = []
        this.todayNetFail = true
      } finally {
        if (requestId === this.todayRequestId) this.loadingToday = false
      }
    },
    async fetchUpcoming() {
      const requestId = ++this.upcomingRequestId
      this.loadingUpcoming = true
      this.upcomingNetFail = false
      this.upcomingDisplayFail = false
      try {
        const activity = TODAY_PREVIEW
          ? (await import('./welfarePreview.js')).upcomingPreview
          : await getUpcomingWelfare()
        if (requestId !== this.upcomingRequestId) return
        this.upcomingActivity = activity || null
        try {
          this.upcomingList = this.applyShelfItems(activity)
        } catch (e) {
          this.upcomingList = []
          this.upcomingDisplayFail = true
        }
      } catch (e) {
        if (requestId !== this.upcomingRequestId) return
        this.upcomingList = []
        this.upcomingNetFail = true
      } finally {
        if (requestId === this.upcomingRequestId) this.loadingUpcoming = false
      }
    },
    onRules() {
      this.$router.push({ path: '/gameCenter/welfareCenter', query: { tab: 'rules' } })
    },
    openPrizes() {
      if (!ensureWelfareLogin()) return
      reportWelfareClick(this, 'LZ_welfareMyRewardsEntranceClick', {
        entryType: 'rewcen_rewards'
      })
      this.$router.push({ path: '/gameCenter/welfareCenter', query: { tab: 'prizes' } })
    },
    async openDetail(item) {
      if (!item) return
      if (import.meta.env.DEV && item.previewOnly) {
        this.$infoMessage?.('示例奖励，暂未接入真实福利详情')
        return
      }
      // 今日福利接口会在已领取项直接返回领取记录，避免再查询奖品列表。
      let recordId = item.receiveRecordId || item.recordId
      if (!recordId) {
        try {
          const result = await getPrizeList({
            expired: false,
            current: 1,
            size: 20
          })
          const records = Array.isArray(result?.records) ? result.records : []
          const matched = records.find((record) =>
            (item.activityItemId != null
              && String(record.activityItemId) === String(item.activityItemId))
            || (item.resourceId != null
              && String(record.resourceId) === String(item.resourceId))
          )
          recordId = matched?.recordId
        } catch (e) {
          reportWelfareFail(this, 'LZ_welfareDetailLoadState', {
            errorType: loadErrorType(e, false)
          })
          this.$errorMessage?.(e?.message || '福利详情加载失败')
          return
        }
      }
      if (!recordId) {
        this.$errorMessage?.('未找到对应福利记录')
        return
      }
      const query = { recordId, from: 'prizes' }
      // 从「我」进的奖品列表进详情时保留 from=mine，返回链路才能回到「我」
      if (this.$route.query.from === 'mine') {
        query.from = 'mine'
      }
      this.$router.push({
        path: '/gameCenter/welfareDetail',
        query
      })
    },
    async onClaim(item) {
      if (!item) return
      if (import.meta.env.DEV && item.previewOnly) {
        if (Number(item.receiveStatus) === 1) return
        this.markItemClaimedToday(item)
        this.openClaimSuccessPopup(item, true)
        return
      }
      if (!ensureWelfareLogin()) return
      if (!this.beginClaimLock(item)) return
      reportWelfareClick(this, 'LZ_welfareTodayClaimClick', {
        detail: benefitsDetail(item, {}, this)
      })
      try {
        const recordId = await receiveWelfare({ activityItemId: item.activityItemId })
        if (recordId) item.receiveRecordId = recordId
        this.markItemClaimedToday(item)
        this.openClaimSuccessPopup(item, true)
      } catch (e) {
        reportWelfareFail(this, 'LZ_welfareClaimFail', {
          detail: benefitsDetail(
            item,
            { source: 'todaybenefits', errorType: claimErrorType(e) },
            this
          )
        })
        this.$errorMessage?.(e?.message || '领取失败')
      } finally {
        this.endClaimLock(item)
      }
    },
    async onRemind(item) {
      if (import.meta.env.DEV && item?.previewOnly) {
        this.markItemReserved(item)
        this.$infoMessage?.('示例预约已设置')
        return
      }
      if (!ensureWelfareLogin()) return
      reportWelfareClick(this, 'LZ_welfareUpcomingRemindClick', {
        detail: benefitsDetail(item, {}, this)
      })
      try {
        if (SELF_TEST_RESERVE_ALWAYS) {
          // 自测：接口已预约也不挡，保证能反复写日历
          try {
            await reserveWelfare({ activityItemId: item.activityItemId })
          } catch (_) { /* ignore */ }
          this.markItemReserved(item)
          await this.addCalendarReminder(item)
        } else {
          await reserveWelfare({ activityItemId: item.activityItemId })
          // 预约成功即切「已预约」；写日历失败不回滚按钮态
          this.markItemReserved(item)
          try {
            await this.addCalendarReminder(item)
          } catch (calErr) {
            console.warn('[welfare] addCalendarReminder failed', calErr)
          }
        }
        this.$successMessage?.('已设置开抢提醒')
      } catch (e) {
        this.$errorMessage?.(e?.message || '预约失败')
      }
    },
    markItemReserved(item) {
      if (!item) return
      item.reserved = true
      const id = item.activityItemId
      if (id == null) return
      ;[this.upcomingList, this.todayList].forEach((list) => {
        if (!Array.isArray(list)) return
        const hit = list.find((row) => row?.activityItemId === id)
        if (hit) hit.reserved = true
      })
    },
    /**
     * 开抢时刻 = 日期 + 开抢时间。
     * 日期：item.receiveDate / openDate / 活动 startTime
     * 时间：item.receiveStartTime（HH:mm[:ss]）
     */
    resolveClaimOpenAtMs(item) {
      const time = this.parseHms(item?.receiveStartTime)
      const dateRaw =
        item?.receiveDate ||
        item?.openDate ||
        item?.startTime ||
        this.upcomingActivity?.startTime ||
        this.todayActivity?.startTime ||
        ''
      const date = this.parseYmd(dateRaw)

      if (date && time) {
        return new Date(
          date.y,
          date.m - 1,
          date.d,
          time.h,
          time.mi,
          time.s
        ).getTime()
      }

      // 接口已给完整毫秒戳时兜底（需带有效时分，避免只写到 00:00）
      const raw = Number(item?.claimOpenAtMs || item?.receiveStartAtMs || 0)
      if (raw > 0) {
        const ms = String(Math.trunc(raw)).length <= 10 ? raw * 1000 : raw
        const open = new Date(ms)
        if (!Number.isNaN(open.getTime())) {
          if (time && open.getHours() === 0 && open.getMinutes() === 0 && open.getSeconds() === 0) {
            open.setHours(time.h, time.mi, time.s, 0)
          }
          return open.getTime()
        }
      }

      // 仅有时间：落到今天，已过则明天
      if (time) {
        const open = new Date()
        open.setHours(time.h, time.mi, time.s, 0)
        if (open.getTime() <= Date.now()) open.setDate(open.getDate() + 1)
        return open.getTime()
      }
      return 0
    },
    /** 解析 YYYY-MM-DD / YYYY/MM/DD / 完整 datetime / 毫秒戳 → {y,m,d} */
    parseYmd(raw) {
      if (raw == null || raw === '') return null
      if (typeof raw === 'number' || /^\d{10,13}$/.test(String(raw))) {
        const n = Number(raw)
        const ms = String(raw).length <= 10 ? n * 1000 : n
        const d = new Date(ms)
        if (Number.isNaN(d.getTime())) return null
        return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
      }
      const m = String(raw).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (!m) return null
      return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
    },
    /** 解析 HH:mm[:ss] → {h,mi,s} */
    parseHms(raw) {
      const m = String(raw || '').match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
      if (!m) return null
      return { h: Number(m[1]), mi: Number(m[2]), s: Number(m[3] || 0) }
    },
    async addCalendarReminder(item) {
      if (!window.LegionZoneMobile?.nativeCall) return
      let claimOpenAtMs = this.resolveClaimOpenAtMs(item)
      let reminderMinutesBefore = 30
      if (SELF_TEST_CALENDAR_REMINDER) {
        claimOpenAtMs = Date.now() + 60_000
        reminderMinutesBefore = 0
      }
      if (!claimOpenAtMs) {
        throw new Error('开抢时间无效，无法设置提醒')
      }
      const open = new Date(claimOpenAtMs)
      const name = item.name || `福利${item.resourceId}`
      const hh = String(open.getHours()).padStart(2, '0')
      const mm = String(open.getMinutes()).padStart(2, '0')
      const dateLabel = `${open.getFullYear()}/${String(open.getMonth() + 1).padStart(2, '0')}/${String(open.getDate()).padStart(2, '0')}`
      const timeLabel = `${dateLabel} ${hh}:${mm}`
      await window.LegionZoneMobile.nativeCall('LegionZone', 'addWelfareCalendarReminder', {
        welfareId: `${item.resourceId}_${claimOpenAtMs}`,
        title: `【${name}】${timeLabel}开抢，点击开抢！`,
        description: `您在Legion Zone预约的福利「${name}」将于 ${timeLabel} 开抢`,
        claimOpenAtMs,
        reminderMinutesBefore
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-center {
  animation: welfare-page-fade-in 0.2s ease;
  position: relative;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: #121212;
  color: #fff;
  box-sizing: border-box;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
    background: transparent;
  }
  &.is-prizes-view {
    background: #121212;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* 入口先进弹窗：整页只留底色 + 弹层，不露首页内容 */
  &.is-popup-entry {
    overflow: hidden;
  }
}
/* Banner 进入文档流，后续内容从其底部开始，避免主视觉与今日可领重叠。 */
.welfare-center__bg {
  position: relative;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.welfare-center__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 56px;
  padding: 0;
  position: relative;
  z-index: 2;
}
.welfare-center:not(.is-prizes-view) > .welfare-center__bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
.welfare-center__bar--prizes {
  background: #121212;
  .welfare-center__title {
    flex: 1;
    margin: 0;
    color: #f5f5f5;
    font-size: 18px;
    font-weight: 500;
    line-height: 29px;
    text-align: left;
  }
  .welfare-center__bar-spacer {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }
}
/* 稿 328:15338：规则页标题栏加 0.5px 下边线 */
.welfare-center__bar--rules {
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.12);
}
.welfare-center.is-landscape.is-prizes-view {
  .welfare-center__bar--prizes .welfare-center__title {
    text-align: left;
  }
  .welfare-center__prizes {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
  }
}
.welfare-center__back,
.welfare-center__rules {
  width: 56px;
  height: 56px;
  border: 0;
  background: transparent;
  color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welfare-center__back img {
  width: 24px;
  height: 24px;
  display: block;
}
.welfare-center__rules { font-size: 16px; }
.welfare-center__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 56px;
  margin-right: 16px;
}
.welfare-center__actions .welfare-center__action {
  width: auto;
  height: 56px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f5;
  font-size: 16px;
}
.welfare-center__action-divider {
  color: rgba(255, 255, 255, 0.45);
  font-size: 20px;
  line-height: 1;
}
.welfare-center__prizes {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  padding: 0;
  padding-bottom: 0;
}
.welfare-center__layout {
  position: relative;
  z-index: 1;
  isolation: isolate;
}

.welfare-center.is-portrait:not(.is-landscape),
.welfare-center.is-landscape:not(.is-prizes-view) {
  .welfare-center__layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: none;
    margin: 0 auto;
    padding-top: 0;
    box-sizing: border-box;
  }
  .welfare-center__hero {
    width: 100%;
    max-width: none;
    margin-top: 0;
  }
  .welfare-center__side {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    overflow: visible;
    padding-bottom: 40px;
  }
}

/* 横屏：与稿 180:7557 同结构（整页纵向居中），不再左右分栏 */
.welfare-center.is-landscape:not(.is-prizes-view) {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: block;
  .welfare-center__layout {
    max-width: none;
    margin-left: auto;
    margin-right: auto;
    padding: 0 0 24px;
    box-sizing: border-box;
  }
}

/* 竖屏平板：内容居中限宽 */
.welfare-center.is-portrait.is-pad,
.welfare-center.is-portrait.is-pc {
  .welfare-center__layout {
    max-width: none;
    padding-top: 0;
  }
}



@keyframes welfare-page-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

<style lang="scss">
/* 盖过 reset.scss 全局 6px 条；并锁死外层，只让 .welfare-center 滚 */
html.lz-welfare-page,
html.lz-welfare-page body,
html.lz-welfare-page #app,
html.lz-welfare-page .App,
html.lz-welfare-page .gamecenter {
  height: 100%;
  overflow: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
html.lz-welfare-page ::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
  background: transparent !important;
}
</style>

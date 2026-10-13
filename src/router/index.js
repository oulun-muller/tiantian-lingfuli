import { createRouter, createWebHashHistory } from 'vue-router'

// ── Shell ──────────────────────────────────────────────────────────────────
const GameCenterShell = () => import('@/views/GameCenter/index.vue')

// ── Home ───────────────────────────────────────────────────────────────────
const GameCenterHome = () => import('@/views/GameCenter/Home/index.vue')

// ── CDK Mall ───────────────────────────────────────────────────────────────
const CDKMallIndex  = () => import('@/views/GameCenter/CDKMall/Home')
const GameCenterDetail = () => import('@/views/GameCenter/CDKMall/Detail/index.vue')
const GameCenterSearch = () => import('@/views/GameCenter/CDKMall/Search/index.vue')
const GameCenterList   = () => import('@/views/GameCenter/CDKMall/List/index.vue')

// ── Game library & tools ───────────────────────────────────────────────────
const RankList     = () => import('@/views/GameCenter/RankList')
const GameLibrary  = () => import('@/views/GameCenter/GameLibrary')
const GameTools    = () => import('@/views/GameCenter/GameTools')
const Magazine     = () => import('@/views/GameCenter/Magazine')

// ── Concern ────────────────────────────────────────────────────────────────
const GameCenterConcern = () => import('@/views/GameCenter/GameCenterConcern')

// ── Activity ───────────────────────────────────────────────────────────────
const Activity     = () => import('@/views/GameCenter/Activity')
const ActivityZone = () => import('@/views/GameCenter/ActivityZoneNew')

// ── Mini game ──────────────────────────────────────────────────────────────
const MiniGame       = () => import('@/views/GameCenter/MiniGame')
const MiniGameIndex  = () => import('@/views/GameCenter/MiniGame/Home')
const MiniGameDetail = () => import('@/views/GameCenter/MiniGame/Detail')

// ── Reserve ────────────────────────────────────────────────────────────────
const ReserveZone = () => import('@/views/GameCenter/ReserveZone')

// ── Welfare Center ──────────────────────────────────────────────────────────
const WelfareCenter = () => import('@/views/GameCenter/WelfareCenter/index.vue')
const WelfareDetail = () => import('@/views/GameCenter/WelfareCenter/WelfareDetail.vue')

// ── My games ───────────────────────────────────────────────────────────────
const MyGames          = () => import('@/views/GameCenter/MyGames')
const MyFollowedGames  = () => import('@/views/GameCenter/MyFollowedGames')
const MyRecordGames    = () => import('@/views/GameCenter/MyRecordGames')
const MyUpdateGames    = () => import('@/views/GameCenter/MyUpdateGames')
const MyGameSpace      = () => import('@/views/mobile/gameSpace/index.vue')
// 迅游加速器购买页（占位，后续按设计稿填实）
const AcceleratorBuy   = () => import('@/views/mobile/acceleratorBuy/index.vue')

// ── Misc ───────────────────────────────────────────────────────────────────
const GuideTour       = () => import('@/views/GameCenter/GuideTour')
const DownloadManager = () => import('@/views/GameCenter/DownloadManager')
const OrderCenter     = () => import('@/views/GameCenter/OrderCenter/index.vue')
const LoginCallback   = () => import('@/views/callback/logincallback.vue')
const PhasePlaceholder = () => import('@/views/PhasePlaceholder.vue')
const HelpLayout = () => import('@/views/Help/HelpLayout.vue')
const HelpCenter = () => import('@/views/Help/index.vue')
const FeedbackForm = () => import('@/views/Help/FeedbackForm/index.vue')
const FeedbackHistory = () => import('@/views/Help/FeedbackHistory/index.vue')
const FeedbackDetail = () => import('@/views/Help/FeedbackDetail/index.vue')

const gameCenterChildren = [
  // ── Home ────────────────────────────────────────────────────────────────
  {
    path: 'index',
    name: 'GameCenterHome',
    component: GameCenterHome
  },

  // ── CDK Mall ────────────────────────────────────────────────────────────
  {
    path: 'cdkMall',
    name: 'GameCenterCDK',
    component: CDKMallIndex
  },
  {
    path: 'detail/:id',
    name: 'GameCenterDetail',
    component: GameCenterDetail
  },
  {
    path: 'search',
    name: 'GameCenterSearch',
    component: GameCenterSearch
  },
  {
    path: 'list',
    name: 'GameCenterList',
    component: GameCenterList
  },

  // ── Game library & tools ─────────────────────────────────────────────────
  {
    path: 'rankList',
    name: 'RankList',
    component: RankList
  },
  {
    path: 'gameLibrary',
    name: 'GameLibrary',
    component: GameLibrary
  },
  {
    path: 'gameTools',
    name: 'GameTools',
    component: GameTools
  },
  {
    path: 'magazine',
    name: 'Magazine',
    component: Magazine
  },

  // ── Concern ──────────────────────────────────────────────────────────────
  {
    path: 'concern',
    name: 'GameCenterConcern',
    component: GameCenterConcern
  },

  // ── Activity ─────────────────────────────────────────────────────────────
  {
    // legacy pad path; online/index is redirected at the top level
    path: 'online',
    name: 'GameCenterOnline',
    component: Activity,
    redirect: { name: 'GameCenterActivity' },
    children: [
      {
        path: 'index',
        name: 'GameCenterActivity',
        component: Activity
      }
    ]
  },
  {
    path: 'activityZone',
    name: 'ActivityZone',
    component: ActivityZone
  },

  // ── Mini game ────────────────────────────────────────────────────────────
  {
    path: 'miniGame',
    name: 'MiniGame',
    component: MiniGame,
    redirect: { name: 'MiniGameIndex' },
    children: [
      {
        path: 'index',
        name: 'MiniGameIndex',
        component: MiniGameIndex
      },
      {
        path: 'detail/:id',
        name: 'MiniGameDetail',
        component: MiniGameDetail
      }
    ]
  },

  // ── Reserve ──────────────────────────────────────────────────────────────
  {
    path: 'reserveZone',
    name: 'ReserveZone',
    component: ReserveZone
  },

  // ── Welfare Center ────────────────────────────────────────────────────────
  {
    path: 'welfareCenter',
    name: 'WelfareCenter',
    component: WelfareCenter
  },
  {
    path: 'welfareDetail',
    name: 'WelfareDetail',
    component: WelfareDetail
  },
  {
    // 与「我的福利」一致：规则也是福利中心同页 tab，旧 path 重定向
    path: 'welfareRules',
    redirect: (to) => ({
      path: '/gameCenter/welfareCenter',
      query: { ...to.query, tab: 'rules' }
    })
  },

  // ── My games ─────────────────────────────────────────────────────────────
  {
    path: 'myGames',
    name: 'MyGames',
    component: MyGames
  },
  {
    path: 'myFollowedGames',
    name: 'MyFollowedGames',
    component: MyFollowedGames
  },
  {
    path: 'myRecordGames',
    name: 'MyRecordGames',
    component: MyRecordGames
  },
  {
    path: 'myUpdateGames',
    name: 'MyUpdateGames',
    component: MyUpdateGames
  },
  {
    path: 'gameSpace',
    name: 'MyGameSpace',
    component: MyGameSpace
  },
  {
    path: 'acceleratorBuy',
    name: 'AcceleratorBuy',
    component: AcceleratorBuy
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  {
    path: 'guideTour',
    name: 'GuideTour',
    component: GuideTour
  },
  {
    path: 'DownloadManager',
    name: 'DownloadManager',
    component: DownloadManager
  },
  {
    path: 'orderCenter',
    name: 'OrderCenter',
    component: OrderCenter
  },
  {
    path: 'help',
    component: HelpLayout,
    redirect: { name: 'HelpCenter' },
    children: [
      { path: 'index', name: 'HelpCenter', component: HelpCenter },
      { path: 'feedback', name: 'FeedbackForm', component: FeedbackForm },
      { path: 'history', name: 'FeedbackHistory', component: FeedbackHistory },
      { path: 'detail/:id', name: 'FeedbackDetail', component: FeedbackDetail }
    ]
  },

  // ── Catch-all ────────────────────────────────────────────────────────────
  {
    path: ':pathMatch(.*)*',
    name: 'GameCenterFallback',
    component: PhasePlaceholder
  }
]

export function createAppRouter() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/logincallback',
        name: 'LoginCallback',
        component: LoginCallback
      },
      {
        path: '/',
        redirect: '/gameCenter/index'
      },
      // legacy qiankun-era deep links used by in-app jumps and old share paths
      {
        path: '/gameCenter',
        component: GameCenterShell,
        redirect: '/gameCenter/index',
        children: gameCenterChildren
      }
    ]
  })

  router.beforeEach((to) => {
    // Normalize legacy micro-frontend paths to the unified Vue3 SPA routes.
    if (to.path.startsWith('/gamecenter/')) {
      const normalized = to.path.replace('/gamecenter/', '/gameCenter/')
      if (normalized !== to.path) {
        return { path: normalized, query: to.query, hash: to.hash }
      }
    }

  })

  let wasWelfareRoute = false
  const isWelfarePath = (path = '') =>
    /welfareCenter|welfareDetail|welfareRules/.test(path)

  router.afterEach((to, from) => {
    const isWelfare = isWelfarePath(to.path)
    // 只在进/出福利时通知壳藏底栏，其它页跳转不打扰
    if (!isWelfare && !wasWelfareRoute) return
    const enteringWelfare = isWelfare && !wasWelfareRoute
    wasWelfareRoute = isWelfare
    const hideMainTab = isWelfare
    // 进福利时把「上一页」带 query 交给壳记住，否则返回活动页会丢 id → activitypages/undefined
    const rememberPath =
      enteringWelfare && from?.fullPath && !isWelfarePath(from.path)
        ? from.fullPath
        : undefined
    const notify = () => {
      if (!window.LegionZoneMobile?.nativeCall) return false
      const payload = {
        // fullPath 含 ?id=，壳侧 path 比对仍会剥 query
        path: to.fullPath || to.path,
        hideMainTab
      }
      if (rememberPath) payload.rememberPath = rememberPath
      window.LegionZoneMobile
        .nativeCall('LegionZone', 'notifyH5Route', payload)
        .catch(() => {})
      return true
    }
    if (notify()) return
    setTimeout(notify, 300)
  })

  return router
}

export default createAppRouter

import { getInstalledMiniGameList } from '@/utils/miniGame'

/**
 * YYB_Notify_LaunchApplet 推送的 obj 结构（关键字段）：
 * {
 *   pkgname: string,          // 包名
 *   actualPkgname: string,    // 实际包名（同 pkgname）
 *   status: string,           // 当前状态（见下方枚举）
 *   percent: string,          // 下载进度，范围 0-1 的字符串，如 "0.068500"
 *   engineProgress: boolean,  // true 表示当前推送是引擎下载进度，非游戏本身
 *   progress_info: {
 *     completed_length: number,
 *     download_speed: number,
 *     percent: number,        // 0-1
 *     total_length: number
 *   }
 * }
 *
 * status 枚举：
 *   INIT         开始下载
 *   active       正在下载
 *   waiting      等待下载
 *   paused       下载暂停
 *   complete     下载完成
 *   removed      下载取消
 *   error        下载失败
 *   BeginParse   开始解析本地APK文件
 *   Parsed       解析本地APK文件成功
 *   ParseError   解析本地APK文件失败
 *   BeginInstall 开始安装
 *   Installing   正在安装
 *   Installed    安装完成
 *   InstallError 安装失败
 */

/**
 * stateMap[pkgName] 数据结构:
 * {
 *   status: 'idle' | 'pending' | 'downloading' | 'installing' | 'installed' | 'failed'
 *   progress: Number,  // 0-100
 *   nativeStatus: string, // 原始 Native status，用于精确埋点（如 'error' / 'InstallError' 等）
 * }
 */
function defaultItem() {
  return { status: 'idle', progress: 0 }
}

// Native status → 内部 status 映射
const NATIVE_STATUS_MAP = {
  'INIT': 'downloading',
  'active': 'downloading',
  'waiting': 'downloading',
  'paused': 'downloading',
  'complete': 'downloading', // 下载完成，等待安装，仍归 downloading
  'removed': 'failed',
  'error': 'failed',
  'BeginParse': 'installing',
  'Parsed': 'installing',
  'ParseError': 'failed',
  'BeginInstall': 'installing',
  'Installing': 'installing',
  'Installed': 'installed',
  'InstallError': 'failed'
}

export default {
  namespaced: true,

  state: () => ({
    stateMap: {},
    cancellingSet: new Set() // 正在执行取消操作的 pkgName 集合
  }),

  mutations: {
    SET_STATE(state, { pkgName, patch }) {
      const prev = state.stateMap[pkgName] || defaultItem()
      const next = { ...prev, ...patch }
      state.stateMap = { ...state.stateMap, [pkgName]: next }
    },
    SET_CANCELLING(state, pkgName) {
      state.cancellingSet = new Set([...state.cancellingSet, pkgName])
    },
    CLEAR_CANCELLING(state, pkgName) {
      const next = new Set(state.cancellingSet)
      next.delete(pkgName)
      state.cancellingSet = next
    },
    // pkgNameList: string[] — getInstalledMiniGameList 返回的包名数组
    BATCH_SET_INSTALLED(state, pkgNameList) {
      const next = { ...state.stateMap }
      pkgNameList.forEach(pkgName => {
        next[pkgName] = { ...(next[pkgName] || defaultItem()), status: 'installed', progress: 100 }
      })
      state.stateMap = next
    }
  },

  actions: {
    /**
     * 在 MiniGame/Home/index.vue created() 中调用一次
     * 1. 同步一次已安装列表（刷新页面兜底）
     * 2. 注册 YYB_Notify_LaunchApplet 监听
     */
    init({ dispatch }) {
      dispatch('syncInstalledList')

      if (this._yybListener) {
        window?.LegionZone?.removeListener(this._yybListener)
      }
      this._yybListener = window?.LegionZone?.addListener(
        'YYB_Notify_LaunchApplet',
        (obj) => {
          console.log('YYB_Notify_LaunchApplet', obj)
          dispatch('handleNotify', obj)
        }
      )
    },

    /**
     * 处理 Native 推送
     * obj.pkgname 为包名，obj.status 为 Native 状态字符串
     * obj.percent 为下载进度字符串（0-1）
     */
    handleNotify({ commit, state, dispatch }, obj) {
      // engineProgress=true 表示当前推送是引擎（运行环境）的下载进度，
      // 与游戏本身无关，直接忽略，避免污染游戏的 stateMap
      if (obj.engineProgress) {
        return
      }

      const pkgName = obj.pkgname || obj.actualPkgname
      if (!pkgName) return

      const nativeStatus = obj.status

      // 取消中：只等 removed 信号到来，其余推送全部忽略
      if (state.cancellingSet.has(pkgName)) {
        if (nativeStatus === 'removed') {
          commit('CLEAR_CANCELLING', pkgName)
          commit('SET_STATE', { pkgName, patch: { status: 'idle', progress: 0, nativeStatus }})
        }
        return
      }
      const internalStatus = NATIVE_STATUS_MAP[nativeStatus]
      if (!internalStatus) return

      // 下载进度：percent 字段是 0-1 的字符串，转换为 0-100 整数
      const progress = nativeStatus === 'active' || nativeStatus === 'INIT'
        ? Math.floor(parseFloat(obj.percent || '0') * 100)
        : undefined

      const patch = { status: internalStatus, nativeStatus }
      if (progress !== undefined) patch.progress = progress

      commit('SET_STATE', { pkgName, patch })

      // 安装完成后调接口核实
      if (nativeStatus === 'Installed') {
        dispatch('syncInstalledList')
      }
    },

    // 查询已安装列表（返回 string[]），批量设为 installed
    async syncInstalledList({ commit }) {
      const res = await getInstalledMiniGameList() // string[]
      if (!res?.length) return
      commit('BATCH_SET_INSTALLED', res)
    },

    // 点击「安装/重试」时，先置为 pending（待下载），等 native 推送到来再变为 downloading
    // 同时清除 cancellingSet，防止上次取消的 removed 未到导致新下载通知被忽略
    startInstall({ commit }, pkgName) {
      commit('CLEAR_CANCELLING', pkgName)
      commit('SET_STATE', { pkgName, patch: { status: 'pending', progress: 0 }})
    },

    // 点击「取消」时，标记取消中并立即重置 UI 状态
    cancelInstall({ commit }, pkgName) {
      commit('SET_CANCELLING', pkgName)
      commit('SET_STATE', { pkgName, patch: { status: 'idle', progress: 0 }})
    }
  }
}

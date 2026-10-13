import { createStore } from 'vuex'
import softwareState from './modules/softwareState'
import softwareStatePad from './modules/softwareStatePad'
import gameDownloadState from './modules/gameDownloadState'
import gameCenter from './modules/gameCenter'
import pageLoading from './modules/pageLoading'
import channelInfo from './modules/channelInfo'
import aiGameRecommend from './modules/aiGameRecommend'
import miniGameInstallState from './modules/miniGameInstallState'
import system from './modules/system'
import user from './modules/user'

export function createAppStore(props = {}) {
  return createStore({
    modules: {
      softwareState,
      softwareStatePad,
      gameDownloadState,
      gameCenter,
      pageLoading,
      channelInfo,
      aiGameRecommend,
      miniGameInstallState,
      system,
      user
    },
    state: {
      ready: !!props.ready,
      user: props.user || { userInfo: null, loginStatus: 'unknown', accelStatus: null, accelState: null },
      system: props.system || {},
      miniGameDeviceInfo: props.miniGameDeviceInfo
    },
    mutations: {
      syncUserInfo(state, { ready, userInfo, loginStatus }) {
        state.ready = !!ready
        if (!state.user) state.user = {}
        if (userInfo !== undefined) state.user.userInfo = userInfo || null
        // 登录态明确标志：'unknown'/'yes'/'no'，由 native 推送同步，供首屏判定避免闪烁
        if (loginStatus !== undefined) state.user.loginStatus = loginStatus
      },
      syncAccelStatus(state, payload) {
        if (!state.user) state.user = {}
        state.user.accelStatus = payload || null
      },
      syncAccelState(state, payload) {
        if (!state.user) state.user = {}
        state.user.accelState = payload || null
      }
    },
    actions: {
      syncUserInfo({ commit }, propsIn) {
        commit('syncUserInfo', {
          ready: propsIn.ready,
          userInfo: propsIn.user?.userInfo,
          loginStatus: propsIn.user?.loginStatus
        })
      },
      // 同步登录态标志（供 native login_status 监听单独调用，不依赖 userInfo 是否就绪）
      syncLoginStatus({ commit }, { loginStatus, ready = true } = {}) {
        commit('syncUserInfo', { ready, loginStatus })
      },
      // 同步迅游加速权益状态（native accel_status 监听调用）
      syncAccelStatus({ commit }, payload) {
        commit('syncAccelStatus', payload)
      },
      // 同步迅游加速状态（native accel_state 监听调用）
      syncAccelState({ commit }, payload) {
        commit('syncAccelState', payload)
      }
    }
  })
}

export default createAppStore

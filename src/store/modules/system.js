import { getSystemInfo } from '@/bridge/legionZoneMobile'

function parseMaybeBase64Json(res) {
  if (!res) return null
  if (typeof res === 'object') return res
  try {
    return JSON.parse(res)
  } catch (e) {
    try {
      const bytes = Uint8Array.from(atob(res), c => c.charCodeAt(0))
      return JSON.parse(new TextDecoder('utf-8').decode(bytes))
    } catch (err) {
      return null
    }
  }
}

const system = {
  namespaced: true,
  state: {
    version: '',
    Channel: '',
    mac: '',
    uuid: '',
    activeTime: '',
    MTMInfo: {},
    oldStoreVersion: null
  },
  mutations: {
    mergeSystemInfo(state, payload = {}) {
      state.version = payload.version || state.version
      state.Channel = payload.Channel || state.Channel
      state.mac = payload.mac || state.mac
      state.uuid = payload.uuid || state.uuid
      state.MTMInfo = Object.assign({}, state.MTMInfo, {
        MachineName: payload.sn || state.MTMInfo.MachineName || '',
        ReadableMachineName: payload.legionModel || state.MTMInfo.ReadableMachineName || '',
        OS: payload.osVersion || state.MTMInfo.OS || '',
        OSBit: payload.OSBit || payload.osBits || state.MTMInfo.OSBit || ''
      })
    },
    setSystemInfo(state, payload) {
      state.version = payload.version || '1.0.0.0'
      state.Channel = payload.Channel || ''
      state.mac = payload.mac || ''
      state.uuid = payload.uuid || ''
      state.activeTime = payload.activeTime || ''
      state.MTMInfo.ReadableMachineName = payload.legionModel || ''
      state.MTMInfo.OS = payload.osVersion || ''
      state.MTMInfo.OSBit = payload.OSBit || ''
      state.MTMInfo.MachineName = payload.sn || ''
      state.oldStoreVersion = payload.oldStoreVersion || false
    }
  },
  actions: {
    setSystemInfo({ commit, rootState }) {
      return getSystemInfo()
        .then(res => {
          const obj = parseMaybeBase64Json(res)
          if (!obj) throw new Error('getSystemInfo failed')
          commit('setSystemInfo', obj)
          // mirror version onto root system for legacy readers
          if (rootState.system) {
            rootState.system.version = obj.version || rootState.system.version
          }
          return obj
        })
        .catch((e) => {
          console.error('[system] getSystemInfo failed:', e)
          return null
        })
    }
  }
}

export default system

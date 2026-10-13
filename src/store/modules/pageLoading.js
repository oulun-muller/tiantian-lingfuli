const pageLoading = {
  state: {
    status: true,
    alpha: 1,
    fullScreen: false,
    Drawer: false
  },
  mutations: {
    SET_STATUS: (state, payload = {}) => {
      const next = typeof payload === 'boolean' ? { status: payload } : (payload || {})
      if (typeof next.status === 'boolean') state.status = next.status
      if (next.alpha !== undefined) state.alpha = next.alpha
      if (next.fullScreen !== undefined) state.fullScreen = next.fullScreen
      if (next.Drawer !== undefined) state.Drawer = next.Drawer
    }
  },
  actions: {
    pageLoaded({ commit }, payload) {
      const _payload = typeof payload === 'boolean' ? { status: payload } : (payload || { status: false })
      commit('SET_STATUS', _payload)
    }
  }
}

export default pageLoading

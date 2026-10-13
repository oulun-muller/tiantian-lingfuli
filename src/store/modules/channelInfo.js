/**
 * @description: 渠道用户信息
 * channelUserInfo: {
 *    Token: '',
      Realm: 'pcassistant.lenovo.com'，
      UserId: '1234567890',
      MAC: "2892000fe614",
      avatar: 'https://gw.alicdn.com/imgextra/i4/O1CN01QJYqhH1J1qKY0qY0J_!!6000000000000-2-tps-200-200.png',
      nickName: 'Lenovo'
 * }
 */
const channelInfo = {
  state: {
    channelUserInfo: null,
    callbackUrl: ''
  },
  mutations: {
    setChannelUser(state, user) {
      state.channelUserInfo = user || null
    },
    setCallbackUrl(state, url) {
      state.callbackUrl = url
    }
  },
  actions: {
    setChannelUser({ commit }, user) {
      commit('setChannelUser', {
        ...user
      })
    },
    setChannelCallbackUrl({ commit }, url) {
      commit('setCallbackUrl', url)
    }
  }
}

export default channelInfo

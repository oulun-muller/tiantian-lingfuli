const user = {
  namespaced: true,
  state: {
    userInfo: null,
    avatar: {},
    // 登录态明确标志：'unknown'（未确定）/ 'yes'（已登录）/ 'no'（未登录）
    // 启动时由同步接口 getLoginStatus 在 Vue 挂载前设好，运行中由 native login_status 推送更新；
    // 供首屏直接判定，避免依赖异步 userInfo 反推导致闪烁
    loginStatus: 'unknown',
    // 迅游加速权益状态：null 未获取/获取中，{errorCode, userState, vipExpireTime} 已获取
    // 由 native accel_status 推送设置；卡片已登录时先显示“权益加载中”，权益回来后替换
    accelStatus: null,
    // 迅游加速状态：null 未加速/未知，{established, packageName} 加速中游戏
    // 由 native accel_state 推送设置；对应游戏卡片“加速启动”按钮据此切到“加速中”/恢复
    accelState: null,
    // 加速信息面板数据：null 无数据，{delayMs, baseMs, boost, loss, delaySeries, baseSeries, ready}
    // 由 native accel_panel 推送设置（加速中每秒一帧），卡片与详情页只读展示
    accelPanel: null
  },
  mutations: {
    SET_USER(state, payload) {
      state.userInfo = payload
    },
    SET_AVATAR(state, payload) {
      state.avatar = payload
    },
    SET_LOGIN_STATUS(state, status) {
      state.loginStatus = status
    },
    SET_ACCEL_STATUS(state, payload) {
      state.accelStatus = payload
    },
    SET_ACCEL_STATE(state, payload) {
      state.accelState = payload
    },
    SET_ACCEL_PANEL(state, payload) {
      state.accelPanel = payload || null
    },
    RECEIVE_LID_TOKEN(state, LIDToken) {
      if (state.userInfo) {
        state.userInfo.Token = LIDToken
      }
    }
  },
  actions: {
    syncUserInfo({ commit, state: { userInfo: _userInfo } }, { obj }) {
      const { userInfo, avatar } = obj || {}
      if (_userInfo && userInfo && _userInfo.UserID === userInfo.UserID) {
        // 同一用户无需重复写 userInfo，但头像可能晚于 userInfo 下发（启动补拉、native 分次推送），
        // 有值时必须补写头像；空值不写，避免旧头像被空对象覆盖。
        const hasAvatar = !!avatar && (typeof avatar === 'string' || Object.keys(avatar).length > 0)
        if (hasAvatar) commit('SET_AVATAR', avatar)
        return
      }
      commit('SET_USER', userInfo || null)
      commit('SET_AVATAR', avatar || {})
    },
    syncLoginStatus({ commit }, { loginStatus } = {}) {
      if (loginStatus !== undefined) commit('SET_LOGIN_STATUS', loginStatus)
    },
    // 同步迅游加速权益状态（native accel_status 推送调用）
    syncAccelStatus({ commit }, payload) {
      commit('SET_ACCEL_STATUS', payload || null)
    },
    // 同步迅游加速状态（native accel_state 推送调用）
    syncAccelState({ commit }, payload) {
      commit('SET_ACCEL_STATE', payload || null)
    },
    // 同步加速信息面板数据（native accel_panel 推送调用）
    syncAccelPanel({ commit }, payload) {
      commit('SET_ACCEL_PANEL', payload || null)
    },
    syncLIDToken({ commit }, LIDToken) {
      commit('RECEIVE_LID_TOKEN', LIDToken)
    }
  }
}

export default user


/**
 * stateMap数据结构
 * @example
 * {
 *   W111472: { // 软件的softID
 *     softID: String, // 软件的softID
 *     softName: String, // 软件名称
 *     bizType: Number, // 当前状态
 *     userReservationStatus: Number, // 用户是否预约
 *     userTestApplyStatus: Number, // 用户是否申请测试
 *     testActivityStatus: Number, // 测试活动信息
 *     testActivityQuestionUrl: String, // 测试活动问题链接
 *     isFollower:Boolean, // 是否关注
 *     isLikes:Boolean, // 是否点赞
 *
 *     softType: Number, // 是否是杂志游戏 1 是；0 否
 *     userPurchasedStatus: Number, // 是否拥有该游戏 1 有； 0 无
 *   },
 *   ...
 * }
 *
 * bizType 当前状态：
 *   0               --普通(默认)
 *   1               --有包预约
 *   2               --无包预约
 *   4               --测试
 *
 * userReservationStatus 用户是否预约
 *   0               -- 未预约
 *   1               -- 已预约
 *
 * userTestApplyStatus 用户是否申请测试
 *   0               -- 未申请测试
 *   1               -- 已申请测试
 *   2               -- 申请通过
 *
 * testActivityStatus 测试活动信息
 *   0               -- 未开始
 *   1               -- 申请测试中
 *   2               -- 已结束
 *
 * testActivityQuestionUrl  测试活动问题链接
 *
 */
const gameReserveState = {
  namespaced: true,
  state: {
    stateMap: {}
  },
  mutations: {
    clearState(state, payload = {}) {
      state.stateMap = {}
    },
    setState(state, payload = {}) {
      const _stateMap = { ...state.stateMap }
      state.stateMap = {
        ..._stateMap,
        ...payload
      }
    }
  },
  actions: {
    setState({ commit }, payload) {
      commit('setState', payload)
    },
    clearState({ commit }, payload = {}) {
      commit('clearState')
    }
  },
  getters: {
  }
}
export default gameReserveState

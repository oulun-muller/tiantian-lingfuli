const gameCenter = {
  state: {
    labelList: [
      {
        '特别栏目': ['游戏工具']
      },
      {
        '热门主题': ['开放世界', '剧情丰富', '二次元', '生存', '战争']
      },
      {
        '游戏特性': ['PVP', '局域网', '多人游戏', '单人', '网游']
      },
      {
        '热门玩法': ['动作冒险', '角色扮演', '回合制', '射击', '休闲', '冒险', 'MOBA', '动作类ROGUE', '卡牌', '大逃杀', '模拟', 'ARPG', '棋牌', '策略', '养成']
      }
    ],
    selectTagList: [],
    gameCenterDetailGuide: false
    // myGameCurrentTab: 0
  },
  getters: {
    levelLabel({ labelList }) {
      const _levelLabel = []
      labelList.forEach(o => {
        _levelLabel.push(Object.keys(o).join(','))
      })

      return _levelLabel
    }
  },
  mutations: {
    setSelectTagList(state, payload) {
      state.selectTagList.push(payload)
    },
    upDataCurTags(state, payload) {
      state.selectTagList = state.selectTagList.filter(o => o !== payload)
    },
    cleanup(state) {
      state.selectTagList = []
    },
    gameCenterDetailGuide(state, payload) {
      state.gameCenterDetailGuide = payload
    }
    // setMyGameCurrentTab(state, payload) {
    //   state.myGameCurrentTab = payload
    // }
  },
  actions: {
    setSelectTagList({ commit }, value) {
      commit('setSelectTagList', value)
    },
    upDataCurTags({ commit }, value) {
      commit('upDataCurTags', value)
    },
    cleanup({ commit }) {
      commit('cleanup')
    },
    setGameCenterDetailGuide({ commit }, value) {
      const GameCenterDetailGuide = localStorage.getItem('GAME_CENTER_DETAIL_TIPS_GUIDE')

      if (!value) {
        if (GameCenterDetailGuide !== null) return

        localStorage.setItem('GAME_CENTER_DETAIL_TIPS_GUIDE', '1')
      }

      commit('gameCenterDetailGuide', value)
    }
    // setMyGameCurrentTab({ commit }, value) {
    //   commit('setMyGameCurrentTab', value)
    // }
  },
  namespaced: true
}
export default gameCenter

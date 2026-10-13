import { StoreDoAction } from '@/nativeApi/LZProxy'
import { getAIRecommendGameList } from '@/api/cdkMall'

import { convertCDKInfo } from '@/api/common.js'

const GAME_CACHE_EXPIRE = 30 * 60 * 1000 // 缓存有效期：30分钟

const aiGameRecommend = {
  namespaced: true,
  state: {
    allGames: [], // 原始30条游戏数据
    remainingGames: [], // 剩余可分配游戏
    moduleGameConfigs: {}, // 模块配置数据
    cachedModules: {}, // 缓存各模块已分配的数据：{ moduleId: { data: [], timestamp: 0 } }
    installedGameIds: [], // 客户端已安装游戏ID（需从客户端获取，这里模拟）
    isDataReady: false, // 数据源是否就绪
    isAllocating: false, // 分配锁
    lastFetchTime: 0 // 上次请求接口时间
  },

  mutations: {
    SET_ALL_GAMES(state, games) {
      state.allGames = games
      state.remainingGames = [...games]
      state.lastFetchTime = Date.now()
    },
    SET_MODULE_GAME_CONFIGS(state, configs) {
      state.moduleGameConfigs = configs
    },
    SET_INSTALLED_GAMES(state, gameIds) {
      state.installedGameIds = gameIds
    },
    SET_DATA_READY(state, isReady) {
      state.isDataReady = isReady
    },
    SET_ALLOCATING(state, isAllocating) {
      state.isAllocating = isAllocating
    },
    CACHE_MODULE_DATA(state, { moduleId, data }) {
      state.cachedModules[moduleId] = {
        data,
        timestamp: Date.now()
      }
    },
    REMOVE_ALLOCATED_DATA(state, allocatedData) {
      state.remainingGames = state.remainingGames.filter(
        (game) => !allocatedData.includes(game)
      )
    }
  },

  actions: {
    // 1. 初始化：优先用缓存，超时则请求接口
    async initData({ state, commit, dispatch, rootState }) {
      if (state.isDataReady) return

      // 检查缓存是否有效
      const now = Date.now()
      if (
        now - state.lastFetchTime < GAME_CACHE_EXPIRE &&
        state.allGames.length
      ) {
        commit('SET_DATA_READY', true)
        return
      }
      console.log('请求新接口了')

      // 缓存超时，请求接口（模拟接口返回）
      try {
        const deviceUuid = rootState.system.uuid
        const res = await getAIRecommendGameList(deviceUuid) // 替换为真实接口
        console.log('res请求ai游戏', res)

        let allGames = res?.softDatas?.map((item) => {
          const softInfo = convertCDKInfo(item.softInfo)
          softInfo.isAiGame = true
          return softInfo
        }) || []
        const configs = res?.strategy
        if (configs) {
          if (configs.filterInstallGame) {
            const idList = allGames.map((item) => {
              return {
                SoftID: item.softId
              }
            })
            await dispatch('setInstalledGames', { idList })
            allGames = allGames.filter(
              (item) => !state.installedGameIds.includes(item.softId)
            )
          }
        }

        commit('SET_ALL_GAMES', allGames)
        commit('SET_MODULE_GAME_CONFIGS', configs)
        commit('SET_DATA_READY', true)
      } catch (err) {
        console.error('接口请求失败：', err)
      }
    },

    // 2. 客户端传递已安装游戏ID
    async setInstalledGames({ commit }, { idList }) {
      const res = await StoreDoAction('NEWPLUGIN_LEAPPTRANS_GETINSTALL', {
        SoftIDs: idList
      })
      const InstallList =
        res?.result?.map((item) => {
          if (item.isInstalled) {
            return item.softID
          }
        }) || []
      commit('SET_INSTALLED_GAMES', InstallList)
    },

    // 3. 模块请求数据（核心逻辑）
    async requestModuleData({ state, commit, dispatch }, { moduleId }) {
      // 确保数据源就绪
      //  await dispatch('initData')
      if (!state.isDataReady) return []

      if (!state.allGames.length) return []

      // 检查缓存：模块数据是否存在且未过期
      const cachedModule = state.cachedModules[moduleId]
      // if (cachedModule && Date.now() - cachedModule.timestamp < GAME_CACHE_EXPIRE) {
      //   return cachedModule.data
      // }
      if (cachedModule) {
        return cachedModule.data
      }
      if (!state.remainingGames.length) {
        return []
      }
      // 判断请求模块 是否有ai推荐配置
      const gameConfigs = state.moduleGameConfigs?.rankingRuleInfos || []
      const { maxInsert = 0 } =
        gameConfigs.find((item) => item.id === +moduleId) || {}
      if (!maxInsert) {
        return []
      }

      // 加锁，防止并发
      while (state.isAllocating) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      commit('SET_ALLOCATING', true)

      try {
        // 过滤已安装游戏
        // const filteredGames = state.remainingGames.filter(
        //   game => !state.installedGameIds.includes(game.id)
        // )

        // 检查模块匹配（模拟：假设moduleConfig有type字段，需与游戏type匹配）
        // const matchedGames = state.remainingGames.filter(
        //   game => game.id === moduleConfig.type
        // )

        // 分配数据（取前maxInsert条）
        const actualCount = Math.min(maxInsert, state.remainingGames.length)
        const allocatedData = state.remainingGames.slice(0, actualCount)

        // 缓存模块数据
        commit('CACHE_MODULE_DATA', { moduleId, data: allocatedData })

        // 从剩余数据中删除
        commit('REMOVE_ALLOCATED_DATA', allocatedData)

        return allocatedData
      } finally {
        commit('SET_ALLOCATING', false)
      }
    }
  }
}

export default aiGameRecommend

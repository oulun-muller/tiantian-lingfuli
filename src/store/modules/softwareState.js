import { callLegacy } from '@/compat/legacyGlobals'
import { StoreDoAction } from '@/nativeApi/LZProxy'
import { Message } from 'element-ui'

let checkList = []

/**
 * stateMap数据结构
 * @example
 * {
 *   W111472: { // 软件的softID
 *     SoftID: String, // 软件的softID
 *     Version: String, // 软件版本
 *     SoftName: String, // 软件名称
 *     LogoFile: String, // 软件Logo图标
 *     status: String, // 当前状态
 *     locking: Boolean, // 状态变化锁，用户动作到状态通知到达期间需要锁定，防止重复的用户动作，导致SDK状态混乱
 *     eCode: Number, // 下载错误码
 *     dlspeed: Number, // 当前下载速度 byte/s
 *     progress: Number, // 下载进度 %
 *     mainExePath: String // 已安装应用的主程序
 *
 *     SoftType: 1, // 代表杂志
 *     FromVersion: '2.0.1', // 更新FromVersion要代上值 ， 如果首次安装FromVersion为空
 *     TargetVersion: '3.0.1' // 无论更新还是首次安装都要带上，带表安装或升级软件的版本
 *     ZipSize: 10320000 // 整包or更新包大小
 *     IsGAHaveUpdate: 0  // 0不用更新 ；1 待更新
 *   },
 *   ...
 * }
 *
 * status当前状态：
 *   ''               -- 默认状态
 *   'wait'           -- 等待中
 *   'dl'             -- 下载中
 *   'pause'          -- 暂停中
 *   'err'            -- 错误
 *   'i'              -- 安装中
 *   'installed'      -- 已安装
 */
const softwareState = {
  namespaced: true,
  state: {
    stateMap: {}
  },
  getters: {
    taskList({ stateMap }, getters, rootState, rootGetters) {
      return Object.keys(stateMap).filter(key => ['wait', 'dl', 'pause', 'err', 'i'].includes(stateMap[key].status)).map(key => stateMap[key])
    }
  },
  mutations: {
    updateStateMap(state, payload = {}) {
      const _stateMap = { ...state.stateMap }
      state.stateMap = {
        ..._stateMap,
        ...payload
      }
    },
    deleteStateMap(state, payload) {
      delete state.stateMap[payload]
    }
  },
  actions: {
    clearGASoft({ commit, state: { stateMap }, rootState: { userInfo }, dispatch }) {
      Object.keys(stateMap).forEach(key => {
        const curState = stateMap[key]
        if (curState.SoftType === 1) {
          commit('deleteStateMap', curState.SoftID)
        }
      })
      if (userInfo?.UserID) {
        setTimeout(() => {
          dispatch('getDLList')
        }, 3000)
      }
    },
    getDLList({ commit }) {
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL', {
        option: 'list',
        dlInfo: ''
      }).then(res => {
        // if (res.code !== 0 || !res.data || !res.data.dl_list || res.data.dl_list.length <= 0) return
        const magazineList = res?.GA?.data?.dl_list || []
        const storeList = res?.STORE.data?.dl_list || []
        const _stateMap = {}
        const allTaskList = [...magazineList, ...storeList]
        if (allTaskList.length <= 0) return
        console.log('初始化获取下载中列表：', storeList)
        allTaskList.forEach(o => {
          if (o.type === 'apk' && o.apk) {
            StoreDoAction('NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL', {
              option: 'cancel',
              dlInfo: JSON.stringify({
                type: 'apk',
                apk: {
                  pkg: o.apk.pkg || '',
                  vc: o.apk.vc || '',
                  vn: o.apk.vn || ''
                }
              })
            }).catch(() => {})
            return
          }

          if (o.type !== 'pc' || !o.pc || !o.pc.SoftID) return

          const _attr = o.attr || {}

          _stateMap[o.pc.SoftID] = {
            SoftID: o.pc.SoftID,
            Version: o.pc.Version || '',
            SoftName: o.pc.SoftName || '',
            LogoFile: o.pc.LogoFile || '',
            status: _attr.status || '',
            locking: false,
            eCode: _attr.eCode || 0,
            dlspeed: _attr.dlspeed || 0,
            progress: Math.round(_attr.progress || 0),
            mainExePath: '',
            SoftType: o.pc.SoftType || 0, // 1代表杂志
            FromVersion: o.pc.FromVersion, // 更新FromVersion要代上值 ， 如果首次安装FromVersion为空
            TargetVersion: o.pc.TargetVersion // 无论更新还是首次安装都要带上，带表安装或升级软件的版本
          }
        })
        commit('updateStateMap', _stateMap)
      }).catch(() => {})
    },
    dlProgressListener({ commit, state: { stateMap }}, content) {
      if (!content || content.type !== 'pc' || !content.pc || !content.pc.SoftID || !content.attr) return

      const _state = stateMap[content.pc.SoftID]
      if (!_state) return

      commit('updateStateMap', {
        [content.pc.SoftID]: {
          ..._state,
          dlspeed: content.attr.dlspeed || 0,
          progress: Math.round(content.attr.progress || 0)
        }
      })
    },
    dlStateChangeListener({
      commit,
      state: { stateMap },
      rootState: { userInfo }
    }, content) {
      if (!content || content.type !== 'pc' || !content.pc || !content.pc.SoftID || !content.attr) return
      if (content.attr.status === 'pre' || (content.attr.status === 'exitq' && content.pc?.IsAutoDL !== 1)) return

      const _state = stateMap[content.pc.SoftID]
      if (!_state) return
      let attrStatus = content.attr.status
      if (content.attr.statFrom === 'installed' && content.attr.status === 'uninstalled') {
        attrStatus = ''
      }
      if (content.attr.statFrom === 'dl' && content.attr.status === 'exitq' && content.pc?.IsAutoDL === 1) {
        attrStatus = ''
      }
      commit('updateStateMap', {
        [content.pc.SoftID]: {
          ..._state,
          status: attrStatus || '',
          locking: false,
          eCode: content.attr.eCode || 0,
          IsGAHaveUpdate: content.attr.IsGAHaveUpdate || 0
        }
      })
    },
    dlEndInstallListener({
      commit,
      state: { stateMap },
      rootState: { userInfo }
    }, content) {
      if (!content || content.type !== 'pc' || !content.pc || !content.pc.SoftID || !content.attr) return
      const _state = stateMap[content.pc.SoftID]
      if (!_state) return

      if (!content.attr.installed) {
        commit('deleteStateMap', content.pc.SoftID)
        return
      }
      const checkSoftID = [{ SoftID: content.pc.SoftID }]
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_ISSOFTINSTALLEDAPPS', {
        calculateSoftSize: false,
        inIsSoftInstalledApps: content.pc.SoftType === 1 ? [] : checkSoftID,
        inIsGASoftInstalledApps: content.pc.SoftType === 1 ? checkSoftID : []
      }).then(res => {
        const storeCheckList = res?.STORE?.outIsSoftInstalledApps || []
        const magazineCheckList = res?.GA?.outIsSoftInstalledApps || []
        const allInstalledApps = [...storeCheckList, ...magazineCheckList]
        if (allInstalledApps.length <= 0) return

        const app = allInstalledApps[0]
        if (!app.SoftID) return
        // 如果是杂志游戏
        if (app.SoftType === 1) {
          // 如果任务中已存在 取当前状态，如果没有则使用默认
          const curState = stateMap[app.SoftID] || {
            SoftID: app.SoftID,
            Version: app.displayVer || '',
            SoftName: '',
            LogoFile: '',
            locking: false,
            eCode: 0,
            dlspeed: 0,
            progress: 0,
            mainExePath: app.mainExePath || ''
          }

          commit('updateStateMap', {
            [app.SoftID]: {
              ...curState,
              status: app.isSoftInstalledApps ? 'installed' : '',
              SoftType: app.SoftType || 0,
              FromVersion: app.FromVersion,
              TargetVersion: app.TargetVersion,
              ZipSize: app.ZipSize || 0,
              IsGAHaveUpdate: app.IsGAHaveUpdate || 0
            }
          })
        } else {
          if (!app.isSoftInstalledApps) {
            commit('deleteStateMap', app.SoftID)
            return
          }

          commit('updateStateMap', {
            [app.SoftID]: {
              SoftID: app.SoftID,
              Version: app.displayVer || '',
              SoftName: '',
              LogoFile: '',
              status: 'installed',
              locking: false,
              eCode: 0,
              dlspeed: 0,
              progress: 0,
              mainExePath: app.mainExePath || ''
            }
          })
        }
      }).catch(() => {})
    },
    init({ dispatch }) {
      dispatch('getDLList')
      if (this.notifyListener) {
        window.LegionZone.removeEventListener(this.notifyListener)
      }
      this.notifyListener = window?.LegionZone?.addListener('Store_Notify', ({ action, data }) => {
        if (action === 'ON_DL_PROGRESS') { // 下载进度
          console.log('ON_DL_PROGRESS 下载进度', data)
          dispatch('dlProgressListener', data)
        } else if (action === 'ON_DL_STATE_CHG') { // 软件状态变化
          console.log('ON_DL_STATE_CHG 软件状态变化', data)
          dispatch('dlStateChangeListener', data)
        } else if (action === 'ON_DL_END_INSTALL') { // 软件安装成功和失败
          console.log('ON_DL_END_INSTALL 软件安装成功和失败', data)
          dispatch('dlEndInstallListener', data)
        } else if (action === 'ON_DL_LAUNCH_FAIL') { // 游戏启动失败
          console.log('ON_DL_LAUNCH_FAIL 游戏启动失败', data)
          if (data?.start_failed?.code === 1) {
            Message({
              message: data?.start_failed?.message || '未找到本地游戏，请安装游戏后重试',
              type: 'warning',
              duration: 2500,
              customClass: 'lg-message--warning'
            })
          }
        } else if (action === 'ON_DL_AUTODL_ADDTASK' && data?.pc?.IsAutoDL === 1) { // 有任务在自动下载
          dispatch('getDLList')
        }
      })
    },
    deleteInstalledApp({ commit, state: { stateMap }}, payload) {
      const _state = stateMap[payload]
      if (!_state || _state.status !== 'installed') return

      commit('deleteStateMap', payload)
    },
    checkInstalled({ commit, state: { stateMap }, dispatch }, payload) {
      const { softId } = payload
      if (!softId || checkList.filter(item => item.softId === softId).length) return

      if (checkList.length <= 0) {
        Promise.resolve().then(() => {
          if (checkList.length <= 0) return

          const _checkList = [...checkList]
          checkList = []
          const _storeIdList = []
          const _gaIdList = []
          _checkList.forEach(item => {
            if (item.softType === 1) {
              _gaIdList.push({ SoftID: item.softId })
            } else {
              _storeIdList.push({ SoftID: item.softId })
            }
          })
          const callBatch = []
          if (_gaIdList.length) {
            callBatch.push(StoreDoAction('NEWPLUGIN_LEAPPTRANS_ISSOFTINSTALLEDAPPS', {
              calculateSoftSize: false,
              inIsSoftInstalledApps: [],
              inIsGASoftInstalledApps: _gaIdList
            }))
          } else {
            callBatch.push(Promise.resolve())
          }
          if (_storeIdList.length) {
            callBatch.push(StoreDoAction('NEWPLUGIN_LEAPPTRANS_GETINSTALL', {
              SoftIDs: _storeIdList
            }))
          } else {
            callBatch.push(Promise.resolve())
          }
          Promise.all(callBatch).then(([res, newRes]) => {
            const newResData = newRes?.result || []
            const _stateMap = {}
            const storeCheckList = newResData // res?.STORE?.outIsSoftInstalledApps || []
            const magazineCheckList = res?.GA?.outIsSoftInstalledApps || []
            const allInstalledApps = [...storeCheckList, ...magazineCheckList]
            if (allInstalledApps.length <= 0) return
            allInstalledApps.forEach(o => {
              if (!o.SoftID && !o.softID) return

              // 如果是杂志游戏
              if (o.SoftType === 1) {
                // 如果任务中已存在 取当前状态，如果没有则使用默认
                const curState = stateMap[o.SoftID] || {
                  SoftID: o.SoftID,
                  Version: o.displayVer || '',
                  SoftName: '',
                  LogoFile: '',
                  locking: false,
                  eCode: 0,
                  dlspeed: 0,
                  progress: 0,
                  mainExePath: o.mainExePath || '',
                  status: o.isSoftInstalledApps ? 'installed' : '',
                  SoftType: o.SoftType || 0,
                  FromVersion: o.FromVersion,
                  TargetVersion: o.TargetVersion,
                  ZipSize: o.ZipSize || 0
                }

                _stateMap[o.SoftID] = {
                  ...curState,
                  IsGAHaveUpdate: o.IsGAHaveUpdate || 0
                }
              } else {
                if (!o.isInstalled) {
                  dispatch('deleteInstalledApp', o.softID)
                  return
                }

                _stateMap[o.softID] = {
                  SoftID: o.softID,
                  Version: o.displayVer || '',
                  SoftName: '',
                  LogoFile: '',
                  status: 'installed',
                  locking: false,
                  eCode: 0,
                  dlspeed: 0,
                  progress: 0,
                  mainExePath: o.mainExe || ''
                }
              }
            })

            commit('updateStateMap', _stateMap)
          }).catch(() => {})
        })
      }

      checkList.push(payload)
    },
    add({ commit, dispatch, state: { stateMap }}, payload = {}) {
      if (!payload.SoftID || !payload.Version || !payload.SoftName) return

      const _state = stateMap[payload.SoftID]
      if (_state && _state.status === 'err') {
        dispatch('retry', payload.SoftID)
        return
      }

      if (_state && _state.status && _state.status !== 'installed') {
        return
      }
      const isUpdate = !!_state?.IsGAHaveUpdate
      commit('updateStateMap', {
        [payload.SoftID]: {
          ..._state,
          SoftID: payload.SoftID,
          Version: payload.Version,
          SoftName: payload.SoftName,
          LogoFile: payload.LogoFile || '',
          status: 'wait',
          locking: false,
          eCode: 0,
          dlspeed: 0,
          progress: 0,
          mainExePath: ''
        }
      })
      callLegacy('$parentUpdateState', {
        softwareStateMap: {
          ...stateMap,
          [payload.SoftID]: {
            ..._state,
            SoftID: payload.SoftID,
            Version: payload.Version,
            SoftName: payload.SoftName,
            LogoFile: payload.LogoFile || '',
            status: 'wait',
            locking: false,
            eCode: 0,
            dlspeed: 0,
            progress: 0,
            mainExePath: ''
          }
        }
      })
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_UPINSTALLEDAPPS', {
        upInstalledApps: [
          {
            SoftID: payload.SoftID,
            Version: payload.Version,
            SoftName: payload.SoftName,
            LogoFile: payload.LogoFile || '',

            SoftType: _state?.SoftType || 0,
            FromVersion: _state?.FromVersion || '',
            TargetVersion: _state?.TargetVersion || '',
            IsGAHaveUpdate: _state?.IsGAHaveUpdate || 0
          }
        ]
      }).then(res => {
        if (!res.result || res.result.length <= 0 || res.result[0].code !== 0) throw JSON.stringify({ code: res.result[0].code, message: res.result[0].msg })

        callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
          detail: JSON.stringify({ ...JSON.parse(payload.drinfo), stateGame: 1, statePage: isUpdate ? 6 : 1 }),
          status: 1
        })
      }).catch((res) => {
        let errObj = {}
        try {
          errObj = JSON.parse(res)
        } catch (e) {
          console.log(e)
        }
        commit('deleteStateMap', payload.SoftID)
        callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
          detail: JSON.stringify({ ...JSON.parse(payload.drinfo), stateGame: 1, statePage: isUpdate ? 6 : 1 }),
          status: 2,
          typeerr: JSON.stringify({
            errortype: errObj.code,
            errormess: errObj.message || JSON.stringify(res)
          })
        })
      })
    },
    cancel({ commit, state: { stateMap }, rootState: { userInfo }, dispatch }, payload) {
      const _state = stateMap[payload]
      if (!_state || !['wait', 'dl', 'pause', 'err'].includes(_state.status)) return
      const curState = _state
      const isUpdate = !!curState?.IsGAHaveUpdate
      commit('deleteStateMap', payload)
      if (curState.SoftType === 1) {
        dispatch('checkInstalled', { softId: curState.SoftID, softType: curState.SoftType })
      } else {
        commit('updateStateMap', {
          [payload]: {
            SoftID: curState.SoftID,
            SoftType: curState.SoftType || 0
          }
        })
        callLegacy('$parentUpdateState', {
          softwareStateMap: {
            ...stateMap,
            [payload]: {
              SoftID: curState.SoftID,
              SoftType: curState.SoftType || 0
            }
          }
        })
      }
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL', {
        option: 'cancel',
        dlInfo: JSON.stringify({
          type: 'pc',
          pc: {
            SoftID: _state.SoftID,
            SoftType: _state.SoftType || 0,
            Version: _state.Version
          }
        })
      }).catch(() => {})

      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 4,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: isUpdate ? 2 : 1
        })
      })
    },
    retry({ commit, state: { stateMap }, rootState: { userInfo }}, payload) {
      const _state = stateMap[payload]
      if (!_state || _state.status !== 'err' || _state.locking) return
      const isUpdate = !!_state?.IsGAHaveUpdate

      commit('updateStateMap', {
        [payload]: {
          ..._state,
          locking: true,
          dlspeed: 0,
          progress: 0
        }
      })
      callLegacy('$parentUpdateState', {
        softwareStateMap: {
          ...stateMap,
          [payload]: {
            ..._state,
            locking: true,
            dlspeed: 0,
            progress: 0
          }
        }
      })
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL', {
        option: 'retry',
        dlInfo: JSON.stringify({
          attr: {
            eCode: _state.eCode
          },
          type: 'pc',
          pc: {
            SoftID: _state.SoftID,
            SoftType: _state.SoftType || 0,
            Version: _state.Version,
            IsGAHaveUpdate: _state.IsGAHaveUpdate || 0
          }
        })
      }).then(res => {
        if (res.code !== 0) throw new Error('retry failed')
      }).catch(() => {
        commit('updateStateMap', {
          [payload]: _state
        })
      })

      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 2,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: isUpdate ? 2 : 1
        })
      })
    },
    pause({ commit, state: { stateMap }, rootState: { userInfo }}, payload) {
      const _state = stateMap[payload]
      if (!_state || _state.status !== 'dl' || _state.locking) return

      const isUpdate = !!_state?.IsGAHaveUpdate
      commit('updateStateMap', {
        [payload]: {
          ..._state,
          locking: true
        }
      })
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL', {
        option: 'pause',
        dlInfo: JSON.stringify({
          type: 'pc',
          pc: {
            SoftID: _state.SoftID,
            SoftType: _state.SoftType || 0,
            Version: _state.Version
          }
        })
      }).then(res => {
        if (res.code !== 0) throw new Error('pause failed')
      }).catch(() => {
        commit('updateStateMap', {
          [payload]: _state
        })
      })

      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 1,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: isUpdate ? 2 : 1
        })
      })
    },
    resume({ commit, state: { stateMap }, rootState: { userInfo }}, payload) {
      const _state = stateMap[payload]
      if (!_state || _state.status !== 'pause' || _state.locking) return
      const isUpdate = !!_state?.IsGAHaveUpdate

      commit('updateStateMap', {
        [payload]: {
          ..._state,
          locking: true
        }
      })
      StoreDoAction('NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL', {
        option: 'resume',
        dlInfo: JSON.stringify({
          type: 'pc',
          pc: {
            SoftID: _state.SoftID,
            SoftType: _state.SoftType || 0,
            Version: _state.Version
          }
        })
      }).then(res => {
        if (res.code !== 0) throw new Error('resume failed')
      }).catch(() => {
        commit('updateStateMap', {
          [payload]: _state
        })
      })

      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 3,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: isUpdate ? 2 : 1
        })
      })
    },
    setState({ commit }, payload) {
      commit('updateStateMap', payload)
    },
    removeListener() {
      if (this.notifyListener) {
        window.LegionZone.removeListener(this.notifyListener)
      }
    }
  }
}

export default softwareState

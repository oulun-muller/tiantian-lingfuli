import { callLegacy } from '@/compat/legacyGlobals'
import { StoreDoAction } from '@/nativeApiPad/download'
import { Message } from 'element-ui'
import Base64 from '@/utils/base64'

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
 *     ZipSize: 10320000 // 整包or更新包大小
 *
 *     // SoftType: 1, // 代表杂志
 *     // FromVersion: '2.0.1', // 更新FromVersion要代上值 ， 如果首次安装FromVersion为空
 *     // TargetVersion: '3.0.1' // 无论更新还是首次安装都要带上，带表安装或升级软件的版本
 *     // IsGAHaveUpdate: 0  // 0不用更新 ；1 待更新
 *   },
 *   ...
 * }
 *
 * status当前状态：
 *   status=0 表示任务暂停
 *   status=1 表示任务下载中
 *   status=3 表示任务已经被删除或者已经安装完成
 *   status=4 等待中
 *   status=5 其它：下载完成，准备安装等
 *   status=6 安装中
 */
const softwareStatePad = {
  namespaced: true,
  state: {
    stateMap: {}
  },
  getters: {
    taskList({ stateMap }, getters, rootState, rootGetters) {
      return Object.keys(stateMap).filter(key => [4, 1, 0].includes(stateMap[key].status)).map(key => stateMap[key])
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
    clearGASoft({ commit, state: { stateMap }, rootState: { user: { userInfo }}, dispatch }) {
      if (userInfo?.UserID) {
        setTimeout(() => {
          dispatch('getDLList')
        }, 3000)
      }
    },
    getDLList({ commit, dispatch }) {
      console.log('初始化获取下载中列表...')
      // dispatch('pageLoaded', { status: true, alpha: 1 }, { root: true })
      StoreDoAction('DOWNLOADCONTROL', {
        option: 'list'
      }).then(res => {
        dispatch('_applyDLList', { res })
      }).catch((res) => {
      }).finally(() => {
        dispatch('pageLoaded', false, { root: true })
      })
    },
    // 静默同步下载列表，不触发 loading 遮罩，供页面内刷新使用
    syncDLList({ dispatch }) {
      StoreDoAction('DOWNLOADCONTROL', {
        option: 'list'
      }).then(res => {
        // clearLocking:true — add 等待 2s 后同步，此时过渡态已结束，解除所有 locking
        dispatch('_applyDLList', { res, clearLocking: true })
      }).catch(() => {})
    },
    _applyDLList({ commit, state }, payload) {
      // 兼容旧格式（直接传数组）和新格式（{res, clearLocking}）
      const res = Array.isArray(payload) ? payload : (payload && payload.res || [])
      const clearLocking = payload && payload.clearLocking || false
      const stateMap = state.stateMap
      const storeList = res || []
      const _stateMap = {}
      storeList.forEach(o => {
        const { packageName, versionCode, state, appName, iconAddr, percentage, dlspeed, totalsize, vcnumber, hdSoftID } = o
        const existing = stateMap[packageName]
        _stateMap[packageName] = {
          SoftID: packageName,
          Version: versionCode || '',
          SoftName: appName || '',
          LogoFile: iconAddr || '',
          status: state,
          dlspeed: dlspeed || 0,
          progress: Math.round(percentage || 0),
          apkSize: totalsize,
          vcnumber,
          hdSoftID,
          // clearLocking:true（来自 syncDLList）时解锁；否则保留 locking 等真实广播到达
          locking: clearLocking ? false : (existing?.locking || false)
        }
      })
      // 清除已不在商店任务列表中的活跃下载状态
      // clearLocking:false 时跳过 locking:true 条目（add 在途，商店任务尚未建立）
      // clearLocking:true 时一并清理（2s 后同步，过渡期已结束）
      const newPkgs = new Set(storeList.map(o => o.packageName))
      Object.keys(stateMap).forEach(pkg => {
        if ([0, 1, 4, 6, 9].includes(stateMap[pkg].status) && !newPkgs.has(pkg)) {
          if (stateMap[pkg].locking && !clearLocking) {
            return
          }
          commit('deleteStateMap', pkg)
        }
      })
      commit('updateStateMap', _stateMap)
    },
    dlProgressListener({ commit, state: { stateMap }}, content) {
      if (!content) return

      const _state = stateMap[content.packageName]
      if (!_state) return

      commit('updateStateMap', {
        [content.packageName]: {
          ..._state,
          status: 1,
          dlspeed: content.dlspeed || 0,
          progress: Math.round(content.percentage || 0)
        }
      })
    },
    dlStateChangeListener({
      commit,
      state: { stateMap },
      payload = {},
      rootState: { user: { userInfo }}
    }, content) {
      if (!content) return
      const _state = stateMap[content.packageName]
      if (!_state) return
      if (content.state === -1) {
        // locking 期间（add 在途）忽略商店发来的取消广播，防止乐观状态被误删
        if (_state.locking) {
          return
        }
        commit('deleteStateMap', content.packageName)
        return
      }
      // add 流程中商店先删旧任务再建新任务，期间可能发来 state:9（下载失败）作为过渡态，忽略等待 syncDLList 修正
      if (_state.locking && content.state === 9) {
        return
      }
      const attrStatus = content.state >= 0 ? content.state : -1
      commit('updateStateMap', {
        [content.packageName]: {
          ..._state,
          status: attrStatus,
          locking: false // 真实状态广播到达，解锁
        }
      })
      if (attrStatus === 6) {
        // 安装中 代替 下载成功
        callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameSdkCompleteTask', '', {
          detail: JSON.stringify({
            lenovoid: userInfo?.UserID || '',
            gameName: _state.SoftName,
            softid: _state.hdSoftID || content.hdSoftID,
            status: 1,
            clickClass: _state.isUpdate ? 2 : 1
          })
        })
      } else if (attrStatus === 9) {
        // 下载失败
        callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameSdkCompleteTask', '', {
          detail: JSON.stringify({
            lenovoid: userInfo?.UserID || '',
            gameName: _state.SoftName,
            softid: _state.hdSoftID || content.hdSoftID,
            status: 2,
            clickClass: _state.isUpdate ? 2 : 1,
            errCode: content.eCode || -1
          })
        })
      }
    },
    dlEndInstallListener({
      commit,
      state: { stateMap },
      rootState: { user: { userInfo }},
      rootState
    }, content) {
      if (!content) return
      // 安装成功 失败
      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameInstallResults', '', {
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: stateMap[content.packageName]?.SoftName || '',
          softid: content.hdSoftID,
          status: content.installStatus ? 1 : 2,
          clickClass: stateMap[content.packageName]?.isUpdate ? 2 : 1
        })
      })
      const _state = stateMap[content.packageName]
      if (!_state) return

      if (!content.installStatus) {
        commit('deleteStateMap', content.packageName)
        return
      }
      commit('updateStateMap', {
        [content.packageName]: {
          SoftID: content.packageName,
          Version: content.versionCode || '',
          SoftName: '',
          LogoFile: '',
          status: 3,
          locking: false,
          dlspeed: 0,
          progress: 0,
          mainExePath: ''
        }
      })
    },
    init({ dispatch }) {
      dispatch('getDLList')
      if (this.notifyListener) {
        window.LegionZoneMobile?.removeEventListener(this.notifyListener)
      }
      this.notifyListener = window.LegionZoneMobile?.addListener('Store_Notify', (res) => {
        const base64data = Base64.decode(res)
        let obj = {}
        try {
          obj = JSON.parse(base64data)
        } catch (error) {
          console.log('Store_Notify pad error', error)
        }
        const { action, data } = obj
        if (action === 'ON_DL_PROGRESS') { // 下载进度
          // console.log('ON_DL_PROGRESS pad 下载进度', data)
          dispatch('dlProgressListener', data)
        } else if (action === 'ON_DL_STATE_CHG') { // 软件状态变化
          console.log('ON_DL_STATE_CHG pad 软件状态变化', data)
          dispatch('dlStateChangeListener', data)
        } else if (action === 'ON_DL_END_INSTALL') { // 软件安装成功和失败
          console.log('ON_DL_END_INSTALL pad 软件安装成功和失败', data)
          dispatch('dlEndInstallListener', data)
        } else if (action === 'ON_DL_LAUNCH_FAIL') { // 游戏启动失败
          console.log('ON_DL_LAUNCH_FAIL pad 游戏启动失败', data)
          if (!data?.launchStatus) {
            Message({
              message: data?.msg || '未找到本地游戏，请安装游戏后重试',
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
      if (!_state || _state.status !== 3) return

      commit('deleteStateMap', payload)
    },
    checkInstalled({ commit, state, dispatch }, payload) {
      const { softId } = payload
      if (!softId || checkList.filter(item => item.softId === softId).length) return

      if (checkList.length <= 0) {
        Promise.resolve().then(() => {
          if (checkList.length <= 0) return

          const _checkList = [...checkList]
          checkList = []
          const _storeIdList = _checkList.map(item => ({
            packageName: item.softId,
            versionCode: item.version,
            vcnumber: item.vcnumber
          }))
          StoreDoAction('GETINSTALL', {
            pkgNameList: _storeIdList
          }).then(newRes => {
            const _stateMap = {}
            const allInstalledApps = [...(newRes || [])]
            if (allInstalledApps.length <= 0) return
            allInstalledApps.forEach(o => {
              if (!o.packageName) return
              if (state.stateMap[o.packageName]) return
              if (!o.isInstalled) {
                dispatch('deleteInstalledApp', o.packageName)
                return
              }

              _stateMap[o.packageName] = {
                SoftID: o.packageName,
                Version: o.versionCode || '',
                vcnumber: o.vcnumber || '',
                SoftName: '',
                LogoFile: '',
                status: 3,
                eCode: 0,
                dlspeed: 0,
                progress: 0,
                mainExePath: '',
                IsGAHaveUpdate: o.isUpdate || false // false 不用更新 ；true 待更新
              }
            })

            commit('updateStateMap', _stateMap)
          }).catch(() => {})
        })
      }

      checkList.push(payload)
    },
    add({ commit, dispatch, state, rootState: { system }}, payload = {}) {
      if (!payload.SoftID || !payload.Version || !payload.SoftName) return

      // 使用 state.stateMap 而非解构，确保 .catch 回调内读到的是提交后的实时值
      const _state = state.stateMap[payload.SoftID]
      if (!system?.oldStoreVersion) {
        commit('updateStateMap', {
          [payload.SoftID]: {
            ..._state,
            hdSoftID: payload.hdSoftID,
            SoftID: payload.SoftID,
            Version: payload.Version,
            vcnumber: payload.vcnumber || '',
            apkSize: payload.apkSize || 0,
            SoftName: payload.SoftName,
            LogoFile: payload.LogoFile || '',
            status: 4,
            locking: true,
            eCode: 0,
            dlspeed: 0,
            progress: 0,
            mainExePath: '',
            isUpdate: payload.IsGAHaveUpdate || false
          }
        })
      }

      // 成功时的 LZ_loadGameSdkCreateTask 由调用方（DownloadButtonPad.add / handleUpdateAll）负责上报，此处不重复
      console.log('add 入参', {
        hdSoftID: payload.hdSoftID,
        packageName: payload.SoftID,
        versioncode: payload.Version,
        vcnumber: payload.vcnumber,
        appName: payload.SoftName,
        iconAddr: payload.LogoFile || '',
        apkSize: payload.apkSize || 0
      })
      // UPINSTALLEDAPPS 成功路径不会 resolve H5 Promise，无法在 .then() 里做事后同步。
      // 无条件延迟 2s 主动同步一次：处理"商店已有该任务→只发 state:-1→不再推进度广播"的卡等待中场景。
      setTimeout(() => dispatch('syncDLList'), 2000)
      StoreDoAction('UPINSTALLEDAPPS', {
        hdSoftID: payload.hdSoftID,
        packageName: payload.SoftID,
        versioncode: payload.Version,
        vcnumber: payload.vcnumber,
        appName: payload.SoftName,
        iconAddr: payload.LogoFile || '',
        apkSize: payload.apkSize || 0
      }).then(res => {
        if (res?.code === -1) throw JSON.stringify({ code: res.code, message: res.msg })
      }).catch((res) => {
        let errObj = {}
        try {
          errObj = JSON.parse(res)
        } catch (e) {
          console.log(e)
        }
        // notifyH5DownloadStatus(false) 会在 add 流程的过渡期（商店删旧任务再建新任务）触发，
        // 此时 state:9 广播尚未到达。catch 的 microtask 先于 Store_Notify 的 task 执行，
        // 若在此回滚则 locking 被清除，state:9 广播到达时无法被拦截，按钮会错误显示"安装"。
        // 通过读取 state.stateMap（实时引用）检测当前是否仍处于 locking，是则跳过回滚。
        if (state.stateMap[payload.SoftID]?.locking) {
          return
        }
        // 回滚到 add 之前的状态；若之前无状态才删除，避免按钮错误显示"安装"
        if (_state && Object.keys(_state).length > 1) {
          commit('updateStateMap', { [payload.SoftID]: _state })
        } else {
          commit('deleteStateMap', payload.SoftID)
        }
        callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
          detail: JSON.stringify({ ...JSON.parse(payload.drinfo), stateGame: 1, statePage: payload?.statePage || 1 }),
          status: 2,
          typeerr: JSON.stringify({
            errortype: errObj.code,
            errormess: errObj.message || JSON.stringify(res)
          })
        })
      })
    },
    cancel({ commit, state: { stateMap }, rootState: { user: { userInfo }}, dispatch }, payload) {
      const _state = stateMap[payload]
      if (!_state) return
      //  || ![4, 1, 0].includes(_state.status)
      const curState = _state
      commit('deleteStateMap', payload)
      commit('updateStateMap', {
        [payload]: {
          SoftID: curState.SoftID
        }
      })
      StoreDoAction('DOWNLOADCONTROL', {
        option: 'cancel',
        dlInfo: {
          packageName: curState.SoftID,
          versioncode: curState.Version,
          vcnumber: curState.vcnumber
        }
      }).catch(() => {})

      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 4,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: 1 // isUpdate ? 2 : 1
        })
      })
    },
    retry({ commit, state: { stateMap }, rootState: { user: { userInfo }}}, payload) {
      const _state = stateMap[payload]
      if (!_state) return
      commit('updateStateMap', {
        [payload]: {
          ..._state,
          dlspeed: 0,
          progress: 0
        }
      })
      StoreDoAction('DOWNLOADCONTROL', {
        option: 'retry',
        dlInfo: {
          packageName: _state.SoftID,
          versioncode: _state.Version,
          vcnumber: _state.vcnumber
        }
      }).then(res => {
        if (res?.code === -1) throw new Error('retry failed')
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
          clickClass: 1 // isUpdate ? 2 : 1
        })
      })
    },
    pause({ commit, state: { stateMap }, rootState: { user: { userInfo }}}, payload) {
      console.log('pause 暂停任务 入参', payload, stateMap, userInfo)
      const _state = stateMap[payload]
      if (!_state) return
      commit('updateStateMap', {
        [payload]: {
          ..._state,
          status: 0
        }
      })
      StoreDoAction('DOWNLOADCONTROL', {
        option: 'pause',
        dlInfo: {
          task_state: 0,
          packageName: _state.SoftID,
          versionCode: _state.Version,
          vcnumber: _state.vcnumber
        }
      })
      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 1,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: 1// isUpdate ? 2 : 1
        })
      })
    },
    resume({ commit, state: { stateMap }, rootState: { user: { userInfo }}}, payload) {
      const _state = stateMap[payload]
      console.log('resume 恢复下载参数', payload, _state)
      if (!_state) return
      commit('updateStateMap', {
        [payload]: {
          ..._state,
          status: 1
        }
      })
      commit('updateStateMap', {
        [payload]: {
          ..._state,
          status: 1
        }
      })
      console.log('resume 恢复下载', {
        option: 'resume',
        dlInfo: {
          task_state: 1,
          packageName: _state.SoftID,
          versionCode: _state.Version,
          vcnumber: _state.vcnumber
        }
      })
      StoreDoAction('DOWNLOADCONTROL', {
        option: 'resume',
        dlInfo: {
          task_state: 1,
          packageName: _state.SoftID,
          versionCode: _state.Version,
          vcnumber: _state.vcnumber
        }
      })
      callLegacy('$dataReport', 'LZ_myGames', 'LZ_loadGameProcessClick', 'click', {
        status: 3,
        detail: JSON.stringify({
          lenovoid: userInfo?.UserID || '',
          gameName: _state.SoftName,
          softid: _state.SoftID,
          clickClass: 1 // isUpdate ? 2 : 1
        })
      })
    },
    setState({ commit }, payload) {
      commit('updateStateMap', payload)
    },
    removeListener() {
      if (this.notifyListener) {
        window.LegionZoneMobile?.removeListener(this.notifyListener)
      }
    }
  }
}

export default softwareStatePad

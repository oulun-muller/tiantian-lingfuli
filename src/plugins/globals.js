import { DataReport, LOGIN_SOURCE_XUNYOU_ACCEL, loginThen, refreshLIDToken } from '@/bridge/legionZoneMobile'
import { gamePeopleFilter } from '@/utils/filter.js'
import { compareVersions } from '@/utils'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import useClipboard from 'vue-clipboard3'

export function setupGlobals(app, store, router) {
  const gp = app.config.globalProperties

  // qiankun 已移除，$parentRouter 曾指向基座路由，现直接复用本应用自身路由实例
  gp.$parentRouter = router || { push: () => {}, back: () => {} }
  gp.$refreshLIDToken = () => {
    refreshLIDToken().then(newUserInfo => {
      if (newUserInfo?.Token) {
        store.dispatch('user/syncLIDToken', newUserInfo.Token).catch(() => {})
      }
    })
  }
  gp.$message = options => {
    if (typeof options === 'string') {
      return ElMessage(options)
    }
    return ElMessage(options)
  }
  gp.$errorMessage = message => {
    ElMessage({ message, type: 'error', duration: 2500, customClass: 'lg-message--error' })
  }
  gp.$warningMessage = message => {
    ElMessage({ message, type: 'warning', duration: 2500, customClass: 'lg-message--warning' })
  }
  gp.$successMessage = message => {
    ElMessage({ message, type: 'success', duration: 2500, customClass: 'lg-message--success' })
  }
  gp.$infoMessage = message => {
    ElMessage({ message, type: 'info', duration: 2500, customClass: 'lg-message--info' })
  }
  gp.$startDrag = () => {}
  gp.$toggleMaximize = () => {}
  gp.$login = onSuccess => loginThen(onSuccess)
  // 游戏空间加速链路（点「加速启动」/ 会员卡）专用：多带一个来源标记，
  // 让原生把登录埋点 source 归到 "7"，与其它 H5 页面（"4"）区分开。
  // 单独开一个入口而不是改 $login 签名：旧链路零改动、零回归风险。
  gp.$loginForAccel = onSuccess => loginThen(onSuccess, { source: LOGIN_SOURCE_XUNYOU_ACCEL })
  gp.$dataReport = DataReport
  gp.$parentLoading = () => {}
  gp.$parentActions = () => {}
  gp.$parentUpdateState = () => {}
  gp.$parentExposeMiniGame = () => {}
  gp.$parentOpenMiniGame = () => {}
  gp.$parentGetMiniGameDeviceInfo = () => ({})
  gp.$parentGetRegConfig = () => {}
  gp.$parentSetRegConfig = () => {}
  gp.$parentCreateMiniGameIcon = () => {}
  gp.$LegionZoneMobile = window.LegionZoneMobile
  gp.$parentGetUserInfo = () => store.state.user?.userInfo
  gp.$copyText = useClipboard().toClipboard

  app.mixin({
    methods: {
      gamePeopleFilter
    },
    computed: {
      $isAIPartnerEnabled() {
        const versionStr = this.$store?.state?.system?.version
        if (!versionStr) return false
        return compareVersions(versionStr, '2.0.07')
      },
      $isGlobalConnectEnabled() {
        const versionStr = this.$store?.state?.system?.version
        return versionStr ? compareVersions(versionStr, '2.0.08') : false
      },
      // 迅游加速器入口开关：客户端版本 ≥ 2.0.18 显示
      $isXunyouEnabled() {
        const versionStr = this.$store?.state?.system?.version
        return versionStr ? compareVersions(versionStr, '2.0.18') : false
      }
    }
  })
}

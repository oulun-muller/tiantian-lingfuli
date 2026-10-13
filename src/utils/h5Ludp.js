import { syncVue2Prototype } from '@/compat/vue2-shim'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'

const STARTTIME = new Date()
const ludpAvatar = {}
ludpAvatar.install = (app) => {
  var script = document.createElement('script')
  script.async = true
  script.src = 'https://smartdl.lenovo.com.cn/frontend/js/avatar1.2.2.js'
  document.head.appendChild(script)
  window.Avatar = window.Avatar || []
  window.Avatar.push({
    appKey: 'T8D7OVQ6EP6F',
    startTime: STARTTIME
  })

  const trackEvent = function(...params) {
    window.Avatar.push(['track', [
      ...params,
      getLegacyLenovoId(true),
      10000
    ]])
  }

  app.config.globalProperties.$trackEvent = trackEvent
  app.$trackEvent = trackEvent
  syncVue2Prototype({ $trackEvent: trackEvent })
}
export default ludpAvatar

import Main from './Main.vue'
import { mountServiceComponent } from '@/compat/mountService'

export default function gamePathSetting(options = {}) {
  return new Promise((resolve, reject) => {
    const host = mountServiceComponent(Main, { ...options, resolve, reject })
    // auto-close when promise settles if component calls resolve/reject
    const wrap = (fn) => (val) => {
      try { host.close() } catch (e) {}
      fn(val)
    }
    // If component uses this.resolve, data fields are already injected
    return host
  })
}

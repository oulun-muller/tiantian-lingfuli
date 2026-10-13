import Main from './Main.vue'
import { mountServiceComponent } from '@/compat/mountService'

export default function lzbindphone() {
  return new Promise((resolve, reject) => {
    mountServiceComponent(Main, { resolve, reject })
    try {
      this?.$dataReport?.('user', 'LZ_bindPhoneNumberPopupShow', 'pv')
    } catch (e) {}
  })
}

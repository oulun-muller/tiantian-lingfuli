import Main from './Main/index.vue'
import { mountServiceComponent } from '@/compat/mountService'

export default function FHPay(options = {}) {
  mountServiceComponent(Main, {
    channel: 'cdkdetailssell',
    type: 0,
    skuId: null,
    price: null,
    cdkUrl: '',
    plateName: '',
    gameVersion: '',
    firstLocal: '',
    secondLocal: '',
    thirdLocal: '',
    reportType: '',
    skuName: '',
    softID: '',
    lenovoid: '',
    onClose: null,
    reportChannel: 'LegionZone',
    reportIsPreOrder: 'no',
    reportUrl: '',
    ...options
  })
}

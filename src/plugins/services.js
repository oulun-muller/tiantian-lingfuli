import Dialog from '@/components/Dialog/index.vue'
import ApplyTestConfirm from '@/views/GameCenter/common/ApplyTestConfirm/index.js'
import FHPay from '@/components/FHPay/index.js'
import LZConfirm from '@/components/LZConfirm/index.js'
import LZBindPhone from '@/components/LZBindPhone/index.js'
import MediaPlay from '@/components/MediaPlay/index.js'
import RealNameAuthentication from '@/components/RealNameAuthentication/index.js'
import MagazinePay from '@/components/MagazinePay/index.js'
import GamePathSetting from '@/components/GamePathSetting/index.js'

/**
 * Mount legacy service-style components onto globalProperties.
 */
export function installServiceComponents(app) {
  app.component('Dialog', Dialog)

  const gp = app.config.globalProperties
  gp.$mediaPlay = MediaPlay
  gp.$realNameAuthentication = RealNameAuthentication
  gp.$magazinePay = MagazinePay
  gp.$gamePathSetting = GamePathSetting
  gp.$applytestconfirm = ApplyTestConfirm
  gp.$fhPay = FHPay
  gp.$lzconfirm = LZConfirm
  gp.$lzbindphone = LZBindPhone
}

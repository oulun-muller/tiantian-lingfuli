import { getLegacyGlobal } from '@/compat/legacyGlobals'

const BRAND_CONFIG = {
  true: {
    BRAND_TEXT: '斗战者控制台',
    BRAND_TEXT_CHINESE: '斗战者'
  },
  false: {
    BRAND_TEXT: 'Legion Zone',
    BRAND_TEXT_CHINESE: '拯救者'
  }
}
export function getCurrentBrandConfig(key) {
  const isBellatorDevice = getLegacyGlobal('$isBellatorDevice', false)
  const device = BRAND_CONFIG[isBellatorDevice] || BRAND_CONFIG[false]
  return device[key] || ''
}


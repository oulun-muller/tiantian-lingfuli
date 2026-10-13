import exposure from '@/directives/exposure'
import swiper from '@/directives/swiper.js'

export function setupDirectives(app) {
  app.directive('exposure', exposure)
  app.directive('swiper', swiper)
}

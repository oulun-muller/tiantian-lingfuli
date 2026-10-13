// 仅供开发环境 welfarePreview=1 的商品卡片预览。
import couponImage from './image/products/mouse-coupon.png'
import watchImage from './image/products/sports-watch.png'
import headphonesImage from './image/products/gaming-headphones.png'
import coinImage from './image/products/tencent-qcoin.png'
import xunyouImage from './image/products/accelerator-vip.png'
import { nextRewardPreview, acceleratorPreview } from './welfareStreakMock'

function createItem(name, imageUrl, index, shelf) {
  return {
    activityItemId: `preview-${shelf}-${index}`,
    resourceId: `preview-${shelf}-${index}`,
    name,
    imageUrl,
    receiveStatus: 0,
    soldOut: false,
    previewOnly: true,
    nextReward: { ...nextRewardPreview }
  }
}

export const todayPreview = {
  dailyReceiveLimit: 1,
  items: [
    ['迅游加速器3天', xunyouImage],
    ['联想无线鼠标优惠券', couponImage],
    ['联想运动手表', watchImage],
    ['腾讯Q币', coinImage]
  ].map(([name, imageUrl], index) => ({
    ...(index === 0 ? acceleratorPreview : {}),
    ...createItem(name, imageUrl, index, 'today')
  }))
}

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const date = [tomorrow.getFullYear(), String(tomorrow.getMonth() + 1).padStart(2, '0'),
  String(tomorrow.getDate()).padStart(2, '0')].join('-')

export const upcomingPreview = {
  startTime: date,
  items: [
    ['迅游加速器2天', xunyouImage],
    ['联想无线鼠标优惠券', couponImage],
    ['联想游戏耳机', headphonesImage],
    ['联想运动手表', watchImage]
  ].map(([name, imageUrl], index) => ({
    ...createItem(name, imageUrl, index, 'upcoming'),
    receiveDate: date,
    receiveStartTime: '08:30:00',
    reserved: false
  }))
}

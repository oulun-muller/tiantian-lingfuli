import coinImage from './image/products/tencent-qcoin.png'
import greenDiamondImage from './image/products/qq-green-diamond.png'

// 领奖弹窗设计中的示例提示；实际周期与奖励由后续接口提供。
export const nextRewardPreview = { daysRemaining: 2, name: '迅游加速器2天' }

export const acceleratorPreview = {
  name: '3天加速时长',
  rewardType: 'accelerator',
  acceleratorDays: 3,
  bonusDays: 3,
  popupVariant: 'today',
  previewOnly: true,
  nextReward: { ...nextRewardPreview }
}

export const streakStates = [
  { value: 'normal', label: '正常 / 今日领取后解锁第4天' },
  { value: 'beforeFinalReward', label: '第6天 / 解锁第7天礼品' },
  { value: 'noGift', label: '第4天 / 下一天无礼品' },
  { value: 'unlockFifth', label: '解锁第5天 / 预览推进动画' },
  { value: 'loading', label: '加载中' },
  { value: 'empty', label: '暂无活动' },
  { value: 'error', label: '加载失败' },
  { value: 'claimed', label: '奖励已领' },
  { value: 'reset', label: '断领重置' },
  { value: 'longText', label: '长奖励名称' }
]

export function createStreakMock(state = 'normal') {
  const counts = { reset: 0, claimed: 4, beforeFinalReward: 6, noGift: 4, unlockFifth: 4 }
  const completedDays = counts[state] ?? 3
  return {
    completedDays,
    days: Array.from({ length: 7 }, (_, index) => {
      const day = index + 1
      const reward = [2, 4, 7].includes(day)
      const rewardName = day === 7 ? '绿钻会员' : '腾讯Q币'
      return {
        day,
        label: `第${day}天`,
        rewardName: reward ? (state === 'longText' ? `${rewardName}连续领取专属体验福利` : rewardName) : '',
        imageUrl: reward ? (day === 7 ? greenDiamondImage : coinImage) : '',
        imageKind: 'standard',
        rewardType: 'standard',
        acceleratorDays: 0,
        bonusDays: 0,
        nextReward: reward ? { ...nextRewardPreview } : null,
        claimed: reward && (day === 2 && state !== 'reset' || day === 4 && state === 'claimed')
      }
    })
  }
}

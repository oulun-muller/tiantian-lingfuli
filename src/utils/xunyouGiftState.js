/**
 * 迅游新人 / 回归福利的共享状态。
 *
 * 消费方有三处，各自在不同页面：
 *   1. **游戏空间的福利横幅**（XunyouWelfareBanner）—— 福利在游戏空间页唯一的露出位
 *      （会员卡的福利态已按设计改版移除，见 09-23「会员卡改版为三态」）；
 *   2. **会员页的福利卡**（acceleratorBuy）；
 *   3. **加速启动拦截**（GameCarousel）：无权益时点「加速启动」若这里还有可领福利，
 *      会弹领取提醒弹窗，点「领取并加速」走 claimGiftForAccelLaunch（同一套领取，只是不弹结果弹窗）。
 *
 * 三处读同一份福利数据、也必须同时感知「已被领取」（领完之后别处还写着「限时领」是最直接的
 * bug 观感），所以取数、领取、以及领取结果弹窗的开关都收在这里，消费方只读、只调，各自不留副本。
 * 它们虽不同页，但这份状态是模块级的、会跨路由存活，本页卸载时由 resetGifts 复位。
 *
 * 取数时机由页面决定（gameSpace/index.vue、acceleratorBuy/index.vue）：进入页面时一次，
 * 登录态变为已登录时一次。消费方若各自在 mounted 里拉，会重复请求；这里的 in-flight 去重只是兜底。
 */

import { computed, ref } from 'vue'
import { getXunyouGifts, claimXunyouGift } from '@/api/accelerator.js'
import { getLegacyStore } from '@/compat/legacyGlobals'
import { refreshXunyouAccelStatus } from '@/utils/xunyouAccel'

/** 福利列表（后端下发，含 claimable === false 的不可领取项） */
export const gifts = ref([])
/** 福利查询是否已结束：成功与失败都算结束（消费方据此区分「正在查」与「没有福利」） */
export const giftsSettled = ref(false)
/** 领取请求进行中，各露出位据此防重复提交 */
export const claiming = ref(false)
/** 领取成功结果弹窗由游戏空间页渲染 */
export const claimDialogVisible = ref(false)
/** 领取到的会员天数，结果弹窗主文案用 */
export const claimedDurationDays = ref(0)

/** 可领取的新人福利（giftType=1，一生一次） */
export const claimableNewGift = computed(
  () => gifts.value.find(item => Number(item.giftType) === 1 && item.claimable === true) || null
)

/**
 * 可领取的回归福利（giftType=2，按 intervalDays 倒序多条）。
 * 后端对每条回归配置**独立**判定 claimable，大间隔可领时小间隔也会同时为 true，
 * 所以必须自己挑第一条（倒序即最优），不能假设列表里至多一条。
 */
export const claimableReturnGift = computed(
  () => gifts.value.find(item => Number(item.giftType) === 2 && item.claimable === true) || null
)

/** 新人优先于回归 */
export const currentWelfare = computed(() => claimableNewGift.value || claimableReturnGift.value)

/** 当前福利是新人还是回归（埋点 welfareType 与横幅文案变体都用它） */
export const currentWelfareType = computed(() => (claimableNewGift.value ? 'newcomer' : 'return'))

// 两处入口在同一页同时挂载，各自的取数挂点又在同一轮 flush 里（版本号与登录态可能一起到），
// 用同一个 in-flight Promise 去重，免得起一次游戏空间页打两次 gift/available。
// token 用来作废在途请求：登出/切账号后旧请求仍会回来，那份数据属于上一个登录态，不能写进来。
let inflightLoad = null
let loadToken = 0

/**
 * 拉取福利列表。未登录直接置空并标记结束，不发请求。
 * @param {string} loginStatus store.state.user.loginStatus，只有 'yes' 才请求
 */
export function loadGifts(loginStatus) {
  if (loginStatus !== 'yes') {
    loadToken += 1
    inflightLoad = null
    gifts.value = []
    giftsSettled.value = true
    return Promise.resolve([])
  }
  if (inflightLoad) return inflightLoad

  loadToken += 1
  const token = loadToken
  giftsSettled.value = false
  inflightLoad = getXunyouGifts()
    .then(list => {
      if (token !== loadToken) return []
      gifts.value = Array.isArray(list) ? list : []
      return gifts.value
    })
    .catch(() => {
      // 福利查询失败按「无福利」静默降级，不阻塞福利横幅与会员页（沿用被删的临时福利横幅口径）
      if (token === loadToken) gifts.value = []
      return []
    })
    .finally(() => {
      if (token !== loadToken) return
      giftsSettled.value = true
      inflightLoad = null
    })
  return inflightLoad
}

/**
 * 复位到「未取数」状态：游戏空间页 / 会员页卸载时调用。
 *
 * 这份状态是模块级的、会跨页面存活；不复位的话再次进入该页会先按**上一次**的福利数据显示一帧
 * —— 福利横幅会闪出来（还可能带着错的变体），而这次的福利数据还没回来。复位后页面重新取数，
 * 期间横幅不显示，与「状态存在组件内、卸载即销毁」的行为一致。
 *
 * 调用点要放在页面的 `unmounted()`（不是 `beforeUnmount`）：前者在子组件全部销毁之后执行，
 * 避免把 `giftsSettled` 变回 false 时还触发到正在销毁的福利横幅的 watcher。
 */
export function resetGifts() {
  loadToken += 1
  inflightLoad = null
  gifts.value = []
  giftsSettled.value = false
  claimDialogVisible.value = false
  claimedDurationDays.value = 0
}

/**
 * 领取福利的共用实现。
 * @param {object} gift 取 claimableNewGift / claimableReturnGift
 * @param {boolean} showResultDialog 是否弹「恭喜获得 X 天」的结果弹窗
 * @param {boolean} [waitForGiftReload=true] 是否等待二次拉取福利列表；短窗加速路径不能等待它，
 *   因为其计时必须紧接领取订单成功返回后开始。
 * @returns {Promise<boolean>} 是否真的发起了领取
 */
function performClaim(gift, showResultDialog, waitForGiftReload = true) {
  if (!gift || claiming.value) return Promise.resolve(false)

  claiming.value = true
  return claimXunyouGift(gift.giftConfigId)
    .then(() => {
      gifts.value = gifts.value.map(item => (
        item.giftConfigId === gift.giftConfigId ? { ...item, claimable: false } : item
      ))
      giftsSettled.value = false
      if (showResultDialog) {
        claimedDurationDays.value = gift.durationDays
        claimDialogVisible.value = true
      }
      // 福利天数由后端**异步**同步给迅游，这里等到权益真正变化为止（与购买路径同一套逻辑）。
      // 不能 await：最长 90 秒，串进这条链会让 claiming 一直为真、各处「领取」按钮都点不动，
      // 用户看到的是「卡片/横幅点不了」。让它自己跑完并回写 store 即可。
      refreshXunyouAccelStatus({
        store: getLegacyStore(),
        waitUntilChanged: true,
        intervalMs: 5000,
        waitTimeoutMs: 90000
      }).catch(() => {})
      // 领取并加速的 5 秒短窗从订单成功返回时开始，不能再等待 gift/available 的二次网络请求。
      // 二次刷新仍需发起，确保短窗结束后福利横幅最终与后端可领状态一致。
      const reload = loadGifts('yes')
      if (!waitForGiftReload) {
        reload.catch(() => {})
        return true
      }
      return reload.then(() => true)
    })
    .finally(() => {
      claiming.value = false
    })
}

/**
 * 领取福利。成功后立刻把该项置为不可领 —— 各露出位同时跟着收起，并拉一次新的会员权益。
 * 失败时 reject，错误文案交给调用方 toast（各处露出位的语境不同）。
 * @param {object} gift 取 claimableNewGift / claimableReturnGift
 * @returns {Promise<boolean>} 是否真的发起了领取
 */
export function claimGift(gift) {
  return performClaim(gift, true)
}

/**
 * 「领取并加速」用的领取：动作与 claimGift 完全一致（置为已领、拉新权益、fire-and-forget 90 秒等生效），
 * 唯一区别是**不弹领取结果弹窗**——用户要的是继续加速启动游戏，不是看「恭喜获得 N 天」（PRD R3）。
 *
 * 单独一个入口而不是给 claimGift 加开关：两处调用方的语境不同，弹窗归属也不同
 * （结果弹窗由游戏空间页渲染，本路径刻意不占用它）。
 * @param {object} gift 取 claimableNewGift / claimableReturnGift
 * @returns {Promise<boolean>} 是否真的发起了领取；false 表示被防重复提交挡下（已有领取在途）
 */
export function claimGiftForAccelLaunch(gift) {
  return performClaim(gift, false, false)
}

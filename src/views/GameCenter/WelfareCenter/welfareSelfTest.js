/** 福利自测开关：正式发版全部改 false。本机覆盖见 gitignore 的 welfareSelfTest.local.js */
export const SELF_TEST_CALENDAR_REMINDER = false
/** 预约按钮永远可点（忽略已预约灰态） */
export const SELF_TEST_RESERVE_ALWAYS = false
/** 推荐弹窗每次进入都弹（忽略「当天已弹过」） */
export const SELF_TEST_RECOMMEND_POPUP_ALWAYS = false

const localMods = import.meta.glob('./welfareSelfTest.local.js', { eager: true })
const local = Object.values(localMods)[0] || {}

function queryFlag(name) {
  const search = `${window.location.search || ''}${window.location.hash || ''}`
  return new RegExp(`[?&#]${name}=1(?:$|[&#])`, 'i').test(search)
}

/** 热门活动自测：dev + local 文件，或 URL ?hotActivityTest=1 */
export const SELF_TEST_HOT_ACTIVITY =
  queryFlag('hotActivityTest') ||
  (import.meta.env.DEV && local.SELF_TEST_HOT_ACTIVITY === true)

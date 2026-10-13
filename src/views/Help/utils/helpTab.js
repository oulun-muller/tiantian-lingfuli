import { HELP_TABS } from '../data/helpData'

const KEYS = HELP_TABS.map(tab => tab.key)

export function parseHelpTab(value) {
  return typeof value === 'string' && KEYS.includes(value) ? value : 'hot'
}

export function helpCenterLocation(tab = 'hot') {
  return tab === 'hot' ? { name: 'HelpCenter' } : { name: 'HelpCenter', query: { tab }}
}

export function historyLocation(fromTab) {
  return fromTab && fromTab !== 'hot' ? { name: 'FeedbackHistory', query: { fromTab }} : { name: 'FeedbackHistory' }
}

export function leaveToHelpCenter(route, router) {
  if (window.history.length > 1) router.back()
  else router.push(helpCenterLocation(parseHelpTab(route.query.fromTab)))
}

export function leaveToHistory(route, router) {
  if (window.history.length > 1) router.back()
  else router.push(historyLocation(parseHelpTab(route.query.fromTab)))
}

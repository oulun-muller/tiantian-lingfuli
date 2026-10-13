import { feedbackAppId, feedbackRequest as request } from '@/utils/signRequest'

const P = '/cloud-feedback'

export function getQuesTypes() {
  return request({ url: `${P}/rest/userfeedback/questypes`, method: 'get', params: { appId: feedbackAppId }})
}

export function submitFeedback(data) {
  return request({ url: `${P}/rest/userfeedback/submit`, method: 'post', data })
}

export function getFeedbackHistory(data) {
  return request({ url: `${P}/rest/userfeedback/history`, method: 'post', data })
}

export function getFeedbackDetail(data) {
  return request({ url: `${P}/rest/userfeedback/detail`, method: 'post', data })
}

export function appendFeedback(data) {
  return request({ url: `${P}/rest/userfeedback/append`, method: 'post', data })
}

export function getUnreadFeedback(data) {
  return request({ url: `${P}/rest/userfeedback/unread`, method: 'post', data })
}

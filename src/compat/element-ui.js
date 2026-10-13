import {
  ElMessage,
  ElMessageBox,
  ElLoading,
  ElNotification,
  ElSlider
} from 'element-plus'

// element-ui -> element-plus compatibility surface used by legacy code
export const Message = ElMessage
export const MessageBox = ElMessageBox
export const Loading = ElLoading
export const Notification = ElNotification
export const Slider = ElSlider

const ElementUI = {
  Message,
  MessageBox,
  Loading,
  Notification,
  Slider,
  install() {}
}

export default ElementUI

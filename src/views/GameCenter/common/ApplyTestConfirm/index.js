import Main from './Main'

/**
 * 调起申请游戏内测框
 * @param {String} title - 弹框左上角文案
 * @param {Number} type - 1：申请，2：填写问卷并申请
 * @param {String} confirmButtonText - button文案
 */

export default function applytestconfirm({
  title = '申请测试资格',
  type = 1,
  confirmButtonText = '申请'
} = {}) {
  return new Promise((resolve, reject) => {
    const instance = new Main({
      data: {
        title,
        type,
        confirmButtonText,
        resolve,
        reject
      }
    })
    instance.$mount()
    document.body.appendChild(instance.$el)
  })
}

/**
 * 系统返回时给壳问：弹窗 / 簇内子页走 Vue，首页交给壳离开整簇。
 */
export function installWelfareClusterBack(handlers) {
  window.__lzWelfareOnBack = () => {
    try {
      if (handlers.closePopup?.()) return 'popup'
      if (handlers.isClusterSubPage?.()) {
        handlers.vueBack?.()
        return 'vue'
      }
    } catch (e) {
      /* 壳仍按首页离开整簇 */
    }
    return 'home'
  }
}

export function uninstallWelfareClusterBack() {
  try {
    delete window.__lzWelfareOnBack
  } catch (e) {
    window.__lzWelfareOnBack = undefined
  }
}

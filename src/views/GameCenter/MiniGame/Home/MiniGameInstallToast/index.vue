<template>
  <div class="mini-game-toast-container">
    <transition-group name="toast-fade" tag="div">
      <div
        v-for="item in toastList"
        :key="item.id"
        class="mini-game-install-toast"
        role="status"
        aria-live="polite"
      >
        <div class="toast__inner">
          <!-- 左侧：图标 + 文字 -->
          <div class="toast__body">
            <div class="toast__icon-wrap">
              <img v-if="item.iconUrl" class="toast__icon" :src="item.iconUrl" :alt="item.gameName" />
            </div>
            <div class="toast__text">
              <p class="toast__title">{{ item.gameName }}</p>
              <p class="toast__sub">安装完成</p>
            </div>
          </div>
          <!-- 右侧：立即打开 + 关闭 -->
          <div class="toast__actions">
            <button class="toast__btn" @click="handleOpen(item)">
              <span class="toast__btn-text">立即打开</span>
            </button>
            <button class="toast__close" aria-label="关闭通知" @click="handleClose(item)">
              <span class="toast__close-icon">✕</span>
            </button>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { getLegacyLenovoId } from '@/compat/legacyGlobals'

let _idCounter = 0

export default {
  name: 'MiniGameInstallToast',
  data() {
    return {
      toastList: [] // [{ id, gameName, iconUrl, pkgName, timer }]
    }
  },
  methods: {
    /**
     * 显示一条 Toast
     * @param {Object} opts - { gameName, iconUrl, pkgName }
     */
    show({ gameName, iconUrl, pkgName } = {}) {
      const id = ++_idCounter
      const timer = setTimeout(() => this.autoRemove(id), 5000)
      this.toastList.push({ id, gameName, iconUrl, pkgName, timer })
    },
    // Toast 倒计时结束自动关闭时调用，上报埋点后再移除
    autoRemove(id) {
      const item = this.toastList.find(t => t.id === id)
      if (item) {
        this.$dataReport('LZ_minigames', 'LZ_miniGameInstallSuccessPopupClick', 'click', {
          detail: JSON.stringify({
            skuName: item.gameName,
            pkgName: item.pkgName,
            lenovoid: getLegacyLenovoId(),
            clickType: '5sclose'
          })
        })
      }
      this.remove(id)
    },
    remove(id) {
      const idx = this.toastList.findIndex(t => t.id === id)
      if (idx === -1) return
      clearTimeout(this.toastList[idx].timer)
      this.toastList.splice(idx, 1)
    },
    // 用户手动点击 ✕ 关闭时调用，上报埋点后再移除
    handleClose(item) {
      this.$dataReport('LZ_minigames', 'LZ_miniGameInstallSuccessPopupClick', 'click', {
        detail: JSON.stringify({
          skuName: item.gameName,
          pkgName: item.pkgName,
          lenovoid: getLegacyLenovoId(),
          clickType: 'close'
        })
      })
      this.remove(item.id)
    },
    handleOpen(item) {
      // this.$emit('open', { pkgName: item.pkgName })
      // this.remove(item.id)
    }
  },
  beforeUnmount() {
    this.toastList.forEach(t => clearTimeout(t.timer))
  }
}
</script>

<style scoped lang="scss">
// 容器：固定在视口右下角，纵向堆叠
.mini-game-toast-container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  pointer-events: none;

  > div {
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
  }
}

.mini-game-install-toast {
  width: 309px;
  height: 70px;
  border-radius: 8px;
  overflow: clip;
  border: 1px solid rgba(234, 247, 255, 0.1);
  pointer-events: all;
  box-shadow:
    0px 2px 8px 0px rgba(0, 0, 0, 0.16),
    0px 2px 8px 0px rgba(0, 0, 0, 0.16),
    0px 2px 8px 0px rgba(0, 0, 0, 0.16);
}

.toast__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(180deg, #1B2027 0%, #14191E 100%),
    linear-gradient(90deg, #1E242B 0%, #1E242B 100%);
}

// ---- 左侧：图标 + 文字 ----
.toast__body {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.toast__icon-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 30px;
  overflow: clip;
  flex-shrink: 0;
  background: #2a3040;
}

.toast__icon {
  position: absolute;
  left: -6.83px;
  top: -7.49px;
  width: 54px;
  height: 54px;
  border-radius: 58px;
  object-fit: cover;
}

.toast__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.toast__title {
  height: 16px;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 16px;
  color: #eaf7ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast__sub {
  height: 20px;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  color: rgba(234, 247, 255, 0.8);
}

// ---- 右侧：立即打开 + 关闭 ----
.toast__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

// 立即打开按钮：68×28，银灰双渐变
.toast__btn {
  position: relative;
  width: 68px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid #8a9298;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
  background-image:
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0.05) 40%,
      rgba(255, 255, 255, 0.05) 60%,
      rgba(180, 190, 200, 0.4) 100%
    ),
    linear-gradient(
      160deg,
      #c8ced6 0%,
      #dde3e8 40%,
      #e8edf0 70%,
      #cfd6dc 100%
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);

  &:hover { opacity: 0.85; }
  &:active { transform: scale(0.97); }
}

.toast__btn-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #1a0e00;
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: 1px;
}

// 关闭按钮：20×20
.toast__close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s ease;
  background: none;
  border: none;

  &:hover { opacity: 1; }
}

.toast__close-icon {
  font-size: 12px;
  color: #eaf7ff;
  line-height: 1;
  pointer-events: none;
}

// ---- 进出场动画 ----
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

</style>

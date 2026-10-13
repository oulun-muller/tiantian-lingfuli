<template>
  <transition name="guide-fade">
    <div v-if="visible" class="ai-guide-overlay">
      <!-- 引导弹窗（始终居中） -->
      <div class="guide-popup-wrap" @click.stop>
        <div class="guide-popup">
          <img src="../image/guide-popup.png" class="guide-popup-bg" alt="" />
          <!-- 透明热区覆盖"去试试"按钮，坐标来自 Figma：(147,89) in 365×142 -->
          <div class="guide-try-btn" @click="handleTryClick"></div>
        </div>
        <div class="guide-close-btn" @click="closeGuide">
          <img src="../image/guide-close-btn.svg" alt="关闭" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
const GUIDE_SHOWN_KEY = 'lz_ai_guide_shown'

export default {
  name: 'AIGuideOverlay',
  data() {
    return {
      visible: false
    }
  },
  mounted() {
    if (!localStorage.getItem(GUIDE_SHOWN_KEY)) {
      this.visible = true
    }
  },
  methods: {
    handleTryClick() {
      this.closeGuide()
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorAIAgent')
      }
    },
    closeGuide() {
      this.visible = false
      localStorage.setItem(GUIDE_SHOWN_KEY, '1')
    }
  }
}
</script>

<style scoped lang="scss">
.ai-guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* 弹窗容器：始终居中 */
.guide-popup-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.guide-popup {
  position: relative;
  width: 365px;
  max-width: 85vw;

  .guide-popup-bg {
    width: 100%;
    display: block;
  }

  /* 透明热区覆盖"去试试"按钮，坐标来自 Figma：(147,89) in 365×142 */
  .guide-try-btn {
    position: absolute;
    left: 40.3%;
    top: 62.7%;
    width: 44.7%;
    height: 22.5%;
    cursor: pointer;
    border-radius: 4px;
  }
}

.guide-close-btn {
  cursor: pointer;
  opacity: 0.9;

  img {
    width: 28px;
    height: 28px;
    display: block;
  }

  &:active {
    opacity: 0.6;
  }
}

/* 淡入淡出动画 */
.guide-fade-enter-active,
.guide-fade-leave-active {
  transition: opacity 0.25s ease;
}

.guide-fade-enter,
.guide-fade-leave-to {
  opacity: 0;
}
</style>

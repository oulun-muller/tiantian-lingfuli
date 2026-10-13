<template>
  <div
    class="thumb"
    :class="{ 'thumb--message': variant === 'message' }"
    :style="{ width: size + 'px', height: size + 'px' }">
    <div class="thumb__frame">
      <img class="thumb__img" :src="src" alt="" @click.stop="preview">

      <div
        v-if="status === 'uploading'"
        class="thumb__overlay thumb__overlay--loading">
        <span class="thumb__spinner" aria-hidden="true" />
      </div>

      <button
        v-else-if="status === 'error'"
        type="button"
        class="thumb__overlay thumb__overlay--error"
        aria-label="上传失败，点击重试"
        @click.stop="$emit('retry')">
        <span class="thumb__error-icon" aria-hidden="true">
          <img class="thumb__error-ring" :src="iconErrorRing" width="20" height="20" alt="">
          <img class="thumb__error-bar" :src="iconErrorBar" width="2" height="7" alt="">
          <img class="thumb__error-dot" :src="iconErrorDot" width="2" height="2" alt="">
        </span>
      </button>
    </div>

    <button
      v-if="deletable"
      type="button"
      class="thumb__remove"
      aria-label="删除图片"
      tabindex="-1"
      @click.stop="$emit('remove')">
      <img class="thumb__remove-icon" :src="iconPhotoDelete" width="6.667" height="6.667" alt="">
    </button>
  </div>
</template>

<script>
import { openImagePreview } from '../utils/imagePreview'
import iconPhotoDelete from '../images/icon-photo-delete.svg'
import iconErrorRing from '../images/icon-upload-error-ring.svg'
import iconErrorBar from '../images/icon-upload-error-bar.svg'
import iconErrorDot from '../images/icon-upload-error-dot.svg'

export default {
  name: 'HelpPhotoThumb',
  props: {
    src: {
      type: String,
      required: true
    },
    // 表单 88 / 对话发送 80 / 输入预览 56
    size: {
      type: Number,
      default: 88
    },
    deletable: {
      type: Boolean,
      default: false
    },
    // editor：可删缩略图；message：气泡区已发图片
    variant: {
      type: String,
      default: 'editor'
    },
    // uploading | done | error
    status: {
      type: String,
      default: 'done'
    }
  },
  data() {
    return {
      iconPhotoDelete,
      iconErrorRing,
      iconErrorBar,
      iconErrorDot
    }
  },
  methods: {
    preview() {
      if (this.status === 'done') openImagePreview(this.src)
    }
  }
}
</script>

<style lang="scss" scoped>
.thumb {
  position: relative;
  flex-shrink: 0;
}

.thumb__frame {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 2px;
  overflow: hidden;
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  background: var(--surface-hover);
}

.thumb__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb__overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0;
}

.thumb__overlay--loading {
  background: rgba(0, 0, 0, 0.4);
}

.thumb__overlay--error {
  background: rgba(57, 64, 77, 0.7);
  cursor: pointer;
}

.thumb__spinner {
  box-sizing: border-box;
  width: 18.667px;
  height: 18.667px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.18);
  border-top-color: #fff;
  animation: help-thumb-spin 0.8s linear infinite;
}

.thumb__error-icon {
  position: relative;
  width: 24px;
  height: 24px;
  display: block;
}

.thumb__error-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
}

.thumb__error-bar {
  position: absolute;
  left: 50%;
  top: 7px;
  width: 1.34px;
  height: 7px;
  transform: translateX(-50%);
}

.thumb__error-dot {
  position: absolute;
  left: 50%;
  top: 16px;
  width: 1.34px;
  height: 1.34px;
  transform: translateX(-50%);
}

.thumb__remove {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 2px;
  background: #eaf7ff;
  border: 0.5px solid rgba(255, 255, 255, 0.08);
}

.thumb__remove-icon {
  width: 6.667px;
  height: 6.667px;
  flex-shrink: 0;
  display: block;
}

.thumb--message .thumb__frame {
  border-radius: 4px;
  border-color: var(--border-strong);
}

@keyframes help-thumb-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
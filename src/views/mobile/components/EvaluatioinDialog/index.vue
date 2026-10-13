<template>
  <div class="bottom-dialog-container">
    <!-- 遮罩层 -->
    <transition name="fade">
      <div v-if="show" class="dialog-mask" @click="closeDialog"></div>
    </transition>

    <!-- 底部弹窗 -->
    <transition name="slide-up">
      <div
        v-if="show"
        class="bottom-dialog">
        <!-- 评论输入区域 -->
        <div class="comment-area">
          <textarea
            ref="commentTextarea"
            v-model="commentContent"
            class="comment-textarea"
            placeholder="您的评测对游戏很重要，无意义的谩骂可能会被删除"
            maxlength="500"></textarea>
          <div class="footer-buttons">
            <div>
              <i class="recommend" :class="{ 'recommend-active': recommendValue === 1 }" @click="clickRecommend(1)" />
              <i
                class="not-recommend"
                :class="{ 'not-recommend-active': recommendValue === 0 }"
                @click="clickRecommend(0)" />
            </div>
            <div class="publish-btn" @click="publishEval">发布</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>

import { addGameViews } from '@/api/gameEvaluation'
export default {
  name: 'BottomCommentDialog',
  props: {
    show: {
      type: Boolean,
      default: true
    },
    recommendType: {
      type: Number,
      default: null
    },
    softName: {
      type: String,
      default: ''
    },
    userReviewInfo: {
      type: Object,
      default: null
    },
    stateGame: {
      type: Number,
      default: null
    },
    statePage: {
      type: Number,
      default: null
    },
    gameClass: {
      type: Number,
      default: null
    },
    dialogWidth: {
      type: String,
      default: '632px'
    }
  },
  data() {
    return {
      softId: this.$route.params.id,
      commentContent: '',
      recommendValue: -1,
      publishClcik: false
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    }
  },
  watch: {
    show(value) {
      if (value) {
        this.recommendValue = this.recommendType
        this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailWriteReviewPopupShow', 'pv', {
          nameAndId: `${this.softName}_${this.softId}_${this.stateGame}_${this.statePage}_${this.gameClass}`,
          source: (this.recommendType === 0 || this.recommendType === 1) ? 1 : 2
        })
      }
    }
  },
  mounted() {
  },
  beforeUnmount() {
  },
  methods: {
    clickRecommend(val) {
      console.log('clickRecommend', val)
      this.recommendValue = val
    },
    publishEval() {
      if (this.recommendValue !== 0 && this.recommendValue !== 1) return
      if (this.commentContent.length > 400) {
        this.$message({
          message: '请输入400字以内的内容',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
        return
      }
      if (this.publishClcik) return
      this.publishClcik = true
      const { avatar, nickName } = this.user?.avatar || {}

      const model = this.$store?.state?.system?.MTMInfo?.ReadableMachineName

      addGameViews({
        userGameDurationCurrent: this.userReviewInfo.userGameDuration,
        userGameDurationTotal: this.userReviewInfo.userGameDuration,
        softId: this.softId,
        softName: this.softName,
        content: this.commentContent,
        result: this.recommendValue,
        userName: nickName,
        userIcon: avatar,
        model
      }).then(() => {
        this.$emit('addMyEvaluation')
        this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailWriteReviewPopupSubmitClick', 'click', {
          nameAndId: `${this.softName}_${this.softId}_${this.stateGame}_${this.statePage}_${this.gameClass}`,
          source: (this.recommendType === 0 || this.recommendType === 1) ? 1 : 2
        })
      }).finally(() => {
        this.closeDialog()
        this.publishClcik = false
      })
    },
    closeDialog() {
      this.$emit('closeDialog')
    }
  }
}
</script>

<style lang="scss" scoped>
.bottom-dialog-container {
  position: relative;
  z-index: 9999;
}

/* 遮罩层 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 9998;
}

/* 底部弹窗 */
.bottom-dialog {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #1a2026;
  border-radius: 8px 8px 0 0;
  z-index: 9999;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  transition: bottom 0.3s ease;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
}

/* 评论输入区域 */
.comment-area {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.comment-textarea {
  width: 100%;
  min-height: 120px;
  margin-bottom: 20px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;

  color: rgba(234, 247, 255, 0.4);
  background: #0c0e12;
}

/* 底部按钮 */
.footer-buttons {
  display: flex;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  justify-content: space-between;

  .publish-btn {
    width: 72px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid #FFF;
    background: linear-gradient(175deg, #929292 5.94%, #EAF7FF 98.2%);
    color: #000;
    font-size: 14px;
    line-height: 36px;
    text-align: center;
    font-weight: 700;
  }

  .recommend,
  .not-recommend {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    cursor: pointer;
    height: 16px;
    background-repeat: no-repeat;
    background-size: 100%;
  }

  .recommend {
        width: 50px;
    background-image: url('@/images/mobile/detail/recommand.png');
  }

  .not-recommend {
        width: 64px;
    background-image: url('@/images/mobile/detail/no-recommand.png');
  }

  .recommend-active {
        width: 50px;
    background-image: url('@/images/mobile/detail/recommand-active.png');
  }

  .not-recommend-active {
        width: 64px;
    background-image: url('@/images/mobile/detail/no-recommand-active.png');
  }
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 滚动条样式 */
.comment-area::-webkit-scrollbar {
  width: 4px;
}

.comment-area::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.comment-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}
</style>

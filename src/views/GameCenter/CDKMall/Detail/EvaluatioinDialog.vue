<template>

  <div v-if="show">
    <el-dialog
      :model-value="show"
      :close-on-click-modal="false"
      :show-close="false"
      title=""
      :class="[`lg-dialog evaluation-dialog`, { 'phoneDevice': $isPhoneDevice }]"
      :width="dialogWidth"
      append-to-body
      @close="closeDialog">
      <main class="wrapper">
        <h3 class="title">
          <span class="text">你推荐这款游戏吗？</span>
          <span class="action-wrap">
            <i class="recommend" :class="{ 'recommend-active': recommendValue === 1 }" tabindex="0" role="button" :aria-pressed="recommendValue === 1 ? 'true' : 'false'" aria-label="推荐" @click="clickRecommend(1)" @keydown.enter.prevent.stop="clickRecommend(1)" @keydown.space.prevent.stop="clickRecommend(1)" />
            <i
              class="not-recommend"
              :class="{ 'not-recommend-active': recommendValue === 0 }"
              tabindex="0"
              role="button"
              :aria-pressed="recommendValue === 0 ? 'true' : 'false'"
              aria-label="不推荐"
              @click="clickRecommend(0)"
              @keydown.enter.prevent.stop="clickRecommend(0)"
              @keydown.space.prevent.stop="clickRecommend(0)" />
          </span>
        </h3>
        <div class="textarea-wrap">
          <textarea
            ref="textareaDom"
            class="textarea"
            placeholder="您的评测对游戏很重要，无意义的谩骂可能会被删除"
            v-model="content"
            maxlength="400"></textarea>
          <p class="content-info">
            {{ content.length }}/400
          </p>
        </div>
        <div class="btn-wrap">
          <div>
            <button class="publish-eval cancel-btn" @click="closeDialog">取消</button>
            <button
              :class="['publish-eval', (recommendValue === 0 || recommendValue === 1) ? '' : 'disabled']"
              @click="publishEval">发布</button>
          </div>
        </div>
      </main>
    </el-dialog>
  </div>
</template>
<script>
import { addGameViews } from '@/api/gameEvaluation'
export default {
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
      content: '',
      recommendValue: null, // 1推荐 0不推荐
      publishClcik: false
    }
  },
  watch: {
    show(value) {
      // todo
      if (value) {
        this.recommendValue = this.recommendType
        this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailWriteReviewPopupShow', 'pv', {
          nameAndId: `${this.softName}_${this.softId}_${this.stateGame}_${this.statePage}_${this.gameClass}`,
          source: (this.recommendType === 0 || this.recommendType === 1) ? 1 : 2 // 1.发布评测指引 2.写评测
        })
      }
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    }
  },
  methods: {
    closeDialog() {
      this.$emit('closeDialog')
    },
    clickRecommend(val) {
      this.recommendValue = val
    },
    publishEval() {
      if (this.recommendValue !== 0 && this.recommendValue !== 1) return
      if (this.content.length > 400) {
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
      const { avatar, nickName } = this.user.avatar
      const model = this.$store.state.system.MTMInfo.ReadableMachineName

      addGameViews({
        userGameDurationCurrent: this.userReviewInfo.userGameDuration,
        userGameDurationTotal: this.userReviewInfo.userGameDuration,
        softId: this.softId,
        softName: this.softName,
        content: this.content,
        result: this.recommendValue,
        userName: nickName,
        userIcon: avatar,
        model
      }).then(() => {
        this.$emit('addMyEvaluation')
        this.closeDialog()
        this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailWriteReviewPopupSubmitClick', 'click', {
          nameAndId: `${this.softName}_${this.softId}_${this.stateGame}_${this.statePage}_${this.gameClass}`,
          source: (this.recommendType === 0 || this.recommendType === 1) ? 1 : 2 // 1.发布评测指引 2.写评测
        })
      }).finally(() => {
        this.publishClcik = false
      })
    }

  }
}
</script>
<style lang="scss" scoped>
h3.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 56px;

  .text {
    font-size: 14px;
    background: linear-gradient(180deg, #929292 1.88%, #EAF7FF 98.12%);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    margin-right: 13px;
  }
}

.action-wrap {

  .recommend,
  .not-recommend {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    cursor: pointer;
    width: 106px;
    height: 33px;
    background-repeat: no-repeat;
    background-size: 100%;

  }

  .recommend {
    background-image: url('@/views/GameCenter/CDKMall/Detail/image/recommand.png');
  }

  .not-recommend {
    background-image: url('@/views/GameCenter/CDKMall/Detail/image/no-recommand.png');
  }

  .recommend-active {
    background-image: url('@/views/GameCenter/CDKMall/Detail/image/recommand-active.png');
  }

  .not-recommend-active {
    background-image: url('@/views/GameCenter/CDKMall/Detail/image/no-recommand-active.png');
  }
}


  :deep(.el-radio__label) {
    background: linear-gradient(180deg, #929292 1.88%, #EAF7FF 98.12%);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 14px;
    font-weight: 700;
    padding-left: 5px;
    vertical-align: 0px;
  }

  :deep(.el-radio:first-child) {
    margin-right: 15px;
  }

  :deep(.el-radio-group) {
    font-size: 14px;
    line-height: 14px;
    vertical-align: 0;
  }


.content-info {
  font-size: 12px;
  color: rgba(234, 247, 255, 0.6)
}

.cancel-btn,
.publish-eval {
  &:hover {
    color: #fff;
    background: linear-gradient(to left, rgba(125, 125, 125, 1), rgba(40, 40, 40, 1));
  }

  &:active {
    color: #fff;
    background: linear-gradient(to left, rgba(95, 91, 91, 1), rgba(16, 16, 16, 1));
  }
}

.cancel-btn {
  margin-right: 11px;
  opacity: 0.8;
}

.publish-eval {
  width: 88px;
  height: 32px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 5.5px 12px;
  background: linear-gradient(0, rgba(146, 146, 146, 1) 0%, rgba(234, 247, 255, 1) 100%);
  border: 1px solid;
  border-image: linear-gradient(258.97deg, #FFFFFF 0%, #999999 100%) 1;

  &.disabled {
    color: #020202;
    background: linear-gradient(0, rgba(146, 146, 146, 0.4) 0%, rgba(234, 247, 255, 0.4) 100%);
    border-image: linear-gradient(258.97deg, rgba(255, 255, 255, 0.4) 0%, rgba(153, 153, 153, 0.4) 100%) 1;
  }
}


.wrapper {
  padding: 0 30px;
}

.textarea-wrap {
  margin-top: 16px;
  padding: 10px 6px 10px 12px;
  border: 1px solid transparent;
  background-color: rgba(234, 247, 255, 0.10);

  &:hover {
    border: 1px solid rgba(56, 110, 254, 1);
  }

  .textarea {
    padding: 0;
    padding-right: 10px;
    width: 100%;
    height: 131px;
    font-size: 14px;
    line-height: 22px;
    font-weight: 400;
    resize: none;
    background: transparent;
    color: #EAF7FF;

    &:focus-visible {
      outline: none;
    }

    &::-webkit-input-placeholder {
      color: rgba(234, 247, 255, 0.40);
    }

    &::-webkit-scrollbar-thumb {
      cursor: pointer;
      border-radius: 5px;
      background-color: rgba(80, 91, 110, 0.25);

      &:hover {
        background-color: rgba(80, 91, 110, 0.6);
      }
    }

  }

  &.shadow {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 36px;
      background: linear-gradient(0, rgba(28, 29, 33, 0.00) 23.07%, #18191D 49.5%);
      border-radius: 5px;
    }
  }
}

p.info {
  margin-top: 12px;
  color: rgba(234, 247, 255, 0.4);
  font-size: 12px;
  font-weight: 400;
}

.btn-wrap {
  width: 192px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: auto;
}


  :deep(.title .el-radio__label) {
    font-weight: 700;
  }

  :deep(.el-radio__inner) {
    width: 14px;
    height: 14px;
  }


</style>

<style scoped>
.wrapper .title .action-wrap .recommend:focus-visible,
.wrapper .title .action-wrap .not-recommend:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .wrapper .title .action-wrap .recommend:focus-visible,
  .wrapper .title .action-wrap .not-recommend:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
<style lang="scss">
.evaluation-dialog {
  height: 453px;
  box-shadow: none;
  border: 0 none;
  background: transparent url('~@/images/gamecenter/detail/write-bac.png') no-repeat center center / contain;
  /* 手机端弹窗高度 */
  &.phoneDevice {
    height: 260px;

    h3.title {
      margin-top: 0px;
    }
    .action-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .textarea-wrap .textarea {
      height: 50px;
    }
  }
}
</style>

<template>
  <div :class="['textarea-wrap', className, overHeight ? 'shadow': '']">
    <textarea
      ref="textareaDom"
      class="textarea"
      :placeholder="'回复 ' + (replyToName || '玩家er' )"
      v-model="content"
      @input="inputContent"
    ></textarea>
    <p class="btn-wrap">
      <span :class="['num-size', content.length>400?'red-num':'']">{{ content.length }}/400</span>
      <span class="action">
        <i class="text" tabindex="0" role="button" aria-label="取消" @click="$emit('cancel')" @keydown.enter.prevent.stop="$emit('cancel')" @keydown.space.prevent.stop="$emit('cancel')">取消</i>
        <i class="fenge" aria-hidden="true"></i>
        <i :class="['text', content.length?'blue-text':'']" tabindex="0" role="button" aria-label="回复" @click="clickReply" @keydown.enter.prevent.stop="clickReply" @keydown.space.prevent.stop="clickReply">回复</i>
      </span>
    </p>
  </div>
</template>
<script>
export default {
  props: {
    className: {
      type: String,
      default: ''
    },
    replyToName: {
      type: String,
      default: ''
    },
    softName: {
      type: String,
      default: ''
    },
    _stateGame: {
      type: Number,
      default: null
    },
    _statePage: {
      type: Number,
      default: null
    },
    _gameClass: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      content: '',
      overHeight: false,
      softId: this.$route.params.id
    }
  },
  watch: {
    content() {
      const dom = this.$refs.textareaDom
      this.overHeight = dom.scrollHeight > dom.clientHeight
    }
  },
  methods: {
    clickReply() {
      if (!this.content) {
        this.$message({
          message: '请输入内容',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
        return
      }
      if (this.content.length > 400) {
        this.$message({
          message: '请输入400字以内的内容',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
        return
      }
      this.$emit('confirm', this.content)

      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: 8,
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    inputContent() {
    }
  }
}
</script>
<style lang="scss" scoped>

.textarea-wrap {
  margin-top: 10px;
  padding: 14px 6px 14px 16px;
  border: 1px solid rgba(56, 110, 254, 1);
  border-radius: 5px;
  &.reply-position {
    margin-left: 23px;
  }
  .textarea {
    padding: 0;
    padding-right: 10px;
    width: 100%;
    height: 112px;
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
  .btn-wrap {
    margin-top: 16px;
    margin-right: 9px;
    display: flex;
    justify-content: space-between;
    .num-size, .action {
      font-size: 12px;
      font-weight: 400;
      color: rgba(234, 247, 255, 0.4);
    }
    .num-size.red-num {
      color: rgba(207, 42, 64, 1);
    }
    .action i.text {
      cursor: pointer;
    }
    i.blue-text {
      color: rgba(56, 110, 254, 1);
    }
    .fenge {
      display: inline-block;
      width: 1px;
      height: 12px;
      background-color: rgba(234, 247, 255, 0.4);
      margin: 0 4px;
      vertical-align: -2px;
    }
  }
}

.textarea-wrap .action i.text:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .textarea-wrap .action i.text:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

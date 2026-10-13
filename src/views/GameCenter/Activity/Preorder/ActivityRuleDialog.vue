<template>
  <div v-if="visible" class="activity-rule-dialog" @click.self="handleClose">
    <div class="dialog-content">
      <!-- 关闭按钮 -->
      <div class="dialog-close" role="button" tabindex="0" aria-label="关闭" @click="handleClose" @keydown.enter.prevent="handleClose">×</div>
      <!-- 标题 -->
      <h3 class="dialog-title">活动规则</h3>

      <!-- 活动规则内容（支持 HTML 富文本） -->
      <div class="rule-content" v-if="ruleText" v-html="ruleText"></div>
      <!-- 空状态 -->
      <div v-else class="no-content">暂无活动规则</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActivityRuleDialog',
  props: {
    // 控制弹框显示/隐藏
    visible: {
      type: Boolean,
      default: false
    },
    // 活动规则文本（支持 HTML 富文本）
    ruleText: {
      type: String,
      default: ''
    }
  },
  methods: {
    // 关闭弹框
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
/* 弹框遮罩层 */
.activity-rule-dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .8);

  /* 弹框内容区 */
  .dialog-content {
    position: relative;
    width: 600px;
    min-height: 300px;
    max-height: 80vh;
    overflow: hidden;
    background: #171c22;
    color: #fff;
    display: flex;
    flex-direction: column;
  }

  /* 关闭按钮 */
  .dialog-close {
    position: absolute;
    top: 14px;
    right: 16px;
    z-index: 2;
    width: 10px;
    height: 10px;
    font-size: 0;
    background: transparent url('~@/images/Index/close.png') no-repeat center center / contain;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
    &:focus-visible {
      outline: 2px solid #4fc3f7;
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  /* 标题栏 */
  .dialog-title {
    display: flex;
    align-items: center;
    height: 39px;
    margin: 0;
    padding: 0 16px;
    background: linear-gradient(270deg, #1e232b .32%, #2a313c 51.32%, #1e232b 99.78%);
    color: rgba(234, 247, 255, .6);
    font-size: 16px;
    font-weight: 400;
    text-align: left;
  }

  /* 活动规则内容 */
  .rule-content {
    padding: 23px 30px 0px 23px;
    max-height: calc(80vh - 39px);
    overflow-y: auto;
    color: #EAF7FF;
    font-size: 14px;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
    :deep(p) {
      margin: 0 0 12px 0;
    }
    :deep(ul), :deep(ol) {
      margin: 0 0 12px 0;
      padding-left: 20px;
    }
    :deep(li) {
      margin-bottom: 8px;
    }
    :deep(strong), :deep(b) {
      color: #EAF7FF;
      font-weight: 600;
    }
  }

  /* 空状态 */
  .no-content {
    text-align: center;
    color: #EAF7FF99;
    padding: 60px 0;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .activity-rule-dialog {
    .dialog-content {
      width: 92%;
    }
    .rule-content {
      padding: 16px;
    }
  }
}
</style>
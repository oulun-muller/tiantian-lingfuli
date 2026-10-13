<template>
  <!-- 迅游业务通用确认弹窗：加速信息详情页的「停止加速」与「切换区服二次确认」共用同一套外壳。
       设计稿 Figma SqpfWTwQHzbW3kwvBOe0mA：停止 297:13737 / 切换区服 297:14674 —— 两者外壳逐值一致
       （宽 260 / 圆角 12 / 0.5px 描边 / 同底色 / 无阴影 / 标题区 59 / 按钮区 48），
       只有确认按钮按语义换色（tone=danger → #ee5555，tone=primary → #6ba3ff），故收敛成一个组件。
       内容区支持默认插槽：不传插槽时渲染 message 文本；传插槽时由调用方自带内容（区服滚轮即走这条路）。

       两条硬约束：
       1. 只保留设计稿的深色配色，不做浅色/深色主题适配（用户明确要求；项目本身也没有主题机制）。
       2. 不要改成调原生 MessageDialog、也不要新增弹窗桥接：详情页与区服滚轮都在 H5，弹窗同源在 H5 才不跨端。 -->
  <Teleport to="body">
    <!-- 必须 Teleport 到 body：轮播根节点在 handHeldDevice 下带 transform: scale(0.85)，
         transform 祖先会让 position: fixed 退化成相对该祖先定位，弹窗会缩在卡片区域内并盖不住底部导航栏。 -->
    <div class="xunyou-confirm">
      <transition name="xunyou-confirm-fade">
        <div
          v-if="visible"
          class="xunyou-confirm__mask"
          :class="{ 'is-transparent': !showMask }"
          @click="handleCancel"></div>
      </transition>

      <transition name="xunyou-confirm-pop">
        <div v-if="visible" class="xunyou-confirm__dialog" role="dialog" aria-modal="true">
          <div v-if="title" class="xunyou-confirm__title">{{ title }}</div>

          <div class="xunyou-confirm__content">
            <slot>
              <p class="xunyou-confirm__message">{{ message }}</p>
            </slot>
          </div>

          <div class="xunyou-confirm__actions">
            <button type="button" class="xunyou-confirm__btn is-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="xunyou-confirm__btn is-confirm"
              :class="`is-${tone}`"
              @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'XunyouConfirmDialog',
  emits: ['update:visible', 'cancel', 'confirm'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 标题：留空则不渲染标题区（区服滚轮弹窗设计稿就没有标题区）
    title: {
      type: String,
      default: ''
    },
    // 正文：仅在不传默认插槽时渲染
    message: {
      type: String,
      default: ''
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    // 确认按钮的文字色语义：danger=危险操作（停止加速 #ee5555）、primary=普通确认（切换区服 #6ba3ff）
    tone: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'danger'].includes(value)
    },
    // 点「确认」后是否自动关闭本层。区服滚轮传 false：它的「确定」只是进入下一层（二次确认弹窗），
    // 滚轮本身要留在下面，点确定才走「滚轮 → 二次确认」这条链路。
    closeOnConfirm: {
      type: Boolean,
      default: true
    },
    // 是否画自己的遮罩（默认 true）。
    //
    // 叠在另一层已有遮罩的弹窗之上时传 false：详情页 0.6 + 滚轮 0.6 + 二次确认 0.6 逐层叠上去
    // 实测合成约 0.84，背景过黑 —— 所以二次确认不再自己叠暗，视觉上任何时刻只有一层遮罩。
    // 但它仍保留一层**透明**的全屏层吸收点击（点击等同「取消」）：否则点击会穿透到下一层，
    // 表现为「点空白处滚轮被关掉、二次确认却还开着」，且背景会突然变亮。
    // 注意默认值必须是 true：停止加速那个确认弹窗是直接盖在详情页上的，它需要自己的遮罩。
    showMask: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    // 取消：只关掉自己，不发任何桥接请求。调用方在 @cancel 里也不应做任何动作
    //（停止加速点「取消」必须一个请求都不发，见 PRD 范围 A）。
    handleCancel() {
      this.$emit('update:visible', false)
      this.$emit('cancel')
    },
    // 确认：先关弹窗再通知调用方。弹窗自身职责到此结束，请求结果由调用方自己反馈（toast 等）。
    handleConfirm() {
      if (this.closeOnConfirm) {
        this.$emit('update:visible', false)
      }
      this.$emit('confirm')
    }
  }
}
</script>

<style lang="scss" scoped>
/* 设计稿给的是 --lz-color-* / --primary-light / --danger-solid 这套设计系统 token，
   本项目 scss 里全都没定义（全仓 grep `--lz-color` 零命中），所以按设计稿字面值写死并在注释里标注来源，
   不要假装有 token 可用，也不要顺手发明一套变量。 */
.xunyou-confirm {
  position: fixed;
  inset: 0;
  /* 必须高于加速信息详情页（.accel-info 的 z-index 是 9999）：确认弹窗与滚轮都叠在详情页之上 */
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &__mask {
    position: absolute;
    inset: 0;
    /* 设计稿未给遮罩色（缺口），沿用同业务既有弹窗 .accel-pay-mask 的取值 */
    background: rgba(0, 0, 0, 0.6);
    pointer-events: auto;

    /* 叠在下一层遮罩之上时不再自己叠暗（详见 showMask 的注释），但仍吸收点击 */
    &.is-transparent {
      background: transparent;
    }
  }

  &__dialog {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    /* 设计稿 260 固定宽，窄屏不做变体（设计未给 phone 稿，见研究文档 §10） */
    width: 260px;
    overflow: clip;
    border: 0.5px solid rgba(234, 247, 255, 0.15);
    border-radius: 12px;
    /* 设计稿背景是 #1b2027 上叠一层 15% 的 rgba(234,247,255,0.15)，拍平约 #3a4047。
       两层 90° 线性渐变的色标首尾相同，等效纯色底 + 一层白覆盖，这里按等价写法表达原始语义。 */
    background-color: #1b2027;
    background-image: linear-gradient(rgba(234, 247, 255, 0.15), rgba(234, 247, 255, 0.15));
    /* 设计稿节点无 effects，不要加阴影 */
    pointer-events: auto;
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 59px;
    padding: 16px;
    color: #eaf7ff;
    font-size: 18px;
    font-weight: 500;
    line-height: 27px;
    text-align: center;
    white-space: nowrap;
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__message {
    margin: 0;
    padding: 0 16px 24px;
    color: #eaf7ff;
    font-size: 14px;
    line-height: 21px;
    /* ⚠️ 与设计稿有出入，待设计确认：停止弹窗（297:13737）正文居中、切换区服弹窗（297:14674）正文左对齐。
       两者是同一组件的同一位置，不该出现两种对齐，判定为设计笔误，这里统一按居中
       （与原生 MessageDialog 的惯例一致）。 */
    text-align: center;
  }

  &__actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    height: 48px;
    border-top: 0.5px solid rgba(234, 247, 255, 0.15);
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    height: 48px;
    padding: 0;
    border: 0;
    border-radius: 4px;
    background: none;
    font-size: 14px;
    line-height: normal;
    white-space: nowrap;
    cursor: pointer;

    /* 设计稿未给按下态，按项目内其它弹窗按钮的做法补一个轻微反馈 */
    &:active {
      opacity: 0.7;
    }

    &.is-cancel {
      color: rgba(234, 247, 255, 0.9);
    }

    /* 两按钮之间的 0.5px 竖分割线。设计稿是独立 SVG（Vector 24377，视觉宽 0.5px、满高），
       border-left 与其视觉等价，因此不引入素材文件 */
    &.is-confirm {
      border-left: 0.5px solid rgba(234, 247, 255, 0.15);
    }

    /* 确认按钮按语义换色：停止加速=危险色，切换区服=主色 */
    &.is-danger {
      color: #ee5555;
    }

    &.is-primary {
      color: #6ba3ff;
    }
  }
}

/* 入场/退场：遮罩淡入，弹窗轻微缩放淡入（设计稿未给动效，按详情页覆盖层同款节奏） */
.xunyou-confirm-fade-enter-active,
.xunyou-confirm-fade-leave-active {
  transition: opacity 0.24s ease;
}

.xunyou-confirm-fade-enter,
.xunyou-confirm-fade-leave-to {
  opacity: 0;
}

.xunyou-confirm-pop-enter-active,
.xunyou-confirm-pop-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.xunyou-confirm-pop-enter,
.xunyou-confirm-pop-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
</style>

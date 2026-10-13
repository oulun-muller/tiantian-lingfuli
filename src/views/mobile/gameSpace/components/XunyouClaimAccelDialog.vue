<template>
  <!-- 「可领新人/回归福利时点加速启动」的领取提醒弹窗（设计稿 Figma SqpfWTwQHzbW3kwvBOe0mA：
       phone 558:27182 底部抽屉 412×389 / pad 558:27502 居中悬浮 412×359；两者除形态外逐值一致）。
       点「领取并加速」→ 领福利 + 5 秒内等权益，拿到就继续加速启动；点取消 / 点遮罩 → 什么都不做。
       与 XunyouConfirmDialog（260 宽通用确认）不是同一套视觉：宽度、形态、底色、按钮体系全都不同，
       所以是独立组件，只复用 XunyouGiftClaimDialog 里已验证的那几个样式模式（金渐变文字 / 浅色渐变
       主按钮 / 按钮角落点阵 / Teleport + z-index 10000 + 0.24s 入场）。 -->
  <Teleport to="body">
    <!-- 必须 Teleport 到 body：轮播根节点在 handHeldDevice 下带 transform: scale(0.85)，
         transform 祖先会让 position: fixed 退化成相对该祖先定位，弹窗会缩在卡片区域内。 -->
    <div class="xunyou-claim-accel" :class="isDrawer ? 'is-drawer' : 'is-center'">
      <transition name="xunyou-claim-accel-fade">
        <div
          v-if="visible"
          class="xunyou-claim-accel__mask"
          aria-hidden="true"
          @click.stop="handleCancel"></div>
      </transition>

      <transition name="xunyou-claim-accel-pop">
        <div v-if="visible" class="xunyou-claim-accel__panel" role="dialog" aria-modal="true">
          <!-- 顶部装饰条 411×20：中央条 + 两端 + 两组斜纹 + 两条 60×1 蓝线 + 拖柄，整块是矢量素材 -->
          <img class="xunyou-claim-accel__strip" :src="topStrip" alt="" aria-hidden="true" />

          <div class="xunyou-claim-accel__message">
            <p class="xunyou-claim-accel__message-line">{{ text.message[0] }}</p>
            <p class="xunyou-claim-accel__message-line">{{ text.message[1] }}</p>
          </div>

          <div class="xunyou-claim-accel__card-slot">
            <!-- 379×96 福利卡：底图（无文字的金色 VIP 徽章 + 桌面场景插画，新人与回归共用一张）
                 + 代码渲染的金渐变标题/副标题（两行文案随福利类型变，不能烘进图里）。
                 底图必须是 379 宽的完整卡片渲染（1137×288 @3x）。早先那版是 Figma 单独导出的
                 358 宽 Mask group —— 既短 21px，其 x≥102 区域也与设计稿里的卡片本身不一致，
                 铺上来会在右侧露出一条近黑底带（见 research/card-bg-reexport.md）。 -->
            <div class="xunyou-claim-accel__card">
              <img class="xunyou-claim-accel__card-bg" :src="cardBackground" alt="" aria-hidden="true" />
              <span class="xunyou-claim-accel__card-title">{{ text.title }}</span>
              <span class="xunyou-claim-accel__card-subtitle">{{ text.subtitle }}</span>
            </div>
          </div>

          <div class="xunyou-claim-accel__actions">
            <button
              type="button"
              class="xunyou-claim-accel__btn is-cancel"
              :disabled="claiming"
              @click.stop="handleCancel">
              <span class="xunyou-claim-accel__dots is-left" aria-hidden="true">
                <i v-for="index in 10" :key="`cancel-left-${index}`"></i>
              </span>
              <span class="xunyou-claim-accel__btn-text">取消</span>
              <span class="xunyou-claim-accel__dots is-right" aria-hidden="true">
                <span class="xunyou-claim-accel__dots-grid">
                  <i v-for="index in 10" :key="`cancel-right-${index}`"></i>
                </span>
              </span>
            </button>
            <button
              type="button"
              class="xunyou-claim-accel__btn is-confirm"
              :disabled="claiming"
              @click.stop="handleConfirm">
              <span class="xunyou-claim-accel__dots is-left" aria-hidden="true">
                <i v-for="index in 10" :key="`confirm-left-${index}`"></i>
              </span>
              <!-- 16×16 闪电（渐变 #006BFF→#00C8FF，与加速启动按钮上的那枚色值不同，是设计单独给的素材）。
                   领取中不画图标：那一刻按钮上只有「领取中…」一行字。 -->
              <img
                v-if="!claiming"
                class="xunyou-claim-accel__lightning"
                :src="lightning"
                alt=""
                aria-hidden="true" />
              <span class="xunyou-claim-accel__btn-text">{{ confirmText }}</span>
              <span class="xunyou-claim-accel__dots is-right" aria-hidden="true">
                <span class="xunyou-claim-accel__dots-grid">
                  <i v-for="index in 10" :key="`confirm-right-${index}`"></i>
                </span>
              </span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </Teleport>
</template>

<script>
import topStrip from '../image/xunyou-claim-dialog-top-strip.svg'
import cardBackground from '../image/xunyou-claim-dialog-card-bg.webp'
import lightning from '../image/xunyou-claim-dialog-lightning.svg'

/**
 * 弹窗文案（逐字取自 PRD 文案表，两套都用「您」——新人那套一度写成「你」，经确认为笔误口径：
 * 同一个弹窗两套用字不同会被用户看出来）。
 * 新人版**没有独立设计稿**：底图与回归版共用同一张（底图本身不含文字），两个变体只差
 * 代码渲染的这几行文案（提示语两行 + 卡片标题 + 卡片副标题）。
 * 提示语是**两行固定换行**（设计稿就是两段），不是自动折行。
 *
 * 文案来源：领取提醒弹窗与会员卡曾是两套文案（会员卡的福利态写「加速器VIP会员限时领」、
 * 本弹窗写「加速器新人福利限时领」，刻意不统一）。**会员卡的福利态已于 2026-09-23 按设计移除**，
 * 现在全站只有本弹窗这一处福利领取文案，不再有对齐问题。
 */
const TEXT_BY_TYPE = {
  newcomer: {
    message: ['您不是VIP会员，', '现在可以领取专属的新人福利，是否领取？'],
    title: 'Hi~我的新朋友',
    subtitle: '加速器新人福利限时领'
  },
  return: {
    message: ['您不是VIP会员，', '现在可以领取专属的回归福利，是否领取？'],
    title: 'Hi~好久不见',
    subtitle: '加速器回归福利限时领'
  }
}

// 领取中按钮文案：设计稿只有默认态（没有领取中态），实现按 PRD 只做「文字替换 + 禁用」，
// 不自行加 spinner / 骨架 / 倒计时。
const CONFIRM_TEXT_CLAIMING = '领取中…'

export default {
  name: 'XunyouClaimAccelDialog',
  emits: ['update:visible', 'cancel', 'confirm'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 当前可领福利的类型（xunyouGiftState.currentWelfareType）：newcomer 新人 / return 回归
    welfareType: {
      type: String,
      default: 'return',
      validator: value => ['newcomer', 'return'].includes(value)
    },
    // 「领取中…」态：从点「领取并加速」起，覆盖领取请求 + 5 秒等权益的整个窗口。
    // 期间两个按钮都不可点，点遮罩也不关（领取请求已在途，中途关闭会让用户以为没领到，
    // 而福利其实已经发放）。
    claiming: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      topStrip,
      cardBackground,
      lightning
    }
  },
  computed: {
    // phone → 底部抽屉；pad → 居中悬浮。按设备切而不是按屏幕方向切：
    // 设计稿给的就是「phone 竖屏抽屉 / pad 横屏居中」两个形态（PRD R1），与设备一一对应。
    isDrawer() {
      return !!this.$isPhoneDevice
    },
    text() {
      return TEXT_BY_TYPE[this.welfareType] || TEXT_BY_TYPE.return
    },
    confirmText() {
      return this.claiming ? CONFIRM_TEXT_CLAIMING : '领取并加速'
    }
  },
  methods: {
    // 取消（按钮与点遮罩同一个方法）：只关自己，不领取、不加速、不跳购买页（R2）。
    // 领取中直接忽略：按钮此时也是 disabled，点遮罩同样不关（见 claiming 的注释）。
    handleCancel() {
      if (this.claiming) return
      this.$emit('update:visible', false)
      this.$emit('cancel')
    },
    // 领取并加速：**不关自己**。领取 + 5 秒等权益的结果由调用方决定——
    // 拿到权益就关窗继续加速，5 秒没等到则关窗 + toast。这里关掉会让「领取中…」态无处可看。
    handleConfirm() {
      if (this.claiming) return
      this.$emit('confirm')
    }
  }
}
</script>

<style lang="scss" scoped>
/* 设计稿给的是 --border-subtle / --primary-dark / --text-primary 这套设计变量，本项目 scss 里
   全都没定义（全仓 grep 零命中），所以按设计稿字面值写死，不要假装有 token 可用。 */
.xunyou-claim-accel {
  position: fixed;
  inset: 0;
  /* 必须高于加速信息详情页（.accel-info 的 z-index 是 9999）与加速启动过渡覆盖层（10000 同层，
     两者不会同时出现：本弹窗只在无权益时弹，过渡覆盖层只在有权益加速时播） */
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  /* phone：底部抽屉（贴底、仅上两角 8px 圆角） */
  &.is-drawer {
    align-items: flex-end;
  }

  &__mask {
    position: absolute;
    inset: 0;
    /* 设计稿没有遮罩层（缺口），沿用同业务既有弹窗 .accel-pay-mask / XunyouConfirmDialog 的取值，
       按 PRD 决策 4 补上：点遮罩 = 取消 */
    background: rgba(0, 0, 0, 0.6);
    pointer-events: auto;
  }

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    width: 412px;
    gap: 8px;
    overflow: clip;
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: #1e232b;
    /* 设计稿节点无 effects，不要加阴影 */
    pointer-events: auto;
  }

  &.is-drawer &__panel {
    /* 抽屉必须左右铺满屏幕边界。设计稿 phone 画布是 412 宽，但真机视口更宽
       （本机 1440×3168 @520dpi → 443 CSS px），早先按「设计稿 412 即满屏宽」加的
       max-width: 412px 会把面板卡在 412，叠加父级的 justify-content: center 后
       左右各留约 15.5px 缝隙，只有视口恰好 412 时才看不出问题。
       width: 100% 本身永远不会溢出（容器是 inset: 0 的 fixed 定位），所以不需要 max-width 兜底。
       同业务的另两个底部抽屉（acceleratorInfo、AcceleratorPayDialog）也都是纯 width: 100%。 */
    width: 100%;
    border-radius: 8px 8px 0 0;
  }

  &__strip {
    display: block;
    width: 100%;
    height: auto;
  }

  /* 提示语区：设计稿 411×90、padding 16、文本节点 379×58 → 两行 16px/1.8 正好撑满内容区 */
  &__message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    height: 90px;
    padding: 16px;
    color: #eaf7ff;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.8;
    text-align: center;
  }

  &__message-line {
    white-space: nowrap;
  }

  /* 卡片区：设计稿 411×128、padding 16 → 卡片 379×96 */
  &__card-slot {
    box-sizing: border-box;
    width: 100%;
    height: 128px;
    padding: 16px;
  }

  &__card {
    position: relative;
    width: 100%;
    height: 96px;
    overflow: clip;
    border: 0.5px solid rgba(255, 255, 255, 0.24);
    border-radius: 12px;
    /* 设计稿是两层 90° 线性渐变叠加，色标首尾相同，等效纯色 */
    background: #07090d;
  }

  &__card-bg {
    position: absolute;
    left: 0;
    top: 0;
    display: block;
    /* 379×96 @3x 的完整卡片底图（含右侧光带）。cover + object-position left：
       保持插画比例、永不露卡片底色；窄屏上优先裁掉右侧而非横向压扁插画，
       在 412（设计稿宽度）上正好 1:1，不缩放也不裁切。 */
    width: 100%;
    height: 96px;
    object-fit: cover;
    object-position: left center;
  }

  /* 卡片内两行金渐变文字（设计稿两行的渐变端点色值完全相同）。
     金色渐变 + background-clip: text 是本业务已验证的写法，见 XunyouGiftClaimDialog 的 is-duration。
     line-height 用 normal：设计稿只标了文本节点的 top，按 normal 渲染出的字形位置与设计稿实测一致。 */
  &__card-title,
  &__card-subtitle {
    position: absolute;
    left: 104px;
    white-space: nowrap;
    background-image: linear-gradient(to left, rgba(255, 234, 178, 0.8) 0%, #fffed5 97.664%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__card-title {
    top: 24px;
    font-size: 16px;
    font-weight: 900;
    line-height: normal;
  }

  &__card-subtitle {
    top: 52px;
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
  }

  /* 按钮行：设计稿 411×80、padding 16、按钮 181.5×48、间隙 16。
     卡片与按钮行之间设计稿的视觉间距是 24px —— 那 24 = 面板 gap 8 + 两个 0 高度占位块各自的 8，
     这里不引入零高度占位元素，用 margin-top 表达同一结果。 */
  &__actions {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 80px;
    margin-top: 16px;
    padding: 16px;
    gap: 16px;
  }

  &__btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    height: 48px;
    padding: 0;
    overflow: hidden;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    line-height: normal;
    white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.85;
    }

    /* 「领取中…」态：设计稿未给（只有默认态），按 PRD 只做文字替换 + 禁用，不额外加动效 */
    &:disabled {
      cursor: default;
      opacity: 0.85;
    }

    &.is-cancel {
      border: 0.5px solid rgba(255, 255, 255, 0.24);
      background: rgba(245, 245, 245, 0.08);
      color: #eaf7ff;
    }

    /* 浅色渐变主按钮：与 XunyouGiftClaimDialog 的 __confirm 逐值一致，只有圆角 4 → 8 不同 */
    &.is-confirm {
      border: 0.5px solid #f5f5f5;
      background: linear-gradient(180deg, rgba(245, 245, 245, 0.48) 0%, #f5f5f5 100%);
      color: #162233;
      /* 闪电与文字的间距：设计稿里图标盒与文字盒紧邻、由文字盒自带 4px 左右内边距提供，等价于 gap */
      gap: 4px;
    }
  }

  &__lightning {
    display: block;
    width: 16px;
    height: 16px;
  }

  &__btn-text {
    position: relative;
    z-index: 1;
  }

  /* 按钮角落点阵装饰（两个按钮各有左下 + 右侧中部两组）：与 XunyouGiftClaimDialog 的 __dots 同源实现，
     2×2px、gap 1px、rgba(0,0,0,0.12)，整体 padding 8px、定位在按钮内边缘 -0.5px（描边内侧）。 */
  &__dots {
    position: absolute;
    box-sizing: border-box;
    padding: 8px;
    background: transparent;

    i {
      display: block;
      width: 2px;
      height: 2px;
      background: rgba(0, 0, 0, 0.12);
    }

    &.is-left {
      left: -0.5px;
      bottom: -0.5px;
      display: grid;
      grid-template-columns: repeat(5, 2px);
      grid-auto-rows: 2px;
      gap: 1px;
      width: 30px;
      height: 21px;
    }

    &.is-right {
      right: -0.5px;
      top: 50%;
      display: block;
      width: 21px;
      height: 30px;
      transform: translateY(-50%);
      overflow: visible;
    }
  }

  &__dots-grid {
    position: absolute;
    left: 50%;
    top: 50%;
    display: grid;
    grid-template-columns: repeat(5, 2px);
    grid-auto-rows: 2px;
    gap: 1px;
    width: 30px;
    height: 21px;
    padding: 8px;
    box-sizing: border-box;
    transform: translate(-50%, -50%) rotate(90deg);

    i {
      display: block;
      width: 2px;
      height: 2px;
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

/* 入场/退场：遮罩淡入，弹窗本身 0.24s（设计稿未给动效，沿用同业务既有弹窗的节奏）。
   两种形态的入场位移不同：抽屉从屏幕底部上滑，居中弹窗轻微缩放浮现。 */
.xunyou-claim-accel-fade-enter-active,
.xunyou-claim-accel-fade-leave-active {
  transition: opacity 0.24s ease;
}

.xunyou-claim-accel-fade-enter-from,
.xunyou-claim-accel-fade-leave-to {
  opacity: 0;
}

.xunyou-claim-accel-pop-enter-active,
.xunyou-claim-accel-pop-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.xunyou-claim-accel-pop-enter-from,
.xunyou-claim-accel-pop-leave-to {
  opacity: 0;
}

.xunyou-claim-accel.is-center .xunyou-claim-accel-pop-enter-from,
.xunyou-claim-accel.is-center .xunyou-claim-accel-pop-leave-to {
  transform: scale(0.94);
}

.xunyou-claim-accel.is-drawer .xunyou-claim-accel-pop-enter-from,
.xunyou-claim-accel.is-drawer .xunyou-claim-accel-pop-leave-to {
  transform: translateY(100%);
}
</style>

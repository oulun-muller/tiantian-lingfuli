<template>
  <div class="welfare-detail" :class="isLandscape ? 'is-landscape' : 'is-portrait'">
    <header class="welfare-detail__bar">
      <button type="button" class="welfare-detail__back" aria-label="返回" @click="goBack">
        <img :src="backIcon" alt="" />
      </button>
      <h1 class="welfare-detail__title">福利详情</h1>
    </header>

    <p v-if="loading" class="welfare-detail__hint">加载中…</p>
    <p v-else-if="error" class="welfare-detail__hint">{{ error }}</p>
    <div v-else-if="detail" class="welfare-detail__body">
      <div class="welfare-detail__cover">
        <img
          :src="detail.imageUrl || fallbackImg"
          alt=""
          @error="onImgError" />
      </div>

      <ul class="welfare-detail__rows">
        <li class="welfare-detail__row">
          <span class="welfare-detail__label">奖品：</span>
          <span class="welfare-detail__value">{{ detail.resourceName || '—' }}</span>
        </li>

        <!-- 虚拟码：紧接奖品展示兑换码，可复制（稿 47:6223/47:5910 行序） -->
        <li v-if="couponCode" class="welfare-detail__row">
          <span class="welfare-detail__label">优惠码：</span>
          <span class="welfare-detail__value welfare-detail__value--code">
            <span>{{ couponCode }}</span>
            <button
              type="button"
              class="welfare-detail__copy"
              aria-label="复制优惠码"
              @click="copyCode">
              <img :src="copyIcon" alt="" />
            </button>
          </span>
        </li>

        <li class="welfare-detail__row">
          <span class="welfare-detail__label">兑换有效期至：</span>
          <span class="welfare-detail__value">{{ formatTime(detail.expireTime) }}</span>
        </li>
        <li class="welfare-detail__row">
          <span class="welfare-detail__label">领取时间：</span>
          <span class="welfare-detail__value">{{ formatTime(detail.receiveTime) }}</span>
        </li>

        <!-- 实物：未填地址为红色填写入口，已填为「查看」入口 -->
        <li v-if="isPhysical" class="welfare-detail__row">
          <span class="welfare-detail__label">邮寄地址：</span>
          <button
            type="button"
            class="welfare-detail__action"
            @click="openSheet">
            <span
              class="welfare-detail__action-text"
              :class="{ 'welfare-detail__action-text--prompt': !detail.address }">
              {{ detail.address ? '查看' : '请填写邮寄地址' }}
            </span>
            <img class="welfare-detail__action-arrow" :src="chevronIcon" alt="" />
          </button>
        </li>

        <!-- 直充：未填账号时展示填写入口 -->
        <li v-if="isDirect" class="welfare-detail__row">
          <span class="welfare-detail__label">充值账号：</span>
          <button
            v-if="!detail.account"
            type="button"
            class="welfare-detail__action"
            @click="openSheet">
            <span class="welfare-detail__action-text welfare-detail__action-text--prompt">请填写充值账号</span>
            <img class="welfare-detail__action-arrow" :src="chevronIcon" alt="" />
          </button>
          <span v-else class="welfare-detail__value">{{ detail.account }}</span>
        </li>
      </ul>

      <div class="welfare-detail__divider" aria-hidden="true" />

      <section class="welfare-detail__guide">
        <h2 class="welfare-detail__guide-title">兑换说明</h2>
        <p class="welfare-detail__guide-text"><template v-for="(seg, index) in guideSegments" :key="index"><a v-if="seg.url" class="welfare-detail__link" :href="seg.url" rel="noopener noreferrer" @click.prevent="openLink(seg.url)">{{ seg.text }}</a><span v-else>{{ seg.text }}</span></template></p>
      </section>
    </div>

    <div v-if="sheetVisible" class="welfare-detail__mask" @click.self="closeSheet">
      <div class="welfare-detail__sheet" role="dialog" aria-modal="true" :aria-label="sheetTitle">
        <div class="welfare-detail__sheet-head">
          <h2 class="welfare-detail__sheet-title">{{ sheetTitle }}</h2>
          <button type="button" class="welfare-detail__sheet-close" aria-label="关闭" @click="closeSheet">
            <img :src="closeIcon" alt="" />
          </button>
        </div>

        <div class="welfare-detail__sheet-body" :class="{ 'welfare-detail__sheet-body--physical': isPhysical }">
          <template v-if="isPhysical">
            <!-- 查看态：只读展示已提交的收货信息 -->
            <template v-if="sheetReadonly">
              <div class="welfare-detail__field">
                <span class="welfare-detail__field-label">收货人</span>
                <span class="welfare-detail__field-value">{{ detail.receiverName || '—' }}</span>
              </div>
              <div class="welfare-detail__field">
                <span class="welfare-detail__field-label">手机号</span>
                <span class="welfare-detail__field-value">{{ detail.receiverPhone || '—' }}</span>
              </div>
              <div class="welfare-detail__field welfare-detail__field--block">
                <span class="welfare-detail__field-label">收货地址</span>
                <div class="welfare-detail__address-box welfare-detail__address-box--readonly">
                  {{ detail.address || '—' }}
                </div>
              </div>
            </template>

            <!-- 填写态：可编辑 -->
            <template v-else>
              <label class="welfare-detail__field">
                <span class="welfare-detail__field-label">收货人</span>
                <input
                  v-model.trim="form.receiverName"
                  type="text"
                  placeholder="填写收货人姓名" />
              </label>
              <label class="welfare-detail__field" :class="{ 'is-invalid': !!phoneError }">
                <span class="welfare-detail__field-label">手机号</span>
                <span class="welfare-detail__field-control">
                  <input
                    v-model.trim="form.receiverPhone"
                    type="tel"
                    inputmode="tel"
                    maxlength="11"
                    placeholder="填写收货人手机号"
                    @input="phoneError = ''" />
                  <span v-if="phoneError" class="welfare-detail__field-error">{{ phoneError }}</span>
                </span>
              </label>
              <label class="welfare-detail__field welfare-detail__field--block">
                <span class="welfare-detail__field-label">收货地址</span>
                <textarea
                  v-model.trim="form.address"
                  placeholder="请输入详细地址，如城市、街道、乡镇、小区、门牌号等" />
              </label>
            </template>
          </template>

          <template v-else>
            <label class="welfare-detail__field welfare-detail__field--block">
              <textarea
                v-model.trim="form.account"
                placeholder="请输入充值账号" />
            </label>
          </template>
        </div>

        <div v-if="!sheetReadonly" class="welfare-detail__sheet-submit">
          <button type="button" :disabled="submitting" @click="onSubmit">
            {{ submitting ? '提交中…' : '提交' }}
          </button>
        </div>
        <!-- 查看态：按稿 397:16438 保留与原提交区同高的留白，弹层高度与填写态一致 -->
        <div v-else class="welfare-detail__sheet-spacer" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script>
import { getPrizeDetail, redeemWelfare } from '@/api/welfare'
import { installWelfareClusterBack, uninstallWelfareClusterBack } from '@/utils/welfareClusterBack'
import { openExternalUrl } from '@/nativeApiPad/common'
import fallbackImg from './image/mock-prize.png'
import backIcon from './image/icon-back.svg'
import copyIcon from './image/icon-copy.svg'
import closeIcon from './image/icon-close-small.svg'
import chevronIcon from './image/icon-chevron-right.svg'

const DEFAULT_GUIDE =
  '在联想官方商城（https://shop.lenovo.com.cn/）对应商品结算页面-使用优惠-优惠码，输入优惠码即可使用'

// 只识别 http/https，避免 javascript:、data: 这类协议被渲染成可点元素
const GUIDE_URL_PATTERN = /https?:\/\/[^\s<>"'）)，。；：！？、】]+/g
// 句末标点常紧贴链接，需从 href 末尾剥掉并留回正文
const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?]+$/

/**
 * 把兑换说明切成「纯文本 / 链接」片段，供模板安全渲染（不经过 v-html）。
 *
 * @param {string} text 后台「使用说明」原文
 * @returns {Array<{text: string, url: string}>} url 为空表示纯文本片段
 */
function splitGuideText(text) {
  const segments = []
  const pattern = new RegExp(GUIDE_URL_PATTERN.source, 'g')
  let lastIndex = 0
  let match = pattern.exec(text)
  while (match) {
    const raw = match[0]
    const url = raw.replace(TRAILING_PUNCTUATION_PATTERN, '')
    if (!url) {
      match = pattern.exec(text)
      continue
    }
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), url: '' })
    }
    segments.push({ text: url, url })
    // 被剥掉的标点原样留回正文，避免「链接。一句话」丢失句号
    const trailing = raw.slice(url.length)
    if (trailing) {
      segments.push({ text: trailing, url: '' })
    }
    lastIndex = match.index + raw.length
    match = pattern.exec(text)
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), url: '' })
  }
  return segments
}

export default {
  name: 'WelfareDetail',
  data() {
    return {
      fallbackImg,
      backIcon,
      copyIcon,
      closeIcon,
      chevronIcon,
      loading: false,
      submitting: false,
      error: '',
      detail: null,
      sheetVisible: false,
      sheetReadonly: false,
      phoneError: '',
      isLandscape: false,
      form: { receiverName: '', receiverPhone: '', address: '', account: '' }
    }
  },
  computed: {
    isPhysical() {
      return this.detail?.resourceType === 1
    },
    isDirect() {
      return this.detail?.resourceType === 3
    },
    couponCode() {
      const d = this.detail
      if (!d) return ''
      return d.code || d.couponCode || d.cdKey || d.redeemCode || ''
    },
    sheetTitle() {
      return this.isPhysical ? '邮寄地址' : '充值账号'
    },
    guideSegments() {
      // 兑换说明取后台「使用说明」字段，不使用「资源描述」。
      // 正文按「纯文本片段 + 可点链接片段」渲染，不用 v-html：既避免注入面，
      // 又保留后台文本框里的换行与长按选中复制。
      const raw =
        this.detail?.usageInstruction
        || this.detail?.redeemGuide
        || this.detail?.exchangeDesc
        || DEFAULT_GUIDE
      return splitGuideText(String(raw))
    },
    isApp() {
      return !!this.$store?.state?.system?.version
    },
    userInfo() {
      return this.$store?.state?.user?.userInfo
    },
    channelUserInfo() {
      return this.$store?.state?.channelInfo?.channelUserInfo
    }
  },
  mounted() {
    this.$emit('headerStatus', false)
    this.notifyHideTab()
    this.syncOrientation()
    window.addEventListener('resize', this.syncOrientation)
    window.addEventListener('orientationchange', this.syncOrientation)
    installWelfareClusterBack({
      isClusterSubPage: () => true,
      vueBack: () => this.goBack()
    })
    this.fetchDetail()
  },
  beforeUnmount() {
    uninstallWelfareClusterBack()
    window.removeEventListener('resize', this.syncOrientation)
    window.removeEventListener('orientationchange', this.syncOrientation)
  },
  methods: {
    syncOrientation() {
      this.isLandscape = window.matchMedia('(orientation: landscape)').matches
    },
    notifyHideTab() {
      if (!window.LegionZoneMobile?.nativeCall) return
      window.LegionZoneMobile
        .nativeCall('LegionZone', 'notifyH5Route', {
          path: this.$route.fullPath || this.$route.path,
          hideMainTab: true
        })
        .catch(() => {})
    },
    goBack() {
      const hasPrev = window.history.state && window.history.state.back != null
      if (hasPrev) {
        this.$router.back()
        return
      }
      const query = { tab: 'prizes' }
      if (this.$route.query.from === 'mine') {
        query.from = 'mine'
      }
      this.$router.replace({ path: '/gameCenter/welfareCenter', query })
    },
    async fetchDetail() {
      const recordId = this.$route.query.recordId
      if (!recordId) {
        this.error = '缺少福利单号'
        return
      }
      this.loading = true
      this.error = ''
      try {
        this.detail = await getPrizeDetail({ recordId })
        this.syncFormFromDetail()
        // 福利详情页面曝光（兑换码/直充/实物三种类型均上报）
        this.reportDetail('LZ_welfareDetailPageShow', 'pv')
      } catch (e) {
        this.detail = null
        this.error = e?.message || '加载失败'
      } finally {
        this.loading = false
      }
    },
    /** 已填过的信息回填弹层，便于用户查看或在未提交前继续编辑 */
    syncFormFromDetail() {
      const d = this.detail
      if (!d) return
      this.form.receiverName = d.receiverName || ''
      this.form.receiverPhone = d.receiverPhone || ''
      this.form.address = d.address || ''
      this.form.account = d.account || ''
    },
    formatTime(raw) {
      if (!raw) return '—'
      const s = String(raw).trim()
      // 2026-09-08 09:01:00 → 2026-9-8  09:01（稿风格，秒可略）
      const m = s.match(/^(\d{4})-0?(\d{1,2})-0?(\d{1,2})\s+(\d{1,2}:\d{2})/)
      if (m) return `${m[1]}-${m[2]}-${m[3]}  ${m[4]}`
      return s
    },
    /**
     * 打开兑换说明里的链接。
     *
     * App 内必须交给原生桥接走系统浏览器：内嵌 WebView 里点击 a 标签（含 target="_blank"）
     * 只会让 WebView 自己跳转，表现为「在本地开了个页面」，这正是此前取消链接识别的原因。
     */
    openLink(url) {
      if (!url) return
      if (this.isApp && window.LegionZoneMobile?.nativeCall) {
        openExternalUrl(url)
        return
      }
      // 端外浏览器：优先新开标签页；Safari 在非用户手势下会拦截并返回 null，降级当前窗口跳转
      const win = window.open(url, '_blank', 'noopener,noreferrer')
      if (!win) {
        window.location.href = url
      }
    },
    /** 已提交邮寄信息时打开只读查看态，否则打开填写态 */
    openSheet() {
      if (!this.detail) return
      this.phoneError = ''
      this.sheetReadonly = this.isPhysical && !!this.detail.address
      this.sheetVisible = true
    },
    closeSheet() {
      if (this.submitting) return
      this.sheetVisible = false
    },
    async copyCode() {
      const text = this.couponCode
      if (!text) return
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.setAttribute('readonly', '')
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
        }
        this.$successMessage?.('复制成功')
      } catch (e) {
        this.$errorMessage?.(e?.message || '复制失败')
      }
    },
    /** 福利详情埋点：业务参数放 detail JSON */
    reportDetail(action, label) {
      const report = this[this.isApp ? '$dataReport' : '$trackEvent']
      if (typeof report !== 'function') return
      report.call(this, 'LZ_benefitsCenter', action, label, {
        detail: JSON.stringify({
          benefitsID: this.detail?.activityItemId,
          benefitsName: this.detail?.resourceName,
          lid: this.userInfo?.UserID || this.channelUserInfo?.UserId || ''
        })
      })
    },
    validate() {
      if (this.isPhysical) {
        if (!this.form.receiverName) {
          this.$warningMessage?.('请输入收货人')
          return false
        }
        if (!this.form.receiverPhone) {
          this.$warningMessage?.('请输入收货人手机号')
          return false
        }
        if (!/^1[3-9]\d{9}$/.test(this.form.receiverPhone)) {
          // 按稿 397:16276 在手机号行内提示
          this.phoneError = '请核对手机号码'
          return false
        }
        if (!this.form.address) {
          this.$warningMessage?.('请输入详细地址')
          return false
        }
        return true
      }
      if (!this.form.account) {
        this.$warningMessage?.('请输入充值账号')
        return false
      }
      return true
    },
    async onSubmit() {
      if (!this.detail || this.submitting || this.sheetReadonly) return
      if (!this.validate()) return
      if (this.isPhysical) {
        // 福利详情-提交邮寄地址点击
        this.reportDetail('LZ_welfareDetailMailingAddressSubmitClick', 'click')
      } else {
        // 福利详情-提交充值账号点击
        this.reportDetail('LZ_welfareDetailRechargeAccountSubmitClick', 'click')
      }
      this.submitting = true
      try {
        await redeemWelfare({
          recordId: this.detail.recordId,
          receiverName: this.form.receiverName,
          receiverPhone: this.form.receiverPhone,
          address: this.form.address,
          account: this.form.account
        })
        this.$successMessage?.('提交成功')
        this.sheetVisible = false
        await this.fetchDetail()
      } catch (e) {
        this.$errorMessage?.(e?.message || '提交失败')
      } finally {
        this.submitting = false
      }
    },
    onImgError(e) {
      if (e?.target) e.target.src = this.fallbackImg
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-detail {
  min-height: 100vh;
  background: #121212;
  color: #eaf7ff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  animation: welfare-page-fade-in 0.2s ease;
}
.welfare-detail__bar {
  display: flex;
  align-items: center;
  height: 56px;
  flex-shrink: 0;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: #121212;
}
.welfare-detail__back {
  width: 56px;
  height: 56px;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 24px;
    height: 24px;
    display: block;
  }
}
.welfare-detail__title {
  flex: 1;
  margin: 0;
  color: #f5f5f5;
  font-size: 18px;
  font-weight: 500;
  line-height: 29px;
  text-align: left;
}
.welfare-detail__hint {
  margin: 24px 16px;
  color: rgba(234, 247, 255, 0.6);
  font-size: 14px;
}
.welfare-detail__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 0;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}
/* 横屏稿 47:6223：内容区 max-width 840，整页居中 */
.welfare-detail.is-landscape .welfare-detail__body {
  max-width: 840px;
}
.welfare-detail__cover {
  width: 140px;
  height: 140px;
  overflow: hidden;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}
/* 横屏稿 47:6223：封面为 140 圆角底板 + 内缩约 97px 的图标 */
.welfare-detail.is-landscape .welfare-detail__cover {
  box-sizing: border-box;
  padding: 21px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}
.welfare-detail__rows {
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
}
.welfare-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  height: 48px;
  padding: 0 16px;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 18.62px;
}
.welfare-detail__label {
  flex-shrink: 0;
  color: rgba(234, 247, 255, 0.6);
  white-space: nowrap;
}
.welfare-detail__value {
  color: #eaf7ff;
  text-align: right;
  word-break: break-all;
}
.welfare-detail__value--code {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.welfare-detail__copy {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  flex-shrink: 0;
  img {
    width: 18px;
    height: 18px;
    display: block;
  }
}
.welfare-detail__action {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  line-height: inherit;
  cursor: pointer;
}
.welfare-detail__action-text {
  color: #eaf7ff;
  text-align: right;
  &--prompt {
    color: #ff7a7a;
  }
}
.welfare-detail__action-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: block;
}
.welfare-detail__divider {
  width: calc(100% - 32px);
  height: 0;
  border-top: 0.5px solid rgba(255, 255, 255, 0.12);
}
.welfare-detail__guide {
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.welfare-detail__guide-title {
  margin: 0;
  color: rgba(234, 247, 255, 0.6);
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
}
.welfare-detail__guide-text {
  margin: 0;
  color: #eaf7ff;
  font-size: 14px;
  line-height: 21px;
  word-break: break-word;
  /* 保留后台文本框里输入的换行与空格（运营直接回车换行），同时仍然正常折行；
     这里是纯文本渲染，所以只能靠 \n 换行，写 <br/> 只会原样显示 */
  white-space: pre-wrap;
  /* 全局 reset 对 html/body 设了 user-select: none，这里显式放开，支持长按选中复制 */
  -webkit-user-select: text;
  user-select: text;
}

/* 说明正文里的链接：点击交给系统浏览器打开，无需下划线，颜色与稿一致 */
.welfare-detail__link {
  color: #6ba3ff;
  text-decoration: none;
  cursor: pointer;
}

/* 竖屏底部弹层；横屏稿 400:16853 为居中 600×419 模态框 */
.welfare-detail__mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.welfare-detail__sheet {
  width: 100%;
  background: #1e232b;
  /* 竖屏稿 391:16204：仅上方两角 8px 圆角；底部弹层不加描边 */
  border-radius: 8px 8px 0 0;
  display: flex;
  flex-direction: column;
  animation: welfare-sheet-up 0.2s ease;
}
.welfare-detail.is-landscape .welfare-detail__mask {
  justify-content: center;
}
.welfare-detail.is-landscape .welfare-detail__sheet {
  width: 600px;
  /* 横屏稿 400:16853 居中模态框保留 0.5px 描边 */
  border: 0.5px solid #39404d;
  border-radius: 8px;
  animation: welfare-dialog-in 0.2s ease;
}
.welfare-detail__sheet-head {
  height: 48px;
  flex-shrink: 0;
  padding: 0 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  border-bottom: 0.5px solid #39404d;
}
.welfare-detail__sheet-title {
  margin: 0;
  color: #eaf7ff;
  font-size: 16px;
  font-weight: 600;
  line-height: 21.28px;
}
.welfare-detail__sheet-close {
  width: 32px;
  height: 32px;
  margin-right: -8px;
  padding: 0;
  border: 0;
  background: transparent;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 20px;
    height: 20px;
    display: block;
  }
}
.welfare-detail__sheet-body {
  width: 100%;
  box-sizing: border-box;
}
/* 实物三行表单与 397:16276 保持同高，直充只有一行输入、按内容自适应 */
.welfare-detail__sheet-body--physical {
  min-height: 285px;
}
.welfare-detail__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  height: 56px;
  padding: 0 16px;
  box-sizing: border-box;
  color: #eaf7ff;
  font-size: 14px;
  line-height: 18.62px;
}
.welfare-detail__field-label {
  flex-shrink: 0;
  color: #eaf7ff;
}
.welfare-detail__field-value {
  color: #eaf7ff;
  text-align: right;
  word-break: break-all;
}
.welfare-detail__field-control {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.welfare-detail__field-error {
  color: #ff9940;
  font-size: 12px;
  line-height: 15.96px;
  text-align: right;
}
.welfare-detail__field input {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: #eaf7ff;
  font-family: inherit;
  font-size: 14px;
  line-height: 18.62px;
  text-align: right;
  outline: none;
  &::placeholder {
    color: rgba(234, 247, 255, 0.48);
  }
}
.welfare-detail__field--block {
  flex-direction: column;
  align-items: stretch;
  height: auto;
  gap: 16px;
  padding: 16px;
}
.welfare-detail__field--block textarea {
  width: 100%;
  height: 100px;
  padding: 8px;
  border: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  box-sizing: border-box;
  color: #eaf7ff;
  font-family: inherit;
  font-size: 14px;
  line-height: 21px;
  resize: none;
  outline: none;
  &::placeholder {
    color: rgba(234, 247, 255, 0.48);
  }
}
.welfare-detail__address-box {
  width: 100%;
  height: 100px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  box-sizing: border-box;
  color: #eaf7ff;
  font-size: 14px;
  line-height: 21px;
  word-break: break-word;
  overflow-y: auto;
}
.welfare-detail__sheet-spacer {
  height: 86px;
  flex-shrink: 0;
}
.welfare-detail__sheet-submit {
  /* 上与左右均为 16px：稿 397:16276 中提交区高 86（16 + 54 + 16） */
  padding: 16px;
  box-sizing: border-box;
  button {
    width: 100%;
    height: 54px;
    border: 0;
    border-radius: 4px;
    background: #386efe;
    color: #eaf7ff;
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
    &:disabled {
      opacity: 0.6;
    }
  }
}

@keyframes welfare-page-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes welfare-sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes welfare-dialog-in {
  from { transform: scale(0.96); }
  to { transform: scale(1); }
}
</style>

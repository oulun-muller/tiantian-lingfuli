<template>
  <div class="welfare-rules" :class="isLandscape ? 'is-landscape' : 'is-portrait'">
    <p v-if="loading" class="welfare-rules__hint">加载中…</p>
    <p v-else-if="error" class="welfare-rules__hint">{{ error }}</p>
    <div v-else class="welfare-rules__scroll">
      <article
        class="welfare-rules__body"
        :class="{ 'is-empty': !html }"
        v-html="html || emptyHtml" />
    </div>
  </div>
</template>

<script>
import { getConfigByKey } from '@/api'

const CONFIG_KEY = 'WELFARE_RULES'
const EMPTY_HTML = '<p class="welfare-rules__empty">暂无规则说明</p>'

/** 去掉危险标签与内联事件，保留常见富文本 */
function sanitizeRulesHtml(html) {
  return String(html)
    .replace(/<\/?(script|iframe|object|embed|link|meta|form|input|button)[^>]*>/gi, '')
    .replace(/\s+on\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
}

/** 纯文本：转义 + 换行 + 链接可点 */
function plainTextToHtml(text) {
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const linked = escaped.replace(
    /(https?:\/\/[^\s）\]>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  return linked
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/**
 * 配置中心可能回：纯 HTML、纯文本、JSON 包一层、或实体编码过的 HTML。
 */
export function parseWelfareRulesHtml(raw) {
  let value = String(raw ?? '').trim()
  if (!value) return ''

  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']')) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'string') {
        value = parsed.trim()
      } else if (Array.isArray(parsed)) {
        value = parsed
          .map((row) => {
            if (typeof row === 'string') return row
            if (row && typeof row === 'object') {
              return row.html || row.content || row.rule || row.text || row.title || ''
            }
            return ''
          })
          .filter(Boolean)
          .join('\n\n')
          .trim()
      } else if (parsed && typeof parsed === 'object') {
        value = String(
          parsed.html || parsed.content || parsed.rule || parsed.text || parsed.value || ''
        ).trim()
      }
    } catch (e) {
      /* 不是 JSON 就按原文处理 */
    }
  }

  if (!value) return ''

  // CMS 偶发二次实体编码：&lt;p&gt;...
  if (/&lt;\/?[a-z]/i.test(value) && !/<[a-z]/i.test(value)) {
    value = value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
  }

  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(value)
  if (looksHtml) return sanitizeRulesHtml(value)
  return plainTextToHtml(value)
}

/** 规则正文：由福利中心 tab=rules 承载，进出交互与「我的福利」一致 */
export default {
  name: 'WelfareRules',
  data() {
    return {
      loading: false,
      error: '',
      html: '',
      emptyHtml: EMPTY_HTML,
      isLandscape: false
    }
  },
  mounted() {
    this.syncOrientation()
    window.addEventListener('resize', this.syncOrientation)
    window.addEventListener('orientationchange', this.syncOrientation)
    this.fetchRules()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.syncOrientation)
    window.removeEventListener('orientationchange', this.syncOrientation)
  },
  methods: {
    syncOrientation() {
      this.isLandscape =
        window.matchMedia('(orientation: landscape)').matches ||
        window.innerWidth > window.innerHeight
    },
    async fetchRules() {
      this.loading = true
      this.error = ''
      try {
        const value = await getConfigByKey(CONFIG_KEY)
        this.html = parseWelfareRulesHtml(value)
      } catch (e) {
        this.html = ''
        this.error = e?.message || '加载失败'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* 稿 328:15336 竖屏 / 329:15425 横屏：深色平铺，无卡片底 */
.welfare-rules {
  flex: 1;
  min-height: 0;
  background: #121212;
  color: rgba(245, 245, 245, 0.72);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.welfare-rules__hint {
  margin: 24px 16px;
  color: rgba(245, 245, 245, 0.6);
  font-size: 14px;
}

.welfare-rules__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 16px;
  box-sizing: border-box;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
}

.welfare-rules__body {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  color: rgba(245, 245, 245, 0.72);
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
  overflow-wrap: anywhere;

  &.is-empty {
    padding: 24px 0;
    text-align: center;
  }

  :deep(.welfare-rules__empty) {
    margin: 0;
    color: rgba(245, 245, 245, 0.45);
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin: 8px 0 0;
    color: #f5f5f5;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.8;
  }
  :deep(h1:first-child),
  :deep(h2:first-child),
  :deep(h3:first-child),
  :deep(h4:first-child) {
    margin-top: 0;
  }

  :deep(p) {
    margin: 0 0 8px;
  }
  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 8px;
    padding-left: 1.35em;
  }
  :deep(ul) { list-style: disc; }
  :deep(ol) { list-style: decimal; }
  :deep(li) {
    margin: 0;
    line-height: 1.8;
  }
  :deep(li > p) {
    margin: 0;
  }

  :deep(strong),
  :deep(b) {
    color: #f5f5f5;
    font-weight: 700;
  }
  :deep(em),
  :deep(i) {
    font-style: italic;
  }

  :deep(a) {
    color: #6ba3ff;
    text-decoration: none;
    word-break: break-all;
    &:active {
      opacity: 0.85;
    }
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 12px 0;
    border-radius: 8px;
  }

  :deep(blockquote) {
    margin: 8px 0;
    padding: 10px 12px;
    border-left: 3px solid rgba(80, 127, 254, 0.7);
    background: rgba(80, 127, 254, 0.08);
    color: rgba(245, 245, 245, 0.75);
  }

  :deep(hr) {
    margin: 16px 0;
    border: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
  }

  :deep(table) {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;
    font-size: 13px;
  }
  :deep(th),
  :deep(td) {
    padding: 8px 10px;
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    text-align: left;
    vertical-align: top;
  }
  :deep(th) {
    background: rgba(255, 255, 255, 0.06);
    color: #f5f5f5;
    font-weight: 700;
  }

  :deep(code) {
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 12px;
  }
}

/* 横屏：同一套排版，仅放宽左右留白 */
.welfare-rules.is-landscape {
  .welfare-rules__scroll {
    padding: 16px 24px 32px;
  }
  /* 稿 329:15425：宽屏下正文居中限宽，避免铺满整屏 */
  .welfare-rules__body {
    max-width: 840px;
    margin: 0 auto;
  }
}
</style>

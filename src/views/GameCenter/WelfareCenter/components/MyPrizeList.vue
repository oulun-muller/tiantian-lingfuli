<template>
  <section class="my-prize" :class="landscape ? 'is-landscape' : 'is-portrait'">
    <!-- 竖屏：顶栏 Tab；横屏：左侧栏 Tab -->
    <nav class="my-prize__tabs" aria-label="福利状态">
      <button
        type="button"
        :class="['my-prize__tab', { active: activeTab === 'unexpired' }]"
        @click="switchTab('unexpired')">
        可兑换
      </button>
      <button
        type="button"
        :class="['my-prize__tab', { active: activeTab === 'expired' }]"
        @click="switchTab('expired')">
        已过期
      </button>
    </nav>

    <div ref="scrollContainer" class="my-prize__main" @scroll.passive="onScroll">
      <div v-if="loading" class="my-prize__placeholder">加载中…</div>
      <div v-else-if="!loggedIn" class="my-prize__placeholder">
        请登录后查看
      </div>
      <div v-else-if="!list.length" class="my-prize__placeholder">
        {{ activeTab === 'unexpired' ? '暂无可兑换的福利' : '暂无已过期的福利' }}
      </div>
      <ul v-else class="my-prize__list">
        <li
          v-for="item in list"
          :key="item.recordId"
          class="prize-card"
          :class="{ 'is-expired': item.expired || activeTab === 'expired' }"
          @click="onViewDetail(item)">
          <div class="prize-card__thumb">
            <img
              :src="item.imageUrl || fallbackImg"
              alt=""
              @error="onImgError($event)" />
          </div>
          <div class="prize-card__info">
            <p class="prize-card__name">{{ item.resourceName }}</p>
            <p class="prize-card__expire">
              <span>兑换有效期至：</span>
              <span>{{ formatExpire(item.expireTime) }}</span>
            </p>
          </div>
        </li>
      </ul>
      <div v-if="loadingMore" class="my-prize__load-more">加载中…</div>
    </div>
  </section>
</template>

<script>
import { getPrizeList } from '@/api/welfare'
import { ensureWelfareLogin, isWelfareLoggedIn } from '../welfareAuth'
import fallbackImg from '../image/mock-prize.png'
import {
  reportWelfarePv,
  reportWelfareClick,
  reportWelfareFail,
  benefitsDetail,
  loadErrorType
} from '@/utils/welfareTrack'

export default {
  name: 'MyPrizeList',
  props: {
    landscape: { type: Boolean, default: false }
  },
  emits: ['detail'],
  data() {
    return {
      activeTab: 'unexpired',
      loading: false,
      loadingMore: false,
      list: [],
      current: 1,
      pageSize: 20,
      pages: 1,
      requestId: 0,
      fallbackImg,
      reportedPageShow: false,
      reportedDisplayFail: false
    }
  },
  computed: {
    loggedIn() {
      return isWelfareLoggedIn()
    }
  },
  errorCaptured() {
    if (!this.list.length || this.reportedDisplayFail) return false
    this.reportedDisplayFail = true
    reportWelfareFail(this, 'LZ_welfareMyRewardsLoadState', { errorType: 'loadFail' })
    return false
  },
  async mounted() {
    await this.fetchList()
    this.reportPageShow()
  },
  watch: {
    '$store.state.user.userInfo'(val) {
      if (val?.Token && !this.loading && !this.loadingMore) {
        this.fetchList(true)
      }
    }
  },
  methods: {
    reportPageShow() {
      reportWelfarePv(this, 'LZ_welfareMyRewardsPageShow', {
        tabType: this.activeTab
      })
      this.reportedPageShow = true
    },
    async switchTab(tab) {
      if (tab === this.activeTab) return
      this.activeTab = tab
      this.current = 1
      this.pages = 1
      reportWelfareClick(this, 'LZ_welfareMyRewardsTabClick', { tabType: tab })
      reportWelfarePv(this, 'LZ_welfareMyRewardsPageShow', { tabType: tab })
      await this.fetchList(true)
      this.$refs.scrollContainer?.scrollTo({ top: 0 })
    },
    async fetchList(reset = true) {
      if (this.loadingMore || (this.loading && !reset)) return
      if (!ensureWelfareLogin()) {
        this.list = []
        this.loading = false
        this.loadingMore = false
        return
      }
      const requestId = ++this.requestId
      const tab = this.activeTab
      const page = reset ? 1 : this.current + 1
      if (reset) this.loading = true
      else this.loadingMore = true
      try {
        const data = await getPrizeList({
          expired: tab === 'expired',
          current: page,
          size: this.pageSize
        })
        if (requestId !== this.requestId || tab !== this.activeTab) return
        const records = data?.records
        if (records != null && !Array.isArray(records)) {
          if (reset) this.list = []
          reportWelfareFail(this, 'LZ_welfareMyRewardsLoadState', {
            errorType: 'loadFail'
          })
          return
        }
        const nextRecords = records || []
        this.list = reset ? nextRecords : [...this.list, ...nextRecords]
        this.current = page
        this.pages = Number(data?.pages) || 1
      } catch (e) {
        if (requestId !== this.requestId || tab !== this.activeTab) return
        if (reset) this.list = []
        reportWelfareFail(this, 'LZ_welfareMyRewardsLoadState', {
          errorType: loadErrorType(e, false)
        })
      } finally {
        if (requestId === this.requestId) {
          this.loading = false
          this.loadingMore = false
        }
      }
    },
    onScroll(event) {
      const target = event?.target
      if (!target || this.current >= this.pages || this.loading || this.loadingMore) return
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
        this.fetchList(false)
      }
    },
    formatExpire(raw) {
      if (!raw) return '—'
      return String(raw).replace('T', ' ').slice(0, 16)
    },
    onViewDetail(item) {
      if (item.expired || this.activeTab === 'expired') return
      reportWelfareClick(this, 'LZ_welfareMyRewardsItemClick', {
        detail: benefitsDetail(item, {}, this)
      })
      this.$emit('detail', item)
    },
    onImgError(e) {
      if (e?.target) e.target.src = this.fallbackImg
    }
  }
}
</script>

<style lang="scss" scoped>
.my-prize {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #121212;
  color: #f5f5f5;
  box-sizing: border-box;
}

/* —— 竖屏：顶栏 Tab —— */
.my-prize.is-portrait {
  .my-prize__tabs {
    display: flex;
    height: 56px;
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }
  .my-prize__tab {
    flex: 1;
    height: 100%;
    border: 0;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: rgba(245, 245, 245, 0.72);
    font-size: 16px;
    backdrop-filter: blur(10px);
    &.active {
      color: #507ffe;
      font-weight: 500;
      font-size: 18px;
      border-bottom-color: #507ffe;
    }
  }
  .my-prize__main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  .my-prize__list {
    max-width: 800px;
    margin: 0 auto;
  }
  .prize-card {
    max-width: 800px;
  }
}

/* —— 横屏：左侧 Tab + 右侧列表 —— */
.my-prize.is-landscape {
  flex-direction: row;
  align-items: stretch;
  .my-prize__tabs {
    display: flex;
    flex-direction: column;
    width: 200px;
    flex-shrink: 0;
    padding: 16px 0;
    background: #1c1c1e;
    border-right: 0.5px solid rgba(255, 255, 255, 0.12);
    box-sizing: border-box;
  }
  .my-prize__tab {
    width: 100%;
    height: 56px;
    border: 0;
    border-right: 1px solid transparent;
    padding: 0 24px;
    background: transparent;
    color: rgba(245, 245, 245, 0.72);
    font-size: 16px;
    text-align: left;
    backdrop-filter: blur(10px);
    box-sizing: border-box;
    &.active {
      background: #2a2a2c;
      color: #507ffe;
      font-weight: 500;
      font-size: 18px;
      border-right-color: #507ffe;
    }
  }
  .my-prize__main {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    padding: 16px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  .my-prize__list {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
  .prize-card {
    width: 100%;
    max-width: 800px;
  }
}

.my-prize__placeholder {
  color: rgba(245, 245, 245, 0.45);
  text-align: center;
  padding: 48px 0;
  font-size: 14px;
}
.my-prize__load-more {
  padding: 16px 0;
  color: rgba(245, 245, 245, 0.55);
  font-size: 14px;
  text-align: center;
}

.my-prize__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.prize-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
  border-radius: 4px;
  background: #222224;
  box-sizing: border-box;
  cursor: pointer;
  &.is-expired {
    opacity: 0.55;
    cursor: default;
  }
}
.prize-card__thumb {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
}
.prize-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.prize-card__name {
  margin: 0;
  color: #eaf7ff;
  font-size: 14px;
  line-height: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.prize-card__expire {
  margin: 0;
  color: rgba(234, 247, 255, 0.4);
  font-size: 14px;
  line-height: normal;
  /* 中文标签与日期数字共享同一行内基线，避免 flex item 基线漂移 */
}
</style>

<template>
  <div class="lz-help">
    <div class="page history-page">
      <HelpNavBar title="历史反馈" manual-back @back="leaveHistory" />

      <main class="page__body--scroll">
        <div class="page__body history">
          <div v-if="!loaded" class="help-empty">加载中...</div>
          <div v-else-if="!tickets.length" class="help-empty">暂无反馈记录</div>
          <template v-else>
            <button
              v-for="ticket in tickets"
              :key="ticket.id"
              type="button"
              class="surface-card item"
              @click="openDetail(ticket.id)">
              <div class="item__top">
                <p class="item__title">{{ ticket.title }}</p>
                <div class="item__meta-right">
                  <span v-if="ticket.unread" class="item__unread-dot" role="img" aria-label="未读" />
                  <span class="item__chevron-wrap">
                    <img class="item__chevron" :src="iconChevron" width="6" height="12" alt="">
                  </span>
                </div>
              </div>
              <div class="divider" />
              <div class="item__bottom">
                <span class="item__time">{{ ticket.time }}</span>
                <span
                  class="item__status"
                  :class="{ 'item__status--pending': ticket.status === 'pending' }">
                  {{ ticket.statusName }}
                </span>
              </div>
            </button>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import HelpNavBar from '../components/HelpNavBar.vue'
import { leaveToHelpCenter } from '../utils/helpTab'
import { buildIdentityParams } from '../utils/feedbackIdentity'
import { getFeedbackHistory, getUnreadFeedback } from '@/api/feedback'
import { feedbackAppId } from '@/utils/signRequest'
import iconChevron from '../images/icon-chevron.svg'

// status: 1=未回复 2=已回复 3=追加（列表统一按待回复展示）
const STATUS_MAP = {
  1: { name: '待回复', key: 'pending' },
  2: { name: '已回复', key: 'replied' },
  3: { name: '待回复', key: 'pending' }
}

export default {
  name: 'FeedbackHistory',
  components: { HelpNavBar },
  data() {
    return {
      tickets: [],
      loaded: false,
      iconChevron
    }
  },
  created() {
    // showType: 3=我的（历史反馈列表）
    this.$dataReport('LZ_feedback', 'LZ_fbPageShow', 'pv', { showType: '3' })
    this.fetchHistory()
  },
  methods: {
    async fetchHistory() {
      // 未读标记不在历史列表接口返回，需单独拉未读列表再按 id 交叉比对（对齐桌面端 List/index.js）
      let unreadIds = []
      const identity = await buildIdentityParams()
      try {
        const unreadRes = await getUnreadFeedback(Object.assign({
          appId: feedbackAppId,
          current: 1,
          size: 100
        }, identity))
        if (unreadRes && unreadRes.code === 10000 && unreadRes.data) {
          unreadIds = (unreadRes.data.records || []).map(item => item.id)
        }
      } catch (e) {
        // 未读拉取失败不阻塞列表
      }

      const _data = Object.assign({
        appId: feedbackAppId,
        current: 1,
        size: 100
      }, identity)
      getFeedbackHistory(_data).then(res => {
        if (res && res.code === 10000 && res.data) {
          const records = res.data.records || []
          this.tickets = records.map(item => {
            const statusInfo = STATUS_MAP[item.status] || STATUS_MAP[1]
            return {
              id: item.id,
              title: item.note || '',
              time: item.updateTime || item.createTime || '',
              unread: unreadIds.indexOf(item.id) !== -1,
              status: statusInfo.key,
              statusName: statusInfo.name
            }
          })
        }
        this.loaded = true
      }).catch(() => {
        this.loaded = true
      })
    },
    leaveHistory() {
      leaveToHelpCenter(this.$route, this.$router)
    },
    openDetail(id) {
      const ticket = this.tickets.find(t => t.id === id)
      // 我的 - 反馈列表卡片点击
      this.$dataReport('LZ_feedback', 'LZ_cardListClick', 'click', {
        cardName: ticket ? ticket.title : '',
        lid: (this.$store.state.user || {}).userInfo ? this.$store.state.user.userInfo.UserID : ''
      })
      const query = {}
      if (this.$route.query.fromTab) query.fromTab = this.$route.query.fromTab
      this.$router.push({ name: 'FeedbackDetail', params: { id }, query })
    }
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
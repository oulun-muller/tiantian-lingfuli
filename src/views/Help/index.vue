<template>
  <div class="lz-help">
    <div class="page help">
      <HelpNavBar class="help__nav">
        <template #center>
          <div class="tabs tabs--mobile">
            <button
              v-for="tab in HELP_TABS"
              :key="tab.key"
              type="button"
              class="tabs__item"
              :class="{ 'tabs__item--active': activeTab === tab.key }"
              @click="setActiveTab(tab.key)">
              {{ tab.label }}
            </button>
          </div>
          <h1 class="help__title">帮助与反馈</h1>
        </template>
        <template #right>
          <div class="nav-actions">
            <button type="button" class="nav-actions__btn nav-actions__btn--history" @click="goHistory">
              <img class="nav-actions__icon" :src="iconHistory" width="18" height="18" alt="">
              <span>历史反馈</span>
              <span v-if="unreadTotal > 0" class="badge nav-actions__badge">{{ unreadTotal }}</span>
            </button>
            <div class="nav-actions__sep" />
            <button type="button" class="nav-actions__btn" @click="goFeedback">
              <img class="nav-actions__icon" :src="iconFeedback" width="18" height="18" alt="">
              <span>我要反馈</span>
            </button>
          </div>
        </template>
      </HelpNavBar>

      <div class="help__body">
        <aside class="sidebar" aria-label="问题分类">
          <button
            v-for="tab in HELP_TABS"
            :key="tab.key"
            type="button"
            class="sidebar__item"
            :class="{ 'sidebar__item--active': activeTab === tab.key }"
            @click="setActiveTab(tab.key)">
            {{ tab.label }}
          </button>
        </aside>

        <main class="page__body--scroll help__list">
          <div class="help__list-inner">
            <article
              v-for="item in faqs"
              :key="item.id"
              class="surface-card faq"
              :class="{ 'faq--open': expandedId === item.id }">
              <button type="button" class="faq__head" @click="toggle(item.id)">
                <span class="faq__q">{{ item.question }}</span>
                <span
                  class="faq__chevron-wrap"
                  :class="{ 'faq__chevron-wrap--up': expandedId === item.id }">
                  <img class="faq__chevron" :src="iconChevron" width="6" height="12" alt="">
                </span>
              </button>
              <template v-if="expandedId === item.id">
                <div class="divider" />
                <div class="faq__body">
                  <p>{{ item.answer }}</p>
                </div>
              </template>
            </article>
          </div>
        </main>
      </div>

      <footer class="help__footer">
        <button type="button" class="help__action" @click="goFeedback">
          <img class="help__action-icon" :src="iconFeedback" width="18" height="18" alt="">
          <span>我要反馈</span>
        </button>
        <div class="help__sep" />
        <button type="button" class="help__action help__action--history" @click="goHistory">
          <img class="help__action-icon" :src="iconHistory" width="18" height="18" alt="">
          <span>历史反馈</span>
          <span v-if="unreadTotal > 0" class="badge help__badge">{{ unreadTotal }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<script>
import HelpNavBar from './components/HelpNavBar.vue'
import { HELP_TABS, FAQ_ITEMS } from './data/helpData'
import { parseHelpTab } from './utils/helpTab'
import { buildIdentityParams } from './utils/feedbackIdentity'
import { getUnreadFeedback } from '@/api/feedback'
import { feedbackAppId } from '@/utils/signRequest'
import iconChevron from './images/icon-chevron.svg'
import iconFeedback from './images/icon-feedback.svg'
import iconHistory from './images/icon-history.svg'

export default {
  name: 'HelpCenter',
  components: { HelpNavBar },
  data() {
    return {
      HELP_TABS,
      expandedId: 'h1',
      unreadTotal: 0,
      iconChevron,
      iconFeedback,
      iconHistory
    }
  },
  computed: {
    activeTab() {
      return parseHelpTab(this.$route.query.tab)
    },
    faqs() {
      return FAQ_ITEMS.filter(item => item.tab === this.activeTab)
    }
  },
  created() {
    // showType: 1=常见问题（帮助中心）
    this.$dataReport('LZ_feedback', 'LZ_fbPageShow', 'pv', { showType: '1' })
    this.fetchUnread()
  },
  methods: {
    async fetchUnread() {
      const _data = Object.assign({
        appId: feedbackAppId,
        current: 1,
        size: 100
      }, await buildIdentityParams())
      getUnreadFeedback(_data).then(res => {
        if (res && res.code === 10000 && res.data) {
          this.unreadTotal = res.data.total || (res.data.records || []).length
        }
      }).catch(() => {})
    },
    setActiveTab(tab) {
      const tabItem = HELP_TABS.find(t => t.key === tab)
      // 常见问题 - 分类点击
      this.$dataReport('LZ_feedback', 'LZ_fbPageClassClick', 'click', {
        pageclass: tabItem ? tabItem.label : tab
      })
      const query = { ...this.$route.query }
      if (tab === 'hot') delete query.tab
      else query.tab = tab
      this.$router.replace({ query })
    },
    toggle(id) {
      const opening = this.expandedId !== id
      this.expandedId = opening ? id : ''
      if (opening) {
        const item = FAQ_ITEMS.find(f => f.id === id)
        const tabItem = HELP_TABS.find(t => t.key === this.activeTab)
        // 常见问题 - 问题点击
        this.$dataReport('LZ_feedback', 'LZ_fbPageClassQuestionContentClick', 'click', {
          pageclass: tabItem ? tabItem.label : this.activeTab,
          contentType: item ? item.question : ''
        })
      }
    },
    goFeedback() {
      this.$router.push({ name: 'FeedbackForm', query: { fromTab: this.activeTab } })
    },
    goHistory() {
      this.$router.push({ name: 'FeedbackHistory', query: { fromTab: this.activeTab } })
    }
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
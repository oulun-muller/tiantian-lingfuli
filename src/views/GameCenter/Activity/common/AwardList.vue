<template>
  <Dialog class="award-list" :visible="visible" title="中奖记录" @close="$emit('close')">
    <dl class="list-wrap" v-if="list.length">
      <dt class="list-title">
        <div class="title">奖品名称</div>
        <div class="time">中奖时间</div>
      </dt>
      <section class="list-content" @scroll="handleScroll">
        <dd class="item" v-for="(item, index) in list" :key="index">
          <span class="name">{{ item.prizeInfo.name }}</span>
          <span class="time">{{ item.createTime }}</span>
          <span class="more" tabindex="0" role="button" :aria-label="item.prizeInfo.type === 3 ? '联系方式' : '查看详情'" @click="clickMore(item)" @keydown.enter.prevent.stop="clickMore(item)" @keydown.space.prevent.stop="clickMore(item)">{{ item.prizeInfo.type === 3 ? '联系方式': '查看详情' }}</span>
        </dd>

        <!-- 加载提示 -->
        <template v-if="!allPrizeIds">
          <div class="loading-more" v-if="hasMore">
            <span v-if="loading">加载中...</span>
            <span v-else>加载更多</span>
          </div>
        </template>

      </section>
    </dl>
    <div v-else class="no-content">暂无中奖记录</div>
    <VirtualAward v-if="showVirtualAward" :visible="showVirtualAward" @close="showVirtualAward=false" :info="prizeInfo" :is-not-need-click-report="true" :all-data="allData"/>
    <PhysicalAward v-if="showPhysicalAward" :pop-type="popType" :visible="showPhysicalAward" @close="showPhysicalAward=false" :info="prizeInfo" @writeContact="showContactDialog=true" :is-not-need-click-report="true" :all-data="allData"/>
    <ThirdAward v-if="showThirdAward" :pop-type="popType" :visible="showThirdAward" :base-info="baseInfo" @close="showThirdAward=false" :info="prizeInfo" :btn-hide="btnHide" @writeContact="showContactDialog=true" :is-not-need-click-report="true" :all-data="allData"/>
    <ContactPop v-if="showContactDialog" :pop-type="popType" :contact-info="contactInfo" :draw-id="drawId" :visible="showContactDialog" @close="closePhysicalPop"/>
  </Dialog>
</template>
<script>
import VirtualAward from './VirtualAward.vue'
import PhysicalAward from './PhysicalAward.vue'
import ThirdAward from './ThirdAward.vue'
import ContactPop from './ContactPop.vue'
import { getPrizeRecord, getAllPrizeRecords } from '@/api/activity'
export default {
  inject: {
    activityId: {
      default: null
    },
    getActivityName: {
      default: () => () => null
    }
  },
  props: {
    allPrizeIds: {
      default: null,
      type: Array
    },
    visible: {
      type: Boolean,
      default: false
    },
    baseInfo: {
      default: null,
      type: Object
    }
  },
  components: {
    VirtualAward,
    PhysicalAward,
    ThirdAward,
    ContactPop
  },
  data() {
    return {
      allData: {},
      popType: 'edit',
      list: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      loading: false,
      hasMore: true,
      prizeInfo: null,
      contactInfo: null,
      showVirtualAward: false,
      showPhysicalAward: false,
      showThirdAward: false,
      showContactDialog: false,
      fromChannel: this.$route.query?.fromChannelName || '',
      btnHide: false
    }
  },
  computed: {
    isApp() {
      return !!this.$store.state.system.version
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    activityName() {
      return this.getActivityName()
    },
    channelInfo() {
      return this.$store.state.channelInfo
    }
  },
  methods: {
    clickMore(item) {
      this.allData = item
      this.drawId = item.id
      this.prizeInfo = item.prizeInfo
      this.contactInfo = item.contactInfo
      this.popType = 'edit'
      this.btnHide = item.btnHide

      switch (item.prizeInfo.type) {
        case 2:
          this.showVirtualAward = true
          break
        case 3:
          if (!item.contactInfo.userName) {
            this.popType = 'add'
          }
          this.showPhysicalAward = true
          break
        case 4:
          this.showThirdAward = true
          break
      }
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsWinRecordPopupViewDetailsClick',
        'click',
        {
          detail: JSON.stringify({
            from: (this.allPrizeIds && this.allPrizeIds.length > 0) ? 1 : 2,
            activityName: this.activityName || '活动专区',
            activityid: this.activityId || '活动ID',
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.fromChannel || 'LegionZone'
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
    },
    closePhysicalPop() {
      this.init()
      this.showContactDialog = false
      this.showPhysicalAward = false
    },
    init() {
      if (this.allPrizeIds && this.allPrizeIds.length > 0) {
        // 如果传入了特定活动的奖品ID，则调用原来的API
        getPrizeRecord(JSON.stringify(this.allPrizeIds), this.fromChannel || 'LegionZone').then((res) => {
          this.list = res
          this.total = res.length
        })
      } else {
        // 如果没有传入特定活动的奖品ID，则调用查询所有活动奖品记录的API
        this.currentPage = 1
        this.list = []
        this.hasMore = true
        this.loadMoreData()
      }
    },
    loadMoreData() {
      if (this.loading || !this.hasMore) {
        return
      }

      this.loading = true
      getAllPrizeRecords(this.fromChannel || 'LegionZone', this.currentPage, this.pageSize).then((res) => {
        const newRecords = res.records || []
        this.total = res.total || 0

        if (this.currentPage === 1) {
          this.list = newRecords
        } else {
          this.list = [...this.list, ...newRecords]
        }

        // 判断是否还有更多数据
        this.hasMore = this.list.length < this.total
        this.currentPage++
      }).finally(() => {
        this.loading = false
      })
    },
    // 处理滚动事件
    handleScroll() {
      const scrollContainer = this.$el.querySelector('.list-content')
      if (!scrollContainer) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer

      // 当滚动到距离底部100px时加载更多（更宽松的触发条件）
      if (scrollHeight - scrollTop - clientHeight < 100) {
        this.loadMoreData()
      }
    }
  },
  mounted() {
    this.init()
  },
  beforeUnmount() {
  }
}
</script>
<style lang="scss" scoped>
.list-wrap {
  padding: 23px 30px 0px 23px;
  .list-title {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #EAF7FF;
    .title {
      display: inline-block;
      width: auto;
    }
  }
  .list-content {
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    &::-webkit-scrollbar-thumb {
      cursor: pointer;
      border-radius: 5px;
      background-color: rgba(80, 91, 110, 0.25);
      &:hover {
        background-color: rgba(80, 91, 110, 0.6);
      }
    }
    /* 确保滚动条正确显示 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
  .item {
    margin-bottom: 20px;
    span {
      display: inline-block;
      color: #EAF7FF99;
      font-size: 14px;
      &.name {
        width: 250px;
      }
      &.time {
        width: 232px;
      }
      &.more {
        cursor: pointer;
        color: #386EFE;
      }
    }
  }

  .loading-more,
  .no-more {
    text-align: center;
    padding: 10px 0;
    color: #EAF7FF99;
    font-size: 14px;
  }

}
.no-content {
  text-align: center;
  color: #EAF7FF99;
  padding-top: 100px;
}

.PhoneDevice {
  .list-wrap  {
    padding: 23px 10px;
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      .name {
        width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .time {
        width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .more {
        cursor: pointer;
      }
    }
  }
}

</style>

<style scoped>
.list-content .item .more:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .list-content .item .more:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

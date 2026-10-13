<template>
  <dl class="task-list-new">
    <dt class="header">
      <span class="title">完成任务获取抽奖次数</span>
      <span class="counter">已完成{{ finishedCount }}/{{ totalCount }}个任务</span>
    </dt>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"/>
    </div>
    <div class="summary">
      <span class="claimable">{{ claimableDrawCount === 0 ? '已领取全部抽奖次数' : `可领取${claimableDrawCount}次抽奖` }}</span>
      <span v-if="remainingDrawCount > 0" class="total-reward">完成全部可再得 +{{ remainingDrawCount }}</span>
    </div>
    <div class="divider"/>
    <div class="task-wrap" ref="taskWrap" @scroll="onScroll">
      <TaskItem
        v-for="(item, index) in sortedTaskInfo"
        :key="item.id || index"
        :item="item"
        :prize-draw="prizeDraw"
        :first-local="String(firstLocal)"
        :second-local="String(secondLocal)"
        :third-local="String(thirdLocal)"
        :plate-name-report="plateNameReport"
        :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish"
        @scroll-to-purchase="$emit('scroll-to-purchase', $event)"
        @toLenovoLogin="$emit('toLenovoLogin')"
        @showOpenAppDialog="status => $emit('showOpenAppDialog', status)"
        @updateDrawCount="num => $emit('updateDrawCount', num)"
        @refreshPage="$emit('refreshPage')"
        @task-done-change="onTaskDoneChange"/>
    </div>
    <div class="scroll-hint" :style="{ visibility: showScrollHint ? 'visible' : 'hidden' }" @click="scrollDown">
      <span class="main-text">↓ 下滑领取更多抽奖次数</span><span class="sub-text"> 还有{{ remainingTaskCount }}个任务</span>
    </div>
  </dl>
</template>
<script>
import TaskItem from './TaskItem.vue'
export default {
  name: 'TaskListNew',
  components: { TaskItem },
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportUrl'],
  props: {
    prizeDraw: { type: Object, default: null },
    scrollToPurchaseOnFinish: { type: Boolean, default: false },
    firstLocal: { default: '', type: String },
    secondLocal: { default: '', type: String },
    thirdLocal: { default: '', type: String },
    plateNameReport: { default: '', type: String }
  },
  data() {
    return {
      showScrollHint: false,
      localDoneIds: {}
    }
  },
  computed: {
    isApp() {
      return !!this.$store.state.system.version
    },
    taskInfo() {
      return this.prizeDraw?.taskInfo || []
    },
    totalCount() {
      return this.taskInfo.length
    },
    finishedCount() {
      return this.taskInfo.filter(item =>
        item.finish === 1 || item.claimed === 1 || this.localDoneIds[item.id]
      ).length
    },
    progressPercent() {
      if (!this.totalCount) return 0
      return Math.round((this.finishedCount / this.totalCount) * 100)
    },
    claimableDrawCount() {
      // 顶部汇总需要把购买任务的多笔待领取订单都算进去；普通任务保持原来的单任务奖励逻辑。
      return this.taskInfo.reduce((sum, item) => {
        if (item.taskType === 11) {
          // 购买任务按待领取订单数累计抽奖次数，避免多笔订单只显示 1 次。
          return sum + Number(item.pendingClaimCount || 0) * (item.taskPrizeDrawCount || 0)
        }
        if ((item.finish === 1 || this.localDoneIds[item.id]) && item.claimed !== 1) {
          return sum + (item.taskPrizeDrawCount || 0)
        }
        return sum
      }, 0)
    },
    unfinishedTasks() {
      return this.taskInfo.filter(item => item.finish !== 1 && !this.localDoneIds[item.id])
    },
    remainingDrawCount() {
      return this.unfinishedTasks.reduce((sum, item) => sum + (item.taskPrizeDrawCount || 0), 0)
    },
    remainingTaskCount() {
      return this.unfinishedTasks.length
    },
    sortedTaskInfo() {
      const getWeight = item => {
        if (item.claimed === 1) return 2
        if (item.finish === 1 || this.localDoneIds[item.id]) return 1
        return 0
      }
      return [...this.taskInfo].sort((a, b) => getWeight(a) - getWeight(b))
    }
  },
  methods: {
    onTaskDoneChange(id) {
      // TaskItem 按钮变为"领取奖励"或"已领取"时触发，更新本地完成记录
      this.localDoneIds[id] = true
    },
    onScroll() {
      const el = this.$refs.taskWrap
      if (!el) return
      const scrollBottom = el.scrollTop + el.clientHeight
      this.showScrollHint = scrollBottom < el.scrollHeight - 10
    },
    scrollDown() {
      const el = this.$refs.taskWrap
      if (el) el.scrollBy({ top: 100, behavior: 'smooth' })
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsScrollDownButtonClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: this.getActivityName(),
            activityid: this.activityId,
            channel: this.getReportChannel(),
            url: this.getReportUrl()
          })
        }
      )
    }
  },
  mounted() {
    this.$nextTick(() => {
      const el = this.$refs.taskWrap
      if (el) {
        this.showScrollHint = el.scrollHeight > el.clientHeight
      }
    })
  }
}
</script>
<style lang="scss" scoped>
.task-list-new {
  flex: auto;
  border: 0.5px solid rgba(255, 255, 255, 0.40);
  padding: 18px 15px 0 15px;
  background: rgba(59, 58, 58, 0.30) url('~@/images/Index/task-bac.png') no-repeat center bottom / contain;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    .title {
      background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 18px;
      font-weight: 700;
    }
    .counter {
      color: rgba(234, 247, 255, 0.70);
      font-size: 12px;
      white-space: nowrap;
    }
  }

  .progress-bar {
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.15);
    margin-bottom: 8px;
    .progress-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #4A9EFF 0%, #81C4FF 100%);
      transition: width 0.3s ease;
    }
  }

  .summary {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    .claimable {
      color: #4A9EFF;
      font-size: 12px;
      font-weight: 600;
    }
    .total-reward {
      color: rgba(234, 247, 255, 0.70);
      font-size: 12px;
    }
  }

  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
    margin-bottom: 8px;
  }

  .task-wrap {
    max-height: 300px;
    overflow-y: auto;
    padding-right: 2px;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background-color: rgba(80, 91, 110, 0.25);
      &:hover {
        background-color: rgba(80, 91, 110, 0.6);
      }
    }
  }

  .scroll-hint {
    margin: 8px 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    border: 0.5px solid rgba(255, 255, 255, 0.30);
    cursor: pointer;
    .main-text {
      font-size: 14px;
      font-weight: 700;
      background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub-text {
      font-size: 13px;
      color: #4A9EFF;
      margin-left: 4px;
    }
    &:hover {
      border-color: rgba(255, 255, 255, 0.60);
    }
  }
}

</style>

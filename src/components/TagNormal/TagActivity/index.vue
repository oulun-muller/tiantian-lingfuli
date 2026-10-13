<template>
  <div class="tag-container">
    <div
      class="tag-item"
      v-if="type === 1"
      tabindex="0"
      role="button"
      :aria-label="title + '，点击查看活动'"
      @click.stop="jumpActive"
      @keydown.enter.prevent.stop="jumpActive"
      @keydown.space.prevent.stop="jumpActive"
    >
      <img class="tag-icon" src="../img/activity-icon.svg" aria-hidden="true" />
      <div class="tag-title tag-activity-color" aria-hidden="true">{{ title }}</div>
      <img class="tag-icon" src="../img/activity-arrow-icon.svg" aria-hidden="true" />
      <div v-if="showShadow" class="tag-shadow" aria-hidden="true"></div>
    </div>
    <div v-else class="tag-item">
      <img class="tag-icon" src="../img/ai-word-icon.svg" aria-hidden="true" />
      <div class="tag-title tag-ai-word-color">{{ title }}</div>
      <div v-if="showShadow" class="tag-shadow" aria-hidden="true"></div>
    </div>
  </div>

</template>

<script>
export default {
  name: '',
  components: {},
  props: {
    title: {
      type: String,
      default: '先觉测试领限定好装备'
    },
    showShadow: {
      type: Boolean,
      default: true
    },
    currentPage: {
      type: String,
      default: 'curation'
    },
    plateName: {
      type: String,
      default: ''
    },
    type: {
      type: Number,
      default: 1
    },
    gameItem: { // 数据上报附加信息
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      firstLocalEnum: {
        'curation': 3
      }
    }
  },
  computed: {},
  watch: {},
  created() { },
  mounted() { },
  methods: {
    jumpActive() {
      const jumpType = this.gameItem?.relateActivitys?.[0].jumpType
      const jumpUrl = this.gameItem?.relateActivitys?.[0].jumpUrl
      if (!jumpUrl) return
      this.pointReport()
      if (+jumpType === 1) {
        this.$router.push({
          path: `/gameCenter/online/index`,
          query: {
            firstLocal: this.firstLocalEnum[this.currentPage] || '',
            isLabel: 'Yes',
            id: jumpUrl
          }
        })
      } else {
        this.$router.push({
          path: `/forum/micro/detail/${jumpUrl}`,
          query: {
            forumSource: 4
          }
        })
      }
    },
    getDataReport(item) {
      let stateGame = 0
      let statePage = 1 // 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),8.立即购买 9.帖子进入
      let gameClass = 0
      if (item.softPurpose === 3) {
        stateGame = 1
        gameClass = 3
      } else {
        stateGame = 1
        gameClass = 1
        switch (item.downloadInfo.bizType) {
          case 0:
            stateGame = 1
            break
          case 1:
          case 2:
            stateGame = 2
            break
          case 4:
            stateGame = 3
            break
        }
      }

      if ([1, 2].includes(item.downloadInfo.bizType)) {
        if (item.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
          statePage = 2
        } else if (item.downloadInfo.userReservationStatus === 1) {
          statePage = 3
        }
      } else if (item.downloadInfo.bizType === 4) {
        if (item.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
          statePage = 4
        } else {
          if (item.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
            statePage = 5
          } else if ([1].includes(item.downloadInfo.userTestApplyStatus)) {
            statePage = 6
          } else if ([2].includes(item.downloadInfo.userTestApplyStatus)) {
            statePage = 1
          }
        }
      }

      return { statePage,
        stateGame,
        gameClass,
        skuName: item.softName,
        softID: item.softId,
        aiStrategy: item?.isAiGame ? this.$store.state.aiGameRecommend.moduleGameConfigs?.fillingStrategyKey : 'no'
      }
    },
    pointReport() {
      const info = this.getDataReport(this.gameItem)
      console.log('pointReport', info)

      this.$dataReport('LZ_gamingCenter', 'LZ_storeEventsTagClick', 'click', {
        detail: JSON.stringify({
          currentPage: this.currentPage,
          plateName: this.plateName,
          name: this.title,
          lenovoid: this.$store.state.user.userInfo?.UserID || '',
          skuName: info?.skuName,
          softID: info?.softID,
          stateGame: info.stateGame,
          statePage: info.statePage,
          aiStrategy: info.aiStrategy
        })
      })
    }
  }
}
</script>

<style scoped lang="scss">

.tag-container {
  position: relative;
  display: block;
  width: 100%;
  line-height: 0;
}
.tag {
  width: 100%;
}

.tag-item {
  max-width: 100%;
  height: 20px;
  display: inline-flex;
  align-items: center;
  position: relative;
  z-index: 2;

  .tag-icon {
    width: 16px;
    height: 16px;
    margin-right: 2px;
  }

  .tag-title {
    font-size: 13px;
    line-height: 20px;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tag-activity-color {
    color: #F7B84B;
    cursor: pointer;
  }

  .tag-ai-word-color {
    color: #32C7CC;

  }
}

.tag-item[role="button"]:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 4px;
}

@media (forced-colors: active) {
  .tag-item[role="button"]:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}

.tag-shadow {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 10px;
  width: 100%;
  z-index: 1;
  border-radius: 2px;
background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.25) 100%);
  background-blend-mode: soft-light, normal;

}
</style>

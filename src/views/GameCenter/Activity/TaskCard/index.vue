<template>
  <section class="task-card">
    <div class="image" :style="{ backgroundImage: `url(${taskPrize.activityTaskInfo.taskAreaImage})` }"></div>
    <template v-if="taskPrize.activityTaskInfo.taskBtnImage" >
      <template v-if="showDownloadBtn">
        <div v-if="detail.softId" class="download-btn" :style="{backgroundImage: `url(${taskPrize.activityTaskInfo.taskBtnImage})`}" @click.capture="reportTask()">
          <GameDownloadButton
            theme="rect"
            :download-info="detail.downloadInfo"
            :soft-desc="detail.softDesc"
            :soft-id="detail.softId"
            :soft-purpose="detail.softPurpose"
            :user-purchased-status="0"
            :version="detail.softDesc.version"
            :soft-name="detail.softName"
            :logo-file="detail.showInfo.logoFile"
            :fast-install="detail.showInfo.isFastInstall"
            :drinfo="drinfo"
            text="立即安装"
            :is-click="true"
            :sku-id="detail.skuId" />
        </div>
      </template>
      <div v-else :class="['button', isNeedNoClick ? 'not-click':'']" :style="{ backgroundImage: `url(${taskPrize.activityTaskInfo.taskBtnImage})` }" tabindex="0" role="button" :aria-label="taskButtonText" @click="clickToFinish" @keydown.enter.prevent.stop="clickToFinish" @keydown.space.prevent.stop="clickToFinish">{{ taskButtonText }}</div>
    </template>
    <VirtualAward v-if="showVirtualAward" source="taskCard" :visible="showVirtualAward" @close="closeVirtual" :task-name="taskInfo.name" :task-id="taskInfo.id" :info="awardInfo"/>
    <PhysicalAward v-if="showPhysicalAward" source="taskCard" :visible="showPhysicalAward" @close="closePhysical" :info="awardInfo" :task-name="taskInfo.name" :task-id="taskInfo.id" @writeContact="showContactDialog=true"/>
    <ThirdAward v-if="showThirdAward" source="taskCard" :visible="showThirdAward" :base-info="baseInfo" @close="closeThird" :info="awardInfo" :task-name="taskInfo.name" :task-id="taskInfo.id"/>
    <ContactPop v-if="showContactDialog" source="taskCard" pop-type="add" :draw-id="drawId" :visible="showContactDialog" @close="closePhysicalPop"/>
  </section>
</template>
<script>
import { getCDKDetail } from '@/api/cdkMall'
import { getFollowers, toFollowers, followers } from '@/api/gameCenter'
import { reserveReviewslikes } from '@/api/gameEvaluation'
import { getTaskClaim, checkChannelTask, refreshTaskStatus } from '@/api/activity'
import VirtualAward from '../common/VirtualAward.vue'
import PhysicalAward from '../common/PhysicalAward.vue'
import ContactPop from '../common/ContactPop.vue'
import ThirdAward from '../common/ThirdAward'
import { checkAuth } from '../common/utils'
import GameDownloadButton from '@/components/GameDownloadButton'
import { doTask } from '../common/messageHelper'
export default {
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportUrl'],
  name: 'TaskCard',
  components: {
    VirtualAward,
    PhysicalAward,
    ThirdAward,
    ContactPop,
    GameDownloadButton
  },
  props: {
    baseInfo: {
      default: null,
      type: Object
    },
    taskPrize: {
      default: null,
      type: Object
    },
    firstLocal: {
      default: '',
      type: String
    },
    secondLocal: {
      default: '',
      type: String
    },
    thirdLocal: {
      default: '',
      type: String
    },
    // 预购页任务点击“去完成”时，仅定位到购买区，不执行普通任务跳转逻辑。
    scrollToPurchaseOnFinish: {
      default: false,
      type: Boolean
    }
  },
  data() {
    return {
      intervalCount: 0,
      detail: {},
      fromChannel: this.$route.query?.fromChannelName || '',
      channelResult: false,
      showVirtualAward: false,
      showPhysicalAward: false,
      showContactDialog: false,
      showOpenAppDialog: false,
      showThirdAward: false,
      drawId: null,
      awardInfo: null,
      isFollower: null,
      gameDetailInfo: {},
      buttonStatus: 5
      /*
        0 已领取
        1 领取奖励
        2 立即预约-跳详情页autoClick
        3 立即关注
        4 去完成-去详情页自动操作
        5 去完成-去详情页
        6 去完成-去我的游戏
        7 领取奖励-多次签到任务未完成
        8 立即预约-直接调接口（无奖品 prizeType=1 +taskType=3）
        9 已预约-不可点击（无奖品 prizeType=1 +taskType=3+已预约）
      */
    }
  },
  computed: {
    downloadStatus() {
      return this.$store.state.softwareState?.stateMap[this.taskPrize?.taskInfo[0]?.softId]?.status || ''
    },
    showDownloadBtn() {
      // 是下载完成任务/下载安装完成任务 且 任务未完成 且 游戏未安装
      return !this.fromChannel && this.taskPrize.status && this.taskPrize.validStatus === 1 && (this.taskDetail.taskType === 1 || this.taskDetail.taskType === 2) && this.taskDetail.finish !== 1 && this.downloadStatus !== 'installed'
    },
    activityName() {
      return this.getActivityName()
    },
    taskInfo() {
      return this.taskPrize?.taskInfo?.[0] || {}
    },
    channelUserInfo() {
      return this.$store.state.channelInfo.channelUserInfo
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    system() {
      return this.$store.state.system
    },
    taskButtonText() {
      if (this.taskPrize.status === 0) {
        return '已下架'
      }
      if (this.taskPrize.validStatus === 2) {
        return '已结束'
      } else if (this.taskPrize.validStatus === 0) {
        return '未开始'
      }
      switch (this.buttonStatus) {
        case 0:
          return '已领取'
        case 1:
          return '领取奖励'
        case 2:
          return '立即预约'
        case 3:
          return '立即关注'
        case 4:
        case 5:
        case 6:
          return '去完成'
        case 7:
          return '领取奖励'
        case 8:
          return '立即预约'
        case 9:
          return '已预约'
        default:
          return '去完成!'
      }
    },
    isNeedNoClick() {
      const userInfo = this.$store.state.user.userInfo || ''
      if (!userInfo) {
        return false
      }
      if ((this.taskPrize.validStatus !== 1 || this.taskPrize.status !== 1 || [0, 7, 9].includes(this.buttonStatus))) {
        return true
      }
      return false
    },
    drinfo() {
      const params = {
        source_pp: this.$route.query.source_pp || '',
        source_p: this.$route.query.source_p || '',
        source: 'PAD1',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 2,
        plateName: this.reportPlateName || this.activityName || '',
        skuName: this.detail.softName || '',
        softID: this.detail.softId || '',
        lenovoid: this.userInfo?.UserID || '',
        aiStrategy: this.$route.query.aiStrategy || ''
      }

      let _gameClass = 1 // 1游戏，2工具
      if (this.detail?.softPurpose === 3) {
        _gameClass = 3
      }

      if (Number(this.detail.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
        _gameClass = 2
      }

      if (_gameClass === 2 || _gameClass === 3) {
        params.gameClass = _gameClass
      }

      return JSON.stringify(params)
    },
    taskDetail() {
      return this.taskPrize?.taskInfo?.[0] || {}
    }
  },
  watch: {
    downloadStatus(value) {
      if ((value === 'i' && this.taskDetail.taskType === 1) || (value === 'installed' && this.taskDetail.taskType === 2)) {
        this.startInterval()
      }
    }
  },
  methods: {
    startInterval() {
      if (this.interval) return
      this.interval = setInterval(async() => {
        this.intervalCount++
        const newTaskStatus = await refreshTaskStatus({
          taskId: this.taskDetail.id,
          activityPageId: this.activityId,
          channel: this.fromChannel || 'LegionZone',
          prizeDrawActivityId: this.taskPrize?.id
        })
        console.log('refreshTaskStat2us', newTaskStatus, this.intervalCount)
        if (newTaskStatus) {
          clearInterval(this.interval)
          this.refreshAll()
        }
        if (this.intervalCount >= 3) {
          clearInterval(this.interval)
        }
      }, 2000)
    },
    refreshAll() {
      this.$emit('refreshPage')
      setTimeout(() => {
        this.refresh()
      }, 1000)
    },
    closeVirtual() {
      this.showVirtualAward = false
      this.refreshAll()
    },
    closePhysical() {
      this.showPhysicalAward = false
      this.refreshAll()
    },
    closeThird() {
      this.showThirdAward = false
      this.refreshAll()
    },
    reportTask() {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsGoFinishTaskButtonClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.activityId,
            taskName: this.taskPrize?.taskInfo[0]?.name,
            taskid: this.taskPrize?.taskInfo[0]?.id,
            lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            url: this.getReportUrl()
          }),
          uuid: this.channelUserInfo?.uuid || null
        }
      )
    },
    closePhysicalPop() {
      this.showContactDialog = false
      this.showPhysicalAward = false
    },
    setGameStatus() {
      const info = this.taskPrize?.taskInfo[0] || {}
      const prizeInfo = this.taskPrize?.prizeInfo[0] || {}
      if (info.claimed === 1) {
        this.buttonStatus = 0
      } else {
        if (info.finish === 1) {
          if (prizeInfo.type === 1) {
            // 无奖品任务完成，根据 taskType 显示已完成状态
            if (info.taskType === 3) {
              this.buttonStatus = this.gameDetailInfo.userReservationStatus === 1 ? 9 : 8
            } else {
              this.buttonStatus = 0
            }
          } else {
            this.buttonStatus = 1
          }
        } else {
          /*
            0 已领取
            1 领取奖励-
            2 立即预约-
            3 立即关注-
            4 去完成-去详情页自动操作
            5 去完成-去详情页
          */
          switch (info.taskType) {
            case 1:
              // 下载指定游戏
              this.buttonStatus = 4
              break
            case 2:
              // 下载并安装指定游戏
              this.buttonStatus = 4
              break
            case 3:
              // 预约指定游戏
              if (this.fromChannel) {
                this.buttonStatus = this.channelResult ? 1 : 2
              } else if (prizeInfo?.type === 1) {
                // 无奖品类型：直接在当前页预约，不跳详情页
                this.buttonStatus = this.gameDetailInfo.userReservationStatus === 1 ? 9 : 8
              } else if (this.gameDetailInfo.bizType === 1 || this.gameDetailInfo.bizType === 2) {
                this.buttonStatus = this.gameDetailInfo.userReservationStatus === 1 ? 1 : 2
              } else {
                this.buttonStatus = 999
              }
              break
            case 4:
              // 关注指定游戏
              if (this.fromChannel) {
                this.buttonStatus = this.channelResult ? 1 : 2
              } else {
                this.buttonStatus = this.isFollower ? 1 : 3
              }
              break
            case 5:
              // 申请游戏内测
              if (this.gameDetailInfo.bizType === 4) {
                this.buttonStatus = (this.gameDetailInfo.testActivityStatus === 1 && this.gameDetailInfo.userTestApplyStatus === 1) ? 1 : 4
              } else {
                this.buttonStatus = 999
              }
              break
            case 6:
              // 多次的签到任务未完成
              this.buttonStatus = 7
              break
            case 8:
              // 添加并启动指定游戏
              this.buttonStatus = 6
              break
            case 9:
              // 游戏内任务
              this.buttonStatus = 5
              break
            default:
              this.buttonStatus = 999
              break
          }
        }
      }
    },
    getDetail(softId) {
      getCDKDetail(softId).then(res => {
        this.detail = res || {}
        this.gameDetailInfo = res?.downloadInfo || {}
        this.getFollowerStatus(this.taskPrize?.taskInfo[0]?.softId)
      })
    },
    async getFollowerStatus(value) {
      this.isFollower = await getFollowers({
        softId: value
      })
      this.setGameStatus()
    },
    clickToFinish() {
      // 预购页购买任务统一引导到购买区，实际支付由商品购买按钮触发。
      if (this.scrollToPurchaseOnFinish && [4, 5, 6].includes(this.buttonStatus)) {
        this.$emit('scroll-to-purchase')
        return
      }
      if (!this.isApp && !this.fromChannel) {
        window.location.href = `lenovo-legionzone:#/gamecenter/online/index?id=${this.$route.query.id}&source=browser`
        this.showOpenAppDialog = true
        return
      }
      if (this.fromChannel) {
        if (!checkAuth(this.fromChannel)) return
      } else {
        const userInfo = this.$store.state.user.userInfo
        if (!userInfo) {
          this.$login()
          return
        }
      }

      if (this.fromChannel) {
        this.doChannelTask()
      } else {
        this.doLegionTask()
      }
      /*
        0 已领取
        1 领取奖励-
        2 立即预约-
        3 立即关注-
        4 去完成-去详情页自动操作
        5 去完成-去详情页
      */
      this[this.isApp ? '$dataReport' : '$trackEvent']('LZ_gamingCenter', 'LZ_storeEventsTaskModuleButtonClick', 'click', {
        detail: JSON.stringify({
          activityid: this.activityId,
          activityName: this.activityName,
          taskName: this.taskPrize?.taskInfo[0]?.name,
          taskid: this.taskPrize?.taskInfo[0]?.id,
          clickbutton: this.taskButtonText,
          channel: this.getReportChannel(),
          url: this.getReportUrl()
        }),
        uuid: this.channelInfo?.channelUserInfo?.uuid || null
      })
    },
    doChannelTask() {
      const { taskType, id, name } = this.taskPrize?.taskInfo?.[0] || {}
      switch (this.buttonStatus) {
        case 1:
          this.claimReward()
          break
        default:
          this.reportTask()
          setTimeout(() => {
            doTask({
              pkgName: this.taskPrize?.taskInfo[0]?.pkgName,
              softId: this.taskPrize?.taskInfo[0]?.softId,
              taskType,
              taskId: id,
              taskName: name,
              fromChannel: this.fromChannel
            })
          }, 500)
          break
      }
    },
    doLegionTask() {
      switch (this.buttonStatus) {
        case 1:
          // claim
          this.claimReward()
          break
        case 2:
          // reserve
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: this.taskPrize?.taskInfo[0]?.softId },
            query: {
              source_pp: this.$route.query.source_pp || '',
              source_p: 'PAD8',
              actionName: 'autoClick',
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              reportPlateName: this.activityName
            }
          })
          break
        case 3:
          // follow
          toFollowers(this.taskPrize?.taskInfo[0]?.softId, this.isFollower).then((res) => {
            if (res.data) {
              this.$message({
                message: '关注成功！',
                type: 'success',
                duration: 2500,
                customClass: 'lg-message--success'
              })
            }
            this.refresh()
          })
          break
        case 4:
          // clickToUrl
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: this.taskPrize?.taskInfo[0]?.softId },
            query: {
              source_pp: this.$route.query.source_pp || '',
              source_p: 'PAD8',
              actionName: 'autoClick',
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              reportPlateName: this.activityName
            }
          })
          break
        case 5:
          // clickToUrl
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: this.taskPrize?.taskInfo[0]?.softId },
            query: {
              source_pp: this.$route.query.source_pp || '',
              source_p: 'PAD8',
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              reportPlateName: this.activityName
            }
          })
          break
        case 6:
          this.$parentRouter.push('/mygame/index')
          break
        case 8:
          // 无奖品+预约任务：直接调接口预约
          this.doReserve()
          break
        default:
          break
      }
    },
    doReserve() {
      const softId = this.taskPrize?.taskInfo[0]?.softId
      const softName = this.taskPrize?.taskInfo[0]?.softName || ''
      Promise.all([
        reserveReviewslikes({ softId, softName }),
        followers({ softId })
      ]).then(() => {
        this.$successMessage('预约并关注成功！')
        // 刷新按钮状态：已预约
        this.gameDetailInfo = { ...this.gameDetailInfo, userReservationStatus: 1 }
        this.setGameStatus()
      }).catch(err => {
        this.$errorMessage(err?.message || '预约失败，请稍后再试！')
      })
    },
    claimReward() {
      getTaskClaim({
        activityPageId: this.$route.query.id,
        prizeDrawActivityId: this.taskPrize?.id,
        taskId: this.taskPrize?.taskInfo[0]?.id,
        deviceId: this.fromChannel ? this.channelUserInfo?.MAC : this.system?.mac,
        channel: this.fromChannel || 'LegionZone'
      }).then(result => {
        if (result.code !== 10000) {
          this.$warningMessage(result.message || '请稍后重试!')
          return
        }
        const res = result.data
        this.awardInfo = res?.prize || {}
        this.drawId = res?.drawId
        switch (this.awardInfo.type) {
          case 1:
            this.$successMessage('谢谢参与！')
            this.refreshAll()
            break
          case 2:
            this.showVirtualAward = true
            break
          case 3:
            this.showPhysicalAward = true
            break
          case 4:
            this.showThirdAward = true
            break
        }
        this[this.isApp ? '$dataReport' : '$trackEvent']('LZ_gamingCenter', 'LZ_storeEventsTaskModClaimRewardButtonShow', 'pv', {
          detail: JSON.stringify({
            taskName: this.taskPrize?.taskInfo?.[0]?.name,
            taskid: this.taskPrize?.taskInfo?.[0]?.id,
            prizeName: this.awardInfo?.name,
            prizeType: this.awardInfo?.type,
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.fromChannel || 'LegionZone'
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        })
      })
    },
    refresh() {
      this.init()
    },
    init() {
      const type = this.taskPrize?.taskInfo[0]?.taskType
      if (this.fromChannel) {
        if ([3, 4].includes(type)) {
          this.getChannelTaskStatus()
        } else {
          this.setGameStatus()
        }
      } else {
        if ([1, 2, 3, 4, 5].includes(type)) {
          this.getDetail(this.taskPrize?.taskInfo[0]?.softId)
        } else {
          this.setGameStatus()
        }
      }
    },
    getChannelTaskStatus() {
      checkChannelTask({
        activityPageId: this.$route.query.id,
        prizeDrawActivityId: this.taskPrize?.id,
        taskId: this.taskPrize?.taskInfo[0]?.id,
        channel: this.fromChannel || 'LegionZone'
      }).then(res => {
        this.channelResult = res?.result
        this.setGameStatus()
      })
    }
  },
  mounted() {
    this.init()
  },
  beforeUnmount() {
    clearInterval(this.interval)
  }
}
</script>
<style scoped lang="scss">
.not-click {
  pointer-events: none;
}
.task-card {
  position: relative;
  margin: 36px 0 72px 0;
  .image {
    width: calc(100% - 116px );
    height: 485px;
    background-size: cover;
    background-position: center;
    margin: 0 58px;
  }
  .download-btn {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 42px;
    background-repeat: no-repeat;
    background-size: 100% 100%;

      :deep(div.DownloadButton) {
        width: 140px;
        height: 42px;
        font-size: 16px;
        font-weight: 700;
      }
      :deep(div.DownloadButtonPad) {
        width: 140px;
        height: 42px;
        font-size: 16px;
        font-weight: 700;
      }
      :deep(div.DownloadButton.rect > div) {
        &::before {
          border: 0 none;
        }
        > div {
          border: 0 none;
          background: none;
          i {
            display: none;
          }
        }
        > span {
          color: rgba(0, 0, 0, 1);
          font-size: 16px;
        }
      }
      :deep(div.DownloadButtonPad.rect > div) {
        &::before {
          border: 0 none;
        }
        > div {
          border: 0 none;
          background: none;
          i {
            display: none;
          }
        }
        > span {
          color: rgba(0, 0, 0, 1);
          font-size: 16px;
        }
      }

  }
  .button {
    cursor: pointer;
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 42px;
    background-size: 100% 100%;
    text-align: center;
    line-height: 42px;
    color: rgba(0, 0, 0, 1);
    font-size: 16px;
    font-weight: 700;
  }
}

@media screen and (max-width: 800px) {
  .PadDevice {
    .task-card .image {
      width: 100%;
      height: 50.25vw;
      margin: 0%;
    }
  }

}
</style>

<style scoped>
.task-card .button:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .task-card .button:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

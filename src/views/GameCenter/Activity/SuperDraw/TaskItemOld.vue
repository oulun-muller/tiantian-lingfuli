<template>
  <dd>
    <div class="task-info">
      <p class="task-name">{{ item.name }}</p>
      <span class="desc">{{ taskRewardDesc }}</span>
    </div>
    <div class="time">{{ displayTaskProgress }}</div>
    <template v-if="showDownloadBtn">
      <div v-if="detail.softId" class="download-btn" @click.capture="reportTask(item)">
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
          :is-click="true"
          :sku-id="detail.skuId" />
      </div>
    </template>
    <div v-else :class="['btn', getTaskBtnStyle(item)?'grey-bac':'']" @click="doTask(item)">{{ getTaskBtnText(item) }}</div>
    <!-- 移动端（手机/Pad）购买任务支付弹层：微信/支付宝，不走 PC 预售/CDK 支付 -->
    <!-- Teleport 到 body，脱离 .task-list-pad 的 backdrop-filter 等祖先，避免 fixed 定位失效跟着滚动 -->
    <Teleport to="body">
      <MobilePayDialog
        :visible="showMobilePayDialog"
        :product="mobileProduct"
        :activity-id="activityId"
        @close="showMobilePayDialog = false"
        @pay-success="onMobilePaySuccess" />
    </Teleport>
  </dd>
</template>
<script>
import { claimReward, checkChannelTask, refreshTaskStatus } from '@/api/activity'
import { getCDKDetail, getPreSaleSoftInfo } from '@/api/cdkMall'
import { getFollowers, toFollowers } from '@/api/gameCenter'
import GameDownloadButton from '@/components/GameDownloadButton'
import DetailFHPay from '../../CDKMall/Detail/FHPay'
import MobilePayDialog from '../Preorder/MobilePayDialog.vue'
import { getUserInfo, doTask } from '../common/messageHelper'
export default {
  name: 'TaskItem',
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportIsPreOrder', 'getReportUrl'],
  components: {
    GameDownloadButton,
    MobilePayDialog
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    prizeDraw: {
      type: Object,
      required: true
    },
    // 预购页任务点击“去完成”时定位到购买区，默认保持原有任务行为。
    scrollToPurchaseOnFinish: { type: Boolean, default: false },
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
    plateNameReport: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      fromChannel: this.$route.query?.fromChannelName || '',
      taskDone: false,
      taskStatus: false,
      detail: {},
      // 购买 CDKey 任务支持多笔订单待领取，先用本地值保证领取后按钮状态立即正确。
      localPendingClaimCount: Number(this.item.pendingClaimCount || 0),
      intervalCount: 0,
      // 移动端购买任务支付弹层
      showMobilePayDialog: false,
      mobileProduct: null
    }
  },
  computed: {
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
    downloadStatus() {
      return this.$store.state.softwareState?.stateMap[this.item.softId]?.status || ''
    },
    downloadStatusPad() {
      const pkgName = this.detail.softDesc?.pkgName || ''
      if (!pkgName) return
      return this.$store.state.softwareStatePad?.stateMap[pkgName]?.status
    },
    showDownloadBtn() {
      // 是下载完成任务/下载安装完成任务 且 任务未完成 且 游戏未安装
      return !this.fromChannel && this.prizeDraw.status && this.prizeDraw.validStatus === 1 && (this.item.taskType === 1 || this.item.taskType === 2) && this.item.finish !== 1 && !this.taskDone && this.downloadStatus !== 'installed'
    },
    system() {
      return this.$store.state.system
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    // 移动端设备（手机/Pad）走微信/支付宝支付弹层；PC 走预售/CDK 支付链路。
    isMobilePay() {
      return !!(this.$isPadDevice || this.$isPhoneDevice)
    },
    activityName() {
      return this.getActivityName()
    },
    channelUserInfo() {
      return this.$store.state.channelInfo.channelUserInfo
    },
    channelInfo() {
      return this.$store.state.channelInfo
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    pendingClaimCount() {
      // 仅购买 CDKey 任务使用待领取次数；老任务继续使用 finishCounts/totalCounts。
      if (this.item.taskType !== 11) return 0
      return Number(this.localPendingClaimCount || 0)
    },
    purchaseCount() {
      // 后端返回的购买成功总次数，用于区分“未购买”和“买过但已领完”。
      if (this.item.taskType !== 11) return 0
      return Number(this.item.purchaseCount || 0)
    },
    claimedPurchaseCount() {
      // 后端返回的已领取购买次数，和 purchaseCount 一起支持购买任务三态展示。
      if (this.item.taskType !== 11) return 0
      return Number(this.item.claimedPurchaseCount || 0)
    },
    hasPendingClaim() {
      return this.item.taskType === 11 && this.pendingClaimCount > 0
    },
    taskRewardDesc() {
      if (this.item.taskType !== 11) {
        return '抽奖次数+' + this.item.taskPrizeDrawCount
      }
      const rewardCount = Number(this.item.taskPrizeDrawCount || 0)
      const rewardText = this.pendingClaimCount > 1
        ? '抽奖次数+' + rewardCount + 'x' + this.pendingClaimCount
        : '抽奖次数+' + rewardCount
      // 购买 CDKey 任务保留右侧 1/1 进度，任务下方补充购买领取状态。
      if (this.pendingClaimCount > 0) {
        return '可领' + this.pendingClaimCount + '次，' + rewardText
      }
      if (this.purchaseCount > 0 || this.claimedPurchaseCount > 0 || this.item.claimed === 1 || this.item.finishCounts > 0 || this.taskStatus) {
        return '多买多抽奖，' + rewardText
      }
      return '尚未购买，' + rewardText
    },
    displayTaskProgress() {
      return (this.taskDone || this.hasPendingClaim || this.taskStatus ? this.item.totalCounts : this.item.finishCounts) + '/' + this.item.totalCounts
    }
  },
  watch: {
    'item.pendingClaimCount': {
      immediate: true,
      handler(value) {
        if (this.item.taskType === 11) {
          this.localPendingClaimCount = Number(value || 0)
          this.taskStatus = this.localPendingClaimCount === 0 && this.taskStatus
        }
      }
    },
    downloadStatus(value) {
      if ((value === 'i' && this.item.taskType === 1) || (value === 'installed' && this.item.taskType === 2)) {
        console.log('downloadStatus changed', value)
        this.startInterval()
      }
    },
    downloadStatusPad(value) {
      if ((value === 6 || value === 3) && (this.item.taskType === 1 || this.item.taskType === 2)) {
        this.startInterval()
      }
    }
  },
  methods: {
    startInterval() {
      if (this.interval) return
      this.intervalCount = 0
      this.interval = setInterval(async() => {
        this.intervalCount++
        this.newTaskStatus = await refreshTaskStatus({
          taskId: this.item.id,
          activityPageId: this.activityId,
          channel: this.fromChannel || 'LegionZone',
          prizeDrawActivityId: this.prizeDraw.id
        })
        console.log('refreshTaskStat2us', this.newTaskStatus, this.intervalCount)
        if (this.newTaskStatus) {
          clearInterval(this.interval)
          this.interval = null
          this.intervalCount = 0
          this.newTaskStatus = null
          this.taskDone = true
        }
        if (this.intervalCount >= 3) {
          clearInterval(this.interval)
          this.interval = null
          this.intervalCount = 0
          this.newTaskStatus = null
          // this.taskDone = true
        }
      }, 2000)
    },
    getTaskBtnStyle(item) {
      if (item.taskType === 11) {
        // 购买任务可重复完成：有待领取时可领奖，无待领取时仍允许继续购买。
        return this.prizeDraw.validStatus !== 1
      }
      return this.prizeDraw.validStatus !== 1 ||
      !!item.claimed ||
      (item.totalCounts > 1 && item.finishCounts < item.totalCounts) ||
      this.taskStatus
    },
    getTaskBtnText(item) {
      switch (this.prizeDraw.validStatus) {
        case 0:
          return '未开启'
        case 2:
          return '活动结束'
        // default:
        //   break
      }
      if (item.taskType === 11 && this.hasPendingClaim) {
        return '领取奖励'
      }
      if (item.taskType === 11) {
        // 购买任务没有待领取次数时仍可再次购买，所以按钮回到“去完成”。
        return '去完成'
      }
      if (item.claimed === 1 || this.taskStatus) {
        return '已领取'
      } else {
        if (item.finish === 1 || this.taskDone || this.hasPendingClaim) {
          return '领取奖励'
        } else {
          // 未完成
          switch (item.taskType) {
            case 4:
              return '立即关注'
            case 6:
              return '领取奖励'
            default:
              return '去完成'
          }
        }
      }
    },
    doTask(item) {
      // 仅购买 CDKey 任务（taskType=11）定位到预售购买区，其他任务保持原有跳转逻辑。
      if (this.scrollToPurchaseOnFinish && item.taskType === 11 && !this.hasPendingClaim) {
        // 点击去完成跳购买区：先上报点击埋点，再定位到购买区
        this.reportTask(item)
        const purchaseEl = document.getElementById('preorder-purchase')
        if (purchaseEl) purchaseEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // 将当前任务一起透传，购买区据此在支付时传入准确的 taskId。
        this.$emit('scroll-to-purchase', item)
        return
      }
      if (!this.isApp && !this.fromChannel && !this.scrollToPurchaseOnFinish) {
        window.location.href = `lenovo-legionzone:#/gamecenter/online/index?id=${this.$route.query.id}&source=browser`
        // this.showOpenAppDialog = true
        this.$emit('showOpenAppDialog', true)
        return
      }
      if (this.prizeDraw.validStatus !== 1) return
      if (this.fromChannel) {
        if (!this.channelUserInfo?.Token) {
          this.reportTask(item)
          getUserInfo({
            showLoginPop: true,
            fromChannel: true
          })
          return
        }
      } else if (!this.userInfo) {
        this.toLenovoLogin()
        return
      }
      if ((item.taskType === 11 && this.hasPendingClaim) || (item.taskType !== 11 && (item.finish === 1 || this.taskDone))) {
        // 普通任务完成后领取奖励；购买任务有待领取订单时领取奖励。
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsClaimTaskRewardButtonClick',
          'click',
          {
            detail: JSON.stringify({
              activityName: this.activityName,
              activityid: this.activityId,
              taskName: item.name,
              taskid: item.id,
              lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
              channel: this.getReportChannel(),
              isPreOrder: this.getReportIsPreOrder(),
              url: this.getReportUrl()
            }),
            uuid: this.channelUserInfo?.uuid || null
          }
        )
        this.claimTaskReward(item).then((res) => {
          // this.drawCountNum = res.availableDrawCount\
          this.$emit('updateDrawCount', res.availableDrawCount)
          if (item.taskType === 11) {
            this.localPendingClaimCount = 0
            this.taskStatus = true
          } else {
            this.taskStatus = true
          }
          this.$successMessage('领取成功！')
        }).catch(err => {
          this.$errorMessage(err.message || '请稍后再试！')
        })
      } else {
        this.reportTask(item)
        if (this.fromChannel) {
          this.doChannelTask(item)
        } else {
          this.doLegionTask(item)
        }
      }
    },
    claimTaskReward(item) {
      const claimParams = {
        activityPageId: this.$route.query.id,
        prizeDrawActivityId: this.prizeDraw.id,
        taskId: item.id,
        channel: this.fromChannel || 'LegionZone'
      }
      if (item.taskType !== 11) {
        return claimReward(claimParams)
      }
      return claimReward(claimParams)
    },
    // 移动端支付成功：关闭弹层并刷新任务状态，等中台回调入账后任务可领取。
    onMobilePaySuccess() {
      this.showMobilePayDialog = false
      this.$emit('refreshPage')
    },
    toLenovoLogin() {
      this.$emit('toLenovoLogin')
    },
    doChannelTask(item) {
      switch (item.taskType) {
        case 6:
          this.$login()
          break
        case 7:
          this.$lzbindphone().then(() => {
            this.$emit('refreshPage')
          })
          break
        default:
          setTimeout(() => {
            doTask({
              pkgName: item.pkgName,
              softId: item.softId,
              taskType: item.taskType,
              taskId: item.id,
              taskName: item.name,
              fromChannel: this.fromChannel
            })
          }, 500)
          break
      }
    },
    async doLegionTask(item) {
      const _query = {
        source_p: 'PAD8',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportPlateName: this.plateNameReport || this.activityName
      }
      if ([1, 2, 3, 5].includes(item.taskType)) {
        _query.actionName = 'autoClick'
      }
      switch (item.taskType) {
        case 4:
          // follow
          toFollowers(item.softId, false).then((res) => {
            if (res.data) {
              this.$message({
                message: '关注成功！',
                type: 'success',
                duration: 2500,
                customClass: 'lg-message--success'
              })
            }
            this.taskDone = true
          })
          break
        case 6:
          this.$login()
          break
        case 7:
          this.$lzbindphone().then(() => {
            this.$emit('refreshPage')
          })
          break
        case 8:
          this.$parentRouter.push('/mygame/index')
          break
        case 11: {
          const skuId = item.skuIds?.[0]
          const productionId = item.productionIds?.[0]
          if (!skuId || !productionId) {
            this.$errorMessage('该购买任务缺少商品信息，请联系运营人员')
            break
          }
          // 移动端（手机/Pad）统一走微信/支付宝支付弹层，PC 走预售/CDK 支付链路。
          if (this.isMobilePay) {
            this.mobileProduct = {
              skuId,
              productionId,
              currentPrice: item.skuPrice || item.price || '',
              skuName: item.skuName || item.name || ''
            }
            this.showMobilePayDialog = true
            break
          }
          const payOnClose = () => {
            this.$emit('refreshPage')
          }
          if (skuId === '46251' || skuId === '46319') {
            // 支付只提交商品信息。中台按 SKU 配置决定是否回调活动服务，不依赖 taskId。
            const payParams = {
              firstId: productionId,
              secondId: skuId,
              // 关闭支付弹框后延迟刷新任务状态，等中台回调入账后任务可领取
              onClose: () => {
                clearTimeout(this._purchasePayRefreshTimer)
                this._purchasePayRefreshTimer = setTimeout(payOnClose, 3000)
              }
            }
            DetailFHPay(payParams)
          } else {
            // 其它 sku：走原 CDK 支付弹框，重新调接口按 sku 取价格
            let price = ''
            const preInfo = await getPreSaleSoftInfo()
            if (preInfo && preInfo.info) {
              const matched = [preInfo.info.normal, preInfo.info.luxury]
                .find(item => item && String(item.skuId) === String(skuId))
              if (matched && matched.currentPrice != null) {
                price = matched.currentPrice
              }
            }

            if (!price) {
              this.$warningMessage('价格不能为空')
              break
            }

            this.$fhPay({
              channel: this.getReportChannel(),
              plateName: this.getReportChannel(),
              skuId,
              price,
              lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
              reportChannel: this.getReportChannel(),
              reportIsPreOrder: this.getReportIsPreOrder(),
              reportUrl: this.getReportUrl(),
              onClose: () => {
                clearTimeout(this._purchasePayRefreshTimer)
                this._purchasePayRefreshTimer = setTimeout(payOnClose, 3000)
              }
            })
          }
          break
        }
        default:
          this.$router.push({
            path: `/gameCenter/detail/${item.softId}`,
            query: _query
          })
          break
      }
    },
    reportTask(item) {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsGoFinishTaskButtonClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.activityId,
            taskName: item?.name,
            taskid: item?.id,
            lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isPreOrder: this.getReportIsPreOrder(),
            url: this.getReportUrl()
          }),
          uuid: this.channelUserInfo?.uuid || null
        }
      )
    },
    async initLegionTask() {
      switch (this.item.taskType) {
        case 1:
        case 2:
        case 3:
          await getCDKDetail(this.item.softId).then(res => {
            this.detail = res || {}
            this.taskDone = res?.downloadInfo?.userReservationStatus === 1
          })
          break
        case 4:
          await getFollowers({
            softId: this.item.softId
          }).then(res => {
            this.taskDone = !!res
          })
          break
      }
    },
    async initChannelTask() {
      if ([3, 4].includes(this.item.taskType)) {
        await checkChannelTask({
          activityPageId: this.$route.query.id,
          prizeDrawActivityId: this.prizeDraw.id,
          taskId: this.item?.id,
          channel: this.fromChannel || 'LegionZone'
        }).then(res => {
          this.taskDone = res?.result
        })
      }
    }
  },
  async created() {
    if (this.fromChannel) {
      await this.initChannelTask()
    } else {
      await this.initLegionTask()
    }
  },
  beforeUnmount() {
    clearInterval(this.interval)
    this.interval = null
    this.newTaskStatus = null
    if (this._purchasePayRefreshTimer) {
      clearTimeout(this._purchasePayRefreshTimer)
      this._purchasePayRefreshTimer = null
    }
  }
}
</script>
<style lang="scss" scoped>
dd {
  display: flex;
  margin-top: 25px;
  border: 1px solid rgba(255, 255, 255, 0.40);
  padding: 13px 12px 13px 17px;
  align-items: center;
  &:first-child{
    margin-top: 26px;
  }
  .task-info {
    flex: auto;
    .task-name {
      font-size: 14px;
      font-weight: 700;
      color: rgba(234, 247, 255, 0.80);
      max-width: calc(27vw - 80px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .desc {
      font-size: 12px;
      color: rgba(234, 247, 255, 0.40);
    }
  }
  .time {
    width: 40px;
  }
  .btn {
    cursor: pointer;
    width: 64px;
    height: 26px;
    // background: linear-gradient(180deg, #929292 1.88%, #EAF7FF 98.12%);
    // border: 1px solid rgba(234, 247, 255, 0.50);
    background: linear-gradient(298deg, rgb(190, 191, 191) 0%, rgb(234, 247, 255) 30%);
    color: #000;
    font-size: 12px;
    font-weight: 400;
    text-align: center;
    line-height: 26px;
    font-family: "Microsoft YaHei";
    &.grey-bac {
      pointer-events: none;
      border: 1px solid #EAF7FF80;
      background-image: linear-gradient(180deg, #929292 30%, #EAF7FF 70%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
  .download-btn {
    width: 64px;
    height: 26px;

      :deep(div.DownloadButton) {
        width: 64px;
        height: 26px;
      }
      :deep(div.DownloadButtonPad) {
        width: 64px;
        height: 26px;
      }
      :deep(div.DownloadButton.rect > div span),
      :deep(div.DownloadButtonPad.rect > div span) {
        font-weight: normal;
        font-size: 12px;
      }


      :deep(.grey-rect-btn) {
          min-width: 0;
          font-size: 12px;
          width: 64px;
          line-height: 26px;
          height: 26px;
          font-weight: normal;
      }

  }
}
@media screen  and (max-width: 800px) {
  dd {
    display: flex;
    margin-top: 25px;
    border: 1px solid rgba(255, 255, 255, 0.40);
    padding: 13px 12px 13px 17px;
    align-items: center;
    &:first-child{
      margin-top: 26px;
    }
    .task-info {
      flex: auto;
      .task-name {
        font-size: 14px;
        font-weight: 700;
        color: rgba(234, 247, 255, 0.80);
        max-width: 50vw;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .desc {
        font-size: 12px;
        color: rgba(234, 247, 255, 0.40);
      }
    }
    .time {
      width: 40px;
    }
    .download-btn {
      width: 64px;
      height: 26px;

        :deep(.grey-rect-btn) {
          font-size: 12px;
          line-height: auto;
          font-weight: normal;
          min-width:0px;
          width: 64px;
          height: 26px;
        }

    }
    .btn {
      cursor: pointer;
      width: 64px;
      height: 26px;
      background: linear-gradient(180deg, #929292 1.88%, #EAF7FF 98.12%);
      border: 1px solid rgba(234, 247, 255, 0.50);
      color: #000;
      font-size: 12px;
      font-weight: 400;
      text-align: center;
      line-height: 26px;
      font-family: "Microsoft YaHei";
      &.grey-bac {
        pointer-events: none;
        border: 1px solid #EAF7FF80;
        background-image: linear-gradient(180deg, #929292 30%, #EAF7FF 70%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
}
</style>

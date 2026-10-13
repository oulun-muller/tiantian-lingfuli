<template>
  <div>
    <section class="Banner">
      <video
        v-if="baseInfo.coverVideoUrl"
        ref="videoDom"
        :src="baseInfo.coverVideoUrl"
        :poster="baseInfo.coverImgUrl"
        muted
        autoplay
        loop
        class="video"
      />
      <div v-else class="image" :style="{ backgroundImage: `url(${baseInfo.coverImgUrl})` }"/>
      <div class="bottom-shadow"/>
      <div class="left-shadow"/>
      <div class="right-shadow"/>
      <div v-if="baseInfo.coverMaskImgUrl" class="covermask" :style="{ backgroundImage: `url(${baseInfo.coverMaskImgUrl})` }"/>
      <div v-if="baseInfo.showBtn" class="download-btn" tabindex="0" role="button" aria-label="立即下载" :style="{ backgroundImage: `url(${baseInfo.btnImgUrl})` }" @click="clickBannerBtn" @keydown.enter.prevent.stop="clickBannerBtn" @keydown.space.prevent.stop="clickBannerBtn"/>
      <p class="bind-info">
        <template v-if="baseInfo.liveLinkRelate && baseInfo.liveLinkRelate.bindGameRole">
          <template v-if="showRoleName">欢迎您，
            <template v-if="baseInfo.liveLinkRelate.showGameZones">
              {{ baseInfo.liveLinkRelate.areaName }}{{ baseInfo.liveLinkRelate.partitionName }}，
            </template>
            {{ baseInfo.liveLinkRelate.roleName }}
            [<a v-if="baseInfo.liveLinkRelate.supportChangeGameRole" class="bind-info-link" @click="gotoBindRole('edit')">修改角色</a>]
          </template>
          <template v-else>
            您还未绑定游戏角色 <i class="feng"/> [<a class="bind-info-link" @click="gotoBindRole">绑定游戏角色</a>]
          </template>
          <i class="feng"/>
        </template>
        <span class="records-list" tabindex="0" role="button" aria-label="我的奖品" @click="clickShowAwardList" @keydown.enter.prevent.stop="clickShowAwardList" @keydown.space.prevent.stop="clickShowAwardList">我的奖品</span>
      </p>
      <OpenAppDialog v-if="showOpenAppDialog" :visible="showOpenAppDialog" @close="showOpenAppDialog=false"/>
      <AwardList v-if="showAwardList" :visible="showAwardList" :all-prize-ids="allPrizeIds" :base-info="baseInfo" @close="showAwardList=false"/>
    </section>
  </div>
</template>
<script>
import OpenAppDialog from '../../common/OpenAppDialog.vue'
import AwardList from '../common/AwardList.vue'
import { checkAuth } from '../common/utils'
import { getBindThirdUrl } from '@/api/activity'
import { sendThirdUrl, doTask } from '../common/messageHelper'
export default {
  name: 'BannerPc1',
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportUrl'],
  data() {
    return {
      showOpenAppDialog: false,
      showAwardList: false,
      fromChannel: this.$route.query?.fromChannelName || ''
    }
  },
  components: {
    OpenAppDialog,
    AwardList
  },
  computed: {
    showRoleName() {
      const { roleName, needPrivacyAuth, hasPrivacyAuth } = this.baseInfo?.liveLinkRelate || {}
      return roleName && (!needPrivacyAuth || (needPrivacyAuth && hasPrivacyAuth))
    },
    user() {
      return this.$store.state.user
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    activityName() {
      return this.getActivityName()
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    channelInfo() {
      return this.$store.state.channelInfo
    }
  },
  props: {
    allPrizeIds: {
      default: null,
      type: Array
    },
    prizeDraw: {
      default: null,
      type: Object
    },
    baseInfo: {
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
    plateNameReport: {
      default: '',
      type: String
    }
  },
  methods: {
    clickShowAwardList() {
      console.log(this.isApp, this.fromChannel)

      if (!this.isApp && !this.fromChannel) {
        window.location.href = `lenovo-legionzone:#/gamecenter/online/index?id=${this.$route.query.id}&source=browser`
        this.showOpenAppDialog = true
        return
      }
      if (!checkAuth(this.fromChannel)) return
      this.showAwardList = true
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsWinRecordEnterButtonClick',
        'click',
        {
          detail: JSON.stringify({
            from: 1,
            activityName: this.activityName,
            activityid: this.activityId,
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.fromChannel || 'LegionZone'
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
    },
    gotoBindRole(type) {
      if (!checkAuth(this.fromChannel)) return
      let avatar, nickName, redirectUrl
      // 如果来源于渠道，则直接获取渠道信息
      if (this.fromChannel) {
        avatar = this.channelInfo?.channelUserInfo?.avatar || ''
        nickName = this.channelInfo?.channelUserInfo?.nickName || ''
        redirectUrl = this.channelInfo?.callbackUrl || ''
      } else {
        avatar = this.user?.avatar?.avatar
        nickName = this.user?.avatar?.nickName
        redirectUrl = this.$isPadDevice
          ? `${window.location.href.split('#/')[0]}#/gamecenter/online/index?id=${this.activityId}&source=browser&t=${Date.now()}`
          : `lenovo-legionzone:#/gamecenter/online/index?id=${this.activityId}&source=browser&t=${Date.now()}`
      }
      const { actId, gameId, privacyAuthScene, needPrivacyAuth } = this.baseInfo?.liveLinkRelate || {} // , hasPrivacyAuth
      getBindThirdUrl({
        fromId: this.activityId,
        actId,
        gameIdList: gameId,
        faceUrl: avatar,
        nickName,
        redirectUrl,
        gameAuthScene: needPrivacyAuth ? privacyAuthScene : null
      }).then(res => {
        if (this.fromChannel) {
          sendThirdUrl({
            url: res.bindUrl,
            fromChannel: true,
            fallback: () => window.open(res.bindUrl, '_blank')
          })
        } else {
          window.open(res.bindUrl, '_blank')
        }
      })
      if (type === 'edit') {
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsToggleBindingRoleButtonClick',
          'click',
          {
            channel: this.fromChannel || 'LegionZone',
            uuid: this.channelInfo?.channelUserInfo?.uuid || null
          }
        )
      } else {
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsBindRolesButtonClick',
          'click',
          {
            channel: this.fromChannel || 'LegionZone',
            uuid: this.channelInfo?.channelUserInfo?.uuid || null
          }
        )
      }
    },
    clickBannerBtn() {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsBannerButtonClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.activityId,
            gameName: this.baseInfo?.softName,
            gameid: this.baseInfo?.softId,
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            url: this.getReportUrl()
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
      if (this.fromChannel) {
        setTimeout(() => {
          doTask({
            softId: this.baseInfo.softId,
            fromChannel: true,
            fallback: () => this.clickToUrl()
          })
        }, 500)
      } else {
        this.clickToUrl()
      }
    },
    clickToUrl() {
      if (!this.isApp) {
        window.location.href = `lenovo-legionzone:#/gamecenter/online/index?id=${this.activityId}&source=browser`
        this.showOpenAppDialog = true
        return
      }
      this.$router.push({
        path: `/gameCenter/detail/${this.baseInfo.softId}`,
        query: {
          source_pp: this.$route.query.source_pp || '',
          source_p: 'PAD8',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.plateNameReport || this.activityName
        }
      })
    }
  },
  beforeUnmount() {
    // 清理视频资源
    if (this.$refs.videoDom) {
      this.$refs.videoDom.pause()
      this.$refs.videoDom.currentTime = 0
      this.$refs.videoDom.src = null
    }
  }
}
</script>
<style lang="scss" scoped>
.Banner {
  position: relative;
  width: 100%;
  height: 600px;
  object-fit: cover;
  .feng {
    margin-right: 36px;
  }
  .records-list {
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    background: linear-gradient(180deg, #929292 1.88%, #EAF7FF 98.12%);
    background-clip: text;
    -webkit-text-fill-color: transparent;
    &::after {
      content: '';
      display: inline-block;
      width: 5px;
      height: 9px;
      margin-left: 3px;
      background: transparent url('~@/images/gamecenter/right-arrow.png') no-repeat center center/ contain;
    }
  }
  .bind-info {
    position: absolute;
    top: 554px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(234, 247, 255, 0.6);
    font-weight: 400;
    i.feng {
      display: inline-block;
      width: 7px;
    }
    .bind-info-link {
      cursor: pointer;
      color: rgba(56, 110, 254, 1);
      font-weight: 700;
      margin: 0 4px;
    }
    .arrow {
      &::after {
        content: '';
        display: inline-block;
        width: 14px;
        height: 14px;
        background: transparent url('~@/images/gamecenter/blue-arrow.png') no-repeat center center/ contain;
        vertical-align: -2px;
      }
    }
  }
  .covermask {
    position: absolute;
    top: 310px;
    left: 50%;
    transform: translateX(-50%);
    height: 138px;
    width: 100%;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  }
  .download-btn {
    cursor: pointer;
    position: absolute;
    top: 475px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 42px;
    background-size: 100% 100%;
    background-position: center;
  }
  .image {
    background-size: cover;
    background-position: center;
  }
  .image, .video {
    object-fit: cover;
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .left-shadow {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 300px;
    height: 600px;
    opacity: 0.8;
    background: linear-gradient(90deg, var(--bacColor) 0%, rgba(9, 21, 28, 0) 100%);
  }
  .right-shadow {
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 600px;
    opacity: 0.8;
    background: linear-gradient(270deg, var(--bacColor) 0%, rgba(9, 21, 28, 0) 100%);
  }
  .bottom-shadow {
    pointer-events: none;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 334px;
    background: linear-gradient(0, var(--bacColor) 0, rgba(0, 0, 0, 0) 100%);
  }
}
</style>
<style scoped>
.Banner .records-list:focus-visible,
.bind-info .bind-info-link:focus-visible,
.Banner .download-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .Banner .records-list:focus-visible,
  .bind-info .bind-info-link:focus-visible,
  .Banner .download-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

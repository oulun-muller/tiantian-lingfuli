<template>
  <section v-if="!lock" :class="[fromChannel ? 'IsFromChannel' : '']">
    <header
      draggable
      @dragstart.prevent="$startDrag"
      @dblclick.self="$toggleMaximize"
      :class="{'header-reset' : !fromChannel && !isApp, 'header-content': true}" />
    <div v-if="isApp && !isFromOperation" class="bac-btn" tabindex="0" role="button" aria-label="返回" @click="goBack" @keydown.enter.prevent.stop="goBack" @keydown.space.prevent.stop="goBack">返回</div>
    <div v-if="baseInfo && !isGamePreorder" :class="['Activity', { 'slot-machine-activity': isSlotMachineTemplate }]" :style="{ '--bacColor': bacColor }">
      <div class="top-shadow"/>
      <Banner
        :first-local="String(firstLocal)"
        :second-local="String(secondLocal)"
        :third-local="String(thirdLocal)"
        :plate-name-report="plateNameReport"
        :base-info="baseInfo"
        :prize-draw="prizeDraw"
        :all-prize-ids="allPrizeIds" />
      <template v-if="taskPrizeList && taskPrizeList.length">
        <TaskCard
          v-for="(item, key) in taskPrizeList"
          :key="`${new Date().getTime()}` +key"
          :task-prize="item"
          :base-info="baseInfo"
          :first-local="String(firstLocal)"
          :second-local="String(secondLocal)"
          :third-local="String(thirdLocal)"
          @refreshPage="refreshPage"
        />
      </template>
      <component
        v-if="prizeDraw"
        :is="gameTemplateComponent"
        ref="GameTemplate"
        :base-info="baseInfo"
        :prize-draw="prizeDraw"
        @refreshPage="refreshPage"
        @toLenovoLogin="toLenovoLogin"
        :first-local="String(firstLocal)"
        :second-local="String(secondLocal)"
        :third-local="String(thirdLocal)"
        :plate-name-report="plateNameReport"
        :all-prize-ids="allPrizeIds" />
      <GameDetailPad v-if="$isPadDevice" :base-info="baseInfo" />
      <GameDetail v-else :base-info="baseInfo" />
      <ActivityStandards :base-info="baseInfo" />
    </div>
    <!-- 游戏预购页模板（bannerTemplateType='3'） -->
    <div v-else-if="baseInfo && isGamePreorder" class="Activity preorder-activity">
      <div class="preorder-header-login" v-if="!fromChannel && !isApp">
        <template v-if="isLoggedIn">
          <span class="login-user">{{ loginUserName }}</span>
          <span class="login-divider">|</span>
          <span class="login-action" role="button" tabindex="0" @click="handleLogout" @keydown.enter.prevent="handleLogout">退出登录</span>
        </template>
        <span v-else class="login-action" role="button" tabindex="0" @click="handleLogin" @keydown.enter.prevent="handleLogin"><i>请</i>【登录】</span>
      </div>
      <GamePreorderPage
        :base-info="baseInfo"
        :activity-id="activityId"
        :prize-draw="prizeDraw"
        :task-prize-list="taskPrizeList"
        :all-prize-ids="allPrizeIds"
        :first-local="String(firstLocal)"
        :second-local="String(secondLocal)"
        :third-local="String(thirdLocal)"
        :plate-name-report="plateNameReport"
        :login-logged-in="isLoggedIn"
        @login="handleLogin"
        @toLenovoLogin="toLenovoLogin"
        @logout="handleLogout"
        @refreshPage="refreshPage"
        :is-app="isApp"
        :from-channel="fromChannel"
      />
    </div>
    <div v-else class="no-content">
      <div class="image"/>
      <span>{{ errorMessage || '活动不存在！' }}</span>
      <button v-if="isTokenError" class="refresh-btn" @click="reloadPage">刷新页面</button>
    </div>
  </section>
</template>
<script>
import Banner from './Banner'
import SuperDraw from './SuperDraw'
import SlotMachine from './SlotMachine'
import GameDetail from './GameDetail'
import GameDetailPad from './GameDetailPad'
import GamePreorderPage from './Preorder/index.vue'
import TaskCard from './TaskCard'
import ActivityStandards from './ActivityStandards'
import { getActivityDetail } from '@/api/activity'
import { createTabPageReporter } from '@/utils/dataReport'
import { getUserInfo, getCallbackUrl } from './common/messageHelper'
import { GAME_TEMPLATE_IDS, resolveGameTemplateId } from './gameTemplateRegistry'
import Cookies from 'js-cookie'
import request from '@/utils/request'

const GAME_TEMPLATE_COMPONENTS = Object.freeze({
  [GAME_TEMPLATE_IDS.SUPER_DRAW]: SuperDraw,
  [GAME_TEMPLATE_IDS.SLOT_MACHINE]: SlotMachine
})
export default {
  provide() {
    return {
      activityId: this.activityId,
      getActivityName: () => this.activityName,
      getReportChannel: () => this.channelName,
      getReportIsPreOrder: () => (this.isGamePreorder ? 'yes' : 'no'),
      getReportUrl: () => this.reportUrl
    }
  },
  components: {
    Banner,
    SuperDraw,
    SlotMachine,
    GameDetail,
    GameDetailPad,
    GamePreorderPage,
    TaskCard,
    ActivityStandards
  },
  data() {
    return {
      bacColor: '#040404',
      activityId: this.$route.query.id,
      activityName: '',
      baseInfo: null,
      prizeDraw: null,
      taskPrizeList: null,
      errorMessage: null,
      lock: true,
      allPrizeIds: null,
      fromChannel: this.$route.query?.fromChannelName || '',
      tokenRetryCount: 0,
      maxTokenRetry: 2,
      browserUserInfo: null,
      loadingId: '',
      // 页面曝光（LZ_storeEventsPageShow）每个页面生命周期只上报一次，避免刷新/关弹窗等触发重复曝光
      pageShowReported: false
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      if (this.$route.query.source === 'browser') {
        return 9
      }

      return this.$route.query.firstLocal || ''
    },
    secondLocal() {
      if (this.$route.query.reportFrom === 'push' || this.$route.query.source === 'browser') {
        return 11
      }

      return this.$route.query.secondLocal || ''
    },
    thirdLocal() {
      return this.$route.query.thirdLocal || ''
    },
    plateNameReport() {
      return this.$route.query.plateNameReport ? this.$route.query.plateNameReport : ''
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    isFromOperation() {
      return this.$route.query?.isActiveTab === 'sidebarOperation'
    },
    channelInfo() {
      return this.$store.state.channelInfo
    },
    gameTemplateComponent() {
      return GAME_TEMPLATE_COMPONENTS[resolveGameTemplateId(this.prizeDraw?.gameTemplateId)]
    },
isSlotMachineTemplate() {
      return resolveGameTemplateId(this.prizeDraw?.gameTemplateId) === GAME_TEMPLATE_IDS.SLOT_MACHINE
    },
    // 是否为游戏预购页模板（bannerTemplateType='3'）
    isGamePreorder() {
      return this.baseInfo?.bannerTemplateType === '3'
    },
    isLoggedIn() {
      // Cookie 仅用于浏览器登录回调；App 和商店渠道继续以宿主同步的登录态为准。
      const browserCookieToken = !this.isApp && !this.fromChannel ? Cookies.get('lenovoToken') : ''
      return !!(browserCookieToken || this.userInfo?.Token || this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.Token)
    },
    loginUserName() {
      return this.browserUserInfo?.UserName || this.userInfo?.UserName || this.userInfo?.nickName || this.channelInfo?.channelUserInfo?.nickName || ''
    },
    isTokenError() {
      return this.errorMessage === 'TOKEN失效，请刷新页面'
    },
    channelName() {
      if (this.isApp) {
        return 'LegionZone'
      }

      if (this.fromChannel) {
        return 'LeAppStore'
      }

      return 'LeExternal'
    },
    reportUrl() {
      if (this.$route.query?.channel || this.channelName === 'LeExternal') {
        return window.location.href
      }
      return ''
    }
  },
  watch: {
    userInfo() {
      this.refreshPage()
    },
    '$route.query.t': {
      handler() {
        this.refreshPage()
      }
    },
    '$route.query.id': {
      handler() {
        this.refreshPage()
      }
    }
  },
  created() {
    this._reporter = createTabPageReporter('活动详情', '/gameCenter/online/index')
    this._reporter.reportStart()
    window.removeEventListener('message', this.messageHandle)
    window.addEventListener('message', this.messageHandle)

    // 注册 activitySDK 事件监听
    this.registerActivitySDKEvents()

    this.initBrowserUserInfo()
    this.checkUserInfo()
    if (this.fromChannel) {
      this.waitingTimer = setTimeout(() => {
        this.init()
        clearTimeout(this.waitingTimer)
      }, 5000)
    }
  },
  mounted() {
    requestAnimationFrame(() => this._reporter.reportFirstFrame())
  },
  methods: {
    // 浏览器环境恢复登录令牌并获取昵称，供预购页统一展示
    async initBrowserUserInfo() {
      if (this.fromChannel || this.isApp) return
      const token = Cookies.get('lenovoToken')
      if (!token) return
      const existing = this.$store.state.user.userInfo || {}
      const browserUser = { ...existing, Token: token, Realm: 'pcassistant.lenovo.com' }
      const userPayload = { userInfo: browserUser }
      const syncPayload = { ready: true, user: userPayload }
      this.$store.dispatch('syncUserInfo', syncPayload)
      try {
        const res = await request({ url: '/cloud-legionzone/api/v1/user/avatar', method: 'POST' })
        if (res && res.code === 10000 && res.data) {
          this.browserUserInfo = { UserName: res.data.nickName }
          // 把 avatar 接口的完整账号信息合并进 userInfo。
          // lenovoId 与埋点使用的 UserID 同源，同时写入保证两套字段都可取；空值不覆盖已有值。
          const current = this.$store.state.user.userInfo || {}
          this.$store.dispatch('syncUserInfo', {
            ready: true,
            user: {
              userInfo: {
                ...current,
                lenovoId: res.data.lenovoId || '',
                UserID: res.data.lenovoId || current.UserID || '',
                nickName: res.data.nickName || current.nickName || '',
                avatar: res.data.avatar || current.avatar || ''
              }
            }
          })
        }
      } catch (error) {
        console.warn('浏览器用户信息获取失败', error)
      }
    },
    registerActivitySDKEvents() {
      if (window.ActivityJSBridge && typeof window.ActivityJSBridge.addListener === 'function') {
        this._unsubRefresh = window.ActivityJSBridge.addListener('ACTIVITY_REFRESH', () => {
          this.refreshPage()
        })
      }
    },
    handleUserInfoUpdate(data) {
      // 渠道有没有登录都会发送此消息，开始获取数据
      this.init()
      clearTimeout(this.waitingTimer)

      // ActivityJSBridge 可能直接传递用户信息对象，或包含 payload 的对象
      const userInfo = data?.payload || data
      if (userInfo) {
        const { Token, Realm, UserId, MAC, avatar, nickName, uuid } = userInfo
        this.$store.dispatch('setChannelUser', {
          Token,
          Realm,
          UserId,
          MAC,
          avatar,
          nickName,
          uuid
        })
      }
    },
    handleCallbackUrlResponse(data) {
      const response = data?.payload || data
      if (response?.url) {
        this.$store.dispatch('setChannelCallbackUrl', response.url)
      }
    },
    async checkUserInfo() {
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      // 如果是渠道则先获取用户信息
      if (this.fromChannel) {
        const userInfoPromise = getUserInfo({
          showLoginPop: false,
          fromChannel: true
        })

        // 如果 getUserInfo 返回 Promise (ActivityJSBridge 场景)，处理返回值
        if (userInfoPromise && typeof userInfoPromise.then === 'function') {
          try {
            const res = await userInfoPromise
            if (res) {
              this.handleUserInfoUpdate(res)
            }
          } catch (err) {
            console.error('获取用户信息失败:', err)
          }
        }

        const callbackUrlPromise = getCallbackUrl({
          fromChannel: true
        })

        if (callbackUrlPromise && typeof callbackUrlPromise.then === 'function') {
          try {
            const res = await callbackUrlPromise
            if (res) {
              this.handleCallbackUrlResponse(res)
            }
          } catch (err) {
            console.error('获取回调地址失败:', err)
          }
        }
      } else {
        // 如果是 lz 则直接获取数据
        this.$emit('headerStatus', false)
        if (!this.userInfo) {
          this.$login()
        }
        this.init()
      }
    },
    goBack() {
      if (this.$route?.query?.source !== 'browser' && this.$route?.query?.reportFrom !== 'push' && window.history.length > 2) {
        this.$parentRouter.back()
        return
      }
      this.$parentRouter.push('/gameCenter/index')
    },
    refreshPage() {
      this.checkUserInfo()
    },
    handleLogin() {
      try {
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_preOrderH5topRightLoginClick',
          'click',
          {
            detail: JSON.stringify({
              plateName: this.activityName,
              activityid: this.activityId,
              lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId || '',
              channel: this.channelName,
              url: this.reportUrl
            }),
            uuid: this.channelInfo?.channelUserInfo?.uuid || null
          }
        )
      } catch {
        this.$store.dispatch('pageLoaded', false)
      }

      // 保持预售页原有登录流程：渠道、原生客户端、浏览器分别处理
      if (this.fromChannel) {
        getUserInfo({ showLoginPop: true, fromChannel: true })
        return
      }

      // Legion Zone 客户端通过宿主能力调起登录，不降级到浏览器登录。
      // 注意：index.html 无条件引入 jssdk.js，纯浏览器也会注入 window.LegionZoneMobile，
      // 因此此处不能用 window.LegionZoneMobile 判端内，须用 isApp（system.version 是否存在）。
      if (this.isApp) {
        if (typeof this.$login === 'function') {
          this.$login()
        } else if (typeof this.$errorMessage === 'function') {
          this.$errorMessage('[预购页] 原生环境未提供宿主登录能力！')
        }
        return
      }

      // 浏览器环境跳转联想通行证登录
      this.toLenovoLogin()
    },
    handleLogout(force = false) {
      if (force) {
        try {
          this[this.isApp ? '$dataReport' : '$trackEvent'](
            'LZ_gamingCenter',
            'LZ_preOrderH5topRightLogoutClick',
            'click',
            {
              detail: JSON.stringify({
                plateName: this.activityName,
                activityid: this.activityId,
                lenovoid: '',
                channel: this.channelName,
                url: this.reportUrl
              }),
              uuid: this.channelInfo?.channelUserInfo?.uuid || null
            }
          )
        } catch {
          this.$store.dispatch('pageLoaded', false)
        }
      }

      document.cookie = 'lenovoToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      const emptyUser = { userInfo: null }
      this.$store.dispatch('syncUserInfo', { ready: true, user: emptyUser })
      window.location.reload()
    },
    // 浏览器环境跳转联想通行证，登录完成后回到当前活动页
    toLenovoLogin() {
      const passport = 'https://passport.lenovo.com/cnwebauthnv3/gateway'
      const realm = process.env.LOGINREALM || 'pcassistant.lenovo.com'
      const href = window.location.href.split('?tk')[0]
      const ctx = window.btoa(href)
      const baseUrl = window.location.href.split('#')[0]
      const callback = baseUrl.endsWith('index.html')
        ? baseUrl.replace('index.html', 'logincallback.html')
        : (baseUrl.endsWith('/') ? baseUrl + 'logincallback.html' : baseUrl + '/logincallback.html')
      window.location.href = passport +
        '?lenovoid.action=uilogin' +
        '&lenovoid.realm=' + realm +
        '&lenovoid.cb=' + encodeURIComponent(callback) +
        '&lenovoid.ctx=' + encodeURIComponent(ctx)
    },
    reloadPage() {
      window.location.reload()
    },
    init() {
      this.activityId = this.$route.query.id || this.activityId
      // 同一活动同渠道的详情请求做去重：created 里 checkUserInfo 会直接 init，
      // 而 initBrowserUserInfo 同步 userInfo 会触发 userInfo watch 再 refreshPage->init，
      // 导致详情接口被并发请求两遍。
      const idOk = this.activityId != null && String(this.activityId) !== '' && String(this.activityId) !== 'undefined'
      if (!idOk) {
        this.errorMessage = '活动不存在！'
        this.lock = false
        this.$store.dispatch('pageLoaded', false)
        return
      }
      const loadingId = `${this.activityId}_${this.fromChannel || 'LegionZone'}`
      if (this.loadingId === loadingId) return
      this.loadingId = loadingId
      getActivityDetail(this.activityId, this.fromChannel || 'LegionZone').then(res => {
        const { baseInfo, prizeDraws, name } = res || {}
        this.activityName = name
        this.bacColor = baseInfo?.backColor
        this.baseInfo = baseInfo
        //  this.baseInfo['bannerType'] = 2
        this.allPrizeIds = prizeDraws.reduce((acc, item) => {
          acc.push(item.id)
          return acc
        }, [])
        this.prizeDraw = prizeDraws.filter(item => item.type === 0)[0]
        this.taskPrizeList = prizeDraws.filter(item => item.type === 1)
        this.$nextTick(() => this.$refs.GameTemplate?.refresh())
      }).catch(err => {
        this.errorMessage = err.message
      }).finally(() => {
        // 请求结束即释放去重标记，保证后续 refreshPage 触发的真实刷新仍能正常发起。
        this.loadingId = ''
        if (!this._reporterLoaded) {
          this._reporterLoaded = true
          this._reporter.reportLoaded()
        }
        this.$store.dispatch('pageLoaded', false)
        this.lock = false
        try {
          this[this.isApp ? '$dataReport' : '$trackEvent'](
            'LZ_gamingCenter',
            'LZ_storeEventsPageShow',
            'pv',
            {
              detail: JSON.stringify({
                source_p: this.$route.query.source_p || '',
                firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
                secondLocal: this.$isPadDevice ? 'PAD' : 11,
                plateName: this.activityName,
                activityid: this.activityId,
                lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
                bindRoleMod: this.baseInfo?.liveLinkRelate?.bindGameRole ? 1 : 0,
                bindRole: this.baseInfo?.liveLinkRelate?.roleName || '未绑定',
                channel: this.channelName,
                url: this.reportUrl,
                isPreOrder: this.isGamePreorder ? 'yes' : 'no'
              }),
              uuid: this.channelInfo?.channelUserInfo?.uuid || null
            }
          )
        } catch {
          this.$store.dispatch('pageLoaded', false)
        }
      })
    },
    messageHandle(e) {
      try {
        const obj = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        console.log('活动页接收的消息：', obj)
        switch (obj.type) {
          case 'ACTIVITY_GET_CALLBACK_URL_RESPONSE':
            this.handleCallbackUrlResponse(obj.payload)
            break
          case 'ACTIVITY_USER_INFO_UPDATE':
            this.handleUserInfoUpdate(obj.payload)
            break
          case 'ACTIVITY_REFRESH':
            this.refreshPage()
            break
        }
      } catch (e) {
        console.warn(e)
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('message', this.messageHandle)

    // 清理 ActivityJSBridge 事件监听
    if (this._unsubRefresh && window.ActivityJSBridge) {
      window.ActivityJSBridge.removeListener(this._unsubRefresh)
    }
  }
}
</script>
<style lang="scss" scoped>
.no-content {
  background-color: #040404;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  color: rgb(234 247 255 / 60%);
  .image {
    width: 48px;
    height: 48px;
    background: transparent url('~@/images/Index/airplane.png') no-repeat center center / contain;
  }
  .refresh-btn {
    cursor: pointer;
    border: none;
    padding: 8px 28px;
    border-radius: 18px;
    color: #040404;
    font-size: 14px;
    background: #4fc3f7;
  }
}
.Activity {
  background-color: var(--bacColor);
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
  .top-shadow {
    pointer-events: none;
    z-index: 1;
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 124px;
    opacity: 0.9;
    background: linear-gradient(180deg, var(--bacColor) 0%, rgba(0, 0, 0, 0.00) 100%);
  }
  &.slot-machine-activity .top-shadow {
    display: none;
  }
}
header {
  height: 48px;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 2;
  &.header-reset {
    pointer-events: none;
  }
}
.bac-btn {
  cursor: pointer;
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 74px;
  padding-left: 27px;
  color: rgb(234 247 255 / 40%);
  font-size: 16px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
  &::before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 20px;
    margin-right: 6px;
    background: transparent url('~@/images/Index/game-back.png') no-repeat center center / contain;
  }
}
.IsFromChannel {
  margin-top: 48px;
}

/* 预购页顶部登录信息样式，保持原预购页视觉效果 */
.preorder-activity {
  .preorder-header-login {
    position: fixed;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: end;
    padding-right: 40px;
    gap: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    height: 56px;
    width: 100%;
    background: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.00) 100%);
    pointer-events: none;
    .login-user { color: #fff; }
    .login-divider { color: rgba(255, 255, 255, 0.3); }
    .login-action {
      cursor: pointer;
      color: #fff;
      font-size: 14px;
      font-weight: 400;
      &:hover { color: #fff; }
      position: relative;
      z-index: 9;
      pointer-events: auto;
      i {
        color: rgba(255, 255, 255, 0.6);
        font-style: normal;
      }
    }
  }
}

.PhoneDevice {
  .top-shadow {
    display: none;
  }
}
</style>
<style scoped>
.bac-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .bac-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
<style>
.slot-machine-activity .Banner {
  overflow: hidden;
}
.collapse-layout .Activity .top-shadow {
  width: calc(100% - 80px);
}
.expand-layout .Activity .top-shadow {
  width: calc(100% - 180px);
}
.header-content {
  pointer-events: none;
}
</style>

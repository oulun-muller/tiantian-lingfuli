<template>
  <div class="ActivityZone" :class="{ 'showMask': showMask, 'phone_style': $isPhoneDevice }">
    <div v-if="$isPadDevice && notifybarShow" class="notify-bar">
      <div class="notify-content">
        <i></i>
        <span>立即开启通知，游戏福利不错过</span>
        <div class="setting-button" tabindex="0" role="button" aria-label="立即开启通知" @click="openNotifySetting" @keydown.enter.prevent.stop="openNotifySetting" @keydown.space.prevent.stop="openNotifySetting">立即开启</div>
        <div class="close-button" tabindex="0" role="button" aria-label="关闭通知提示" @click="closeNotifyBar" @keydown.enter.prevent.stop="closeNotifyBar" @keydown.space.prevent.stop="closeNotifyBar"></div>
      </div>
    </div>
    <main v-if="ready && activityList" :class="{ 'hasNotifyBar': $isPadDevice && notifybarShow }">
      <div v-if="!$isPadDevice" class="tabBg">
        <ul class="tab-bar" role="tablist">
          <li
            v-for="item in tabList"
            :key="item.id"
            tabindex="0"
            role="tab"
            :aria-selected="item.id === activeId ? 'true' : 'false'"
            :aria-controls="'activity-panel-' + item.id"
            @click.stop="changeActiveId(item.id)"
            @keydown.enter.prevent.stop="changeActiveId(item.id)"
            @keydown.space.prevent.stop="changeActiveId(item.id)"
            :class="{'isActive':item.id === activeId}">
            <img :src="item.id === activeId ? item.activeIcon : item.icon" alt="" aria-hidden="true">
            <p>{{ item.name }}</p>
          </li>
        </ul>
      </div>
      <div
        @scroll="scrollTopHandler"
        ref="ActivityZone"
        :class="{ 'container':true,'scroll-smooth':needSmooth}">
        <div class="scroll-container">
          <section
            v-if="activityList['1']"
            class="activity-ing activity-begin-list"
            ref="item1"
            id="activity-panel-1"
            aria-label="正在进行中">
            <h1>
              <div>
                <span class="title-bac gc-text-stroke-around" aria-hidden="true">In Progress</span>
                <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;正在进行中&nbsp;<i class="gc-title-quote-icon"></i></span>
                <span v-else class="gc-title-text">正在进行中</span>
              </div>
              <!-- 我的中奖记录入口 -->
              <div class="award-record-entry" tabindex="0" role="button" aria-label="我的奖品" @click="showMyAwardList" @keydown.enter.prevent.stop="showMyAwardList" @keydown.space.prevent.stop="showMyAwardList">
                我的奖品
              </div>
            </h1>
            <b>
              <li
                class="begin-list-item"
                v-for="(item,index) in activityList['1']"
                :key="index"
                tabindex="0"
                role="button"
                :aria-label="item.description + '，立即参加'"
                @click.stop="toJump(item)"
                @keydown.enter.prevent.stop="toJump(item)"
                @keydown.space.prevent.stop="toJump(item)"
                v-exposure="{
                  handler: ()=>onExposure(item),
                  delay: 1000,
                  options: { threshold: 1 },
                  once: true
                }">
                <div class="game-banner" :style="{ backgroundImage:`url(${item.smallImgUrl})` }"></div>
                <!-- <b :style="{ background: `linear-gradient(180deg, rgba(73, 54, 142, 0.00) 0%, ${item.maskColor} 100%)` }"></b> -->
                <section class="game-info">
                  <div :class="{'w100': !showRemindMeButton, 'title': true}">
                    <h2>{{ item.description }}</h2>
                    <p><img class="sand-icon" src="./image/calendar.svg" alt="" aria-hidden="true"><span class="begin-time-text">{{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}</span></p>
                  </div>
                  <button v-if="!$isPadDevice" class="common-rect-btn btn-ing" aria-hidden="true">立即参加</button>
                  <button v-else class="common-rect-btn btn-ing" aria-hidden="true">立即参加</button>
                </section>
              </li>
            </b>
            <!-- <b>
              <li
                v-for="(item,index) in activityList['1']"
                :key="index"
                :style="{ backgroundImage:`url(${item.smallImgUrl})` }"
                @click.stop="toJump(item)"
                v-exposure="{
                  handler: ()=>onExposure(item),
                  delay: 1000,
                  options: { threshold: 1 },
                  once: true
                }">
                <b :style="{ background: `linear-gradient(180deg, rgba(73, 54, 142, 0.00) 0%, ${item.maskColor} 100%)` }"></b>
                <p><img src="./image/data.png" alt=""><span class="time-text">{{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}</span></p>
                <section>
                  <h2>{{ item.description }}</h2>
                  <template>
                    <button v-if="!$isPadDevice" class="joinBtn">立即参加</button>
                    <button v-else class="joinBtnPad">立即参加</button>
                  </template>
                </section>
              </li>
            </b> -->
          </section>

          <section
            v-if="activityList['0']"
            class="activity-ing activity-begin-list"
            ref="item0"
            id="activity-panel-0"
            aria-label="即将开始">
            <h1>
              <span class="title-bac gc-text-stroke-around" aria-hidden="true">Upcoming</span>
              <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;即将开始&nbsp;<i class="gc-title-quote-icon"></i></span>
              <span v-else class="gc-title-text">即将开始</span>
            </h1>
            <b>
              <li
                class="begin-list-item"
                v-for="(item,index) in activityList['0']"
                :key="index"
                tabindex="0"
                role="button"
                :aria-label="'即将开始：' + item.description"
                @click.stop="toJump(item)"
                @keydown.enter.prevent.stop="toJump(item)"
                @keydown.space.prevent.stop="toJump(item)"
                v-exposure="{
                  handler: ()=>onExposure(item),
                  delay: 1000,
                  options: { threshold: 1 },
                  once: true
                }">
                <div class="game-banner" :style="{ backgroundImage:`url(${item.smallImgUrl})` }"></div>
                <!-- <b :style="{ background: `linear-gradient(180deg, rgba(73, 54, 142, 0.00) 0%, ${item.maskColor} 100%)` }"></b> -->
                <section class="game-info">
                  <div :class="{'w100': !showRemindMeButton}">
                    <h2>{{ item.description }}</h2>
                    <p><img src="./image/data.png" alt="" aria-hidden="true"><span class="begin-time-text">{{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}</span></p>
                  </div>
                  <span v-if="showRemindMeButton">
                    <button v-if="item.subscribeStatus === 1" class="read-btn is-remind" aria-label="取消提醒" @click.stop="toRemindMe(item)"></button>
                    <button v-else class="read-btn remind" aria-label="提醒我" @click.stop="toRemindMe(item)"></button>
                  </span>
                </section>
              </li>
            </b>
          </section>
          <div
            v-if="activityList.expireListTop"
            class="expire"
            ref="item2">
            <h1>
              <span class="title-bac gc-text-stroke-around" aria-hidden="true">Previous Events</span>
              <span v-if="!$isPadDevice" class="gc-title-text "><i class="gc-title-quote-icon"></i>&nbsp;往期精彩活动&nbsp;<i class="gc-title-quote-icon"></i></span>
              <span v-else class="gc-title-text ">往期精彩活动</span>
            </h1>
            <!-- 手机设备 -->
            <div class="phone_previous_title" v-if="$isPhoneDevice">
              <p class="previous"></p>
            </div>
            <section class="isExpire">
              <InfiniteScroll
                v-if="activityList.expireListTop"
                :content="activityList.expireListTop"
                :speed-rate="70">
                <template #default="{ item }">
                  <img
                    :src="item.smallImgUrl"
                    :alt="item.description"
                    class="banner-img-item"
                    @click.stop="toJump(item)" />
                </template>
              </InfiniteScroll>
              <InfiniteScroll
                v-if="activityList.expireListBottom"
                :content="activityList.expireListBottom"
                :direction="'right'"
                :speed-rate="70">
                <template #default="{ item }">
                  <img
                    :src="item.smallImgUrl"
                    :alt="item.description"
                    class="banner-img-item"
                    @click.stop="toJump(item)" />
                </template>
              </InfiniteScroll>
            </section>
          </div>
        </div>
      </div>
    </main>
    <div
      class="normal"
      v-if="ready && !activityList">
      <img src="@/images/gamecenter/nothing.png" alt="" aria-hidden="true">
      <p>暂无活动！</p>
    </div>

    <!-- 中奖记录弹窗 -->
    <AwardList
      v-if="showAwardList"
      :visible="showAwardList"
      :base-info="{}"
      @close="showAwardList=false"
    />
  </div>

</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import { getNotifyToastShow, openNotifySetting, closeNotifyToast } from '@/nativeApiPad/common.js'
import InfiniteScroll from './InfiniteScroll'
import AwardList from '../Activity/common/AwardList.vue'
import {
  getActivityZone,
  activitySub,
  cancelActivitySub
} from '@/api/activityZone'
import { compareVersions } from '@/utils'
import { createTabPageReporter } from '@/utils/dataReport'
import { activityTabLabel } from '@/utils/welfareVersionGate'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'

const TABLIST = [
  { id: 1, name: '进行中', icon: new URL('./image/tabIcon1.png', import.meta.url).href, activeIcon: new URL('./image/tabIcon1_active.png', import.meta.url).href },
  { id: 0, name: '即将开始', icon: new URL('./image/tabIcon2.png', import.meta.url).href, activeIcon: new URL('./image/tabIcon2_active.png', import.meta.url).href },
  { id: 2, name: '往期活动', icon: new URL('./image/tabIcon3.png', import.meta.url).href, activeIcon: new URL('./image/tabIcon3_active.png', import.meta.url).href }
]
export default {
  name: 'ActivityZone',
  components: {
    InfiniteScroll,
    AwardList
  },
  data() {
    return {
      needSmooth: false,
      scrollTop: 0,
      tabList: [],
      activeId: -1,
      ready: false,
      activityList: null,
      showMask: false,
      clickScroll: false,
      observers: {},
      showAwardList: false,
      notifybarShow: false
    }
  },
  watch: {
    userInfo: 'init'
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    version() {
      return this.$store.state.system.version || ''
    },
    system() {
      return this.$store.state.system
    },
    showRemindMeButton() {
      if (this.$isPhoneDevice) {
        return false
      }
      return compareVersions(this.version, '2.0.19')
    }
  },
  async created() {
    this._reporter = createTabPageReporter(
      activityTabLabel(this.$store?.state?.system?.version),
      '/gameCenter/activityZone'
    )
    this._reporter.reportStart()

    this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
    await this.init()
    this.ready = true
    this.$store.dispatch('pageLoaded', false)
    this._reporter.reportLoaded()

    if (sessionStorage.getItem('ActivityZoneData')) {
      const {
        scrollTop,
        activeId
      } = JSON.parse(sessionStorage.getItem('ActivityZoneData'))
      sessionStorage.removeItem('ActivityZoneData')

      this.activeId = activeId
      this.scrollTop = scrollTop
      this.$nextTick(() => {
        if (this.$refs.ActivityZone) {
          this.$refs.ActivityZone.scrollTop = this.scrollTop
        }
      })
    }
  },
  mounted() {
    this.$emit('headerStatus', true)
    this.$emit('scrollTop', 0)

    requestAnimationFrame(() => {
      this._reporter.reportFirstFrame()
    })
    this.$dataReport(
      'LZ_gamingCenter',
      'LZ_storeEventsZonePageShow',
      'pv',
      {
        detail: JSON.stringify({
          firstLocal: this.$isPadDevice ? 'PAD' : this.$route.query.firstLocal || 3,
          secondLocal: this.$isPadDevice ? 'PAD' : 16,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    )
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile?.removeListener(this._doubleclickTabListener)
    }
    this._doubleclickTabListener = window.LegionZoneMobile?.addListener('doubleclick_tab', this.scrollToTop)
    if (this.$isPadDevice) {
      getNotifyToastShow().then(res => {
        if (res === 'true') {
          this.notifybarShow = true
          this.$dataReport('LZ_gamingCenter', 'LZ_EventsZonenotifiRemiShow', 'pv')
        } else {
          this.notifybarShow = false
        }
      })
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    clearTimeout(this.debounceTimer)
    this.scrollSection = null
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile?.removeListener(this._doubleclickTabListener)
      this._doubleclickTabListener = null
    }
  },
  beforeRouteLeave(to, from, next) {
    if (to.path.startsWith('/gameCenter/online/index') || to.path.startsWith('/forum/micro/detail')) {
      sessionStorage.setItem('ActivityZoneData', JSON.stringify({
        activeId: this.activeId,
        scrollTop: Math.round(this.$refs.ActivityZone?.scrollTop || 0)
      }))
    }

    next()
  },
  methods: {
    formatTime(value) {
      const date = new Date(value)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}/${day}`
    },
    showMyAwardList() {
      console.log('点击了我的中奖记录')

      // 检查是否登录
      if (!this.userInfo) {
        console.log('用户未登录，跳转到登录')
        // 使用更明确的登录方式
        if (this.$login) {
          this.$login()
        }
        return
      }

      console.log('用户已登录，显示中奖记录弹窗')
      // 显示中奖记录弹窗
      this.showAwardList = true

      // 数据上报
      if (this.$dataReport) {
        this.$dataReport(
          'LZ_gamingCenter',
          'LZ_storeEventsWinRecordEnterButtonClick',
          'click',
          {
            detail: JSON.stringify({
              from: 2,
              activityName: '活动专区',
              activityid: '活动ID',
              lenovoid: this.userInfo ? this.userInfo.UserID : '',
              channel: 'LegionZone'
            })
          }
        )
      }
    },
    scrollToTop() {
      this.$refs.ActivityZone.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    filterRemainTime(value) {
      const ONE_DAY = 86400
      const TWO_DAYS = 172800
      const THREE_DAYS = 259200
      let text = ''
      const { remainTime, startTime, endTime } = value

      if (remainTime <= 0 || remainTime > 259200) {
        const formatDate = (dateStr) => {
          const [datePart] = dateStr.split(' ')
          const [, month, day] = datePart.split('-')
          return `${month}/${day}`
        }

        text = `${formatDate(startTime)} - ${formatDate(endTime)}`
      }

      if (remainTime > 0 && remainTime <= ONE_DAY) {
        value.timeTextFlag = true
        text = '距离活动结束仅剩 1 天'
      } else if (remainTime > ONE_DAY && remainTime <= TWO_DAYS) {
        value.timeTextFlag = true
        text = '距离活动结束仅剩 2 天'
      } else if (remainTime > TWO_DAYS && remainTime <= THREE_DAYS) {
        value.timeTextFlag = true
        text = '距离活动结束仅剩 3 天'
      }
      value.text = text
      return value
    },
    async init() {
      await getActivityZone({
        activeTime: this.system?.activeTime,
        legionChannel: this.system?.Channel || '', // 20
        legionModel: this.system?.MTMInfo?.ReadableMachineName || '', // TB320FC
        legionMtCode: this.system?.MTMInfo?.MTCode || '', // 83FD
        legionVersion: this.system.version || '', // 2.0.24.2283
        mac: this.system?.mac || '', // 700894aac645
        osBits: this.system?.MTMInfo?.OSBit || '', // 64
        osVersion: this.system?.MTMInfo?.OS || '',
        sn: this.system?.MTMInfo?.MachineName || '', // MP2RD3TN
        positionType: 5
      }).then(res => {
        if (!res) {
          return
        }

        if (res['1']?.length) {
          this.activeId = 1
          res['1']?.forEach(element => {
            return this.filterRemainTime(element)
          })
        } else if (res['0']?.length) {
          this.activeId = 0
        } else if (res['2']?.length) {
          this.activeId = 2
        }
        this.tabList = TABLIST.filter(item => res[item.id]?.length > 0)

        res.expireListTop = null
        res.expireListBottom = null
        if (res['2']) {
          if (res['2'].length < 10) {
            res.expireListTop = res['2']
          } else {
            res.expireListTop = res['2'].slice(0, Math.floor(res['2'].length / 2))
            res.expireListBottom = res['2'].slice(Math.floor(res['2'].length / 2))
          }
        }

        this.activityList = res
      })
    },
    changeActiveId(val) {
      this.needSmooth = true
      this.clickScroll = true
      this.$nextTick(() => {
        this.activeId = val
        this.$refs.ActivityZone.scrollTop = this.$refs['item' + (this.activeId)].offsetTop

        setTimeout(() => {
          this.needSmooth = false
          this.clickScroll = false
        }, 500)
      })
    },
    toJump(item) {
      let _subscribed = -1
      if (item.validStatus !== 0) {
        _subscribed = 3
      } else {
        _subscribed = {
          0: 2,
          1: 1
        }[item.subscribeStatus] || ''
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeEventsZoneOperatBitsClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: item.name,
            activityid: item.id,
            actstatus: {
              1: '进行中',
              0: '即将开始',
              2: '已结束'
            }[item.validStatus],
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            subscribed: _subscribed
          })
        }
      )

      const { jumpType, jumpContent } = item
      if (jumpType === 4 && jumpContent?.activityPageInfo?.id) {
        this.$router.push({
          path: `/gameCenter/online/index`,
          query: {
            id: jumpContent.activityPageInfo.id,
            source_pp: 'PAD4',
            source_p: 'PAD4',
            firstLocal: 3,
            secondLocal: 11,
            thirdLocal: ''
          }
        })
      } else if (jumpType === 10 && jumpContent?.postInfo?.id) {
        this.$router.push({
          path: `/forum/micro/detail/${jumpContent.postInfo.id}`,
          query: {
            forumSource: 4
          }
        })
      }
    },
    async toRemindMe(item) {
      if (!this.showRemindMeButton) {
        return
      }

      if (!this.userInfo) {
        this.$login()
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeEventsZoneSubscribedClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: item.name,
            activityid: item.id,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            subscribed: {
              0: 1,
              1: 2
            }[item.subscribeStatus] || ''
          })
        }
      )

      clearTimeout(this.timer)
      if (item.subscribeStatus === 0) {
        let localActivityOnlineNotify = true
        try {
          localActivityOnlineNotify = await this.$parentGetRegConfig('ActivityOnlineNotify').then(o => o.Value === 1).catch(() => true)
        } catch {
          // no thing
        }

        if (localActivityOnlineNotify) {
          this.timer = setTimeout(() => {
            this.toActivitySub(item, 1)
          }, 200)
        } else {
          this.showFrameReport(item)

          this.$lzconfirm({
            type: 'warning',
            message: '是否开启“活动提醒”通知以及时接收活动上线提醒？',
            confirmButtonText: '开启',
            cancelButtonText: '不开启'
          }).then(() => {
            this.frameClickReport(item, 1)
            this.toActivitySub(item, 2)
          }).catch((e) => {
            this.frameClickReport(item, {
              2: 2,
              1: 3
            }[e])
          })
        }
      } else {
        this.timer = setTimeout(() => {
          cancelActivitySub({
            activityId: item.id
          }).then(res => {
            if (res.code !== 10000) {
              this.$message({
                message: res.message,
                type: 'warning',
                duration: 3000,
                customClass: 'lg-message--warning'
              })
              return
            }

            item.subscribeStatus = 0
            this.$message({
              message: '已取消活动提醒',
              type: 'success',
              duration: 3000,
              customClass: 'lg-message--success'
            })
          })
        }, 200)
      }
    },
    toActivitySub(item, type) {
      activitySub({
        activityId: item.id,
        activityName: item.name
      }).then(res => {
        if (res.code !== 10000) {
          this.$message({
            message: res.message,
            type: 'warning',
            duration: 3000,
            customClass: 'lg-message--warning'
          })
          return
        }

        item.subscribeStatus = 1
        this.$message({
          message: '活动提醒订阅成功，活动上线后将会为您发送通知',
          type: 'success',
          duration: 3000,
          customClass: 'lg-message--success'
        })

        if (type === 2) {
          this.$parentSetRegConfig({
            Name: 'ActivityOnlineNotify',
            Type: 'DWORD',
            Value: 1
          })
        }
      })
    },
    scrollTopHandler(e) {
      if (!e || !e.target) return
      if (!this.$refs.ActivityZone) return
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.scrollTop = e.target.scrollTop

        // 获取滚动容器
        const scrollContainer = this.$refs.ActivityZone
        const viewportHeight = scrollContainer.clientHeight
        if (!this.scrollSection) {
          const sections = this.tabList.map(item => {
            const ref = this.$refs[`item${item.id}`]
            return {
              id: item.id,
              top: ref.offsetTop,
              height: ref.offsetHeight
            }
          })
          this.scrollSection = sections
        }

        // 计算当前视口的顶部和底部
        const viewportTop = e.target.scrollTop
        const viewportBottom = e.target.scrollTop + viewportHeight

        // 找出当前在视口中的容器
        const visibleSections = this.scrollSection.filter(section => {
          //  const sectionTop = section.top
          const sectionBottom = section.top + section.height

          // 判断是否与视口有交集：
          // 1. 容器底部在视口顶部之下（sectionBottom > viewportTop）
          // 2. 容器顶部在视口底部之上（sectionTop < viewportBottom）
          return sectionBottom > viewportTop && section.top < viewportBottom
        })

        if (visibleSections.length > 0) {
        // 找出可见比例最大的 section
          const mostVisibleSection = visibleSections.reduce((prev, current) => {
          // 计算 prev 和 current 的可见高度
            const prevVisibleHeight = Math.min(prev.top + prev.height, viewportBottom) - Math.max(prev.top, viewportTop)
            const currentVisibleHeight = Math.min(current.top + current.height, viewportBottom) - Math.max(current.top, viewportTop)

            // 计算可见比例（可见高度 / 自身高度）
            const prevRatio = prevVisibleHeight / prev.height
            const currentRatio = currentVisibleHeight / current.height

            // 返回可见比例更大的 section
            return currentRatio > prevRatio ? current : prev
          })

          this.activeId = mostVisibleSection.id // 设置为可见比例最大的 section
        }

        if (e.target.scrollTop + e.target.offsetHeight + 100 >= e.target.scrollHeight) {
          this.showMask = true
        } else {
          this.showMask = false
        }
      }, 200)
    },
    onExposure(item) {
      let _subscribed = -1
      if (item.validStatus !== 0) {
        _subscribed = 3
      } else {
        _subscribed = {
          0: 1,
          1: 2
        }[item.subscribeStatus] || ''
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeEventsZoneOperatBitsShow',
        'pv',
        {
          detail: JSON.stringify({
            activityName: item.name,
            activityid: item.id,
            actstatus: {
              1: '进行中',
              0: '即将开始',
              2: '已结束'
            }[item.validStatus],
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            subscribed: _subscribed
          })
        }
      )
    },
    showFrameReport(item) {
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeEventsZoneSubscribedPopupShow',
        'pv',
        {
          detail: JSON.stringify({
            activityName: item.name,
            activityid: item.id,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        }
      )
    },
    frameClickReport(item, clickType) {
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeEventsZoneSubscribedPopupClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: item.name,
            activityid: item.id,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            clickType: clickType
          })
        }
      )
    },
    openNotifySetting() {
      openNotifySetting()
      this.$dataReport('LZ_gamingCenter', 'LZ_EventsZonenotifiRemiClick', 'click', {
        detail: JSON.stringify({ buttonType: 'start', lid: getLegacyLenovoId() })
      })
    },
    closeNotifyBar() {
      closeNotifyToast()
      this.notifybarShow = false
      this.$dataReport('LZ_gamingCenter', 'LZ_EventsZonenotifiRemiClick', 'click', {
        detail: JSON.stringify({ buttonType: 'close', lid: getLegacyLenovoId() })
      })
    }
  }
}

</script>

<style lang="scss" src="./index.scss" scoped>

</style>

<template>
  <!-- 无生效活动时不展示整块模块（含标题 / 空态） -->
  <section
    v-if="showModule"
    :key="exposeEpoch"
    v-exposure="{ handler: () => reportOverall(), once: false }"
    class="hot-activity">
    <WelfareSectionTitle class="hot-activity__section-title" title="热门活动" />
    <ul
      class="hot-activity__list"
      :class="$isPhoneDevice ? 'is-phone' : 'is-wide'">
      <li
        v-for="item in activityList"
        :key="item.id"
        v-exposure="{ handler: () => reportSingleShow(item), once: true }"
        class="hot-activity__item"
        @click="toJump(item)">
        <div
          class="hot-activity__banner"
          :style="{ backgroundImage: `url(${item.smallImgUrl || item.bigImgUrl})` }" />
        <div class="hot-activity__info">
          <div class="hot-activity__text">
            <h3>{{ item.description || item.name }}</h3>
            <p>
              <img class="hot-activity__cal" :src="calendarIcon" alt="" />
              <span>{{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}</span>
            </p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
import { getActivityZone } from '@/api/activityZone'
import WelfareSectionTitle from './WelfareSectionTitle.vue'
import calendarIcon from '../image/icon-calendar.svg'
import { SELF_TEST_HOT_ACTIVITY } from '../welfareSelfTest'
import {
  reportWelfarePv,
  reportWelfareClick,
  getLid
} from '@/utils/welfareTrack'

export default {
  name: 'HotActivity',
  components: { WelfareSectionTitle },
  data() {
    return {
      ready: false,
      activityList: [],
      calendarIcon,
      reportedIds: {},
      exposeEpoch: 0
    }
  },
  computed: {
    system() {
      return this.$store.state.system
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    /** 无生效活动：标题、空态、整块都不出 */
    showModule() {
      return this.ready && this.activityList.length > 0
    }
  },
  watch: {
    userInfo: 'fetchActivities',
    system: {
      deep: true,
      handler: 'fetchActivities'
    },
  },
  async mounted() {
    await this.fetchActivities()
  },
  methods: {
    reload() {
      this.reportedIds = {}
      this.exposeEpoch += 1
      return this.fetchActivities()
    },
    reportOverall() {
      if (!this.activityList.length) return
      reportWelfarePv(this, 'LZ_welfareHotActivityOverallShow')
    },
    reportSingleShow(item) {
      const id = String(item?.id || '')
      if (!id || this.reportedIds[id]) return
      this.reportedIds[id] = true
      reportWelfarePv(this, 'LZ_welfareHotActivitySingleShow', {
        detail: JSON.stringify({
          activityName: item.description || item.name || '',
          activityid: id,
          lid: getLid(this)
        })
      })
    },
    async fetchActivities() {
      try {
        const res = await getActivityZone({
          activeTime: this.system?.activeTime,
          legionChannel: this.system?.Channel || '',
          legionModel: this.system?.MTMInfo?.ReadableMachineName || '',
          legionMtCode: this.system?.MTMInfo?.MTCode || '',
          legionVersion: this.system?.version || '',
          mac: this.system?.mac || '',
          osBits: this.system?.MTMInfo?.OSBit || '',
          osVersion: this.system?.MTMInfo?.OS || '',
          sn: this.system?.MTMInfo?.MachineName || '',
          positionType: 5
        })
        this.activityList = this.pickEffectiveList(res)
        if (SELF_TEST_HOT_ACTIVITY && !this.activityList.length) {
          this.activityList = this.mockHotList()
        }
      } catch (e) {
        this.activityList = SELF_TEST_HOT_ACTIVITY ? this.mockHotList() : []
      }
      this.ready = true
    },
    /** 只取「进行中」且当前仍生效的活动；即将开始 / 往期 / 过期都不进热门 */
    pickEffectiveList(res) {
      if (SELF_TEST_HOT_ACTIVITY) {
        const buckets = [res?.['1'], res?.['0'], res?.['2']]
        return buckets.flatMap((arr) => (Array.isArray(arr) ? arr : []))
      }
      const ongoing = Array.isArray(res?.['1']) ? res['1'] : []
      const now = Date.now()
      return ongoing.filter((item) => this.isEffectiveHotItem(item, now))
    },
    mockHotList() {
      const now = Date.now()
      return [
        {
          id: 'self-test-hot-1',
          description: '热门活动自测',
          smallImgUrl: '',
          startTime: now - 86400000,
          endTime: now + 86400000 * 7,
          validStatus: 1
        }
      ]
    },
    isEffectiveHotItem(item, now = Date.now()) {
      if (!item || typeof item !== 'object') return false
      const status = Number(item.validStatus)
      // 活动专区：1 进行中，0 即将开始，2 已结束
      if (!Number.isNaN(status) && status !== 1) return false
      const start = Number(item.startTime)
      const end = Number(item.endTime)
      if (start && !Number.isNaN(start) && start > now) return false
      if (end && !Number.isNaN(end) && end < now) return false
      return true
    },
    formatTime(ts) {
      if (!ts) return ''
      const date = new Date(ts)
      if (Number.isNaN(date.getTime())) return ''
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}/${day}`
    },
    toJump(item) {
      reportWelfareClick(this, 'LZ_welfareHotActivityEnterClick', {
        detail: JSON.stringify({
          activityName: item?.description || item?.name || '',
          activityid: String(item?.id || ''),
          lid: getLid(this)
        })
      })
      const { jumpType, jumpContent } = item || {}
      if (jumpType === 4 && jumpContent?.activityPageInfo?.id) {
        this.$router.push({
          path: '/gameCenter/online/index',
          query: {
            id: jumpContent.activityPageInfo.id,
            source_pp: 'PAD15',
            source_p: 'PAD15',
            firstLocal: 3,
            secondLocal: 11,
            thirdLocal: ''
          }
        })
        return
      }
      if (jumpType === 10 && jumpContent?.postInfo?.id) {
        this.$router.push({
          path: `/forum/micro/detail/${jumpContent.postInfo.id}`,
          query: { forumSource: 4 }
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.hot-activity {
  padding: 0;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
}
.hot-activity__empty {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  text-align: center;
}
.hot-activity__section-title {
  margin-top: 16px;
}
.hot-activity__list {
  margin: 0;
  padding: 16px;
  list-style: none;
  display: grid;
  gap: 16px;
  /* Pad / PC：一行两个 */
  &.is-wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  /* 手机：一行一个 */
  &.is-phone {
    grid-template-columns: 1fr;
    margin-top: 0;
  }
}
.hot-activity__item {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  min-width: 0;
}
.hot-activity__banner {
  width: 100%;
  height: auto;
  aspect-ratio: 358 / 201;
  border-radius: 6px;
  background-color: #123;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.hot-activity__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}
.hot-activity__text {
  min-width: 0;
  h3 {
    margin: 0;
    color: #eaf7ff;
    font-size: 15px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  p {
    margin: 6px 0 0;
    display: flex;
    align-items: center;
    color: rgba(234, 247, 255, 0.6);
    font-size: 12px;
  }
}
.hot-activity__cal {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

</style>

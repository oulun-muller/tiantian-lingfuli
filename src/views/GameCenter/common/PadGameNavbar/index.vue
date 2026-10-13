<template>
  <div class="ganme-center-router">
    <div class="router-title">
      <div
        v-for="(item, index) in routerList"
        :key="index"
        :class="[currentIndex === index ? 'tab-active' : '']"
        @click="tabclick(index, item)">
        <span class="tab">{{ item.name }}</span>
      </div>
      <!-- <router-link to="/gameCenter/index">
        <span class="tab" >精选</span>
      </router-link>
      <router-link to="/gameCenter/activityZone">
        <span class="tab">福利&活动</span>
      </router-link> -->
    </div>
    <div class="router-operation">
      <PadGameSearch class="search-class" />
      <div class="icon-item-class">
        <img v-if="isShowMyDevice" src="@/images/padimg/equitment.svg" class="icon-class" @click="toMyDevice" />
        <img v-if="$isAIPartnerEnabled" src="@/images/padimg/game_partner_entry_logo.svg" class="icon-class ai-partner-icon" @click.stop="toAIDialogue" />
      </div>
    </div>
  </div>
</template>

<script>
import PadGameSearch from '@/components/PadGameSearch'
import { openNativePage } from '@/nativeApiPad/common.js'
import { DEVICE_TYPE } from '@/store/enum/buryingPoint.js'
import { activityTabLabel } from '@/utils/welfareVersionGate'
export default {
  name: '',
  components: {
    PadGameSearch
  },
  props: {},
  data() {
    return {
      currentIndex: 0
    }
  },
  computed: {
    clientVersion() {
      return this.$store.state.system.version
    },
    routerList() {
      return [
        { path: '/gameCenter/index', name: '精选' },
        { path: '/gameCenter/activityZone', name: activityTabLabel(this.clientVersion) }
      ]
    },
    isShowMyDevice() {
      const name = this.$store.state.system.MTMInfo?.ReadableMachineName || ''
      for (const item of DEVICE_TYPE) {
        if (name.includes(item)) {
          return true
        }
      }
      return false
    }
  },
  watch: {
    $route(to) {
      if (to.path === '/gameCenter/activityZone') {
        this.currentIndex = 1
      } else {
        this.currentIndex = 0
      }
    }

  },
  created() { },
  mounted() {
    // const index = sessionStorage.getItem('ROUTE_ACTIVE_INDEX')
    // this.currentIndex = Number(index) || 0
    if (this.$route.path === '/gameCenter/activityZone') {
      this.currentIndex = 1
    } else {
      this.currentIndex = 0
    }
  },
  methods: {
    tabclick(index, item) {
      this.currentIndex = index
      // sessionStorage.setItem('ROUTE_ACTIVE_INDEX', index)
      this.$router.push({
        path: item.path
      })
    },

    toAIDialogue() {
      this.$dataReport('aIassistant', 'aIassistantEnterClick', 'click')
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorAIAgentFromRecommend')
      }
    },
    toMyDevice() {
      openNativePage('DevicePage')
    }

  }
}
</script>

<style scoped lang="scss">
.ganme-center-router {
  width: 100%;
  height: 74px;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 10;
  background-color: #000;

  .router-title {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: 20px;

    .tab {
      color: #EAF7FF;
      opacity: 0.5;
      font-weight: 700;
      font-family: "Microsoft YaHei";
      margin-right: 20px;
    }
  }

  .router-operation {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .icon-item-class {
      display: flex;
      align-items: center;
    }

    .icon-class {
      width: 32px;
      height: 32px;
      margin-left: 16px;
    }

    .search-class {
      width: 240px;
      // height: 48px;
    }
  }

  .tab-active .tab {
    opacity: 1;
  }

  .router-link-active .tab {
    opacity: 1;
  }

}

.PhoneDevice {

  // .ganme-center-router .router-title .tab {
  //   font-size: 16px;
  //   font-weight: 400;
  // }

  .ganme-center-router {
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 0 20px 0px;
    height: auto;

    .router-title {
      order: 2;
      padding: 15px 0 20px;

      .tab {
        font-size: 20px;
        font-weight: 700;
      }

      .tab-active .tab {
        font-weight: 700;
        font-size: 20px;
      }
    }

    .router-operation {
      order: 1;
      width: 100%;
      padding: 12px 0;

      .search-class {
        flex: 1;
      }

      .icon-class {
        height: 28px;
        width: 28px;
        margin-left: 16px;
      }

      .ai-partner-icon {
        width: 28px;
        height: 28px;
      }
    }
  }
}
</style>

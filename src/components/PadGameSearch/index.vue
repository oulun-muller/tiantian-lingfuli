<template>
  <div class="search-wrap" draggable @dragstart.prevent="$startDrag" @dblclick.self="$toggleMaximize">
    <div class="search" draggable @dragstart.prevent.stop>
      <input
        type="text"
        v-model.trim="keyword"
        @input="searchGameListByKeyword"
        @keydown.enter="toSearch"
        @mouseenter="handleIsEntered">
      <i class="search-icon" @click.stop="toSearch"></i>
      <span class="placeholder" v-if="!isEntered"><i class="title">{{ defaultKeyword }}</i><i v-if="!$isPadDevice" class="sub-title">{{
        description }}</i></span>
    </div>
  </div>
</template>
<script>
import {
  searchDefaultWords
} from '@/api/cdkMall'
export default {
  data() {
    return {
      keyword: '',
      defaultKeyword: '搜索游戏', // 默认搜索词
      description: '搜索游戏', // 默认搜索词描述
      isEntered: false
    }
  },
  mounted() {
    this.getDefaultKeyword()
  },
  computed: {
    system() {
      return this.$store.state.system
    }
  },
  methods: {
    getDefaultKeyword() {
      const params = {
        locationId: 1,
        activeTime: this.system.activeTime,
        legionChannel: this.system.Channel,
        legionModel: this.system.MTMInfo.ReadableMachineName,
        legionMtCode: this.system.MTMInfo.MTCode,
        legionVersion: this.system.version,
        mac: this.system.mac,
        osBits: this.system.MTMInfo.OSBit,
        osVersion: this.system.MTMInfo.OS,
        sn: this.system.MTMInfo.MachineName
      }

      searchDefaultWords(params, '搜你想玩的游戏，最低一折起').then(res => {
        this.defaultKeyword = res.keyword
        this.description = res.description
      })
    },
    handleIsEntered() {
      if (this.keyword) {
        this.isEntered = true
      } else {
        this.isEntered = false
      }
    },
    searchGameListByKeyword() {
      this.isEntered = true
    },
    toSearch() {
      this.$router.push({
        name: 'GameCenterSearch',
        query: { keyword: this.keyword || this.defaultKeyword }
      })
    }
  }
}

</script>
<style lang="scss" scoped>
.search {
  position: relative;
  width: 100%;
  height: 48px;
  padding: 10px 20px;
  border-radius: 8px;
  border: 0.5px solid rgba(234, 247, 255, 0.10);
  background: radial-gradient(69.42% 103.75% at 48.18% 103.75%, rgba(234, 247, 255, 0.00) 0%, rgba(234, 247, 255, 0.00) 100%), linear-gradient(0deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.06) 100%), rgba(21, 25, 32, 0.70);

  input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background-color: transparent;
    border: none;
    outline: none;
    color: #EAF7FF;
    padding-right: 36px;
  }

  .search-icon {
    display: inline-block;
    width: 24px;
    height: 24px;
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%) !important;
    cursor: pointer;
    background: url('@/images/gamecenter/game-search.svg') no-repeat;
    background-size: cover;
  }

  .placeholder {
    width: 100%;
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    max-width: 263px;
    overflow: hidden;
    white-space: nowrap;
    padding-left: 20px;
    box-sizing: border-box;

    .title {
            font-weight: 400;
      color: rgba(234, 247, 255, .6);
    }

    .sub-title {
      font-weight: 400;
      font-size: 14px;
      color: rgba(234, 247, 255, .6);
      margin-left: 20px;
      white-space: nowrap;
    }
  }
}
@media screen and (max-width: 800px) {
  .search {
      height: 6vw;
      .search-icon {
        width: 3vw;
        height: 3vw;
    }
  }
}
.PhoneDevice {
  .search {
    height: 36px;
    border-radius: 4px;
    padding: 8px 16px;
  }
  .placeholder {
    font-size: 12px;
    padding-left: 16px;
  }
}
</style>

<template>
  <MediaStagePad
    v-if="$isPadDevice"
    :detail="detail"
    :drinfo="drinfo"
    :show-pay="showPay"
    :ranking-item="rankingItem"
    :is-follower="isFollower"
    :click-game-library="clickGameLibrary"
    :scroll-to-comment="scrollToComment"
    :to-followers="toFollowers"/>
  <MediaStagePc
    v-else
    :detail="detail"
    :drinfo="drinfo"
    :show-pay="showPay"
    :ranking-item="rankingItem"
    :is-follower="isFollower"
    :click-game-library="clickGameLibrary"
    :scroll-to-comment="scrollToComment"
    :to-followers="toFollowers" />
</template>

<script>
import MediaStagePad from './MediaStagePad'

import MediaStagePc from './MediaStagePc'
export default {
  name: 'GameLibrary',
  components: {
    MediaStagePad,
    MediaStagePc
  },
  props: {
    detail: {
      type: Object,
      default() {
        return {}
      }
    },
    rankingItem: {
      type: Object,
      default() {
        return {}
      }
    },
    isFollower: {
      type: Boolean,
      default: false
    },
    imgVideoList: {
      type: Array,
      default() {
        return []
      }
    },
    drinfo: { // 数据上报附加信息
      type: String,
      default: ''
    },
    clickGameLibrary: {
      type: Function,
      default() {
        return () => { }
      }

    },
    scrollToComment: {
      type: Function,
      default() {
        return () => { }
      }

    },
    showPay: {
      type: Function,
      default() {
        return () => { }
      }

    },
    toFollowers: {
      type: Function,
      default() {
        return () => { }
      }

    }
  },
  mounted() {
  },
  data() {
    return {
    }
  }
}
</script>

<style scoped lang="scss">
</style>

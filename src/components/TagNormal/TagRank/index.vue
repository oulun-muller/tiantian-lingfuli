<template>
  <div>
    <div class="tag-rank">
      <div
        class="tag-item"
        tabindex="0"
        role="button"
        :aria-label="rankObj.labelName + ' 第' + rankObj.num + '名，点击查看排行榜'"
        @click.stop="clickRank"
        @keydown.enter.prevent.stop="clickRank"
        @keydown.space.prevent.stop="clickRank"
      >
        <img class="tag-icon" :src="rankTypeImgEnum[5]" aria-hidden="true" />
        <div class="tag-title" aria-hidden="true">{{ rankObj.labelName }}</div>
        <div class="tag-title" style="margin-left: 4px;" aria-hidden="true">#{{ rankObj.num }}</div>
      </div>
      <div v-if="showShadow" class="tag-shadow" aria-hidden="true"></div>
    </div>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

export default {
  name: '',
  components: {},
  props: {
    rankList: {
      type: Array,
      default: () => ([])
    },
    showShadow: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      rankTypeTitleEnum: {
        5: '火爆榜',
        6: '时长榜',
        7: '飙升榜',
        8: '小时榜',
        19: '预约榜'
      },
      rankTypeImgEnum: {
        5: new URL('../img/rank5.svg', import.meta.url).href
      }
    }
  },
  computed: {
    rankObj() {
      const list = this.rankList
      list.sort((a, b) => a.num - b.num)
      if (!list.length) return {}

      return list[0]
    }
  },
  watch: {},
  created() {},
  mounted() {
    // if (this.rankList.length) {
    //   const list = this.rankList.sort((a, b) => a.num - b.num)
    //   this.rankObj = list[0]
    //   this.num = list[0].num
    //   console.log('-----------------this.num ', this.num, this.rankObj)
    // }
  },
  methods: {
    clickRank() {
      this.$router.push({
        name: 'RankList',
        query: {
          tab: this.rankObj.labelCode
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">

.tag-rank {
  position: relative;
   display: inline-block;
  // width: auto;
}
.tag-item {
  height: 20px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
  cursor: pointer;
  .tag-icon {
    width: 16px;
    height: 16px;
    margin-right: 2px;
  }
  .tag-title {
    height: 20px;
    line-height: 20px;
    color: #FE6F38;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  &:focus-visible {
    outline: 2px solid #4fc3f7;
    outline-offset: 2px;
    border-radius: 4px;
  }
}

@media (forced-colors: active) {
  .tag-item:focus-visible {
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
// background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(255, 255, 255, 0.25) 100%
background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.25) 100%);
background-blend-mode: soft-light, normal;

  }
</style>

<template>
  <div class="tag-rank">
    <div class="tag-item" @click.stop="clickRank">
      <div class="tag-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4H13.5V5.5C13.5 6.32843 12.8284 7 12 7C11.9579 7 11.9163 6.99657 11.875 6.99316C11.515 8.40194 10.4078 9.51168 9 9.87402V11.5L9.5 12H11V13.5H5V12H6.5L7 11.5V9.87402C5.59209 9.51166 4.48395 8.40205 4.12402 6.99316C4.08308 6.99652 4.04181 7 4 7C3.17157 7 2.5 6.32843 2.5 5.5V4H4V3H12V4ZM8.16602 5.24902C8.08682 5.13054 7.91217 5.13049 7.83301 5.24902L7.07324 6.38867C7.02858 6.45572 7.02871 6.54324 7.07324 6.61035L7.83301 7.75C7.91217 7.86875 8.08685 7.86875 8.16602 7.75L8.92578 6.61035C8.97038 6.54321 8.9705 6.45576 8.92578 6.38867L8.16602 5.24902Z" fill="url(#paint0_linear_158_4189)"/>
          <defs>
            <linearGradient id="paint0_linear_158_4189" x1="8" y1="3" x2="8" y2="13.25" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FE9903"/>
              <stop offset="1" stop-color="#FFB548"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="tag-title">{{ rankObj.labelName }}</div>
      <div class="tag-title">TOP{{ rankObj.num }}</div>
    </div>
  </div>
</template>

<script>
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
    // clickRank() {
    //   this.$router.push({
    //     name: 'RankList',
    //     query: {
    //       tab: this.rankObj.labelCode
    //     }
    //   })
    // }
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
  height: 22px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
    border: 0.5px solid rgba(255, 255, 255, 0.2);
    padding: 0 4px;
  .tag-icon {
    width: 16px;
    height: 16px;
    margin-right: 2px;
  }
  .tag-title {
    height: 20px;
    line-height: 20px;
    color: #FE9903;
    font-size: 12px;
    white-space: nowrap;
  }
}

</style>

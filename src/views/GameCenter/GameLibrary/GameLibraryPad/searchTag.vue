<template>
  <div class="search-tag-wrap" @touchend="scrollHandle">
    <div class="scroll-container">
      <div>
        <div class="pad-tag-title">玩法</div>
        <div class="tag-list">
          <div
            v-for="(item, index) in tagList"
            :key="index"
            class="tag-item"
            :class="{ 'tag-item-active': selectList.includes(item) }"
            @click="selectTags(item)">{{ item }}</div>
        </div>
      </div>
      <div>
        <div class="pad-tag-title">风格</div>
        <div class="tag-list">
          <div
            v-for="(item, index) in secondTagList"
            :key="index"
            class="tag-item"
            :class="{ 'tag-item-active': selectList.includes(item) }"
            @click="selectTags(item)">{{ item }}</div>
        </div>
      </div>
      <!-- <div>
        <div class="pad-tag-title">题材</div>
        <div class="tag-list">
          <div
            v-for="(item, index) in thirdList"
            :key="index"
            class="tag-item"
            :class="{ 'tag-item-active': selectList.includes(item) }"
            @click="selectTags(item)">{{ item }}</div>
        </div>
      </div> -->
    </div>
    <div class="button-area">
      <div class="button-clear" @click="deleteCurrentTags">清除</div>
      <div class="button-confirm" @click="filterChange">找游戏</div>
    </div>
  </div>
</template>

<script>
export default {
  name: '',
  components: {},
  props: {
    selectTagList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      tagList: ['FPS', 'MOBA竞技', '棋牌桌游', '卡牌', 'ARPG', '吃鸡', 'MMO', '冒险', '经营', '塔防', '格斗', '回合制'], // 模拟经营 -- 赛车
      secondTagList: ['二次元', '纸牌', '赛车', '球类', '战争策略', '休闲竞技', '飞机坦克', '捕鱼'],
      // thirdList: ['生存', '末日', '体育', '侦探', '战争', '历史', '科幻', '篮球'],

      selectList: []
    }
  },
  computed: {},
  watch: {},
  created() { },
  mounted() {
    this.selectList = [...this.selectTagList]
  },
  methods: {
    selectTags(item) {
      if (this.selectList.includes(item)) {
        this.selectList = []
      } else {
        this.selectList = [item]
      }
      //  console.log(this.selectList, this.selectList.includes(item))
    },
    deleteCurrentTags() {
      this.$emit('deleteCurrentTags')
      this.selectList = []
    },
    filterChange() {
      this.$emit('filterChange', [...this.selectList])
    },
    scrollHandle(e) {
      e.stopPropagation()
    }
  }
}
</script>

<style scoped lang="scss">
.search-tag-wrap {
  width: calc(100% - 60px);
  //   height: auto;
  padding: 20px;
  margin: 0 auto;
  border-radius: 8px;
  border: 0.5px solid rgba(234, 247, 255, 0.15);
  background: linear-gradient(0deg, rgba(80, 91, 111, 0.20) 0%, rgba(80, 91, 111, 0.20) 100%), radial-gradient(82.6% 50% at 50% 100%, rgba(80, 91, 111, 0.20) 0%, rgba(80, 91, 111, 0.00) 100%), rgba(17, 21, 27, 0.90);
  box-shadow: 0 0 20px 0 #000, 0 0 20px 0 #000;
  backdrop-filter: blur(20px);

  .scroll-container {
    overflow-y: scroll;
    height: 100%;
    max-height: 318px;
  &::-webkit-scrollbar {
    display: none;
  }

  }

  .pad-tag-title {
    margin-bottom: 16px;
    color: rgba(234, 247, 255, 0.60) !important;
    font-family: "Microsoft YaHei";
  }

  .tag-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;

    .tag-item {
      height: 40px;
      padding: 10px;
      background: rgba(234, 247, 255, 0.05);
      color: rgba(234, 247, 255, 0.60);
      font-family: "Microsoft YaHei";
      font-size: 14px;
      text-align: center;
      border: 1px solid transparent;
    }

    .tag-item-active {
      border: 1px solid #FFF;
      font-weight: 700;
    }
  }

  .button-area {
    display: flex;
    gap: 20px;
    margin-top: 22px;
    justify-content: space-between;
//    margin-top: 39px;
     box-sizing: border-box;

    .button-clear {
      flex: 1;
      height: 40px;
      padding: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      background: transparent;
      font-weight: 700;
      text-align: center;
    }

    .button-confirm {
        flex: 1;
      height: 40px;
      padding: 10px;
      border: 1px solid #FFF;
      background: linear-gradient(174deg, #929292 -121.2%, #EAF7FF 97.92%);
      color: #000;
      font-weight: 700;
      text-align: center;
    }
  }
}

@media screen and (max-width: 800px) {
  .search-tag-wrap {
     margin: 0 3.75vw;
       width: calc(100% - 7.5vw);
  }
}
@media screen and (min-width: 900px) {
  .search-tag-wrap .scroll-container  {
    max-height: 200px;
  }
}
</style>

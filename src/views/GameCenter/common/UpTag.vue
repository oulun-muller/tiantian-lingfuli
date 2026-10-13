<template>
  <div class="rest">
    <div class="level-box">
      <div v-for="(item, index) in levelLabel" :key="index" class="level-item">
        <div style="width: 100%;">
          <div class="level-title" :class="{ 'active': curParentIndex === index }">{{ item }}</div>
          <ol v-if="index < levelLabel.length - 1">
            <div
              v-for="(childItem, childIndex) in labelList[index][item]"
              :key="childIndex"
              class="level-list-item level-activity"
              tabindex="0"
              role="button"
              :aria-label="childItem"
              @click.stop="selectTags(childItem, index, childItem)"
              @keydown.enter.prevent.stop="selectTags(childItem, index, childItem)"
              @keydown.space.prevent.stop="selectTags(childItem, index, childItem)"
              @pointerenter="slideIn(index)"
              @pointerleave="slideOut()">{{ childItem }}</div>
          </ol>
          <ol v-else class="level-list-item-grid">
            <div
              v-for="(childItem, childIndex) in labelList[index][item]"
              :key="childIndex"
              class="level-activity"
              tabindex="0"
              role="button"
              :aria-label="childItem"
              @click.stop="selectTags(childItem, index, childItem)"
              @keydown.enter.prevent.stop="selectTags(childItem, index, childItem)"
              @keydown.space.prevent.stop="selectTags(childItem, index, childItem)"
              @pointerenter="slideIn(index)"
              @pointerleave="slideOut()">{{ childItem }}</div>
          </ol>
        </div>
        <div v-if="index < levelLabel.length -1" class="divider"></div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      curParentIndex: -1,
      routerLinkEnum: {
        '拯救者排行榜': '/gameCenter/rankList',
        '游戏工具': '/gameCenter/gameTools',
        'Legion Play': '/gameCenter/magazine',
        'CD Key': '/gameCenter/cdkMall'
      }
    }
  },
  computed: {
    labelList() {
      return this.$store.state.gameCenter.labelList
    },
    levelLabel() {
      return this.$store.getters['gameCenter/levelLabel']
    },
    selectTagList() {
      return this.$store.state.gameCenter.selectTagList
    }
  },
  mounted() {
  },
  methods: {
    selectTags(value, parentIndex, key) {
      this.$emit('changeActivite')
      if (!parentIndex) {
        const url = this.routerLinkEnum[key] || '/gameCenter/gameLibrary'

        url && this.$router.push({
          path: url
        })
        return
      }

      if (this.selectTagList.some(o => o === value)) {
        this.$store.dispatch('gameCenter/upDataCurTags', value)
      } else {
        this.$store.dispatch('gameCenter/setSelectTagList', value)
      }
      this.$router.push({
        path: `/gameCenter/gameLibrary`
      })
    },
    slideIn(parentIndex) {
      console.log('slideIn', parentIndex)
      this.curParentIndex = parentIndex
    },
    slideOut() {
      this.curParentIndex = -1
    }
  }
}
</script>
<style lang="scss" scoped>
.rest {
  position: absolute;
  box-sizing: border-box;
  left: -336px;
  top: 18px;

  .active {
    font-weight: 700;
    color: rgba(234, 247, 255, 1);
    background: linear-gradient(178deg, #FFF 1.88%, #D1D1D1 98.12%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .level-activity {
    height: 12px;
    line-height: 12px;

    &:hover {
      font-weight: 700;
      color: #EAF7FF;
      // background-clip: text;
      // -webkit-background-clip: text;
      // -webkit-text-fill-color: transparent;
    }
  }

  .level-box {
    box-sizing: border-box;
    width: 659px;
    height: 210px;
    padding: 24px 0px 24px 24PX;
    margin-top: 18px;
    display: flex;
    gap: 20px;
    background: rgba(14, 18, 23, 0.90);
    border: 1px solid rgba(88, 94, 102, 0.50);
    backdrop-filter: blur(7.5px);
    color: rgba(234, 247, 255, 0.6);
    font-weight: normal;

    .level-item {
      display: flex;
      flex: 0 0 80px;

      &:last-child {
        flex: 1 1 auto;
        /* 最后一个item伸缩填充剩余空间 */
      }

    }

    .level-title {
      line-height: 14px;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .level-list-item {
      height: 12px;
      line-height: 12px;
      margin-top: 16px;
      font-size: 12px;
    }

    .level-list-item-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 16px 20px;
      font-size: 12px;
    }
  }

  ol {
    font-size: 14px;

    li {
      // &.active {
      //   font-weight: 700;
      //   color: rgba(234, 247, 255,1);
      //   background: linear-gradient(178deg, #FFF 1.88%, #D1D1D1 98.12%);
      //   background-clip: text;
      //   -webkit-background-clip: text;
      //   -webkit-text-fill-color: transparent;
      // }
    }
  }

  .divider {
    width: 1px;
    height: 100%;
    opacity: 0.1;
    background: #FFF;
    margin-left: 20px;
  }
}

.rest .level-activity:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .rest .level-activity:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

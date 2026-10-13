<template>
  <section class="MiniGameList" v-if="moduleData.rankingLists && moduleData.rankingLists.length">
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleEname }}</span>
      <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ moduleData.moduleName }}&nbsp;<i class="gc-title-quote-icon"></i></span>
      <span v-else class="gc-title-text">{{ moduleData.moduleName }}</span>
    </h3>
    <ul class="list-wrap" role="listbox" :aria-label="moduleData.moduleName" @keydown="onGridKeydown" ref="stage">
      <li
        v-for="(item, index) in moduleData.rankingLists[0].miniGames"
        :key="index"
        class="minigame-item"
        :tabindex="index === focusedIndex ? 0 : -1"
        role="option"
        :aria-selected="index === focusedIndex"
        :aria-label="item.softName + '，点击打开小游戏'"
        @focus="focusedIndex = index"
        v-exposure:multiple="{
          events: [
            {
              handler: () => onExposure(item, 1,moduleData.moduleName,index),
              options: { threshold: 0.5 },
              delay: 1000
            },
            {
              handler: () => onExposure(item,0,moduleData.moduleName,index)
            }
          ]
        }"
        @mouseenter="mouseEnterItem(index)"
        @mouseleave="mouseLeaveItem(index)"
        @click="clickMiniGame(item, index,moduleData.moduleName )"
        @keydown.enter.prevent.stop="clickMiniGame(item, index, moduleData.moduleName)"
        @keydown.space.prevent.stop="clickMiniGame(item, index, moduleData.moduleName)"
      >
        <video
          v-if="curIndex===index && item.softDesc && item.softDesc.videoUrl"
          ref="videoDom"
          class="video-item"
          :src="item.softDesc.videoUrl"
          autoplay
          muted
          aria-hidden="true">
        </video>
        <img v-else class="img-item" :src="item.showInfo.vimg || item.softDesc.videoCoverImg" :alt="item.softName" />
        <div class="text-content" aria-hidden="true">
          <span class="name">
            <i class="icon" :style="{backgroundImage:`url(${item.showInfo.logoFile})`}" ></i>
            {{ item.softName }}
          </span>
          <span class="common-round-btn">打开</span>
        </div>
      </li>
    </ul>
  </section>
</template>
<script>
import { reportMinigameOpen, reportMinigameExpose } from '@/utils/dataReport'
import { getRegConfig } from '@/nativeApi/Pbase'
import { openMiniGameAndPin, parentExposeMiniGame } from '@/utils/miniGame'
export default {
  data() {
    return {
      curIndex: null,
      isCreatePin: true,
      focusedIndex: 0
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  computed: {
    moduleEname() {
      return this.moduleData.moduleEname
    }
  },
  methods: {
    // 网格键盘事件
    onGridKeydown(e) {
      const total = this.moduleData.rankingLists[0].miniGames.length
      if (total === 0) return
      let next = this.focusedIndex
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (this.focusedIndex + 1) % total
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (this.focusedIndex - 1 + total) % total
      } else {
        return
      }
      this.focusedIndex = next
      this.$nextTick(() => {
        const items = Array.from(this.$refs.stage.children)
        if (items[next]) items[next].focus()
      })
    },
    onExposure(item, exposureType, moduleName, childIndex) {
      parentExposeMiniGame(item, childIndex, exposureType, this.moduleData?.rankingLists?.[0]?.id || '')
      reportMinigameExpose(item, childIndex, exposureType, {
        moduleName: moduleName,
        firstLocal: this.firstLocal,
        secondLocal: 1
      })
    },
    mouseEnterItem(index) {
      this.curIndex = index
    },
    mouseLeaveItem() {
      if (this.$refs.videoDom && this.$refs.videoDom[0]) {
        this.$refs.videoDom[0].pause()
        this.$refs.videoDom[0].currentTime = 0
        this.$refs.videoDom[0].src = null
      }
      this.curIndex = null
    },
    clickMiniGame(item, key, moduleName) {
      // const sceneID = item.softDesc?.runConfigInfo?.resourcePos // this.moduleData.moduleSort + 1
      // const cardID = key + 1
      // const recommendID = item.softDesc?.runConfigInfo?.recommendId
      reportMinigameOpen({
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        plateName: moduleName,
        skuName: item.softName,
        softID: item.softId,
        softType: item?.softDesc?.isAd ? '广告' : '非广告', // 广告和非广告
        type: 1,
        lenovoid: this.userInfo ? this.userInfo.UserID : '',
        source_id: item.softDesc?.runConfigInfo?.resourcePos,
        alg_rid: item.softDesc?.runConfigInfo?.rid
      })
      openMiniGameAndPin(item, key)
    }
  },
  mounted() {
    getRegConfig('PinMiniGameIcon').then(o => {
      this.isCreatePin = !!o.Value
    }).catch(() => {
      this.isCreatePin = true
    })
  }
}
</script>
<style lang="scss" scoped>
.MiniGameList {
  max-width: 1760px;
  padding: 28px 40px 60px 40px;
  margin: 0 auto;
  h3.title-wrap {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 17px 0 30px 0;
    .title-bac {
      position: absolute;
      top: 0px;
      left: 0px;
    }
    .more {
      font-weight: 400;
      font-size: 14px;
      opacity: 0.6;
      z-index: 9;
      cursor: pointer;
      margin-top: 10px;
      &:hover {
        color: #386EFE;
        opacity: 1;
      }
    }
  }
  .list-wrap {
    display: flex;
    gap: 20px;
    .minigame-item {
      cursor: pointer;
      position: relative;
      flex: 1;
      width: 15.08vw;
      height: 26.8vw;
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100.5%;
        background: transparent url('~@/images/gamecenter/minigame-item.png') no-repeat center center/ 100% 100%;
      }
      .img-item {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .video-item {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .text-content {
        z-index: 1;
        position: absolute;
        bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        width: 100%;
        .icon {
          display: inline-block;
          width: 24px;
          height: 24px;
          border-radius: 24px;
          vertical-align: -7px;
          margin-right: 6px;
          background-size: cover;
          background-position: center;
        }
        .name {
          color: #FFF;
          font-size: 14px;
          font-weight: 700;
          line-height: 14px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          flex: 1;
          margin-right: 6px;
        }
      }
    }
  }
}

.PadDevice {

  @media screen and (max-width: 800px) {
      .MiniGameList h3.title-wrap {
      padding: 17px 0 2.5vw 0;
    }
  }
}

.minigame-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .minigame-item:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

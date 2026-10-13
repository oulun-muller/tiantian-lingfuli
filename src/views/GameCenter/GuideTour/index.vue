<template>
  <!-- GuideTour组件 -->
  <div class="guide-tour" v-if="visible">
    <!-- 蒙层 -->
    <div class="guide-tour-overlay"></div>

    <!-- 内容区 -->
    <div class="guide-tour-content" :style="{ backgroundImage: `url(${stepBackgroundImage})` }">
      <div class="jump" v-if="currentStepIndex !== 4" tabindex="0" role="button" aria-label="跳过" @click="jumpClose" @keydown.enter.prevent.stop="jumpClose" @keydown.space.prevent.stop="jumpClose">跳过</div>
      <div class="close-icon" v-else tabindex="0" role="button" aria-label="关闭" @click="closeAndReport" @keydown.enter.prevent.stop="closeAndReport" @keydown.space.prevent.stop="closeAndReport"></div>
      <!-- 换一换区域 -->
      <template v-if="isLastStep">
        <div class="chang-btn" v-if="originGameList.length > 5">
          <div class="change-btn-icon" aria-hidden="true"></div>
          <div class="change-btn-texr" tabindex="0" role="button" aria-label="换一换" @click="switchArrayClick" @keydown.enter.prevent.stop="switchArrayClick" @keydown.space.prevent.stop="switchArrayClick">换一换</div>
        </div>
        <div class="game-list-content">
          <div
            class="game-item"
            :style="{ backgroundImage : `url(${item.showInfo.vimg})` }"
            :class="{ 'game-item-select': selectGameList.includes(item.softId) }"
            v-for="(item,index) in currentGameList"
            :key="index"
            tabindex="0"
            role="checkbox"
            :aria-checked="selectGameList.includes(item.softId) ? 'true' : 'false'"
            :aria-label="item.softName"
            v-exposure="{
              handler: () => onExposure(item),
              delay: 1000,
              options: { threshold: 0.5 },
              once: true
            }"
            @click="handleItemClick(item)"
            @keydown.enter.prevent.stop="handleItemClick(item)"
            @keydown.space.prevent.stop="handleItemClick(item)">
            <div class="select-icon-class"></div>
            <!-- 没有背景图展示log -->
            <div v-if="!item.showInfo.vimg" class="log-class" :style="{ backgroundImage : `url(${item.showInfo.logoFile})` }"></div>
            <div class="bottom-content">
              <div class="game-title">{{ item.softName }}</div>
              <div class="tag-list">
                <div class="tag-item" v-for="(tag,tagIndex) in item.showInfo.softLabels.slice(0,2)" :key="tagIndex">{{ tag }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <!-- 上一步按钮 -->
      <div class="guide-tour-prev-btn" tabindex="0" role="button" aria-label="上一步" @click="prevStep" @keydown.enter.prevent.stop="prevStep" @keydown.space.prevent.stop="prevStep" v-if="currentStepIndex > 0">
        <img src="./img/left-arrow.svg" class="img-class" aria-hidden="true" />
        <div>上一步</div>
      </div>
      <!-- 下一步按钮 -->
      <div class="guide-tour-actions" :class="buttonPositionClass">
        <div
          class="guide-tour-next-btn"
          tabindex="0"
          role="button"
          :aria-label="buttonText"
          :aria-disabled="isInstallDisabled ? 'true' : 'false'"
          @click="!isInstallDisabled && nextStep()"
          @keydown.enter.prevent.stop="!isInstallDisabled && nextStep()"
          @keydown.space.prevent.stop="!isInstallDisabled && nextStep()"
          :class="{ 'isDisable': isInstallDisabled }">
          {{ buttonText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import { setRegConfig } from '@/nativeApi/Pbase'

import { getNewGuideGameList } from '@/api/guideTour'
import { convertCDKInfo } from '@/api/common.js'
export default {
  name: 'GuideTour',
  props: {
    // 控制组件显示隐藏
    visible: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 当前步骤索引
      currentStepIndex: 0,
      // 固定的5步引导数据
      steps: [
        {
          title: '欢迎使用',
          content: '欢迎使用引导功能，这将帮助您快速了解产品的核心特性。',
          backImage: new URL('./img/newUserInBg1.png', import.meta.url).href
        },
        { title: '自定义设置', content: '您可以根据个人偏好进行各种自定义设置，打造专属体验。', backImage: new URL('./img/newUserInBg2.png', import.meta.url).href },
        { title: '性能优化', content: '了解如何优化系统性能，获得最佳使用体验。', backImage: new URL('./img/newUserInBg3.png', import.meta.url).href },
        { title: '快捷键指南', content: '学习常用快捷键，提高操作效率。', backImage: new URL('./img/newUserInBg4.png', import.meta.url).href },
        { title: '完成引导', content: '恭喜完成所有引导！您现在可以开始探索产品的全部功能。', backImage: new URL('./img/newUserInBg5.png', import.meta.url).href }
      ],
      // 每个步骤对应的按钮位置配置
      stepButtonPositions: [
        { type: 'center-bottom' }, // 第一步 - 底部居中
        { type: 'left-center' }, // 第二步 - 左侧居中
        { type: 'left-center' }, // 第三步 - 左侧居中
        { type: 'left-center' }, // 第四步 - 左侧居中
        { type: 'center-bottom' } // 第五步 - 底部居中
      ],
      originGameList: [],
      currentGameList: [],
      selectGameList: [],
      currentStartIndex: 0,
      SHOW_COUNT: 5
    }
  },
  computed: {
    isLastStep() {
      return this.currentStepIndex === 4 // 固定5步，索引0-4
    },
    isInstallDisabled() {
      return this.isLastStep && this.selectGameList.length < 1
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    version() {
      return this.$store.state.system.version
    },

    stepBackgroundImage() {
      return this.steps[this.currentStepIndex].backImage
    },
    // 按钮文本
    buttonText() {
      return this.isLastStep ? '一键安装' : '下一步'
    },
    // 按钮位置动态类
    buttonPositionClass() {
      // 对于第一步和最后一步，按钮居中
      if (this.currentStepIndex === 0 || this.isLastStep) {
        return 'center-bottom'
      }
      // 对于中间步骤（二三四步），按钮在左侧
      return 'left-center'
    }
  },
  created() {
    this.init()
  },
  mounted() {
    // 组件挂载后的初始化逻辑
    //  this.updateHotspotPosition()
  },
  beforeUnmount() {
    // 清理资源
  },
  methods: {
    // 统一埋点方法，使用 postMessage 传递给父应用
    dataReport(module, action, label, params = {}) {
      window.parent.postMessage(
        {
          type: 'DATA_REPORT',
          data: {
            module,
            action,
            label,
            params
          }
        },
        '*'
      )
    },
    jumpClose() {
      this.dataReport(
        'LZ_homepage',
        'LZ_newUserGuideSkipClick',
        'click',
        {
          pageIndex: this.currentStepIndex + 1
        }
      )
      this.currentStepIndex = 4
      this.dataReport(
        'LZ_homepage',
        'LZ_newUserGuideRecomGamePageShow',
        'pv'
      )
    },
    async init() {
      const res = await getNewGuideGameList({ currentClientVersion: this.version, moduleType: 6 })
      if (res?.module?.ranking) {
        this.originGameList = res.module.ranking?.rankingListSofts.map(item => convertCDKInfo(item)) || []

        this.updateDisplayList(this.currentStartIndex, false)

        this.selectGameList = this.originGameList.slice(0, 5).map(item => item.softId)
      }
    },
    onExposure(item) {
      this.dataReport(
        'LZ_homepage',
        'LZ_newUserGuideReSingleGamePageShow',
        'pv',
        {
          detail: JSON.stringify({
            skuName: item.softName,
            softId: item.softId,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        }
      )
    },
    closeAndReport() {
      this.dataReport(
        'LZ_homepage',
        'LZ_newUserGuideCloseXClick',
        'click',
        {
          pageIndex: this.currentStepIndex + 1
        }
      )
      this.close()
    },
    close() {
      // this.$emit('close')
      window.parent.postMessage(
        {
          type: 'GUIDE_DOWNLOAD_GAMES_VISIBLE',
          data: false
        },
        '*'
      )
      setRegConfig({
        Name: 'NewLeadPop',
        Type: 'string',
        Value: 'show'
      })
    },
    handleItemClick(item) {
      const id = item.softId

      if (this.selectGameList.includes(id)) {
        this.selectGameList = this.selectGameList.filter(selectedId => selectedId !== id)
      } else {
        this.selectGameList.push(id)
      }
    },
    // 下一步方法
    nextStep() {
      if (this.isLastStep) {
        // 第五步时执行一键安装逻辑
        this.startInstall()
      } else {
        // 步骤切换显示逻辑：点击下一步后弹窗切换为下一步内容
        if (this.currentStepIndex < 4) {
          this.currentStepIndex++
          if (this.currentStepIndex === 4) {
            this.dataReport(
              'LZ_homepage',
              'LZ_newUserGuideRecomGamePageShow',
              'pv'
            )
          }
        }
      }
    },
    // 上一步方法
    prevStep() {
      if (this.currentStepIndex > 0) {
        this.dataReport(
          'LZ_homepage',
          'LZ_newUserGuidePreviousClick',
          'click'
        )
        this.currentStepIndex--
      }
    },
    // 一键安装方法
    startInstall() {
      if (!this.selectGameList.length) {
        return
      }
      let haboId = ''
      this.selectGameList.forEach(element => {
        const item = this.originGameList.find(item => item.softId === element)
        haboId = haboId + `${item.softName}_${item.softId},`
        // this.add(item)
        window.parent.postMessage(
          {
            type: 'GUIDE_DOWNLOAD_GAMES',
            data: item
          },
          '*'
        )
      })
      this.dataReport(
        'LZ_homepage',
        'LZ_newUserGuideOneclickInstallClick',
        'click',
        {
          nameid: haboId
        }
      )
      this.close()
    },
    /**
     * 根据起始索引更新展示的5条数据
     * @param {Number} startIndex - 起始索引
     */
    updateDisplayList(startIndex, report) {
      const arr = this.originGameList
      const newList = []
      // 循环取5条数据，超出数组长度则从头部循环
      for (let i = 0; i < this.SHOW_COUNT; i++) {
        const realIndex = (startIndex + i) % arr.length
        const item = arr[realIndex]
        report && this.onExposure(item)
        newList.push(item)
      }
      this.currentGameList = newList
    },
    /**
     * 点击换一换的切换逻辑
     */
    switchArray(report) {
      this.selectGameList = []
      this.currentStartIndex = (this.currentStartIndex + this.SHOW_COUNT) % this.originGameList.length
      this.updateDisplayList(this.currentStartIndex, report)
    },
    switchArrayClick() {
      this.dataReport(
        'LZ_homepage',
        'LZ_newUserGuideChangeClick',
        'click'
      )
      this.switchArray(true)
    },
    async add(item) {
      const { softId, softName } = item || {}
      // if (this.isClick) {
      //   this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      // }
      // if (this.softPurpose === 3 && !this.stateInfo.IsGAHaveUpdate) {
      //   const realNameAuthRes = await this.$realNameAuthentication({
      //     gameName: this.softName,
      //     softid: this.softId
      //   })
      //   if (!realNameAuthRes) return
      //   await this.$gamePathSetting({
      //     logoFile: this.logoFile,
      //     softName: this.softName,
      //     zipSize: this.downloadInfo?.installSize || '',
      //     softid: this.softId
      //   })
      // }

      this.$store.dispatch('softwareState/add', {
        SoftID: softId,
        Version: item.softDesc.version,
        SoftName: softName,
        LogoFile: item.showInfo.logoFile,
        drinfo: JSON.stringify({
          firstLocal: 12
        })
      })
    }
  }
}

</script>

<style scoped lang="scss">
@import './index.scss';

// 安装进度相关样式
.install-progress-container {
  width: 100%;
  margin-top: 16px;
  text-align: center;
}

.install-progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.install-progress-fill {
  height: 100%;
  background-color: #10B981;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.install-progress-text {
  display: block;
  color: #ffffff;
  margin-bottom: 12px;
  font-size: 14px;
}

.cancel-install-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.install-error-message {
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.retry-install-btn {
  background-color: #ef4444;
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 12px;

  &:hover {
    background-color: #dc2626;
  }
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.guide-tour .jump:focus-visible,
.guide-tour .close-icon:focus-visible,
.guide-tour .change-btn-texr:focus-visible,
.guide-tour .guide-tour-prev-btn:focus-visible,
.guide-tour .guide-tour-next-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.guide-tour .game-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .guide-tour .jump:focus-visible,
  .guide-tour .close-icon:focus-visible,
  .guide-tour .change-btn-texr:focus-visible,
  .guide-tour .guide-tour-prev-btn:focus-visible,
  .guide-tour .guide-tour-next-btn:focus-visible,
  .guide-tour .game-item:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

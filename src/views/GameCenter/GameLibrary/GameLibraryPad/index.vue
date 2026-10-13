<template>
  <div>
    <div class="GameLibrary" @touchend="GameLibraryTouch" @touchstart="recordStart" >
      <div class="search">
        <PadGameSearch class="search-class" />
        <div class="icon-item-class">
          <img v-if="isShowMyDevice" src="@/images/padimg/equitment.svg" class="icon-class" @click="toMyDevice" />
          <img v-if="$isAIPartnerEnabled" src="@/images/padimg/game_partner_entry_logo.svg" class="icon-class ai-partner-icon" @click.stop="toAIDialogue" />
        </div>
      </div>

      <header id="gameLibraryContentHeight" class="noIsLabeled">
        <div class="header">
          <img src="@/images/padimg/filter.svg" class="icon-img" @click="() => { showFilterTag = !showFilterTag }"/>
          <span class="header-title" @click="() => { showFilterTag = !showFilterTag }">筛选</span>
          <div class="tag-scroll-container">
            <span class="cur-tah-class" v-for="(item, index) in selectTagList" :key="index">
              {{ item }}
            </span>
          </div>
        </div>
      </header>
      <div v-if="showFilterTag" class="search-tag-class" :class="{ 'search-tag-class-first': showFirstStyle }">
        <SearchTag @filterChange="selectTags" @deleteCurrentTags="deleteCurrentTags" :select-tag-list="selectTagList"/>
        <div v-if="showFirstStyle" class="bottom-text-class">
          <img src="@/images/padimg/chevron-double-up.svg"/>
          <span>向上滑动加载更多游戏</span>
        </div>
      </div>
      <ol :style="{ height: scrollAreaHeight }" class="scroll-area">
        <div class="filter-container">
          <span :style="{opacity: 0.4,}">共有{{ gameHouseTotal }}款游戏</span>
          <el-select
            v-model="column2"
            size="mini"
            popper-class="lgSelectDropdown"
            class="lgSelect"
            @change="filterChange">
            <el-option
              v-for="item in showSortList"
              :key="item.id"
              :label="item.name"
              :value="item.id">
              <div class="ub ub-ac ub-pj w100">
                <div>{{ item.name }}</div>
              </div>
            </el-option>
          </el-select>
        </div>
        <section class="left" ref="gameHouseScroller" @scroll="scrollHandle">
          <FourColumnListPad
            v-if="gameHouseList.length"
            :cdk-list="gameHouseList"
            :page-type="'gameHouse'"
            :first-local="firstLocal"
            :second-local="secondLocal"
            :third-local="thirdLocal"
            :selsect-label-list="selectTagList" />
          <div class="bottom-area"></div>
          <div v-if="!gameHouseList.length && isLoad" class="normal">
            <img src="@/images/gamecenter/nothing.png" alt="">
            <p>暂无游戏哦 ！</p>
          </div>
        </section>
      </ol>
    </div>
  </div>
</template>
<script>
import FourColumnListPad from '@/components/FourColumnList_pad'
import { queryCDKList } from '@/api/cdkMall'
import { getContentScroll } from '@/utils'
import { openNativePage } from '@/nativeApiPad/common.js'
import PadGameSearch from '@/components/PadGameSearch'

import { DEVICE_TYPE } from '@/store/enum/buryingPoint.js'
import SearchTag from './searchTag.vue'
export default {
  name: 'GameLibrary',
  data() {
    return {
      scrollTop: 0,
      fromRouterName: null,
      current: 0,
      nomore: false,
      gameHouseList: [],
      fetching: false,
      gameHouseScrollTop: 0,
      column: null, // createTime：创建时间，price：价格，discount：折扣
      column2: 'hotNum', // createTime：创建时间，price：价格，discount：折扣
      asc: false, // true：正序，false：倒叙
      showSortList: [
        {
          name: '按热度',
          id: 'hotNum'
        },
        {
          name: '按时间',
          id: 'createTime'
        },
        {
          name: '按价格',
          id: 'price'
        },
        {
          name: '按折扣',
          id: 'discount'
        }
      ],
      isLoad: false,
      scrollAreaHeight: 0,
      firstOperateFilterChange: true,
      gameHouseTotal: '',
      isPassed: false,
      showFirstStyle: false,
      showFilterTag: false,
      startX: 0,
      selectTagList: []
    }
  },
  components: {
    FourColumnListPad,
    PadGameSearch,
    SearchTag
  },
  watch: {
    selectTagList: {
      handler(newVal) {
        if (newVal) {
          this.isLoad = false
          this.getGameHouseList(true)
        }
      }
    },
    userInfo: {
      handler(newValue, oldValue) {
        this.$store.dispatch('gameDownloadState/clearState')
        this.getGameHouseList(true)
      }
    }
  },
  computed: {
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      if (this.$route.query.sourceIsDetailFirstLocal) {
        return Number(this.$route.query.sourceIsDetailFirstLocal)
      }

      const _GAME_CENTER_SOURCE_RECORD = Number(sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD'))
      return _GAME_CENTER_SOURCE_RECORD
    },
    isShowMyDevice() {
      const name = this.$store.state.system.MTMInfo?.ReadableMachineName || ''
      for (const item of DEVICE_TYPE) {
        if (name.includes(item)) {
          return true
        }
      }
      return false
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 4
    },
    thirdLocal() {
      if (this.$route.query.sourceIsDetailThirdLocal) {
        return this.$route.query.sourceIsDetailThirdLocal
      }

      return ''
    },
    version() {
      return this.$store.state.system.version
    }
  },
  created() {
    const tagList = sessionStorage.getItem('GAME_RankList_SelectTag')
    if (tagList) {
      this.selectTagList = JSON.parse(tagList)
    }
    this.getGameHouseList(true)
    this.$emit('headerStatus', false)
  },
  mounted() {
    this.$dataReport('LZ_gamingCenter', 'findgameShow', 'pv', {})
    this.$emit('scrollTop', 0)
    // TODO(ui-fix): 需求变更——进入游戏库默认不展开“筛选”选择框，原首次进入自动展开逻辑已停用（保留代码备查）
    // const isFisrst = sessionStorage.getItem('pagGamePageFirstIn')

    // if (!isFisrst) {
    //   this.showFirstStyle = true
    //   this.showFilterTag = true

    //   sessionStorage.setItem('pagGamePageFirstIn', true)
    // }
    window.addEventListener('resize', this.handleResize)
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile.removeListener(this._doubleclickTabListener)
    }
    this._doubleclickTabListener = window.LegionZoneMobile.addListener('doubleclick_tab', this.scrollToTop)
  },
  beforeUnmount() {
    if (this.selectTagList?.length > 0) {
      sessionStorage.setItem('GAME_RankList_SelectTag', JSON.stringify(this.selectTagList))
    }
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile.removeListener(this._doubleclickTabListener)
      this._doubleclickTabListener = null
    }
  },
  methods: {
    scrollToTop() {
      this.$refs.gameHouseScroller.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    recordStart(e) {
      this.startX = e.touches[0].clientX
    },
    GameLibraryTouch(e) {
      const endX = e.changedTouches[0].clientX
      const distanceX = endX - this.startX
      if (Math.abs(distanceX) > 10) {
        this.showFirstStyle = false
        this.showFilterTag = false
      }
    },
    getGameHouseList(force) {
      if (this.fetching) return

      if (force) {
        this.current = 0
        this.nomore = false
        this.gameHouseList = []
      } else if (this.nomore) {
        return
      }

      const params = {
        currentClientVersion: this.version,
        current: this.current + 1,
        size: 20
      }

      if (this.column2) {
        params.column = this.column2
        params.asc = this.asc
      }

      if (this.selectTagList.length) {
        params.softlabels = this.selectTagList.join(',')
      }

      this.fetching = true
      if (force) {
        this.$store.dispatch('pageLoaded', { status: false, alpha: 0 })
      }
      queryCDKList(params).then(res => {
        this.nomore = res.records.length < res.size
        this.current = res.current
        this.gameHouseTotal = res.total
        this.gameHouseList = [...this.gameHouseList, ...res.records]
        setTimeout(() => {
          this.gameReport(res.records)
        }, 100)
      }).catch(() => {
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.isLoad = true
        this.fetching = false
        if (force) {
          this.$store.dispatch('pageLoaded', false)
        }

        this.$nextTick(() => {
          this.scrollAreaHeight = getContentScroll('gameLibraryContentHeight')
        })
      })
    },
    scrollHandle(e) {
      this.gameHouseScrollTop = Math.round(e.target.scrollTop)

      if (!this.nomore && e.target.scrollTop + e.target.offsetHeight + 300 >= e.target.scrollHeight) {
        this.getGameHouseList(false)
      }
    },
    selectTags(value) {
      this.selectTagList = value
      this.showFilterTag = false
      console.log('this.selectTagList', this.selectTagList)

    //  this.getGameHouseList(true)
    },
    deleteCurrentTags() {
      this.selectTagList = []
      this.showFilterTag = false
      // 清除选择时同步清理持久化的历史选择，避免返回页面时恢复出已清除的选中态
      sessionStorage.removeItem('GAME_RankList_SelectTag')
    //  this.getGameHouseList(true)
    },
    filterChange(filterKey) {
      if (this.column !== filterKey) {
        if ((filterKey === 'price') || (this.firstOperateFilterChange && filterKey === 'hotNum')) {
          this.asc = true
        } else {
          this.asc = false
        }
      } else {
        this.asc = !this.asc
      }

      this.firstOperateFilterChange = false
      this.column = filterKey
      this.column2 = filterKey
      this.isLoad = false
      this.getCdkListDebounce(true)
    },
    getCdkListDebounce(force) {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.getGameHouseList(force)
      }, 200)
    },
    gameReport(data) {
      if (data.length) {
        const _data = data.map(o => {
          let _bizType = 1
          if ([1, 2].includes(o.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
            _bizType = 2
          } else if (o.downloadInfo.bizType === 4) {
            _bizType = 3
          }

          let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
          if ([1, 2].includes(o.downloadInfo.bizType)) {
            if (o.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
              buttonType = 2
            } else if (o.downloadInfo.userReservationStatus === 1) {
              buttonType = 3
            }
          } else if (o.downloadInfo.bizType === 4) {
            if (o.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
              buttonType = 4
            } else {
              if (o.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                buttonType = 5
              } else if ([1].includes(o.downloadInfo.userTestApplyStatus)) {
                buttonType = 6
              } else if ([2].includes(o.downloadInfo.userTestApplyStatus)) {
                buttonType = 1
              }
            }
          }

          const _name_cdk = `${o.softName}_${o.softId}`
          const _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
          const _softPurpose = o.softPurpose

          return {
            name_cdk: _name_cdk,
            name_download: _name_download,
            softPurpose: _softPurpose
          }
        })
        const _cdk = _data.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
        const _download = _data.filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

        if (_cdk) {
          this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
            details: JSON.stringify({
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              plateName: this.selectTagList.join(','),
              nameAndIDVersion: _cdk,
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          })
        }

        if (_download) {
          this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeLoadGameTabPageShow', 'pv', {
            details: JSON.stringify({
              firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              plateName: this.selectTagList.join(','),
              nameAndIDVersion: _download,
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          })
        }
      }
    },
    toAIDialogue() {
      this.$dataReport('aIassistant', 'aIassistantEnterClick', 'click')
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorAIAgentFromGameLibrary')
      }
    },
    toMyDevice() {
      openNativePage('DevicePage')
    }
  }
}

</script>
<style lang="scss" scoped>
.GameLibrary {
  margin: 0 auto;
  max-width: 1840px;
  background-color: #000;

  .search {
    width: 100%;
    height: 74px;
    padding: 20px 30px;
    display: flex;
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
      flex: 1
    }
  }

  .noIsLabeled {
    padding: 0 3.75vw;
    margin: 30px 0 20px;
    overflow: hidden;
  }

  .scroll-area {
    margin: 0 30px;
  }

  .left {
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .search-tag-class {
    position: fixed;
    width: 100%;
    z-index: 11;
  }

  .header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width:100%;
    height: 28px;

    .icon-img {
      height: 26px;
      width: 26px;
    }

    .header-title {
      color: #EAF7FF;
      font-family: "Microsoft YaHei";
      font-size: 14px;
      vertical-align: middle;
      margin-left: 7px;
      margin-right: 10px;
    }

    .cur-tah-class {
       flex: 0 0 auto;
      background: rgba(234, 247, 255, 0.10);
      margin-left: 10px;
      width: 96px;
      height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 10px;
      opacity: 0.8;
    }
  }

  .search-tag-class-first {
    position: static;
    margin-bottom: 30px;

    .bottom-text-class {
      margin-top: 23px;
      text-align: center;
      font-size: 14px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  .normal {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .filter-container {
    font-size: 14px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }


  :deep(.lgSelect) {
    width: 118px;
height: 32px;
    .el-input__inner {
        border-color: rgba(234, 247, 255, 0.2);
      }
    .el-input__inner {
      height: 30px;
      line-height: 30px;
      width: 118px;
      padding: 0 12px;
      user-select: none;
      font-size: 14px;
      font-weight: 400;
      color: rgba(234, 247, 255, 0.4) !important;
      border: 1px solid rgba(234, 247, 255, 0.2);
    }
    .el-input.is-focus .el-input__inner {
      border: 1px solid rgba(234, 247, 255, 0.2);
    }
    .el-input__inner:focus {
      border: 1px solid rgba(234, 247, 255, 0.2);
    }
    .el-input__icon {
      height: 32px !important;
      line-height: 32px;
      color: rgba(234, 247, 255, 0.4);
    }
    .el-input .el-select__caret {
      font-size: 12px;
    }
  }


 .tag-scroll-container {
  display: flex;
  align-items: center;
  overflow-x: scroll;
  flex: 1;
  &::-webkit-scrollbar {
    display: none;
  }
 }

 .bottom-area {
  width: 100%;
  height: 130px;
 }

}

@media screen and (max-width : 800px) {
    .GameLibrary .scroll-area {
    margin: 0 3.75vw;

  }
  .PadDevice {
   .GameLibrary .noIsLabeled {
    margin: 1.5vw 0 ;
   }
}
.GameLibrary .header .icon-img {
  height: 3.25vw;
  width: 3.25vw;
}
}

</style>

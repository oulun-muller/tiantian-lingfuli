<template>
  <div>
    <div class="GameLibrary">
      <ul class="selectList" v-if="selectTagList.length">
        <span>已选择条件：</span>
        <li
          v-for="(item,index) in selectTagList"
          :key="index">{{ item }}<i tabindex="0" role="button" :aria-label="'删除筛选条件：' + item" @click.stop="deleteCurrentTags(item)" @keydown.enter.prevent.stop="deleteCurrentTags(item)" @keydown.space.prevent.stop="deleteCurrentTags(item)"></i></li>
      </ul>
      <header id="gameLibraryContentHeight" :class="{'noIsLabeled': !selectTagList.length}">
        <div class="games">
          <p>已为您找到{{ gameHouseTotal }}款游戏</p>
          <div class="selectAnItem">
            <b></b>
            <div
              class="arrowhead"
              tabindex="0"
              role="button"
              :aria-label="asc ? '当前正序排列，点击切换' : '当前倒序排列，点击切换'"
              @click.stop="filterChange(column2)"
              @keydown.enter.prevent.stop="filterChange(column2)"
              @keydown.space.prevent.stop="filterChange(column2)">
              <i :class="{'iconfont':true,'isActive':asc}">&#xe67a;</i>
              <i :class="{'iconfont':true,'isActive':!asc}">&#xe67c;</i>
            </div>
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
        </div>
        <p class="placeholding"></p>
      </header>
      <ol :style="{height:scrollAreaHeight}">
        <section class="left" ref="gameHouseScrollTop" @scroll="scrollHandle">
          <FourColumnList
            v-if="gameHouseList.length"
            :cdk-list="gameHouseList"
            :page-type="'gameHouse'"
            :first-local="firstLocal"
            :second-local="secondLocal"
            :third-local="thirdLocal"
            :selsect-label-list="selectTagList"/>
          <div
            v-if="!gameHouseList.length && isLoad"
            class="normal">
            <img src="@/images/gamecenter/nothing.png" alt="">
            <p>暂无游戏哦 ！</p>
          </div>
        </section>
        <section class="right">
          <li
            v-for="(item,labelindex) in levelLabel"
            :key="labelindex">{{ item }}
            <div class="content" v-if="item==='热门主题'">
              <p
                v-for="(_item,listindex) in labelList[1]['热门主题']"
                :key="listindex"
                :class="{ 'isActive': selectTagList.includes(_item) }"
                tabindex="0"
                role="button"
                :aria-pressed="selectTagList.includes(_item) ? 'true' : 'false'"
                @click.stop="selectTags(_item)"
                @keydown.enter.prevent.stop="selectTags(_item)"
                @keydown.space.prevent.stop="selectTags(_item)">{{ _item }}</p>
            </div>
            <div
              class="content"
              v-if="item==='热门玩法'">
              <p
                v-for="(_item,listindex) in labelList[3]['热门玩法']"
                :key="listindex"
                :class="{ 'isActive': selectTagList.includes(_item) }"
                tabindex="0"
                role="button"
                :aria-pressed="selectTagList.includes(_item) ? 'true' : 'false'"
                @click.stop="selectTags(_item)"
                @keydown.enter.prevent.stop="selectTags(_item)"
                @keydown.space.prevent.stop="selectTags(_item)">{{ _item }}</p>
            </div>
            <div
              class="content"
              v-if="item==='游戏特性'">
              <p
                v-for="(_item,listindex) in labelList[2]['游戏特性']"
                :key="listindex"
                :class="{ 'isActive': selectTagList.includes(_item) }"
                tabindex="0"
                role="button"
                :aria-pressed="selectTagList.includes(_item) ? 'true' : 'false'"
                @click.stop="selectTags(_item)"
                @keydown.enter.prevent.stop="selectTags(_item)"
                @keydown.space.prevent.stop="selectTags(_item)">{{ _item }}</p>
            </div>
          </li>
        </section>
      </ol>
    </div>
  </div>

</template>
<script>
// import Header from '../../common/Header.vue'
import FourColumnList from '@/components/FourColumnList'
import { queryCDKList } from '@/api/cdkMall'
import { getContentScroll } from '@/utils'
import { getGameMsgDataReport, createTabPageReporter } from '@/utils/dataReport'
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
      gameHouseTotal: ''
    }
  },
  components: {
    FourColumnList
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
    selectTagList() {
      return this.$store.state.gameCenter.selectTagList
    },
    labelList() {
      return this.$store.state.gameCenter.labelList
    },
    levelLabel() {
      return this.$store.getters['gameCenter/levelLabel']
    },
    version() {
      return this.$store.state.system.version
    }
  },
  beforeRouteEnter(to, from, next) {
    if (!['GameCenterDetail', 'GameCenterSearch'].includes(from.name)) {
      if (window._GAMECENTER_RESTORE) {
        delete window._GAMECENTER_RESTORE['GameLibrary']
      }
    }

    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  // 在路由离开前执行
  beforeRouteLeave(to, from, next) {
    // 如果目标路由是GameCenterDetail
    if (['GameCenterDetail', 'GameCenterSearch'].includes(to.name)) {
      // 将当前组件的数据和滚动条位置保存到window._GAMECENTER_RESTORE['GameLibrary']中
      window._GAMECENTER_RESTORE['GameLibrary'] = JSON.stringify({
        ...this.$data,
        gameHouseScrollTop: Math.round(this.$refs.gameHouseScrollTop.scrollTop)
      })
    } else {
      // 否则，调用gameCenter/cleanup方法清理游戏中心标签数据
      this.$store.dispatch('gameCenter/cleanup')
    }

    clearTimeout(this.timer)
    window.removeEventListener('resize', this.handleResize)

    // 执行下一个钩子函数
    next()
  },
  created() {
    this._reporter = createTabPageReporter('游戏库', '/gameCenter/gameLibrary')

    const _clearStorageLibrary = sessionStorage.getItem('clearStorageLibrary')

    if (!_clearStorageLibrary && window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameLibrary']) {
      const {
        column,
        column2,
        asc,
        current,
        nomore,
        gameHouseList,
        gameHouseScrollTop,
        scrollAreaHeight,
        firstOperateFilterChange,
        gameHouseTotal
      } = JSON.parse(window._GAMECENTER_RESTORE['GameLibrary'])

      delete window._GAMECENTER_RESTORE['GameLibrary']

      this.column = column
      this.column2 = column2
      this.asc = asc
      this.current = current
      this.nomore = nomore
      this.gameHouseList = gameHouseList
      this.gameHouseScrollTop = gameHouseScrollTop
      this.scrollAreaHeight = scrollAreaHeight
      this.firstOperateFilterChange = firstOperateFilterChange
      this.gameHouseTotal = gameHouseTotal

      this.$nextTick(() => {
        this.$refs.gameHouseScrollTop.scrollTop = this.gameHouseScrollTop
        this._reporter.reportLoaded()
      })
    } else {
      if (this.$route.query.label) {
        const _label = this.$route.query.label || ''
        if (this.labelList[1]['热门主题'].some(o => o.toUpperCase() === _label.toUpperCase())) {
          if (!this.selectTagList.some(o => o === _label.toUpperCase())) {
            this.$store.dispatch('gameCenter/setSelectTagList', _label.toUpperCase())
          }
        } else if (this.labelList[3]['热门玩法'].some(o => o.toUpperCase() === _label.toUpperCase())) {
          if (!this.selectTagList.some(o => o === _label.toUpperCase())) {
            this.$store.dispatch('gameCenter/setSelectTagList', _label.toUpperCase())
          }
        } else if (this.labelList[2]['游戏特性'].some(o => o.toUpperCase() === _label.toUpperCase())) {
          if (!this.selectTagList.some(o => o === _label.toUpperCase())) {
            this.$store.dispatch('gameCenter/setSelectTagList', _label.toUpperCase())
          }
        }
      }
      this.$store.dispatch('gameDownloadState/clearState')
      this.getGameHouseListWithReport()
    }
  },
  mounted() {
    this.$emit('headerStatus', true)
    this.$emit('scrollTop', 0)
    window.addEventListener('resize', this.handleResize)

    requestAnimationFrame(() => this._reporter.reportFirstFrame())
  },
  methods: {
    async getGameHouseListWithReport() {
      this._reporter.reportStart()
      await this.getGameHouseList(true)
      this._reporter.reportLoaded()
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
        this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      }
      return queryCDKList(params).then(res => {
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
      if (this.selectTagList.some(o => o === value)) {
        this.$store.dispatch('gameCenter/upDataCurTags', value)
      } else {
        this.$store.dispatch('gameCenter/setSelectTagList', value)
      }
    },
    deleteCurrentTags(value) {
      if (this.selectTagList.some(o => o === value)) {
        this.$store.dispatch('gameCenter/upDataCurTags', value)
      }
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
    handleResize() {
      this.$nextTick(() => {
        this.scrollAreaHeight = getContentScroll('gameLibraryContentHeight')
      })
    },
    gameReport(data) {
      if (data.length) {
        const _data = data.map(o => {
          const report = getGameMsgDataReport(o)
          const _bizType = report.stateGame
          const buttonType = report.statePage

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
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              plateName: this.selectTagList.join(','),
              nameAndIDVersion: _download,
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          })
        }
      }
    }
  }
}

</script>
<style lang="scss" scoped>
div.GameLibrary {
  margin: 0 auto;
  max-width: 1840px;
  > ul.selectList {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 0 40px;
    box-sizing: border-box;
    margin-top: 22px;
    span {
      color: rgba(234, 247, 255, 0.6);
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
      padding-top: 7px;
      margin-right: 5px;
    }
    > li {
      height: 20px;
      line-height: 19px;
      color: rgba(234, 247, 255, .6);
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      padding: 0px 7px 0px 7px;
      border: 0.5px solid rgba(234, 247, 255, .6);
      margin-right: 8px;
      cursor: pointer;
      margin-top: 8px;
      letter-spacing: 0.2px;
      display: flex;
      align-items: center;
      > i {
        display: inline-block;
        width: 7px;
        height: 7px;
        margin-left: 8px;
        background: url('@/images/gamecenter/game-delete.png') no-repeat;
        background-size: cover;
        margin-top: 1px;
      }
    }
  }
  > header {
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    padding: 0 40px;
    box-sizing: border-box;
    margin-top: 29px;
    &.noIsLabeled {
      margin-top: 37px;
    }
    > div.games {
      flex: 1;
      display: flex;
      justify-content: space-between;
      > p {
        color: #EAF7FF;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        opacity: .4;
      }
      > div.selectAnItem {
         position: relative;
         margin-top: -8px;
         > b {
          display: inline-block;
          border-left: 1px solid rgba(234, 247, 255, 0.2);
          height: 100%;
          position: absolute;
          right: 28px;
          top: 0px;
          font-size: 25px;
          font-weight: lighter;
          color: rgba(234, 247, 255, 0.2);
         }
         > div.arrowhead {
            margin-top: 3px;
            width: 83px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: absolute;
            right: 27px;
            top: -4px;
            z-index: 2;
            cursor: pointer;
          > i.iconfont {
            width: 20px;
            height: 9px;
            color: rgba(234, 247, 255, 0.2);
            font-size: 12px;
            display: inline-block;
            transform: scale(0.46);
            margin-left: 60px;
            &.isActive {
              color: rgba(234, 247, 255, 1);
             }
          }
        }
      }
    }
    > p.placeholding {
      width: 22vw;
      margin-left: 20px;
    }
  }
  > ol {
    display: flex;
    padding: 0 40px;
    box-sizing: border-box;
    > section.left {
      flex: 1;
      margin-right: 20px;
      height: 100%;
      overflow-x: hidden;
      overflow-y: scroll;
      &::-webkit-scrollbar {
        display: none;
      }
      > div.normal {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        > img {
          width: 70px;
          height: 70px;
        }
        p {
          color: #EAF7FF;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          margin-top: 10px;
          opacity: .6;
          margin-left: 12px;
          transform: scale(0.91);
        }
      }
    }
    > section.right {
      width: 22vw;
      max-width: 380px;
      height: 100%;
      overflow-x: hidden;
      overflow-y: scroll;
      background: linear-gradient(76deg, rgba(30, 34, 39, 0.2) 5.79%, rgba(112, 118, 150, 0.2) 100.17%);
      padding: 14px 14px 20px 17px;
      box-sizing: border-box;
      &::-webkit-scrollbar {
        display: none;
      }
      > li {
        color: rgba(234, 247, 255, 0.6);
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px;
        &:nth-child(2),&:nth-child(3) {
          margin-top: 21px;
          > div.content {
            > p {
              margin-top: 10px;
            }
          }
        }
        > div.content {
          display: flex;
          flex-wrap: wrap;
          > p {
            margin-top: 11px;
            width: calc((100% - 10px) / 2);
            height: 28px;
            line-height: 27px;
            text-align: center;
            background: rgba(234, 247, 255, 0.05);
            cursor: pointer;
            &:nth-child(even) {
              margin-left: 10px;
            }
            &:hover,&.isActive {
              outline: 1.5px solid rgba(234, 247, 255, 1);
              position: relative;
              &::after {
                position: absolute;
                right: -5px;
                top: -5px;
                content: "";
                width: 0;
                height: 0;
                border-top: 5px solid rgba(234, 247, 255, 1);
                border-right: 5px solid transparent;
                border-bottom: 5px solid transparent;
                border-left: 5px solid transparent;
                transform: rotate(-135deg);
              }
            }
          }
        }
      }
    }
  }
}

  :deep(.lgSelect) {
    &:hover {
      .el-input__inner {
        border-color: rgba(234, 247, 255, 0.2);
      }
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
      &:hover {
        border: 1px solid rgba(234, 247, 255, 0.2);
      }
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

@media screen and (min-width: 1290px) {
  div.GameLibrary > ol > section:nth-of-type(2) > li > div.content > p {
    height: 38px;
    line-height: 37px;
  }
}
@media screen and (min-width: 1770px) {
  div.GameLibrary > ol > section:nth-of-type(2) > li > div.content > p {
    height: 48px;
    line-height: 47px;
  }
}

div.GameLibrary .selectList > li > i:focus-visible,
div.GameLibrary .arrowhead:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

div.GameLibrary .content > p:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

@media (forced-colors: active) {
  div.GameLibrary {
    background: Canvas;
    color: CanvasText;
    forced-color-adjust: auto;

    > ul.selectList,
    > header,
    > ol,
    > ol > section.left,
    > ol > section.right,
    > ol > section.left > div.normal {
      background: Canvas;
      border-color: ButtonText;
      color: CanvasText;
      forced-color-adjust: auto;
    }

    > ul.selectList > span,
    > header > div.games > p,
    > ol > section.left > div.normal p,
    > ol > section.right > li {
      color: CanvasText;
    }

    > ul.selectList > li,
    > ol > section.right > li > div.content > p {
      background: Canvas;
      border: 1px solid ButtonText;
      color: CanvasText;
      forced-color-adjust: auto;
    }

    > ul.selectList > li > i,
    > header > div.games > div.selectAnItem,
    > header > div.games > div.selectAnItem > div.arrowhead {
      background: ButtonFace;
      border: 1px solid ButtonText;
      color: ButtonText;
      forced-color-adjust: auto;
    }

    > header > div.games > div.selectAnItem > b {
      border-color: ButtonText;
      color: ButtonText;
    }

    > header > div.games > div.selectAnItem > div.arrowhead > i.iconfont,
    > header > div.games > div.selectAnItem > div.arrowhead > i.iconfont.isActive {
      color: ButtonText;
    }

    > ol > section.right > li > div.content > p:hover,
    > ol > section.right > li > div.content > p.isActive,
    > ol > section.right > li > div.content > p[aria-pressed="true"] {
      background: Highlight;
      border-color: Highlight;
      color: HighlightText;
      outline: 1px solid Highlight;
    }

    > ol > section.right > li > div.content > p:hover::after,
    > ol > section.right > li > div.content > p.isActive::after {
      border-top-color: HighlightText;
    }

    .disabled,
    .is-disabled,
    [disabled],
    [aria-disabled="true"] {
      color: GrayText;
      border-color: GrayText;
    }

    :deep(.lgSelect .el-input__inner) {
      background: Canvas;
      border: 1px solid ButtonText;
      color: CanvasText !important;
      forced-color-adjust: auto;
    }

    :deep(.lgSelect .el-input__icon),
    :deep(.lgSelect .el-input .el-select__caret) {
      color: ButtonText;
    }
  }

  div.GameLibrary .selectList > li > i:focus-visible,
  div.GameLibrary .arrowhead:focus-visible,
  div.GameLibrary .content > p:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>

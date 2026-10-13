<template>
  <section>
    <div class="Main" @click.stop="showTips = -1">
      <div>
        <header>
          <h1>安装游戏<button @click="operate(1)" /></h1>
        </header>
        <section v-if="pageType===1">
          <div class="add-content">
            <div class="top">
              <img :src="logoFile" alt="">
              <h1>{{ softName }}</h1>
              <p>所需空间{{ zipSize }}</p>
            </div>
            <div class="bottom">
              <h1>
                <p>安装位置</p>
                <span tabindex="0" role="button" aria-label="添加位置" @click.stop="addLocation()" @keydown.enter.prevent.stop="addLocation()" @keydown.space.prevent.stop="addLocation()">添加位置</span>
              </h1>
              <ul>
                <li
                  v-for="item in showUsedGameDriversEnum"
                  :key="item.id"
                  :class="{'isActive':item.id === IsDefaultId}"
                  tabindex="0"
                  role="button"
                  :aria-label="item.DriveName + '，选择安装位置'"
                  @click.stop="selectUsed(item)"
                  @keydown.enter.prevent.stop="selectUsed(item)"
                  @keydown.space.prevent.stop="selectUsed(item)">
                  <p>{{ item.DriveName }}</p>
                  <span>剩余{{ filterFreeSpace(item.FreeSpace) }}<i tabindex="0" role="button" aria-label="更多选项" @click.stop="more($event,item)" @keydown.enter.prevent.stop="more($event,item)" @keydown.space.prevent.stop="more($event,item)"></i></span>
                  <ol v-if="showTips === item.id" role="menu" :style="{left:tipLeft+'px',top:tipTop+'px'}">
                    <li tabindex="0" role="menuitem" @click.stop="browseLocal(item)" @keydown.enter.prevent.stop="browseLocal(item)" @keydown.space.prevent.stop="browseLocal(item)">浏览本地目录</li>
                    <li tabindex="0" role="menuitem" @click.stop="deleteGame(item)" @keydown.enter.prevent.stop="deleteGame(item)" @keydown.space.prevent.stop="deleteGame(item)">移除此位置</li>
                  </ol>
                </li>
              </ul>
            </div>
            <footer>
              <button @click="operate(4)">确认安装</button>
            </footer>
          </div>
        </section>
        <section v-if="pageType===2">
          <div class="list-content">
            <h1>请选择要添加的磁盘</h1>
            <ul>
              <li
                v-for="item in showGameDriversEnum"
                :key="item.id"
                tabindex="0"
                role="button"
                :aria-label="item.DriveName + (item.IsIncluded ? '，已添加' : '，点击选择')"
                @click.stop="selectGameDrivers(item)"
                @keydown.enter.prevent.stop="selectGameDrivers(item)"
                @keydown.space.prevent.stop="selectGameDrivers(item)"
                :class="{
                  'isActive':item.id === activeId,
                  'isUsed':item.IsIncluded,
                }">
                <p>{{ item.DriveName }}</p>
                <span>剩余{{ filterFreeSpace(item.FreeSpace) }}</span>
              </li>
            </ul>
            <footer>
              <button @click.stop="operate(2)">取消</button>
              <button @click.stop="operate(3)">确认添加</button>
            </footer>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
<script>
import {
  GameDriversEnum,
  GameDriversAdd,
  GameDriversSwitchDefault,
  GameDriversDelete,
  GameOpenFolder
} from '@/nativeApi/LZProxy'
import { getLegacyUserInfo } from '@/compat/legacyGlobals'
export default {
  name: 'Main',
  data() {
    return {
      logoFile: '',
      softName: '',
      zipSize: '',
      softid: '',
      gameDriversEnum: [],
      showTips: -1,
      reject: null,
      resolve: null,
      pageType: 1,
      IsDefaultId: -1,
      activeId: -1,
      tipLeft: 0,
      tipTop: 0
    }
  },
  created() {
    this.$dataReport(
      'LZ_myGames',
      'LZ_installationSettingsPopupShow',
      'pv',
      {
        detail: JSON.stringify({
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          gameName: this.softName,
          softid: this.softid
        })
      }
    )
    this.getGameDriversEnum()
  },
  computed: {
    userInfo() {
      return getLegacyUserInfo()
    },
    showUsedGameDriversEnum() {
      if (!this.gameDriversEnum.length) {
        return []
      }

      return this.gameDriversEnum.filter(item => item.IsIncluded === 1)
    },
    showGameDriversEnum() {
      if (!this.gameDriversEnum.length) {
        return []
      }

      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return this.gameDriversEnum.sort((a, b) => (a.IsIncluded ? 1 : -1) - (b.IsIncluded ? 1 : -1)).map((item, index) => {
        if (this.activeId === -1) {
          if (index === 0 && item.IsIncluded === 0) {
            this.activeId = item.id
          }
        }
        return item
      })
    }
  },
  methods: {
    filterFreeSpace(val) {
      if (!val) {
        return ''
      }

      return (val / 1024 / 1024 / 1024).toFixed(1) + 'GB'
    },
    getGameDriversEnum() {
      GameDriversEnum().then(res => {
        if (!res || !res.suc || res.suc !== 1 || !res.Drives) {
          return
        }

        this.gameDriversEnum = res.Drives.map((item, index) => ({
          ...item,
          id: `${index}_${item.DriveName}`
        }))

        if (this.gameDriversEnum.some(item => item.IsDefault === 1)) {
          this.IsDefaultId = this.gameDriversEnum.find(item => item.IsDefault === 1).id
        } else {
          this.IsDefaultId = this.gameDriversEnum[0].id
        }
      })
    },
    operate(type) {
      if (type === 3) {
        if (this.showGameDriversEnum.some(item => this.activeId === item.id)) {
          const DriveName = this.showGameDriversEnum.find(item => this.activeId === item.id).DriveName
          GameDriversAdd(DriveName).then(res => {
            if (!res || !res.suc || res.suc !== 1) {
              this.$message({
                message: res.msg,
                type: 'warning',
                duration: 2500,
                customClass: 'lg-message--warning'
              })
              return
            }

            this.gameDriversEnum.map(item => {
              if (this.activeId === item.id) {
                item.IsIncluded = 1
                this.IsDefaultId = item.id
              }
              return item
            })
            this.pageType = 1
          }).catch(() => {})
          return
        }

        this.pageType = 1
        return
      }

      if (type === 2) {
        this.clickTypeReport(1)
        this.pageType = 1
        return
      }

      if (type === 4) {
        if (this.IsDefaultId === -1) {
          this.$message({
            message: '请选择磁盘',
            type: 'warning',
            duration: 2500,
            customClass: 'lg-message--warning'
          })

          return
        }

        const DriveName = this.showUsedGameDriversEnum.find(item => this.IsDefaultId === item.id).DriveName
        GameDriversSwitchDefault(DriveName).then(res => {
          if (!res || !res.suc || res.suc !== 1) {
            this.$message({
              message: res.msg,
              type: 'warning',
              duration: 2500,
              customClass: 'lg-message--warning'
            })

            return
          }

          this.clickTypeReport(2)
          this.$destroy()
          this.$el?.parentNode.removeChild(this.$el)
          this.showTips = -1
          this.resolve(true)
        })

        return
      }

      this.clickTypeReport(3)
      this.$destroy()
      this.$el?.parentNode.removeChild(this.$el)
      this.showTips = -1
      this.reject()
    },
    more(event, item) {
      if (this.showTips === item.id) {
        this.showTips = -1
        return
      }

      this.showTips = item.id

      this.tipLeft = event.target.offsetLeft - 64
      this.tipTop = event.target.offsetTop + 18
    },
    selectUsed(item) {
      this.IsDefaultId = item.id
    },
    selectGameDrivers(item) {
      this.activeId = item.id
    },
    addLocation() {
      this.pageType = 2
      this.activeId = -1
      this.showTips = -1
      this.clickTypeReport(4)
    },
    deleteGame(item) {
      if (this.showUsedGameDriversEnum.length === 1) {
        this.$message({
          message: '至少保留一个磁盘！',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })
        this.showTips = -1
        return
      }

      GameDriversDelete(item.DriveName).then(res => {
        if (!res || !res.suc || res.suc !== 1) {
          this.$message({
            message: res.msg,
            type: 'warning',
            duration: 2500,
            customClass: 'lg-message--warning'
          })
          this.showTips = -1
          return
        }

        item.IsIncluded = 0
        this.showTips = -1
        this.clickTypeReport(6)

        if (this.showUsedGameDriversEnum.length) {
          this.IsDefaultId = this.showUsedGameDriversEnum[0].id
        }
      })
    },
    browseLocal(item) {
      GameOpenFolder({
        'DriveName': item.DriveName
      })

      this.clickTypeReport(5)
    },
    clickTypeReport(clickType) {
      this.$dataReport(
        'LZ_myGames',
        'LZ_installationSettingsPopupClick',
        'click',
        {
          detail: JSON.stringify({
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            gameName: this.softName,
            softid: this.softid,
            clickType: clickType
          })
        }
      )
    }
  }
}
</script>

<style lang="scss" scoped>
  section {
    div.Main {
      position: fixed;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      background-color: rgba(0, 0, 0, 0.5);
      > div {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 600px;
        height: 422px;
        transform: translate(-50%, -50%);
        background: #181c22;
        border: 1px solid rgba(234, 247, 255, 0.1);
        overflow: hidden;
        > header {
          height: 39px;
          > h1 {
            color: rgba(234, 247, 255, 0.6);
            font-weight: normal;
            font-size: 14px;
            height: 30px;
            display: flex;
            align-items: center;
            padding: 14px 12px 0 15px;
            > button {
              background-color: transparent;
              outline: none;
              border: none;
              width: 24px;
              height: 24px;
              background-image: url("./image/close.png");
              background-repeat: no-repeat;
              background-size: 16px 16px;
              background-position: center;
              margin-left: auto;
              cursor: pointer;
            }
          }
        }
        > section {
          > div.add-content {
            width: 100%;
            box-sizing: border-box;
            > div.top {
              padding-bottom: 20px;
              box-sizing: border-box;
              border-bottom: 1px solid rgba(46, 51, 56, 1);
              display: flex;
              align-items: center;
              position: relative;
              margin: 26px 30px 0px 30px;
              > img {
                width: 100px;
                height: 56px;
                object-fit: cover;
                margin-right: 12px;
              }
              > h1 {
                color: #EAF7FF;
                font-size: 14px;
                font-style: normal;
                font-weight: 700;
                line-height: 14px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                max-width: 320px;
              }
              > p {
                color: #EAF7FF;
                font-size: 14px;
                font-style: normal;
                font-weight: 400;
                line-height: 14px;
                position: absolute;
                right: 0;
              }
            }
            > div.bottom {
              overflow-y: scroll;
              overflow-x: hidden;
              height: 174px;
              margin-right: 6px;
              > h1 {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 18px 18px 20px 29px;
                > p {
                  color: #EAF7FF;
                  font-size: 16px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 16px;
                }
                > span {
                  color: #386EFE;
                  text-align: right;
                  font-size: 13px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: normal;
                  cursor: pointer;
                }
              }
              > ul {
                width: 100%;
                margin: 0 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                > li {
                  width: 540px;
                  height: 32px;
                  border: 1px solid rgba(46, 51, 56, 1);
                  margin-bottom: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 0 8px 0 12px;
                  box-sizing: border-box;
                  cursor: pointer;
                  &.isActive {
                    border: 1px solid #386EFE;
                    background: #0E1217;
                    > p,> span {
                      color: rgba(234, 247, 255, .8);
                    }
                  }
                  > p {
                    color: rgba(234, 247, 255, .6);
                    font-size: 14px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: normal;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    max-width: 320px;
                  }
                  > span {
                    color: rgba(234, 247, 255, .6);
                    text-align: right;
                    font-size: 14px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: normal;
                    vertical-align: middle;
                    > i {
                      display: inline-block;
                      width: 20px;
                      height: 16px;
                      background: url('./image/more.png') no-repeat;
                      background-size: 16px 16px;
                      background-position: top center;
                      cursor: pointer;
                      vertical-align: sub;
                      margin-left: 5px;
                    }
                  }
                  > ol {
                    position: fixed;
                    width: 100px;
                    height: 72px;
                    text-align: center;
                    border: 1px solid rgba(234, 247, 255, 0.10);
                    background: #1E242B;
                    box-shadow: 0px 2px 3px -2px #0D0D0D, 0px 4px 8px 0px rgba(13, 13, 13, 0.32), 0px 6px 16px 4px rgba(13, 13, 13, 0.20);
                    > li {
                      width: 92px;
                      height: 30px;
                      color: rgba(234, 247, 255, 0.60);
                      font-size: 12px;
                      font-style: normal;
                      font-weight: 400;
                      line-height: 30px;
                      margin: 3px;
                      &:hover {
                        color: rgba(234, 247, 255, 0.80);
                        background: rgba(57, 64, 77, 0.60);
                      }
                    }
                  }
                }
              }
            }
            > footer {
              width: 100%;
              height: auto;
              text-align: center;
              margin-top: 19px;
              > button {
                cursor: pointer;
                width: 120px;
                height: 36px;
                color: #000;
                text-align: center;
                font-size: 14px;
                font-style: normal;
                font-weight: 700;
                line-height: 22px;
                letter-spacing: 1px;
                border-radius: 0;
                background: linear-gradient(to bottom, rgb(146, 146, 146), rgb(234, 247, 255));
                border: 1px solid;
                border-image: linear-gradient(245deg, #fff, #999) 1;
                &:hover {
                  color: #fff;
                  background: linear-gradient(to left, rgb(125, 125, 125), rgb(40, 40, 40));
                  border: 1px solid;
                  border-image: linear-gradient(245deg, #fff, #999) 1;
                }
                &:active {
                  color: #fff;
                  background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
                }
              }
            }
          }
          > div.list-content {
            > h1 {
              margin: 27px 28px 19px 29px;
              color: rgba(234, 247, 255, 1);
              font-size: 16px;
              font-style: normal;
              font-weight: 300;
              line-height: 16px;
            }
            > ul {
              height: 207px;
              overflow-x: hidden;
              overflow-y: scroll;
              margin-right: 6px;
              padding: 0 15px 0 29px;
              box-sizing: border-box;
              > li {
                width: 540px;
                height: 32px;
                border: 1px solid rgba(46, 51, 56, 1);
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 12px;
                box-sizing: border-box;
                cursor: pointer;
                &.isActive {
                  background: #0E1217;
                  border: 1px solid #386EFE;
                  > p, > span {
                    color: rgba(234, 247, 255, 0.80);
                  }
                }
                &.isUsed {
                  cursor:default;
                  border: 1px solid rgba(46, 51, 56, .5);
                  pointer-events: none;
                  > p, > span {
                    color: rgba(234, 247, 255, 0.40);
                  }
                }
                > p {
                  color: rgba(234, 247, 255, 0.60);
                  font-size: 14px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: normal;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  max-width: 320px;
                }
                > span {
                  color: rgba(234, 247, 255, 0.60);
                  text-align: right;
                  font-size: 14px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: normal;
                }
              }
            }
            > footer {
              width: 100%;
              text-align: center;
              margin-top: 26px;
              > button {
                width: 120px;
                height: 36px;
                cursor: pointer;
              }
              > button:nth-of-type(1) {
                border: 1px solid rgba(255, 255, 255, 0.7);
                color: #EAF7FF;
                text-align: center;
                font-size: 13px;
                font-style: normal;
                font-weight: 700;
                line-height: 22.222px;
                background: none;
              }
              > button:nth-of-type(2) {
                margin-left: 16px;
                color: #000;
                text-align: center;
                font-size: 14px;
                font-style: normal;
                font-weight: 700;
                line-height: 22px;
                letter-spacing: 1px;
                border-radius: 0;
                background: linear-gradient(to bottom, rgb(146, 146, 146), rgb(234, 247, 255));
                border: 1px solid;
                border-image: linear-gradient(245deg, #fff, #999) 1;
                &:hover {
                  color: #fff;
                  background: linear-gradient(to left, rgb(125, 125, 125), rgb(40, 40, 40));
                  border: 1px solid;
                  border-image: linear-gradient(245deg, #fff, #999) 1;
                }
                &:active {
                  color: #fff;
                  background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
                }
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 550px) {
    .Main > div {
      width: calc(100vw - 40px);
    }
    .Main > div ul > li {
      width: auto;
    }
  }
</style>

<style scoped>
.Main .add-content span[role="button"]:focus-visible,
.Main .add-content li:focus-visible,
.Main .add-content i[role="button"]:focus-visible,
.Main .list-content li:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 2px;
}

.Main ol li[role="menuitem"]:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .Main .add-content span[role="button"]:focus-visible,
  .Main .add-content li:focus-visible,
  .Main .add-content i[role="button"]:focus-visible,
  .Main .list-content li:focus-visible,
  .Main ol li[role="menuitem"]:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>

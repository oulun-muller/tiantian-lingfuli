import { concernList } from '@/api/gameCenter'
import common from '../common'

export default {
  name: 'All',
  components: {
    common
  },
  data() {
    return {
      current: 0, // 当前页（从1开始）
      nomore: false,
      fetching: false,
      concernList: [],
      concernListLength: 0,
      scrollTop: 0,
      lastId: ''
    }
  },
  props: {
    firstLocal: {
      type: Number,
      required: true
    },
    secondLocal: {
      type: String,
      required: true
    },
    thirdLocal: {
      type: String,
      required: true
    },
    activeName: {
      type: String,
      required: true
    }
  },
  computed: {
    version() {
      return this.$store.state.system.version
    },
    system() {
      return this.$store.state.system
    },
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  methods: {
    updateData() {
      const {
        current,
        nomore,
        concernList,
        scrollTop,
        concernListLength,
        lastId
      } = JSON.parse(window._GAMECENTER_RESTORE['GameCenterConcern'])

      this.current = current
      this.nomore = nomore
      this.concernList = concernList.filter(item => !item.unFollowMark)
      this.scrollTop = scrollTop
      this.concernListLength = concernListLength
      this.lastId = lastId
      this.$emit('setConcernListLength', this.concernListLength)

      this.$nextTick(() => {
        this.$refs.concernListScroller.scrollTop = this.scrollTop
      })

      this.gameReport(this.concernList)
    },
    storageData() {
      window._GAMECENTER_RESTORE['GameCenterConcern'] = JSON.stringify({
        ...this.$data,
        scrollTop: Math.round(this.$refs.concernListScroller.scrollTop)
      })
    },
    scrollHandleAll(e) {
      this.scrollTop = Math.round(e.target.scrollTop)

      if (!this.nomore && e.target.scrollTop + e.target.offsetHeight + 300 >= e.target.scrollHeight) {
        this.getConcernList(false)
      }
    },
    getConcernList(force) {
      if (this.fetching) return

      if (force) {
        this.lastId = ''
        this.current = 0
        this.nomore = false
        this.concernList = []
      } else if (this.nomore) {
        return
      }

      const params = {
        lowerId: this.lastId,
        current: this.current,
        size: 20
      }

      this.fetching = true
      if (force) {
        this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      }

      concernList(params).then(res => {
        if (force) {
          this.concernListLength = res.total
          this.$emit('setConcernListLength', this.concernListLength)
        }

        this.nomore = res.records.length < res.size
        this.current = res.current
        this.concernList = [...this.concernList, ...res.records]
        const lastItem = res.records[res.records.length - 1] || null
        if (lastItem) {
          this.lastId = lastItem.id
        }
        this.gameReport(res.records)
      }).catch((e) => {
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.fetching = false
        if (force) {
          this.$store.dispatch('pageLoaded', false)
        }
      })
    },
    deleteCurrent(item) {
      this.$emit('deleteCurrent', item)
    },
    toGameCenter() {
      sessionStorage.setItem('GAME_CENTER_SOURCE_RECORD', 3)
      this.$router.push('GameCenter')
    },
    gameReport(data) {
      if (this.activeName === '1') {
        if (data.length) {
          const _cdk = data.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
          const _download = data.filter(o => o.softPurpose === 2).map(o => {
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

            let _firstClassId = 1// 1:游戏，2：工具
            if (Number(o.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
              _firstClassId = 2
            }

            let _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
            if (_firstClassId === 2) {
              _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}_${_firstClassId}`
            }

            return {
              name_download: _name_download
            }
          }).map(o => o.name_download).join(',')

          if (_cdk) {
            this.$dataReport('LZ_gamingCenter', 'LZ_myConcernCDKGameListShow', 'pv', {
              gameList: _cdk,
              showType: 1
            })
          }

          if (_download) {
            this.$dataReport('LZ_gamingCenter', 'LZ_myConcernLoadGameListShow', 'pv', {
              gameList: _download,
              showType: 1
            })
          }
        }
      }
    }
  }
}

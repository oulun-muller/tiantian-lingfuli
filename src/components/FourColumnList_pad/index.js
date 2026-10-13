import resolveAsset from '@/compat/resolveAsset'
import GameDownloadButton from '@/components/GameDownloadButton'
import { reportMinigameOpen, reportMinigameExpose } from '@/utils/dataReport'
import { openMiniGameAndPin, parentExposeMiniGame } from '@/utils/miniGame'
export default {
  name: 'FourColumnList',
  props: {
    cdkList: {
      type: Array,
      required: true
    },
    pageType: {
      type: String,
      required: true
    },
    firstLocal: {
      type: [String, Number],
      required: true
    },
    secondLocal: {
      type: Number,
      require: true
    },
    thirdLocal: {
      required: true
    },
    keyword: {
      type: String,
      default: ''
    },
    selsectLabelList: {
      type: Array,
      default: []
    },
    fromPage: {
      type: String,
      default: ''
    }
  },
  components: {
    GameDownloadButton
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      miniGameDeviceInfo: ''
    }
  },
  async mounted() {
    const _parentGetMiniGameDeviceInfo = await this.$parentGetMiniGameDeviceInfo() || null
    this.miniGameDeviceInfo = _parentGetMiniGameDeviceInfo || {}
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    softLabelsLenght() {
      return (item) => {
        const authTag = item?.downloadInfo?.tagUrls[0] || ''
        if (this.pageType === 'gameHouse') {
          return authTag ? 2 : 3
        }
        return authTag ? 4 : 5
      }
    },
    drinfo() {
      return (item, index) => {
        let _reportPlateName = ''
        if (this.pageType === 'search') {
          _reportPlateName = `${this.keyword}_${index + 1}`
        } else {
          _reportPlateName = this.selsectLabelList.join(',')
        }

        const params = {
          source_p: this.$route.query.source_p || '',
          source: this.pageType === 'gameHouse' ? 'PAD5' : (this.pageType === 'search' ? 'PAD9' : ''),
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: _reportPlateName,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        }

        let _gameClass = 1 // 1游戏，2工具
        if (item.softPurpose === 3) {
          _gameClass = item.softPurpose
        }

        if (Number(item.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          _gameClass = 2
        }

        if (_gameClass === 2 || _gameClass === 3) {
          params.gameClass = _gameClass
        }

        return JSON.stringify(params)
      }
    }
  },
  methods: {
    getSoftLabels(item) {
      const labels = item.showInfo?.hlSoftLabels.length ? item.showInfo.hlSoftLabels : item.showInfo.softLabels
      return labels.slice(0, this.softLabelsLenght(item))
    },
    toDetail(item, index) {
      if (item.softPurpose === 4) {
        reportMinigameOpen({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: 3,
          plateName: `${this.keyword}_搜索结果`,
          skuName: item.softName,
          softID: item.softId,
          softType: item?.softDesc?.isAd ? '广告' : '非广告', // 广告和非广告
          type: 2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          position: index + 1,
          source_id: item.softDesc?.runConfigInfo?.resourcePos,
          alg_rid: item.softDesc?.runConfigInfo?.rid
        })
        openMiniGameAndPin(item, index)

        return
      }
      let _reportPlateName = ''
      if (this.pageType === 'search') {
        _reportPlateName = `${this.keyword}_${index + 1}`
      } else {
        _reportPlateName = this.selsectLabelList.join(',')
      }

      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_p: this.pageType === 'gameHouse' ? 'PAD5' : (this.pageType === 'search' ? 'PAD9' : ''),
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: _reportPlateName
        }
      })
    },
    showPay(item, index) {
      if (!this.userInfo) {
        this.$login()
        return
      }

      let _reportPlateName = ''
      if (this.pageType === 'search') {
        _reportPlateName = `${this.keyword}_${index + 1}`
      } else {
        _reportPlateName = this.selsectLabelList.join(',')
      }

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: _reportPlateName,
          skuName: item.softName || '',
          softID: item.softId || '',
          gameVersion: item.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: item.skuId,
        price: item.productInfo.currentPrice,
        plateName: _reportPlateName,
        gameVersion: item.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    onExposure(item, exposureType, childIndex) {
      const reportFrom = this.$route.query.reportFrom || ''
      parentExposeMiniGame(item, childIndex, exposureType, '1') // 1: 搜索列表
      if (item.softPurpose === 4) {
        reportMinigameExpose(item, childIndex, exposureType + 2, {
          moduleName: `${this.keyword}`,
          from: reportFrom ? 3 : 1,
          type: 2
        })
      }
    }
  }
}

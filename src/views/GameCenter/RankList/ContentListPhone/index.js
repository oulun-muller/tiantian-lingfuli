import resolveAsset from '@/compat/resolveAsset'
import GameDownloadButton from '@/components/GameDownloadButton'

export default {
  name: 'FourColumnList',
  props: {
    dataList: {
      type: Array,
      required: true
    },
    rankType: {
      type: Number,
      default: -1
    },
    curTab: {
      type: Number
    },
    firstLocal: {
      type: Number,
      required: true
    }
  },
  components: {
    GameDownloadButton
  },
  data() {
    return {
      defaultImg: new URL('../../../../images/gamecenter/searchDefault.png', import.meta.url).href,
      thirdLocal: ''
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 2
    },
    softLabelsLenght() {
      if (this.$isPadDevice) {
        return 2
      } else if (this.pageType === 'gameHouse') {
        return 3
      }

      return 5
    },
    drinfo() {
      const _curTab = {
        5: '火爆',
        6: '时长',
        7: '飙升',
        8: '小时',
        19: '预约'
      }[this.rankType]

      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD6',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: _curTab,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    }
  },
  methods: {
    getImgUrl(item) {
      return item?.softInfo?.showInfo?.himg || item.himg
    },
    getGameName(item) {
      return item?.softInfo?.softName || item.gameName
    },
    getPlayNumHtml(item) {
      switch (this.curTab) {
        case 5:
        case 8:
          return `${item.datas}人在玩`
        case 6:
          return `总计${item.datas}小时`
        case 7:
          return `涨幅${item.datas}%`
        case 19:
          return `${item.datas}人预约`
      }
    },
    toDetail(softInfo) {
      if (!softInfo) return

      const _curTab = {
        5: '火爆',
        6: '时长',
        7: '飙升',
        8: '小时',
        19: '预约'
      }[this.rankType]

      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: softInfo.softId },
        query: {
          source_p: 'PAD6',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: _curTab
        }
      })
    },
    showPay(softInfo) {
      if (!this.userInfo) {
        // this.$login()
        return
      }

      const _curTab = {
        5: '火爆',
        6: '时长',
        7: '飙升',
        8: '小时',
        19: '预约'
      }[this.rankType]

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: _curTab,
          skuName: softInfo.softName || '',
          softID: softInfo.softId || '',
          gameVersion: softInfo.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: softInfo.skuId,
        price: softInfo.productInfo.currentPrice,
        plateName: _curTab,
        gameVersion: softInfo.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: softInfo.softName || '',
        softID: softInfo.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    }
  }
}

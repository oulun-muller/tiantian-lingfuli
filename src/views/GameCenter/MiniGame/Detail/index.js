import {
  getMiniGamedetailData,
  getMiniGameLikes
} from '@/api/miniGameDetail'

import { reportMinigameOpen, reportMinigameExpose } from '@/utils/dataReport'
import { openMiniGameAndPin, parentExposeMiniGame } from '@/utils/miniGame'

export default {
  name: 'Detail',
  components: {},
  data() {
    return {
      ready: false,
      miniGamedetailData: null,
      likeList: null,
      currentVideo: -1,
      id: this.$route.params.id || '',
      pkgName: this.$route.query.pkgName || ''
    }
  },
  watch: {
    '$route.query.t': {
      handler() {
        this.refreshPage()
      }
    }
  },
  mounted() {
    this.$emit('headerStatus', false)
    this.init()
  },
  computed: {
    firstLocal() {
      if (this.$route.query.source === 'desktop') {
        return 12
      }
    },
    secondLocal() {
      return 14
    },
    thirdLocal() {
      return ''
    },
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  methods: {
    refreshPage() {
      this.init()
    },
    async init() {
      this.$parentLoading(true)
      let _miniGameDeviceInfo = null
      const _parentGetMiniGameDeviceInfo = await this.$parentGetMiniGameDeviceInfo() || null
      if (_parentGetMiniGameDeviceInfo) {
        _miniGameDeviceInfo = _parentGetMiniGameDeviceInfo
      }

      if (_miniGameDeviceInfo) {
        this.miniGamedetailData = await getMiniGamedetailData({
          gameId: this.id,
          pkgName: this.pkgName,
          qone32: _miniGameDeviceInfo.qone32 || '',
          qone40: _miniGameDeviceInfo.qone40 || ''
        })
      }
      if (this.miniGamedetailData) {
        this.miniGameDetailShowReport()

        this.likeList = await getMiniGameLikes({
          limit: 5,
          qone32: _miniGameDeviceInfo.qone32 || '',
          qone40: _miniGameDeviceInfo.qone40 || ''
        })
      }

      this.ready = true
      this.$parentLoading(false)

      if (this.miniGamedetailData) {
        this.openMiniGame(this.miniGamedetailData, 1)
      }
    },
    openMiniGame(item, type) {
      reportMinigameOpen({
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        plateName: type === 2 ? `其他游戏` : '',
        skuName: item.softName,
        softID: item.softId,
        softType: item?.softDesc?.isAd ? '广告' : '非广告', // 广告和非广告
        type: 1,
        lenovoid: this.userInfo ? this.userInfo.UserID : '',
        source_id: item.softDesc?.runConfigInfo?.resourcePos,
        alg_rid: item.softDesc?.runConfigInfo?.rid

      })
      openMiniGameAndPin(item, 0)
    },
    handleCurrentVideo(item) {
      this.currentVideo = item.softId
    },
    onExposure(item, exposureType, index, moduleName = '') {
      parentExposeMiniGame(item, index, exposureType, '4') // 4: 详情
      reportMinigameExpose(item, index, exposureType, {
        moduleName: moduleName,
        firstLocal: this.firstLocal
      })
    },
    miniGameDetailShowReport() {
      this.$dataReport('LZ_minigames', 'LZ_miniGameDetailShow', 'pv', {
        detail: JSON.stringify({
          skuName: this.miniGamedetailData.softName,
          softID: this.miniGamedetailData.softId,
          softType: this.miniGamedetailData.softDesc.isAd ? '广告' : '非广告', // 广告/非广告
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })
    },
    back() {
      if (this.$route.query.source === 'desktop') {
        this.$router.replace({ name: 'MiniGame', query: { firstLocal: '12', isActiveTab: 'sidebarMiniGame' }})
        return
      }

      this.$router.go(-1)
    }
  }
}

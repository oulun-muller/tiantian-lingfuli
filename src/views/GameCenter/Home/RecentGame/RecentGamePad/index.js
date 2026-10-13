import GameItem from '../GameItem'
import { navigatorMyGame } from '@/nativeApiPad/common'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'

export default {
  name: 'RecentGamePad',
  data() {
    return {
      isLoading: true,
      loadingItems: Array(4).fill(null),
      ready: false
    }
  },
  computed: {
    hasNotData() {
      return !this.recentGames.length && this.ready
    }
  },
  components: {
    GameItem
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    },
    recentGames: {
      type: Array,
      default: []
    }
  },
  mounted() {
    console.log(this.recentGames, 'RecentGamePad mounted')
  },
  methods: {
    navigatorMyGame() {
      navigatorMyGame()
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({ plateName: '最近玩过的游戏', local: 1, lenovoid: getLegacyLenovoId() })
      })
    }
  }
}

<template>
  <div class="gamecenter gamecenter-reset">
    <PadHeader v-if="$isPadDevice && showHeader" />
    <Header v-else-if="showHeader" :scroll-top="scrollTop" />
    <RouterView v-slot="{ Component }">
      <keep-alive :include="['Home','GameCenterIndex']">
        <component
          :is="Component"
          @scrollTop="scrollTopHandler"
          @headerStatus="headerStatus"
        />
      </keep-alive>
    </RouterView>
  </div>
</template>

<script>
import Header from './common/Header'
import PadHeader from '@/views/GameCenter/common/PadGameNavbar'
export default {
  name: 'Container',
  components: {
    Header,
    PadHeader
  },
  data() {
    return {
      scrollTop: 0,
      showHeader: false,
      showDialog: true
    }
  },
  computed: {
  },
  methods: {
    headerStatus(status) {
      this.showHeader = status
    },
    scrollTopHandler(num) {
      this.scrollTop = num
    }
  },
  created() {
    if (this.$route.query.isTray) {
      sessionStorage.setItem('GAME_CENTER_SOURCE_RECORD', 3)
    }
  },
  beforeUnmount() {
    sessionStorage.removeItem('SEARCH_HOT_WORDS')
  }
}
</script>
<style lang="scss" scoped>
.gamecenter {
  position: relative;
  top: -48px;
  left: 0;
  width: 100%;
  height: 100vh;
  &.gamecenter-reset {
    top: 0px;
  }
}
.PadDevice.Channel_LegionZone {
  .gamecenter {
    top:0px
  }
}
.PhoneDevice.Channel_LegionZone {
  .gamecenter {
    top:0px;
    background-color: #000;
  }
}

</style>
<style lang="scss">
@media (forced-colors: active) {
  .PcDevice .gamecenter {
    background: Canvas;
    color: CanvasText;
    forced-color-adjust: auto;
  }

  .PcDevice .gamecenter .GameCenterIndex,
  .PcDevice .gamecenter .gamecenter-home,
  .PcDevice .gamecenter .card,
  .PcDevice .gamecenter .panel,
  .PcDevice .gamecenter .tile,
  .PcDevice .gamecenter .item,
  .PcDevice .gamecenter .list,
  .PcDevice .gamecenter .content,
  .PcDevice .gamecenter .wrapper,
  .PcDevice .gamecenter .container,
  .PcDevice .gamecenter section,
  .PcDevice .gamecenter article,
  .PcDevice .gamecenter li {
    background: Canvas;
    border-color: ButtonText;
    color: CanvasText;
    forced-color-adjust: auto;
  }

  .PcDevice .gamecenter button,
  .PcDevice .gamecenter [role="button"],
  .PcDevice .gamecenter .btn,
  .PcDevice .gamecenter .button,
  .PcDevice .gamecenter .close,
  .PcDevice .gamecenter .back,
  .PcDevice .gamecenter .more,
  .PcDevice .gamecenter .prev,
  .PcDevice .gamecenter .next,
  .PcDevice .gamecenter .arrow,
  .PcDevice .gamecenter .search-icon,
  .PcDevice .gamecenter .tab,
  .PcDevice .gamecenter .tab-item {
    background: ButtonFace;
    color: ButtonText;
    forced-color-adjust: auto;
  }

  .PcDevice .gamecenter input,
  .PcDevice .gamecenter textarea,
  .PcDevice .gamecenter select {
    background: Canvas;
    border: 1px solid ButtonText;
    color: CanvasText;
    forced-color-adjust: auto;
  }

  .PcDevice .gamecenter input::placeholder,
  .PcDevice .gamecenter textarea::placeholder,
  .PcDevice .gamecenter .empty,
  .PcDevice .gamecenter .nothing,
  .PcDevice .gamecenter .placeholder,
  .PcDevice .gamecenter .loading,
  .PcDevice .gamecenter .disabled,
  .PcDevice .gamecenter .is-disabled,
  .PcDevice .gamecenter [disabled],
  .PcDevice .gamecenter [aria-disabled="true"] {
    color: GrayText;
    border-color: GrayText;
  }

  .PcDevice .gamecenter .active,
  .PcDevice .gamecenter .selected,
  .PcDevice .gamecenter .is-active,
  .PcDevice .gamecenter .is-selected,
  .PcDevice .gamecenter [aria-selected="true"] {
    background: Highlight;
    border-color: Highlight;
    color: HighlightText;
  }

  .PcDevice .gamecenter a {
    color: LinkText;
  }

  .PcDevice .gamecenter button:focus-visible,
  .PcDevice .gamecenter a:focus-visible,
  .PcDevice .gamecenter input:focus-visible,
  .PcDevice .gamecenter textarea:focus-visible,
  .PcDevice .gamecenter select:focus-visible,
  .PcDevice .gamecenter [role="button"]:focus-visible,
  .PcDevice .gamecenter [tabindex]:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>

<!-- <template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style> -->
<template>
  <div v-if="$isPhoneDevice !== undefined || $isPadDevice !== undefined">
    <GameLibraryPhone v-if="$isPhoneDevice" @headerStatus="headerStatus" />
    <GameLibraryPad v-else-if="$isPadDevice" @headerStatus="headerStatus"/>
    <GameLibraryPc v-else @headerStatus="headerStatus"/>
  </div>
</template>

<script>
import GameLibraryPad from './GameLibraryPad'
import GameLibraryPhone from './GameLibraryPhone'
import GameLibraryPc from './GameLibraryPc'
export default {
  name: 'GameLibrary',
  components: {
    GameLibraryPad,
    GameLibraryPhone,
    GameLibraryPc
  },
  props: {},
  mounted() {
  },
  data() {
    return {
    }
  },
  methods: {
    headerStatus(val) {
      this.$emit('headerStatus', val)
    }
  }
}
</script>

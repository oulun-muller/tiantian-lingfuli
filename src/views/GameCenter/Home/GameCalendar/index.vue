<template>
  <div>
    <GameCalendarPad v-if="$isPadDevice" :module-data="moduleData"/>
    <GameCalendarPc v-else :module-data="moduleData"/>
  </div>
</template>

<script>
import GameCalendarPad from './GameCalendarPad/index.vue'
import GameCalendarPc from './GameCalendarPc/index.vue'
export default {
  name: 'GameCalendar',
  components: {
    GameCalendarPad,
    GameCalendarPc
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  }
}
</script>

<style scoped lang="scss">
</style>

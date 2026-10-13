<template>
  <section class="rank-list">
    <IndexPAD v-if="$isPadDevice" @headerStatus="headerStatus"/>
    <IndexPC v-else @headerStatus="headerStatus"/>
  </section>
</template>
<script>
import IndexPAD from './indexPAD.vue'
import IndexPC from './indexPC.vue'
export default {
  name: 'RankList',
  components: {
    IndexPAD,
    IndexPC
  },
  methods: {
    headerStatus(value) {
      this.$emit('headerStatus', value)
    }
  }
}
</script>

<style scoped lang="scss">
</style>

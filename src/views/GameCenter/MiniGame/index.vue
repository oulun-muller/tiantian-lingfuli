<template>
  <router-view @headerStatus="headerStatus" />
</template>
<script>
export default {
  methods: {
    headerStatus(status) {
      this.$emit('headerStatus', false)
    }
  }
}
</script>

<style scoped lang="scss">
</style>

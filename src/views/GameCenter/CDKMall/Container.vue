<template>
  <RouterView v-slot="{ Component }">
    <keep-alive include="Home">
      <component :is="Component" />
    </keep-alive>
  </RouterView>
</template>

<script>
export default {
  name: 'Container'
}
</script>

<style scoped lang="scss">
</style>

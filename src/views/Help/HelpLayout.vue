<template><div><router-view /><HelpToast /><HelpImagePreview /></div></template>
<script>
import HelpToast from './components/HelpToast.vue'
import HelpImagePreview from './components/HelpImagePreview.vue'
export default { name: 'HelpLayout', components: { HelpToast, HelpImagePreview } }
</script>
<style lang="scss">@import './styles/help.scss';</style>

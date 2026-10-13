<template>
  <div class="phase-placeholder">
    <p>该页面尚未纳入首期迁移范围</p>
    <button type="button" class="back-btn" @click="goHome">返回首页</button>
  </div>
</template>

<script>
export default {
  name: 'PhasePlaceholder',
  methods: {
    goHome() {
      this.$router.replace({ name: 'GameCenterHome' })
    }
  }
}
</script>

<style scoped lang="scss">
.phase-placeholder {
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #cfd3dc;
  gap: 16px;
}
.back-btn {
  border: 1px solid #4c5566;
  background: #1f2430;
  color: #fff;
  border-radius: 8px;
  padding: 8px 16px;
}
</style>

<template>
  <transition name="el-fade-in">
    <div :class="{'page-loading-alpha':alpha===0,'page-loading-fullscreen':fullScreen===true,'page-loading-Drawer':Drawer===true}" class="page-loading" role="status" aria-label="加载中" />
  </transition>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'Index',
  computed: {
    ...mapState({
      alpha: state => state.pageLoading.alpha,
      fullScreen: state => state.pageLoading.fullScreen,
      Drawer: state => state.pageLoading.Drawer
    })
  }
}
</script>

<style lang="scss" scoped>
  .page-loading{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 20;
    background: linear-gradient(180deg, #151A22 0%, #1A1E24 38%, #131519 75%, #121419 100%);
    &:before{
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%,-50%);
      content: "";
      width: 90px;
      height: 90px;
      background: url("~@/images/loading.png") no-repeat;
      -webkit-background-size: cover;
      background-size: cover;
    }
  }
  // 背景透明
  .page-loading-alpha{
    background: rgba(0,0,0,0);
  }
  // 是否全屏显示，为了让loading iocn 居中显示
  .page-loading-fullscreen{
    position:fixed;
    z-index: 3000;
  }
  //为了让loading icon 在抽屉 居中显示
  .page-loading-Drawer{
     &:before {
      left: auto;
      right: 340px;
      transform: translate(50%, -50%);
    }
  }

</style>

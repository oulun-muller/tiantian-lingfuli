<template>
  <div class="Offline">
    <header
      draggable
      @dragstart.prevent="$startDrag"
      @dblclick.self="$toggleMaximize"></header>
    <section>
      <img src="./offline.png" alt="">
      <p>您的网络飘到了外太空，请尝试<button @click="update">点击刷新</button></p>
    </section>
  </div>
</template>

<script>

export default {
  name: 'Offline',
  methods: {
    update() {
      this.$emit('update')
    }
  }
}
</script>

<style lang="scss" scoped>
  div.Offline {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    > header {
      height: 68px;
    }
    > section {
      height: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      > img {
        display: block;
        width: 88px;
        height: 88px;
        margin-top: -186px;
      }
      > p {
        margin-top: 10px;
        height: 28px;
        line-height: 28px;
        font-size: 1.32vw;
        color: rgba(234, 247, 255, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        > button {
          margin-left: 4px;
          height: 28px;
          background-color: transparent;
          border: none;
          color: #386EFE;
          cursor: pointer;
          &:focus-visible {
            outline: 2px solid #4fc3f7;
            outline-offset: 2px;
          }
          &:hover {
            color: #5390FE;
          }
        }
      }
    }
  }

</style>

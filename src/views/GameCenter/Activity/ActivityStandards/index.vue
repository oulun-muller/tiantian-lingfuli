<template>
  <section class="ActivityStandards">
    <h1 class="title"><span>活动规则</span></h1>
    <div class="phone_activity_riles">
      <p>活动规则</p>
    </div>
    <div class="container" v-html="baseInfo.rule" />
  </section>
</template>
<script>
export default {
  props: {
    baseInfo: {
      default: null,
      type: Object
    }
  }
}
</script>
<style lang="scss" scoped>
.phone_activity_riles{
  display: none;
}
.ActivityStandards {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 60px 103px 60px;
  h1.title {
    margin-top: 63px;
    position: relative;
    text-align: center;
    span {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 2px;
      background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    &::before {
      content: '';
      position: absolute;
      top: -32px;
      background: transparent url('~@/images/Index/activity-rules.png') no-repeat center center/ contain;
      width: 253px;
      height: 50px;
      left: 50%;
      transform: translate(-47%, 0);
    }
  }
  .container {
    margin-top: 20px;
    white-space: pre-wrap;
    color: #EAF7FF;
    font-size: 12px;
    font-weight: 400;
    line-height: 22px;
  }
}

@media screen and (max-width: 800px) {
  .ActivityStandards h1.title {
    margin-top: 60px;
  }
}
</style>
<style lang="scss" scoped src="./phone.scss">

</style>

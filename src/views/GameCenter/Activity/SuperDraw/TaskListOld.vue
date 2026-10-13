<template>
  <dl class="task-list">
    <dt class="title">完成任务获取抽奖次数</dt>
    <section class="task-wrap">
      <TaskItemOld
        v-for="(item, index) in prizeDraw.taskInfo"
        :key="index"
        :item="item"
        :prize-draw="prizeDraw"
        :first-local="String(firstLocal)"
        :second-local="String(secondLocal)"
        :third-local="String(thirdLocal)"
        :plate-name-report="plateNameReport"
        :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish"
        @scroll-to-purchase="$emit('scroll-to-purchase', $event)"
        @toLenovoLogin="$emit('toLenovoLogin')"
        @updateTaskStatus="$emit('updateTaskStatus', $event, index)"
        @showOpenAppDialog="status => $emit('showOpenAppDialog', status)"
        @updateDrawCount="num => $emit('updateDrawCount', num)"
        @refreshPage="$emit('refreshPage')"/>
    </section>
  </dl>
</template>
<script>
import TaskItemOld from './TaskItemOld.vue'
export default {
  name: 'TaskListOld',
  components: { TaskItemOld },
  props: {
    prizeDraw: { type: Object, default: null },
    scrollToPurchaseOnFinish: { type: Boolean, default: false },
    firstLocal: { default: '', type: String },
    secondLocal: { default: '', type: String },
    thirdLocal: { default: '', type: String },
    plateNameReport: { default: '', type: String }
  }
}
</script>
<style lang="scss" scoped>
.task-list {
  flex: auto;
  border: 0.5px solid rgba(255, 255, 255, 0.40);
  padding: 18px 0 0 15px;
  background: rgba(59, 58, 58, 0.30) url('~@/images/Index/task-bac.png') no-repeat center bottom / contain;
  .title {
    background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 22px;
    font-weight: 700;
    line-height: 40px;
    text-align: center;
  }
  .task-wrap {
    max-height: 356px;
    overflow-y: scroll;
    padding-right: 15px;
    &::-webkit-scrollbar-thumb {
      cursor: pointer;
      border-radius: 5px;
      background-color: rgba(80, 91, 110, 0.25);
      &:hover {
        background-color: rgba(80, 91, 110, 0.6);
      }
    }
  }
}

</style>

import Main from './Main/index.vue'
import { mountServiceComponent } from '@/compat/mountService'

export default function MediaPlay(mediaList = [], mediaIndex = 0, onClose = () => {}) {
  mountServiceComponent(Main, { mediaList, mediaIndex, onClose })
}

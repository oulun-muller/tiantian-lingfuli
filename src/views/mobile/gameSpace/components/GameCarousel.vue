<template>
  <div :class="`game-snap-carousel${$isHandHeldDevice ? ' handHeldDevice' : ''}${$isXunyouEnabled ? ' is-xunyou' : ''}${$isPadDevice ? ' is-pad-device' : ''}`">
    <!-- 顶部大图区域 -->
    <div class="top-banner">
      <div class="long-light-container">
        <div class="long-light-top"></div>
        <div class="long-light-bottom"></div>
      </div>

      <div class="swiper-box" v-if="gameList.length > 0" ref="swiperBox">
        <div class="swiper-list" ref="swiperList">
          <!-- 循环渲染游戏卡片 -->
          <div
            class="swiper-item"
            :class="getItemClass(index)"
            v-for="(item, index) in gameList"
            :key="item.appName"
            @click="toDetail(item,index)"
          >
            <!-- 竖屏样式 -->
            <div class="banner-item portrait">
              <div class="border-box"></div>
              <div
                class="banner-placeholder"
                :style="{ backgroundImage: `url(${computedImgSrc(item, true)})` }"
              >
                <div class="banner-info" v-show="index === currentIndex">
                  <div class="banner-info-box">
                    <div class="banner-name">{{ item.appName }}</div>
                    <!-- 加速中：在设计稿「游戏时长」的位置换成加速信息面板 -->
                    <div v-if="$isXunyouEnabled && isAccelerating(item)" class="accel-info portrait" @click.stop="handleAccelInfoOpen(item)">
                      <span class="accel-info__item">{{ accelDelayText }}ms</span>
                      <i class="accel-info__divider"></i>
                      <span class="accel-info__item">丢包{{ accelLossText }}%</span>
                      <i class="accel-info__divider"></i>
                      <span class="accel-info__item">{{ accelDurationText }}</span>
                      <i class="accel-info__divider"></i>
                      <!-- 区服：与详情页顶部区服按钮共用 handleAccelServerClick（滚轮 + 二次确认）。
                           原来这里是内联下拉，已按用户要求删除，两个入口统一走同一套弹窗，别再各写一份。
                           埋点上两者不共用：卡片这个入口要报 #21（clickType=switchServer），
                           详情页里那个不是卡片上的按钮、不报 #21，所以这里包一层 handleCardServerClick。 -->
                      <span class="accel-info__area" @click.stop="handleCardServerClick(item)">
                        <span class="accel-info__area-text">{{ accelAreaText }}</span>
                        <!-- 12×12 实心小三角（设计稿 234:5453 里的 Down-one），与加速详情页
                             acceleratorInfo/image/dropdown-arrow.svg 是同一枚图标，只是尺寸不同。
                             可切换区服 ≤1 个时没有真正的选择，不展示箭头 -->
                        <svg v-if="showAccelAreaArrow" class="accel-info__area-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M9 4.75012L6 7.75012L3 4.75012H9Z" fill="#3887ff" stroke="#3887ff" stroke-linejoin="round" />
                        </svg>
                      </span>
                      <!-- 四角角标（设计稿 234:5794/5796/5798/5799），左右两枚靠翻转复用 -->
                      <i class="accel-info__corner is-tl"></i>
                      <i class="accel-info__corner is-tr"></i>
                      <i class="accel-info__corner is-bl"></i>
                      <i class="accel-info__corner is-br"></i>
                    </div>
                    <div v-else class="time-box">
                      <div class="time-style-labbel"></div>
                      <span class="time-label">游戏时长</span>
                      <span class="time-value">
                        <span>{{ computedHour(item.sumSeconds).value }}{{ computedHour(item.sumSeconds).label }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="game-button">
                    <GameDownloadButton
                      v-if="item.softId || item.isInstall"
                      :style="{ '--lz-progress': downloadProgress(item) }"
                      :text="'立即启动'"
                      button-style="abnormal"
                      :download-info="item.downloadInfo"
                      :soft-desc="item.softDesc"
                      :soft-id="item.softId"
                      :soft-purpose="item.softPurpose"
                      :product-info="item.productInfo"
                      :user-purchased-status="0"
                      :version="item.softDesc.version"
                      :soft-name="item.softName"
                      :logo-file="item.showInfo.logoFile"
                      :fast-install="false"
                      :drinfo="drinfo(item, index, true, 0)"
                      sku-id=""
                    />
                    <!-- 迅游加速启动：仅迅游 SDK 支持加速的游戏显示（安卓侧 supportAccel 回填；未登录点击拉起原生登录、已登录无权益进套餐页），加速成功后自动拉起游戏 -->
                    <span
                      v-if="item.supportAccel && $isXunyouEnabled"
                      :class="['accel-btn', { 'is-accelerating': isAccelerating(item) }]"
                      @click.stop="handleAccelStart(item)"
                    >
                      <i class="accel-btn-icon"></i>
                      <span class="accel-btn-text">{{ isAccelerating(item) ? '加速中' : '加速启动' }}</span>
                      <!-- 下拉箭头：仅竖屏用（横屏的箭头已含在底形素材里），纯视觉不接交互 -->
                      <svg v-if="isAccelerating(item)" class="accel-btn-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3.25 5.42L6.75 8.92L10.25 5.42" stroke="#6BA3FF" stroke-width="1.16667" stroke-linecap="square" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 横屏样式 -->
            <div class="banner-item landscape">
              <div class="left-container">
                <div class="border-box-horizontal"></div>
                <div
                  class="banner-placeholder"
                  :style="{ backgroundImage: `url(${computedImgSrc(item, false)})` }"
                >
                  <div class="banner-info" v-show="index === currentIndex">
                    <div class="banner-info-box">
                      <div class="banner-name">{{ item.appName }}</div>
                    </div>
                    <div class="game-button-wrap">
                      <GameDownloadButton
                        v-if="item.softId || item.isInstall"
                        :style="{ '--lz-progress': downloadProgress(item) }"
                        :text="'立即启动'"
                        button-style="abnormal"
                        :download-info="item.downloadInfo"
                        :soft-desc="item.softDesc"
                        :soft-id="item.softId"
                        :soft-purpose="item.softPurpose"
                        :product-info="item.productInfo"
                        :user-purchased-status="0"
                        :version="item.softDesc.version"
                        :soft-name="item.softName"
                        :logo-file="item.showInfo.logoFile"
                        :fast-install="false"
                        :drinfo="drinfo(item, index, true, 0)"
                        sku-id=""
                      />
                      <!-- 迅游加速启动：仅迅游 SDK 支持加速的游戏显示（安卓侧 supportAccel 回填；未登录点击拉起原生登录、已登录无权益进套餐页），加速成功后自动拉起游戏 -->
                      <span
                        v-if="item.supportAccel && $isXunyouEnabled"
                        :class="['accel-btn', { 'is-accelerating': isAccelerating(item) }]"
                        @click.stop="handleAccelStart(item)"
                      >
                        <i class="accel-btn-icon"></i>
                        <span class="accel-btn-text">{{ isAccelerating(item) ? '加速中' : '加速启动' }}</span>
                        <!-- 下拉箭头：仅竖屏用（横屏的箭头已含在底形素材里），纯视觉不接交互 -->
                        <svg v-if="isAccelerating(item)" class="accel-btn-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3.25 5.42L6.75 8.92L10.25 5.42" stroke="#6BA3FF" stroke-width="1.16667" stroke-linecap="square" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="right-container" :class="{ 'is-accel': $isXunyouEnabled && isAccelerating(item) }" v-if="index === currentIndex">
                <!-- 加速中：菱形内换成加速信息面板（按设计稿去掉「我的数据」标题，只留四项） -->
                <div v-if="$isXunyouEnabled && isAccelerating(item)" class="accel-info landscape" @click.stop="handleAccelInfoOpen(item)">
                  <span class="accel-info__item">{{ accelDelayText }}ms</span>
                  <i class="accel-info__divider"></i>
                  <span class="accel-info__item">丢包{{ accelLossText }}%</span>
                  <i class="accel-info__divider"></i>
                  <span class="accel-info__item">{{ accelDurationText }}</span>
                  <i class="accel-info__divider"></i>
                  <!-- 区服：同竖屏，与详情页顶部区服按钮共用 handleAccelServerClick（滚轮 + 二次确认），
                       埋点上的区别同上：卡片入口走 handleCardServerClick 报 #21 -->
                  <span class="accel-info__area" @click.stop="handleCardServerClick(item)">
                    <span class="accel-info__area-text">{{ accelAreaText }}</span>
                    <!-- 16×16 实心小三角（设计稿 300:15529 里的 Down-one），与加速详情页
                         acceleratorInfo/image/dropdown-arrow.svg 逐字节同形。
                         可切换区服 ≤1 个时没有真正的选择，不展示箭头 -->
                    <svg v-if="showAccelAreaArrow" class="accel-info__area-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M12 6.33333L8 10.3333L4 6.33333H12Z" fill="#3887ff" stroke="#3887ff" stroke-width="1.33333" stroke-linejoin="round" />
                    </svg>
                  </span>
                </div>
                <template v-else>
                  <div class="game-info">我的数据</div>
                  <div class="game-time">
                    <span>{{ computedHour(item.sumSeconds).value }}</span>
                    <span>{{ computedHour(item.sumSeconds).label }}</span>
                  </div>
                  <div class="game-label">游戏时长</div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无游戏状态 -->
      <template v-else>
        <div class="no-game">
          <div class="no-game-content portrait">
            <div class="banner-placeholder no-game-placeholder">
              <img class="no-game-icon" src="../image/no-game-icon.svg" alt="" />
              <div style="font-size: 18px; margin-top: 20px;">当前暂无本机游戏</div>
              <div style="display: flex;justify-content: center;align-items: center;margin-top: 10px;" @click="toDownload">
                <span style="margin-right: 6px; color: #2E79FF; font-size: 16px;">去下载游戏</span>
                <img class="no-game-icon2" src="../image/left-arrow.svg" alt="" />
              </div>
            </div>
          </div>
          <div class="no-game-content landscape">
            <div class="banner-item">
              <div class="left-container">
                <div class="border-box-horizontal"></div>
                <div class=" no-game-placeholder-h">
                  <img style="width: 100px; height: 100px; margin-top: 40px;" src="../image/no-game-icon.svg" alt="" />
                  <div style="font-size: 22px; margin-top: 20px;">当前暂无本机游戏</div>
                  <div style="display: flex;justify-content: center;align-items: center;margin-top: 10px;" @click="toDownload">
                    <span style="margin-right: 6px; color: #2E79FF; font-size: 16px;">去下载游戏</span>
                    <img class="no-game-icon2" src="../image/left-arrow.svg" alt="" />
                  </div>
                </div>
              </div>
              <div class="right-container">
                <div style="margin-bottom: 8px;">我的数据</div>
                <div class="game-label">暂无游戏数据</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部吸附列表 -->
    <div class="snap-list" v-if="gameList.length > 0">
      <div class="snap-list-container" ref="snapContainer">
        <div class="snap-list-wrapper" ref="snapWrapper">
          <div
            v-for="(item, index) in gameList"
            :key="item.softId"
            class="snap-item"
            :style="{ backgroundImage: `url(${item.iconUrl})` }"
            :class="{ active: index === currentIndex }"
            @click="handleItemClick(index)"
          ></div>
        </div>
      </div>
    </div>

    <!-- SVG 裁剪路径 -->
    <svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="customClip">
        <path d="M101.827 1.12109H654.2C657.26 1.12109 659.489 3.99835 658.728 6.94238L581.019 307.312C580.799 308.162 580.342 308.934 579.7 309.537L562.304 325.891C561.436 326.706 560.289 327.16 559.096 327.16H17.5264C15.9815 327.16 14.5369 326.4 13.666 325.131L7.85742 316.666L7.82129 316.613L7.7793 316.564L2.2627 310.219C1.24508 309.048 0.877802 307.45 1.28223 305.956L76.9307 26.5205C77.1276 25.7932 77.499 25.1237 78.0127 24.5703L98.3945 2.61621C99.2791 1.66344 100.523 1.12113 101.827 1.12109Z" stroke="url(#paint0_linear_3760_15682)" stroke-width="2.24236" />
      </clipPath>
    </svg>
    <svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="customClipcc">
        <path d="M67.7598 0.744141H435.332C437.372 0.744141 438.853 2.65669 438.347 4.60938L386.636 204.055C386.489 204.619 386.186 205.132 385.759 205.532L374.183 216.391C373.605 216.932 372.841 217.234 372.046 217.234H11.6631C10.6339 217.234 9.67231 216.728 9.09277 215.886L5.22656 210.266L5.20215 210.23L5.1748 210.198L1.50391 205.984C0.826664 205.207 0.58251 204.146 0.851562 203.154L51.1914 17.6094C51.3224 17.1268 51.5694 16.6828 51.9111 16.3154L65.4746 1.73828C66.0633 1.10555 66.8913 0.744246 67.7598 0.744141Z" stroke="url(#paint0_linear_3700_11333)" stroke-width="1.48893" />
      </clipPath>
    </svg>

    <!-- 加速信息页（覆盖层）：点击卡片上的「加速中」按钮调起。
        必须 Teleport 到 body：轮播根节点在 handHeldDevice 下带 transform: scale(0.85)，
         而 transform 祖先会让 position: fixed 退化成相对该祖先定位 —— 抽屉会缩在卡片区域内、
         高度很低且盖不住底部导航栏。挂到 body 后 inset:0 才真正相对视口。 -->
    <Teleport to="body">
      <AcceleratorInfoDialog
        v-model:visible="accelInfoVisible"
        :game-name="accelGame ? accelGame.appName : ''"
        :game-icon="accelGame ? accelGame.iconUrl : ''"
        :server-name="accelAreaText"
        :show-server-arrow="showAccelAreaArrow"
        :elapsed="accelDurationText"
        :panel="accelPanel"
        @stop="handleAccelStop"
        @open-game="handleAccelOpenGame"
        @server-click="handleAccelServerClick"
      />
    </Teleport>

    <!-- 停止加速确认弹窗（H5 自绘，设计稿 297:13737）：点详情页「停止加速」调起。
         只有点「停止」才调原生停止；点「取消」什么都不做、不关详情页、一个桥接请求都不发。
         @cancel 仅用于 #28（点取消/点遮罩）上报，没有别的副作用。 -->
    <XunyouConfirmDialog
      v-model:visible="stopConfirmVisible"
      title="确认是否停止"
      message="停止加速可能会导致游戏断线"
      confirm-text="停止"
      tone="danger"
      @cancel="handleAccelStopCancel"
      @confirm="handleAccelStopConfirmed"
    />

    <!-- 切换区服三段式·第 1 段：区服滚轮（设计稿 300:26396）。
         外壳复用同一个确认弹窗组件（默认插槽塞滚轮）：所以它没有标题区、
         确认按钮走主色；close-on-confirm=false 让「确定」只进入下一层而不关掉滚轮
         （取消时两层一并关掉，见 handleAreaSwitchCancel）。 -->
    <XunyouConfirmDialog
      v-model:visible="areaWheelVisible"
      confirm-text="确定"
      tone="primary"
      :close-on-confirm="false"
      @confirm="handleAreaWheelConfirm"
    >
      <XunyouAreaWheel
        ref="areaWheel"
        :areas="accelAreaOptions"
        :current-area-id="accelAreaCurrentId"
        :game-name="accelGameName"
      />
    </XunyouConfirmDialog>

    <!-- 切换区服三段式·第 2 段：二次确认（设计稿 297:14674），确认按钮用主色而非危险色。
         取消（含点空白处）把滚轮与二次确认两层一起关掉，回到详情页，不切换也不发任何桥接请求。
         show-mask=false：遮罩已由下面的滚轮那层提供，这层不再自己叠暗（两层叠起来过黑）。 -->
    <XunyouConfirmDialog
      v-model:visible="areaSwitchConfirmVisible"
      title="确定切换服务器？"
      :message="areaSwitchMessage"
      confirm-text="确定"
      tone="primary"
      :show-mask="false"
      @cancel="handleAreaSwitchCancel"
      @confirm="handleAreaSwitchConfirmed"
    />

    <!-- 切换加速器游戏确认：已在加速别的游戏时，点卡片上的「加速启动」调起。
         点「确认」才继续走加速流程（过渡动画 + accelerateStart），点「取消」什么都不做、
         不关任何层、一个桥接请求都不发。原生 accelerateStart 用新包名会顶掉旧的加速，
         所以确认后不需要先显式停止。只有「加速启动」需要这层确认，「立即启动」不拦。 -->
    <XunyouConfirmDialog
      v-model:visible="switchGameConfirmVisible"
      title="切换加速器游戏？"
      :message="switchGameMessage"
      confirm-text="确认"
      tone="primary"
      @cancel="handleSwitchGameCancel"
      @confirm="handleSwitchGameConfirmed"
    />

    <!-- 「加速前」领取提醒弹窗（设计稿 phone 558:27182 底部抽屉 / pad 558:27502 居中）：
         已登录 + 当前无加速权益 + 有可领的新人/回归福利时，点卡片「加速启动」调起。
         点「领取并加速」→ 领福利 + 5 秒内强制重鉴权，拿到权益就继续加速启动游戏；
         点取消 / 点遮罩 → 不领取、不加速、也不进套餐购买页。
         组件自己 Teleport 到 body（同 XunyouConfirmDialog）。 -->
    <XunyouClaimAccelDialog
      v-model:visible="claimAccelVisible"
      :welfare-type="claimAccelType"
      :claiming="claimAccelClaiming"
      @cancel="handleClaimAccelCancel"
      @confirm="handleClaimAccelConfirm"
    />

    <!-- 加速启动过渡覆盖层：点击卡片「加速启动」（持有效权益）时调起，按固定时间轴自动播完并卸载。
        同样必须 Teleport 到 body，原因同上：轮播根节点在 handHeldDevice 下带 transform: scale(0.85)，
        transform 祖先会让 position: fixed 退化成相对该祖先定位，覆盖层会缩在卡片区域内。
        @finished：出场动画播完（覆盖层卸载）后才拉起游戏，见 handleAccelTransitionFinished。 -->
    <Teleport to="body">
      <XunyouAccelTransition ref="accelTransition" @finished="handleAccelTransitionFinished" />
    </Teleport>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'
// 加速信息页（覆盖层）：点击卡片上的「加速中」按钮调起
import AcceleratorInfoDialog from '@/views/mobile/acceleratorInfo/index.vue'
// 加速启动过渡覆盖层：点击卡片上的「加速启动」按钮调起
import XunyouAccelTransition from '@/views/mobile/acceleratorTransition/index.vue'
// 迅游业务通用确认弹窗：停止加速确认与切换区服二次确认共用，区服滚轮也挂在它的默认插槽里
import XunyouConfirmDialog from './XunyouConfirmDialog.vue'
// 「加速前」领取提醒弹窗：无加速权益但有可领新人/回归福利时，点「加速启动」调起
import XunyouClaimAccelDialog from './XunyouClaimAccelDialog.vue'
// 区服滚轮：只出滚轮区，外壳与按钮区由上面的确认弹窗组件提供
import XunyouAreaWheel from './XunyouAreaWheel.vue'
// StoreLZRunStoreApp 是移动端桥接口，调的是原生 openStoreApp（与迅游 SDK 建立 VPN 后原生自动拉起的是同一个），
// 注意别和 nativeApi/LZProxy 里的同名函数搞混，那个是 PC 端 LZProxy.dll 的。
import { accelerateStart, getAccelAreaInfo, restartAccel, setBottomNavVisible, stopAccel, StoreLZRunStoreApp } from '@/nativeApiPad/download'
import { clearLoginResume, ensureAccelPanelFresh, getAccelStatusSync, syncAccelPanelFromNative, syncAccelStateFromNative } from '@/bridge/legionZoneMobile'
import { hasAccelRight, waitForAccelRightAfterClaim, waitUntilAccelStatusReady } from '@/utils/xunyouAccel'
// 可领福利的共享状态（福利横幅 / 会员页福利卡读的同一份）：加速启动拦截只读它、只在弹窗内用
import {
  claimGiftForAccelLaunch,
  currentWelfare,
  currentWelfareType
} from '@/utils/xunyouGiftState'

// 加速信息面板的延时 / 丢包率由原生按秒推送（accel_panel），H5 只读展示。
// 没有测速数据时一律按 0 展示：这两个数字是给用户看"此刻网络如何"的，
// 占位符或设计稿定值都会被当成真实读数，0 是唯一不会误导的取值。
const ACCEL_DELAY_TEXT = '0'
const ACCEL_LOSS_TEXT = '0'

// 加速请求回包成功后补拉加速状态的间隔与次数上限。
// 不能只补一次：回包只代表「已受理」，VPN 建立是异步的（真机实测回包到 established 约 200~300ms，
// 首次加速、切换测试服/正式服等情况下可能更久），立刻补拉会读到「未加速」。
const ACCEL_STATE_SYNC_INTERVAL_MS = 600
const ACCEL_STATE_SYNC_MAX_ATTEMPTS = 5

/**
 * 区服滚轮里由前端补在首位的「国服」项。它代表的是**「没有区服」这个状态**，不是一个真实可切换的区服，
 * 所以它不能进 areaList、也不能被当成真实区服传给原生（原生的 setSelectArea 只认区服列表内的值）。
 *
 * id 用空串当哨兵值：原生的 areaList 里不可能出现空串，所以不会和真实区服撞 id；
 * 选中它时给原生传的就是这个空串，语义即「本次不带区服」。
 *
 * 刻意**不去重**：迅游的 areaList 自己也返回「国服」时，滚轮里会出现两个「国服」——
 * 一个是这里补的「没有区服」，一个是真实的「国服」区服，两者靠 id / isDefault 在数据层区分开。
 */
const NO_AREA_ID = ''
const NO_AREA_NAME = '国服'

// #16「加速启动」点击上报的去重窗口（毫秒）。存在的理由：原生往返只有几十毫秒，
// 连点两次会让两次点击各自上报 #16、但只有最后一次能拿到 #17（前一次的请求结果被令牌作废），
// 埋点漏斗会对不上；300ms 内的重复点击按误触处理，只报第一次。
const ACCEL_START_CLICK_DEDUP_MS = 300

export default {
  name: 'GameCarousel',
  components: {
    GameDownloadButton,
    AcceleratorInfoDialog,
    XunyouAccelTransition,
    XunyouConfirmDialog,
    XunyouClaimAccelDialog,
    XunyouAreaWheel
  },
  props: {
    // 游戏列表数据
    gameList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isVerticalMobile: true,
      currentIndex: 0, // 轮播当前索引
      itemWidth: 60,
      startX: 0, // 原生轮播触摸起始
      // 加速信息面板延时/丢包占位；实时值由 accelPanelText/accelLossValue 从原生推送派生
      accelDelayFallback: ACCEL_DELAY_TEXT,
      accelLossFallback: ACCEL_LOSS_TEXT,
      accelNow: Date.now(), // 走表基准，每秒刷新一次
      accelTimer: null,
      accelArea: null, // { areaList: string[], serverName, isForeign }，原生只透传迅游字段，解析与判定都在 H5
      accelInfoVisible: false, // 加速信息页（覆盖层）是否展开
      // 停止加速确认弹窗 / 切换区服三段式（滚轮 → 二次确认）的显隐
      stopConfirmVisible: false,
      areaWheelVisible: false,
      areaSwitchConfirmVisible: false,
      // 切换加速器游戏确认弹窗：已在加速别的游戏时点卡片「加速启动」调起
      switchGameConfirmVisible: false,
      // 待切换的目标游戏项；确认后拿它继续加速，取消/点遮罩则清空
      switchGameTarget: null,
      // 滚轮选中的目标区服：二次确认的正文里要插它的名字
      areaSwitchTarget: null,
      // 「加速启动」的请求归属令牌：发请求前自增并记下本次的号，回包里比对，
      // 过期结果整体作废（既不播动画也不弹失败 toast）。见 handleAccelStart 的注释。
      accelAttempt: 0,
      // 本次「加速启动」过渡动画播完后要拉起的游戏包名。
      // 拉起时机已从原生挪到 H5：accelerateStart 传 autoLaunch=false，原生只建 VPN 不拉起游戏，
      // 动画播完（覆盖层 finished 事件）后由 handleAccelTransitionFinished 取该包名拉起。
      pendingLaunchPackage: '',
      // 登录后续跑加速的世代号：组件卸载或再次点登录时作废上一轮 waitUntilAccelStatusReady
      loginResumeToken: 0,
      // ---- 「有可领福利时点加速启动」的领取提醒弹窗（见 handleAccelStart 的无权益分支）----
      claimAccelVisible: false,
      // 待加速的游戏：点「加速启动」时记下，领取成功拿到权益后继续加速它
      claimAccelTarget: null,
      // 福利类型快照（'newcomer' | 'return'）。不能直接绑共享的 currentWelfareType：
      // 领取成功后共享的 gifts 会立刻变成「不可领」，那个 computed 会当场翻成 'return'，
      // 新人文案会在「领取中…」那几秒里被改成回归文案。
      claimAccelType: 'return',
      // 待领取的福利项快照，同上（领取动作要用打开弹窗那一刻的那一条）
      claimAccelGift: null,
      // 「领取中…」禁用态：从点确认起，覆盖领取请求 + 5 秒等权益的整个窗口
      claimAccelClaiming: false,
      // #31 曝光去重：每次打开弹窗只报一条（与 AcceleratorPayDialog 的 payPopupShown 同口径：
      // 每次打开算一个新生命周期，关闭时复位，用户取消后再点进来算新的一次展示）
      claimAccelShowReported: false,
      // 5 秒等待窗口的世代号：组件卸载时作废领取请求返回后的所有后续动作（关窗 / toast / 加速）。
      claimAccelToken: 0,
      // 5 秒短窗的取消句柄：卸载时立即清除本地轮询和未触发的 force 重鉴权，不能只靠世代号忽略回写。
      claimAccelWaitCancel: null,
      // ---- 以下是迅游加速埋点（需求文档 3.2）用的状态，逻辑集中在 methods 末尾的「迅游加速埋点」段 ----
      // #15 卡片曝光去重：key = 包名/游戏名，本页面生命周期内已报过的卡片不再报（反复滑进滑出不重复）
      reportedCardShowKeys: {},
      // #16 点击去重：key = 包名/游戏名，value = 最近一次上报时刻（窗口见 ACCEL_START_CLICK_DEDUP_MS）
      lastStartClickAt: {},
      // #19 的准入标记：#17（加速请求成功）时置位、#19 上报时消费。
      // 只认「本页面生命周期内刚成功发起过一次加速」这种情况，避免把进来时就已经在加速的存量状态
      // （原生不会在 H5 加载时补推 accel_state，但用户可能在原生页或更早的会话里就已在加速）误报成一次加速成功。
      accelStartPending: false,
      // #19 已上报过的加速段（包名 | 本次加速起始时刻），同一段的重复推送不重复上报
      reportedAccelSuccessKey: ''
    }
  },
  computed: {
    isLogin() {
      return this.userInfo && this.userInfo.UserID
    },
    loginStatus() {
      return this.$store.state.user.loginStatus
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    // 迅游加速状态：null 未加速/未知，{established, packageName} 加速中游戏
    accelState() {
      return this.$store.state.user.accelState
    },
    // 迅游加速权益：null 未获取，{errorCode, userState, vipExpireTime} 已获取
    accelStatus() {
      return this.$store.state.user.accelStatus
    },
    // 加速信息面板实时数据（原生 accel_panel 推送），null 表示暂无
    accelPanel() {
      return this.$store.state.user.accelPanel
    },
    // 卡片上的「当前延时」：有面板数据就取原生推的 delayMs；该秒没测到（丢包帧 delayMs 为 null）
    // 显示 --，表示"此刻测不到"。完全没有面板数据时显示 0——不显示设计稿定值，那会被当成真实读数。
    accelDelayText() {
      const p = this.accelPanel
      if (!p || !p.ready) return this.accelDelayFallback
      return p.delayMs == null ? '--' : String(p.delayMs)
    },
    // 卡片上的「丢包率」：保留一位小数。口径同 accelDelayText
    accelLossText() {
      const p = this.accelPanel
      if (!p || !p.ready) return this.accelLossFallback
      return p.loss == null ? '--' : String(p.loss)
    },
    // 某游戏是否正在加速（按钮据此切“加速启动”/“加速中”）
    isAccelerating() {
      return (item) => {
        const state = this.accelState
        return !!(state && state.established && state.packageName === item.packageName)
      }
    },
    // 是否正在加速「别的」游戏：点卡片「加速启动」时据此决定要不要先弹切换确认。
    // 不能简写成 !isAccelerating(item)：accelState 里没有 packageName 时两者都为 false，
    // 那种状态（原生只推了 established）下弹出「要切换到 X 加速吗」是错的。
    isAcceleratingOther() {
      return (item) => {
        const state = this.accelState
        return !!(state && state.established && state.packageName && state.packageName !== item.packageName)
      }
    },
    // 正在加速的游戏（供加速信息页展示名称与图标）
    accelGame() {
      const state = this.accelState
      if (!state || !state.established) return null
      return this.gameList.find(game => game.packageName === state.packageName) || null
    },
    // 正在加速的游戏名（#22、#26~#30 的 gameName 用）。
    // 与详情页入参同源（accelGame 按包名反查），拿不到时退回 accelState 里原生推的包名 ——
    // gameName 是必填参数，「加速中的游戏不在本机列表」时也不能报空。
    accelGameName() {
      const game = this.accelGame
      return (game && game.appName) || (this.accelState && this.accelState.packageName) || ''
    },
    // 切换加速器游戏确认弹窗的正文（文案由设计稿给定，两个游戏名按位代入）
    switchGameMessage() {
      const current = (this.accelGame && this.accelGame.appName) || ''
      const target = (this.switchGameTarget && this.switchGameTarget.appName) || ''
      return `当前正在加速${current}，是否停止加速并切换到为 ${target} 加速？`
    },
    // #31/#32 的 popupType：新人 newcomerGuide / 回归 returnGuide（需求文档 3.2）。
    // 取的是打开弹窗那一刻的类型快照 —— 领取成功后共享的福利态会翻成回归，实时值会报错。
    claimAccelPopupType() {
      return this.claimAccelType === 'newcomer' ? 'newcomerGuide' : 'returnGuide'
    },
    // 本次加速的起始时刻（epoch 毫秒），0 表示没在加速
    accelStartTimeMs() {
      const state = this.accelState
      return (state && state.established && Number(state.startTimeMs)) || 0
    },
    // 已加速时长 mm:ss（设计里的 00:12）
    accelDurationText() {
      const start = this.accelStartTimeMs
      if (!start) return '00:00'
      const total = Math.max(0, Math.floor((this.accelNow - start) / 1000))
      const mm = String(Math.floor(total / 60)).padStart(2, '0')
      const ss = String(total % 60).padStart(2, '0')
      return `${mm}:${ss}`
    },
    // 当前区服的展示名。原生在「没有区服」时给的就是空串，这里补成「国服」——
    // 卡片加速信息面板与详情页顶部共用它，缺一格会让面板看起来是坏的。
    accelAreaText() {
      return (this.accelArea && this.accelArea.serverName) || NO_AREA_NAME
    },
    // 原生原样透传的区服列表（字符串数组）。刻意不去重、不加工：它自己的「国服」与下面补的
    // 「没有区服」项是两个不同的东西，靠 id 区分。
    accelAreaList() {
      return (this.accelArea && this.accelArea.areaList) || []
    },
    // 区服下拉箭头：可切换区服 ≤1 个时没有真正的选择，隐藏箭头（面板文案与点击行为都不变）
    showAccelAreaArrow() {
      return this.accelAreaList.length > 1
    },
    // 区服滚轮的可选项 = 补在首位的「没有区服」项 + 原生列表。
    // 恒有至少 1 项（那个补的「国服」），所以「能不能打开滚轮」不能看这里，要看 accelAreaList 的长度。
    accelAreaOptions() {
      return [
        { id: NO_AREA_ID, name: NO_AREA_NAME, isDefault: true },
        ...this.accelAreaList.map(name => ({ id: name, name }))
      ]
    },
    // 滚轮挂载时要停在的项：当前区服名能在原生列表里精确匹配就停那一项（比如当前真的是「国服」区服），
    // 匹配不到（含「没有区服」这种 serverName 为空串的情况）就停在首位补的那个「没有区服」项。
    accelAreaCurrentId() {
      const serverName = (this.accelArea && this.accelArea.serverName) || ''
      return this.accelAreaList.includes(serverName) ? serverName : NO_AREA_ID
    },
    // 切换区服二次确认的正文（设计稿 297:14674 把「日服」写成示例值，运行时换成真实目标区服名）。
    // 设计稿原文最后一句是「确定后将为当前游戏重现加速」，「重现」应为「重新」的笔误，按 PRD 的措辞用「重新加速」。
    areaSwitchMessage() {
      const name = (this.areaSwitchTarget && this.areaSwitchTarget.name) || ''
      return `切换到「${name}」将切断当前加速，确定后将为当前游戏重新加速`
    },
    computedHour() {
      return (time) => {
        const result = this.millisecondToHour(time)
        return result
      }
    },
    computedImgSrc() {
      return (item, isVertical) => {
        let src = ''
        if (isVertical) {
          src = item?.verticalCoverUrl
        } else {
          src = item?.coverUrl
        }
        if (!src) {
          src = item?.imageUrl?.replace(/^http:\/\//, 'https://')
        }
        return src || ''
      }
    }
  },
  watch: {
    gameList: {
      handler(newList) {
        if (newList.length > 0) {
          this.$nextTick(() => {
            this.initNativeSwiper()
            // #15：列表就绪/刷新（原生回填 supportAccel 后会重推列表）后，当前卡片才算进入可见范围
            this.reportAccelCardShow()
          })
        }
      },
      deep: true,
      immediate: true
    },
    // #15：轮播切卡（左右滑、点底部小图）后，新的当前卡片进入可见范围
    currentIndex() {
      this.$nextTick(() => this.reportAccelCardShow())
    },
    // 加速状态变化：#19 加速成功上报；同时重判一次 #15 ——
    // 加速中不报（此刻卡片上显示的是「加速中」按钮），停止加速后卡片恢复「加速启动」，才够上报条件
    accelState: {
      handler(state) {
        // 拼接成字符串：Android 转发 H5 console 时只取首段，传对象会退化成 [object Object]。
        // 「当前卡」与 state 里的加速包名对不上，是「卡片不切加速中」的常见原因，留作排查入口。
        console.log('[XunyouAccel] H5 accelState 更新 ' + JSON.stringify(state)
          + ' | 当前卡=' + String((this.gameList[this.currentIndex] || {}).packageName))
        this.reportAccelSuccess(state)
        this.reportAccelCardShow()
      }
    },
    // 加速开始/结束：启停走表，并按需拉一次或清掉区服信息
    accelStartTimeMs: {
      handler(startTimeMs) {
        if (startTimeMs) {
          this.accelNow = Date.now()
          this.startAccelTimer()
          this.fetchAccelArea()
          this.primeAccelPanel()
        } else {
          this.stopAccelTimer()
          this.accelArea = null
        }
      },
      immediate: true
    },
    // 加速信息页是全屏底部抽屉：打开时请原生收起底部导航栏（那是原生 View，WebView 盖不住它），关闭时恢复
    accelInfoVisible: {
      handler(visible) {
        setBottomNavVisible(!visible)
        // 打开详情页时补拉一帧。两个入口（卡片「加速中」按钮、卡片加速信息区）都只是把 visible 置 true，
        // 挂在这里一次覆盖，不必在每个入口各写一遍；详情页里的指标与折线都取自这一份数据。
        if (visible) this.primeAccelPanel()
      }
    },
    // 「加速前」领取提醒弹窗同样是全屏覆盖层：phone 是贴底抽屉，不收起原生底部导航栏的话
    // 抽屉底部的按钮行会被它压住（WebView 底部那 74dp 就是 tab 栏的位置）。
    // pad 的居中形态一并照做：遮罩盖满全屏，但原生 tab 栏画在 WebView 之上，
    // 不收起的话用户能隔着遮罩点到它、直接跳出这一页。
    // 收起放在这里而不是组件内：与 accelInfoVisible 同一处，原生可见性只在一个地方管。
    claimAccelVisible: {
      handler(visible) {
        setBottomNavVisible(!visible)
        if (visible) this.reportClaimAccelPopupShow()
        // 关闭即复位曝光去重：再次打开是用户看到的**新一次**展示，理应再报一条
        else this.claimAccelShowReported = false
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.checkMediaQuery)
      this.checkMediaQuery()
    })
    // 回到游戏空间（组件重新挂载）时补拉一帧：卡片上的延时 / 丢包同样取自这份数据，
    // 不能只等打开详情页才拉。此刻若正在加速，native 快照里已经有实时值。
    this.primeAccelPanel()
  },
  beforeUnmount() {
    this.loginResumeToken += 1
    // 作废领取订单返回后的后续动作，并立即取消已经开始的短窗轮询与未触发的 force 重鉴权。
    this.claimAccelToken += 1
    if (typeof this.claimAccelWaitCancel === 'function') this.claimAccelWaitCancel()
    this.claimAccelWaitCancel = null
    clearLoginResume()
    this.stopAccelTimer()
    // 抽屉可能还开着就离开了页面，兜底恢复原生底部导航栏
    setBottomNavVisible(true)
    window.removeEventListener('resize', this.checkMediaQuery)
    // 移除触摸事件
    if (this.$refs.swiperBox) {
      this.$refs.swiperBox.removeEventListener('touchstart', this.handleTouchStart)
      this.$refs.swiperBox.removeEventListener('touchend', this.handleTouchEnd)
    }
  },
  methods: {
    // 初始化轮播事件
    initNativeSwiper() {
      const box = this.$refs.swiperBox
      if (!box) return
      // 绑定触摸事件
      box.addEventListener('touchstart', this.handleTouchStart)
      box.addEventListener('touchend', this.handleTouchEnd)
    },
    handleTouchStart(e) {
      this.startX = e.touches[0].clientX
    },
    handleTouchEnd(e) {
      const moveX = e.changedTouches[0].clientX - this.startX
      const total = this.gameList.length
      if (total <= 1) return
      if (moveX < -5) {
        // 左滑 → 下一张
        this.currentIndex = (this.currentIndex + 1) % total
      } else if (moveX > 5) {
        // 右滑 → 上一张
        this.currentIndex = (this.currentIndex - 1 + total) % total
      }
      this.updateNativeSwiper()
      this.scrollActiveItemIntoView(this.currentIndex)
    },
    // 给卡片添加 prev / active / next 类名
    getItemClass(index) {
      const total = this.gameList.length
      if (total === 0) return ''
      if (index === this.currentIndex) {
        return 'active'
      }
      // 只给「当前索引的前一个」加 prev
      if (index === (this.currentIndex - 1 + total) % total) {
        return 'prev'
      }
      // 只给「当前索引的后一个」加 next
      if (index === (this.currentIndex + 1) % total) {
        return 'next'
      }
      // 其他卡片不加任何类，用默认样式隐藏
      return ''
    },
    // 更新轮播状态
    updateNativeSwiper() {
      // 自动通过 :class 绑定，无需手动操作DOM
    },

    checkOrientationWithMediaQuery() {
    // 使用媒体查询检测横屏
      const landscapeQuery = window.matchMedia('(orientation: landscape)')
      const portraitQuery = window.matchMedia('(orientation: portrait)')

      // 先尝试使用 orientation 媒体查询
      if (landscapeQuery.matches) {
        return 'landscape'
      }

      if (portraitQuery.matches) {
        return 'portrait'
      }
      // 兜底策略：如果 orientation 媒体查询没生效，使用宽高比较
      // 注意：这里的宽高比较可能会受系统字体缩放影响
      if (window.innerWidth >= window.innerHeight) {
        return 'landscape'
      } else {
        // 极端情况：宽高相等，默认返回竖屏
        return 'portrait'
      }
    },
    checkMediaQuery() {
      this.isVerticalMobile = this.checkOrientationWithMediaQuery() === 'portrait'
      // 防抖处理，300ms
      // if (this.resizeTimer) {
      //   clearTimeout(this.resizeTimer)
      // }
      // this.resizeTimer = setTimeout(() => {
      //   // 检查屏幕宽度是否小于等于800px
      //   this.isVerticalMobile = this.checkOrientationWithMediaQuery() === 'portrait'
      //   console.log('this.isVerticalMobile', this.isVerticalMobile)
      // }, 300)
    },
    // 底部Item点击切换
    handleItemClick(index) {
      this.isProcessingClick = true
      this.currentIndex = index
      // 同步更新顶部轮播
      if (this.$refs.bannerSwiper) {
        this.$refs.bannerSwiper.swiper.slideTo(index, 300)
      }
      // 延迟重置标志，确保触摸事件不会干扰点击
      setTimeout(() => {
        this.isProcessingClick = false
      }, 100)
    },
    // 滚动激活的item到可视区域
    scrollActiveItemIntoView(index) {
      console.log('滚动到索引22:', index)
      const container = this.$refs.snapContainer
      if (!container) return
      // 计算每个item的实际宽度（包括间距）
      const itemWithSpacing = this.itemWidth + 50 // 50px是item之间的间距

      // 计算激活item的位置
      const itemLeft = index * itemWithSpacing
      const itemRight = itemLeft + this.itemWidth

      // 获取容器的可视区域
      const containerLeft = container.scrollLeft
      const containerRight = containerLeft + container.clientWidth
      const maxScrollLeft = Math.max(
        0,
        (this.gameList.length - 1) * itemWithSpacing + this.itemWidth - container.clientWidth,
      )
      // 如果滑动最后一个直接滑动到最后
      if (index === this.gameList.length - 1) {
        container.scrollTo({
          left: maxScrollLeft,
          behavior: 'smooth'
        })
        return
      }

      // 检查item是否在可视区域内
      if (itemLeft < containerLeft || itemRight > containerRight) {
        // 计算目标滚动位置，确保item在可视区域内
        let targetLeft = itemLeft - (container.clientWidth - this.itemWidth) / 2
        targetLeft = Math.max(0, targetLeft)

        // 计算最大滚动位置
        targetLeft = Math.min(targetLeft, maxScrollLeft)

        // 滚动到目标位置
        container.scrollTo({
          left: targetLeft,
          behavior: 'smooth'
        })
      }
    },
    drinfo(item, index, status, source) {
      const plateName = source === 0 ? '我的游戏-本机' : source === 1 ? '我的游戏-有更新' : source === 2 ? '我的游戏-玩过' : ''
      return JSON.stringify({
        source_p: this.$route.query.source_p || '',
        source: 'PAD7',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 2,
        plateName: plateName,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    // 卡片下载态按钮的进度填充宽度，以 CSS 变量 --lz-progress 传给按钮内的 ::after
    // （共享组件 AbShapeDownloadButtonPad 不改，进度由 GameCarousel 的 :deep() 重画）。
    // 只有「下载中」(1) 与「已暂停」(0) 画填充，「等待中」(4)、「安装中」(6) 不画 ——
    // 依据设计稿 617:11063：等待态是纯 rgba(0,0,0,.4) 底、没有进度层。
    // status 取值见 src/store/modules/softwareStatePad.js 的 stateMap 注释。
    downloadProgress(item) {
      const pkgName = item.softDesc && item.softDesc.pkgName
      const info = pkgName ? this.$store.state.softwareStatePad.stateMap[pkgName] : null
      if (!info || (info.status !== 0 && info.status !== 1)) return '0%'
      return `${info.progress || 0}%`
    },
    millisecondToHour(milliseconds) {
      // 根据毫秒数转换为合适的时间单位
      const totalSeconds = milliseconds / 1000
      const totalMinutes = totalSeconds / 60
      const totalHours = totalMinutes / 60
      // 判断时间单位并返回对应的值和标签
      if (totalHours >= 1) {
        // 满整小时的，保留两位小数
        return { value: Number(totalHours.toFixed(2)) || 0, label: 'h' }
      } else if (totalMinutes >= 1) {
        // 不够小时的，返回分钟
        return { value: Math.round(totalMinutes) || 0, label: 'm' }
      } else {
        // 不够分钟的，返回秒
        return { value: Math.round(totalSeconds) || 0, label: 's' }
      }
    },
    toDetail(item, index) {
      if (this.currentIndex !== index) {
        return
      }

      window.LegionZoneMobile.nativeCall('LegionZone', 'intentGameDetail', {
        packageName: item.packageName
      })

      this.$dataReport('LZ_myGames', 'LZ_myGamesListCardClick', 'click', {
        detail: JSON.stringify({
          listType: 'local',
          skuName: item.appName, // 商品名称即游戏名称
          package: item.packageName, // 包名
          lid: this.isLogin
        })
      })
    },
    // 迅游加速启动：调用原生迅游加速（autoLaunch=false，原生只建 VPN 不拉起），
    // 过渡动画播完后再由 H5 调 StoreLZRunStoreApp 拉起游戏。
    // 点击分支：未登录 → 原生登录弹窗，成功后续跑本次点击；已登录有权益 → 调加速；
    // 已登录无权益但有可领新人/回归福利 → 弹「领取并加速」领取提醒；其余无权益 → 套餐购买页。
    // skipSwitchCheck：切换确认弹窗点「确认」后回调用，跳过「要不要弹切换确认」这一层判断。
    // 不能省这个参数：确认的那一刻原生还没真正切换，isAcceleratingOther 仍为 true，
    // 再走一遍本方法会又弹出同一个弹窗，用户点多少次都进不去。
    // skipSyncStatus：登录成功后续跑时用。原生 getAccelStatusSync 读的是进程内上一份鉴权结果，
    // 登出不会清掉它；此时必须用刚推到 store 的本账号权益，不能让同步读把旧账号权益盖回来。
    handleAccelStart(item, skipSwitchCheck, skipSyncStatus) {
      // 已在加速该游戏：按钮此时已是「加速中」，点击改为调起加速信息页（#21 clickType=speedingUp）
      if (this.isAccelerating(item)) {
        console.log('[XunyouAccel] H5 handleAccelStart 已在加速，打开加速信息页')
        this.reportAccelInfoAreaClick(item, 'speedingUp')
        this.accelInfoVisible = true
        return
      }

      // 未登录：supportAccel 不依赖鉴权（SDK 支持列表只要求 init），按钮会显示。
      // LIDLogin 不回包，靠 login_status 续跑；鉴权晚于登录推送，见 resumeAccelStartAfterLogin。
      // 放在切换确认之前：未登录时不应先弹「切换加速器游戏」。
      if (this.loginStatus !== 'yes') {
        console.log('[XunyouAccel] H5 handleAccelStart 未登录，拉起原生登录')
        const requestedAt = Date.now()
        this.$loginForAccel(() => this.resumeAccelStartAfterLogin(item, requestedAt))
        return
      }

      // 已在加速「别的」游戏：先弹确认，确认后才继续加速。
      // 少了这层拦截时，列表里滑一下误触就会把正在玩的游戏顶掉，而界面上没有任何提示。
      if (!skipSwitchCheck && this.isAcceleratingOther(item)) {
        console.log('[XunyouAccel] H5 handleAccelStart 已在加速别的游戏，弹切换确认', {
          current: this.accelState && this.accelState.packageName,
          target: item.packageName
        })
        this.switchGameTarget = item
        this.switchGameConfirmVisible = true
        // #29 切换游戏确认弹窗曝光（点确认继续加速时才报 #16/#17，见 #30 与 handleSwitchGameConfirmed）
        this.reportSwitchGamePopupShow(item)
        return
      }

      // #16 点击加速启动按钮：不论后续成功或失败都上报。
      // 放在上面两个 early-return 之后 —— 「加速中」按钮走 #21、切换确认弹窗要等用户点确认（#30）才算一次加速启动点击。
      this.reportStartButtonClick(item)

      // 权益有两个来源：原生同步读（补拉被动推送丢失的情况）和 store 里最近一次的推送。
      // 同步读可能因安全校验未过 / 尚未鉴权而返回 errorCode=-1，这种结果不能用来判定权益 ——
      // 否则会出现「会员卡显示正常、点按钮却跳购买页」的自相矛盾。只有同步读真正可用时才采用它。
      const syncStatus = skipSyncStatus ? null : getAccelStatusSync()
      const status = (syncStatus && Number(syncStatus.errorCode) === 0) ? syncStatus : this.accelStatus

      // 有权益：调原生加速，加速请求成功后播过渡动画，拉起游戏再往后挪到动画播完（见下方 finished 处理）
      if (status && hasAccelRight(status)) {
        this.startAccelWithRight(item)
        return
      }

      // 无权益、已过期，或权益查询失败/还没返回：先看有没有可领的新人/回归福利（R1）。
      // 可领未领时点「加速启动」不该被当成「没开会员」送去购买页 —— 弹领取提醒，
      // 点「领取并加速」走领取 + 5 秒等权益的链路，点取消则什么都不做（见 handleClaimAccelCancel）。
      // 能否可领由后端表决定（getXunyouGifts → gift/available），与「此刻能不能加速」是两套数据。
      if (this.openClaimAccelDialog(item)) return

      // 没有可领福利：一律进套餐购买页。
      // 这里原先是「查询失败就静默 return」，用户点了完全没反应（正式服首次鉴权常返回 1008 就会走到这里）；
      // 购买页本身会展示真实权益状态，对已开通用户也不会有损失，所以统一跳转比静默更合理 —— 且每次点击都有明确去向。
      console.log('[XunyouAccel] H5 handleAccelStart 无可用权益，跳套餐购买页', status)
      this.$router.push({ name: 'AcceleratorBuy' })
    },
    // 有权益时启动加速：调原生 accelerateStart（autoLaunch=false，只建 VPN），请求成功后播过渡动画，
    // 动画播完再由 handleAccelTransitionFinished 拉起游戏。
    //
    // 从 handleAccelStart 里原样抽出的一段，两处调用方：① 点「加速启动」时本来就有权益；
    // ②「领取并加速」拿到权益后复用同一段。后者刻意**不回走** handleAccelStart ——
    // 那会重复上报 #16（用户点的是弹窗里的「领取并加速」，不是卡片上的「加速启动」按钮），
    // 也会再弹一次「切换加速器游戏」确认（那一层在最初点「加速启动」时已经过了）。
    startAccelWithRight(item) {
      if (!item) return
      console.log('[XunyouAccel] H5 有加速权益，调原生加速', { package: item.packageName, appName: item.appName })
      const transition = this.$refs.accelTransition
      if (!transition) {
        // 兜底：拿不到覆盖层就不做门控，退回原来的行为 —— 让原生在 VPN 建立后自己拉起。
        // 别把这个分支当冗余删掉：覆盖层是 Teleport 到 body 的静态子组件，正常情况下 ref 必然存在，
        // 但缺了它，ref 缺失时的隐含行为会从「只有原生拉起」变成
        // 「动画没播 + autoLaunch=false 把原生也拦住」，用户点了完全没反应且没有任何报错。
        // 这里刻意不记 pendingLaunchPackage：本路径不会有 finished 事件来消费它，
        // 而唯一能读到该字段的 finished 事件必定来自走了下面门控分支的点击（那次点击会先覆盖它）。
        // 令牌同样要自增：否则这次点击之前在途的那次成功结果仍是最新令牌（判定不了自己已过期），
        // 会来播动画并写 pendingLaunchPackage。
        this.accelAttempt += 1
        // 这条路径没有过渡动画门控，但加速结果同样要报 #17/#20（拿不到覆盖层的兜底路径也要有结果上报）
        accelerateStart(item.packageName, item.appName).then(res => {
          const data = this.reportAccelStartResult(item, res)
          // 本路径没有过渡动画，补拉只能挂在回包上（同样兜底推送丢失）
          if (data && data.success === true) this.syncAccelStateAfterStart(item)
        })
        return
      }
      // 请求归属令牌：本次请求发出前自增并留号，回包时若号已不是最新（用户在此期间又点了一次），
      // 本次结果整体作废 —— 既不播动画也不弹 toast。
      // 背景：原生往返只有几十毫秒，快速连点两次时两次回包各自独立判定，会出现
      // 「先成功后失败」→ 弹出「加速启动失败」toast、同时已成功那次的动画照播且游戏照拉（自相矛盾）。
      const attempt = ++this.accelAttempt
      // 先请求加速，成功了才播动画：加速请求被拒时既不起动画、也不拉起游戏
      // （autoLaunch=false 已经挡住原生那一路，这里不再记 pendingLaunchPackage 就不会有 H5 拉起）。
      // autoLaunch=false 的理由：否则 VPN 建得快时游戏会盖在动画上（真机实测动画一闪而过）。
      accelerateStart(item.packageName, item.appName, false).then(res => {
        // 令牌比对放在解析结果之前：过期结果一律作废，连日志之外的处理都不做。
        // （#17/#20 也因此只在最新一次请求上报，不会被连点的前一次重复报）
        if (attempt !== this.accelAttempt) {
          console.log('[XunyouAccel] H5 startAccelWithRight 本次结果已过期，整体作废', { attempt, latest: this.accelAttempt })
          return
        }
        // #17 / #20：加速请求成功与失败的两次上报都在这里，返回值沿用为下面的成功判定。
        // nativeCall 的结果可能是 JSON 字符串、也可能已经是对象（同 download.js 里 getAccelAreaInfo 的写法），
        // 解析失败一律当失败处理（别让解析异常把这条 then 变成 rejected —— 那会静默吞掉后面的判定）。
        const data = this.reportAccelStartResult(item, res)
        // 只看 success：stage 是 accelerating（已在加速）还是 vpn_auth 之后才回来的结果都算成功，都该播动画。
        // nativeCall 被 catch 时 accelerateStart resolve 的是 undefined，也算失败。
        // 注意 E2：需要系统 VPN 授权时原生**先不回包**，等用户选完才回一次 ——
        // 用户拒绝会回 success:false，于是这里不播动画、不拉起游戏、只弹失败 toast，正是期望行为。
        if (!data || data.success !== true) {
          console.log('[XunyouAccel] H5 startAccelWithRight 加速请求未成功，不播动画也不拉起游戏', res)
          // 这里给用户一个明确反馈：失败时动画和拉游戏都不会发生，没有 toast 的话用户点了完全没反应，
          // 会反复点按钮（而每次点击都会再发一次加速请求）。别把这个 toast 当多余的删掉。
          this.$message({
            message: '加速启动失败',
            type: 'error',
            duration: 2500,
            customClass: 'lg-message--error'
          })
          return
        }
        // 判定成功后才记包名并播动画：失败时 pendingLaunchPackage 必须保持空，
        // 免得残留状态被后面的 finished 事件消费掉而误拉起游戏。
        // 覆盖层按自身固定时间轴（约 2.35s）播完并自动卸载，不依赖加速真实结果
        this.pendingLaunchPackage = item.packageName
        transition.play(item.appName)
        // 兜底推送丢失：native 的 accel_state 若被静默丢弃，卡片会一直停在「加速启动」
        this.syncAccelStateAfterStart(item)
      })
    },
    /**
     * 无加速权益但**有可领新人/回归福利**时的分流（R1）：弹领取提醒并记下待加速的游戏。
     * 返回 true 表示已弹窗（调用方不要再跳套餐购买页）。
     *
     * 福利态来自 @/utils/xunyouGiftState（福利横幅与会员页福利卡读的同一份），本组件只读、只在弹窗内用。
     * 弹窗文案与埋点用的 popupType 都用这一刻的**快照**：领取成功后共享的 gifts 会立刻变成「不可领」，
     * 响应式的 currentWelfare / currentWelfareType 会当场翻掉（新人 → 回归），弹窗会在
     * 「领取中…」那几秒里跳字。
     */
    openClaimAccelDialog(item) {
      const welfare = currentWelfare.value
      if (!welfare) return false
      console.log('[XunyouAccel] H5 无权益但有可领福利，弹领取提醒', {
        package: item && item.packageName,
        giftType: welfare.giftType
      })
      this.claimAccelTarget = item
      this.claimAccelGift = welfare
      this.claimAccelType = currentWelfareType.value
      this.claimAccelClaiming = false
      this.claimAccelVisible = true
      return true
    },
    // 登录成功后续跑加速启动：先等本账号鉴权写入 store，再走原点击路径。
    // 不能在 login_status 到达的当下立刻调 handleAccelStart——那时 store.accelStatus 还是登出清掉的 null，
    // 同步读又可能仍是上一账号的有效权益，会把会员送去购买页或拿错账号去加速。
    resumeAccelStartAfterLogin(item, requestedAt) {
      if (!item) return
      const token = ++this.loginResumeToken
      console.log('[XunyouAccel] H5 登录成功，等待权益后再加速启动', { package: item.packageName })
      waitUntilAccelStatusReady({ afterMs: requestedAt || 0 }).then(status => {
        if (token !== this.loginResumeToken) return
        if (this.loginStatus !== 'yes') return
        if (!status) {
          console.log('[XunyouAccel] H5 登录后权益未就绪，跳套餐购买页')
          this.$router.push({ name: 'AcceleratorBuy' })
          return
        }
        this.handleAccelStart(item, false, true)
      })
    },
    // 切换加速器游戏确认「取消」（含点遮罩）：清掉待切换目标，什么都不做 ——
    // 不停止当前的加速、不关任何层、一个桥接请求都不发。
    handleSwitchGameCancel() {
      console.log('[XunyouAccel] H5 切换加速：用户取消')
      // #30：取消也要报点击（确认/取消都算弹窗内的一次点击）。上报放在清目标之前 —— 参数要用到它
      this.reportSwitchGamePopupClick('cancel', this.switchGameTarget)
      this.switchGameTarget = null
    },
    // 切换加速器游戏确认「确认」：拿目标游戏继续走加速流程（skipSwitchCheck 跳过本层判断）。
    // 刻意不先调停止：原生 accelerateStart 用新包名会顶掉旧的加速，多停一次反而会让卡片状态闪一下。
    handleSwitchGameConfirmed() {
      const item = this.switchGameTarget
      // #30：点确认这条链路还要完整走一遍开始加速的上报 —— 下面的 handleAccelStart 会报 #16，
      // 加速请求成功后再报 #17（需求文档 3.2 #30 已明确「确认时两条都上报」）
      this.reportSwitchGamePopupClick('confirm', item)
      this.switchGameTarget = null
      if (!item) return
      console.log('[XunyouAccel] H5 切换加速：用户确认，继续加速', { package: item.packageName })
      this.handleAccelStart(item, true)
    },
    // 「领取并加速」弹窗「取消」（含点遮罩）：只上报，业务上什么都不做 ——
    // 不领取、不加速、不跳购买页，福利原样可领（R2）。关弹窗由弹窗自己 emit update:visible 完成。
    handleClaimAccelCancel() {
      console.log('[XunyouAccel] H5 加速前弹窗：用户取消')
      this.reportClaimAccelPopupClick('cancel')
    },
    /**
     * 「领取并加速」：领福利 → 5 秒内等权益生效 → 生效就继续加速启动（R3）。
     *
     * 计时从 claim 接口成功返回之后开始（领取是同步等迅游下单，HTTP 上限 10 秒，计进去会吃掉大半窗口）。
     * 等权益用的是 waitForAccelRightAfterClaim：窗口内 3 次 force 重鉴权（t≈0/1.5s/3s，绕过 native 的
     * 3 秒节流）+ 每 200ms 本地读鉴权缓存。**刻意不用 refreshXunyouAccelStatus** —— 它的间隔下限
     * 硬编码 3500ms，5 秒窗口按它会跑到约 7 秒，与「5 秒没等到就提示失败」冲突。
     *
     * 两种失败分开处理：
     * - claim 请求本身失败（HTTP 报错）：弹窗**保持打开**、按钮恢复可点让用户重试，文案沿用既有领取路径；
     * - 5 秒内没等到权益：福利已发放、不回滚，关弹窗 + 「请求失败，请稍后重试」。
     */
    async handleClaimAccelConfirm() {
      if (this.claimAccelClaiming) return
      const gift = this.claimAccelGift
      const item = this.claimAccelTarget
      // #32 点击埋点（clickType=confirm）。放在请求之前：这是「点击」不是「结果」，
      // 领取失败/超时也照样算一次点击（与 #28/#30 的口径一致）
      this.reportClaimAccelPopupClick('confirm')
      if (!gift) return
      const token = ++this.claimAccelToken
      this.claimAccelClaiming = true
      console.log('[XunyouAccel] H5 加速前弹窗：领取并加速', { giftConfigId: gift.giftConfigId, giftType: gift.giftType })
      try {
        // 领取走共享福利态（福利横幅读的是同一份，领完横幅一起从福利态切走），
        // 但**不弹**「恭喜获得 N 天」的结果弹窗 —— 用户要的是继续加速（见 claimGiftForAccelLaunch）。
        // 该入口在订单成功返回后立即 resolve，二次刷新福利列表在后台继续，保证 5 秒窗口不被它的网络耗时侵占。
        const started = await claimGiftForAccelLaunch(gift)
        if (token !== this.claimAccelToken) return
        if (!started) {
          // 被共享的防重复提交挡下（同一时刻另一处入口已在领取）：不接管这一轮，让它自己收尾
          console.log('[XunyouAccel] H5 加速前弹窗：已有领取在途，本次不接管')
          this.claimAccelClaiming = false
          return
        }
        const waitControl = { cancel: null }
        this.claimAccelWaitCancel = () => waitControl.cancel?.()
        const ready = await waitForAccelRightAfterClaim({ store: this.$store, cancelRef: waitControl })
        if (token !== this.claimAccelToken) return
        this.claimAccelWaitCancel = null
        this.claimAccelVisible = false
        this.claimAccelClaiming = false
        if (!ready) {
          console.warn('[XunyouAccel] H5 加速前弹窗：5 秒内未等到权益，关窗并提示')
          this.$message({
            message: '请求失败，请稍后重试',
            type: 'error',
            duration: 2500,
            customClass: 'lg-message--error'
          })
          return
        }
        if (!item) return
        console.log('[XunyouAccel] H5 加速前弹窗：权益已生效，继续加速启动', { package: item.packageName })
        // 等一帧再启动加速：本弹窗关闭要恢复原生底部导航栏、过渡覆盖层打开要收起它，
        // 两条都写同一个原生开关（那边记的是「隐藏前是否可见」）。推到下一帧能保证
        // 「恢复（弹窗关闭）→ 收起（覆盖层打开）」的顺序 —— 反过来的话那份记录会被写坏，
        // 覆盖层卸载后原生底部导航栏就一直不再出现。
        this.$nextTick(() => this.startAccelWithRight(item))
      } catch (err) {
        if (token !== this.claimAccelToken) return
        // 领取请求失败：弹窗保持打开、按钮恢复可点，用户可以直接重试
        this.claimAccelClaiming = false
        console.warn('[XunyouAccel] H5 加速前弹窗：领取失败', err)
        this.$errorMessage(err?.message || '领取失败，请稍后重试')
      }
    },
    // 点卡片加速信息面板上的延时 / 丢包 / 时长 → 打开加速详情页（与点「加速中」按钮同一个去向）。
    // 区服那一项不在此列：它在模板上自带 @click.stop="handleCardServerClick"，事件不会冒泡到这里，
    // 所以点它只开区服滚轮，不会连带把详情页也打开。
    // item 由模板传入，仅用于 #21 的 gameName。
    handleAccelInfoOpen(item) {
      console.log('[XunyouAccel] H5 点击加速信息面板，打开加速详情页')
      this.reportAccelInfoAreaClick(item, 'accelInfo')
      this.accelInfoVisible = true
    },
    // 卡片加速信息面板里的「区服」入口 → 打开区服滚轮，并报 #21（clickType=switchServer）。
    // 包一层而不是在 handleAccelServerClick 里报：那个方法被详情页顶部的区服按钮共用
    //（@server-click），详情页里那个不是卡片上的按钮，不该算 #21。
    handleCardServerClick(item) {
      // 可切换区服 ≤1 个时入口是纯展示（箭头已隐藏、点击也没有后续动作），不报 #21：
      // 没有发生「切换区服」这个行为，报了会污染埋点。
      if (!this.showAccelAreaArrow) return
      this.reportAccelInfoAreaClick(item, 'switchServer')
      this.handleAccelServerClick()
    },
    // 详情页「停止加速」：只弹确认弹窗，不直接发请求。
    // 用户点「停止」才真正停止（见 handleAccelStopConfirmed）；点「取消」什么都不做 ——
    // 不停止、不弹提示、不关详情页，且一个桥接请求都不发（不是「发了不处理」）。
    // 这次点击同时是两条埋点的触发点（同一个动作、同一处上报，不要拆开）：
    // #26 点击停止加速按钮（只报游戏名，按钮上显示的加速时长是 UI 展示、不上报）、
    // #27 停止确认弹窗曝光（点按钮即弹出确认框）。
    handleAccelStop() {
      console.log('[XunyouAccel] H5 停止加速：弹确认弹窗')
      this.$dataReport('LZ_myGames', 'LZ_accelEndButtonClick', 'click', { gameName: this.accelGameName })
      this.stopConfirmVisible = true
      this.$dataReport('LZ_myGames', 'LZ_accelStopConfirmPopupShow', 'pv', { gameName: this.accelGameName })
    },
    // 停止加速确认弹窗「取消」（含点遮罩）：#28 点击埋点（clickType=cancel）。
    // 除上报外什么都不做：不停止、不关详情页、一个桥接请求都不发。
    handleAccelStopCancel() {
      console.log('[XunyouAccel] H5 停止加速：用户取消')
      this.reportStopConfirmPopupClick('cancel')
    },
    // 停止加速二次确认「停止」：调原生停止，成功才关详情页。
    handleAccelStopConfirmed() {
      console.log('[XunyouAccel] H5 停止加速：用户确认，调原生停止')
      // #28 点击埋点（clickType=confirm）。放在请求之前：这是「点击」不是「结果」，
      // 原生停止失败也照样算一次点击（失败只影响详情页是否关闭，见下面的 toast）
      this.reportStopConfirmPopupClick('confirm')
      stopAccel().then(data => {
        if (data && data.stopped === true) {
          // 只关详情页，**不做任何本地状态的乐观清理**：卡片的「加速中」、加速信息面板、计时
          // 全部由原生的 accel_state {established:false} 推送驱动，等它回流去改，避免 H5 与原生状态分叉。
          this.accelInfoVisible = false
          return
        }
        // 失败（SDK 未就绪 / 当前没在加速 / 桥接不可用）：详情页保持打开，只给一条明确反馈
        console.warn('[XunyouAccel] H5 停止加速失败', data)
        this.$message({
          message: '停止加速失败',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      })
    },
    // 详情页「打开游戏」：拉起该游戏并关闭详情页
    handleAccelOpenGame() {
      // accelGame 是从 gameList 里按包名反查出来的（列表变化时会为 null），取不到就回退
      // accelState 里原生推来的包名 —— 否则「加速中的游戏不在当前 gameList」时点了没反应。
      const game = this.accelGame
      const packageName = (game && game.packageName)
        || (this.accelState && this.accelState.packageName)
        || ''
      if (!packageName) {
        // 两个来源都拿不到包名时不调用也不报错，只留一条日志：这种状态下页面本来就该是关闭的
        console.log('[XunyouAccel] H5 打开游戏：拿不到包名，不处理')
        return
      }
      console.log('[XunyouAccel] H5 打开游戏', { packageName })
      this.reportLoadGameSdkOpenGame(game, packageName)
      StoreLZRunStoreApp(packageName)
      this.accelInfoVisible = false
    },
    // 区服入口（卡片加速信息面板 / 详情页顶部共用）：文案**始终显示**，但只有「可切换区服 > 1 个」
    // （= showAccelAreaArrow）时入口才有效：箭头显示、点击打开滚轮。
    // ≤1 个时箭头已隐藏，这里连点击一并忽略 —— 不打开滚轮、不补拉、不弹 toast，避免一个看起来
    // 不可点的文案给出「暂无可切换区服」这类提示。
    handleAccelServerClick() {
      if (!this.showAccelAreaArrow) {
        console.log('[XunyouAccel] H5 切换区服：可切换区服不足 2 个，忽略点击')
        return
      }
      console.log('[XunyouAccel] H5 切换区服：打开区服滚轮')
      this.areaWheelVisible = true
    },
    // 区服滚轮「确定」：进入二次确认（第 2 段），此时不做任何切换。
    // 弹窗组件的 close-on-confirm 传了 false，所以滚轮留在下面由二次确认这层继续用。
    handleAreaWheelConfirm() {
      const wheel = this.$refs.areaWheel
      const area = wheel ? wheel.getSelectedArea() : null
      if (!area) {
        // 正常情况下取不到：滚轮随弹窗 v-if 挂载，能点到「确定」说明它已挂上。
        // 留这条日志是为了万一 ref 没注册到（模板 ref 在插槽内容里）时能一眼定位，而不是静默什么都不发生。
        console.warn('[XunyouAccel] H5 切换区服：拿不到滚轮实例或没有选中项，直接关闭滚轮')
        this.areaWheelVisible = false
        return
      }
      // 选中的就是当前项：没有可切换的东西，直接退掉，不必弹二次确认。
      // 比对的是 accelAreaCurrentId —— 它和滚轮初始选中项用的是同一个值，
      // 所以「当前没有区服」时它等于补的那个「国服」项的 id，用户直接点确定就会被这里退掉。
      const currentId = this.accelAreaCurrentId
      // #22 区服选择上报（$dataReport 那行在 XunyouAreaWheel 里：滚轮自身不知道何时算「选定」，
      // 由这里在用户点「确定」时调用它的 reportSelectServer）。
      // 放在与当前区服比对之前 —— 用户确实做了「选择区服」这个动作，只是选中的是当前区服而已。
      // 去重：滚轮这层的「确定」不关弹窗（close-on-confirm=false），连点两次不能报两次
      if (!this.areaSwitchConfirmVisible && typeof wheel.reportSelectServer === 'function') {
        wheel.reportSelectServer()
      }
      if (String(area.id) === String(currentId)) {
        console.log('[XunyouAccel] H5 切换区服：选中的就是当前区服，直接关闭滚轮')
        this.areaWheelVisible = false
        return
      }
      console.log('[XunyouAccel] H5 切换区服：进入二次确认', { target: area })
      this.areaSwitchTarget = area
      this.areaSwitchConfirmVisible = true
    },
    // 切换区服二次确认「取消」（含点空白处）：滚轮与二次确认**两层一起关掉**，回到详情页。
    // 不切换区服、不发任何桥接请求、也不弹提示。（早期版本是「只退一层、回到滚轮」，已按裁定改为一次全退。）
    handleAreaSwitchCancel() {
      console.log('[XunyouAccel] H5 切换区服：二次确认取消，滚轮与确认两层一起关闭')
      this.areaWheelVisible = false
      // 刻意不在这里清 areaSwitchTarget：弹窗要淡出 0.24s，正文里插的就是它的名字，
      // 同步清掉会让淡出期间闪一下「切换到「」将切断当前加速…」。
      // 留着不会误用：每次开二次确认之前（handleAreaWheelConfirm）都会重新赋值。
    },
    // 切换区服二次确认「确定」：真正切换。
    // 两种选中项都走**切断 + 重新加速**这一条链路（restartAccel），区别只在带不带区服：
    // 选真实区服传区服名，选补的「国服」项（= 没有区服）传空串。
    // 为什么不分开：区服是建立加速隧道时定好的属性，只改字段不重建隧道新节点不会生效，
    // 所以「切到别的区服」和「切回没有区服」都得把这次加速整个重来一遍。
    // 也**不在这里重拉区服信息**：重连会走 established=false → true，
    // accelStartTimeMs 的 watch 会在重新建立后自动拉一次，显式再拉一次是多余的。
    handleAreaSwitchConfirmed() {
      const area = this.areaSwitchTarget
      this.areaWheelVisible = false
      if (!area) return
      // 补的「国服」项 id 是哨兵空串，正好就是原生要的「不带区服」语义；isDefault 只用来判别它是补的那一项
      const targetArea = area.isDefault ? NO_AREA_ID : area.id
      console.log('[XunyouAccel] H5 切换区服：切断并重新加速', { targetArea, isDefault: !!area.isDefault })
      restartAccel(targetArea).then(data => {
        if (data && data.success) return
        // 失败（SDK 未就绪 / 当前没有加速中的游戏 / 区服名非法 / 桥接不可用）：详情页保持打开，给一条明确反馈
        console.warn('[XunyouAccel] H5 切换区服失败', data)
        this.$message({
          message: '切换区服失败',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      })
    },
    // 过渡覆盖层播完（出场动画结束、覆盖层卸载）→ 这才拉起游戏。
    // 先取出并清空记录再拉起：连点两次时只拉起最后一次记录的包名，被覆盖的那次不重复拉起；
    // 中途离开页面时覆盖层不会 emit（beforeUnmount 已清掉出场定时器），这里也不会被调到。
    handleAccelTransitionFinished() {
      const packageName = this.pendingLaunchPackage
      this.pendingLaunchPackage = ''
      if (!packageName) return
      console.log('[XunyouAccel] H5 过渡动画播完，拉起游戏', { packageName })
      StoreLZRunStoreApp(packageName)
    },
    // 加速请求成功后主动向 native 补拉加速状态（兜底推送丢失）。
    //
    // 为什么需要：native 的 accel_state 推送是「即发即弃」——宿主侧那份推送回调绑定的 WebFragment
    // 若已失效（ViewPager 重建、进程跑久），推送会被**静默丢弃**（连日志都不打），H5 只能一直停在
    // 「加速启动」，加速信息面板也不出现。而 native 的 getAccelState 是实时查 SDK 的权威快照，
    // 主动拉取不依赖推送通道，所以这里补一道。
    //
    // 按固定间隔重试而不是只拉一次：回包只代表加速请求被受理，VPN 建立是异步的
    //（真机实测回包到 established 约 200~300ms，首次加速或切换测试服/正式服时可能更久），
    // 立刻补拉会读到「未加速」。
    //
    // 不登记定时器做卸载清理：窗口最长 2.4s，且写入的是全局 store 而非组件状态，组件卸载后继续跑无副作用。
    syncAccelStateAfterStart(item) {
      if (!item) return
      let attempt = 0
      const tick = () => {
        attempt += 1
        // 刻意不看 syncAccelStateFromNative 的返回值：它在「读到未加速/降级值」时同样返回 false，
        // 而回包那一刻 VPN 往往还没建立（真机约 200~300ms），拿它当终止条件会第一次就退出、
        // 永远等不到 established。这里只按「是否已对齐成加速中」与次数上限收尾。
        syncAccelStateFromNative()
        // 已对齐成「本游戏加速中」就停；否则继续等 VPN 建立
        if (this.isAccelerating(item) || attempt >= ACCEL_STATE_SYNC_MAX_ATTEMPTS) return
        setTimeout(tick, ACCEL_STATE_SYNC_INTERVAL_MS)
      }
      tick()
    },
    // 加速时长每秒走一次表。面板只在加速中显示，所以停止加速就立刻清掉定时器
    startAccelTimer() {
      this.stopAccelTimer()
      this.accelTimer = setInterval(() => {
        this.accelNow = Date.now()
        // 顺便看一眼面板数据还在不在更新：native 推送断了就由这里顶上来按秒补拉
        // （推送正常时它什么都不做，见 ensureAccelPanelFresh）
        ensureAccelPanelFresh()
      }, 1000)
    },
    stopAccelTimer() {
      if (this.accelTimer) {
        clearInterval(this.accelTimer)
        this.accelTimer = null
      }
    },
    // 主动补拉一帧面板数据（延时 / 丢包 / 折线）。三个时机都要拉：加速刚建立、回到游戏空间、打开详情页。
    // 只在加速刚建立时拉一次是不够的——那一刻采样线程才启动、第一帧还没出来，拿回的是 ready=false 的空壳，
    // 此后全靠 native 每秒推送；推送一旦丢失（页面不可见、接收者指向别的 WebView 等），卡片与详情页
    // 就永远停在占位值。三个时机任意一个补拉成功，界面就能自己恢复。
    primeAccelPanel() {
      syncAccelPanelFromNative()
    },
    // 向原生拉加速中游戏的区服信息（当前区服 + 可选列表）。加速开始时拉一次（见 accelStartTimeMs 的 watcher），
    // 之后区服入口只读这份数据，不再在点击时补拉。
    fetchAccelArea() {
      return getAccelAreaInfo().then(info => {
        this.accelArea = info
      })
    },
    // 注：卡片上原来还有一个内联「区服下拉」（toggleAccelArea / selectAccelArea / accelAreaOpen），
    // 已按用户要求删除 —— 卡片的区服入口与详情页的区服入口现在共用 handleAccelServerClick（滚轮 + 二次确认），
    // 切换动作也收敛到 handleAreaSwitchConfirmed，不要再按入口各写一份。
    toDownload() {
      this.$dataReport('LZ_myGames', 'LZ_jumpToRecommendClick', 'click')
      window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorRecommend')
    },

    /* ============ 迅游加速埋点（需求文档 3.2「游戏空间 · 加速启动链路」）============
       全部 category 都是 LZ_myGames，label 只有三种：pv 曝光 / click 点击 / report 结果。
       单参数平铺在 params 顶层，多参数一律放进 detail 的 JSON 字符串；一条埋点只写一处调用。
       各条上报点与需求文档的对应关系：#15/#16/#17/#19/#20/#21/#26/#27/#28/#29/#30/#31/#32。
       （#18 在 acceleratorTransition、#22 在 XunyouAreaWheel、#23~#25 在 acceleratorInfo。
         #31/#32 就是本组件新增的「加速前领取提醒弹窗」——需求文档里它的 popupType 还有一档
         「付费引导 payGuide」，那属于另一条尚未开发的路径，本弹窗不涉及、不要顺手上报。） */

    // #15 加速游戏卡片曝光（pv）。触发条件严格对齐卡片上的按钮：
    // ① 卡片进入可见范围（轮播的当前卡片，切卡/列表刷新时触发）；
    // ② 卡片上确实有「加速启动」按钮 —— 即 item.supportAccel（原生按迅游 SDK 支持列表回填，
    //    旧客户端没有该字段）且客户端开了迅游入口（$isXunyouEnabled）；
    // ③ 该游戏当前不在加速中（加速中时按钮已变成「加速中」，这种情况不报）。
    // 去重：同一张卡在本页面生命周期内只报一次，反复滑进滑出不重复上报（需求文档 1.2）。
    reportAccelCardShow() {
      if (!this.$isXunyouEnabled) return
      const item = this.gameList[this.currentIndex]
      if (!item || !item.supportAccel) return
      if (this.isAccelerating(item)) return
      const key = item.packageName || item.appName
      if (!key || this.reportedCardShowKeys[key]) return
      this.reportedCardShowKeys[key] = true
      console.log('[XunyouAccel] H5 #15 加速游戏卡片曝光', { gameName: item.appName })
      this.$dataReport('LZ_myGames', 'LZ_accelGameCardShow', 'pv', { gameName: item.appName })
    },
    // #16 点击加速启动按钮（click）。不论后续成功或失败都报（含「切换加速游戏」确认后的那次，见 #30）。
    // 去重见 ACCEL_START_CLICK_DEDUP_MS：连点的第二次点击会把第一次的请求顶掉、拿不到配对的 #17，
    // 报出来只会让「点击 → 请求成功」的漏斗对不上。
    reportStartButtonClick(item) {
      const key = (item && (item.packageName || item.appName)) || ''
      const now = Date.now()
      if (key && now - (this.lastStartClickAt[key] || 0) < ACCEL_START_CLICK_DEDUP_MS) {
        console.log('[XunyouAccel] H5 #16 点击去重，跳过重复点击', { gameName: item && item.appName })
        return
      }
      if (key) this.lastStartClickAt[key] = now
      console.log('[XunyouAccel] H5 #16 点击加速启动按钮', { gameName: item && item.appName })
      this.$dataReport('LZ_myGames', 'LZ_accelStartButtonClick', 'click', {
        gameName: (item && item.appName) || ''
      })
    },
    // #17 加速请求成功（report）/ #20 加速失败（report）：同一次回包二选一，只在此处上报。
    // res 是 nativeCall 的原始返回（JSON 字符串或对象），解析失败一律当失败（别让解析异常
    // 把调用方的 then 变成 rejected、静默吞掉后面的成功判定）。
    // 返回值 = 解析后的结果对象（解析失败/为空时 null），调用方仍按原来的 data.success 判定继续走。
    reportAccelStartResult(item, res) {
      let data = res
      if (typeof res === 'string') {
        try {
          data = JSON.parse(res)
        } catch (e) {
          console.warn('[XunyouAccel] H5 reportAccelStartResult 加速结果解析失败', res, e)
          data = null
        }
      }
      const gameName = (item && item.appName) || ''
      if (data && data.success === true) {
        // 置位 #19 的准入标记：只有本页面生命周期内刚成功发起过一次加速，原生随后推来的
        // 「加速中」才当作本次加速成功上报（见 reportAccelSuccess）
        this.accelStartPending = true
        console.log('[XunyouAccel] H5 #17 加速请求成功', { gameName })
        this.$dataReport('LZ_myGames', 'LZ_accelStartRequestSuccess', 'report', { gameName })
      } else {
        // 本次请求失败：不会再等来同一段的「加速中」推送，把 #19 的准入标记清掉
        this.accelStartPending = false
        const error = this.buildAccelFailError(data)
        console.log('[XunyouAccel] H5 #20 加速失败', { gameName, error })
        this.$dataReport('LZ_myGames', 'LZ_accelFail', 'report', {
          detail: JSON.stringify({ gameName, error })
        })
      }
      return data
    },
    // #20 的 error 口径（需求文档 3.2 #20）：回调返回什么就上报什么 —— 有错误码报错误码，
    // 另有错误原因则按「错误码: 错误原因」一并带上。
    // 原生侧目前只回 {success:false, code:N}（见 lz_android_18_xunyou WebCallJavaInterface），
    // 所以实际值形如 "1000"；桥接不可用时 accelerateStart resolve 的是 undefined，此时用 unknown 兜底。
    buildAccelFailError(data) {
      if (!data || typeof data !== 'object') return 'unknown'
      const code = data.code ?? data.errorCode
      const hasCode = code !== undefined && code !== null && code !== ''
      const message = data.message || data.errorMsg || data.msg || data.error || ''
      if (hasCode && message) return `${code}: ${message}`
      if (hasCode) return String(code)
      return message || 'unknown'
    },
    // #19 加速成功（report）：原生推来「加速中」状态（即 SDK 加速成功的回调）时上报。
    // 两个前提：① 本页面生命周期内刚成功发起过一次加速请求（accelStartPending，
    // 由 #17 置位；否则「进来时就已经在加速」的存量状态会被误报成本次加速成功）；
    // ② 同一段加速（包名 + 本次起始时刻）只报一次，原生的重复推送不重复上报。
    reportAccelSuccess(state) {
      if (!state || !state.established || !state.packageName) return
      if (!this.accelStartPending) return
      const key = `${state.packageName}|${state.startTimeMs}`
      if (this.reportedAccelSuccessKey === key) return
      this.reportedAccelSuccessKey = key
      // 消费掉准入标记：同一段加速的后续推送不再报（再次加速时会由 #17 重新置位）
      this.accelStartPending = false
      const gameName = this.gameNameOfPackage(state.packageName)
      console.log('[XunyouAccel] H5 #19 加速成功', { gameName })
      this.$dataReport('LZ_myGames', 'LZ_accelSuccess', 'report', { gameName })
    },
    // #21 卡片加速信息区 / 区服按钮 / 加速中按钮点击（click）。三个 clickType 去向不同：
    // accelInfo 加速信息区域 → 加速详情页；switchServer 区服按钮 → 区服选择页（不是详情页）；
    // speedingUp 加速中按钮 → 加速详情页。（本埋点与 #26 是两个不同的按钮，不会双报。）
    reportAccelInfoAreaClick(item, clickType) {
      const gameName = (item && item.appName) || ''
      console.log('[XunyouAccel] H5 #21 加速信息区点击', { gameName, clickType })
      this.$dataReport('LZ_myGames', 'LZ_accelInfoAreaClick', 'click', {
        detail: JSON.stringify({ gameName, clickType })
      })
    },
    // 按包名反查游戏名：#19 只能从原生推来的包名反查（游戏已不在本机列表时退回包名，
    // gameName 是必填参数，不能报空）
    gameNameOfPackage(packageName) {
      const game = this.gameList.find(g => g.packageName === packageName)
      return (game && game.appName) || packageName || ''
    },
    // #11 旧埋点 LZ_loadGameSdkCreateTask（label 是空串，不是漏填）：这条原本挂在「下载类按钮」上，
    // 但它的用途是让数据侧知道**用户打开了游戏**；加速监控页的「打开游戏」同样是打开游戏，所以这里补一条。
    // 口径：plateName 固定「加速监控页面」、source=PAD7、statePage=2（打开）；
    // 其余字段沿用 drinfo() 的同口径（source_p / firstLocal~thirdLocal / skuName / softID / lenovoid）。
    reportLoadGameSdkOpenGame(game, packageName) {
      const detail = {
        source_p: this.$route.query.source_p || '',
        source: 'PAD7',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        // 非详情（Excel 取值：1.详情页 2.非详情），需求方指定
        type: 2,
        plateName: '加速监控页面',
        // 游戏可能已不在本机列表里（accelGame 为 null），沿用 gameNameOfPackage 的包名兜底
        skuName: this.gameNameOfPackage(packageName),
        softID: (game && game.softId) || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : '',
        stateGame: 1,
        statePage: 2
      }
      console.log('[XunyouAccel] H5 #11 加速监控页打开游戏', detail)
      // typeerr 是成功态的空占位：仓库内各下载按钮的实现都是这个写法（AbShapeDownloadButton / DownloadButton 等），
      // 只有失败时才填 errortype/errormess。本埋点只报「打开游戏」这个动作，恒为成功态。
      this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
        detail: JSON.stringify(detail),
        status: 1,
        typeerr: JSON.stringify({ errortype: '', errormess: '' })
      })
    },
    // #28 停止加速确认弹窗点击（click）：confirm 确认停止 / cancel 取消（含点遮罩）。
    // 同一条链路上的 #26（点详情页停止按钮）与 #27（确认弹窗曝光）在 handleAccelStop 里上报，
    // 本方法只负责弹窗内部的这次点击，游戏名统一用正在加速的那个（accelGameName）。
    reportStopConfirmPopupClick(clickType) {
      const gameName = this.accelGameName
      console.log('[XunyouAccel] H5 #28 停止确认弹窗点击', { gameName, clickType })
      this.$dataReport('LZ_myGames', 'LZ_accelStopConfirmPopupClick', 'click', {
        detail: JSON.stringify({ gameName, clickType })
      })
    },
    // #29 切换加速游戏确认弹窗曝光（pv）：已在加速 A 时点 B 的「加速启动」弹出该弹窗时上报
    reportSwitchGamePopupShow(item) {
      const currentName = this.accelGameName
      const switchName = (item && item.appName) || ''
      console.log('[XunyouAccel] H5 #29 切换游戏弹窗曝光', { currentName, switchName })
      this.$dataReport('LZ_myGames', 'LZ_accelSwitchGamePopupShow', 'pv', {
        detail: JSON.stringify({ currentName, switchName })
      })
    },
    // #30 切换加速游戏确认弹窗点击（click）：confirm 确认 / cancel 取消（含点遮罩）。
    // 点确认时调用方还要继续走 handleAccelStart，由它补报 #16、请求成功后再报 #17（需求文档已确认两条都报）；
    // 点取消则两条都不报。
    reportSwitchGamePopupClick(clickType, target) {
      const currentName = this.accelGameName
      const switchName = (target && target.appName) || ''
      console.log('[XunyouAccel] H5 #30 切换游戏弹窗点击', { currentName, switchName, clickType })
      this.$dataReport('LZ_myGames', 'LZ_accelSwitchGamePopupClick', 'click', {
        detail: JSON.stringify({ currentName, switchName, clickType })
      })
    },
    // #31 加速前弹窗曝光（pv）：弹窗真正显示出来时才报（由 claimAccelVisible 的 watcher 调用，
    // 不是弹窗组件挂载时 —— 弹窗是点了「加速启动」才弹的，组件一直挂在页面里）。
    // 去重：一次展示只报一条（反复开关不算，见 watcher 里的复位）；
    // popupType 用打开那一刻的快照（领取成功后福利态会翻，实时值可能是错的）。
    reportClaimAccelPopupShow() {
      if (this.claimAccelShowReported) return
      this.claimAccelShowReported = true
      const popupType = this.claimAccelPopupType
      console.log('[XunyouAccel] H5 #31 加速前弹窗曝光', { popupType })
      this.$dataReport('LZ_myGames', 'LZ_accelBeforePopupShow', 'pv', { popupType })
    },
    // #32 加速前弹窗点击（click）：confirm=领取并加速 / cancel=取消（含点遮罩）。
    // 与 #31 同源取 popupType 快照。
    reportClaimAccelPopupClick(clickType) {
      const popupType = this.claimAccelPopupType
      console.log('[XunyouAccel] H5 #32 加速前弹窗点击', { popupType, clickType })
      this.$dataReport('LZ_myGames', 'LZ_accelBeforePopupClick', 'click', {
        detail: JSON.stringify({ popupType, clickType })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.no-game {
  height: 100%;
  margin: 0 auto;

  .no-game-iocn {
    width: 120px;
    height: 120px;
  }

  .left-container .no-game-iocn {
    width: 100px;
    height: 100px;
  }

  .no-game-iocn2 {
    width: 7px;
    height: 11px;
  }

  .banner-placeholder &::after {
    display: none;
  }
  .no-game-placeholder {
    height: 76.5625vw;
    width: 57.5vw;
    flex-direction: column;
    justify-content: center;
    background-size: inherit;
    background-image: url('../image//no-game-v.png');
  }

  .no-game-placeholder-h {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    color: #fff;
    overflow: hidden;
    position: relative;
  }
}

.game-snap-carousel {
  position: relative;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 20px;
  overflow: hidden;
}

.long-light-top {
  width: 879px;
  height: 53px;
  position: absolute;
  top: -5px;
  right: 22px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-image: url('../image/long-light.png');
  z-index: 1;
}

.long-light-bottom {
  width: 879px;
  height: 102px;
  position: absolute;
  bottom: 10px;
  left: 0;
  transform: translateX(-4%);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-image: url('../image/long-light.png');
  z-index: 1;
}

.top-banner {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin: 0 auto;
  padding: 10px 0 50px;
  max-width: 1400px;
  display: flex;
  align-items: center;
  transition: width 5s linear, height 5s linear;
}

.swiper-box {
  width: 100%;
  max-width: 1400px;
  height: 219px;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}
.swiper-list {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.swiper-item {
  position: absolute;
  transition: all 0.3s ease;
  z-index: 1;
  opacity: 0;
  transform: scale(0);
  cursor: pointer;
}
.swiper-item.prev {
  transform: translateX(-30%) scale(0.8);
  z-index: 2;
  opacity: 0.3;
}

.swiper-item.active {
  transform: translateX(0) scale(1);
  z-index: 10;
  opacity: 1;

  .banner-item {
    .banner-placeholder {
        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          width: 100%;
          height: 90px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #686B76 100%);
      }
    }
  }
}
.swiper-item.next {
  transform: translateX(45%) scale(0.8);
  z-index: 2;
  opacity: 0.4;
}

.banner-item {
  flex-shrink: 0;
  position: relative;
  height: 219px;
  width: 546px;
  display: flex;
  .border-box {
    z-index: 3;
    left: 0;
    top: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    pointer-events: none;
  }
  .left-container {
    width: calc(100% - 106px);
    position: relative;
    height: 100%;
    .banner-placeholder {
      clip-path: url(#customClipcc);
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 0;
    }
    .border-box-horizontal {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background-image: url('../image/horizontal-gamecard-bg.png');
      background-size: cover;
      pointer-events: none;
      z-index: 3;
    }
  }
  .right-container {
    height: 100%;
    width: 152px;
    position: absolute;
    right: 0px;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    background-image: url('../image/game-time-bg.png');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;

    .game-info {
      font-size: 12px;
      position: absolute;
      right: 40px;
      top: 20px;
    }

    .game-time {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .game-label {
      font-size: 13px;
      opacity: 0.4;
    }
  }
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-end;
  color: #fff;
  overflow: hidden;
  position: relative;
  border-top-right-radius: 4.2%;
  border-bottom-left-radius: 4.4%;
  border-top-left-radius: 4px;
  border-bottom-right-radius: 4px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

.banner-info {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 12px;
  padding: 0 65px 0 29px;
  box-sizing: border-box;

  .banner-info-box {
    width: calc(100% - 170px);
  }

  .banner-name {
    letter-spacing: 1px;
    font-size: 20px;
    font-weight: 800;
    color: #fff;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 100%;
    text-shadow: 0 4px 4px rgba(0, 0, 0, 0.50);
  }

  .time-style-labbel {
    background: linear-gradient(22deg, rgba(217, 217, 217, 0.30) 35.36%, rgba(115, 115, 115, 0.00) 168.66%);
    height: 16px;
    width: 6px;
    margin-right: 4px;
  }

  .time-box {
    display: flex;
    align-items: center;
    margin-top: 4px;
    transform: skewX(-10deg);
  }

  .time-label {
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    margin-right: 6px;
  }

  .time-value {
    font-size: 24px;
    font-weight: 700;
    color: #eaf7ff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
}

/* 立即启动 / 加速启动 按钮容器：卡片内的间距在“迅游版本”下由下方 orientation 规则覆盖 */
.game-button,
.game-button-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 游戏卡片按钮（立即启动/立即更新 + 加速启动/加速中）——仅 $isXunyouEnabled（客户端 ≥ 2.0.18）生效。
   新样式全部挂在 .is-xunyou 下，低版本卡片保持旧样式与旧横向布局；
   共享组件（GameDownloadButton / AbShapeDownloadButtonPad）零改动，卡片内重样式用高特异性
   :deep() 覆盖（避免依赖样式注入顺序，不用 !important）。
   三态 × 两布局的元素坐标依据：
   .trellis/tasks/09-17-gamespace-accel-launch-btn/research/accel-btn-assets.md §3/§4 */

/* 横屏（pad 卡）：斜切形底，两按钮各 110×36、相邻无 gap，名称在左 */
@media (orientation: landscape) {
  .game-snap-carousel.is-xunyou {
    // 按钮行由 158px 变为 220px（110×2），名称区需要让出这 50px。
    // min-width:0 解除 flex 项默认的 min-content 下限，否则收缩被卡住会溢出卡片，
    // 名称则由 .banner-name 自带的 ellipsis 收尾。
    .banner-item.landscape .banner-info .banner-info-box {
      min-width: 0;
    }

    // 按钮区右边距：设计稿里「按钮右边缘 → 右侧斜切面板左边缘」是 19.76 设计 px
    // （按钮底形右下角 -11102.26，面板斜边在按钮中线处 -11082.50）。按钮尺寸是跨端 1:1 的
    // （110 设计 px = 110 CSS px），所以 H5 也取这个值。基础规则给 .banner-info 的
    // padding-right 是 16%（= 105.6），落到面板上只剩约 30px、比设计宽 10px，收到 14.4%。
    .banner-item.landscape .banner-info {
      padding-right: 14.4%;
    }

    .banner-item.landscape .banner-info .game-button-wrap {
      gap: 0;
      flex-shrink: 0;
      // 固定为「两个按钮」的占位宽度，卡片右侧不会因为少一个按钮而失衡；按钮自身仍是 110×36。
      // 排布用 flex-end（不是 center）：双按钮时两个按钮正好占满 220、没有剩余空间，两者等价；
      // 只有「立即启动」一个按钮时（游戏不支持迅游加速），flex-end 让按钮贴住容器右边 ——
      // 设计稿的单按钮容器是 126 宽（= 8 + 110 + 8），右边缘与双按钮容器（236 宽）对齐。
      // 低版本走上面 .game-button-wrap 的基础规则（宽度自适应、本来就贴右），不受这里影响。
      width: 220px;
      justify-content: flex-end;

      :deep(.GameDownloadButton) {
        flex-shrink: 0;
        width: 110px;
        height: 36px;
      }

      // 卡片内的「立即启动/立即更新」：浅色态，无闪电，两组网点
      :deep(.common-abnomal-btn) {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 110px;
        height: 36px;
        line-height: 36px;
        font-size: 14px;
        color: #162233;
        text-align: center;
        border: 0 none;
        border-radius: 0;
        background: url('../image/xunyou-btn-shape-pad.svg') no-repeat center / 100% 100%;

        .text {
          width: 100%;
          height: auto;
          line-height: 1;
        }

        // 覆盖会一并压掉组件自带的 :active 按下反馈（那套是换 PNG + 白字），
        // 这里按加速按钮同样的做法补一个轻微反馈，避免按下毫无反应
        &:active {
          opacity: 0.8;
        }

        // 网点：① 右上 5×2；② 左下 rotate(-75deg)
        &::before,
        &::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 5px;
          background: url('../image/xunyou-btn-dots.svg') no-repeat center / 14px 5px;
          pointer-events: none;
        }

        &::before {
          left: 89px;
          top: 3.46045px;
        }

        // 旋转网点按「元素自身 14×5 的盒子」定位（绕中心旋转），不按包围盒
        &::after {
          left: 3.2265px;
          top: 21.9085px;
          transform: rotate(-75deg);
        }
      }

      // 下载态按钮（等待中 / 下载中 / 暂停下载 / 安装中）：设计稿 617:11056 / 617:10974 / 617:11049。
      // 底形与同屏「立即启动」是同一个斜切形，差别只在填充换成 rgba(0,0,0,.4)。
      // 进度不再用组件内联的旧 SVG（那个 viewBox 是 149×40、与 110×36 的盒子对不齐，
      // 没法只靠 CSS 挪正），改由 ::after + --lz-progress 重画。
      :deep(.abnormal-shape-btn) {
        position: relative;
        display: block;
        width: 110px;
        height: 36px;
        background: url('../image/xunyou-btn-shape-pad-download.svg') no-repeat center / 100% 100%;

        // 旧进度 SVG（#505050 → #6d7174）整体弃用
        > svg {
          display: none;
        }

        // 进度填充：左 #CACACA → 右 #EDF8FF。元素宽度就是「已下载的那一段」，渐变正好铺满它
        // （设计稿里渐变的 x1/x2 就是 0..填充宽，不是整个按钮宽），内阴影也因此落在填充条
        // 自己身上 —— 设计稿就是把 inset shadow 挂在填充层上的；进度为 0 时整层宽 0、不渲染，
        // 所以「等待中 / 安装中」不会多出一圈本不该有的内阴影。
        //
        // 斜切形用一张**纯白不透明**的同形素材当 alpha mask。别拿底形素材
        // （xunyou-btn-shape-pad-download.svg）兼任：它的填充是 fill-opacity="0.4"，
        // 而 fill-opacity 会把 alpha 一起降到 0.4，再乘这里的 opacity:0.4 就是乘了两次，
        // 填充会暗到几乎看不见（有效透明度 ≈0.16，只剩四成）。设计稿本身就是这么拆的：
        // 几何（mask，fill="white"）与观感（底形 / 渐变）分开两张。
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: var(--lz-progress, 0%);
          height: 100%;
          background: linear-gradient(90deg, #CACACA 0%, #EDF8FF 100%);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
          opacity: 0.4;
          pointer-events: none;
          // mask 要按**按钮实际尺寸**（110×36）摆放并靠左对齐，不能写成 `center / 100% 100%`：
          // 那会把 mask 的盒子撑成进度条那个窄盒子，而素材是 110×36、默认
          // preserveAspectRatio="xMidYMid meet"，会被等比缩进去并居中（44×14.4），
          // 斜边对不上按钮、填充只剩中间一条带。
          -webkit-mask: url('../image/xunyou-btn-shape-pad-download-mask.svg') no-repeat left center / 110px 100%;
          mask: url('../image/xunyou-btn-shape-pad-download-mask.svg') no-repeat left center / 110px 100%;
        }

        .text {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 14px;
          font-weight: 700;
          // 旧样式的 2px 字距在设计稿里没有（「等待中」文字宽 42 = 3×14）
          letter-spacing: normal;
          color: #fff;
          // 压过 ::after 进度层，保证暂停/继续的点击命中文字这一层
          z-index: 1;
        }
      }
    }

    .banner-item.landscape .accel-btn {
      position: relative;
      flex-shrink: 0;
      width: 110px;
      height: 36px;
      font-size: 14px;
      font-weight: 700;
      color: #162233;
      cursor: pointer;
      background: url('../image/xunyou-btn-shape-pad.svg') no-repeat center / 100% 100%;

      // 网点：仅右上 5×2（加速启动与加速中同位置）
      &::before {
        content: '';
        position: absolute;
        left: 89px;
        top: 3.46045px;
        width: 14px;
        height: 5px;
        background: url('../image/xunyou-btn-dots.svg') no-repeat center / 14px 5px;
        pointer-events: none;
      }

      // 闪电是 16×16 的 icon/闪电 组件（主组件 465:14808），两态的横坐标不同：
      // 加速启动 @ left 15.75、加速中 @ left 19（见下方 &.is-accelerating），top 都是 10
      .accel-btn-icon {
        position: absolute;
        left: 15.75px;
        top: 10px;
        width: 16px;
        height: 16px;
        background: url('../image/xunyou-btn-lightning.svg') no-repeat center / 16px 16px;
      }

      // 文案居中框：设计稿 465:14854「加速启动」的文字框是 31.75~87.75（中心 59.75）。
      // 「加速中」只有三个字，设计稿 326:24543 给的是 35~77（中心 56），两态共用这一个框
      // 会让「加速中」整体右移、与左侧闪电拉开，所以下面 &.is-accelerating 里单独覆盖。
      //
      // 垂直居中用 flex + line-height:1，与卡片里「立即启动」的 .text 同一套做法。
      // 原先写 top:0 + line-height:36px 让行框撑满 36，真机实测字形落在按钮中心上方
      // 1.0px，而同屏的「立即启动」只偏上 0.4px —— 两个按钮并排能看出高低差。换成 flex
      // 居中后两者一致；这点偏差来自 Android 中文字体的 metrics，line-height 越大越明显。
      .accel-btn-text {
        position: absolute;
        left: 31.75px;
        right: 22.25px;
        top: 0;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        white-space: nowrap;
      }

      // 横屏的下拉箭头已含在底形素材里
      .accel-btn-arrow {
        display: none;
      }

      &:active {
        opacity: 0.8;
      }

      &.is-accelerating {
        color: #6BA3FF;
        background-image: url('../image/xunyou-btn-shape-pad-active.svg');

        // 加速中的闪电比加速启动右移 3.25px（19 vs 15.75），因为文案少一个字
        .accel-btn-icon {
          left: 19px;
          background-image: url('../image/xunyou-btn-lightning-active.svg');
        }

        // 三字文案换成自己的居中框：35~77（中心 56），比加速启动的框窄 14px 且整体偏左。
        // 用它才能让「加」字与闪电保持设计稿的间距，而不是被四字框推着往右跑。
        .accel-btn-text {
          left: 35px;
          right: 33px;
        }
      }
    }
  }
}

/* 竖屏（phone 卡）：圆角矩形底（纯 CSS），卡片改纵向布局，按钮整行等宽等高 36 */
@media (orientation: portrait) {
  .game-snap-carousel.is-xunyou {
    // 名称/时长块在上、按钮整行在下
    .banner-item.portrait .banner-info {
      flex-direction: column;
      align-items: stretch;
      padding: 0;
      // 基础规则留了 20px 底边距，会让按钮行离卡片底部 20px；清零后由按钮行自身的 8px 内边距
      // 决定间距 —— 单按钮时按钮底/左右距卡片边缘 8px，双按钮时同理且两按钮间也 8px
      margin-bottom: 0;

      .banner-info-box {
        width: 100%;
        padding: 0 16px;
      }

      .banner-name {
        width: 100%;
      }

      // 加速信息面板：设计稿 234:5453 是「卡片左右各留 8px、高 32」的横条。
      // .banner-info-box 自身有 16px 左右内边距（给游戏名留的），面板要比它宽，
      // 这里用负 margin 抵消掉多出来的 8px，不动 banner-info-box，免得游戏名跟着移位。
      .banner-info-box .accel-info.portrait {
        height: 32px;
        margin: 12px 0px 0 0px;
        padding: 0 8px;
      }
    }

    .banner-item.portrait .banner-info .game-button {
      width: 100%;
      gap: 8px;
      padding: 16px;
      // 只有一个按钮时也要拉长占满整行（文字由按钮自身居中），不能回收成原宽度
      justify-content: center;
      // 旧样式会把单个按钮缩到 0.85，整行布局后必须取消
      transform: none;

      :deep(.GameDownloadButton) {
        flex: 1 1 0;
        min-width: 0;
      }

      // 卡片内的「立即启动/立即更新」：浅色态，无闪电，两组网点
      :deep(.common-abnomal-btn) {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 36px;
        line-height: 36px;
        font-size: 14px;
        color: #162233;
        text-align: center;
        border: 0.5px solid #F5F5F5;
        border-radius: 4px;
        background: linear-gradient(180deg, rgba(245, 245, 245, 0.48) 0%, #F5F5F5 100%);

        .text {
          width: 100%;
          height: auto;
          line-height: 1;
        }

        // 覆盖会一并压掉组件自带的 :active 按下反馈（那套是换 PNG + 白字），
        // 这里按加速按钮同样的做法补一个轻微反馈，避免按下毫无反应
        &:active {
          opacity: 0.8;
        }

        // 网点：① 右上 5×2；② 左侧竖排 rotate(90deg)
        &::before,
        &::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 5px;
          background: url('../image/xunyou-btn-dots.svg') no-repeat center / 14px 5px;
          pointer-events: none;
        }

        &::before {
          right: 4px;
          top: 3.04px;
        }

        // 旋转网点按「元素自身 14×5 的盒子」定位（绕中心旋转），不按包围盒
        &::after {
          left: 0;
          top: 15.5px;
          transform: rotate(90deg);
        }
      }

      // 下载态按钮（等待中 / 下载中 / 暂停下载 / 安装中）：设计稿 617:11063 / 617:10987 / 617:10992。
      // 与同屏「立即启动 / 加速启动」同底形（圆角矩形 + 0.5px 描边 + 纯 CSS），
      // 差别只在填充是 rgba(0,0,0,.4) 这样一个半透明深色，而不是浅色渐变。
      // 竖屏的进度是纯矩形，不需要横屏那套 mask，靠 overflow 跟着圆角一起裁。
      :deep(.abnormal-shape-btn) {
        position: relative;
        display: block;
        width: 100%;
        height: 36px;
        background: rgba(0, 0, 0, 0.4);
        border: 0.5px solid #F5F5F5;
        border-radius: 4px;
        overflow: hidden;

        // 旧进度 SVG（#505050 → #6d7174）整体弃用
        > svg {
          display: none;
        }

        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          // 与横屏同一套画法（元素宽度 = 已下载的那一段、渐变铺满它、内阴影落在填充条上）；
          // 竖屏是纯矩形，不需要横屏那层 mask，靠上面的 overflow + border-radius 裁形。
          width: var(--lz-progress, 0%);
          height: 100%;
          background: linear-gradient(90deg, #CACACA 0%, #EDF8FF 100%);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
          opacity: 0.4;
          pointer-events: none;
        }

        .text {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-size: 14px;
          font-weight: 700;
          // 旧样式的 2px 字距在设计稿里没有（「等待中」文字宽 42 = 3×14）
          letter-spacing: normal;
          color: #fff;
          // 压过 ::after 进度层，保证暂停/继续的点击命中文字这一层
          z-index: 1;
        }
      }
    }

    .banner-item.portrait .accel-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      // 设计稿 294:5165 的内容行是「闪电 16 + 2 + 文案 42 + 2 + 箭头 14 = 76」，
      // 居中于 115.5 宽按钮后起点正好落在 19.75，与设计稿的闪电 x 一致
      gap: 2px;
      flex: 1 1 0;
      min-width: 0;
      height: 36px;
      font-size: 14px;
      font-weight: 700;
      color: #162233;
      cursor: pointer;
      border: 0.5px solid #F5F5F5;
      border-radius: 4px;
      background: linear-gradient(180deg, rgba(245, 245, 245, 0.48) 0%, #F5F5F5 100%);

      // 网点：① 左下 5×2；② 右侧竖排 rotate(90deg)（按钮 flex:1、宽度会变，故按 right 定位）
      &::before,
      &::after {
        content: '';
        position: absolute;
        width: 14px;
        height: 5px;
        background: url('../image/xunyou-btn-dots.svg') no-repeat center / 14px 5px;
        pointer-events: none;
      }

      &::before {
        left: 4px;
        bottom: 2.56px;
      }

      // 旋转网点按「元素自身 14×5 的盒子」定位（绕中心旋转），不按包围盒
      &::after {
        right: 0.6px;
        top: 15.5px;
        transform: rotate(90deg);
      }

      .accel-btn-icon {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        background: url('../image/xunyou-btn-lightning.svg') no-repeat center / 16px 16px;
      }

      .accel-btn-text {
        white-space: nowrap;
      }

      .accel-btn-arrow {
        flex-shrink: 0;
      }

      &:active {
        opacity: 0.8;
      }

      &.is-accelerating {
        color: #6BA3FF;
        border-color: #3887FF;
        background: linear-gradient(180deg, rgba(56, 135, 255, 0.08) 0%, rgba(56, 135, 255, 0.4) 100%), #162233;

        .accel-btn-icon {
          background-image: url('../image/xunyou-btn-lightning-active.svg');
        }
      }
    }
  }
}

/* 底部列表样式 */
.snap-list {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 60px;
}

.snap-list-container {
  max-width: 1112px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 0 auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.snap-list-wrapper {
  display: flex;
  min-width: max-content;
  align-items: center;
  overflow: hidden;
  padding-bottom: 40px;
  padding-right: 20px;
}

.snap-item {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  margin-right: 50px;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 14px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  opacity: 0.5;
  &.active {
    width: 70px;
    height: 70px;
    opacity: 1;
  }

  &:last-child {
    margin-right: 0;
  }
}

// 倒影效果
.snap-item::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;
  z-index: -1;
  margin-top: 5px;
  filter: blur(2px);
  transform: scaleY(-1) skewY(0.8deg);
  border-radius: 14px;
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0) 35%);
  mask-image: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0) 35%);
  background-image: inherit, linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 35%);
  background-blend-mode: overlay;
  opacity: 0.48;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* 竖屏样式 */
@media (orientation: portrait) {
  .game-snap-carousel.is-pad-device.is-xunyou {
    position: relative;
    top: var(--pad-portrait-game-space-offset-y, 0px);
  }

  .game-snap-carousel {
    .long-light-container {
      display: none;
    }

    .banner-item.landscape {
      display: none;
    }

    .banner-item.portrait {
      display: block;
    }

    .no-game-content.landscape {
      display: none;
    }

    .no-game-content.portrait {
      display: block;
    }

    .no-game {
      margin-top: 10px;
    }

    .top-banner {
      margin: 0 auto;
      padding: 26px 0 60px;
      box-sizing: border-box;

      .swiper-box {
        height: 76.5625vw;
        width: 100%;
      }
    }

    .banner-placeholder::after {
      // 跟随卡片高度等比缩放（卡片高 76.5625vw），不再用固定 111px
      height: 45%!important;
      background:linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #686B76 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, #000 100%)!important;
    }

    .banner-item {
      height: 76.5625vw;
      width: 57.5vw;

      .border-box {
        background-image: url('../image/vertical-gamecard-bg.png');
      }

      .banner-info {
        padding: 0 20px;
        box-sizing: border-box;
      }
    }

    .swiper-item.next {
      transform: translateX(30%) scale(0.8);
    }

    &.handHeldDevice {
      .game-button {
        transform: scale(0.85);
      }

      .banner-info .banner-info-box {
        width: calc(100% - 135px);
      }
    }
  }
}

/* 横屏样式 */
@media (orientation: landscape) {
  .game-snap-carousel {
    .long-light-container {
      display: block;
    }

    // 横屏下顶部光效整体下移，与横屏卡片的排版对齐
    .long-light-top {
      top: 51px;
    }

    .banner-item.portrait {
      display: none;
    }

    .banner-item.landscape {
      display: block;
    }

    .no-game-content.portrait {
      display: none;
    }

    .no-game-content.landscape {
      display: block;
    }

    // 横板
      .no-game {
        margin-top: 40px;

        .banner-item {
          width: 778px;
          height: 313px;

          .left-container {
            width: 626.658px;
            height: 310.571px;
          }

          .right-container {
            width: 217.157px;
            height: 312.268px;
          }
        }
      }

      @media (max-height: 550px) {
        .no-game {
          margin-top: 0;
        }
      }

      .top-banner {
        margin: 0 auto;
        padding: 38px 0 50px;
      }

      .swiper-box {
        height: 219px;
        width: 100%;
      }

      .banner-item {
        height: 219px;
        width: 546px;
        display: flex;

        .border-box-horizontal {
          background-image: url('../image/horizontal-gamecard-bg.png');
        }

        .banner-name {
          letter-spacing: 1px;
          font-size: 18px;
          font-weight: 700;
          text-shadow: 0 4px 4px rgba(0, 0, 0, 0.50);
          font-family: "Microsoft YaHei";
          background: linear-gradient(178deg, #FFF 1.88%, #D1D1D1 98.12%);
          background-clip: text;
          -webkit-background-clip: text;
          padding-bottom: 4px;
        }

        .left-container {
          position: relative;
          height: 100%;
          width: 440px;

          .banner-placeholder {
            clip-path: url(#customClipcc);
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            border-radius: 0;
          }

          .banner-info {
            padding: 0 16% 0 9%;
          }
        }

        .right-container {
          height: 100%;
          width: 152px;
          position: absolute;
          right: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          background-image: url('../image/game-time-bg.png');
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;

          .game-info {
            font-size: 12px;
            position: absolute;
            right: 30px;
            top: 20px;
          }

          .game-time {
            font-size: 20px;
            font-weight: 800;
            font-family: Roboto;
            margin-bottom: 4px;
          }

          .game-label {
            font-size: 13px;
            opacity: 0.4;
          }
        }
      }
  }
}
@media (orientation: landscape) and (min-width: 1300px) {
  .game-snap-carousel {
      .top-banner {
        margin-top: 60px;
      }

      .swiper-box {
        height: 328.5px;
        width: 100%;
      }

      .banner-item {
        height: 328.5px;
        width: 846px;

        .left-container {

          width: 660px;

          .banner-placeholder {
            clip-path: url(#customClip);
          }

          .banner-info {
            padding: 0 16% 0 9%;
          }
        }

        .right-container {

          width: 228px;
          right: 30px;

          .game-info {
            right: 25%;
          }

          .game-time {
            font-size: 22px;
          }
        }
      }
  }
}

/* 18+ Pad 横屏：仅修复当前设备游戏图标被底部导航栏遮挡的问题。 */
@media (orientation: landscape) {
  .game-snap-carousel.is-pad-device.is-xunyou .snap-list {
    transform: translateY(-20px);
  }
}

.PhoneDevice {
  .snap-list {
    padding-left: 20px;
    margin-top: 5px;
  }
  .no-game .no-game-placeholder {
    background-size: 100% 100%;
  }
  .banner-info {
    .banner-name {
      font-size: 14px;
      width: 100px;
    }
    .time-label {
      font-size: 12px;
    }
    .time-value {
      font-size: 15px;
    }
    .time-style-labbel {
      width: 3px;
    }
    .banner-info-box {
      width: calc(100% - 110px);
    }
  }
  .snap-item {
    width: 54px;
    height: 54px;
    &.active {
      width: 64px;
      height: 64px;
    }
  }
}

/* 18 版 phone：游戏卡片在「入口行可见底边」与「底部游戏图标列顶边」之间的留白里居中。
   `.top-banner` 含卡片在内总占位改成 padding-top 26 + 卡片 76.5625vw + padding-bottom 68，
   比 17 版少 48，底部图标列因此整列上移 48px；卡片上提的 32px 与 index.vue 里
   `.top-banner-actions` 的 margin-bottom 90→34 是成对的，改一个必须同时改另一个，
   否则上下两侧会一起跑（两者相加 102，决定图标列的落点）。 */
@media (orientation: portrait) {
  .PhoneDevice .game-snap-carousel.is-xunyou .top-banner {
    padding-bottom: 68px;
  }
}

/* 卡片加速信息面板：设计稿竖屏 234:5453、横屏 293:6297（菱形内）。
   仅在该游戏加速中时显示，替换原来「游戏时长」的位置。延时/丢包为写死值，
   时长由原生记录起始时刻、本地每秒走表，区服信息与切换走原生桥接。

   ⚠️ 选择器必须限定在卡片内的两个容器里：加速信息抽屉（AcceleratorInfoDialog）的根节点
   同样带 accel-info 类名，而 Vue 会把父组件作用域 id 加到子组件根元素上，未限定的
   .accel-info 会连着抽屉根节点一起命中，把它的 position: fixed 覆盖成 relative，
   抽屉就会掉回文档流、被排到页面下方而看不见。 */
.banner-info-box .accel-info,
.right-container .accel-info {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border: 0.5px solid #fff;
  border-radius: 4px;
  background: rgba(6, 9, 12, 0.5);
  box-sizing: border-box;

  &__item {
    font-size: 12px;
    line-height: 1;
    color: #f5f5f5;
    white-space: nowrap;
  }

  // 竖屏是竖直细线，横屏（下方 .landscape）改成横线
  &__divider {
    flex-shrink: 0;
    width: 1px;
    height: 8px;
    background: rgba(255, 255, 255, 0.24);
  }

  &__area {
    display: flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
  }

  &__area-text {
    font-size: 12px;
    line-height: 1;
    color: #3887ff;
    white-space: nowrap;
  }

  &__area-arrow {
    flex-shrink: 0;
    display: block;
  }

  /* 竖屏专用（设计稿 234:5453）：
     ① 上下两条横向扫光渐变线。刻意**不用 border-image**：border-image 不跟随 border-radius，
        会把描边画成直角矩形、圆角处被切成方的，还会在上下各多出一条直边。
        改成两个伪元素贴在上下边缘，容器自身的 0.5px 白描边与 4px 圆角保持不变；
        线比容器短 8px（左右各让 4px，正好避开圆角弧段），水平居中。
     ② 四项内容「延时 / 丢包 / 时长 / 区服」按 1 : 1.2 : 1 : 1 分占位并各自居中，分割线固定 1px 不参与均分。
        丢包用 :nth-child(3) 定位：子元素顺序是 span / i分割线 / span / i / span / i / span，
        所以第 2 个内容项就是第 3 个子元素。 */
  &.portrait {
    &::before,
    &::after {
      content: '';
      position: absolute;
      // 绝对定位的包含块是 padding box，容器有 0.5px 边框，所以 -0.5px 才是边框外沿
      left: 50%;
      width: calc(100% - 8px);
      height: 1px;
      transform: translateX(-50%);
      background: linear-gradient(90deg, #00000085, #f5f5f54f, #f5f5f54f, #00000085);
      pointer-events: none;
    }

    &::before {
      top: -0.5px;
    }

    &::after {
      bottom: -0.5px;
    }

    > .accel-info__item {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    > .accel-info__item:nth-child(3) {
      flex-grow: 1.2;
    }

    > .accel-info__area {
      flex: 1 1 0;
      min-width: 0;
      justify-content: center;
    }
  }

  // 注：原来这里的「区服下拉」样式（&__menu / &__menu-item / .is-current）随内联下拉一并删除
  // 四角角标：素材左右各一枚，四角靠翻转复用（变换与设计稿一致）
  &__corner {
    position: absolute;
    width: 4.5px;
    height: 4.5px;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-image: url('../image/xunyou-accel-corner-left.svg');
    pointer-events: none;

    &.is-tl {
      left: -0.5px;
      top: -0.5px;
      transform: rotate(180deg);
    }

    &.is-bl {
      left: -0.5px;
      bottom: -0.5px;
      transform: rotate(180deg) scaleY(-1);
    }

    &.is-tr {
      right: -0.5px;
      top: -0.5px;
      background-image: url('../image/xunyou-accel-corner-right.svg');
      transform: scaleY(-1);
    }

    &.is-br {
      right: -0.5px;
      bottom: -0.5px;
      background-image: url('../image/xunyou-accel-corner-right.svg');
    }
  }

  /* 横屏：在卡片右侧的斜切面板内竖排，不带自己的底（底图由 .right-container 提供）。
     底图是向左下倾斜的平行四边形，实测中轴斜率 -0.265（≈14.85°），四项要沿这条斜轴排布：
     整体 skewX 斜置让每行的水平中心落在这条斜线上，子元素再反向 skewX 让文字保持直立。
     纵向按设计稿 293:6297 把面板四等分、每项在自己那一格内垂直居中；
     三项分割线是格子分界，要固定 1px 不参与均分。 */
  &.landscape {
    width: 100%;
    height: 100%;
    transform: skewX(-14.85deg);
    flex-direction: column;
    justify-content: flex-start;
    padding: 0;
    border: 0;
    background: none;

    > * {
      transform: skewX(14.85deg);
    }

    > .accel-info__item,
    > .accel-info__area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accel-info__divider {
      flex: 0 0 1px;
      width: 38px;
      height: 1px;
    }

    .accel-info__area-text {
      font-size: 14px;
    }
  }
}

/* 加速中时换一张底图：game-time-bg.png 底部画死的「进详情」圆圈箭头是未加速态的元素，
   位置正好被加速信息第四行（区服）占住，两者会重叠；加速态设计稿（293:6297）里没有它。
   game-time-bg-accel.png 即由 game-time-bg.png 逐像素修补该圆圈区域得到，其余完全一致。
   选择器要压过上面几处媒体查询里的 .game-snap-carousel .banner-item .right-container（0,3,0）。 */
.game-snap-carousel .banner-item .right-container.is-accel {
  background-image: url('../image/game-time-bg-accel.png');
}

.handHeldDevice.game-snap-carousel {
  transform: scale(0.85);
  transform-origin: top center;
}
</style>

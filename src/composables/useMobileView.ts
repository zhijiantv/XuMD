import { ref, onMounted, onBeforeUnmount } from 'vue'

/** 移动端断点：768px 以下视为移动端 */
const MOBILE_BREAKPOINT = 768

/** 判断是否为触屏设备（粗指针） */
function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches
}

/** 检测是否为移动端：宽度 < 768px 且是触屏设备 */
function detectMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT && isCoarsePointer()
}

/**
 * 移动端视图检测与管理
 *
 * 复刻 WeMD：仅当屏幕宽度 < 768px 且是触屏设备时才进入移动端布局，
 * 防止桌面浏览器拖窄窗口时误切换。
 */
export function useMobileView() {
  const isMobile = ref(false)
  const activeView = ref<'editor' | 'preview'>('editor')

  function checkMobile() {
    isMobile.value = detectMobile()
    // 如果切回桌面模式，重置视图状态
    if (!isMobile.value) {
      activeView.value = 'editor'
    }
  }

  function setActiveView(view: 'editor' | 'preview') {
    activeView.value = view
  }

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', checkMobile)
  })

  return {
    isMobile,
    activeView,
    setActiveView,
    isEditor: activeView.value === 'editor',
    isPreview: activeView.value === 'preview',
  }
}

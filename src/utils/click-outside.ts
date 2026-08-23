/**
 * v-click-outside 自定义指令
 * 点击元素外部时触发回调
 */
import type { Directive, DirectiveBinding } from 'vue'

interface ClickOutsideEl extends HTMLElement {
  __clickOutsideHandler__?: (e: MouseEvent) => void
}

export const directive: Directive = {
  mounted(el: ClickOutsideEl, binding: DirectiveBinding<() => void>) {
    const handler = (e: MouseEvent) => {
      // 点击目标不在元素内部，且不是元素自身
      if (!(el === e.target || el.contains(e.target as Node))) {
        binding.value()
      }
    }
    el.__clickOutsideHandler__ = handler
    // 使用 mousedown 以兼容各种交互场景
    document.addEventListener('mousedown', handler)
  },
  unmounted(el: ClickOutsideEl) {
    if (el.__clickOutsideHandler__) {
      document.removeEventListener('mousedown', el.__clickOutsideHandler__)
      delete el.__clickOutsideHandler__
    }
  }
}

export default directive

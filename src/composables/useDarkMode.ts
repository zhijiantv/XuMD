/**
 * 暗黑模式组合式函数
 *
 * 功能：
 * 1. 切换亮/暗模式
 * 2. 持久化到 localStorage
 * 3. 跟随系统偏好（首次访问时）
 * 4. 给 document.documentElement 添加 .dark 类
 */

import { ref } from 'vue'

const STORAGE_KEY = 'xumd-dark-mode'
const isDark = ref(false)
let initialized = false

export function useDarkMode() {
  // 只初始化一次
  if (!initialized) {
    initialized = true
    initDarkMode()
  }

  function initDarkMode(): void {
    // 从 localStorage 读取
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      isDark.value = stored === 'true'
    } else {
      // 跟随系统
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyDarkClass()

    // 监听系统主题变化（仅当用户未手动设置时）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        isDark.value = e.matches
        applyDarkClass()
      }
    })
  }

  function toggleDark(): void {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, String(isDark.value))
    applyDarkClass()
  }

  function setDark(value: boolean): void {
    isDark.value = value
    localStorage.setItem(STORAGE_KEY, String(value))
    applyDarkClass()
  }

  function applyDarkClass(): void {
    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  return {
    isDark,
    toggleDark,
    setDark
  }
}

<template>
  <Transition name="toast-fade">
    <div v-if="visible" class="toast" :class="type">
      <svg v-if="type === 'success'" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <svg v-else-if="type === 'error'" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <svg v-else class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span class="toast-text">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}>(), {
  type: 'info',
  duration: 2000
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        emit('update:visible', false)
      }, props.duration)
    }
  }
)
</script>

<style scoped>
.toast {
  position: fixed;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  color: #374151;
  z-index: 9999;
  backdrop-filter: blur(10px);
  max-width: 80vw;
}

.toast.success {
  color: #059669;
}

.toast.success .toast-icon {
  color: #10b981;
}

.toast.error {
  color: #dc2626;
}

.toast.error .toast-icon {
  color: #ef4444;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .toast {
    background: rgba(30, 41, 59, 0.98);
    color: #e2e8f0;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
</style>

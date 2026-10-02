import { registerSW } from 'virtual:pwa-register'
import { useToast } from '@/composables/useToast'

/**
 * Registers the service worker that makes the app installable and quick to
 * open. A new version waits until the athlete chooses to reload, so a
 * half-filled form is never lost.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  const toast = useToast()
  const update = registerSW({
    onNeedRefresh() {
      toast.info('A new version of TriTrain is ready.', { label: 'Reload', run: () => update(true) })
    },
  })
}

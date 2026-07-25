import { describe, expect, it } from 'vitest'

function createElement(id: string) {
  const listeners: Record<string, Array<() => void>> = {}
  return {
    id,
    style: { display: '' } as { display: string },
    textContent: '',
    innerHTML: '',
    innerText: '',
    addEventListener(event: string, cb: () => void) {
      ;(listeners[event] ||= []).push(cb)
    },
    dispatch(event: string) {
      ;(listeners[event] || []).forEach((cb) => cb())
    },
  }
}

describe('setupDashboard cold start', () => {
  it('hides the cloud dashboard modal on init and only shows it via review sync / dashboard buttons', async () => {
    const dashboardModal = createElement('cloud-dashboard-modal')
    dashboardModal.style.display = 'flex' // simulate the stale inline style from index.html

    const elements: Record<string, ReturnType<typeof createElement>> = {
      'cloud-dashboard-btn': createElement('cloud-dashboard-btn'),
      'review-sync-btn': createElement('review-sync-btn'),
      'cloud-dashboard-modal': dashboardModal,
      'close-cloud-dashboard-btn': createElement('close-cloud-dashboard-btn'),
      'refresh-cloud-dashboard-btn': createElement('refresh-cloud-dashboard-btn'),
      'cloud-history-list': createElement('cloud-history-list'),
    }

    ;(globalThis as any).document = {
      getElementById: (id: string) => elements[id] ?? null,
      querySelectorAll: () => [],
      createElement: () => createElement('generated'),
    }
    ;(globalThis as any).window = globalThis

    const { setupDashboard } = await import('../../src/ui/dashboard')
    setupDashboard()

    expect(dashboardModal.style.display).toBe('none')

    elements['review-sync-btn'].dispatch('click')
    expect(dashboardModal.style.display).toBe('flex')

    elements['close-cloud-dashboard-btn'].dispatch('click')
    expect(dashboardModal.style.display).toBe('none')

    elements['cloud-dashboard-btn'].dispatch('click')
    expect(dashboardModal.style.display).toBe('flex')
  })
})

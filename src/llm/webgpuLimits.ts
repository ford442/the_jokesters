/**
 * WebGPU `requestAdapter` intercept shared by the main-thread MLC path
 * (`mlcEngineCreate.ts`) and the MLC Web Worker (`worker/mlc.worker.ts`).
 *
 * - Forces `maxBufferSize` / `maxStorageBufferBindingSize` /
 *   `maxComputeWorkgroupStorageSize` to the adapter maximum (7B weights need the 4 GB limit).
 * - Reports async GPU device loss (OOM after device creation) so model load can
 *   fail fast and the OOM step-down / fallback chain can run.
 *
 * Works on both `Navigator.gpu` and `WorkerNavigator.gpu`.
 */

export interface DeviceLostInfo {
  message: string
  /** `GPUDeviceLostReason` — `'destroyed'` means an intentional `device.destroy()` (unload). */
  reason: string
}

interface GpuLike {
  requestAdapter: (options?: unknown) => Promise<AdapterLike | null>
}

interface AdapterLike {
  limits: Record<string, number>
  requestDevice: (descriptor?: { requiredLimits?: Record<string, number> }) => Promise<DeviceLike>
}

interface DeviceLike {
  lost: Promise<{ message?: string; reason?: string }>
}

/**
 * Patch `gpu.requestAdapter` so every device created through it requests max buffer
 * limits and reports device loss via `onDeviceLost`.
 *
 * @returns restore function that reinstates the original `requestAdapter`.
 */
export function interceptWebGpuAdapterLimits(
  gpu: GpuLike,
  onDeviceLost: (info: DeviceLostInfo) => void,
): () => void {
  const originalRequestAdapter = gpu.requestAdapter.bind(gpu)

  gpu.requestAdapter = async function (options?: unknown) {
    const adapter = await originalRequestAdapter(options)
    if (!adapter) return adapter

    const originalRequestDevice = adapter.requestDevice.bind(adapter)
    adapter.requestDevice = async function (descriptor = {}) {
      const device = await originalRequestDevice({
        ...descriptor,
        requiredLimits: {
          ...descriptor.requiredLimits,
          maxBufferSize: adapter.limits.maxBufferSize, // Forces the 4GB limit
          maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
          maxComputeWorkgroupStorageSize: adapter.limits.maxComputeWorkgroupStorageSize,
        },
      })
      // Monitor for async GPU device loss (OOM after device creation)
      void device.lost.then((info) => {
        onDeviceLost({
          message: info?.message ?? '',
          reason: info?.reason ?? 'unknown',
        })
      })
      return device
    }
    return adapter
  }

  return () => {
    gpu.requestAdapter = originalRequestAdapter
  }
}

/** Error text matched by `categorizeChatError` → `'oom'` ("device is lost"). */
export function deviceLostErrorMessage(
  info: DeviceLostInfo,
  phase: 'init' | 'runtime' = 'init',
): string {
  const where = phase === 'init' ? ' during model initialization' : ''
  return `GPU device lost${where}: ${info.message || info.reason} — device is lost`
}

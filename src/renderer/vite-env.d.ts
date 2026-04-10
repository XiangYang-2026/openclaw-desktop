/// <reference types="vite/client" />

interface Window {
  electron: {
    gateway: {
      status: () => Promise<{ success: boolean; output: string; error: string }>
      start: () => Promise<{ success: boolean; output: string; error: string }>
      stop: () => Promise<{ success: boolean; output: string; error: string }>
    }
    system: {
      status: () => Promise<{ success: boolean; output: string; error: string }>
      info: () => Promise<{
        platform: string
        arch: string
        nodeVersion: string
        electronVersion: string
        totalMemory: number
        freeMemory: number
        hostname: string
        cpuModel: string
        cpuCores: number
      }>
      usage: () => Promise<{
        cpuUsage: number
        memUsage: number
        freeMemory: number
        totalMemory: number
      }>
      openclawVersion: () => Promise<{ success: boolean; output: string; error: string }>
    }
    nodes: {
      pairingCode: () => Promise<{ success: boolean; output: string; error: string }>
      refreshPairing: () => Promise<{ success: boolean; output: string; error: string }>
      list: () => Promise<{ success: boolean; output: string; error: string }>
    }
    channels: {
      list: () => Promise<{ success: boolean; output: string; error: string }>
      status: () => Promise<{ success: boolean; output: string; error: string }>
      testMessage: (channel: string, target: string, message: string) => Promise<{ success: boolean; output: string; error: string }>
    }
    skills: {
      list: () => Promise<{ success: boolean; output: string; error: string }>
      browse: () => Promise<{ success: boolean; output: string; error: string }>
      install: (skillName: string) => Promise<{ success: boolean; output: string; error: string }>
      uninstall: (skillName: string) => Promise<{ success: boolean; output: string; error: string }>
      scan: (skillName: string) => Promise<{ success: boolean; output: string; error: string }>
      update: (skillName?: string) => Promise<{ success: boolean; output: string; error: string }>
    }
    command: {
      exec: (
        args: string[],
        callbacks: {
          onOutput?: (data: string) => void
          onError?: (data: string) => void
          onClose?: (result: { code: number; output: string; error: string }) => void
        }
      ) => () => void
    }
    sessions: {
      list: () => Promise<{ success: boolean; output: string; error: string }>
      create: () => Promise<{ success: boolean; output: string; error: string }>
      delete: (params: { sessionId: string }) => Promise<{ success: boolean; output: string; error: string }>
      history: (params: { sessionId: string; limit?: number }) => Promise<{ success: boolean; output: string; error: string }>
    }
    platform: string
  }
}

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
    platform: string
  }
}

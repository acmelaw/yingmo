import { computed } from "vue";

declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      platform: string;
      getAppPath: () => Promise<string>;
    };
    Capacitor?: {
      getPlatform: () => string;
      isNativePlatform: () => boolean;
    };
  }
}

export function usePlatform() {
  const isElectron = computed(() => {
    return typeof window !== "undefined" && !!window.electron?.isElectron;
  });

  const isCapacitor = computed(() => {
    return typeof window !== "undefined" && !!window.Capacitor;
  });

  const isPWA = computed(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  });

  const isMobile = computed(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    );
  });

  const isIOS = computed(() => {
    if (typeof window === "undefined") return false;
    return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  });

  const isAndroid = computed(() => {
    if (typeof window === "undefined") return false;
    return /Android/.test(window.navigator.userAgent);
  });

  const platform = computed(() => {
    if (isElectron.value) {
      return window.electron?.platform || "electron";
    }
    if (isCapacitor.value) {
      return window.Capacitor?.getPlatform() || "capacitor";
    }
    if (isPWA.value) {
      return "pwa";
    }
    return "web";
  });

  const platformName = computed(() => {
    const p = platform.value;
    if (p === "darwin") return "macOS";
    if (p === "win32") return "Windows";
    if (p === "linux") return "Linux";
    if (p === "ios") return "iOS";
    if (p === "android") return "Android";
    if (p === "pwa") return "PWA";
    if (p === "electron") return "Electron";
    return "Web";
  });

  const supportsFileSystem = computed(() => {
    return (
      isElectron.value ||
      (typeof window !== "undefined" && "showSaveFilePicker" in window)
    );
  });

  return {
    isElectron,
    isCapacitor,
    isPWA,
    isMobile,
    isIOS,
    isAndroid,
    platform,
    platformName,
    supportsFileSystem,
  };
}

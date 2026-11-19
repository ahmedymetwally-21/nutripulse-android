import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export async function initNativeStatusBar() {
  try {
    if (!Capacitor || !Capacitor.isNativePlatform()) {
      return;
    }
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#090d16" });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // Safely ignore in browser / environments where StatusBar plugin is unavailable
  }
}

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import NutriPulseLogo from "./NutriPulseLogo";
import { useLanguage } from "../i18n/useLanguage";

export default function AppSplashScreen({ durationMs = 1200, onComplete }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState("visible"); // 'visible' | 'fading' | 'done'

  useEffect(() => {
    // Safely hand off from native Android SplashScreen into the branded dark in-app splash
    const hideNativeSplash = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide({ fadeOutDuration: 220 });
        }
      } catch {
        // Safe fallback on web preview or older builds
      }
    };

    hideNativeSplash();

    const fadeTimer = setTimeout(() => {
      setPhase("fading");
    }, durationMs);

    const doneTimer = setTimeout(() => {
      setPhase("done");
      if (onComplete) onComplete();
    }, durationMs + 340);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [durationMs, onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#090d16] flex flex-col items-center justify-center px-6 transition-opacity duration-300 ease-out ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-live="polite"
      aria-label={t("appName")}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className={`relative flex flex-col items-center transition-transform duration-300 ease-out ${
          phase === "fading" ? "scale-95" : "scale-100"
        }`}
      >
        <div className="relative mb-5">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-35 bg-gradient-to-tr from-emerald-500 to-cyan-400 scale-90 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative w-28 h-28 rounded-[28px] overflow-hidden border border-emerald-400/20 shadow-2xl shadow-emerald-950/60 bg-[#090d16]">
            <NutriPulseLogo size={112} showBackground glow className="w-full h-full" />
          </div>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white">
          NutriPulse <span className="text-emerald-400">Pro</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 text-center max-w-[240px]">
          {t("splashTagline")}
        </p>

        {/* Smooth loading progress bar (compositor transform animation) */}
        <div className="w-40 h-1.5 bg-slate-800/90 rounded-full overflow-hidden mt-7">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 origin-left animate-splash-progress" />
        </div>
      </div>
    </div>
  );
}

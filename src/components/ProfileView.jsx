import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CloudOff,
  Lock,
  Globe,
  Target,
  BellRing,
  Database,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Trash2,
  Palette,
  Play
} from "lucide-react";
import { useLanguage } from "../i18n/useLanguage";
import {
  AVATAR_PRESETS,
  GOAL_TAG_OPTIONS,
  getInitials,
  getAvatarGradient
} from "../i18n/translations";
import { getNotificationEnvironmentStatus } from "../utils/notificationEngine";
import { exportBrandIconPng, exportBrandSplashPng } from "../utils/brandAssets";
import NutriPulseLogo from "./NutriPulseLogo";

function compressImageToDataUrl(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(e.target?.result || ""));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = String(e.target?.result || "");
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function ProfileView({
  userProfile,
  setUserProfile,
  goals,
  setGoals,
  setFastingState,
  notificationPrefs,
  setNotificationPrefs,
  weightStats,
  activeStreak,
  selectedDate,
  homeInventoryCount,
  recipesCount,
  backupError,
  onExportJSON,
  onRestoreBackupFile,
  onResetSelectedDay,
  onSendTestNotification,
  onReplaySplash,
  onBack,
  initialOpenSection = "notifications",
  triggerToast
}) {
  const { lang, setLang, isRtl, t, translateGoalTag } = useLanguage();
  const photoInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const [openSections, setOpenSections] = useState({
    language: true,
    appearance: initialOpenSection === "appearance",
    targets: initialOpenSection === "targets",
    notifications: initialOpenSection === "notifications",
    data: initialOpenSection === "data"
  });
  const [confirmDayReset, setConfirmDayReset] = useState(false);
  const [exportingAsset, setExportingAsset] = useState("");

  const envStatus = getNotificationEnvironmentStatus();

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportBrandAsset = async (type) => {
    setExportingAsset(type);
    try {
      if (type === "icon") {
        await exportBrandIconPng();
        triggerToast(t("toastIconExported"));
      } else {
        await exportBrandSplashPng();
        triggerToast(t("toastSplashExported"));
      }
    } catch {
      triggerToast(t("toastAssetExportFailed"));
    } finally {
      setExportingAsset("");
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 200);
      setUserProfile((prev) => ({ ...prev, photoDataUrl: compressed }));
      triggerToast(t("toastProfileUpdated"));
    } catch {
      // ignore invalid file
    }
    e.target.value = "";
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const avatarClasses = getAvatarGradient(userProfile.avatarPreset);

  const togglePref = (key) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const permBadgeText =
    envStatus.permission === "granted"
      ? t("notifPermGranted")
      : envStatus.permission === "default"
        ? t("notifPermPrompt")
        : t("notifPermDenied");

  return (
    <div className="space-y-4">
      {/* Top Return Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 active:scale-95 transition whitespace-nowrap"
        >
          <BackIcon className="w-4 h-4 shrink-0" />
          <span>{t("back")}</span>
        </button>
        <h2 className="text-sm font-extrabold text-white truncate">
          {t("profileScreenTitle")}
        </h2>
        <div className="w-12" aria-hidden="true" />
      </div>

      {/* ================= PROFILE HEADER CARD ================= */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/35 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            {userProfile.photoDataUrl ? (
              <img
                src={userProfile.photoDataUrl}
                alt={userProfile.displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-lg"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarClasses} flex items-center justify-center font-black text-xl shadow-lg`}
              >
                {getInitials(userProfile.displayName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 flex items-center justify-center absolute -bottom-1 -end-1 shadow active:scale-90 transition"
              aria-label={t("changePhoto")}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">
                {t("displayNameLabel")}
              </label>
              <input
                type="text"
                value={userProfile.displayName}
                placeholder={t("displayNamePlaceholder")}
                onChange={(e) =>
                  setUserProfile((prev) => ({ ...prev, displayName: e.target.value }))
                }
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm font-extrabold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 whitespace-nowrap"
              >
                {t("changePhoto")}
              </button>
              {userProfile.photoDataUrl && (
                <>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUserProfile((prev) => ({ ...prev, photoDataUrl: "" }))
                    }
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 whitespace-nowrap"
                  >
                    {t("removePhoto")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Built-in Avatar Presets & Goal Selector */}
        <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">
              {t("avatarPresetsLabel")}
            </span>
            <div className="flex items-center gap-1.5">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setUserProfile((prev) => ({
                      ...prev,
                      avatarPreset: preset.id,
                      photoDataUrl: ""
                    }))
                  }
                  className={`w-7 h-7 rounded-xl bg-gradient-to-br ${preset.gradient} border-2 transition active:scale-90 ${
                    !userProfile.photoDataUrl && userProfile.avatarPreset === preset.id
                      ? "border-white scale-105"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                  aria-label={preset.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              {t("fitnessGoalLabel")}
            </label>
            <select
              value={userProfile.goalTag}
              onChange={(e) =>
                setUserProfile((prev) => ({ ...prev, goalTag: e.target.value }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
            >
              {GOAL_TAG_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {translateGoalTag(opt)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center tabular-nums">
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 block">{t("statWeight")}</span>
            <strong dir="ltr" className="text-sm font-black text-white inline-block">
              {weightStats.current} kg
            </strong>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 block">{t("statBmi")}</span>
            <strong dir="ltr" className="text-sm font-black text-amber-400 inline-block">
              {weightStats.bmi}
            </strong>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 block">{t("statStreak")}</span>
            <strong className="text-sm font-black text-emerald-400">
              {t("streakDays", { days: activeStreak })}
            </strong>
          </div>
        </div>
      </section>

      {/* ================= ACCOUNT & CLOUD SYNC (PLACEHOLDER ONLY) ================= */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
            <CloudOff className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-slate-100">
              {t("localOfflineTitle")}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {t("localOfflineSub")}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="w-full min-h-[44px] bg-slate-950/80 border border-slate-800 text-slate-500 font-bold rounded-xl text-xs px-4 inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>{t("cloudSyncComingSoon")}</span>
        </button>
      </section>

      {/* ================= SECTION 1: LANGUAGE & APP PREFERENCES ================= */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("language")}
          className="w-full p-4 flex items-center justify-between gap-2 text-start"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{t("sectionLanguage")}</h3>
              <p className="text-[11px] text-slate-400 truncate">{t("sectionLanguageSub")}</p>
            </div>
          </div>
          {openSections.language ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {openSections.language && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  triggerToast("Language set to English");
                }}
                className={`min-h-[44px] rounded-xl text-xs font-extrabold border transition ${
                  lang === "en"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {t("englishLabel")} (LTR)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang("ar");
                  triggerToast("تم تغيير اللغة إلى العربية");
                }}
                className={`min-h-[44px] rounded-xl text-xs font-extrabold border transition ${
                  lang === "ar"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {t("arabicLabel")} (RTL)
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================= SECTION 2: DAILY TARGETS & BODY PROFILE ================= */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("targets")}
          className="w-full p-4 flex items-center justify-between gap-2 text-start"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{t("sectionTargets")}</h3>
              <p className="text-[11px] text-slate-400 truncate">{t("sectionTargetsSub")}</p>
            </div>
          </div>
          {openSections.targets ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {openSections.targets && (
          <div className="px-4 pb-4 pt-3 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { key: "cal", label: t("targetCal") },
                { key: "prot", label: t("targetProt") },
                { key: "carb", label: t("targetCarb") },
                { key: "fat", label: t("targetFat") },
                { key: "water", label: t("targetWater") },
                { key: "steps", label: t("targetSteps") },
                { key: "fastingHours", label: t("targetFasting") },
                { key: "targetWeight", label: t("targetWeight") },
                { key: "heightCm", label: t("targetHeight") },
                { key: "fib", label: t("targetFib") },
                { key: "sod", label: t("targetSod") },
                { key: "pot", label: t("targetPot") }
              ].map((g) => (
                <div key={g.key} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                  <label className="text-[11px] text-slate-400 block mb-1">{g.label}</label>
                  <input
                    type="number"
                    value={goals[g.key]}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setGoals({ ...goals, [g.key]: val });
                      if (g.key === "fastingHours") {
                        setFastingState((p) => ({ ...p, targetHours: val || 16 }));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ================= SECTION 3: SMART NOTIFICATIONS & REMINDERS ================= */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("notifications")}
          className="w-full p-4 flex items-center justify-between gap-2 text-start"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {t("sectionNotifications")}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {t("sectionNotificationsSub")}
              </p>
            </div>
          </div>
          {openSections.notifications ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {openSections.notifications && (
          <div className="px-4 pb-4 pt-3 border-t border-slate-800/80 space-y-3">
            {/* Environment Status Row */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl px-3 py-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {envStatus.platform === "native"
                  ? t("notifPermNative")
                  : t("notifPermBrowser")}
              </span>
              <span className="font-bold text-emerald-400">{permBadgeText}</span>
            </div>

            {/* 1. Hydration Nudge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100">{t("notifHydrationToggle")}</p>
                  <p className="text-[11px] text-slate-400">
                    {t("notifHydrationDesc", {
                      hrs: notificationPrefs.hydrationIntervalHours || 2
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationPrefs.hydrationEnabled}
                  onClick={() => togglePref("hydrationEnabled")}
                  className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                    notificationPrefs.hydrationEnabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      notificationPrefs.hydrationEnabled
                        ? isRtl
                          ? "-translate-x-5"
                          : "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {notificationPrefs.hydrationEnabled && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-400">{t("notifIntervalLabel")}</span>
                  <div className="flex gap-1.5">
                    {[2, 3].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() =>
                          setNotificationPrefs((p) => ({
                            ...p,
                            hydrationIntervalHours: hrs
                          }))
                        }
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition ${
                          notificationPrefs.hydrationIntervalHours === hrs
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        {hrs === 2 ? t("every2Hours") : t("every3Hours")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Intermittent Fasting Alerts */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100">{t("notifFastingToggle")}</p>
                <p className="text-[11px] text-slate-400">{t("notifFastingDesc")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationPrefs.fastingEnabled}
                onClick={() => togglePref("fastingEnabled")}
                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                  notificationPrefs.fastingEnabled ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    notificationPrefs.fastingEnabled
                      ? isRtl
                        ? "-translate-x-5"
                        : "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3. Expiring Pantry & Recipe Alert */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100">{t("notifPantryToggle")}</p>
                  <p className="text-[11px] text-slate-400">{t("notifPantryDesc")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationPrefs.pantryExpiryEnabled}
                  onClick={() => togglePref("pantryExpiryEnabled")}
                  className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                    notificationPrefs.pantryExpiryEnabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      notificationPrefs.pantryExpiryEnabled
                        ? isRtl
                          ? "-translate-x-5"
                          : "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {notificationPrefs.pantryExpiryEnabled && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[11px] text-slate-400">{t("preferredTime")}</label>
                  <input
                    type="time"
                    value={notificationPrefs.pantryCheckTime || "10:00"}
                    onChange={(e) =>
                      setNotificationPrefs((p) => ({ ...p, pantryCheckTime: e.target.value }))
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white tabular-nums"
                  />
                </div>
              )}
            </div>

            {/* 4. Evening Macro & Steps Check-In */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100">{t("notifEveningToggle")}</p>
                  <p className="text-[11px] text-slate-400">{t("notifEveningDesc")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationPrefs.eveningCheckInEnabled}
                  onClick={() => togglePref("eveningCheckInEnabled")}
                  className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                    notificationPrefs.eveningCheckInEnabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      notificationPrefs.eveningCheckInEnabled
                        ? isRtl
                          ? "-translate-x-5"
                          : "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {notificationPrefs.eveningCheckInEnabled && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[11px] text-slate-400">{t("preferredTime")}</label>
                  <input
                    type="time"
                    value={notificationPrefs.eveningCheckInTime || "19:00"}
                    onChange={(e) =>
                      setNotificationPrefs((p) => ({
                        ...p,
                        eveningCheckInTime: e.target.value
                      }))
                    }
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white tabular-nums"
                  />
                </div>
              )}
            </div>

            {/* Test Notification Button */}
            <button
              type="button"
              onClick={onSendTestNotification}
              className="w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <BellRing className="w-4 h-4 shrink-0" />
              <span>{t("testNotificationBtn")}</span>
            </button>
          </div>
        )}
      </section>

      {/* ================= SECTION 4: DATA MANAGEMENT ================= */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("data")}
          className="w-full p-4 flex items-center justify-between gap-2 text-start"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{t("sectionData")}</h3>
              <p className="text-[11px] text-slate-400 truncate">{t("sectionDataSub")}</p>
            </div>
          </div>
          {openSections.data ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {openSections.data && (
          <div className="px-4 pb-4 pt-3 border-t border-slate-800/80 space-y-2.5">
            <p className="text-[11px] text-slate-400 leading-relaxed tabular-nums">
              {t("backupIncludesSub", {
                pantry: homeInventoryCount,
                recipes: recipesCount
              })}
            </p>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              onChange={onRestoreBackupFile}
              className="hidden"
            />
            {backupError && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200">
                {backupError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportJSON}
                className="min-h-[44px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold py-2.5 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{t("exportFullBackup")}</span>
              </button>
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="min-h-[44px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold py-2.5 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>{t("restoreFullBackup")}</span>
              </button>
            </div>

            {confirmDayReset ? (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 flex items-center justify-between gap-2">
                <span className="text-xs text-rose-200">
                  {t("confirmClearDay", { date: selectedDate })}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onResetSelectedDay();
                      setConfirmDayReset(false);
                    }}
                    className="px-3 py-1.5 bg-rose-500 text-white font-bold rounded-xl text-xs"
                  >
                    {t("yesClear")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDayReset(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 font-bold rounded-xl text-xs"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDayReset(true)}
                className="w-full min-h-[44px] bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold py-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t("resetSelectedDay", { date: selectedDate })}</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ================= SECTION 5: APP APPEARANCE & BRAND ASSETS ================= */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("appearance")}
          className="w-full p-4 flex items-center justify-between gap-2 text-start"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{t("sectionAppearance")}</h3>
              <p className="text-[11px] text-slate-400 truncate">{t("sectionAppearanceSub")}</p>
            </div>
          </div>
          {openSections.appearance ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {openSections.appearance && (
          <div className="px-4 pb-4 pt-3 border-t border-slate-800/80 space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t("appearancePreviewNote")}
            </p>

            {/* Side-by-side Full-Bleed Square & Android Adaptive Circle Previews */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg bg-[#090d16]">
                  <NutriPulseLogo size={80} showBackground glow className="w-full h-full" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 text-center">
                  {t("appearanceSquareLabel")}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-emerald-500/30 shadow-lg bg-[#090d16]">
                  <NutriPulseLogo size={80} showBackground glow className="w-full h-full" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 text-center">
                  {t("appearanceAdaptiveLabel")}
                </span>
              </div>
            </div>

            {/* 1-Click Canvas PNG Exporters */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={exportingAsset !== ""}
                onClick={() => handleExportBrandAsset("icon")}
                className="w-full min-h-[44px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold py-2.5 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span dir="ltr">{t("downloadIconBtn")}</span>
              </button>
              <button
                type="button"
                disabled={exportingAsset !== ""}
                onClick={() => handleExportBrandAsset("splash")}
                className="w-full min-h-[44px] bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-bold py-2.5 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span dir="ltr">{t("downloadSplashBtn")}</span>
              </button>
              {onReplaySplash && (
                <button
                  type="button"
                  onClick={onReplaySplash}
                  className="w-full min-h-[44px] bg-slate-800/90 border border-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
                >
                  <Play className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{t("replaySplashBtn")}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

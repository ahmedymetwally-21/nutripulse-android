import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getExpirationStatus, rankRecipes } from "./kitchenEngine";

export const DEFAULT_NOTIFICATION_PREFS = {
  hydrationEnabled: true,
  hydrationIntervalHours: 2,
  fastingEnabled: true,
  pantryExpiryEnabled: true,
  pantryCheckTime: "10:00",
  eveningCheckInEnabled: true,
  eveningCheckInTime: "19:00"
};

const NOTIF_IDS = {
  HYDRATION_BASE: 1001,
  FASTING_SOON: 2001,
  FASTING_DONE: 2002,
  PANTRY_DAILY: 3001,
  EVENING_CHECKIN: 4001,
  TEST_ALERT: 9001
};

function parseTimeHHMM(str, fallbackHour, fallbackMin = 0) {
  const parts = String(str || "").split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return {
    hour: !isNaN(h) && h >= 0 && h <= 23 ? h : fallbackHour,
    minute: !isNaN(m) && m >= 0 && m <= 59 ? m : fallbackMin
  };
}

function formatShortTimeLeft(ms, lang) {
  const totalMins = Math.max(1, Math.round(ms / 60000));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (lang === "ar") {
    return hrs > 0 ? `${hrs}س ${mins}د` : `${mins} دقيقة`;
  }
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

export function buildSmartNotifications({
  prefs,
  lang,
  t,
  currentDayData,
  totals,
  goals,
  fastingState,
  nowTick,
  homeInventory,
  recipes,
  allFoods,
  todayKey
}) {
  const alerts = [];
  const p = { ...DEFAULT_NOTIFICATION_PREFS, ...(prefs || {}) };

  // 1. Hydration Nudge
  if (p.hydrationEnabled) {
    const waterGoal = Number(goals.water) || 3500;
    const currentWater = Number(currentDayData?.water) || 0;
    if (currentWater < waterGoal) {
      const remaining = Math.max(0, waterGoal - currentWater);
      alerts.push({
        id: "smart_hydration",
        type: "hydration",
        severity: currentWater < waterGoal * 0.4 ? "amber" : "cyan",
        title: t("alertHydrationTitle"),
        body: t("alertHydrationBody", {
          current: currentWater,
          goal: waterGoal,
          remaining
        }),
        scheduleBadge:
          lang === "ar"
            ? `كل ${p.hydrationIntervalHours} ساعات`
            : `Every ${p.hydrationIntervalHours}h`,
        actionType: "add_water",
        actionLabel: t("alertHydrationAction")
      });
    }
  }

  // 2. Intermittent Fasting Alerts (15 min before end & complete)
  if (p.fastingEnabled && fastingState?.isFasting && fastingState?.startTime) {
    const targetHours = Number(fastingState.targetHours) || 16;
    const targetMs = targetHours * 3600000;
    const elapsedMs = Math.max(0, nowTick - fastingState.startTime);
    const remainingMs = targetMs - elapsedMs;

    if (remainingMs <= 0) {
      alerts.push({
        id: "smart_fasting_done",
        type: "fasting",
        severity: "emerald",
        title: t("alertFastingDoneTitle"),
        body: t("alertFastingDoneBody", { hours: targetHours }),
        scheduleBadge: lang === "ar" ? "الآن" : "Now",
        actionType: "open_kitchen",
        actionLabel: t("alertFastingAction")
      });
    } else if (remainingMs <= 15 * 60000) {
      const minsLeft = Math.max(1, Math.ceil(remainingMs / 60000));
      alerts.push({
        id: "smart_fasting_soon",
        type: "fasting",
        severity: "amber",
        title: t("alertFastingSoonTitle"),
        body: t("alertFastingSoonBody", { mins: minsLeft, hours: targetHours }),
        scheduleBadge: lang === "ar" ? `${minsLeft} د` : `${minsLeft}m left`,
        actionType: "open_kitchen",
        actionLabel: t("alertFastingAction")
      });
    } else {
      alerts.push({
        id: "smart_fasting_armed",
        type: "fasting",
        severity: "indigo",
        title: t("alertFastingActiveTitle"),
        body: t("alertFastingActiveBody", {
          hours: targetHours,
          remaining: formatShortTimeLeft(remainingMs, lang)
        }),
        scheduleBadge: `${targetHours}h`,
        actionType: "open_kitchen",
        actionLabel: t("alertFastingAction")
      });
    }
  }

  // 3. Expiring Pantry & Recipe Recommendation (expires within 0–2 days)
  if (p.pantryExpiryEnabled && Array.isArray(homeInventory)) {
    const soonExpiring = homeInventory
      .map((item) => ({
        ...item,
        expiryInfo: getExpirationStatus(item.expirationDate, todayKey)
      }))
      .filter((item) => item.expiryInfo.daysLeft >= 0 && item.expiryInfo.daysLeft <= 2)
      .sort((a, b) => a.expiryInfo.daysLeft - b.expiryInfo.daysLeft);

    if (soonExpiring.length > 0) {
      const { readyRecipes, partialRecipes } = rankRecipes(
        recipes,
        homeInventory,
        allFoods,
        todayKey
      );
      const bestReady = readyRecipes.find((r) => r.usesExpiringSoon) || readyRecipes[0];
      const bestPartial = partialRecipes.find((r) => r.usesExpiringSoon);
      const recommended = bestReady || bestPartial || null;

      const itemNames = soonExpiring
        .slice(0, 2)
        .map((i) => i.name)
        .join(", ");
      const minDays = soonExpiring[0].expiryInfo.daysLeft;
      const daysText =
        minDays === 0
          ? t("expToday")
          : t("expSoon", { days: minDays });

      alerts.push({
        id: "smart_pantry_expiry",
        type: "pantry",
        severity: "amber",
        title: t("alertPantryTitle"),
        body: recommended
          ? t("alertPantryBodyWithRecipe", {
              items: itemNames,
              days: daysText,
              recipe: recommended.recipe.name
            })
          : t("alertPantryBodyNoRecipe", { items: itemNames }),
        scheduleBadge: p.pantryCheckTime || "10:00",
        actionType: recommended ? "open_kitchen_cook" : "open_pantry",
        actionLabel: recommended ? t("alertPantryAction") : t("alertPantryOpenAction"),
        payload: recommended ? { recipeId: recommended.recipe.id } : null
      });
    }
  }

  // 4. Evening Macro & Steps Check-In
  if (p.eveningCheckInEnabled) {
    const stepGoal = Number(goals.steps) || 10000;
    const currentSteps = Number(currentDayData?.steps) || 0;
    const stepsLeft = Math.max(0, stepGoal - currentSteps);

    const protLeft = Math.max(0, Math.round((Number(goals.prot) || 170) - (Number(totals?.prot) || 0)));
    const calLeft = Math.max(0, Math.round((Number(goals.cal) || 1900) - (Number(totals?.cal) || 0)));

    if (stepsLeft >= 1000 || protLeft >= 20) {
      const gaps = [];
      if (stepsLeft >= 1000) {
        gaps.push(t("alertEveningGapSteps", { steps: stepsLeft.toLocaleString() }));
      }
      if (protLeft >= 20) {
        gaps.push(t("alertEveningGapProt", { prot: protLeft, cal: calLeft }));
      }

      // Pick a quick high-protein suggestion from ready recipes or high-protein foods
      const { readyRecipes, allEvaluated } = rankRecipes(recipes, homeInventory, allFoods, todayKey);
      const quickHighProtRecipe =
        [...readyRecipes, ...allEvaluated]
          .filter((r) => r.nutrition.prot >= 25 && (calLeft <= 0 || r.nutrition.cal <= calLeft + 120))
          .sort((a, b) => (a.recipe.cookingTime || 20) - (b.recipe.cookingTime || 20))[0] || null;

      const fallbackHighProtFood = allFoods.find((f) => f.prot >= 25) || allFoods[0];
      const suggestionText = quickHighProtRecipe
        ? `${quickHighProtRecipe.recipe.name} (${quickHighProtRecipe.nutrition.prot}g P · ${quickHighProtRecipe.nutrition.cal} kcal)`
        : fallbackHighProtFood
          ? `${fallbackHighProtFood.name} (${fallbackHighProtFood.prot}g P)`
          : "High-Protein Meal";

      alerts.push({
        id: "smart_evening_checkin",
        type: "evening",
        severity: "emerald",
        title: t("alertEveningTitle"),
        body: t("alertEveningBody", {
          gaps: gaps.join(" "),
          suggestion: suggestionText
        }),
        scheduleBadge: p.eveningCheckInTime || "19:00",
        actionType: quickHighProtRecipe ? "open_kitchen" : "open_foods",
        actionLabel: t("alertEveningAction")
      });
    }
  }

  return alerts;
}

export function getNotificationEnvironmentStatus() {
  try {
    if (Capacitor && Capacitor.isNativePlatform()) {
      return { platform: "native", permission: "granted" };
    }
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && "Notification" in window) {
    return { platform: "web", permission: window.Notification.permission };
  }
  return { platform: "in-app", permission: "denied" };
}

export async function syncNativeLocalNotifications({
  prefs,
  alerts,
  fastingState,
  t
}) {
  try {
    if (!Capacitor || !Capacitor.isNativePlatform()) return;

    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return;
    }

    // Cancel previously managed IDs before rescheduling
    const idsToCancel = [
      NOTIF_IDS.FASTING_SOON,
      NOTIF_IDS.FASTING_DONE,
      NOTIF_IDS.PANTRY_DAILY,
      NOTIF_IDS.EVENING_CHECKIN,
      NOTIF_IDS.HYDRATION_BASE,
      NOTIF_IDS.HYDRATION_BASE + 1,
      NOTIF_IDS.HYDRATION_BASE + 2,
      NOTIF_IDS.HYDRATION_BASE + 3,
      NOTIF_IDS.HYDRATION_BASE + 4,
      NOTIF_IDS.HYDRATION_BASE + 5
    ].map((id) => ({ id }));

    await LocalNotifications.cancel({ notifications: idsToCancel }).catch(() => {});

    const toSchedule = [];
    const p = { ...DEFAULT_NOTIFICATION_PREFS, ...(prefs || {}) };

    // 1. Hydration Nudges during daytime (9:00 -> 21:00)
    if (p.hydrationEnabled) {
      const interval = p.hydrationIntervalHours === 3 ? 3 : 2;
      const hydrationAlert = alerts.find((a) => a.type === "hydration");
      let slot = 0;
      for (let hr = 10; hr <= 20; hr += interval) {
        toSchedule.push({
          id: NOTIF_IDS.HYDRATION_BASE + slot,
          title: t("alertHydrationTitle"),
          body: hydrationAlert?.body || t("notifHydrationDesc", { hrs: interval }),
          schedule: { on: { hour: hr, minute: 0 }, repeats: true, allowWhileIdle: true }
        });
        slot++;
      }
    }

    // 2. Intermittent Fasting Alerts (15m before & completion)
    if (p.fastingEnabled && fastingState?.isFasting && fastingState?.startTime) {
      const targetHours = Number(fastingState.targetHours) || 16;
      const endMs = fastingState.startTime + targetHours * 3600000;
      const soonMs = endMs - 15 * 60000;
      const now = Date.now();

      if (soonMs > now + 5000) {
        toSchedule.push({
          id: NOTIF_IDS.FASTING_SOON,
          title: t("alertFastingSoonTitle"),
          body: t("alertFastingSoonBody", { mins: 15, hours: targetHours }),
          schedule: { at: new Date(soonMs), allowWhileIdle: true }
        });
      }
      if (endMs > now + 5000) {
        toSchedule.push({
          id: NOTIF_IDS.FASTING_DONE,
          title: t("alertFastingDoneTitle"),
          body: t("alertFastingDoneBody", { hours: targetHours }),
          schedule: { at: new Date(endMs), allowWhileIdle: true }
        });
      }
    }

    // 3. Daily Expiring Pantry & Recipe Check
    if (p.pantryExpiryEnabled) {
      const { hour, minute } = parseTimeHHMM(p.pantryCheckTime, 10, 0);
      const pantryAlert = alerts.find((a) => a.type === "pantry");
      toSchedule.push({
        id: NOTIF_IDS.PANTRY_DAILY,
        title: t("alertPantryTitle"),
        body: pantryAlert?.body || t("notifPantryDesc"),
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true }
      });
    }

    // 4. Evening Macro & Steps Check-In
    if (p.eveningCheckInEnabled) {
      const { hour, minute } = parseTimeHHMM(p.eveningCheckInTime, 19, 0);
      const eveningAlert = alerts.find((a) => a.type === "evening");
      toSchedule.push({
        id: NOTIF_IDS.EVENING_CHECKIN,
        title: t("alertEveningTitle"),
        body: eveningAlert?.body || t("notifEveningDesc"),
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true }
      });
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
  } catch {
    // Safely swallow native plugin errors in web or unsupported runtimes
  }
}

export async function triggerTestSmartNotification({ t }) {
  const title = t("alertTestTitle");
  const body = t("alertTestBody");

  // Native Android via Capacitor LocalNotifications
  try {
    if (Capacitor && Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIF_IDS.TEST_ALERT,
            title,
            body,
            schedule: { at: new Date(Date.now() + 1500) }
          }
        ]
      });
      return {
        deliveredVia: "native",
        alert: {
          id: `test_${Date.now()}`,
          type: "test",
          severity: "emerald",
          title,
          body,
          scheduleBadge: "Test",
          actionType: null
        }
      };
    }
  } catch {
    // Fallback to Web Notification API below
  }

  // Web Browser Notification API Fallback
  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      let permission = window.Notification.permission;
      if (permission === "default") {
        permission = await window.Notification.requestPermission();
      }
      if (permission === "granted") {
        new window.Notification(title, { body });
        return {
          deliveredVia: "web",
          alert: {
            id: `test_${Date.now()}`,
            type: "test",
            severity: "emerald",
            title,
            body,
            scheduleBadge: "Test",
            actionType: null
          }
        };
      }
    }
  } catch {
    // In-app fallback always works
  }

  return {
    deliveredVia: "in-app",
    alert: {
      id: `test_${Date.now()}`,
      type: "test",
      severity: "emerald",
      title,
      body,
      scheduleBadge: "Test",
      actionType: null
    }
  };
}

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  ChefHat,
  Utensils,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  Bell
} from "lucide-react";
import {
  INITIAL_FOOD_DB,
  DEFAULT_GOALS,
  MEAL_TYPES,
  INITIAL_RECIPES,
  getDefaultHomeInventory
} from "./data/defaultData";
import { shiftDate, deductIngredientsFromInventory } from "./utils/kitchenEngine";
import { initNativeStatusBar } from "./utils/nativeStatusBar";
import {
  DEFAULT_NOTIFICATION_PREFS,
  buildSmartNotifications,
  syncNativeLocalNotifications,
  triggerTestSmartNotification
} from "./utils/notificationEngine";
import {
  DEFAULT_USER_PROFILE,
  getInitials,
  getAvatarGradient
} from "./i18n/translations";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useLanguage } from "./i18n/useLanguage";
import KitchenTab from "./components/KitchenTab";
import ProfileView from "./components/ProfileView";
import NotificationCenterModal from "./components/NotificationCenterModal";
import AppSplashScreen from "./components/AppSplashScreen";

function getLastNDays(baseDateStr, n = 7, lang = "en") {
  const result = [];
  const base = new Date(baseDateStr + "T12:00:00");
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const shortDay = d.toLocaleDateString(locale, { weekday: "short" });
    const dayNum = d.getDate();
    result.push({ date: iso, label: `${shortDay} ${dayNum}`, shortDay });
  }
  return result;
}

function formatDuration(ms) {
  if (ms <= 0) return "00h 00m 00s";
  const totalMins = Math.floor(ms / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const secs = Math.floor((ms % 60000) / 1000);
  return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

function formatCompactDate(dateStr, lang) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateStr.slice(5);
  }
}

export default function App() {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_lang");
      return saved === "ar" ? "ar" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("np_pro_lang", lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  return (
    <LanguageProvider lang={lang} setLang={setLang}>
      <NutriPulseApp />
    </LanguageProvider>
  );
}

function NutriPulseApp() {
  const { lang, setLang, isRtl, t, translateMeal, translateCategory } = useLanguage();

  const [todayKey] = useState(() => new Date().toISOString().split("T")[0]);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | kitchen | logger | progress | profile
  const [previousTab, setPreviousTab] = useState("dashboard");
  const [profileInitialSection, setProfileInitialSection] = useState("notifications");
  const [progressSubTab, setProgressSubTab] = useState("weekly"); // weekly | weight
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Kitchen deep-link state for smart notification actions
  const [kitchenLaunch, setKitchenLaunch] = useState({ key: 0, subTab: "cook", recipeId: null });

  // Notification Center modal state
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [testAlerts, setTestAlerts] = useState([]);

  // Branded dark in-app Splash Screen key (incremented if user replays preview from Profile)
  const [splashKey, setSplashKey] = useState(1);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_user_profile");
      return saved ? { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) } : DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  });

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_notif_prefs");
      return saved
        ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) }
        : DEFAULT_NOTIFICATION_PREFS;
    } catch {
      return DEFAULT_NOTIFICATION_PREFS;
    }
  });

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_goals");
      return saved ? { ...DEFAULT_GOALS, ...JSON.parse(saved) } : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [customFoods, setCustomFoods] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_custom_foods");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [logsByDate, setLogsByDate] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_logs");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [weightLogs, setWeightLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_weights");
      if (saved) return JSON.parse(saved);
      return [{ date: todayKey, weight: 124.0, note: "Current baseline" }];
    } catch {
      return [{ date: todayKey, weight: 124.0, note: "Current baseline" }];
    }
  });

  const [savedCombos, setSavedCombos] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_combos");
      if (saved) return JSON.parse(saved);
      return [
        {
          id: "combo_default_1",
          name: "High-Protein Cut Combo (400g Chicken + 1 Large Tuna)",
          items: [
            { name: "Cooked Chicken Breast (400g)", meal: "Meal 1 (Break-Fast)", cal: 660, carb: 0, prot: 124, fat: 14.4, fib: 0, sug: 0, sod: 296, pot: 1024, calc: 60, iro: 4.0, vitc: 0 },
            { name: "Canned Tuna in Water (1 Large Can)", meal: "Meal 2 (Main)", cal: 160, carb: 0, prot: 36, fat: 1.2, fib: 0, sug: 0, sod: 360, pot: 340, calc: 18, iro: 2.1, vitc: 0 }
          ]
        }
      ];
    } catch {
      return [];
    }
  });

  const [fastingState, setFastingState] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_fasting");
      return saved ? JSON.parse(saved) : { isFasting: false, startTime: null, targetHours: 16 };
    } catch {
      return { isFasting: false, startTime: null, targetHours: 16 };
    }
  });

  const [homeInventory, setHomeInventory] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_home_inventory");
      if (saved !== null) return JSON.parse(saved);
      return getDefaultHomeInventory(todayKey);
    } catch {
      return getDefaultHomeInventory(todayKey);
    }
  });

  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem("np_pro_recipes");
      if (saved !== null) return JSON.parse(saved);
      return INITIAL_RECIPES;
    } catch {
      return INITIAL_RECIPES;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMeal, setSelectedMeal] = useState("Meal 1 (Break-Fast)");
  const [selectedFood, setSelectedFood] = useState(INITIAL_FOOD_DB[0]);
  const [amountInput, setAmountInput] = useState(200);
  const [showMicros, setShowMicros] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showJsonPasteModal, setShowJsonPasteModal] = useState(false);
  const [jsonPasteText, setJsonPasteText] = useState("");
  const [foodJsonError, setFoodJsonError] = useState("");
  const [backupError, setBackupError] = useState("");
  const [customWaterInput, setCustomWaterInput] = useState("");
  const [customStepsInput, setCustomStepsInput] = useState("");
  const [comboNameInput, setComboNameInput] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  const [weightInputDate, setWeightInputDate] = useState(todayKey);
  const [weightInputValue, setWeightInputValue] = useState("");
  const [weightInputNote, setWeightInputNote] = useState("");
  const [weightRangeDays, setWeightRangeDays] = useState(30);

  const [newFood, setNewFood] = useState({
    name: "", category: "Custom", unit: "100g", isServing: false,
    cal: "", carb: "", prot: "", fat: "",
    fib: "", sug: "", sod: "", pot: "", calc: "", iro: "", vitc: ""
  });

  useEffect(() => {
    initNativeStatusBar();
  }, []);

  useEffect(() => {
    if (!fastingState.isFasting) return;
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [fastingState.isFasting]);

  useEffect(() => { try { localStorage.setItem("np_pro_user_profile", JSON.stringify(userProfile)); } catch {} }, [userProfile]);
  useEffect(() => { try { localStorage.setItem("np_pro_notif_prefs", JSON.stringify(notificationPrefs)); } catch {} }, [notificationPrefs]);
  useEffect(() => { try { localStorage.setItem("np_pro_goals", JSON.stringify(goals)); } catch {} }, [goals]);
  useEffect(() => { try { localStorage.setItem("np_pro_custom_foods", JSON.stringify(customFoods)); } catch {} }, [customFoods]);
  useEffect(() => { try { localStorage.setItem("np_pro_logs", JSON.stringify(logsByDate)); } catch {} }, [logsByDate]);
  useEffect(() => { try { localStorage.setItem("np_pro_weights", JSON.stringify(weightLogs)); } catch {} }, [weightLogs]);
  useEffect(() => { try { localStorage.setItem("np_pro_combos", JSON.stringify(savedCombos)); } catch {} }, [savedCombos]);
  useEffect(() => { try { localStorage.setItem("np_pro_fasting", JSON.stringify(fastingState)); } catch {} }, [fastingState]);
  useEffect(() => { try { localStorage.setItem("np_pro_home_inventory", JSON.stringify(homeInventory)); } catch {} }, [homeInventory]);
  useEffect(() => { try { localStorage.setItem("np_pro_recipes", JSON.stringify(recipes)); } catch {} }, [recipes]);

  const triggerToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2800);
  };

  const allFoods = useMemo(() => [...customFoods, ...INITIAL_FOOD_DB], [customFoods]);
  const currentDayData = useMemo(
    () => logsByDate[selectedDate] || { water: 0, steps: 0, waterHistory: [], foods: [] },
    [logsByDate, selectedDate]
  );
  const todayDayData = useMemo(
    () => logsByDate[todayKey] || { water: 0, steps: 0, waterHistory: [], foods: [] },
    [logsByDate, todayKey]
  );

  const updateCurrentDay = (updater) => {
    setLogsByDate((prev) => {
      const existing = prev[selectedDate] || { water: 0, steps: 0, waterHistory: [], foods: [] };
      return { ...prev, [selectedDate]: updater(existing) };
    });
  };

  const computeTotals = (dayData) =>
    (dayData.foods || []).reduce(
      (acc, item) => {
        acc.cal += Number(item.cal) || 0;
        acc.carb += Number(item.carb) || 0;
        acc.prot += Number(item.prot) || 0;
        acc.fat += Number(item.fat) || 0;
        acc.fib += Number(item.fib) || 0;
        acc.sug += Number(item.sug) || 0;
        acc.sod += Number(item.sod) || 0;
        acc.pot += Number(item.pot) || 0;
        acc.calc += Number(item.calc) || 0;
        acc.iro += Number(item.iro) || 0;
        acc.vitc += Number(item.vitc) || 0;
        return acc;
      },
      { cal: 0, carb: 0, prot: 0, fat: 0, fib: 0, sug: 0, sod: 0, pot: 0, calc: 0, iro: 0, vitc: 0 }
    );

  const totals = useMemo(() => computeTotals(currentDayData), [currentDayData]);
  const todayTotals = useMemo(() => computeTotals(todayDayData), [todayDayData]);

  // Live Smart Notifications & Recommendations
  const smartAlerts = useMemo(() => {
    const dynamic = buildSmartNotifications({
      prefs: notificationPrefs,
      lang,
      t,
      currentDayData: todayDayData,
      totals: todayTotals,
      goals,
      fastingState,
      nowTick,
      homeInventory,
      recipes,
      allFoods,
      todayKey
    });
    return [...testAlerts, ...dynamic];
  }, [
    notificationPrefs,
    lang,
    t,
    todayDayData,
    todayTotals,
    goals,
    fastingState,
    nowTick,
    homeInventory,
    recipes,
    allFoods,
    todayKey,
    testAlerts
  ]);

  const unreadAlertsCount = useMemo(
    () => smartAlerts.filter((a) => !dismissedAlertIds.includes(a.id)).length,
    [smartAlerts, dismissedAlertIds]
  );

  const notifSyncRef = useRef({ alerts: smartAlerts, t });
  useEffect(() => {
    notifSyncRef.current = { alerts: smartAlerts, t };
  }, [smartAlerts, t]);

  // Sync native Android Capacitor LocalNotifications whenever preferences/state change
  useEffect(() => {
    syncNativeLocalNotifications({
      prefs: notificationPrefs,
      alerts: notifSyncRef.current.alerts,
      fastingState,
      t: notifSyncRef.current.t
    });
  }, [notificationPrefs, fastingState, homeInventory.length, lang]);

  const handleSendTestNotification = async () => {
    const result = await triggerTestSmartNotification({ t });
    setTestAlerts((prev) => [result.alert, ...prev.slice(0, 2)]);
    triggerToast(t("toastTestNotifSent"));
  };

  const handleOpenProfile = (section = "notifications") => {
    if (activeTab !== "profile") {
      setPreviousTab(activeTab);
    }
    setProfileInitialSection(section);
    setActiveTab("profile");
  };

  const handleExecuteAlertAction = (alert) => {
    setShowNotifCenter(false);
    if (alert.actionType === "add_water") {
      handleAddWater(250);
    } else if (alert.actionType === "open_kitchen_cook" && alert.payload?.recipeId) {
      setKitchenLaunch((prev) => ({
        key: prev.key + 1,
        subTab: "cook",
        recipeId: alert.payload.recipeId
      }));
      setActiveTab("kitchen");
    } else if (alert.actionType === "open_pantry") {
      setKitchenLaunch((prev) => ({
        key: prev.key + 1,
        subTab: "pantry",
        recipeId: null
      }));
      setActiveTab("kitchen");
    } else if (alert.actionType === "open_kitchen") {
      setKitchenLaunch((prev) => ({
        key: prev.key + 1,
        subTab: "cook",
        recipeId: null
      }));
      setActiveTab("kitchen");
    } else if (alert.actionType === "open_foods") {
      setActiveTab("logger");
    }
  };

  const applySavedCombo = (combo) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const entries = combo.items.map((it, idx) => ({ ...it, id: `log_${Date.now()}_${idx}`, time: now }));
    updateCurrentDay((day) => ({ ...day, foods: [...entries, ...(day.foods || [])] }));
    const totalKcal = entries.reduce((s, x) => s + x.cal, 0);
    const totalProt = entries.reduce((s, x) => s + x.prot, 0);
    triggerToast(t("toastLoggedCombo", { name: combo.name, cal: totalKcal, prot: totalProt }));
  };

  const saveTodayAsCombo = () => {
    if (!currentDayData.foods || currentDayData.foods.length === 0) {
      triggerToast(t("toastLogOneFirst"));
      return;
    }
    const label =
      comboNameInput.trim() ||
      `Saved Day Preset (${Math.round(totals.cal)} kcal · ${Math.round(totals.prot)}g P)`;
    const newCombo = {
      id: "combo_" + Date.now(),
      name: label,
      items: currentDayData.foods.map(({ id: _id, time: _time, ...rest }) => rest)
    };
    setSavedCombos((prev) => [newCombo, ...prev]);
    setComboNameInput("");
    triggerToast(t("toastSavedPreset", { name: label }));
  };

  const handleSelectFoodItem = (food) => {
    setSelectedFood(food);
    setAmountInput(food.defaultAmount || (food.isServing ? 1 : 100));
  };

  const previewNutrients = useMemo(() => {
    if (!selectedFood) return null;
    const mult = selectedFood.isServing
      ? (parseFloat(amountInput) || 0)
      : (parseFloat(amountInput) || 0) / 100;
    const scale = (val) => +((Number(val) || 0) * mult).toFixed(1);
    return {
      cal: Math.round((Number(selectedFood.cal) || 0) * mult),
      carb: scale(selectedFood.carb),
      prot: scale(selectedFood.prot),
      fat: scale(selectedFood.fat),
      fib: scale(selectedFood.fib),
      sug: scale(selectedFood.sug),
      sod: Math.round((Number(selectedFood.sod) || 0) * mult),
      pot: Math.round((Number(selectedFood.pot) || 0) * mult),
      calc: Math.round((Number(selectedFood.calc) || 0) * mult),
      iro: scale(selectedFood.iro),
      vitc: scale(selectedFood.vitc)
    };
  }, [selectedFood, amountInput]);

  const handleLogSelectedFood = () => {
    if (!selectedFood || !previewNutrients) return;
    const labelAmount = selectedFood.isServing ? `${amountInput} × ${selectedFood.unit}` : `${amountInput}g`;
    const entry = {
      id: "log_" + Date.now(),
      name: `${selectedFood.name} (${labelAmount})`,
      meal: selectedMeal,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...previewNutrients
    };
    updateCurrentDay((day) => ({ ...day, foods: [entry, ...(day.foods || [])] }));
    triggerToast(t("toastAddedFood", { name: selectedFood.name, meal: translateMeal(selectedMeal) }));
    setActiveTab("dashboard");
  };

  const handleLogRecipeMeal = ({ recipe, usedIngredients, nutrition, meal, deductInventory, wasCustomized }) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const entry = {
      id: "log_rec_" + Date.now(),
      name: wasCustomized ? `${recipe.name} (Custom Portion)` : recipe.name,
      meal: meal || selectedMeal,
      time: now,
      ...nutrition
    };
    updateCurrentDay((day) => ({ ...day, foods: [entry, ...(day.foods || [])] }));

    let deductSuffix = "";
    if (deductInventory) {
      const { updatedInventory, deductedCount } = deductIngredientsFromInventory(
        homeInventory,
        usedIngredients,
        todayKey
      );
      setHomeInventory(updatedInventory);
      if (deductedCount > 0) {
        deductSuffix = t("toastPantryUpdatedSuffix");
      }
    }

    triggerToast(
      t("toastLoggedRecipe", { name: recipe.name, cal: nutrition.cal, prot: nutrition.prot }) +
        deductSuffix
    );
  };

  const handleDeleteFoodLog = (id) => {
    updateCurrentDay((day) => ({ ...day, foods: day.foods.filter((f) => f.id !== id) }));
  };

  const handleAddWater = (ml) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    updateCurrentDay((day) => {
      const newTotal = Math.max(0, (day.water || 0) + ml);
      const historyItem = { id: Date.now(), amount: ml, time: now };
      return {
        ...day,
        water: newTotal,
        waterHistory: ml > 0 ? [historyItem, ...(day.waterHistory || [])] : (day.waterHistory || [])
      };
    });
    if (ml > 0) triggerToast(t("toastWaterAdded", { ml }));
  };

  const handleAddSteps = (delta) => {
    updateCurrentDay((day) => ({ ...day, steps: Math.max(0, (day.steps || 0) + delta) }));
    if (delta > 0) triggerToast(t("toastStepsAdded", { steps: delta.toLocaleString() }));
  };

  const handleToggleFasting = () => {
    if (fastingState.isFasting) {
      const elapsedHrs = ((Date.now() - fastingState.startTime) / 3600000).toFixed(1);
      setFastingState((prev) => ({ ...prev, isFasting: false, startTime: null }));
      triggerToast(t("toastFastEnded", { hrs: elapsedHrs }));
    } else {
      setFastingState((prev) => ({ ...prev, isFasting: true, startTime: Date.now() }));
      triggerToast(t("toastFastStarted", { hrs: fastingState.targetHours }));
    }
  };

  const handleSaveCustomFood = (e) => {
    e.preventDefault();
    if (!newFood.name.trim()) return;
    const created = {
      id: "cust_" + Date.now(),
      name: newFood.name.trim(),
      category: "Custom",
      unit: newFood.isServing ? "1 Serving" : "100g",
      defaultAmount: newFood.isServing ? 1 : 100,
      isServing: newFood.isServing,
      cal: Number(newFood.cal) || 0, carb: Number(newFood.carb) || 0, prot: Number(newFood.prot) || 0, fat: Number(newFood.fat) || 0,
      fib: Number(newFood.fib) || 0, sug: Number(newFood.sug) || 0, sod: Number(newFood.sod) || 0, pot: Number(newFood.pot) || 0,
      calc: Number(newFood.calc) || 0, iro: Number(newFood.iro) || 0, vitc: Number(newFood.vitc) || 0
    };
    setCustomFoods((prev) => [created, ...prev]);
    setSelectedFood(created);
    setAmountInput(created.defaultAmount);
    setShowCustomModal(false);
    setNewFood({ name: "", category: "Custom", unit: "100g", isServing: false, cal: "", carb: "", prot: "", fat: "", fib: "", sug: "", sod: "", pot: "", calc: "", iro: "", vitc: "" });
    triggerToast(t("toastSavedCustomFood", { name: created.name }));
  };

  const processImportedFoodJson = (rawJsonString) => {
    setFoodJsonError("");
    try {
      const parsed = JSON.parse(rawJsonString);
      let rawList = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.foods)
          ? parsed.foods
          : parsed && typeof parsed === "object" && parsed.name
            ? [parsed]
            : null;
      if (!rawList) {
        setFoodJsonError("Invalid JSON format. Expected an array of food items or an object with 'name'.");
        return;
      }
      let addedFoods = [];
      let autoLogItems = [];
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      rawList.forEach((item, idx) => {
        if (!item || !item.name) return;
        const isServ = Boolean(item.isServing);
        const normalized = {
          id: item.id || `json_${Date.now()}_${idx}`,
          name: String(item.name).trim(),
          category: item.category || "JSON Import",
          unit: item.unit || (isServ ? "1 Serving" : "100g"),
          defaultAmount: Number(item.defaultAmount) || (isServ ? 1 : 100),
          isServing: isServ,
          cal: Number(item.cal ?? item.calories) || 0,
          carb: Number(item.carb ?? item.carbs) || 0,
          prot: Number(item.prot ?? item.protein) || 0,
          fat: Number(item.fat ?? item.fats) || 0,
          fib: Number(item.fib ?? item.fiber) || 0,
          sug: Number(item.sug ?? item.sugar) || 0,
          sod: Number(item.sod ?? item.sodium) || 0,
          pot: Number(item.pot ?? item.potassium) || 0,
          calc: Number(item.calc ?? item.calcium) || 0,
          iro: Number(item.iro ?? item.iron) || 0,
          vitc: Number(item.vitc ?? item.vitaminC) || 0
        };
        addedFoods.push(normalized);
        if (item.logNow) {
          autoLogItems.push({
            id: `log_${Date.now()}_${idx}`,
            name: `${normalized.name} (${normalized.unit})`,
            meal: item.meal || selectedMeal,
            time: now,
            cal: normalized.cal, carb: normalized.carb, prot: normalized.prot, fat: normalized.fat,
            fib: normalized.fib, sug: normalized.sug, sod: normalized.sod, pot: normalized.pot,
            calc: normalized.calc, iro: normalized.iro, vitc: normalized.vitc
          });
        }
      });

      if (addedFoods.length === 0) {
        setFoodJsonError("No valid food entries found in JSON.");
        return;
      }
      setCustomFoods((prev) => {
        const existingNames = new Set(addedFoods.map((f) => f.name.toLowerCase()));
        return [...addedFoods, ...prev.filter((p) => !existingNames.has(p.name.toLowerCase()))];
      });
      if (autoLogItems.length > 0) {
        updateCurrentDay((day) => ({ ...day, foods: [...autoLogItems, ...(day.foods || [])] }));
      }
      setSelectedFood(addedFoods[0]);
      setAmountInput(addedFoods[0].defaultAmount);
      setSelectedCategory("All");
      setShowJsonPasteModal(false);
      setJsonPasteText("");
      triggerToast(t("toastImportedFoods", { count: addedFoods.length }));
    } catch (err) {
      setFoodJsonError("Could not parse JSON: " + err.message);
    }
  };

  const handleFileUploadJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => processImportedFoodJson(String(evt.target?.result || ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportJSON = () => {
    const payload = {
      version: "NutriPulse_v5",
      language: lang,
      userProfile,
      notificationPrefs,
      goals,
      customFoods,
      logsByDate,
      weightLogs,
      savedCombos,
      homeInventory,
      recipes,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NutriPulse_Backup_${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(t("toastBackupDownloaded"));
  };

  const handleRestoreFullBackup = (e) => {
    setBackupError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(String(evt.target?.result || ""));
        if (
          !data ||
          (!data.logsByDate &&
            !data.weightLogs &&
            !data.goals &&
            !data.homeInventory &&
            !data.recipes &&
            !data.userProfile)
        ) {
          setBackupError("Invalid NutriPulse backup file.");
          return;
        }
        if (data.goals) setGoals((prev) => ({ ...prev, ...data.goals }));
        if (Array.isArray(data.customFoods)) setCustomFoods(data.customFoods);
        if (data.logsByDate && typeof data.logsByDate === "object") setLogsByDate(data.logsByDate);
        if (Array.isArray(data.weightLogs)) setWeightLogs(data.weightLogs);
        if (Array.isArray(data.savedCombos)) setSavedCombos(data.savedCombos);
        if (Array.isArray(data.homeInventory)) setHomeInventory(data.homeInventory);
        if (Array.isArray(data.recipes)) setRecipes(data.recipes);
        if (data.userProfile && typeof data.userProfile === "object") {
          setUserProfile((prev) => ({ ...prev, ...data.userProfile }));
        }
        if (data.notificationPrefs && typeof data.notificationPrefs === "object") {
          setNotificationPrefs((prev) => ({ ...prev, ...data.notificationPrefs }));
        }
        if (data.language === "en" || data.language === "ar") {
          setLang(data.language);
        }
        triggerToast(t("toastBackupRestored"));
      } catch (err) {
        setBackupError("Failed to restore backup: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddOrUpdateWeight = (e) => {
    e.preventDefault();
    const val = parseFloat(weightInputValue);
    if (!val || val <= 0) return;
    setWeightLogs((prev) => {
      const updated = [
        ...prev.filter((w) => w.date !== weightInputDate),
        { date: weightInputDate, weight: +val.toFixed(1), note: weightInputNote.trim() }
      ];
      updated.sort((a, b) => a.date.localeCompare(b.date));
      return updated;
    });
    setWeightInputValue("");
    setWeightInputNote("");
    triggerToast(t("toastSavedWeight", { weight: val.toFixed(1), date: weightInputDate }));
  };

  const handleDeleteWeight = (dateKey) => setWeightLogs((prev) => prev.filter((w) => w.date !== dateKey));

  const filteredWeightLogs = useMemo(() => {
    const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
    if (weightRangeDays === 365 || sorted.length === 0) return sorted;
    const cutoff = new Date(selectedDate + "T12:00:00");
    cutoff.setDate(cutoff.getDate() - weightRangeDays);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const within = sorted.filter((w) => w.date >= cutoffStr);
    return within.length > 0 ? within : sorted.slice(-Math.min(sorted.length, 7));
  }, [weightLogs, weightRangeDays, selectedDate]);

  const weightStats = useMemo(() => {
    if (weightLogs.length === 0) return { start: 0, current: 0, change: 0, remaining: 0, bmi: 0 };
    const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
    const start = sorted[0].weight;
    const current = sorted[sorted.length - 1].weight;
    const change = +(current - start).toFixed(1);
    const remaining = +(current - (goals.targetWeight || 110)).toFixed(1);
    const hMeters = (goals.heightCm || 181) / 100;
    const bmi = +(current / (hMeters * hMeters)).toFixed(1);
    return { start, current, change, remaining, bmi };
  }, [weightLogs, goals.targetWeight, goals.heightCm]);

  const weeklyDaysData = useMemo(() => {
    return getLastNDays(selectedDate, 7, lang).map((d) => {
      const dayLog = logsByDate[d.date] || { water: 0, steps: 0, foods: [] };
      const dayCal = (dayLog.foods || []).reduce((sum, item) => sum + (Number(item.cal) || 0), 0);
      const dayProt = (dayLog.foods || []).reduce((sum, item) => sum + (Number(item.prot) || 0), 0);
      return {
        ...d,
        cal: Math.round(dayCal),
        prot: Math.round(dayProt),
        water: Math.round(dayLog.water || 0),
        steps: Math.round(dayLog.steps || 0)
      };
    });
  }, [logsByDate, selectedDate, lang]);

  const activeStreak = useMemo(() => {
    let streak = 0;
    let checkDate = todayKey;
    for (let i = 0; i < 60; i++) {
      const entry = logsByDate[checkDate];
      if (entry && ((entry.foods && entry.foods.length > 0) || (entry.steps || 0) >= 8000)) {
        streak++;
        checkDate = shiftDate(checkDate, -1);
      } else break;
    }
    return streak;
  }, [logsByDate, todayKey]);

  const filteredFoods = useMemo(() => {
    return allFoods.filter((f) => {
      const matchesCat = selectedCategory === "All" || f.category === selectedCategory;
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allFoods, selectedCategory, searchQuery]);

  const calPct = Math.min(100, Math.round((totals.cal / (goals.cal || 1)) * 100));
  const calRemaining = Math.max(0, (goals.cal || 0) - Math.round(totals.cal));
  const ringRadius = 56;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (calPct / 100) * ringCircumference;
  const waterPct = Math.min(100, Math.round(((currentDayData.water || 0) / (goals.water || 1)) * 100));
  const stepsPct = Math.min(100, Math.round(((currentDayData.steps || 0) / (goals.steps || 10000)) * 100));
  const estStepKcal = Math.round((currentDayData.steps || 0) * 0.055);

  const fastingElapsedMs = fastingState.isFasting && fastingState.startTime ? Math.max(0, nowTick - fastingState.startTime) : 0;
  const fastingTargetMs = (fastingState.targetHours || 16) * 3600000;
  const fastingPct = Math.min(100, Math.round((fastingElapsedMs / fastingTargetMs) * 100));

  // Clean 4-tab Bottom Navigation (Settings moved into Profile Avatar)
  const navTabs = [
    { id: "dashboard", icon: Activity, label: t("navDaily") },
    { id: "kitchen", icon: ChefHat, label: t("navKitchen") },
    { id: "logger", icon: Utensils, label: t("navFoods") },
    { id: "progress", icon: TrendingUp, label: t("navProgress") }
  ];

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const avatarGradient = getAvatarGradient(userProfile.avatarPreset);

  return (
    <div className="min-h-screen w-full max-w-lg mx-auto bg-[#090d16] text-slate-100 flex flex-col pb-28 relative select-none">
      <AppSplashScreen key={splashKey} durationMs={1200} />

      {toastMsg && (
        <div className="fixed safe-toast-top left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-xl border border-emerald-300 text-center max-w-[92vw]">
          {toastMsg}
        </div>
      )}

      {/* Sticky Header with Profile Avatar, Date Controls, Language Toggle & Notification Bell */}
      <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-3 pb-2.5 safe-header-top flex items-center justify-between gap-2">
        {/* Start Zone: Clickable User Profile Avatar + Brand */}
        <button
          type="button"
          onClick={() => handleOpenProfile("language")}
          className="flex items-center gap-2 min-w-0 text-start active:scale-95 transition"
          aria-label={t("openProfile")}
        >
          {userProfile.photoDataUrl ? (
            <img
              src={userProfile.photoDataUrl}
              alt={userProfile.displayName}
              className={`w-9 h-9 rounded-xl object-cover shrink-0 border-2 ${
                activeTab === "profile" ? "border-emerald-400" : "border-slate-700"
              }`}
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-black text-xs shadow-md shrink-0 border-2 ${
                activeTab === "profile" ? "border-white" : "border-transparent"
              }`}
            >
              {getInitials(userProfile.displayName)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                {t("appShortName")}
              </h1>
              {activeStreak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300 tabular-nums whitespace-nowrap shrink-0">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {activeStreak}d
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[96px]">
              {userProfile.displayName || "Athlete"}
            </p>
          </div>
        </button>

        {/* End Zone: Compact Date Selector + Quick Lang Toggle + Notification Bell */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="w-7 h-7 rounded-lg text-slate-300 hover:text-white flex items-center justify-center active:scale-90"
              aria-label={t("prevDay")}
            >
              <PrevIcon className="w-3.5 h-3.5" />
            </button>
            <label className="relative px-1.5 h-7 flex items-center justify-center cursor-pointer">
              <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap tabular-nums">
                {formatCompactDate(selectedDate, lang)}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label={t("selectDate")}
              />
            </label>
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="w-7 h-7 rounded-lg text-slate-300 hover:text-white flex items-center justify-center active:scale-90"
              aria-label={t("nextDay")}
            >
              <NextIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = lang === "en" ? "ar" : "en";
              setLang(next);
              triggerToast(next === "ar" ? "تم تغيير اللغة إلى العربية" : "Language set to English");
            }}
            className="h-9 px-2 rounded-xl bg-slate-900 border border-slate-700/80 text-[11px] font-extrabold text-cyan-300 hover:border-cyan-500/50 active:scale-90 transition whitespace-nowrap"
            aria-label="Toggle language"
          >
            {t("langToggleLabel")}
          </button>

          <button
            type="button"
            onClick={() => setShowNotifCenter(true)}
            className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 hover:border-emerald-500/50 flex items-center justify-center active:scale-90 transition"
            aria-label={t("openNotifications")}
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span
                dir="ltr"
                className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center tabular-nums shadow"
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 p-3.5 space-y-3.5">
        {/* ================= DAILY DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
            <section className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-3.5 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-extrabold text-amber-300 tracking-wide">
                    {t("fastingTitle", { hours: fastingState.targetHours })}
                  </h2>
                  {fastingState.isFasting ? (
                    <div className="mt-1 tabular-nums flex items-baseline gap-2 flex-wrap">
                      <span dir="ltr" className="text-lg font-black text-white font-mono">
                        {formatDuration(fastingElapsedMs)}
                      </span>
                      <span className="text-[11px] text-amber-300/90 font-semibold">
                        {t("fastingElapsedOf", { pct: fastingPct, hours: fastingState.targetHours })}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">{t("fastingOpenHint")}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleToggleFasting}
                  className={`shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-black transition active:scale-95 whitespace-nowrap ${
                    fastingState.isFasting
                      ? "bg-rose-500/20 border border-rose-500/50 text-rose-300"
                      : "bg-amber-400 text-slate-950 shadow-md"
                  }`}
                >
                  {fastingState.isFasting ? t("endFast") : t("startFast")}
                </button>
              </div>
              {fastingState.isFasting && (
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${fastingPct}%` }}
                  />
                </div>
              )}
            </section>

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 136 136">
                    <circle cx="68" cy="68" r={ringRadius} stroke="#1e293b" strokeWidth="11" fill="transparent" />
                    <circle
                      cx="68"
                      cy="68"
                      r={ringRadius}
                      stroke="url(#gradRing)"
                      strokeWidth="11"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id="gradRing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center tabular-nums">
                    <span className="text-[10px] text-slate-400 font-semibold">{t("remaining")}</span>
                    <span className="text-xl font-black text-white leading-tight">{calRemaining}</span>
                    <span dir="ltr" className="text-[10px] text-emerald-400 font-medium">
                      {Math.round(totals.cal)} / {goals.cal}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2.5 tabular-nums">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-rose-400">{t("protein")}</span>
                      <span dir="ltr" className="text-slate-300 font-semibold">
                        {Math.round(totals.prot)} / {goals.prot}g
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totals.prot / (goals.prot || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-amber-400">{t("carbs")}</span>
                      <span dir="ltr" className="text-slate-300 font-semibold">
                        {Math.round(totals.carb)} / {goals.carb}g
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totals.carb / (goals.carb || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-purple-400">{t("fat")}</span>
                      <span dir="ltr" className="text-slate-300 font-semibold">
                        {Math.round(totals.fat)} / {goals.fat}g
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totals.fat / (goals.fat || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {savedCombos.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-800/90 space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold block">
                    {t("oneTapPresets")}
                  </span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                    {savedCombos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => applySavedCombo(c)}
                        className="shrink-0 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap"
                      >
                        + {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/50 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-bold text-emerald-300">{t("stepCounterTitle")}</h2>
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    {t("stepGoalSub", {
                      goal: (goals.steps || 10000).toLocaleString(),
                      kcal: estStepKcal
                    })}
                  </p>
                </div>
                <div className="text-end tabular-nums">
                  <span className="text-xl font-black text-emerald-400">
                    {(currentDayData.steps || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-emerald-200">
                    {t("donePct", { pct: stepsPct })}
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mb-3 border border-emerald-950">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-lime-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stepsPct}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 tabular-nums" dir="ltr">
                <button type="button" onClick={() => handleAddSteps(1000)} className="min-h-[40px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 py-1.5 rounded-xl text-xs font-bold active:scale-95">+1,000</button>
                <button type="button" onClick={() => handleAddSteps(2500)} className="min-h-[40px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 py-1.5 rounded-xl text-xs font-bold active:scale-95">+2,500</button>
                <button type="button" onClick={() => handleAddSteps(5000)} className="min-h-[40px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 py-1.5 rounded-xl text-xs font-bold active:scale-95">+5,000</button>
                <button type="button" onClick={() => handleAddSteps(-1000)} className="min-h-[40px] bg-slate-800 border border-slate-700 text-slate-300 py-1.5 rounded-xl text-xs font-bold active:scale-95">-1,000</button>
              </div>
            </section>

            <section className="bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-800/50 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-bold text-cyan-300">{t("waterTitle")}</h2>
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    {t("waterTargetSub", {
                      goal: goals.water,
                      glasses: Math.round((currentDayData.water || 0) / 250)
                    })}
                  </p>
                </div>
                <div className="text-end tabular-nums" dir="ltr">
                  <span className="text-xl font-black text-cyan-400">{currentDayData.water || 0}</span>
                  <span className="text-xs text-cyan-200 ml-1">ml ({waterPct}%)</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mb-3 border border-cyan-950">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 tabular-nums" dir="ltr">
                <button type="button" onClick={() => handleAddWater(250)} className="min-h-[40px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 py-1.5 rounded-xl text-xs font-bold active:scale-95">+250ml</button>
                <button type="button" onClick={() => handleAddWater(500)} className="min-h-[40px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 py-1.5 rounded-xl text-xs font-bold active:scale-95">+500ml</button>
                <button type="button" onClick={() => handleAddWater(750)} className="min-h-[40px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 py-1.5 rounded-xl text-xs font-bold active:scale-95">+750ml</button>
                <button type="button" onClick={() => handleAddWater(-250)} className="min-h-[40px] bg-slate-800 border border-slate-700 text-slate-300 py-1.5 rounded-xl text-xs font-bold active:scale-95">-250ml</button>
              </div>
            </section>

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
              <button
                type="button"
                onClick={() => setShowMicros(!showMicros)}
                className="w-full flex items-center justify-between text-start gap-2"
              >
                <div>
                  <h2 className="text-sm font-bold text-slate-200">{t("microsTitle")}</h2>
                  <p className="text-[11px] text-slate-400">{t("microsSub")}</p>
                </div>
                <span className="text-emerald-400 text-xs font-bold whitespace-nowrap shrink-0">
                  {showMicros ? `${t("hide")} ▲` : `${t("show")} ▼`}
                </span>
              </button>
              {showMicros && (
                <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-800 tabular-nums">
                  {[
                    { label: t("dietaryFiber"), val: totals.fib.toFixed(1), goal: goals.fib, unit: "g", color: "bg-emerald-400" },
                    { label: t("totalSugar"), val: totals.sug.toFixed(1), goal: goals.sug, unit: "g", color: "bg-pink-400" },
                    { label: t("sodiumNa"), val: Math.round(totals.sod), goal: goals.sod, unit: "mg", color: "bg-amber-400" },
                    { label: t("potassiumK"), val: Math.round(totals.pot), goal: goals.pot, unit: "mg", color: "bg-cyan-400" },
                    { label: t("calciumCa"), val: Math.round(totals.calc), goal: goals.calc, unit: "mg", color: "bg-indigo-400" },
                    { label: t("ironFe"), val: totals.iro.toFixed(1), goal: goals.iro, unit: "mg", color: "bg-rose-400" },
                    { label: t("vitaminC"), val: totals.vitc.toFixed(1), goal: goals.vitc, unit: "mg", color: "bg-orange-400", span2: true }
                  ].map((m, idx) => {
                    const pct = Math.min(100, Math.round((parseFloat(m.val) / (m.goal || 1)) * 100));
                    return (
                      <div key={idx} className={`bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-2xl ${m.span2 ? "col-span-2" : ""}`}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">{m.label}</span>
                          <span dir="ltr" className="text-slate-200 font-bold">
                            {m.val} / {m.goal}{m.unit}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`${m.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-bold text-slate-200">
                  {t("loggedMealsTitle", { count: (currentDayData.foods || []).length })}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("kitchen")}
                    className="text-xs bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap"
                  >
                    {t("cookRecipeBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("logger")}
                    className="text-xs bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl active:scale-95 transition whitespace-nowrap"
                  >
                    {t("addFoodBtn")}
                  </button>
                </div>
              </div>
              {!currentDayData.foods || currentDayData.foods.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-5">
                  {t("noMealsYet", { date: selectedDate })}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {currentDayData.foods.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-bold text-emerald-300">
                              {item.meal ? translateMeal(item.meal) : t("mealFallback")}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span dir="ltr" className="tabular-nums">{item.time}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-100 truncate mt-0.5">{item.name}</p>
                          <p dir="ltr" className="text-[11px] text-slate-400 mt-0.5 tabular-nums text-start">
                            <strong className="text-emerald-400">{item.cal} kcal</strong> · P: {item.prot}g · C: {item.carb}g · F: {item.fat}g
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFoodLog(item.id)}
                          className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex gap-2">
                    <input
                      type="text"
                      placeholder={t("comboNamePlaceholder")}
                      value={comboNameInput}
                      onChange={(e) => setComboNameInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={saveTodayAsCombo}
                      className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-bold px-3 py-2 rounded-xl text-xs shrink-0 whitespace-nowrap"
                    >
                      {t("savePreset")}
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}

        {/* ================= KITCHEN & RECIPES TAB ================= */}
        {activeTab === "kitchen" && (
          <KitchenTab
            key={kitchenLaunch.key}
            initialSubTab={kitchenLaunch.subTab}
            initialOpenRecipeId={kitchenLaunch.recipeId}
            homeInventory={homeInventory}
            setHomeInventory={setHomeInventory}
            recipes={recipes}
            setRecipes={setRecipes}
            allFoods={allFoods}
            todayKey={todayKey}
            selectedMeal={selectedMeal}
            onLogRecipeMeal={handleLogRecipeMeal}
            triggerToast={triggerToast}
          />
        )}

        {/* ================= FOOD LOGGER & JSON IMPORT TAB ================= */}
        {activeTab === "logger" && (
          <div className="space-y-4">
            <section className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/60 border border-indigo-500/40 rounded-3xl p-4 shadow-xl">
              <h2 className="text-sm font-extrabold text-indigo-300">{t("importFoodsTitle")}</h2>
              <p className="text-[11px] text-slate-400">{t("importFoodsSub")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUploadJson}
                className="hidden"
              />
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[42px] bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs shadow active:scale-95 transition whitespace-nowrap"
                >
                  {t("uploadJsonFile")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJsonPasteModal(!showJsonPasteModal);
                    setFoodJsonError("");
                  }}
                  className="min-h-[42px] bg-slate-900 hover:bg-slate-800 border border-indigo-400/50 text-indigo-200 font-bold py-2.5 px-3 rounded-xl text-xs active:scale-95 transition whitespace-nowrap"
                >
                  {showJsonPasteModal ? t("closePasteBox") : t("pasteJsonText")}
                </button>
              </div>
              {foodJsonError && (
                <div className="mt-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200">
                  {foodJsonError}
                </div>
              )}
              {showJsonPasteModal && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <textarea
                    dir="ltr"
                    rows="5"
                    placeholder='[{"name": "Chicken Mandi", "cal": 210, "prot": 24, "carb": 18, "fat": 5, "unit": "100g"}]'
                    value={jsonPasteText}
                    onChange={(e) => setJsonPasteText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => processImportedFoodJson(jsonPasteText)}
                    className="w-full min-h-[42px] bg-emerald-500 text-slate-950 font-black py-2 rounded-xl text-xs"
                  >
                    {t("importPastedNow")}
                  </button>
                </div>
              )}
            </section>

            {selectedFood && previewNutrients && (
              <section className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-700/50 rounded-3xl p-4 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-emerald-300 font-bold">
                      {t("selectedPrefix", { category: translateCategory(selectedFood.category) })}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">{selectedFood.name}</h3>
                    <p className="text-xs text-slate-400">
                      {t("baseUnit", { unit: selectedFood.unit })}
                    </p>
                  </div>
                  <div className="text-end tabular-nums" dir="ltr">
                    <span className="text-2xl font-black text-emerald-400">{previewNutrients.cal}</span>
                    <span className="block text-[10px] text-slate-400">kcal</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">{t("mealSlot")}</label>
                    <select
                      value={selectedMeal}
                      onChange={(e) => setSelectedMeal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {MEAL_TYPES.map((m) => (
                        <option key={m} value={m}>{translateMeal(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {selectedFood.isServing ? t("servings") : t("weightG")}
                    </label>
                    <input
                      type="number"
                      step={selectedFood.isServing ? "0.5" : "10"}
                      min="0.1"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs font-bold text-white tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar" dir="ltr">
                  {(selectedFood.isServing ? [0.5, 1, 1.5, 2, 3, 4] : [50, 100, 150, 200, 300, 400]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountInput(val)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition tabular-nums whitespace-nowrap shrink-0 ${
                        Number(amountInput) === val
                          ? "bg-emerald-500 text-slate-950 border-emerald-400"
                          : "bg-slate-900 text-slate-300 border-slate-800"
                      }`}
                    >
                      {selectedFood.isServing ? `${val}x` : `${val}g`}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-center text-[11px] tabular-nums">
                  <div className="bg-slate-950/80 p-1.5 rounded-xl"><span className="text-slate-400 block text-[10px]">{t("protein")}</span><strong dir="ltr" className="text-rose-400 inline-block">{previewNutrients.prot}g</strong></div>
                  <div className="bg-slate-950/80 p-1.5 rounded-xl"><span className="text-slate-400 block text-[10px]">{t("carbs")}</span><strong dir="ltr" className="text-amber-400 inline-block">{previewNutrients.carb}g</strong></div>
                  <div className="bg-slate-950/80 p-1.5 rounded-xl"><span className="text-slate-400 block text-[10px]">{t("fat")}</span><strong dir="ltr" className="text-purple-400 inline-block">{previewNutrients.fat}g</strong></div>
                  <div className="bg-slate-950/80 p-1.5 rounded-xl"><span className="text-slate-400 block text-[10px]">{t("fiber")}</span><strong dir="ltr" className="text-emerald-400 inline-block">{previewNutrients.fib}g</strong></div>
                </div>
                <button
                  type="button"
                  onClick={handleLogSelectedFood}
                  className="w-full min-h-[44px] mt-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg active:scale-95 transition"
                >
                  {t("logFoodBtn", { name: selectedFood.name, meal: translateMeal(selectedMeal) })}
                </button>
              </section>
            )}

            <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-200">
                  {t("foodDbTitle", { count: allFoods.length })}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(!showCustomModal)}
                  className="text-xs bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold px-3 py-1.5 rounded-xl whitespace-nowrap"
                >
                  {showCustomModal ? t("closeForm") : t("manualFoodBtn")}
                </button>
              </div>
              {showCustomModal && (
                <form onSubmit={handleSaveCustomFood} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder={t("foodNamePlaceholder")}
                    value={newFood.name}
                    onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      id="servToggle"
                      checked={newFood.isServing}
                      onChange={(e) => setNewFood({ ...newFood, isServing: e.target.checked })}
                    />
                    <label htmlFor="servToggle">{t("trackByServing")}</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" step="any" required placeholder={t("caloriesKcal")} value={newFood.cal} onChange={(e) => setNewFood({ ...newFood, cal: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white" />
                    <input type="number" step="any" placeholder={t("proteinG")} value={newFood.prot} onChange={(e) => setNewFood({ ...newFood, prot: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white" />
                    <input type="number" step="any" placeholder={t("carbsG")} value={newFood.carb} onChange={(e) => setNewFood({ ...newFood, carb: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white" />
                    <input type="number" step="any" placeholder={t("fatG")} value={newFood.fat} onChange={(e) => setNewFood({ ...newFood, fat: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white" />
                  </div>
                  <button type="submit" className="w-full min-h-[42px] bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs">
                    {t("saveCustomFood")}
                  </button>
                </form>
              )}
              <input
                type="text"
                placeholder={t("searchFoodPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {["All", "JSON Import", "Custom", "Protein", "Carbs", "Regional", "Fruits & Veg", "Dairy", "Fats", "Supplements"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    {translateCategory(cat)}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFoodItem(food)}
                    className={`w-full text-start p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                      selectedFood?.id === food.id
                        ? "bg-emerald-950/50 border-emerald-500/70"
                        : "bg-slate-950/80 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{food.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        {t("perUnit", { unit: food.unit })}{" "}
                        <span dir="ltr" className="inline-block">
                          <span className="text-emerald-400 font-semibold">{food.cal} kcal</span> · P: {food.prot}g · C: {food.carb}g · F: {food.fat}g
                        </span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 shrink-0">
                      {t("select")}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ================= UNIFIED PROGRESS TAB (WEEKLY + WEIGHT) ================= */}
        {activeTab === "progress" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setProgressSubTab("weekly")}
                className={`min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  progressSubTab === "weekly"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("weeklyAnalyticsTab")}
              </button>
              <button
                type="button"
                onClick={() => setProgressSubTab("weight")}
                className={`min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  progressSubTab === "weight"
                    ? "bg-emerald-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t("weightTrendTab")}
              </button>
            </div>

            {progressSubTab === "weekly" && (
              <div className="space-y-4">
                <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-extrabold text-white">{t("weeklyGraphTitle")}</h2>
                      <p className="text-[11px] text-slate-400">
                        {t("daysEnding", { date: selectedDate })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold">
                      <span className="text-emerald-400">{t("calories")}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-400">{t("water")}</span>
                    </div>
                  </div>
                  <div dir="ltr">
                    {(() => {
                      const maxCal = Math.max(goals.cal * 1.25, ...weeklyDaysData.map((d) => d.cal), 2200);
                      const maxWat = Math.max(goals.water * 1.25, ...weeklyDaysData.map((d) => d.water), 3500);
                      const chartH = 165, chartW = 340, padL = 34, padR = 36, padT = 16, padB = 34;
                      const innerW = chartW - padL - padR, innerH = chartH - padT - padB, slotW = innerW / 7;
                      return (
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 mt-2">
                          {[0, 0.5, 1].map((frac, idx) => {
                            const y = padT + innerH - frac * innerH;
                            return (
                              <g key={idx}>
                                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                                <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8.5" fill="#34d399" fontWeight="bold">{Math.round(frac * maxCal)}</text>
                                <text x={chartW - padR + 4} y={y + 3} textAnchor="start" fill="#22d3ee" fontSize="8.5" fontWeight="bold">{Math.round(frac * maxWat)}</text>
                              </g>
                            );
                          })}
                          {weeklyDaysData.map((d, i) => {
                            const groupX = padL + i * slotW, barW = 10;
                            const calBarH = Math.max(2, (d.cal / maxCal) * innerH);
                            const watBarH = Math.max(2, (d.water / maxWat) * innerH);
                            const calX = groupX + slotW / 2 - barW - 1.5, watX = groupX + slotW / 2 + 1.5;
                            return (
                              <g key={d.date} onClick={() => setSelectedDate(d.date)} className="cursor-pointer">
                                <rect x={calX} y={padT + innerH - calBarH} width={barW} height={calBarH} rx="3" fill="#10b981" />
                                <rect x={watX} y={padT + innerH - watBarH} width={barW} height={watBarH} rx="3" fill="#06b6d4" />
                                <text x={groupX + slotW / 2} y={chartH - 15} textAnchor="middle" fontSize="8.5" fill={d.date === selectedDate ? "#34d399" : "#94a3b8"}>{d.shortDay}</text>
                                <text x={groupX + slotW / 2} y={chartH - 5} textAnchor="middle" fontSize="7.5" fill="#64748b">{d.date.slice(5)}</text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2.5 border-t border-slate-800 text-center text-xs tabular-nums">
                    <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-400 block">{t("avgCal")}</span><strong className="text-emerald-400 text-[11px]">{Math.round(weeklyDaysData.reduce((s, d) => s + d.cal, 0) / 7)}</strong></div>
                    <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-400 block">{t("avgProt")}</span><strong dir="ltr" className="text-rose-400 text-[11px] inline-block">{Math.round(weeklyDaysData.reduce((s, d) => s + d.prot, 0) / 7)}g</strong></div>
                    <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-400 block">{t("avgWater")}</span><strong dir="ltr" className="text-cyan-400 text-[11px] inline-block">{(weeklyDaysData.reduce((s, d) => s + d.water, 0) / 7000).toFixed(1)}L</strong></div>
                    <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800"><span className="text-[9px] text-slate-400 block">{t("avgSteps")}</span><strong className="text-lime-400 text-[11px]">{Math.round(weeklyDaysData.reduce((s, d) => s + d.steps, 0) / 7).toLocaleString()}</strong></div>
                  </div>
                </section>

                <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-emerald-300">
                      {t("exactStepsTitle", { date: selectedDate })}
                    </h3>
                    <button type="button" onClick={() => updateCurrentDay((d) => ({ ...d, steps: 0 }))} className="text-[11px] text-rose-400 font-bold">
                      {t("resetSteps")}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t("exactStepsPlaceholder")}
                      value={customStepsInput}
                      onChange={(e) => setCustomStepsInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(customStepsInput, 10);
                        if (!isNaN(val) && val >= 0) {
                          updateCurrentDay((d) => ({ ...d, steps: val }));
                          setCustomStepsInput("");
                          triggerToast(t("toastStepsSet", { steps: val.toLocaleString() }));
                        }
                      }}
                      className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap"
                    >
                      {t("setExact")}
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-black text-cyan-300 tabular-nums">
                      {t("customWaterTitle", { amount: currentDayData.water || 0 })}
                    </h3>
                    <button type="button" onClick={() => updateCurrentDay((d) => ({ ...d, water: 0, waterHistory: [] }))} className="text-[11px] text-rose-400 font-bold">
                      {t("resetWater")}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t("customWaterPlaceholder")}
                      value={customWaterInput}
                      onChange={(e) => setCustomWaterInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(customWaterInput, 10);
                        if (val) {
                          handleAddWater(val);
                          setCustomWaterInput("");
                        }
                      }}
                      className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap"
                    >
                      {t("addMlBtn")}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {progressSubTab === "weight" && (
              <div className="space-y-4">
                <section className="grid grid-cols-4 gap-2 tabular-nums">
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-slate-400 block">{t("current")}</span>
                    <strong dir="ltr" className="text-base font-black text-white inline-block">{weightStats.current}kg</strong>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-slate-400 block">{t("change")}</span>
                    <strong dir="ltr" className={`text-base font-black inline-block ${weightStats.change <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {weightStats.change > 0 ? `+${weightStats.change}` : weightStats.change}kg
                    </strong>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-slate-400 block">{t("toTarget", { target: goals.targetWeight })}</span>
                    <strong dir="ltr" className="text-base font-black text-cyan-400 inline-block">
                      {weightStats.remaining > 0 ? `-${weightStats.remaining}` : t("goalReached")}
                    </strong>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-slate-400 block">{t("bmi")}</span>
                    <strong className="text-base font-black text-amber-400">{weightStats.bmi}</strong>
                  </div>
                </section>

                <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-extrabold text-white">{t("weightTrendTab")}</h2>
                    <div className="flex gap-1" dir="ltr">
                      {[{ label: "7D", days: 7 }, { label: "30D", days: 30 }, { label: "90D", days: 90 }, { label: t("allRange"), days: 365 }].map((r) => (
                        <button
                          key={r.days}
                          type="button"
                          onClick={() => setWeightRangeDays(r.days)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            weightRangeDays === r.days
                              ? "bg-emerald-500 text-slate-950 border-emerald-400"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div dir="ltr">
                    {filteredWeightLogs.length > 0 && (() => {
                      const weights = filteredWeightLogs.map((w) => w.weight);
                      const minW = Math.floor(Math.min(...weights, goals.targetWeight || 110) - 2);
                      const maxW = Math.ceil(Math.max(...weights) + 2);
                      const spanW = Math.max(4, maxW - minW);
                      const svgW = 340, svgH = 170, padL = 36, padR = 18, padT = 18, padB = 32;
                      const plotW = svgW - padL - padR, plotH = svgH - padT - padB;
                      const points = filteredWeightLogs.map((entry, idx) => ({
                        x: filteredWeightLogs.length === 1 ? padL + plotW / 2 : padL + (idx / (filteredWeightLogs.length - 1)) * plotW,
                        y: padT + plotH - ((entry.weight - minW) / spanW) * plotH,
                        ...entry
                      }));
                      const targetY = padT + plotH - (((goals.targetWeight || 110) - minW) / spanW) * plotH;
                      const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");
                      return (
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-52">
                          <line x1={padL} y1={targetY} x2={svgW - padR} y2={targetY} stroke="#06b6d4" strokeDasharray="4 2" strokeWidth="1.2" />
                          {points.length > 1 && <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={polylineStr} />}
                          {points.map((p) => (
                            <g key={p.date}>
                              <circle cx={p.x} cy={p.y} r="4" fill="#090d16" stroke="#34d399" strokeWidth="2.5" />
                              <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="8" fill="#ecfdf5" fontWeight="bold">{p.weight}</text>
                              <text x={p.x} y={svgH - 10} textAnchor="middle" fontSize="7.5" fill="#94a3b8">{p.date.slice(5)}</text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                </section>

                <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
                  <h3 className="text-sm font-bold text-emerald-400 mb-2.5">{t("logBodyWeight")}</h3>
                  <form onSubmit={handleAddOrUpdateWeight} className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <input type="date" required value={weightInputDate} onChange={(e) => setWeightInputDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white tabular-nums" />
                      <input type="number" step="0.1" required placeholder={t("weightKgPlaceholder")} value={weightInputValue} onChange={(e) => setWeightInputValue(e.target.value)} className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs font-bold text-white tabular-nums" />
                    </div>
                    <input type="text" placeholder={t("optionalNote")} value={weightInputNote} onChange={(e) => setWeightInputNote(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                    <button type="submit" className="w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg">
                      {t("saveWeightEntry")}
                    </button>
                  </form>
                </section>

                <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-400">
                    {t("historyCount", { count: weightLogs.length })}
                  </h3>
                  {weightLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).map((w) => (
                    <div key={w.date} className="bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-2xl flex items-center justify-between text-xs tabular-nums">
                      <div>
                        <strong dir="ltr" className="font-bold text-white inline-block">{w.weight} kg</strong>
                        <span className="text-slate-400 ms-2">{w.date}</span>
                        {w.note && <span className="text-slate-500 ms-2">· {w.note}</span>}
                      </div>
                      <button type="button" onClick={() => handleDeleteWeight(w.date)} className="text-rose-400 px-2 py-1 font-bold" aria-label={`Delete weight for ${w.date}`}>
                        ✕
                      </button>
                    </div>
                  ))}
                </section>
              </div>
            )}
          </div>
        )}

        {/* ================= USER PROFILE & ALL SETTINGS VIEW ================= */}
        {activeTab === "profile" && (
          <ProfileView
            key={profileInitialSection}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            goals={goals}
            setGoals={setGoals}
            setFastingState={setFastingState}
            notificationPrefs={notificationPrefs}
            setNotificationPrefs={setNotificationPrefs}
            weightStats={weightStats}
            activeStreak={activeStreak}
            selectedDate={selectedDate}
            homeInventoryCount={homeInventory.length}
            recipesCount={recipes.length}
            backupError={backupError}
            onExportJSON={handleExportJSON}
            onRestoreBackupFile={handleRestoreFullBackup}
            onResetSelectedDay={() => {
              updateCurrentDay(() => ({ water: 0, steps: 0, waterHistory: [], foods: [] }));
              triggerToast(t("toastClearedDay"));
            }}
            onSendTestNotification={handleSendTestNotification}
            onReplaySplash={() => setSplashKey((k) => k + 1)}
            onBack={() => setActiveTab(previousTab || "dashboard")}
            initialOpenSection={profileInitialSection}
            triggerToast={triggerToast}
          />
        )}
      </main>

      {/* Fixed 4-Tab Bottom Navigation (Settings removed & consolidated into Profile Avatar) */}
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/90 px-2 pt-2 safe-bottom-nav grid grid-cols-4 items-center z-40"
      >
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition ${
                active
                  ? "text-emerald-400 bg-emerald-500/10 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] mt-1 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Smart In-App Notification Center Modal */}
      {showNotifCenter && (
        <NotificationCenterModal
          alerts={smartAlerts}
          dismissedIds={dismissedAlertIds}
          onDismiss={(id) => setDismissedAlertIds((prev) => [...prev, id])}
          onClearDismissed={() => setDismissedAlertIds([])}
          onExecuteAction={handleExecuteAlertAction}
          onSendTestNotification={handleSendTestNotification}
          onOpenSettings={() => handleOpenProfile("notifications")}
          onClose={() => setShowNotifCenter(false)}
        />
      )}
    </div>
  );
}

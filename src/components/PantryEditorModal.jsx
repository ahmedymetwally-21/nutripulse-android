import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { UNIT_SUGGESTIONS } from "../data/defaultData";
import { inferUnitFromFood, shiftDate } from "../utils/kitchenEngine";
import { useLanguage } from "../i18n/useLanguage";

export default function PantryEditorModal({
  initialItem,
  allFoods,
  todayKey,
  onClose,
  onSave
}) {
  const { t } = useLanguage();
  const isEditing = Boolean(initialItem);

  const [foodSearch, setFoodSearch] = useState("");
  const [foodId, setFoodId] = useState(initialItem?.foodId || "");
  const [name, setName] = useState(initialItem?.name || "");
  const [quantity, setQuantity] = useState(initialItem?.quantity ?? 500);
  const [unit, setUnit] = useState(initialItem?.unit || "g");
  const [purchaseDate, setPurchaseDate] = useState(initialItem?.purchaseDate || todayKey);
  const [expirationDate, setExpirationDate] = useState(
    initialItem?.expirationDate || shiftDate(todayKey, 7)
  );
  const [formError, setFormError] = useState("");

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    if (!q) return allFoods.slice(0, 12);
    return allFoods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 15);
  }, [allFoods, foodSearch]);

  const handleSelectFood = (food) => {
    setFoodId(food.id);
    setName(food.name);
    const inferred = inferUnitFromFood(food);
    setUnit(inferred);
    setQuantity(food.isServing ? Math.max(2, food.defaultAmount || 1) : 500);
    setFoodSearch("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError(t("errEnterIngredientName"));
      return;
    }
    const numQty = parseFloat(quantity);
    if (!numQty || numQty <= 0) {
      setFormError(t("errValidQty"));
      return;
    }
    onSave({
      id: initialItem?.id || `inv_${Date.now()}`,
      name: name.trim(),
      foodId: foodId || null,
      quantity: +numQty.toFixed(2),
      unit: unit.trim() || "g",
      purchaseDate: purchaseDate || todayKey,
      expirationDate: expirationDate || shiftDate(todayKey, 7)
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? t("editHomeIngredient") : t("addToHomePantry")}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-[#0b1120] border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-slate-800 bg-[#090d16] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-white">
              {isEditing ? t("editHomeIngredient") : t("addToHomePantry")}
            </h2>
            <p className="text-[11px] text-slate-400">{t("pantryModalSub")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {formError && (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-rose-200">
              {formError}
            </div>
          )}

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
            <label className="text-[11px] font-bold text-emerald-300 block">
              {t("linkFromFoodDb")}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("searchPantryFoodPlaceholder")}
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-8 pe-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => handleSelectFood(food)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border whitespace-nowrap shrink-0 transition ${
                    foodId === food.id
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600"
                  }`}
                >
                  {food.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              {t("ingredientNameLabel")}
            </label>
            <input
              type="text"
              required
              placeholder={t("ingredientExamplesPlaceholder")}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (foodId) {
                  const linked = allFoods.find((f) => f.id === foodId);
                  if (linked && linked.name !== e.target.value) setFoodId("");
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">{t("quantityLabel")}</label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white tabular-nums focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">{t("unitLabel")}</label>
              <input
                type="text"
                list="pantry-unit-suggestions"
                required
                placeholder="g, eggs, cans..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <datalist id="pantry-unit-suggestions">
                {UNIT_SUGGESTIONS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" dir="ltr">
            {["g", "kg", "ml", "eggs", "cans", "tbsp", "loaves", "containers", "scoops"].map(
              (u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap shrink-0 transition ${
                    unit === u
                      ? "bg-emerald-500 text-slate-950 border-emerald-400"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  {u}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {t("purchaseDateLabel")}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {t("expirationDateLabel")}
              </label>
              <input
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 me-1">{t("quickExpiry")}</span>
            {[
              { label: "+2d", days: 2 },
              { label: "+5d", days: 5 },
              { label: "+7d", days: 7 },
              { label: "+14d", days: 14 },
              { label: "+30d", days: 30 },
              { label: "+6mo", days: 180 }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                dir="ltr"
                onClick={() => setExpirationDate(shiftDate(todayKey, preset.days))}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/50 active:scale-95 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#090d16] flex gap-2 shrink-0 safe-bottom-nav">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="flex-2 min-h-[44px] bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg px-5 active:scale-[0.98] transition"
          >
            {isEditing ? t("saveChanges") : t("addToPantryBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}

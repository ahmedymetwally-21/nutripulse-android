import {
  X,
  Bell,
  Droplets,
  Timer,
  Refrigerator,
  TrendingUp,
  BellRing,
  SlidersHorizontal,
  CheckCheck
} from "lucide-react";
import { useLanguage } from "../i18n/useLanguage";

export default function NotificationCenterModal({
  alerts,
  dismissedIds,
  onDismiss,
  onClearDismissed,
  onExecuteAction,
  onSendTestNotification,
  onOpenSettings,
  onClose
}) {
  const { t } = useLanguage();

  const visibleAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));
  const hasDismissed = dismissedIds.length > 0;

  const getAlertVisual = (type) => {
    switch (type) {
      case "hydration":
        return {
          icon: Droplets,
          wrap: "bg-cyan-950/35 border-cyan-500/35",
          iconCls: "text-cyan-400 bg-cyan-500/15"
        };
      case "fasting":
        return {
          icon: Timer,
          wrap: "bg-amber-950/35 border-amber-500/35",
          iconCls: "text-amber-300 bg-amber-500/15"
        };
      case "pantry":
        return {
          icon: Refrigerator,
          wrap: "bg-amber-950/30 border-amber-500/35",
          iconCls: "text-amber-400 bg-amber-500/15"
        };
      case "evening":
        return {
          icon: TrendingUp,
          wrap: "bg-emerald-950/35 border-emerald-500/35",
          iconCls: "text-emerald-400 bg-emerald-500/15"
        };
      default:
        return {
          icon: BellRing,
          wrap: "bg-indigo-950/35 border-indigo-500/35",
          iconCls: "text-indigo-300 bg-indigo-500/15"
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("notifCenterTitle")}
    >
      <div className="bg-[#0b1120] border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-3 pb-3.5 border-b border-slate-800 bg-[#090d16] shrink-0">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-white truncate">
                  {t("notifCenterTitle")}
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  {t("notifCenterSub")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {visibleAlerts.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-100">{t("notifAllCaughtUp")}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t("notifAllCaughtUpSub")}
              </p>
              {hasDismissed && (
                <button
                  type="button"
                  onClick={onClearDismissed}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 px-3 py-1.5 rounded-xl"
                >
                  {t("clearDismissed")}
                </button>
              )}
            </div>
          ) : (
            visibleAlerts.map((alert) => {
              const vis = getAlertVisual(alert.type);
              const Icon = vis.icon;
              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-3.5 space-y-2.5 ${vis.wrap}`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${vis.iconCls}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-extrabold text-white">{alert.title}</h3>
                          {alert.scheduleBadge && (
                            <span
                              dir="ltr"
                              className="text-[10px] font-semibold text-slate-300 tabular-nums"
                            >
                              · {alert.scheduleBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200/90 mt-1 leading-relaxed">
                          {alert.body}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onDismiss(alert.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-950/70 border border-slate-700/80 text-slate-300 active:scale-95 transition whitespace-nowrap"
                    >
                      {t("dismiss")}
                    </button>
                    {alert.actionType && (
                      <button
                        type="button"
                        onClick={() => onExecuteAction(alert)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-[11px] font-black bg-emerald-500 text-slate-950 active:scale-95 transition whitespace-nowrap"
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16] grid grid-cols-2 gap-2 shrink-0 safe-bottom-nav">
          <button
            type="button"
            onClick={onSendTestNotification}
            className="min-h-[44px] bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs px-3 inline-flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
          >
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            <span>{t("testNotificationBtn")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="min-h-[44px] bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs px-3 inline-flex items-center justify-center gap-1.5 active:scale-95 transition whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>{t("sectionNotifications")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

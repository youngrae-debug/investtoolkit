import { GOOGLE_ANALYTICS_ID } from "./config";

type AnalyticsEventProperties = {
  gps_started: undefined;
  gps_step_completed: { step_number: number };
  gps_calculation_completed: { result_status: "calculated" | "negative_flow" };
  goal_action_selected: { action_type: "monthly" | "balanced" | "timeline" };
  feasibility_limits_applied: undefined;
  monthly_action_plan_copied: { action_type: "monthly" | "balanced" | "timeline" };
  condition_compared: {
    scenario_type: "monthly-100k" | "monthly-200k" | "bonus-5m" | "car-30m" | "pause-6m";
  };
  plan_saved: undefined;
  monthly_update_saved: { entry_mode: "savings" | "cashflow" };
  result_copied: undefined;
  web_share_used: undefined;
  share_card_created: undefined;
  backup_exported: undefined;
  backup_imported: undefined;
  local_data_deleted: undefined;
};

export type SafeAnalyticsEventName = keyof AnalyticsEventProperties;

const allowedPropertyNames: {
  [EventName in SafeAnalyticsEventName]: readonly (keyof NonNullable<AnalyticsEventProperties[EventName]>)[];
} = {
  gps_started: [],
  gps_step_completed: ["step_number"],
  gps_calculation_completed: ["result_status"],
  goal_action_selected: ["action_type"],
  feasibility_limits_applied: [],
  monthly_action_plan_copied: ["action_type"],
  condition_compared: ["scenario_type"],
  plan_saved: [],
  monthly_update_saved: ["entry_mode"],
  result_copied: [],
  web_share_used: [],
  share_card_created: [],
  backup_exported: [],
  backup_imported: [],
  local_data_deleted: [],
};

type AnalyticsValue = string | number;
type AnalyticsProperties = Record<string, AnalyticsValue>;
type AnalyticsEventArguments<EventName extends SafeAnalyticsEventName> =
  AnalyticsEventProperties[EventName] extends undefined
    ? []
    : [properties: AnalyticsEventProperties[EventName]];

export function filterAnalyticsProperties(
  eventName: SafeAnalyticsEventName,
  properties: AnalyticsProperties,
): AnalyticsProperties {
  const allowed = new Set<string>(allowedPropertyNames[eventName] as readonly string[]);
  return Object.fromEntries(Object.entries(properties).filter(([name, value]) => (
    allowed.has(name)
    && (typeof value === "number" ? Number.isFinite(value) : value.length <= 40)
  )));
}

export function trackSafeAnalyticsEvent<EventName extends SafeAnalyticsEventName>(
  eventName: EventName,
  ...args: AnalyticsEventArguments<EventName>
) {
  if (typeof window === "undefined" || !window.gtag) return;
  const properties = (args[0] ?? {}) as AnalyticsProperties;
  window.gtag("event", eventName, {
    page_path: window.location.pathname,
    send_to: GOOGLE_ANALYTICS_ID,
    ...filterAnalyticsProperties(eventName, properties),
  });
}

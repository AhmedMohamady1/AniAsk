export const TRACKING_STATUSES = [
    "watching",
    "completed",
    "on_hold",
    "dropped",
    "planning",
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

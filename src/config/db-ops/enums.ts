// ─── Global Type ──────────────────────────────────────────────────────────────

export const GLOBAL_TYPE = {
    OFFLINE: "offline",
    ONLINE: "online",
    ANY_OFFLINE: "any_offline",
    ANY_ONLINE: "any_online",
} as const;

export type GlobalType = (typeof GLOBAL_TYPE)[keyof typeof GLOBAL_TYPE];

export const GLOBAL_TYPE_OPTIONS: { value: GlobalType; label: string }[] = [
    { value: GLOBAL_TYPE.OFFLINE, label: "Off-Line" },
    { value: GLOBAL_TYPE.ONLINE, label: "On-Line" },
    { value: GLOBAL_TYPE.ANY_OFFLINE, label: "Any (default: Off-Line)" },
    { value: GLOBAL_TYPE.ANY_ONLINE, label: "Any (default: On-Line)" },
];

// ─── Environment Format ────────────────────────────────────────────────────────

export const ENV_FORMAT = {
    POLYGON: "polygon",
    GRID: "grid",
} as const;

export type EnvFormat = (typeof ENV_FORMAT)[keyof typeof ENV_FORMAT];

export const ENV_FORMAT_OPTIONS: { value: EnvFormat; label: string }[] = [
    { value: ENV_FORMAT.POLYGON, label: "Polygon" },
    { value: ENV_FORMAT.GRID, label: "Grid" },
];

// ─── Object Category ──────────────────────────────────────────────────────────

export const OBJECT_CATEGORY = {
    ZONE: "zone",
    OBSTACLE: "obstacle",
} as const;

export type ObjectCategory = (typeof OBJECT_CATEGORY)[keyof typeof OBJECT_CATEGORY];

export const OBJECT_CATEGORY_OPTIONS: { value: ObjectCategory; label: string }[] = [
    { value: OBJECT_CATEGORY.ZONE, label: "Zone" },
    { value: OBJECT_CATEGORY.OBSTACLE, label: "Obstacle" },
];

// ─── Object Type ──────────────────────────────────────────────────────────────

export const OBJECT_TYPE = {
    OFFLINE: "offline",
    ONLINE: "online",
} as const;

export type ObjectType = (typeof OBJECT_TYPE)[keyof typeof OBJECT_TYPE];

export const OBJECT_TYPE_OPTIONS: { value: ObjectType; label: string }[] = [
    { value: OBJECT_TYPE.OFFLINE, label: "Off-Line" },
    { value: OBJECT_TYPE.ONLINE, label: "On-Line" },
];

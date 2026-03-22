import type { LayerDefinition, LayerGroup, LayerSettingsDefault } from "@/types/layerTypes";

export const LAYER_NAME = {
    GRID: "Grid",
    OBJECTS: "Objects",
    ZONES: "Zones",
    OBSTACLES: "Obstacles",
    MAP_BASE: "Map Base",
} as const;

export type LayerName = (typeof LAYER_NAME)[keyof typeof LAYER_NAME];

export const LAYER_ID = {
    GRID: 1,
    /** ObjectGroup settings-owner for the Objects group (Zones + Obstacles). */
    OBJECTS: 2,
    ZONES: 3,
    OBSTACLES: 4,
    MAP_BASE: 5,
} as const;

/**
 * Groups of LAYER_ID values that map to a single canvas rendering layer and
 * should appear as one combined entry in the layers UI.
 *
 * `settingsLayerId` links each group to its ObjectGroup owner layer.
 */
export const LAYER_GROUPS: LayerGroup[] = [
    {
        id: "objects",
        name: "Objects",
        memberIds: [LAYER_ID.ZONES, LAYER_ID.OBSTACLES],
        settingsLayerId: LAYER_ID.OBJECTS,
    },
];

export const LAYER_REGISTRY: LayerDefinition[] = [
    { id: LAYER_ID.GRID, name: LAYER_NAME.GRID, type: "Grid" },
    /** ObjectGroup: owns group-level settings for Zones + Obstacles; never renders standalone. */
    { id: LAYER_ID.OBJECTS, name: LAYER_NAME.OBJECTS, type: "ObjectGroup" },
    { id: LAYER_ID.ZONES, name: LAYER_NAME.ZONES, type: "Polygon" },
    { id: LAYER_ID.OBSTACLES, name: LAYER_NAME.OBSTACLES, type: "Polygon" },
    { id: LAYER_ID.MAP_BASE, name: LAYER_NAME.MAP_BASE, type: "Map", placeholder: true },
];

export const POLYGON_EDGE_STYLE = {
    SOLID: "Solid",
    DASHED: "Dashed",
    DOTTED: "Dotted",
} as const;
export type PolygonEdgeStyle = (typeof POLYGON_EDGE_STYLE)[keyof typeof POLYGON_EDGE_STYLE];

export const POLYGON_FILL_STYLE = {
    SOLID: "Solid",
    NONE: "None",
} as const;
export type PolygonFillStyle = (typeof POLYGON_FILL_STYLE)[keyof typeof POLYGON_FILL_STYLE];

// ─── Layer Settings Defaults ──────────────────────────────────────────────────
//
// `id` matches the API attribute ID from the blade-provider Debug Layer Styles spec.
// Uniqueness is enforced by the compound PK [id+layerId] in the DB, so the same
// attribute ID can appear in multiple layers.
//
// Internal attributes (not part of the API spec):
//   id 1  → "Visible"      (all layers)
//   id 2  → "Show Vertex IDs"  (Objects ObjectGroup layer only)
//
// API attribute IDs in use:
//   id 5  → "Z-Index"            (all layers)
//   id 10 → "Grid Line Color"    (Grid layer)
//   id 60 → "Polygon Edge Color"  (Polygon layers)
//   id 61 → "Polygon Edge Width"  (Polygon layers)
//   id 62 → "Polygon Edge Style"  (Polygon layers)
//   id 80 → "Polygon Fill Color"  (Polygon layers)
//   id 81 → "Polygon Fill Style"  (Polygon layers)
//
// Only non-null default values are seeded; attributes that default to null are
// absent from the DB until set by the user. Higher Z-Index renders above lower.

export const LAYER_SETTINGS_DEFAULTS: LayerSettingsDefault[] = [
    // ── Grid (internal Grid type) ────────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.GRID, name: "Visible", value: "true" },
    { id: 5, layerId: LAYER_ID.GRID, name: "Z-Index", value: "10" },
    { id: 10, layerId: LAYER_ID.GRID, name: "Grid Line Color", value: "#e2e8f0" },

    // ── Objects (ObjectGroup — group-level settings owner) ───────────────────
    { id: 1, layerId: LAYER_ID.OBJECTS, name: "Visible", value: "true" },
    { id: 2, layerId: LAYER_ID.OBJECTS, name: "Show Vertex IDs", value: "false" },

    // ── Zones (Polygon) ──────────────────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.ZONES, name: "Visible", value: "true" },
    { id: 5, layerId: LAYER_ID.ZONES, name: "Z-Index", value: "20" },
    { id: 60, layerId: LAYER_ID.ZONES, name: "Polygon Edge Color", value: "#22c55e" },
    { id: 61, layerId: LAYER_ID.ZONES, name: "Polygon Edge Width", value: "1" },
    { id: 62, layerId: LAYER_ID.ZONES, name: "Polygon Edge Style", value: POLYGON_EDGE_STYLE.SOLID },
    // rgba(34,197,94,0.18) ≈ #22c55e2e
    { id: 80, layerId: LAYER_ID.ZONES, name: "Polygon Fill Color", value: "#22c55e2e" },
    { id: 81, layerId: LAYER_ID.ZONES, name: "Polygon Fill Style", value: POLYGON_FILL_STYLE.SOLID },

    // ── Obstacles (Polygon) ──────────────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.OBSTACLES, name: "Visible", value: "true" },
    { id: 5, layerId: LAYER_ID.OBSTACLES, name: "Z-Index", value: "30" },
    { id: 60, layerId: LAYER_ID.OBSTACLES, name: "Polygon Edge Color", value: "#ef4444" },
    { id: 61, layerId: LAYER_ID.OBSTACLES, name: "Polygon Edge Width", value: "1" },
    { id: 62, layerId: LAYER_ID.OBSTACLES, name: "Polygon Edge Style", value: POLYGON_EDGE_STYLE.SOLID },
    // rgba(239,68,68,0.23) ≈ #ef44443b
    { id: 80, layerId: LAYER_ID.OBSTACLES, name: "Polygon Fill Color", value: "#ef44443b" },
    { id: 81, layerId: LAYER_ID.OBSTACLES, name: "Polygon Fill Style", value: POLYGON_FILL_STYLE.SOLID },

    // ── Map Base (internal Map type) ─────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.MAP_BASE, name: "Visible", value: "true" },
    { id: 5, layerId: LAYER_ID.MAP_BASE, name: "Z-Index", value: "0" },
];


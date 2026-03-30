import type { LayerDefinition, LayerSettingsSetup } from "@/types/layerTypes";

export const LAYER_NAME = {
    GRID: "Grid",
    ZONES: "Zones",
    OBSTACLES: "Obstacles",
} as const;

export type LayerName = (typeof LAYER_NAME)[keyof typeof LAYER_NAME];

export const LAYER_ID = {
    GRID: 1,
    ZONES: 2,
    OBSTACLES: 3,
} as const;

export const LAYER_REGISTRY: LayerDefinition[] = [
    { id: LAYER_ID.GRID, name: LAYER_NAME.GRID, type: "Grid" },
    { id: LAYER_ID.ZONES, name: LAYER_NAME.ZONES, type: "Polygon" },
    { id: LAYER_ID.OBSTACLES, name: LAYER_NAME.OBSTACLES, type: "Polygon" },
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

/**
 * Human-readable keys for layer settings parameters.
 * Use these constants anywhere a layer param name is compared or looked up — never raw strings.
 */
export const LAYER_PARAM_KEY = {
    VISIBLE: "Visible",
    SHOW_VERTEX_IDS: "Show Vertex IDs",
    Z_INDEX: "Z-Index",
    GRID_LINE_COLOR: "Grid Line Color",
    POLYGON_EDGE_COLOR: "Polygon Edge Color",
    POLYGON_EDGE_WIDTH: "Polygon Edge Width",
    POLYGON_FILL_COLOR: "Polygon Fill Color",
} as const;
export type LayerParamKey = (typeof LAYER_PARAM_KEY)[keyof typeof LAYER_PARAM_KEY];

// ─── Layer Settings Setup Defaults ───────────────────────────────────────────
//
// `id` matches the API attribute ID from the blade-provider Debug Layer Styles spec.
// Uniqueness is enforced by the compound PK [id+layerId] in the DB, so the same
// attribute ID can appear in multiple layers.
//
// Internal attributes (not part of the API spec, styleType: "Boolean"):
//   id 1  → "Visible"           (all layers)
//   id 2  → "Show Vertex IDs"   (Polygon layers)
//
// API attribute IDs in use (configurable):
//   id 5  → "Z-Index"            (all layers)       styleType: "Integer"
//   id 10 → "Grid Line Color"    (Grid layer)        styleType: "Color"
//   id 60 → "Polygon Edge Color" (Polygon layers)    styleType: "Color"
//   id 61 → "Polygon Edge Width" (Polygon layers)    styleType: "Spacing"
//   id 80 → "Polygon Fill Color" (Polygon layers)    styleType: "Color"
//
// API attribute IDs reserved (static, not seeded for system layers):
//   id 62 → "Polygon Edge Style"  (debug Polygon layers only; always Solid for system layers)
//   id 81 → "Polygon Fill Style"  (debug Polygon layers only; always Solid for system layers)
//
// Only non-null default values are seeded; attributes that default to null are
// absent from the DB until set by the user. Higher Z-Index renders above lower.

export const LAYER_SETTINGS_SETUP_DEFAULTS: LayerSettingsSetup[] = [
    // ── Grid (internal Grid type) ────────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.GRID, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.VISIBLE, styleType: "Boolean", styleGroup: "general", defaultValue: "true" },
    { id: 5, layerId: LAYER_ID.GRID, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.Z_INDEX, styleType: "Integer", styleGroup: "general", defaultValue: "10" },
    { id: 10, layerId: LAYER_ID.GRID, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.GRID_LINE_COLOR, styleType: "Color", styleGroup: "general", defaultValue: "#e2e8f0" },

    // ── Zones (Polygon) ──────────────────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.ZONES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.VISIBLE, styleType: "Boolean", styleGroup: "general", defaultValue: "true" },
    { id: 2, layerId: LAYER_ID.ZONES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.SHOW_VERTEX_IDS, styleType: "Boolean", defaultValue: "false" },
    { id: 5, layerId: LAYER_ID.ZONES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.Z_INDEX, styleType: "Integer", styleGroup: "general", defaultValue: "20" },
    { id: 60, layerId: LAYER_ID.ZONES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.POLYGON_EDGE_COLOR, styleType: "Color", styleGroup: "polygon", defaultValue: "#22c55e" },
    { id: 61, layerId: LAYER_ID.ZONES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.POLYGON_EDGE_WIDTH, styleType: "Spacing", styleGroup: "polygon", defaultValue: "1.5" },
    // rgba(34,197,94,0.18) ≈ #22c55e2e
    { id: 80, layerId: LAYER_ID.ZONES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.POLYGON_FILL_COLOR, styleType: "Color", styleGroup: "polygon", defaultValue: "#22c55e2e" },

    // ── Obstacles (Polygon) ──────────────────────────────────────────────────
    { id: 1, layerId: LAYER_ID.OBSTACLES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.VISIBLE, styleType: "Boolean", styleGroup: "general", defaultValue: "true" },
    { id: 2, layerId: LAYER_ID.OBSTACLES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.SHOW_VERTEX_IDS, styleType: "Boolean", defaultValue: "false" },
    { id: 5, layerId: LAYER_ID.OBSTACLES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.Z_INDEX, styleType: "Integer", styleGroup: "general", defaultValue: "30" },
    { id: 60, layerId: LAYER_ID.OBSTACLES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.POLYGON_EDGE_COLOR, styleType: "Color", styleGroup: "polygon", defaultValue: "#ef4444" },
    { id: 61, layerId: LAYER_ID.OBSTACLES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.POLYGON_EDGE_WIDTH, styleType: "Spacing", styleGroup: "polygon", defaultValue: "1.5" },
    // rgba(239,68,68,0.23) ≈ #ef44443b
    { id: 80, layerId: LAYER_ID.OBSTACLES, algorithmId: 0, providerId: 0, key: LAYER_PARAM_KEY.POLYGON_FILL_COLOR, styleType: "Color", styleGroup: "polygon", defaultValue: "#ef44443b" },
];


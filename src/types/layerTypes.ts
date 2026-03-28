import type { StyleAttributeKey, StyleType } from "@/types/serviceTypes";

export type LayerId = number;

/**
 * Typed layer kinds.
 * - "Polygon" | "Point" | "Line" — mirror the API DebugLayerType for compute result layers.
 *   Obstacles and Zones are "Polygon"; future debug layers from the provider will use Point/Line.
 * - "Grid" — internal canvas utility layer.
 * - "ObjectGroup" — a dedicated settings-owner layer for a group of polygon object types.
 *   It stores group-level settings (e.g. "Show Vertex IDs") but never renders standalone.
 */
export type LayerType = "Polygon" | "Point" | "Line" | "Grid" | "ObjectGroup";

/**
 * Attribute keys managed internally by the terminal (not part of the provider metadata spec).
 * These are seeded as part of the system layer defaults.
 */
export type InternalStyleAttributeKey = "Show Vertex IDs" | "Grid Line Color";

export interface LayerDefinition {
    id: LayerId;
    name: string;
    type: LayerType;
}

/**
 * DB record for the `layerSettingsSetup` table.
 * Stores the full attribute metadata fetched from a provider (or seeded for system layers).
 * This is the source-of-truth template from which per-environment `layerSettings` rows are initialized.
 * System layers use `algorithmId: 0, providerId: 0`.
 */
export interface LayerSettingsSetup {
    /** API attribute ID — part of the compound PK. */
    id: number;
    /** FK → layers.id */
    layerId: LayerId;
    algorithmId: number;
    providerId: number;
    /** Human-readable attribute key — doubles as the display label. */
    key: StyleAttributeKey | InternalStyleAttributeKey;
    /** Attribute value type from the provider spec. */
    styleType: StyleType;
    defaultValue: string | null;
}

/** Compound primary key for the `layersSetup` table. System layers use `algorithmId: 0, providerId: 0`. */
export interface LayerPK {
    id: number;
    algorithmId: number;
    providerId: number;
}

/**
 * DB record for a canvas layer definition (`layersSetup` table).
 * `id` is a natural key from the layer definition or provider metadata.
 * System layers use `algorithmId: 0, providerId: 0` as sentinels.
 * `type` is optional for backward compatibility with DB records that pre-date the type field.
 */
export interface LayerRecord {
    id: number;
    algorithmId: number;
    providerId: number;
    key: LayerId;
    label: string;
    type?: LayerType;
    placeholder?: boolean;
}

/**
 * DB record for the `layerSettings` table.
 * Per-environment working copy initialized from `layerSettingsSetup`.
 * Each environment holds its own independent copy for all layers (system + provider).
 */
export interface LayerSettingParameter {
    /** API attribute ID — part of the compound PK. Matches `LayerSettingsSetup.id`. */
    id: number;
    /** FK → layers.id */
    layerId: number;
    algorithmId: number;
    providerId: number;
    /** FK → environments.id */
    environmentId: number;
    /** Attribute key de-normalized from setup — used as the display label. */
    key: StyleAttributeKey | InternalStyleAttributeKey;
    value: string;
}

export interface LayerWithSettings {
    layer: LayerRecord;
    settings: LayerSettingParameter[];
}

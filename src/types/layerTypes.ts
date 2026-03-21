export type LayerId = number;

/**
 * Typed layer kinds.
 * - "Polygon" | "Point" | "Line" — mirror the API DebugLayerType for compute result layers.
 *   Obstacles and Zones are "Polygon"; future debug layers from the provider will use Point/Line.
 * - "Grid" | "Map" — internal canvas utility layers with their own attribute sets.
 */
export type LayerType = "Polygon" | "Point" | "Line" | "Grid" | "Map";

export interface LayerDefinition {
    id: LayerId;
    name: string;
    type: LayerType;
    /** Placeholder layers are registered but not yet functionally wired. */
    placeholder?: boolean;
}

export interface LayerSettingsDefault {
    id: number;
    layerId: LayerId;
    name: string;
    value: string;
}

/**
 * DB record for a canvas layer definition (`layers` table).
 * `id` is auto-assigned by Dexie (`++id`); optional so inserts can omit it.
 * `type` is optional for backward compatibility with DB records that pre-date the type field.
 */
export interface LayerRecord {
    id?: number;
    key: LayerId;
    label: string;
    type?: LayerType;
    placeholder?: boolean;
}

export interface LayerSettingParameter {
    /** API attribute ID — forms the compound PK with `layerId`. Matches the attribute `id` from the blade-provider Debug Layer Styles spec. */
    id: number;
    /** FK → layers.id; forms the compound PK with `id`. */
    layerId: number;
    name: string;
    value: string;
}

export interface LayerWithSettings {
    layer: LayerRecord;
    settings: LayerSettingParameter[];
}

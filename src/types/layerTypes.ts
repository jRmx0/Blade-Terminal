export type LayerId = number;

/**
 * Typed layer kinds.
 * - "Polygon" | "Point" | "Line" — mirror the API DebugLayerType for compute result layers.
 *   Obstacles and Zones are "Polygon"; future debug layers from the provider will use Point/Line.
 * - "Grid" | "Map" — internal canvas utility layers with their own attribute sets.
 * - "ObjectGroup" — a dedicated settings-owner layer for a group of polygon object types.
 *   It stores group-level settings (e.g. "Show Vertex IDs") but never renders standalone.
 */
export type LayerType = "Polygon" | "Point" | "Line" | "Grid" | "Map" | "ObjectGroup";

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

/**
 * A named group of logical layers that are rendered on the same canvas layer
 * and should be presented as a single entry in the layers UI.
 *
 * `settingsLayerId` points to the dedicated "ObjectGroup" layer that owns group-level
 * settings (e.g. "Show Vertex IDs"). The group row reads its settings from that layer.
 */
export interface LayerGroup {
    id: string;
    name: string;
    memberIds: LayerId[];
    /** FK → the ObjectGroup layer that stores group-level settings. */
    settingsLayerId?: LayerId;
}

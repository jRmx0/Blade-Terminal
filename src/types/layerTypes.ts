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

export interface LayerDefinition {
    id: LayerId;
    name: string;
    type: LayerType;
}

export interface LayerSettingsDefault {
    id: number;
    layerId: LayerId;
    algorithmId: number;
    providerId: number;
    name: string;
    value: string;
}

/** Compound primary key for the `layers` table. System layers use `algorithmId: 0, providerId: 0`. */
export interface LayerPK {
    id: number;
    algorithmId: number;
    providerId: number;
}

/**
 * DB record for a canvas layer definition (`layers` table).
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

export interface LayerSettingParameter {
    /** API attribute ID — part of the compound PK. Matches the attribute `id` from the blade-provider Debug Layer Styles spec. */
    id: number;
    /** FK → layers.id (the `id` part of the layer compound PK). */
    layerId: number;
    algorithmId: number;
    providerId: number;
    name: string;
    value: string;
}

export interface LayerWithSettings {
    layer: LayerRecord;
    settings: LayerSettingParameter[];
}

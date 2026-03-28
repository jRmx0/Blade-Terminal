// ─── Computation Provider ───────────────────────────────────────────────────

import type { SupportedAppParameterHandler } from "@/config/computation/appParameterHandlers";

export interface ComputationProvider {
    id?: number;
    name: string;
    url: string;
    apiKey: string;
    /** Unix timestamp (ms) of the last successful metadata fetch. Null if never fetched. */
    metadataFetchedAt: number | null;
    /** The provider URL at the time of the last successful metadata fetch. Used for stale detection. */
    urlAtLastFetch: string | null;
}

// ─── Computation Algorithm ───────────────────────────────────────────────────

export interface ComputationAlgorithm {
    /** Local sequential id within this provider. */
    id: number;
    computationProviderId: number;
    name: string;
}

// ─── Algorithm Parameter ──────────────────────────────────────────────────────

/**
 * Provider-defined metadata section label.
 * `General` is reserved as the frontend fallback when the provider leaves the section undefined.
 */
export type MetadataParamSection =
    | "General"
    | (string & {});

export type AlgoParamType =
    | "Integer"
    | "Decimal"
    | "Boolean"
    | "String"
    | "Enum";

export interface AlgorithmParameter {
    /** Local sequential id within this algorithm. */
    id: number;
    algorithmId: number;
    computationProviderId: number;
    name: string;
    paramType: AlgoParamType;
    /** Valid values for enum params. */
    enumValues: string[];
    /** Serialized string default value. Empty string when not set. */
    defaultValue: string;
    section?: MetadataParamSection;
    /** Optional application-level behavior handler for enum params. */
    appHandler: SupportedAppParameterHandler | null;
}

export interface ComputationAlgorithmDetails {
    algorithm: ComputationAlgorithm;
    parameters: AlgorithmParameter[];
    layers: ProviderLayerRecord[];
}

// ─── App Enum Values ──────────────────────────────────────────────────────────

export type AppEnumGroup = "format" | "type" | "coordsystem";

export interface AppEnumValue {
    enumGroup: AppEnumGroup;
    value: string;
    label: string;
}

// ─── Service action result types ──────────────────────────────────────────────

export interface ServiceHttpResponseDetails {
    statusCode: number;
    statusText: string;
}

export type TestConnectionResult =
    | ({ ok: true } & ServiceHttpResponseDetails)
    | ({ ok: false; error: string } & Partial<ServiceHttpResponseDetails>);

export interface UnsupportedAppHandlerFailure {
    ok: false;
    error: string;
    errorCode: "unsupported_app_handler";
    unsupportedHandlers: string[];
}

export interface UnsupportedLayerAttributeFailure {
    ok: false;
    error: string;
    errorCode: "unsupported_layer_attribute";
    unsupportedAttributes: string[];
}

export type MetadataValidationFailure = UnsupportedAppHandlerFailure | UnsupportedLayerAttributeFailure;

export type FetchMetadataResult =
    | ({ ok: true; algorithmCount: number } & ServiceHttpResponseDetails)
    | ({ ok: false; error: string } & Partial<ServiceHttpResponseDetails>)
    | MetadataValidationFailure;

export interface FetchedComputationMetadata {
    metadataFetchedAt: number;
    urlAtLastFetch: string;
    algorithms: ComputationAlgorithmDetails[];
}

export type FetchMetadataPreviewResult =
    | ({ ok: true; algorithmCount: number; metadata: FetchedComputationMetadata } & ServiceHttpResponseDetails)
    | ({ ok: false; error: string } & Partial<ServiceHttpResponseDetails>)
    | MetadataValidationFailure;

// ─── /metadata response contract ─────────────────────────────────────────────

export interface MetadataParamResponse {
    id: number;
    name: string;
    paramType: AlgoParamType;
    enumValues: string[];
    defaultValue?: string;
    section?: MetadataParamSection;
    appHandler: SupportedAppParameterHandler | null;
}

export type MetadataLayerType = "Point" | "Line" | "Polygon";

export type StyleAttributeKey =
    | "Visible"
    | "Z-Index"
    // Point — Marker Shape
    | "Point Shape"
    | "Point Radius"
    // Point — Overlap
    | "Point Overlap Spacing"
    | "Point Overlap Layout"
    // Point — Border
    | "Point Border Color"
    | "Point Border Width"
    | "Point Border Style"
    // Point — Fill
    | "Point Fill Color"
    // Point — Id Label
    | "Point ID Color"
    | "Point ID Font Size"
    | "Point ID Font Weight"
    | "Point ID Placement"
    | "Point ID Offset"
    // Point — Text Label
    | "Point Label Color"
    | "Point Label Font Size"
    | "Point Label Font Weight"
    | "Point Label Placement"
    | "Point Label Offset"
    // Line — Edge
    | "Line Edge Color"
    | "Line Edge Width"
    | "Line Edge Style"
    // Line — Arrow
    | "Line Arrow Start"
    | "Line Arrow End"
    | "Line Arrow Mid"
    | "Line Arrow Mid Spacing"
    | "Line Arrow Size"
    // Polygon — Edge
    | "Polygon Edge Color"
    | "Polygon Edge Width"
    | "Polygon Edge Style"
    // Polygon — Fill
    | "Polygon Fill Color"
    | "Polygon Fill Style"
    // Polygon — ID
    | "Polygon ID Color"
    | "Polygon ID Font Size"
    | "Polygon ID Font Weight"
    | "Polygon ID Shape"
    | "Polygon ID Radius"
    | "Polygon ID Border Color"
    | "Polygon ID Border Width"
    | "Polygon ID Border Style"
    | "Polygon ID Fill Color"
    | "Polygon ID Placement"
    | "Polygon ID Offset";

export type StyleType =
    | "Boolean"
    | "Integer"
    | "Color"
    | "Spacing"
    | "PointShapeEnum"
    | "PolygonIDShapeEnum"
    | "StrokeStyleEnum"
    | "FillStyleEnum"
    | "OverlapLayoutEnum"
    | "PlacementEnum"
    | "FontSizeEnum"
    | "FontWeightEnum"
    | "LineArrowStartEnum"
    | "LineArrowEndEnum"
    | "LineArrowMidEnum";

export interface PointLabelColorEntry {
    value: string;
    color: string | null;
}

export interface ProviderLayerStyleAttr {
    key: StyleAttributeKey;
    styleType: StyleType;
    defaultValue: string | null;
}

export interface LayerStyle {
    universalStyleAttributes: ProviderLayerStyleAttr[];
    pointStyleAttributes?: ProviderLayerStyleAttr[];
    lineStyleAttributes?: ProviderLayerStyleAttr[];
    polygonStyleAttributes?: ProviderLayerStyleAttr[];
    pointLabelColorMapping?: PointLabelColorEntry[];
}

export interface MetadataLayerResponse {
    id: number;
    computeLayer: string;
    name: string;
    layerType: MetadataLayerType;
    style: LayerStyle;
    pointLabelEnumValues?: string[];
}

export interface ProviderLayerRecord {
    id: number;
    algorithmId: number;
    providerId: number;
    computeLayer: string;
    name: string;
    layerType: MetadataLayerType;
    universalStyleAttributes: ProviderLayerStyleAttr[];
    pointStyleAttributes: ProviderLayerStyleAttr[];
    lineStyleAttributes: ProviderLayerStyleAttr[];
    polygonStyleAttributes: ProviderLayerStyleAttr[];
    pointLabelColorMapping: PointLabelColorEntry[];
    pointLabelEnumValues: string[];
}

export type DebugLayerType = "Point" | "Line" | "Polygon";

export interface DebugLayerStyle {
    className: string;
    pointRadius?: number;
    fontSize?: number;
}

export interface DebugLayerMetadata {
    id: number;
    debugKey: string;
    name: string;
    type: DebugLayerType;
    style: DebugLayerStyle;
}

export interface MetadataAlgorithmResponse {
    id: number;
    name: string;
    parameters: MetadataParamResponse[];
    layers: MetadataLayerResponse[];
}

export interface MetadataResponse {
    algorithms: MetadataAlgorithmResponse[];
}

// ─── Compute Result ───────────────────────────────────────────────────────────

export type CoveragePathPlanSegmentType = "coverage" | "transit" | (string & {});

export interface CoveragePathPlanSegment {
    id: number;
    type: CoveragePathPlanSegmentType;
    path: { x: number; y: number }[];
}

export interface CoveragePathPlan {
    segments: CoveragePathPlanSegment[];
}

export type AlgorithmDebug = Record<string, object[]>;

export interface ComputeResult {
    coveragePathPlan: CoveragePathPlan;
    debug?: AlgorithmDebug;
}

export interface ComputeJobStatePending {
    jobId: string;
    status: "queued" | "running";
    algorithmName: string;
    createdAt: string;
    startedAt?: string;
    requestId?: string;
}

export interface ComputeJobStateCompleted {
    jobId: string;
    status: "completed";
    algorithmName: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    requestId?: string;
    result: ComputeResult;
}

export interface ComputeJobStateFailed {
    jobId: string;
    status: "failed";
    algorithmName: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    requestId?: string;
    error: { code: string; message: string };
}

export type ComputeJobState = ComputeJobStatePending | ComputeJobStateCompleted | ComputeJobStateFailed;

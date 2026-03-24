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
    appHandler: string | null;
}

export interface ComputationAlgorithmDetails {
    algorithm: ComputationAlgorithm;
    parameters: AlgorithmParameter[];
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

export type FetchMetadataResult =
    | ({ ok: true; algorithmCount: number } & ServiceHttpResponseDetails)
    | (({ ok: false; error: string } & Partial<ServiceHttpResponseDetails>) | UnsupportedAppHandlerFailure);

export interface FetchedComputationMetadata {
    metadataFetchedAt: number;
    urlAtLastFetch: string;
    algorithms: ComputationAlgorithmDetails[];
}

export type FetchMetadataPreviewResult =
    | ({ ok: true; algorithmCount: number; metadata: FetchedComputationMetadata } & ServiceHttpResponseDetails)
    | (({ ok: false; error: string } & Partial<ServiceHttpResponseDetails>) | UnsupportedAppHandlerFailure);

// ─── /metadata response contract ─────────────────────────────────────────────

export interface MetadataParamResponse {
    id: number;
    name: string;
    paramType: AlgoParamType;
    enumValues: string[];
    defaultValue?: string;
    section?: MetadataParamSection;
    appHandler: string | null;
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

export interface LayerStyleAttribute {
    id: number;
    name: string;
    value: string | null;
}

export interface LayerLabelEnumValue {
    value: string;
    color: string | null;
}

export interface LayerLabel {
    key: string;
    enumValues: LayerLabelEnumValue[];
}

export interface MetadataCppLayerResponse {
    id: number;
    cppLayer: string;
    name: string;
    type: DebugLayerType;
    style: LayerStyleAttribute[];
    label: LayerLabel | null;
}

export interface MetadataAlgoDebugLayerResponse {
    id: number;
    debugLayer: string;
    name: string;
    type: DebugLayerType;
    style: LayerStyleAttribute[];
    label: LayerLabel | null;
}

export type MetadataLayerResponse = MetadataCppLayerResponse | MetadataAlgoDebugLayerResponse;

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

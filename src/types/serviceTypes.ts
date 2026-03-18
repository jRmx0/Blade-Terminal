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
    section?: MetadataParamSection;
    name: string;
    paramType: AlgoParamType;
    /** Valid values for enum params. */
    enumValues: string[];
    /** Serialized string default value. Empty string when not set. */
    defaultValue: string;
    /** Optional application-level behavior handler for enum params. */
    appHandler?: SupportedAppParameterHandler;
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
    section?: MetadataParamSection;
    name: string;
    paramType: AlgoParamType;
    enumValues?: string[];
    defaultValue?: string;
    appHandler?: SupportedAppParameterHandler;
}

export interface MetadataAlgorithmResponse {
    id: number;
    name: string;
    parameters: MetadataParamResponse[];
}

export interface MetadataResponse {
    algorithms: MetadataAlgorithmResponse[];
}

// ─── Computation Provider ───────────────────────────────────────────────────

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
    label: string;
}

// ─── Algorithm Parameter ──────────────────────────────────────────────────────

export type AlgoParamType =
    | "integer"
    | "decimal"
    | "boolean"
    | "string"
    | "enum"
    | "format"
    | "type"
    | "coordsystem";

export interface AlgorithmParameter {
    /** Local sequential id within this algorithm. */
    id: number;
    algorithmId: number;
    computationProviderId: number;
    name: string;
    label: string;
    paramType: AlgoParamType;
    /** Valid values for enum / format / type / coordsystem params. */
    enumValues: string[];
    /** Serialized string default value. Empty string when not set. */
    defaultValue: string;
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

export type TestConnectionResult =
    | { ok: true }
    | { ok: false; error: string };

export type FetchMetadataResult =
    | { ok: true; algorithmCount: number }
    | { ok: false; error: string };

export interface FetchedComputationMetadata {
    metadataFetchedAt: number;
    urlAtLastFetch: string;
    algorithms: ComputationAlgorithmDetails[];
}

export type FetchMetadataPreviewResult =
    | { ok: true; algorithmCount: number; metadata: FetchedComputationMetadata }
    | { ok: false; error: string };

// ─── /metadata response contract ─────────────────────────────────────────────

export interface MetadataParamResponse {
    name: string;
    label: string;
    paramType: AlgoParamType;
    enumValues?: string[];
    defaultValue?: string;
}

export interface MetadataAlgorithmResponse {
    name: string;
    label: string;
    parameters: MetadataParamResponse[];
}

export interface MetadataResponse {
    algorithms: MetadataAlgorithmResponse[];
}

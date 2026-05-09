import { validateCellSizeFit, validateRangeField } from "@/features/canvas-editing/utils/canvasGenerator";

export interface CanvasGeneratorInputValidationParams {
    width: string;
    height: string;
    minPassageWidth: string;
    obstacleRatio: string;
    clustering: string;
    hasObsLeftField: boolean;
    hasClustLeftField: boolean;
}

export interface CanvasGeneratorInputValidationResult {
    isRequiredFieldsValid: boolean;
    cellSizeFitError: string | null;
    obstacleRatioError: string | null;
    clusteringError: string | null;
    hasAnyRangeFieldError: boolean;
    canGenerate: boolean;
}

function shouldHideIncompleteError(raw: string, hasLeftField: boolean): boolean {
    const trimmed = raw.trim();
    if (trimmed === "") return false;
    return !hasLeftField && (trimmed.endsWith(".") || trimmed.endsWith(".."));
}

export function validateCanvasGeneratorInputs(
    params: CanvasGeneratorInputValidationParams,
): CanvasGeneratorInputValidationResult {
    const {
        width,
        height,
        minPassageWidth,
        obstacleRatio,
        clustering,
        hasObsLeftField,
        hasClustLeftField,
    } = params;

    const w = parseFloat(width);
    const h = parseFloat(height);
    const cs = parseFloat(minPassageWidth);

    const isRequiredFieldsValid = isFinite(w) && w > 0 && isFinite(h) && h > 0 && isFinite(cs) && cs > 0;
    const cellSizeFitError = validateCellSizeFit(w, h, cs);

    const obstacleErr = validateRangeField(obstacleRatio, "Obstacle ratio", 0, 100);
    const obstacleRatioError = obstacleErr !== null && shouldHideIncompleteError(obstacleRatio, hasObsLeftField)
        ? null
        : obstacleErr;

    const clusteringErr = validateRangeField(clustering, "Clustering", 0, 100);
    const clusteringError = clusteringErr !== null && shouldHideIncompleteError(clustering, hasClustLeftField)
        ? null
        : clusteringErr;

    const hasAnyRangeFieldError = obstacleRatioError !== null || clusteringError !== null;
    const canGenerate = isRequiredFieldsValid && cellSizeFitError === null && !hasAnyRangeFieldError;

    return {
        isRequiredFieldsValid,
        cellSizeFitError,
        obstacleRatioError,
        clusteringError,
        hasAnyRangeFieldError,
        canGenerate,
    };
}

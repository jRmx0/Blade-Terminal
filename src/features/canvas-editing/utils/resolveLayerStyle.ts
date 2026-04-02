import type { LayerSettingParameter } from "@/types/layerTypes";
import type {
    ResolvedLineLayerStyle,
    ResolvedPointLayerStyle,
    ResolvedPolygonResultLayerStyle,
} from "@/features/canvas-editing/types/layerStyles";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function param(settings: LayerSettingParameter[], key: string): string {
    return settings.find((p) => p.key === key)?.value ?? "";
}

function paramNum(settings: LayerSettingParameter[], key: string): number {
    const v = param(settings, key);
    if (v === undefined || v === "") return 0;
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

function paramBool(settings: LayerSettingParameter[], key: string): boolean {
    const v = param(settings, key);
    return v === undefined ? false : v === "true";
}

/** Converts a StrokeStyleEnum value to a Konva dash array. Empty array = solid line. */
function parseDash(style: string): number[] {
    if (style === "dashed") return [8, 4];
    if (style === "dotted") return [3, 3];
    return [];
}

/**
 * Converts a FontSizeEnum Tailwind class (e.g. "text-sm") to a pixel number
 * for use with Konva's `fontSize` prop.
 */
const FONT_SIZE_PX: Record<string, number> = {
    "text-xs": 12,
    "text-sm": 14,
    "text-base": 16,
    "text-lg": 18,
    "text-xl": 20,
    "text-2xl": 24,
    "text-3xl": 30,
    "text-4xl": 36,
    "text-5xl": 48,
    "text-6xl": 60,
    "text-7xl": 72,
    "text-8xl": 96,
    "text-9xl": 128,
};

function parseFontSize(key: string): number {
    return FONT_SIZE_PX[key] ?? 0;
}

/**
 * Converts a FontWeightEnum Tailwind class (e.g. "font-bold") to a string
 * compatible with Konva's `fontStyle` prop.
 */
const FONT_WEIGHT_MAP: Record<string, string> = {
    "font-thin": "100",
    "font-extralight": "200",
    "font-light": "300",
    "font-normal": "normal",
    "font-medium": "500",
    "font-semibold": "600",
    "font-bold": "bold",
    "font-extrabold": "800",
    "font-black": "900",
};

function parseFontWeight(key: string): string {
    return FONT_WEIGHT_MAP[key] ?? "normal";
}

// ─── Resolvers ─────────────────────────────────────────────────────────────────
//
// Pure functions — no React, no store access. Each takes the raw
// LayerSettingParameter[] array and returns a fully resolved style struct.
// Default values are used for any attribute that is absent or has an empty value.

export function resolveLineLayerStyle(settings: LayerSettingParameter[]): ResolvedLineLayerStyle {
    return {
        visible: paramBool(settings, "Visible"),
        zIndex: paramNum(settings, "Z-Index"),
        stroke: param(settings, "Line Edge Color"),
        strokeWidth: paramNum(settings, "Line Edge Width"),
        dash: parseDash(param(settings, "Line Edge Style")),
        arrowStart: param(settings, "Line Arrow Start"),
        arrowEnd: param(settings, "Line Arrow End"),
        arrowMid: param(settings, "Line Arrow Mid"),
        arrowMidSpacing: paramNum(settings, "Line Arrow Mid Spacing"),
        arrowSize: paramNum(settings, "Line Arrow Size"),
        pointShape: param(settings, "Point Shape"),
        pointRadius: paramNum(settings, "Point Radius"),
        pointOverlapSpacing: paramNum(settings, "Point Overlap Spacing"),
        pointOverlapLayout: param(settings, "Point Overlap Layout"),
        pointFillColor: param(settings, "Point Fill Color"),
        pointBorderColor: param(settings, "Point Border Color"),
        pointBorderWidth: paramNum(settings, "Point Border Width"),
        pointBorderDash: parseDash(param(settings, "Point Border Style")),
        pointIdColor: param(settings, "Point ID Color"),
        pointIdFontSize: parseFontSize(param(settings, "Point ID Font Size")),
        pointIdFontWeight: parseFontWeight(param(settings, "Point ID Font Weight")),
        pointIdPlacement: param(settings, "Point ID Placement"),
        pointIdOffset: paramNum(settings, "Point ID Offset"),
        pointLabelColor: param(settings, "Point Label Color"),
        pointLabelFontSize: parseFontSize(param(settings, "Point Label Font Size")),
        pointLabelFontWeight: parseFontWeight(param(settings, "Point Label Font Weight")),
        pointLabelPlacement: param(settings, "Point Label Placement"),
        pointLabelOffset: paramNum(settings, "Point Label Offset"),
    };
}

export function resolvePointLayerStyle(settings: LayerSettingParameter[]): ResolvedPointLayerStyle {
    return {
        visible: paramBool(settings, "Visible"),
        zIndex: paramNum(settings, "Z-Index"),
        shape: param(settings, "Point Shape"),
        radius: paramNum(settings, "Point Radius"),
        overlapSpacing: paramNum(settings, "Point Overlap Spacing"),
        overlapLayout: param(settings, "Point Overlap Layout"),
        fillColor: param(settings, "Point Fill Color"),
        borderColor: param(settings, "Point Border Color"),
        borderWidth: paramNum(settings, "Point Border Width"),
        borderDash: parseDash(param(settings, "Point Border Style")),
        idColor: param(settings, "Point ID Color"),
        idFontSize: parseFontSize(param(settings, "Point ID Font Size")),
        idFontWeight: parseFontWeight(param(settings, "Point ID Font Weight")),
        idPlacement: param(settings, "Point ID Placement"),
        idOffset: paramNum(settings, "Point ID Offset"),
        labelColor: param(settings, "Point Label Color"),
        labelFontSize: parseFontSize(param(settings, "Point Label Font Size")),
        labelFontWeight: parseFontWeight(param(settings, "Point Label Font Weight")),
        labelPlacement: param(settings, "Point Label Placement"),
        labelOffset: paramNum(settings, "Point Label Offset"),
    };
}

export function resolvePolygonResultLayerStyle(
    settings: LayerSettingParameter[],
): ResolvedPolygonResultLayerStyle {
    return {
        visible: paramBool(settings, "Visible"),
        zIndex: paramNum(settings, "Z-Index"),
        vertexShape: param(settings, "Point Shape"),
        vertexRadius: paramNum(settings, "Point Radius"),
        vertexFillColor: param(settings, "Point Fill Color"),
        vertexBorderColor: param(settings, "Point Border Color"),
        vertexBorderWidth: paramNum(settings, "Point Border Width"),
        vertexBorderDash: parseDash(param(settings, "Point Border Style")),
        vertexIdColor: param(settings, "Point ID Color"),
        vertexIdFontSize: parseFontSize(param(settings, "Point ID Font Size")),
        vertexIdFontWeight: parseFontWeight(param(settings, "Point ID Font Weight")),
        vertexIdPlacement: param(settings, "Point ID Placement"),
        vertexIdOffset: paramNum(settings, "Point ID Offset"),
        stroke: param(settings, "Polygon Edge Color"),
        strokeWidth: paramNum(settings, "Polygon Edge Width"),
        dash: parseDash(param(settings, "Polygon Edge Style")),
        fill: param(settings, "Polygon Fill Color"),
        fillStyle: param(settings, "Polygon Fill Style"),
        idColor: param(settings, "Polygon ID Color"),
        idFontSize: parseFontSize(param(settings, "Polygon ID Font Size")),
        idFontWeight: parseFontWeight(param(settings, "Polygon ID Font Weight")),
        idShape: param(settings, "Polygon ID Shape"),
        idRadius: paramNum(settings, "Polygon ID Radius"),
        idBorderColor: param(settings, "Polygon ID Border Color"),
        idBorderWidth: paramNum(settings, "Polygon ID Border Width"),
        idBorderDash: parseDash(param(settings, "Polygon ID Border Style")),
        idFillColor: param(settings, "Polygon ID Fill Color"),
        idPlacement: param(settings, "Polygon ID Placement"),
        idOffset: paramNum(settings, "Polygon ID Offset"),
    };
}

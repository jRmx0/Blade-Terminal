import type { StyleType } from "@/types/serviceTypes";
import type { SettingsPanelSelectOption } from "@/components/settings-panel/SettingsPanelRowSelect";

const NONE: SettingsPanelSelectOption = { value: "", label: "" };

/**
 * Maps each enum StyleType to its ordered list of select options.
 * The leading "— none —" entry (value: "") represents a null/inactive default.
 * Values match the serialised strings emitted and accepted by the provider API.
 * Labels are human-readable display strings.
 */
export const STYLE_TYPE_ENUM_OPTIONS: Partial<Record<StyleType, SettingsPanelSelectOption[]>> = {
    PointShapeEnum: [
        NONE,
        { value: "circle", label: "Circle" },
        { value: "square", label: "Square" },
        { value: "diamond", label: "Diamond" },
        { value: "cross", label: "Cross" },
        { value: "triangle", label: "Triangle" },
    ],

    PolygonIDShapeEnum: [
        NONE,
        { value: "circle", label: "Circle" },
        { value: "square", label: "Square" },
    ],

    StrokeStyleEnum: [
        NONE,
        { value: "solid", label: "Solid" },
        { value: "dashed", label: "Dashed" },
        { value: "dotted", label: "Dotted" },
    ],

    FillStyleEnum: [
        NONE,
        { value: "solid", label: "Solid" },
        { value: "hatched", label: "Hatched" },
    ],

    OverlapLayoutEnum: [
        NONE,
        { value: "grid", label: "Grid" },
    ],

    PlacementEnum: [
        NONE,
        { value: "inside", label: "Inside" },
        { value: "outside-left", label: "Outside Left" },
        { value: "outside-right", label: "Outside Right" },
        { value: "outside-top", label: "Outside Top" },
        { value: "outside-bottom", label: "Outside Bottom" },
    ],

    FontSizeEnum: [
        NONE,
        { value: "text-xs", label: "XS" },
        { value: "text-sm", label: "SM" },
        { value: "text-base", label: "Base" },
        { value: "text-lg", label: "LG" },
        { value: "text-xl", label: "XL" },
        { value: "text-2xl", label: "2XL" },
        { value: "text-3xl", label: "3XL" },
        { value: "text-4xl", label: "4XL" },
        { value: "text-5xl", label: "5XL" },
        { value: "text-6xl", label: "6XL" },
        { value: "text-7xl", label: "7XL" },
        { value: "text-8xl", label: "8XL" },
        { value: "text-9xl", label: "9XL" },
    ],

    FontWeightEnum: [
        NONE,
        { value: "font-thin", label: "Thin" },
        { value: "font-extralight", label: "Extra Light" },
        { value: "font-light", label: "Light" },
        { value: "font-normal", label: "Normal" },
        { value: "font-medium", label: "Medium" },
        { value: "font-semibold", label: "Semibold" },
        { value: "font-bold", label: "Bold" },
        { value: "font-extrabold", label: "Extra Bold" },
        { value: "font-black", label: "Black" },
    ],

    LineArrowStartEnum: [
        NONE,
        { value: "line_start_arrow", label: "Arrow" },
        { value: "line_start_arrow_notch", label: "Arrow Notch" },
    ],

    LineArrowEndEnum: [
        NONE,
        { value: "line_end_arrow", label: "Arrow" },
        { value: "line_end_arrow_notch", label: "Arrow Notch" },
    ],

    LineArrowMidEnum: [
        NONE,
        { value: "line_start_arrow", label: "Arrow Start" },
        { value: "line_start_arrow_notch", label: "Arrow Start Notch" },
        { value: "line_end_arrow", label: "Arrow End" },
        { value: "line_end_arrow_notch", label: "Arrow End Notch" },
    ],
};

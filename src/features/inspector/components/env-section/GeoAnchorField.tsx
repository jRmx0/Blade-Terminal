import { useState } from "react";
import { useEnvStore } from "@/stores/envStore";
import type { GeoAnchor } from "@/types/schemaTypes";

/**
 * Inspector panel section for configuring the geographic anchor used by the
 * Satellite Map layer. Lets the user bind the canvas world origin (0, 0) to a
 * real-world WGS-84 coordinate and set the map scale (metres per canvas unit).
 */
export default function GeoAnchorField() {
    const geoAnchor = useEnvStore((s) => s.env.geoAnchor);
    const setGeoAnchor = useEnvStore((s) => s.setGeoAnchor);

    // Local draft state while the user is editing
    const [lat, setLat] = useState<string>(String(geoAnchor?.lat ?? ""));
    const [lon, setLon] = useState<string>(String(geoAnchor?.lon ?? ""));
    const [mpu, setMpu] = useState<string>(String(geoAnchor?.metersPerUnit ?? "1"));

    const isSet = geoAnchor !== undefined;

    function handleApply() {
        const latN = parseFloat(lat);
        const lonN = parseFloat(lon);
        const mpuN = parseFloat(mpu);
        if (isNaN(latN) || isNaN(lonN) || isNaN(mpuN) || mpuN <= 0) return;
        if (latN < -90 || latN > 90 || lonN < -180 || lonN > 180) return;
        const anchor: GeoAnchor = { lat: latN, lon: lonN, metersPerUnit: mpuN };
        setGeoAnchor(anchor);
    }

    function handleClear() {
        setGeoAnchor(null);
        setLat("");
        setLon("");
        setMpu("1");
    }

    return (
        <div className="px-5 py-2 flex flex-col gap-2">
            {/* Status badge */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Geo Anchor</span>
                <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${isSet ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                    {isSet ? "Set" : "Not set"}
                </span>
            </div>

            {/* Lat / Lon inputs */}
            <div className="grid grid-cols-2 gap-1.5">
                <label className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">Latitude</span>
                    <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-800 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g. 46.0569"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500">Longitude</span>
                    <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-800 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g. 14.5058"
                        value={lon}
                        onChange={(e) => setLon(e.target.value)}
                    />
                </label>
            </div>

            {/* Metres per unit */}
            <label className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">Metres per unit</span>
                <input
                    type="number"
                    step="any"
                    min="0.001"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-800 focus:border-blue-400 focus:outline-none"
                    placeholder="e.g. 1"
                    value={mpu}
                    onChange={(e) => setMpu(e.target.value)}
                />
            </label>

            {/* Actions */}
            <div className="flex gap-1.5">
                <button
                    type="button"
                    className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40"
                    onClick={handleApply}
                >
                    Apply
                </button>
                {isSet && (
                    <button
                        type="button"
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}

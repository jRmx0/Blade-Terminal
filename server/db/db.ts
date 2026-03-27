import Dexie from "dexie";
import type { AppEnumValue } from "@/types/serviceTypes";
import { LAYER_REGISTRY, LAYER_SETTINGS_SETUP_DEFAULTS } from "@/config/layers/layerRegistry";

const db = new Dexie("blade-terminal");

// Schema versioning policy:
// Always modify the single version(1) block directly — never add a new version block.
// This is a development environment where data loss from schema changes is acceptable.
// Keeping a single version avoids accumulating migration code that serves no purpose here.
// When the schema changes, clear the browser's IndexedDB to apply the new layout.
db.version(1).stores({
    environments: "id, name",
    objects: "[id+environmentId], environmentId",
    vertices: "[id+objectId+environmentId], objectId, environmentId",
    computationProviders: "++id, name",
    computationAlgorithms: "[id+computationProviderId], computationProviderId",
    computationAlgorithmParameters: "[id+algorithmId+computationProviderId], algorithmId, computationProviderId, [algorithmId+computationProviderId]",
    environmentComputationParameterValues: "[id+algorithmId+providerId+environmentId], [algorithmId+providerId+environmentId], environmentId",
    environmentComputation: "environmentId",
    appEnumValues: "[enumGroup+value], enumGroup",
    layers: "[id+algorithmId+providerId], algorithmId, providerId, key, [algorithmId+providerId]",
    layerSettingsSetup: "[id+layerId+algorithmId+providerId], [layerId+algorithmId+providerId], [algorithmId+providerId]",
    layerSettings: "[id+layerId+algorithmId+providerId+environmentId], [layerId+algorithmId+providerId+environmentId], [algorithmId+providerId+environmentId], environmentId",
});

db.on("populate", () => {
    // seed appEnumValues and layers/layerSettings for fresh databases
    return seedInitialData();
});

async function seedInitialData(): Promise<void> {
    await seedAppEnums();
    await seedLayers();
}

async function seedAppEnums(): Promise<void> {
    const rows: AppEnumValue[] = [
        { enumGroup: "format", value: "polygon", label: "Polygon" },
        { enumGroup: "format", value: "grid", label: "Grid" },
        { enumGroup: "type", value: "offline", label: "Off-Line" },
        { enumGroup: "type", value: "online", label: "On-Line" },
        { enumGroup: "coordsystem", value: "decimal", label: "Decimal" },
        { enumGroup: "coordsystem", value: "latlong", label: "Lat/Long" },
    ];
    await db.table("appEnumValues").bulkPut(rows);
}

export { db };

async function seedLayers(): Promise<void> {
    for (const def of LAYER_REGISTRY) {
        await db.table("layers").add({
            id: def.id,
            algorithmId: 0,
            providerId: 0,
            key: def.id,
            label: def.name,
            type: def.type,
        });
    }
    await db.table("layerSettingsSetup").bulkPut(LAYER_SETTINGS_SETUP_DEFAULTS);
}

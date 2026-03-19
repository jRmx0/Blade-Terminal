import Dexie from "dexie";
import type { AppEnumValue } from "@/types/serviceTypes";

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
});

db.on("populate", () => {
    // seed appEnumValues for fresh databases
    return seedAppEnums();
});

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

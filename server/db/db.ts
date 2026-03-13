import Dexie from "dexie";
import type { AppEnumValue } from "@/types/serviceTypes";

const db = new Dexie("blade-terminal");

db.version(1).stores({
    environments: "id, name",
    objects: "[id+environmentId], environmentId",
    vertices: "[id+objectId+environmentId], objectId, environmentId",
});

db.version(2)
    .stores({
        environments: "id, name",
        objects: "[id+environmentId], environmentId",
        vertices: "[id+objectId+environmentId], objectId, environmentId",
        serviceProviders: "++id, name",
        serviceAlgorithms: "[id+serviceProviderId], serviceProviderId",
        algorithmParameters: "[id+algorithmId+serviceProviderId], algorithmId, serviceProviderId",
        appEnumValues: "[enumGroup+value], enumGroup",
    })
    .upgrade(() => {
        // seed appEnumValues for databases upgrading from v1
        return seedAppEnums();
    });

db.version(3)
    .stores({
        environments: "id, name",
        objects: "[id+environmentId], environmentId",
        vertices: "[id+objectId+environmentId], objectId, environmentId",
        computationProviders: "++id, name",
        computationAlgorithms: "[id+computationProviderId], computationProviderId",
        computationAlgorithmParameters: "[id+algorithmId+computationProviderId], algorithmId, computationProviderId",
        appEnumValues: "[enumGroup+value], enumGroup",
        // drop v2 tables
        serviceProviders: null,
        serviceAlgorithms: null,
        algorithmParameters: null,
    });

db.version(4).stores({
    environments: "id, name",
    objects: "[id+environmentId], environmentId",
    vertices: "[id+objectId+environmentId], objectId, environmentId",
    computationProviders: "++id, name",
    computationAlgorithms: "[id+computationProviderId], computationProviderId",
    computationAlgorithmParameters: "[id+algorithmId+computationProviderId], algorithmId, computationProviderId, [algorithmId+computationProviderId]",
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

import Dexie from "dexie";

const db = new Dexie("blade-terminal");

db.version(1).stores({
    environments: "id, name",
    objects: "[id+environmentId], environmentId",
    vertices: "[id+objectId+environmentId], objectId, environmentId",
});

export { db };

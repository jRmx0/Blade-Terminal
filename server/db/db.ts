import Dexie from "dexie";

const db = new Dexie("blade-terminal");

db.version(1).stores({
    environments: "&id, name",
    env_objects: "[id+environmentId], environmentId, category",
    env_vertices: "[id+objectId], objectId, nextVertexId",
});

export { db };

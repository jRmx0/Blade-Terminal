import { serve } from "bun";
import index from "../public/index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

// ─── Data-access API ─────────────────────────────────────────────────────────
export { environmentsTable, getEnvironment, getAllEnvironments, saveEnvironment, deleteEnvironmentCascade } from "./db/environments";
export { objectsTable, getObject, getObjectsByEnvironment, saveObject, saveObjects, deleteObject, deleteObjectsByEnvironment } from "./db/objects";
export { verticesTable, getVertex, getVerticesByObject, getVerticesByObjectIds, saveVertex, saveVertices, updateVertex, deleteVertex, deleteVerticesByObject, deleteVerticesByObjectIds } from "./db/vertices";

---
name: data-state-patterns
description: "Defines where data lives, how it flows, and how state is managed in blade-terminal. Use when: adding a new Zustand store, deciding between IndexedDB vs in-memory state, writing a loader function, implementing autosave, creating a data bridge, mutating permanent data, adding a new Dexie table, deciding where to put async data-fetching logic, or reviewing any data/state code."
compatibility: Designed for blade-terminal — a client-only PWA using Bun/React, Dexie (IndexedDB), and Zustand. No server-side state; no React Query or SWR; no Redux.
metadata:
  author: jRmx0
  version: "1.0"
---

# Data & State Patterns

Use this skill whenever you create, modify, or review anything that touches data loading, data persistence, in-memory state, or autosave behaviour in blade-terminal.

---

## Architecture Overview

Data flows strictly top-to-bottom through four layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. STORAGE LAYER  (IndexedDB via Dexie)    server/db/          │
│     Permanent truth for all workspace data                      │
├─────────────────────────────────────────────────────────────────┤
│  2. BRIDGE LAYER   (data orchestration)     src/features/*/data/│
│     Load / save / reset multi-table datasets                    │
├─────────────────────────────────────────────────────────────────┤
│  3. STATE LAYER    (Zustand stores)         src/stores/         │
│     In-memory truth for active workspace + transient UI state   │
│                                             src/features/*/stores/
├─────────────────────────────────────────────────────────────────┤
│  4. COMPONENT LAYER (React)                 src/features/*/components/
│     Reads stores via selectors; calls mutations or actions      │
└─────────────────────────────────────────────────────────────────┘
```

**Absolute rules:**
- Components do **not** call Dexie tables directly — they go through stores or bridges.
- Bridges do **not** hold state — they call DB functions and hydrate stores.
- Stores do **not** call other stores' actions directly except via `store.getState()`.
- No React Context, React Query, SWR, or Redux — only Zustand + Dexie.
- Never reintroduce `useLiveQuery` — it was deliberately removed.

---

## Layer 1 — Storage (Dexie / IndexedDB)

### Where
`server/db/*.ts` — one file per domain entity. `server/index.ts` re-exports all query functions.

### Rules
- Every table gets its own `server/db/{entity}.ts` with typed query functions.
- All query functions are plain `async` functions — no classes, no hooks.
- Compound keys are preferred for join-table queries (e.g. `[id+environmentId]`).
- Transactions are used whenever two or more tables must stay consistent (cascade deletes, bulk replacements).
- `db.on("populate", seedInitialData)` seeds static/configuration tables (e.g. appEnums, layers) on first install.
- Features import from `server/index.ts` (the public API), never from internal `server/db/*.ts` files directly.

### What lives in IndexedDB

| Table | Contents | Notes |
|---|---|---|
| `environments` | Workspace root entities | One per saved workspace |
| `objects` | Zones/obstacles per environment | PK: `[id+environmentId]` |
| `vertices` | Polygon points (linked-list order) | PK: `[id+objectId+environmentId]` |
| `computationProviders` | External provider registry | Auto-increment PK |
| `computationAlgorithms` | Algorithms per provider | PK: `[id+computationProviderId]` |
| `computationAlgorithmParameters` | Parameters per algorithm | Compound indices |
| `environmentComputationParameterValues` | User's param selections | PK includes environmentId |
| `environmentComputation` | Selected provider/algorithm | 1:1 with environment |
| `appEnumValues` | Enum catalog (format/type/coordsystem) | Seeded at install |
| `layers` | Canvas layer registry | Seeded at install |
| `layerSettings` | Per-layer visibility + param values | Seeded at install |

### localStorage
Used for **user preferences** that survive page refreshes and have no relation to workspace data.
- Current uses: `"blade:autosave"` (boolean, in `saveModeStore.ts`)
- Use `localStorage.getItem/setItem` directly in the store action — no wrapper needed.
- Prefer reading the value once at store initialization (`getState()` initializer), not in components.

### sessionStorage
Used for **ephemeral UI state** that should not survive a page refresh.
- Current uses: card modal column widths (`useInternalCardModalListPartColumnSizing.ts`)
- Only use when the data is genuinely session-scoped — otherwise prefer Zustand.

---

## Layer 2 — Bridge Layer (Data Orchestration)

Bridges are the **only** place where multi-table loads and multi-table saves are coordinated.

### Where
`src/features/{feature}/data/{feature}Bridge.ts`

### Existing bridges

| Bridge | Purpose |
|---|---|
| `workspaceBridge.ts` | App init, load workspace, save workspace, reset workspace |
| `canvasBridge.ts` | Load canvas objects/vertices, central save gate, dirty-flag orchestration |

### Rules
- Bridge functions are plain `async` functions — not hooks, not classes.
- A bridge reads from DB and hydrates stores, OR reads from stores and writes to DB. It does not hold state itself.
- `saveCanvas()` in `canvasBridge.ts` is the **central save gate** — every canvas-related save goes through it. It checks all dirty flags before writing anything, skips if nothing is dirty, runs parallel persist writes, then clears flags.
- New cross-table save operations must go through a bridge, not directly from a component or button handler.
- Bridge functions call `store.getState().setXxx(data)` for hydration — they do not use React hooks.

### Naming conventions

| Function type | Pattern | Example |
|---|---|---|
| Startup init | `initializeXxx()` | `initializeWorkspace()` |
| Full workspace load | `loadWorkspace(id)` | — |
| Scoped data load | `loadXxxForYyy(yyy)` | `loadCanvasForEnvironment(env)` |
| Full save | `saveCanvas()`, `saveAsWorkspace(name)` | — |
| Reset (no save) | `resetWorkspace()` | — |

---

## Layer 3 — Zustand State

### Store categories

Use the table below to decide which category a store belongs to:

| Category | Where | Rules | Examples |
|---|---|---|---|
| **Static catalog** | `src/stores/` | Loaded once at startup via loader function; never directly modified by UI | `useComputationCatalogStore` |
| **Active workspace** | `src/stores/` | Holds current environment / canvas / parameter data; has dirty tracking + autosave | `useEnvStore`, `useCanvasObjectStore`, `useParameterValuesStore`, `useLayerSettingsStore` |
| **Save coordination** | `src/stores/` | Reads other stores; orchestrates save mode and status | `useSaveModeStore`, `useSaveStatusStore` |
| **Global UI** | `src/stores/` | Modal visibility, panel states, other transient UI with no persistence | `useConfirmationModalStore`, `useMenuStore`, `useControlsPanelStore` |
| **Feature UI** | `src/features/*/stores/` | Modal/cursor/tool/selection state for a single feature | `useCanvasToolStore`, `useComputationProviderCardStore` |
| **Feature cursor/selection** | `src/features/*/stores/` | Ephemeral selection, active item, drawing state | `useCanvasSelectionStore`, `useCanvasDrawingStore` |
| **Undo/redo** | `src/features/*/stores/` | History via `zundo` middleware; canvas only for now | `useCanvasHistoryStore` |

### Where a store should NOT live
- Feature stores that hold data **shared between features** → move to `src/stores/`
- Stores that own Dexie mutations inside their setters while also holding complex modal state → split into a modal store (pure UI) and a service function (data)

### Middleware rules
- **`persist()` Zustand middleware** → only for feature UI state that needs to survive refresh (e.g. inspector active tab). Do not use for workspace data (that goes to IndexedDB).
- **`zundo`** → only for undo/redo on canvas object store.
- **No `immer` or `devtools`** unless explicitly introduced by maintainer.
- Manual `localStorage.getItem/setItem` in store actions is acceptable for single boolean flags — do not add Zustand `persist()` to global/workspace stores.

### Dirty-tracking + autosave pattern

Every **active workspace store** that can be saved follows this pattern:

```typescript
// 1. Dirty flag in state
isXxxDirty: boolean;

// 2. Mutation that marks dirty and conditionally autosaves
setXxx(value: XxxValue) {
  set({ xxx: value, isXxxDirty: true });
  if (getSaveMode().isAutoSaveEnabled) {
    saveXxx(get().xxx); // direct DB call
  }
},

// 3. Clear after explicit save
clearDirty() {
  set({ isXxxDirty: false });
},
```

**The central gate (`canvasBridge.saveCanvas`) checks all dirty flags before any write:**

```typescript
const { isEnvDirty } = useEnvStore.getState();
const { isParameterValuesDirty } = useParameterValuesStore.getState();
const { isLayerSettingsDirty } = useLayerSettingsStore.getState();
const { dirtyObjects, deletedObjects, dirtyVertices, deletedVertices } = useCanvasObjectStore.getState();

if (
  !isEnvDirty && !isParameterValuesDirty && !isLayerSettingsDirty &&
  !dirtyObjects.length && !deletedObjects.length &&
  !dirtyVertices.length && !deletedVertices.length
) return; // nothing to save

// … parallel persist writes …
// … clearDirty() on each store …
```

---

## Layer 4 — Loader Functions

Loader functions hydrate Zustand from IndexedDB. They are defined **inside** the store file (or co-located in the bridge) and exported as plain async functions.

### Pattern

```typescript
// Defined in the store file or bridge:
export async function loadComputationCatalog(): Promise<void> {
  const [providers, algorithms, parameters, appEnums] = await Promise.all([
    getAllComputationProviders(),
    getAllComputationAlgorithms(),
    getAllAlgorithmParameters(),
    getAllAppEnums(),
  ]);
  useComputationCatalogStore.getState().setCatalog({ providers, algorithms, parameters, appEnums });
}
```

### Rules
- Use `Promise.all()` when loading independent tables together.
- Always call `store.getState().setXxx(data)` — never `useXxxStore()` hook outside React.
- Loader functions are called from bridges, not from `useEffect` in components.
- Loaders do not return data — they hydrate a store as a side-effect.

### All current loaders

| Loader | Defined in | Called from | Tables |
|---|---|---|---|
| `loadComputationCatalog()` | `computationCatalogStore.ts` | `initializeWorkspace`, `loadWorkspace`, `resetWorkspace` | providers, algorithms, params, appEnums |
| `loadLayerSettings()` | `layerSettingsStore.ts` | `initializeWorkspace`, `loadWorkspace`, `resetWorkspace`, `loadCanvasForEnvironment` | layers, layerSettings |
| `loadCanvasForEnvironment(env)` | `canvasBridge.ts` | `loadWorkspace` | objects, vertices |

---

## Service Layer (External HTTP)

Service files talk to the external provider HTTP API. They are not bridges — they are stateless; they read inputs, make HTTP calls, and return results or persist to DB.

### Where
`src/features/{feature}/data/{feature}Service.ts`

### Rules
- Services are plain async functions — not React hooks, not classes.
- Services may call Dexie directly when persisting fetched remote data (e.g. `persistFetchedMetadata` uses a Dexie transaction).
- Services do **not** read from Zustand stores — their inputs come as function parameters.
- Services do **not** update Zustand stores — callers do that after the service returns.
- Use Dexie transactions when writing to 2+ related tables.

### Existing services

| Service | File | Responsibility |
|---|---|---|
| `testConnection(provider)` | `computationProviderService.ts` | HTTP connectivity check |
| `fetchMetadataPreview(provider)` | `computationProviderService.ts` | HTTP GET metadata, validate appHandlers |
| `persistFetchedMetadata(provider, metadata)` | `computationProviderService.ts` | Dexie transaction: replace algorithms + parameters |
| `submitComputeRequest()` | `computeService.ts` | Assemble payload from parameters → POST to `/compute` |

---

## Decision Tables

### "Where does this data go?"

| Data type | Goes in |
|---|---|
| Workspace geometry (objects, vertices) | IndexedDB (`objects`, `vertices` tables) + `useCanvasObjectStore` while active |
| Environment metadata (name, format, type) | IndexedDB (`environments`) + `useEnvStore` while active |
| Provider/algorithm catalog | IndexedDB (`computationProviders`, etc.) + `useComputationCatalogStore` (loaded once) |
| User-selected algorithm + params | IndexedDB (`environmentComputation`, `environmentComputationParameterValues`) + `useEnvStore` / `useParameterValuesStore` |
| Layer visibility / Z-index | IndexedDB (`layerSettings`) + `useLayerSettingsStore` |
| Enum values (format/type/coordsystem) | IndexedDB (`appEnumValues`, seeded) + `useComputationCatalogStore` |
| Autosave preference | `localStorage` (`"blade:autosave"`) + `useSaveModeStore` |
| Modal open/close, active tab | Zustand feature store only (no IndexedDB) |
| Canvas pan/zoom | Zustand feature store only (no IndexedDB) |
| Active tool, draw points, selection | Zustand feature store only (no IndexedDB) |
| Card modal column widths | `sessionStorage` |

### "Which store category do I create?"

| Question | Answer |
|---|---|
| Is this data shared between 2+ features? | Global store in `src/stores/` |
| Is this data part of the active workspace and needs saving? | Global store + dirty tracking + autosave |
| Is this a static catalog (providers, enums) loaded at startup once? | Global store, loader function, no dirty tracking |
| Is this just modal/panel/cursor state for one feature? | Feature store in `src/features/*/stores/` |
| Does this state need to survive a page refresh and is it a UI preference? | Feature store with Zustand `persist()` → `localStorage` |
| Is this app-level save mode or save status? | Global store in `src/stores/` |

### "Where does this async operation go?"

| Operation | Goes in |
|---|---|
| Load data at app startup | Bridge (`initializeWorkspace`) → loader function |
| Load data when opening a workspace | Bridge (`loadWorkspace`) → loader functions |
| Save all changed data | Bridge (`saveCanvas`) — central gate |
| Save a single form after user finishes editing | Store action if autosave; bridge call if manual save |
| Fetch data from external HTTP API | Service function in `{feature}/data/{feature}Service.ts` |
| Persist fetched remote data to DB | Service function (may use Dexie transaction directly) |

---

## What NOT to Do

### Never import Dexie tables inside components

```typescript
// ❌ Wrong — component reaches into DB directly
function WorkspacePickerModal() {
  const [envs, setEnvs] = useState([]);
  useEffect(() => { getAllEnvironments().then(setEnvs); }, []);
  ...
}

// ✅ Correct — store or bridge owns the load; component subscribes
function WorkspacePickerModal() {
  const { environments } = useSaveAsModalStore(); // store loaded it via open()
  ...
}
```

### Never use useLiveQuery

`dexie-react-hooks` is installed but `useLiveQuery` was deliberately removed. Do not reintroduce it. Use loader functions + Zustand instead.

### Never mix modal state and async data loading in the same store

```typescript
// ❌ Wrong — modal state and async DB load mixed together
const useSaveAsModalStore = create((set) => ({
  isOpen: false,
  environments: [],
  open: async () => {
    const envs = await getAllEnvironments(); // DB in modal store action
    set({ isOpen: true, environments: envs });
  },
}));

// ✅ Correct — separate the concerns:
// - useWorkspacePickerStore → isOpen: boolean only
// - workspaceBridge.loadEnvironmentsList() → DB query + store hydration
```

> **Note:** `saveAsModalStore.ts` currently violates this rule. When refactoring, split it.

### Never call one store's action from inside another store's action

```typescript
// ❌ Wrong — store cross-dependency
set({ selectedAlgorithmId: id });
useEnvStore.getState().clearDirty(); // BAD — store calling another store's action

// ✅ Correct — caller coordinates stores at the bridge/component level
setComputationAlgorithmId(id);       // store updates its own state
clearEnvDirty();                     // caller clears related state explicitly
```

### Never use React Context for shared data

All cross-feature data sharing goes through Zustand global stores. React Context is only acceptable for dependency injection in test utilities.

### Never use two different localStorage strategies in the same codebase

- Use **manual** `localStorage.getItem/setItem` in store actions (current pattern, see `saveModeStore`).
- Do **not** mix Zustand `persist()` middleware for global/workspace-scoped stores.
- Zustand `persist()` is acceptable only for feature-scoped UI state (e.g. `inspectorTabStore`).

---

## Code Review Checklist

When reviewing any PR that touches data or state:

**Storage tier**
- [ ] New persistent data has a Dexie table in `server/db/`
- [ ] Query functions exported from `server/index.ts` (features import the public API, not internal files)
- [ ] Multi-table mutations use a Dexie transaction
- [ ] No component imports from `server/db/*.ts` directly

**Bridges**
- [ ] Multi-table loads/saves go through a bridge function
- [ ] Bridge functions are plain async, not hooks
- [ ] New bridge functions follow naming conventions

**Stores**
- [ ] New store placed in correct tier (global `src/stores/` vs feature-local)
- [ ] Workspace data stores have dirty tracking + `clearDirty()`
- [ ] Static catalog stores use a loader function (no dirty tracking)
- [ ] Pure UI stores have no DB calls
- [ ] No `useLiveQuery` introduced
- [ ] No Dexie calls inside components
- [ ] No cross-store action calls inside store actions

**Autosave**
- [ ] Autosave-eligible mutations check `getSaveMode().isAutoSaveEnabled`
- [ ] Save gate in `saveCanvas()` accounts for new dirty flags
- [ ] `clearDirty()` called after successful save

**Services**
- [ ] HTTP calls live in a service file, not in a component or store
- [ ] Services accept parameters — they do not read from Zustand
- [ ] Services do not update Zustand — callers do

---

## Startup Sequence Reference

```
App.tsx (useEffect)
  └─ initializeWorkspace()                         ← workspaceBridge.ts
      ├─ resolveNextEnvironmentId()                 ← DB: max(environments.id)
      ├─ loadComputationCatalog()                   ← DB: 4 tables → useComputationCatalogStore
      └─ loadLayerSettings()                        ← DB: 2 tables → useLayerSettingsStore

User opens a workspace
  └─ loadWorkspace(id)                             ← workspaceBridge.ts
      ├─ loadCanvasForEnvironment(env)              ← canvasBridge.ts → useCanvasObjectStore
      ├─ getEnvironmentComputation(id)              ← DB → useEnvStore.setComputation()
      ├─ getAllParameterValuesByEnvironment(id)     ← DB → useParameterValuesStore.setParameterValues()
      └─ loadLayerSettings()                        ← DB → useLayerSettingsStore

User edits and autosave fires
  └─ store mutation marks dirty                    ← useEnvStore / useCanvasObjectStore / …
      └─ getSaveMode().isAutoSaveEnabled === true
          └─ saveCanvas() OR per-store direct save  ← canvasBridge.ts / store action

User triggers manual save
  └─ saveCanvas()                                  ← canvasBridge.ts
      ├─ check all dirty flags — exit if clean
      ├─ parallel DB writes (objects, vertices, env, params, layerSettings)
      └─ clearDirty() on all stores
```

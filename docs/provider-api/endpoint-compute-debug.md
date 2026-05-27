# POST /compute/debug · POST /compute/debug/:sessionId/step · POST /compute/debug/:sessionId/restart · DELETE /compute/debug/:sessionId

← [Back to API Overview](./api.md)

Debug sessions expose step-by-step algorithm execution using the **run-ahead + step-reveal** strategy:

1. The algorithm runs **synchronously** in full when the session is created. The complete result is stored server-side.
2. Each `/step` call reveals one more `coveragePathPlan` segment, returning a **snapshot** — a full [`ComputeResult`](./endpoint-compute.md#computeresult) with `coveragePathPlan.segments` sliced to the newly revealed count. Debug layers are always returned in full.
3. The client replaces its current result with each snapshot and re-renders the canvas.

**Important:** Debug session routes must be matched before `/compute/:jobId` in the provider's router.

---

## `POST /compute/debug`

Starts a new debug session. Runs the algorithm synchronously, stores the full result, and returns a session handle.

**Request body** — identical to [Compute Request Payload](./endpoint-compute.md#compute-request-payload).

**Response `201`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalSteps": 12,
  "stepIndex": 0,
  "createdAt": "2026-05-16T12:00:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `sessionId` | `string` | UUID identifying this debug session. Pass in subsequent calls. |
| `totalSteps` | `number` | Total number of `coveragePathPlan.segments` in the full result. Zero if the algorithm produced no segments. |
| `stepIndex` | `number` | Always `0` on session start. |
| `createdAt` | `string` | ISO 8601 timestamp. |

**Errors**

| Status | `error.code` | Cause |
|---|---|---|
| `400` | `invalid_json` | Request body is not valid JSON |
| `422` | `compute_error` | Algorithm rejected the request or failed during execution |
| `422` | *(algorithm-specific)* | Validation error from the algorithm's native core — see [errors.md](./errors.md) |

---

## `POST /compute/debug/:sessionId/step`

Advances the session by one step. Returns a [`DebugStepSnapshot`](#debugstepsnapshot) — a full `ComputeResult` with `coveragePathPlan.segments` containing all segments revealed so far, plus a `_debug` metadata object merged at the top level.

Calling `/step` when all segments have already been revealed returns `404`.

**Request body** — none required.

**Response `200`** — [`DebugStepSnapshot`](#debugstepsnapshot)

```json
{
  "coveragePathPlan": {
    "segments": [
      {
        "id": 1,
        "type": "coverage",
        "path": [
          { "id": 1, "point": { "x": 10.0, "y": 20.0 } },
          { "id": 2, "point": { "x": 30.0, "y": 20.0 } }
        ]
      }
    ]
  },
  "debug": {
    "layers": [ "..." ]
  },
  "_debug": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "stepIndex": 1,
    "totalSteps": 12,
    "done": false
  }
}
```

**Errors**

| Status | `error.code` | Cause |
|---|---|---|
| `404` | `session_not_found_or_exhausted` | No session exists for the given ID, or all steps have already been revealed |

---

## `POST /compute/debug/:sessionId/restart`

Resets the session's step pointer to `0` without re-running the algorithm. The client can call `/step` again from the beginning.

**Request body** — none required.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalSteps": 12,
  "stepIndex": 0
}
```

| Field | Type | Notes |
|---|---|---|
| `sessionId` | `string` | Echoed from the session. |
| `totalSteps` | `number` | Total segments — unchanged. |
| `stepIndex` | `number` | Always `0` after restart. |

**Errors**

| Status | `error.code` | Cause |
|---|---|---|
| `404` | `session_not_found` | No session exists for the given ID |

---

## `DELETE /compute/debug/:sessionId`

Terminates the debug session and releases all stored state.

**Response `204`** — no body.

**Errors**

| Status | `error.code` | Cause |
|---|---|---|
| `404` | `session_not_found` | No session exists for the given ID |

---

## Session Lifecycle

```
POST /compute/debug ──► 201 { sessionId, totalSteps, stepIndex: 0 }
                               │
                               ▼
              POST /step ──► 200 DebugStepSnapshot { _debug.stepIndex: 1, done: false }
                               │
                              ...
                               │
              POST /step ──► 200 DebugStepSnapshot { _debug.stepIndex: N, done: true }
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
       POST /restart                DELETE /:sessionId
       (stepIndex resets to 0)      204 (session freed)
```

Sessions are in-memory and ephemeral. They are not persisted across provider restarts. The client should call `DELETE` when done to avoid memory leaks.

---

## Types

### `DebugStepSnapshot`

A snapshot is a full [`ComputeResult`](./endpoint-compute.md#computeresult) with `coveragePathPlan.segments` sliced to the segments revealed so far, plus a `_debug` object merged at the top level.

```json
{
  "coveragePathPlan": {
    "segments": [ "...segments 0..stepIndex-1..." ]
  },
  "debug": {
    "layers": [ "...all debug layers, always in full..." ]
  },
  "performance": { "...": "..." },
  "_debug": {
    "sessionId": "string",
    "stepIndex": 1,
    "totalSteps": 12,
    "done": false
  }
}
```

#### `_debug` fields

| Field | Type | Notes |
|---|---|---|
| `sessionId` | `string` | UUID of the debug session. |
| `stepIndex` | `number` | Number of segments currently revealed (1-based; equals `coveragePathPlan.segments.length`). |
| `totalSteps` | `number` | Total segments in the full result. |
| `done` | `boolean` | `true` when `stepIndex === totalSteps`. |

---

## Algorithm implementation contract

When implementing debug support in an algorithm, follow these rules so the terminal can render each step correctly.

### Coverage segments drive the step counter

`totalSteps` equals the number of entries in `coveragePathPlan.segments`. Each `/step` reveals one more segment. The granularity of a "step" is therefore one logical motion unit (e.g. one coverage pass, one transit, one headland section). Choose segment boundaries to match what is visually meaningful.

### Debug layers are always returned in full

`debug.layers` is **not sliced by step**. Every snapshot response contains the complete debug layer data from the full algorithm run. Use debug layers for static structural data that provides context for the growing path — event lists, cell geometry, sweep lines, etc.

### Step-correlated debug layers

If you want a debug layer's items to be revealed incrementally alongside segments — for example, to highlight the cell being planned at each step — emit **exactly as many items in that layer's `list` as there are `coveragePathPlan.segments`**, where item `i` corresponds to segment `i`. Then the provider's `step()` implementation can slice both arrays by `stepIndex` together.

```
coveragePathPlan.segments[i]  ←→  debug.layers[N].list[i]
```

This is a convention, not enforced by the protocol. The provider side must implement the slicing explicitly if step-correlated debug layers are needed.

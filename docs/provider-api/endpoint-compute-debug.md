# POST /compute/debug · POST /compute/debug/:sessionId/step · POST /compute/debug/:sessionId/restart · DELETE /compute/debug/:sessionId

← [Back to API Overview](./api.md)

Debug sessions expose step-by-step algorithm execution. Unlike the async `POST /compute` job model, a debug session runs the algorithm **synchronously** on start and stores the full result server-side. Segments are then revealed one at a time as the client calls `/step`. This is called the **run-ahead + step-reveal** strategy.

**Important:** Debug session routes must be matched before `/compute/:jobId` in the provider's router.

---

## `POST /compute/debug`

Starts a new debug session. Runs the algorithm synchronously, stores all result segments, and returns a session handle. The client then calls `/step` to reveal segments one at a time.

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
| `totalSteps` | `number` | Total number of segments in the result. Zero if the algorithm produced no segments. |
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

Advances the session by one step, returning the next segment. Calling `/step` when all segments have been revealed returns `404`.

**Request body** — none required.

**Response `200`**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepIndex": 1,
  "totalSteps": 12,
  "done": false,
  "segment": {
    "id": 0,
    "type": "coverage",
    "path": [
      { "id": 0, "point": { "x": 10.0, "y": 20.0 } },
      { "id": 1, "point": { "x": 30.0, "y": 20.0 } }
    ]
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `sessionId` | `string` | Echoed from the session. |
| `stepIndex` | `number` | 1-based index of the segment just revealed. |
| `totalSteps` | `number` | Total segments in the session. |
| `done` | `boolean` | `true` when `stepIndex === totalSteps` (last segment revealed). |
| `segment` | `Segment` | The newly revealed segment — see [Segment](#segment). |

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

Terminates the debug session and releases all stored segments. The provider returns `204` with no body.

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
              POST /step ──► 200 { stepIndex: 1, segment, done: false }
                               │
                              ...
                               │
              POST /step ──► 200 { stepIndex: N, segment, done: true }
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
       POST /restart                DELETE /:sessionId
       (stepIndex resets to 0)      204 (session freed)
```

Sessions are in-memory and ephemeral. They are not persisted across provider restarts. The client should always call `DELETE` when done to avoid memory leaks.

---

## Types

### `Segment`

```json
{
  "id": 0,
  "type": "coverage",
  "path": [
    { "id": 0, "point": { "x": 10.0, "y": 20.0 } },
    { "id": 1, "point": { "x": 30.0, "y": 20.0 } }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Zero-based segment index within the result. |
| `type` | `string` | Segment classification (e.g. `"coverage"`, `"transition"`). Algorithm-specific. |
| `path` | `PathPoint[]` | Ordered list of waypoints forming the segment. |

### `PathPoint`

```json
{ "id": 0, "point": { "x": 10.0, "y": 20.0 } }
```

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Zero-based index within the segment's path. |
| `point` | `Point` | `{ "x": number, "y": number }` |

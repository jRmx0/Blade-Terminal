# Provider API Specification

> **blade-terminal is the source of truth for this specification.**  
> External algorithm providers must implement this interface to be compatible with blade-terminal. blade-terminal does not adjust to provider implementations — providers must conform to the contracts defined here.

blade-terminal communicates with algorithm providers over HTTP. A provider is a local HTTP service that exposes algorithm metadata and runs coverage-path-planning computations. Compute jobs are asynchronous: submitting a request returns a job ID, which the caller polls until the job reaches a terminal state.

**Default base URL:** `http://localhost:8080`  
Users configure the provider URL and optional API key inside blade-terminal's provider settings.

---

## Auth & Headers

| Header | When required | Value |
|---|---|---|
| `Content-Type` | POST requests with a body | `application/json` |
| `Authorization` | When provider has an API key configured | `Bearer <apiKey>` |

All responses must carry open CORS headers (`Access-Control-Allow-Origin: *`). Providers must respond to preflight `OPTIONS` requests to any route with `204` and no body.

---

## Endpoints

| Method | Path | Description | Reference |
|---|---|---|---|
| `GET` | `/` | Service discovery | below |
| `GET` | `/health` | Liveness check | below |
| `GET` | `/metadata` | Algorithm metadata & parameter schemas | [endpoint-metadata.md](./endpoint-metadata.md) |
| `POST` | `/compute` | Submit a compute job | [endpoint-compute.md](./endpoint-compute.md) |
| `GET` | `/compute/:jobId` | Poll a compute job | [endpoint-compute.md](./endpoint-compute.md) |
| `POST` | `/compute/debug` | Start a debug session (run-ahead + step-reveal) | [endpoint-compute-debug.md](./endpoint-compute-debug.md) |
| `POST` | `/compute/debug/:sessionId/step` | Reveal the next segment | [endpoint-compute-debug.md](./endpoint-compute-debug.md) |
| `POST` | `/compute/debug/:sessionId/restart` | Reset step pointer to 0 | [endpoint-compute-debug.md](./endpoint-compute-debug.md) |
| `DELETE` | `/compute/debug/:sessionId` | Stop and free the debug session | [endpoint-compute-debug.md](./endpoint-compute-debug.md) |

For error response shape and all error codes see [errors.md](./errors.md).  
For layer style attributes see [layer-styles.md](./layer-styles.md).

---

### `GET /`

Service discovery. Returns the list of exposed endpoints and names of available algorithms.

**Response `200`**
```json
{
  "service": "<provider name>",
  "endpoints": {
    "health": "/health",
    "metadata": "/metadata",
    "compute": "/compute",
    "computeStatus": "/compute/:jobId"
  },
  "algorithms": [
    { "name": "<algorithm name>" },
    "..."
  ]
}
```

---

### `GET /health`

Liveness check.

**Response `200`**
```json
{
  "status": "ok",
  "service": "<provider name>",
  "timestamp": "2026-03-20T12:00:00.000Z"
}
```

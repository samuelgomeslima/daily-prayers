# Neon Data API Integration Guide

This project can connect to Neon in two different ways:

1. **Classic SQL-over-HTTP** using the `NEON_DATABASE_URL` connection string.
2. **Neon Data API** using the REST endpoint generated from the Neon dashboard.

When the `NEON_DATA_API_URL` and `NEON_DATA_API_KEY` environment variables are provided, the API automatically switches to the Data API client and every call to the shared `query` helper is sent through the REST endpoint.

## 1. Enable the Data API in Neon

1. Open your project in the [Neon console](https://console.neon.tech/).
2. Select the branch that backs this application.
3. Open the **Data API** tab and click **Enable** if the feature is not already active.
4. Copy the **Endpoint URL**. It should look like `https://ep-example-123456.apirest.<region>.neon.tech/neondb/rest/v1`.
5. Generate a **service role API key**. Copy the key value – it will be required by the Azure Functions runtime.

> The service role key grants full access to the branch. Store it securely (e.g. as an Azure App Setting or GitHub secret) and avoid shipping it with the mobile application.

## 2. Configure environment variables

Update `api/local.settings.json` locally and the Function App settings in Azure with the following values:

| Variable | Required | Description |
| --- | --- | --- |
| `NEON_DATA_API_URL` | Yes (for Data API mode) | Endpoint copied from the Neon console. Keep the `/rest/v1` suffix. |
| `NEON_DATA_API_KEY` | Yes (for Data API mode) | Service role key generated in the Neon console. |
| `NEON_DATABASE_URL` | Optional fallback | Postgres connection string. Leave empty when relying solely on the Data API. |

The backend detects the Data API automatically. No additional code changes are necessary once the variables are defined.

## 3. Reading and writing data

All server functions use the `query` helper exported from `api/src/lib/neon-client.js`. The helper transparently converts SQL calls into HTTPS requests compatible with the Data API.

```js
const { query } = require('../lib/neon-client');

async function listNotes(userId) {
  const result = await query(
    `SELECT id, title, content FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId]
  );

  return Array.isArray(result.rows) ? result.rows : [];
}
```

Under the hood the helper sends a `POST` request to `https://<your-endpoint>/neondb/query` with the following payload:

```json
{
  "sql": "SELECT id, title, content FROM notes WHERE user_id = $1 ORDER BY updated_at DESC",
  "params": ["<uuid>"],
  "format": "json"
}
```

Required headers:

```
Authorization: Bearer <NEON_DATA_API_KEY>
Content-Type: application/json
Accept: application/json
```

The same mechanism is used for inserts, updates and deletes. For example, creating a new note translates to the SQL statement executed via the Data API:

```js
await query(
  `INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
   VALUES ($1, $2, $3, $4, NOW(), NOW())`,
  [noteId, userId, title, content]
);
```

## 4. Testing the Data API manually

You can manually verify the configuration with `curl` (replace placeholders with real values):

```bash
curl \
  -X POST "https://<your-endpoint>/neondb/query" \
  -H "Authorization: Bearer $NEON_DATA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT 1",
    "format": "json"
  }'
```

The response should include a JSON payload containing a `results` array or `records` list with the query output.

## 5. Troubleshooting

- **401 Unauthorized** – Confirm that the API key is valid and has not been revoked. Data API keys are scoped to the branch – regenerate a key if you recreated the branch.
- **404 Not Found** – Ensure the endpoint URL retains the `/rest/v1` suffix and that you are calling the `/query` path (the helper does this for you).
- **Timeouts** – The Data API enforces limits on query runtime. Check the Neon dashboard for long-running query logs and consider adding indexes if needed.

With these steps the Azure Functions backend will read and write data through the Neon Data API seamlessly.

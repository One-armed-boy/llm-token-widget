const DEFAULT_TIMEOUT_MS = 15000;

export function createRealHttpClient({ fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch implementation is required");
  }

  const calls = [];

  return {
    calls,
    async request(request) {
      calls.push(redactedCall(request));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(request.url, {
          method: request.method,
          headers: request.headers,
          signal: controller.signal
        });
        const json = await parseJsonSafely(response);

        return {
          status: response.status,
          json
        };
      } catch (error) {
        return {
          status: null,
          json: {
            error: {
              status: null,
              message: error?.name === "AbortError" ? "request timeout" : "network error"
            }
          }
        };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

function redactedCall(request) {
  return {
    name: request.name,
    method: request.method,
    url: request.url,
    redactedHeaders: Object.fromEntries(Object.keys(request.headers ?? {}).map((key) => [key, "[redacted]"]))
  };
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return {
      error: {
        status: response.status,
        message: response.ok ? "invalid JSON response" : `HTTP ${response.status}`
      }
    };
  }
}

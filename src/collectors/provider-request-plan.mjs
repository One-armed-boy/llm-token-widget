const OPENAI_BASE_URL = "https://api.openai.com";
const ANTHROPIC_BASE_URL = "https://api.anthropic.com";
const DEFAULT_LIMIT = 31;

export function buildProviderRequestPlan(config) {
  switch (config.provider) {
    case "openai":
      return buildOpenAIRequestPlan(config);
    case "anthropic":
      return buildAnthropicRequestPlan(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

export function redactRequestPlan(plan) {
  return {
    provider: plan.provider,
    accountId: plan.accountId,
    requests: plan.requests.map((request) => ({
      name: request.name,
      method: request.method,
      url: request.url,
      redactedHeaders: redactHeaders(request.headers)
    }))
  };
}

function buildOpenAIRequestPlan(config) {
  const startTime = requireUnixSeconds(config.period?.startTime, "period.startTime");
  const endTime = optionalUnixSeconds(config.period?.endTime, "period.endTime");
  const limit = normalizeLimit(config.limit);
  const groupBy = normalizeGroupBy(config.groupBy, ["project_id"]);
  const baseUrl = config.baseUrl ?? OPENAI_BASE_URL;
  const headers = {
    Authorization: `Bearer ${requireSecret(config.apiKey, "apiKey")}`,
    "Content-Type": "application/json"
  };

  return {
    provider: "openai",
    accountId: config.accountId,
    requests: [
      {
        name: "usage",
        method: "GET",
        url: withQuery(`${baseUrl}/v1/organization/usage/completions`, {
          start_time: startTime,
          end_time: endTime,
          limit,
          page: config.usagePage,
          group_by: groupBy
        }),
        headers
      },
      {
        name: "costs",
        method: "GET",
        url: withQuery(`${baseUrl}/v1/organization/costs`, {
          start_time: startTime,
          end_time: endTime,
          limit,
          page: config.costsPage,
          group_by: groupBy
        }),
        headers
      }
    ]
  };
}

function buildAnthropicRequestPlan(config) {
  const startTime = requireDate(config.period?.startTime, "period.startTime");
  const endTime = optionalDate(config.period?.endTime, "period.endTime");
  const limit = normalizeLimit(config.limit);
  const baseUrl = config.baseUrl ?? ANTHROPIC_BASE_URL;
  const headers = {
    "x-api-key": requireSecret(config.apiKey, "apiKey"),
    "anthropic-version": config.anthropicVersion ?? "2023-06-01"
  };

  return {
    provider: "anthropic",
    accountId: config.accountId,
    requests: [
      {
        name: "usage",
        method: "GET",
        url: withQuery(`${baseUrl}/v1/organizations/usage_report/messages`, {
          starting_at: startTime,
          ending_at: endTime,
          limit,
          page: config.usagePage
        }),
        headers
      },
      {
        name: "costs",
        method: "GET",
        url: withQuery(`${baseUrl}/v1/organizations/cost_report`, {
          starting_at: startTime,
          ending_at: endTime,
          limit,
          page: config.costsPage
        }),
        headers
      }
    ]
  };
}

function withQuery(url, params) {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        parsed.searchParams.append(key, item);
      }
      continue;
    }

    parsed.searchParams.set(key, String(value));
  }
  return parsed.toString();
}

function redactHeaders(headers) {
  return Object.fromEntries(Object.keys(headers).map((key) => [key, "[redacted]"]));
}

function requireSecret(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}

function requireUnixSeconds(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be unix seconds`);
  }

  return value;
}

function optionalUnixSeconds(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return requireUnixSeconds(value, fieldName);
}

function requireDate(value, fieldName) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`${fieldName} must be an ISO date string`);
  }

  return value.slice(0, 10);
}

function optionalDate(value, fieldName) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return requireDate(value, fieldName);
}

function normalizeLimit(value) {
  if (value === undefined || value === null) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(value) || value < 1 || value > 180) {
    throw new Error("limit must be an integer between 1 and 180");
  }

  return value;
}

function normalizeGroupBy(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("groupBy must be an array of strings");
  }

  return value;
}

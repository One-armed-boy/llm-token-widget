export function createMockHttpClient(routes) {
  const calls = [];

  return {
    calls,
    async request(request) {
      calls.push({
        name: request.name,
        method: request.method,
        url: request.url,
        redactedHeaders: Object.fromEntries(Object.keys(request.headers ?? {}).map((key) => [key, "[redacted]"]))
      });

      const route = findRoute(routes, request);
      if (!route) {
        return {
          status: 404,
          json: {
            error: {
              status: 404,
              message: `No mock route for ${request.name}`
            }
          }
        };
      }

      if (route.error) {
        return {
          status: route.status ?? route.error.status ?? 500,
          json: { error: route.error }
        };
      }

      return {
        status: route.status ?? 200,
        json: route.json
      };
    }
  };
}

function findRoute(routes, request) {
  return routes.find((route) => {
    if (route.name && route.name !== request.name) {
      return false;
    }

    if (route.provider && !request.url.includes(route.provider)) {
      return false;
    }

    if (route.path && !new URL(request.url).pathname.includes(route.path)) {
      return false;
    }

    return true;
  });
}

import { readFileSync } from "node:fs";

const DEFAULT_SCHEMA_PATH = "schemas/widget-snapshot.schema.json";

export function validateWidgetSnapshotSchema(snapshot, schema = readDefaultSchema()) {
  const failures = [];
  validateObject(snapshot, schema, "$", schema, failures);
  return {
    ok: failures.length === 0,
    failures
  };
}

function readDefaultSchema() {
  return JSON.parse(readFileSync(DEFAULT_SCHEMA_PATH, "utf8"));
}

function validateObject(value, schema, path, rootSchema, failures) {
  const resolvedSchema = resolveSchema(schema, rootSchema);

  if (resolvedSchema.const !== undefined && value !== resolvedSchema.const) {
    failures.push({ path, reason: `must equal ${JSON.stringify(resolvedSchema.const)}` });
    return;
  }

  if (resolvedSchema.enum && !resolvedSchema.enum.includes(value)) {
    failures.push({ path, reason: `must be one of ${resolvedSchema.enum.join(", ")}` });
    return;
  }

  if (resolvedSchema.type) {
    const allowedTypes = Array.isArray(resolvedSchema.type) ? resolvedSchema.type : [resolvedSchema.type];
    if (!allowedTypes.some((type) => matchesType(value, type))) {
      failures.push({ path, reason: `must be ${allowedTypes.join(" or ")}` });
      return;
    }
  }

  if (typeof value === "number" && resolvedSchema.minimum !== undefined && value < resolvedSchema.minimum) {
    failures.push({ path, reason: `must be >= ${resolvedSchema.minimum}` });
  }

  if (resolvedSchema.type === "object" || isPlainObject(value)) {
    validatePlainObject(value, resolvedSchema, path, rootSchema, failures);
  }

  if (resolvedSchema.type === "array" || Array.isArray(value)) {
    validateArray(value, resolvedSchema, path, rootSchema, failures);
  }
}

function validatePlainObject(value, schema, path, rootSchema, failures) {
  if (!isPlainObject(value)) {
    return;
  }

  for (const key of schema.required ?? []) {
    if (!Object.hasOwn(value, key)) {
      failures.push({ path: `${path}.${key}`, reason: "is required" });
    }
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties ?? {}, key)) {
        failures.push({ path: `${path}.${key}`, reason: "additional property is not allowed" });
      }
    }
  }

  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (Object.hasOwn(value, key)) {
      validateObject(value[key], propertySchema, `${path}.${key}`, rootSchema, failures);
    }
  }
}

function validateArray(value, schema, path, rootSchema, failures) {
  if (!Array.isArray(value)) {
    return;
  }

  value.forEach((item, index) => {
    validateObject(item, schema.items, `${path}[${index}]`, rootSchema, failures);
  });
}

function resolveSchema(schema, rootSchema) {
  if (!schema?.$ref) {
    return schema;
  }

  const refPath = schema.$ref.replace("#/", "").split("/");
  return refPath.reduce((value, key) => value?.[key], rootSchema);
}

function matchesType(value, type) {
  switch (type) {
    case "null":
      return value === null;
    case "array":
      return Array.isArray(value);
    case "object":
      return isPlainObject(value);
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    default:
      return false;
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

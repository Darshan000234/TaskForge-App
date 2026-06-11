export function diffObjects(oldObj, newObj, ignoreKeys = ["updatedAt", "createdAt"]) {
  if (!oldObj || !newObj) return {};

  const allKeys = new Set([
    ...Object.keys(oldObj),
    ...Object.keys(newObj),
  ]);

  const changes = {};

  for (const key of allKeys) {
    if (ignoreKeys.includes(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (!isEqual(oldVal, newVal)) {
      changes[key] = { from: oldVal ?? null, to: newVal ?? null };
    }
  }

  return changes;
}

export function diffAssignees(oldAssignees = [], newAssignees = []) {
  const oldMap = new Map(oldAssignees.map((u) => [u.id, u]));
  const newMap = new Map(newAssignees.map((u) => [u.id, u]));

  const added   = newAssignees.filter((u) => !oldMap.has(u.id));
  const removed = oldAssignees.filter((u) => !newMap.has(u.id));

  return { added, removed };
}

function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (typeof a === "string" && typeof b === "string") {
    const da = Date.parse(a);
    const db = Date.parse(b);
    if (!isNaN(da) && !isNaN(db)) return da === db;
    return a === b;
  }

  if (typeof a !== "object" || typeof b !== "object") return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isEqual(item, b[i]));
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => isEqual(a[k], b[k]));
}
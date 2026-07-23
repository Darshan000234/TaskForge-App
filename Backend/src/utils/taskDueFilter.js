

const ALLOWED_DUE = ["overdue", "today"];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const buildDueWhere = (due) => {
  if (!ALLOWED_DUE.includes(due)) return {};

  const now = new Date();

  if (due === "overdue") {
    return {
      dueDate: { lt: now },
      Status: { not: "done" },
    };
  }

  // due === "today"
  return {
    dueDate: { gte: startOfDay(now), lte: endOfDay(now) },
  };
};
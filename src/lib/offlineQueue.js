import { base44 } from "@/api/base44Client";

const QUEUE_KEY = "balancen_offline_queue";

export function addToQueue(operation) {
  const queue = getQueue();
  queue.push({ ...operation, createdAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export async function processQueue() {
  const queue = getQueue();
  if (queue.length === 0) return { processed: 0 };

  const remaining = [];
  let processed = 0;

  for (const op of queue) {
    try {
      if (op.type === "meal_save") {
        await base44.entities.MealLog.create(op.payload);
        processed++;
      } else if (op.type === "checkin") {
        await base44.functions.invoke("updateDailyCheckIn", op.payload);
        processed++;
      } else {
        // Unknown type — drop it
        processed++;
      }
    } catch {
      // Keep failed ops in queue for next attempt
      remaining.push(op);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { processed, remaining: remaining.length };
}
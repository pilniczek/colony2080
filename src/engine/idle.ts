export const IDLE_TIMEOUT_MS = 200;

export const whenIdle = (task: () => void): void => {
  if (typeof requestIdleCallback === "function") requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(task);
};

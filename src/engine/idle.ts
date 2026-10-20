export const whenIdle = (task: () => void): void => {
  if (typeof requestIdleCallback === "function") requestIdleCallback(task);
  else setTimeout(task);
};

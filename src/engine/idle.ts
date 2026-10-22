const queue: (() => void)[] = [];

export const whenIdle = (task: () => void): void => {
  queue.push(task);
};

export const runIdleJob = (): void => {
  queue.shift()?.();
};

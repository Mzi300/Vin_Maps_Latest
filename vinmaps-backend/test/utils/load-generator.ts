// test/utils/load-generator.ts
/**
 * Simple load generator for resilience tests.
 * Executes an array of async request functions with a given concurrency level.
 */
export async function generateLoad(
  tasks: (() => Promise<any>)[],
  concurrency: number = 10,
): Promise<void> {
  const queue = tasks.slice();
  const workers: Promise<void>[] = [];
  const run = async () => {
    while (queue.length) {
      const fn = queue.shift();
      if (!fn) break;
      // eslint-disable-next-line no-await-in-loop
      await fn();
    }
  };
  for (let i = 0; i < concurrency; i++) {
    workers.push(run());
  }
  await Promise.all(workers);
}

export function createThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}


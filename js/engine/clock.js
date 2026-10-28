/** A monotonic elapsed clock. Pause is explicit; animation frames never accumulate time. */
export class Clock {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.started = null;
    this.pausedAt = null;
    this.pausedMs = 0;
  }
  start() {
    if (this.started === null) this.started = this.now();
  }
  elapsed() {
    return this.started === null
      ? 0
      : Math.max(
          0,
          (this.pausedAt ?? this.now()) - this.started - this.pausedMs,
        );
  }
  pause() {
    if (this.started !== null && this.pausedAt === null)
      this.pausedAt = this.now();
  }
  resume() {
    if (this.pausedAt !== null) {
      this.pausedMs += this.now() - this.pausedAt;
      this.pausedAt = null;
    }
  }
}
export function formatTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

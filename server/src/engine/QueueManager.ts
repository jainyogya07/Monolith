import { QueuedTask } from '../types';
import { performance } from 'perf_hooks';

export class QueueManager {
    private queue: QueuedTask[] = [];
    private currentLag = 0;
    private lastLoopCheck = performance.now();

    constructor() {
        this.startProcessingLoop();
        this.startLagMonitor();
    }

    // 1. MONITOR: Event Loop Lag
    // We schedule a check every 50ms. If it runs late, that's lag.
    private startLagMonitor() {
        const CHECK_INTERVAL = 50;

        const check = () => {
            const now = performance.now();
            const delta = now - this.lastLoopCheck;
            const lag = delta - CHECK_INTERVAL;

            // Exponential Moving Average to smooth it out
            // currentLag = 0.9 * old + 0.1 * new
            const measuredLag = Math.max(0, lag);
            this.currentLag = (this.currentLag * 0.9) + (measuredLag * 0.1);

            this.lastLoopCheck = now;
            setTimeout(check, CHECK_INTERVAL);
        };

        setTimeout(check, CHECK_INTERVAL);
    }

    public enqueue(item: QueuedTask) {
        // Priority Insert
        const index = this.queue.findIndex(t => t.score.priority < item.score.priority);
        if (index === -1) {
            this.queue.push(item);
        } else {
            this.queue.splice(index, 0, item);
        }
    }

    public getQueueLength(): number {
        return this.queue.length;
    }

    /**
     * Returns a normalized "Load" (0-100) based on Lag.
     * Mapping: 
     * 0ms lag -> 0%
     * 100ms lag -> 100% (pretty bad state for Node)
     */
    public getCurrentLoad(): number {
        // We can also allow manual override if needed, but let's stick to real metrics.
        return Math.min(100, (this.currentLag / 100) * 100);
    }

    public getRawLag(): number {
        return this.currentLag;
    }

    // Legacy support for tests (allows injecting stress)
    // We can't easily "inject" lag without blocking CPU, 
    // but we can override the return value if we really want 
    // or just block CPU in test scripts.
    // For now, let's allow a "manual offset" if needed, 
    // but actually, our tests USE this to inject stress.
    // We should keep strict compatibility.
    private manualLoadOffset = 0;
    public updateLoad(load: number) {
        this.manualLoadOffset = load;
    }

    // Override to include manual load for testing
    public getEffectiveLoad(): number {
        return Math.max(this.getCurrentLoad(), this.manualLoadOffset);
    }

    private startProcessingLoop() {
        setInterval(async () => {
            if (this.queue.length === 0) return;

            const item = this.queue.shift();
            if (item) {
                await this.processTask(item);
            }
        }, 10);
    }

    private async processTask(item: QueuedTask) {
        // If it's a "Heavy" task, we actually BLOCK to create lag
        if ((item.task.payload as any).heavy) {
            this.blockCpu(20); // Block for 20ms
        } else {
            // Normal task
            const cost = item.score.estimatedCost;
            await new Promise(r => setTimeout(r, cost));
        }
    }

    private blockCpu(ms: number) {
        const end = Date.now() + ms;
        while (Date.now() < end) {
            // busy wait
        }
    }
}

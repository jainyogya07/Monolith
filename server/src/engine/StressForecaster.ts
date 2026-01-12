export interface ForecastResult {
    failureProbability: number; // 0.0 - 1.0 (Prob of SlaViolation)
    expectedQueue: number;      // P50
    worstCaseQueue: number;     // P95
    slaMs: number;
}

export class StressForecaster {
    private readonly SIMULATION_COUNT = 100;
    private readonly HORIZON_MS = 1000;
    private readonly SLA_LIMIT_MS = 500; // Example SLA: 500ms max latency
    private readonly AVG_PROCESS_TIME_MS = 10; // Avg time to process 1 task

    /**
     * Predicts future state of the system if we accept a new task.
     * @param currentQueueDepth Current number of items in the queue
     * @param incomingTaskCost Estimated cost of the new task (in ms)
     */
    public predict(currentQueueDepth: number, incomingTaskCost: number): ForecastResult {
        let failures = 0;
        const futureQueues: number[] = [];

        for (let i = 0; i < this.SIMULATION_COUNT; i++) {
            // Simulation: Delta Prediction
            // futureQueue = current + arrivals - completions
            const arrivals = this.simulateArrivals(this.HORIZON_MS);
            const completions = this.simulateCompletions(this.HORIZON_MS);

            let futureQueue = currentQueueDepth + 1 + arrivals - completions; // +1 for the incoming task
            if (futureQueue < 0) futureQueue = 0;

            futureQueues.push(futureQueue);

            // Check for SLA Violation
            // Latency = QueueLength * AvgProcessTime
            const estimatedLatency = futureQueue * this.AVG_PROCESS_TIME_MS;
            if (estimatedLatency > this.SLA_LIMIT_MS) {
                failures++;
            }
        }

        futureQueues.sort((a, b) => a - b);

        return {
            failureProbability: failures / this.SIMULATION_COUNT,
            expectedQueue: futureQueues[Math.floor(this.SIMULATION_COUNT * 0.5)],
            worstCaseQueue: futureQueues[Math.floor(this.SIMULATION_COUNT * 0.95)],
            slaMs: this.SLA_LIMIT_MS
        };
    }

    // Simulate incoming tasks (Poisson distribution approximation)
    private simulateArrivals(durationMs: number): number {
        // Variable arrival rate. Let's assume average 50 req/sec for now (should be dynamic later)
        const avgRatePerSec = 50;
        const expected = (avgRatePerSec * durationMs) / 1000;
        // Simple Box-Muller or just variance around expected
        // For speed, let's just use simple randomization +/- 20%
        // Ideally this is a Poisson generator.
        return Math.max(0, Math.round(expected + (Math.random() - 0.5) * expected * 0.4));
    }

    // Simulate task completions 
    private simulateCompletions(durationMs: number): number {
        // Capacity = Duration / ProcessTime
        const capacity = durationMs / this.AVG_PROCESS_TIME_MS;
        // Variance in processing speed +/- 10%
        return Math.max(1, Math.round(capacity + (Math.random() - 0.5) * capacity * 0.2));
    }
}

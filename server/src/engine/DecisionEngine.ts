import { v4 as uuidv4 } from 'uuid';
import { Task, TaskType } from '../types';
import { RiskModel } from './RiskModel';
import { QueueManager } from './QueueManager';
import { StressForecaster } from './StressForecaster';

export class DecisionEngine {
    private riskModel: RiskModel;
    private queueManager: QueueManager;
    private stressForecaster: StressForecaster;

    constructor() {
        this.riskModel = new RiskModel();
        this.queueManager = new QueueManager();
        this.stressForecaster = new StressForecaster();
    }

    public submitTask(type: TaskType, payload: any) {
        const task: Task = {
            id: uuidv4(),
            type,
            payload,
            timestamp: Date.now(),
            source: 'UserRequest'
        };

        const score = this.riskModel.evaluate(task);

        // 1. HARD LIMIT CHECK (Layer 1)
        const currentLoad = this.queueManager.getEffectiveLoad();

        if (currentLoad > 95 && score.priority < 30) {
            console.error(`[DecisionEngine] DROPPED Task ${task.id} (Load: ${currentLoad.toFixed(1)}%, Priority: ${score.priority.toFixed(1)})`);
            return {
                action: 'drop',
                reason: 'system_overload',
                metrics: {
                    load: currentLoad,
                    priority: score.priority,
                    risk: score.risk
                },
                task,
                score
            };
        }

        // 2. FORECAST CHECK (Layer 2)
        if (currentLoad > 70) {
            const queueLen = this.queueManager.getQueueLength();
            const forecast = this.stressForecaster.predict(queueLen, score.estimatedCost);

            if (forecast.failureProbability > 0.8 && score.priority < 50) {
                console.warn(`[DecisionEngine] PREVENTIVELY DROPPED Task ${task.id} (Forecast Prob: ${forecast.failureProbability.toFixed(2)})`);
                return {
                    action: 'drop',
                    reason: 'forecasted_sla_violation',
                    metrics: {
                        load: currentLoad,
                        priority: score.priority,
                        risk: score.risk,
                        forecast
                    },
                    task,
                    score
                };
            }
        }

        this.queueManager.enqueue({
            task,
            score,
            enqueuedAt: Date.now()
        });

        return {
            action: 'accept',
            reason: 'within_capacity',
            metrics: {
                load: currentLoad,
                priority: score.priority,
                risk: score.risk
            },
            task,
            score
        };
    }
}

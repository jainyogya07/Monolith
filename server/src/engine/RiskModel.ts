import { Task, TaskScore, TaskType } from '../types';

export class RiskModel {

    public evaluate(task: Task): TaskScore {
        let priority = 50;
        let risk = 0.1;
        let cost = 10;

        switch (task.type) {
            case TaskType.CRITICAL:
                priority = 90;
                risk = 0.8; // High stake
                cost = 50;
                break;
            case TaskType.HIGH_PRIORITY:
                priority = 75;
                risk = 0.4;
                cost = 30;
                break;
            case TaskType.STANDARD:
                priority = 50;
                risk = 0.2;
                cost = 20;
                break;
            case TaskType.BACKGROUND:
                priority = 10;
                risk = 0.05;
                cost = 100; // Often batch jobs are heavy
                break;
        }

        // Add some noise/randomness to simulate real-world variance
        priority += (Math.random() * 10 - 5);
        cost += (Math.random() * 10 - 5);

        return {
            priority: Math.max(0, Math.min(100, priority)),
            risk,
            estimatedCost: Math.max(1, cost)
        };
    }
}

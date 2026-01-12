export enum TaskType {
    CRITICAL = 'CRITICAL',
    HIGH_PRIORITY = 'HIGH_PRIORITY',
    STANDARD = 'STANDARD',
    BACKGROUND = 'BACKGROUND'
}

export interface Task {
    id: string;
    type: TaskType;
    payload: any;
    timestamp: number;
    source: string;
}

export interface TaskScore {
    priority: number; // 0-100
    risk: number; // 0-1 (probability of failure/impact)
    estimatedCost: number; // Arbitrary units (e.g. ms of CPU)
}

export interface QueuedTask {
    task: Task;
    score: TaskScore;
    enqueuedAt: number;
}

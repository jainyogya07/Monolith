import Fastify from 'fastify';
import { Server } from 'socket.io';
import { DecisionEngine } from './engine/DecisionEngine';
import { TaskType } from './types';

const fastify = Fastify({
    logger: true
});

const engine = new DecisionEngine();

// Setup Decision Engine & Routes
fastify.get('/', async (request, reply) => {
    return { status: 'Monolith Online' };
});

fastify.post<{ Body: { type: string; payload: any } }>('/task', async (request, reply) => {
    const { type, payload } = request.body;
    const taskType = (TaskType as any)[type] || TaskType.STANDARD;
    const result = engine.submitTask(taskType, payload);
    return result;
});

// EXPERIMENT 1: Event Loop Starvation Endpoint
fastify.get('/block', async (_req, _reply) => {
    const start = Date.now();
    // Block event loop for 300ms
    while (Date.now() - start < 300) {
        // Busy wait
    }
    return { status: 'Blocked for 300ms' };
});

// Admin Stress Injection (Managed via QueueManager manual override now)
fastify.post<{ Body: { load: number } }>('/admin/stress', async (request, reply) => {
    const { load } = request.body;
    (engine as any).queueManager.updateLoad(load);
    return { status: 'Manual Load Override Updated', currentLoad: load };
});

const start = async () => {
    try {
        await fastify.ready(); // Ensure plugins/server ready
        const server = fastify.server;

        // Attach Socket.IO
        const io = new Server(server, {
            cors: {
                origin: "*", // Simplify for dev
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('Frontend Connected via Socket.IO');
            socket.emit('status', { msg: 'Connected to Monolith Core' });
        });

        // Start Metrics Broadcast Loop
        setInterval(() => {
            const qm = (engine as any).queueManager;
            const metrics = {
                queueLength: qm.getQueueLength(),
                systemLoad: qm.getEffectiveLoad(),
                rawLag: qm.getRawLag(),
                timestamp: Date.now()
            };
            io.emit('metrics', metrics);
        }, 100); // Broadcast every 100ms

        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

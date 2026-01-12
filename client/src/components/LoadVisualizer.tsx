import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

interface Metrics {
    queueLength: number;
    systemLoad: number;
    rawLag: number;
    timestamp: number;
}

const SOCKET_URL = 'http://localhost:3000';

export const LoadVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [metrics, setMetrics] = useState<Metrics>({ queueLength: 0, systemLoad: 0, rawLag: 0, timestamp: 0 });
    const [connected, setConnected] = useState(false);

    // Particle System State
    const particles = useRef<any[]>([]);

    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to Monolith Core');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('metrics', (data: Metrics) => {
            setMetrics(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Canvas Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const render = () => {
            // Rezize
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            const w = canvas.width;
            const h = canvas.height;

            // Clear with trail effect
            ctx.fillStyle = 'rgba(10, 10, 15, 0.2)'; // Dark background with trail
            ctx.fillRect(0, 0, w, h);

            // Center Gravity Well (representing the Processor)
            const cx = w / 2;
            const cy = h / 2;

            // Color based on Load
            // Green -> Yellow -> Red
            const loadHue = Math.max(0, 120 - (metrics.systemLoad * 1.2));
            const color = `hsl(${loadHue}, 100%, 50%)`;

            // Draw Core
            ctx.beginPath();
            const coreSize = 20 + (metrics.rawLag / 5); // Core grows with lag
            ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset

            // Draw Queue Ring
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.arc(cx, cy, 100, 0, Math.PI * 2);
            ctx.stroke();

            // Spawn Particles based on Queue Length
            // We want 'particles.length' to approach 'metrics.queueLength'
            if (particles.current.length < metrics.queueLength) {
                // Spawn
                for (let i = 0; i < (metrics.queueLength - particles.current.length); i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 100 + Math.random() * 50;
                    particles.current.push({
                        x: cx + Math.cos(angle) * dist,
                        y: cy + Math.sin(angle) * dist,
                        angle,
                        speed: 0.02 + Math.random() * 0.03
                    });
                    if (i > 5) break; // Limit spawn rate
                }
            } else if (particles.current.length > metrics.queueLength) {
                // Despawn (processed)
                particles.current.splice(0, particles.current.length - metrics.queueLength);
            }

            // Update & Draw Particles
            ctx.fillStyle = '#fff';
            particles.current.forEach(p => {
                // Orbit
                p.angle += p.speed * (1 + metrics.systemLoad / 50); // Spin faster under load
                const dist = 100 + Math.sin(Date.now() / 1000 + p.angle) * 10; // Breathing orbit

                p.x = cx + Math.cos(p.angle) * dist;
                p.y = cy + Math.sin(p.angle) * dist;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Text Info
            ctx.fillStyle = '#fff';
            ctx.font = '16px monospace';
            ctx.fillText(`Queue: ${metrics.queueLength}`, 20, 30);
            ctx.fillText(`Load: ${metrics.systemLoad.toFixed(1)}%`, 20, 50);
            ctx.fillText(`Lag: ${metrics.rawLag.toFixed(1)}ms`, 20, 70);
            ctx.fillText(`Status: ${connected ? 'ONLINE' : 'OFFLINE'}`, 20, 90);

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [metrics, connected]);

    return (
        <div style={{ width: '100%', height: '100vh', background: '#050505' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
};

import React, { useEffect, useRef } from 'react';
import { use1xZone } from '../hooks/use1xZone';
import { Activity, Layers } from 'lucide-react';

const Heatmap = ({ gameId }) => {
    const { gameState, status, error } = use1xZone(gameId);
    const canvasRef = useRef(null);
    const [mode, setMode] = React.useState('live'); // 'live' or 'density'

    // Maintain a separate Ref for density history since it can be large and we don't want re-renders on every point for logic, just canvas
    const densityPointsRef = useRef([]);

    // Update density points when gameState changes
    useEffect(() => {
        if (gameState.ball) {
            densityPointsRef.current.push(gameState.ball);
            // Limit to ~2000 points to avoid performance issues
            if (densityPointsRef.current.length > 2000) densityPointsRef.current.shift();
        }
    }, [gameState.ball]);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // --- Draw High-Tech Pitch ---

            // 1. Dark Base
            const fieldGradient = ctx.createLinearGradient(0, 0, 0, height);
            fieldGradient.addColorStop(0, '#0a0a0a');
            fieldGradient.addColorStop(1, '#111111');
            ctx.fillStyle = fieldGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Tactical Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 40;

            ctx.beginPath();
            for (let x = 0; x <= width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (let y = 0; y <= height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();

            // 3. Field Lines - Glowing
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;

            // Border
            const padding = 20;
            ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

            // Center Line
            ctx.beginPath();
            ctx.moveTo(width / 2, padding);
            ctx.lineTo(width / 2, height - padding);
            ctx.stroke();

            // Center Circle
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
            ctx.stroke();

            // Penalty Areas
            const boxWidth = 80;
            const boxHeight = 160;

            // Left Box
            ctx.strokeRect(padding, (height - boxHeight) / 2, boxWidth, boxHeight);
            // Right Box
            ctx.strokeRect(width - padding - boxWidth, (height - boxHeight) / 2, boxWidth, boxHeight);

            ctx.shadowBlur = 0; // Reset shadow

            // Draw based on Mode
            if (mode === 'density') {
                // Density Heatmap
                densityPointsRef.current.forEach(pt => {
                    const px = pt.x * width;
                    const py = pt.y * height;

                    const gradient = ctx.createRadialGradient(px, py, 0, px, py, 20);
                    gradient.addColorStop(0, 'rgba(234, 53, 70, 0.1)');
                    gradient.addColorStop(1, 'rgba(234, 53, 70, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(px, py, 20, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Draw active ball on top
                if (gameState.ball) {
                    const { x, y } = gameState.ball;
                    const bx = x * width;
                    const by = y * height;

                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'white';
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(bx, by, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

            } else {
                // Live Tracker Mode (Original)

                // Draw Trail with fade
                if (gameState.history.length > 1) {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

                    for (let i = 1; i < gameState.history.length; i++) {
                        const p1 = gameState.history[i - 1];
                        const p2 = gameState.history[i];

                        const opacity = i / gameState.history.length;

                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 200, 50, ${opacity * 0.6})`;
                        ctx.lineWidth = 3 * opacity;
                        ctx.moveTo(p1.x * width, p1.y * height);
                        ctx.lineTo(p2.x * width, p2.y * height);
                        ctx.stroke();
                    }
                }

                // Draw Ball / Active Point
                if (gameState.ball) {
                    const { x, y } = gameState.ball;
                    const px = x * width;
                    const py = y * height;

                    // Color based on team (1=Red/Home, 2=Blue/Away)
                    let baseColor = '255, 255, 255';
                    if (gameState.team === 1) baseColor = '239, 68, 68'; // Red-500
                    if (gameState.team === 2) baseColor = '59, 130, 246'; // Blue-500

                    // 1. Outer Pulse
                    const pulse = (Date.now() % 1000) / 1000;
                    const radius = 10 + pulse * 10;
                    const alpha = 1 - pulse;

                    ctx.beginPath();
                    ctx.arc(px, py, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${baseColor}, ${alpha * 0.3})`;
                    ctx.fill();

                    // 2. Glow effect
                    const gradient = ctx.createRadialGradient(px, py, 2, px, py, 20);
                    gradient.addColorStop(0, `rgba(${baseColor}, 0.8)`);
                    gradient.addColorStop(1, `rgba(${baseColor}, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(px, py, 20, 0, Math.PI * 2);
                    ctx.fill();

                    // 3. Solid center
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgb(${baseColor})`;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(px, py, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Player Name Tag
                    if (gameState.lastPlayer) {
                        ctx.font = '600 12px Inter, sans-serif';
                        const textMetrics = ctx.measureText(gameState.lastPlayer);
                        const textWidth = textMetrics.width;
                        const boxPad = 8;
                        const boxHeight = 24;

                        // Tag Background with glass effect
                        ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 1;

                        const rx = px - textWidth / 2 - boxPad;
                        const ry = py - 40;
                        const rw = textWidth + boxPad * 2;

                        ctx.beginPath();
                        ctx.roundRect(rx, ry, rw, boxHeight, 6);
                        ctx.fill();
                        ctx.stroke();

                        // Connector line
                        ctx.beginPath();
                        ctx.moveTo(px, py - 16); // Top of outline glow
                        ctx.lineTo(px, ry + boxHeight);
                        ctx.strokeStyle = `rgba(${baseColor}, 0.5)`;
                        ctx.stroke();

                        // Text
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(gameState.lastPlayer, px, ry + boxHeight / 2);
                    }
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.font = '500 14px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("Waiting for match data downlink...", width / 2, height / 2);

                    // Loading spinner visual
                    const time = Date.now() / 1000;
                    ctx.beginPath();
                    ctx.arc(width / 2, height / 2 + 30, 10, time, time + Math.PI);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.stroke();
                }
            }
        }
    }, [gameState, status, error, mode]);

    return (
        <div className="heatmap-container p-6 bg-card-bg backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-display font-bold flex items-center gap-2">
                    <Activity className="text-accent" size={20} />
                    1xZone Live
                </h3>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => setMode('live')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${mode === 'live' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Live Tracker
                    </button>
                    <button
                        onClick={() => setMode('density')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${mode === 'density' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Heatmap
                    </button>
                </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-inner border border-white/10">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={400}
                    className="w-full h-auto bg-[#1a472a]"
                />

                {/* Status Indicator Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                        {status === 'connected' ? 'Live Data' : 'Connecting...'}
                    </span>
                </div>
            </div>

            {/* Live Play-by-Play Log */}
            <div className="mt-6">
                <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={14} />
                    Live Feed
                </h4>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {gameState.events.length === 0 ? (
                        <div className="text-zinc-600 text-xs italic py-2 text-center">Waiting for match events...</div>
                    ) : (
                        gameState.events.map((ev) => (
                            <div key={ev.id} className="text-sm flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <span className={ev.team === 1 ? 'text-red-400 font-medium' : ev.team === 2 ? 'text-blue-400 font-medium' : 'text-white font-medium'}>
                                    {ev.player}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono bg-black/20 px-2 py-1 rounded">{ev.time}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-600 font-mono text-center uppercase tracking-widest">
                Powered by 1xZone Technology
            </div>
        </div>
    );
};

export default Heatmap;

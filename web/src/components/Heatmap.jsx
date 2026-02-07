
import React, { useEffect, useRef } from 'react';
import { use1xZone } from '../hooks/use1xZone';

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

            // Draw Field (Simplified)
            ctx.fillStyle = '#2e7d32'; // Grass green
            ctx.fillRect(0, 0, width, height);

            // Lines
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, width - 20, height - 20); // Touchline

            // Center Line
            ctx.beginPath();
            ctx.moveTo(width / 2, 10);
            ctx.lineTo(width / 2, height - 10);
            ctx.stroke();

            // Draw Trail
            if (gameState.history.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.lineWidth = 3;
                // Move to first point
                ctx.moveTo(gameState.history[0].x * width, gameState.history[0].y * height);
                for (let i = 1; i < gameState.history.length; i++) {
                    const p = gameState.history[i];
                    ctx.lineTo(p.x * width, p.y * height);
                }
                ctx.stroke();
            }

            // Draw Ball / Active Point
            if (gameState.ball) {
                const { x, y } = gameState.ball;
                const px = x * width;
                const py = y * height;

                // Color based on team (1=Red, 2=Blue, 0=White)
                let color = 'white';
                if (gameState.team === 1) color = '#ef4444'; // Red-ish
                if (gameState.team === 2) color = '#3b82f6'; // Blue-ish

                // Glow effect
                const gradient = ctx.createRadialGradient(px, py, 2, px, py, 10);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, Math.PI * 2);
                ctx.fill();

                // Solid center
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();

                // Player Name Tag
                if (gameState.lastPlayer) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    const textWidth = ctx.measureText(gameState.lastPlayer).width;
                    ctx.fillRect(px - textWidth / 2 - 4, py - 25, textWidth + 8, 20);

                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(gameState.lastPlayer, px, py - 11);
                }
            } else {
                ctx.fillStyle = 'white';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText("Waiting for game action...", 20, 70);
            }
        }
    }, [gameState, status, error]);

    return (
        <div className="heatmap-container p-4 bg-gray-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-white text-lg">1xZone</h3>
                <div className="flex bg-gray-800 rounded p-1">
                    <button
                        onClick={() => setMode('live')}
                        className={`px-3 py-1 text-xs font-bold rounded ${mode === 'live' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Live Tracker
                    </button>
                    <button
                        onClick={() => setMode('density')}
                        className={`px-3 py-1 text-xs font-bold rounded ${mode === 'density' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Heatmap
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full h-auto border border-gray-700 rounded shadow-lg"
            />

            {/* Live Play-by-Play Log */}
            <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                <h4 className="text-gray-300 text-sm font-bold mb-2">Live Feed</h4>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {gameState.events.length === 0 ? (
                        <div className="text-gray-500 text-xs italic">Waiting for events...</div>
                    ) : (
                        gameState.events.map((ev) => (
                            <div key={ev.id} className="text-xs text-gray-300 flex justify-between border-b border-gray-700/50 pb-1 last:border-0">
                                <span className={ev.team === 1 ? 'text-red-400' : ev.team === 2 ? 'text-blue-400' : 'text-gray-300 font-bold'}>
                                    {ev.player}
                                </span>
                                <span className="opacity-50">{ev.time}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-2 text-xs text-gray-400 font-mono">
                Running SignalR connection to maxizone.win...
            </div>
        </div>
    );
};

export default Heatmap;

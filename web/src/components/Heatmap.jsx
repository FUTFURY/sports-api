
import React, { useEffect, useRef } from 'react';
import { use1xZone } from '../hooks/use1xZone';

const Heatmap = ({ gameId }) => {
    const { gameState, status, error } = use1xZone(gameId);
    const canvasRef = useRef(null);

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

            // Status Text
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText(`Status: ${status}`, 20, 30);
            if (error) ctx.fillText(`Error: ${error}`, 20, 50);

            // Visualize Data (POC)
            // Ideally we plot players/ball here using gameState
            // For now, let's just show if we have data
            if (gameState.raw) {
                ctx.fillText(`Data received! Check console.`, 20, 70);

                // Try to plot something if 'B' (Ball) exists in data?
                // This is speculative until we see the real data structure
            }
        }
    }, [gameState, status, error]);

    return (
        <div className="heatmap-container p-4 bg-gray-900 rounded-lg">
            <h3 className="text-white text-lg mb-2">1xZone Live Heatmap</h3>
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full h-auto border border-gray-700 rounded shadow-lg"
            />
            <div className="mt-2 text-xs text-gray-400 font-mono">
                Running SignalR connection to maxizone.win...
            </div>
        </div>
    );
};

export default Heatmap;

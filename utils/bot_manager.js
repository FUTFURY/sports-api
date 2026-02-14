
import { spawn } from 'child_process';
import path from 'path';

class BotManager {
    constructor() {
        this.runningBots = new Map(); // matchId -> { pid, process, startTime }
    }

    startBot(matchId) {
        if (this.runningBots.has(matchId)) {
            console.log(`🤖 Bot for match ${matchId} is already running.`);
            return { success: true, message: "Bot already running", pid: this.runningBots.get(matchId).pid };
        }

        console.log(`🚀 Spawning Bot for Match ${matchId}...`);

        // Fix: Les serveurs API run depuis /api, donc process.cwd() == .../api
        // On remonte d'un niveau puis on va dans scripts/
        const projectRoot = path.resolve(process.cwd(), '..');
        const scriptPath = path.join(projectRoot, 'scripts', 'engine_core.js');

        console.log(`📂 Bot script path: ${scriptPath}`);

        const botProcess = spawn('node', [scriptPath, matchId], {
            stdio: 'inherit', // Pipe output to main console for now
            detached: false   // Keep attached so we can kill it easily if server dies
        });

        const botInfo = {
            pid: botProcess.pid,
            process: botProcess,
            startTime: new Date()
        };

        this.runningBots.set(matchId, botInfo);

        botProcess.on('close', (code) => {
            console.log(`🤖 Bot for match ${matchId} exited with code ${code}`);
            this.runningBots.delete(matchId);
        });

        return { success: true, message: "Bot started", pid: botProcess.pid };
    }

    stopBot(matchId) {
        if (!this.runningBots.has(matchId)) {
            return { success: false, message: "Bot not found" };
        }

        const botInfo = this.runningBots.get(matchId);
        console.log(`🛑 Stopping Bot for Match ${matchId} (PID: ${botInfo.pid})...`);

        // Kill the process
        botInfo.process.kill('SIGINT'); // Try graceful first
        // process.kill(-botInfo.pid); // If detached group

        this.runningBots.delete(matchId);
        return { success: true, message: "Bot stopped" };
    }

    getStatus(matchId) {
        const isRunning = this.runningBots.has(matchId);
        return {
            matchId,
            isRunning,
            uptime: isRunning ? (new Date() - this.runningBots.get(matchId).startTime) / 1000 : 0
        };
    }

    getAllBots() {
        const bots = [];
        for (const [id, info] of this.runningBots) {
            bots.push({
                matchId: id,
                pid: info.pid,
                uptime: (new Date() - info.startTime) / 1000
            });
        }
        return bots;
    }
}

// Singleton instance
export const botManager = new BotManager();

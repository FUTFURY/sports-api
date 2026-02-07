
import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export const use1xZone = (gameId) => {
    const [connection, setConnection] = useState(null);
    const [gameState, setGameState] = useState({
        ball: null, // No position initially
        lastPlayer: "",
        team: 0,
        history: [], // For trails
        players: [],
        events: []
    });
    const [status, setStatus] = useState('disconnected');
    const [error, setError] = useState(null);

    // Hardcoded config based on reverse engineering
    const HUB_URL = "https://maxizone.win/playerzone";
    const METHOD_CONNECT = "ConnectClient";
    const EVENT_GAME_DATA = "gameData"; // Hidden as 'Ow' in original code

    useEffect(() => {
        if (!gameId) return;

        const newConnection = new HubConnectionBuilder()
            .withUrl(HUB_URL)
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [gameId]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('SignalR Connected!');
                    setStatus('connected');

                    // Invoke ConnectClient to subscribe to the game
                    // derived from 'Dw' in original code
                    // Arguments: { gameid: ..., sport: 1, lng: "fr", ver: 2 } (guessing ver=2 based on URL v2)
                    connection.invoke(METHOD_CONNECT, {
                        gameid: parseInt(gameId),
                        sport: 1, // Defaulting to football (1)
                        lng: "fr",
                        ver: 2
                    }).catch(err => console.error('Invoke Error:', err));

                    // Listen for game updates
                    connection.on(EVENT_GAME_DATA, (data) => {
                        // console.log('Game Data received:', data);

                        setGameState(prevState => {
                            const newState = { ...prevState, raw: data };

                            // Parse XY coordinates (e.g., "0.95,0.5")
                            if (data.XY) {
                                const parts = data.XY.split(',');
                                if (parts.length === 2) {
                                    // 1xBet usually normalizes 0..1
                                    const x = parseFloat(parts[0]);
                                    const y = parseFloat(parts[1]);

                                    if (!isNaN(x) && !isNaN(y)) {
                                        newState.ball = { x, y };

                                        // Add to history (limit to last 20 points)
                                        const newHistory = [...prevState.history, { x, y }];
                                        if (newHistory.length > 20) newHistory.shift();
                                        newState.history = newHistory;
                                    }
                                }
                            }

                            // Parse Active Player
                            if (data.PG) {
                                newState.lastPlayer = data.PG;
                            }

                            // Parse Team/Event Code (VC)
                            // "1xxxx" -> Team 1?, "2xxxx" -> Team 2?
                            if (data.VC) {
                                const codeStr = String(data.VC);
                                if (codeStr.startsWith('1')) newState.team = 1;
                                if (codeStr.startsWith('2')) newState.team = 2;
                            }

                            return newState;
                        });
                    });
                })
                .catch(e => {
                    console.error('Connection failed: ', e);
                    setStatus('error');
                    setError(e.message);
                });

            return () => {
                connection.stop();
            };
        }
    }, [connection, gameId]);

    return { gameState, status, error };
};

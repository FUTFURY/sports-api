
import { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export const use1xZone = (gameId) => {
    const [connection, setConnection] = useState(null);
    const [gameState, setGameState] = useState({
        ball: { x: 50, y: 50 }, // Center by default
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
                        console.log('Game Data received:', data);
                        // Data parsing logic (to be refined based on actual payload structure)
                        // Assuming data contains coordinates. 
                        // If it's the raw binary-like JSON we saw earlier, we might need parsing.
                        // But let's dump it first.

                        setGameState(prevState => {
                            // POC: Just store raw data for inspection first, 
                            // or try to map if it looks like { x: ..., y: ... }
                            return { ...prevState, raw: data };
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

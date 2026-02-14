#!/bin/bash

# Kill old processes
echo "🛑 Killing old processes..."
pkill -f "node" 2>/dev/null
pkill -f "next" 2>/dev/null

# Start Backend API (Organized Scores & Trading)
echo "🚀 Starting Backend API (Port 3001)..."
node api/server.js > /tmp/api-server.log 2>&1 &
API_PID=$!
echo "✅ Backend API PID: $API_PID"

# Start Trading Service (Order Book Engine)
echo "🚀 Starting Trading Service (Port 3002)..."
(cd services/trading-service && npm start) > /tmp/trading-service.log 2>&1 &
TRADING_PID=$!
echo "✅ Trading Service PID: $TRADING_PID"

# Start Bot Manager (Market Making)
echo "🚀 Starting Bot Manager..."
(cd services/bot-service && npm start) > /tmp/bot-service.log 2>&1 &
BOT_PID=$!
echo "✅ Bot Manager PID: $BOT_PID"

# Start Frontend (Next.js)
echo "🚀 Starting Frontend (Port 3000)..."
(cd frontend && npm run dev) > /tmp/frontend.log 2>&1 &
FRONT_PID=$!
echo "✅ Frontend PID: $FRONT_PID"

echo "----------------------------------------"
echo "🎉 ALL SERVICES STARTED!"
echo "----------------------------------------"
echo "🌐 Frontend: http://localhost:3000"
echo "📊 Logs available in /tmp/*.log"
echo "----------------------------------------"

# Wait for finish
wait


#!/bin/bash
# Start the local backend server for iOS Simulator development
# Run this from: /Users/melvinalgane/Desktop/sportapp/TennisBackend
echo "🚀 Starting local backend on http://localhost:4000"
echo "   The iOS Simulator will automatically use this URL."
echo "   Leave this terminal window open while developing."
echo ""
npx vercel dev --listen 4000 --yes

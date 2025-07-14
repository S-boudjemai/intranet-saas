#!/bin/bash

echo "🛑 Arrêt des serveurs..."

# Lire les PIDs sauvegardés
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend arrêté (PID: $BACKEND_PID)"
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend arrêté (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# Nettoyer tous les processus restants
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

echo "🧹 Nettoyage terminé"
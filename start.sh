#!/bin/bash

echo "🧹 Nettoyage des anciens processus..."

# Arrêter tous les processus nest/node qui pourraient bloquer le port 3000
pkill -f "nest start" 2>/dev/null || true
pkill -f "backend.*main" 2>/dev/null || true

# Forcer l'arrêt des processus sur le port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Attendre un peu
sleep 2

echo "🚀 Démarrage du backend..."
cd backend && npm run start:dev &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 5

echo "🎨 Démarrage du frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Backend démarré (PID: $BACKEND_PID) sur http://localhost:3000"
echo "✅ Frontend démarré (PID: $FRONTEND_PID) sur http://localhost:5174"
echo ""
echo "Pour arrêter les serveurs, utilisez: kill $BACKEND_PID $FRONTEND_PID"
echo "Ou utilisez: ./stop.sh"

# Sauvegarder les PIDs pour pouvoir les arrêter plus tard
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

wait
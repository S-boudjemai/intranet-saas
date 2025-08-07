#!/bin/bash

# Script pour désactiver les logs verbeux en développement

echo "🔇 Désactivation des logs verbeux..."

# IMPORTANT: Garder les logs de démarrage dans main.ts
echo "⚠️  Conservation des logs de démarrage (main.ts)..."

# Remplacer tous les logger.log par des commentaires SAUF dans main.ts
find src -name "*.ts" -type f ! -name "main.ts" -exec sed -i 's/^\(\s*\)this\.logger\.log(/\1\/\/ this.logger.log(/g' {} +
find src -name "*.ts" -type f ! -name "main.ts" -exec sed -i 's/^\(\s*\)logger\.log(/\1\/\/ logger.log(/g' {} +

# Garder les logger.error actifs
find src -name "*.ts" -type f -exec sed -i 's/^\(\s*\)\/\/ this\.logger\.error(/\1this.logger.error(/g' {} +
find src -name "*.ts" -type f -exec sed -i 's/^\(\s*\)\/\/ logger\.error(/\1logger.error(/g' {} +

# Garder les logger.warn actifs
find src -name "*.ts" -type f -exec sed -i 's/^\(\s*\)\/\/ this\.logger\.warn(/\1this.logger.warn(/g' {} +
find src -name "*.ts" -type f -exec sed -i 's/^\(\s*\)\/\/ logger\.warn(/\1logger.warn(/g' {} +

echo "✅ Logs verbeux désactivés!"
echo "ℹ️  Conservés: logger.error, logger.warn et logs de démarrage (main.ts)"
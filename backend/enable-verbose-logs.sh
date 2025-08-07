#!/bin/bash

# Script pour réactiver les logs verbeux en développement

echo "🔊 Réactivation des logs verbeux..."

# Réactiver TypeORM logging
sed -i 's/logging: false, \/\/ Désactivé pour éviter le spam/logging: true,/g' src/app.module.ts
sed -i 's/logging: false, \/\/ Désactivé pour éviter le spam en dev/logging: true, \/\/ Activer les logs pour debug/g' src/app.module.ts
sed -i 's/logging: false, \/\/ Désactivé pour éviter le spam/logging: true,/g' src/data-source.ts

# Réactiver tous les logger.log commentés
find src -name "*.ts" -type f -exec sed -i 's/^\(\s*\)\/\/ this\.logger\.log(/\1this.logger.log(/g' {} +
find src -name "*.ts" -type f -exec sed -i 's/^\(\s*\)\/\/ logger\.log(/\1logger.log(/g' {} +

echo "✅ Logs verbeux réactivés!"
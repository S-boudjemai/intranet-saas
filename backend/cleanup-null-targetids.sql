-- Script de nettoyage des target_id NULL dans notifications
-- Exécuté le 2025-07-24 pour corriger l'erreur backend

-- 1. Identifier les notifications avec target_id NULL
SELECT id, user_id, tenant_id, type, target_id, message, created_at 
FROM notifications 
WHERE target_id IS NULL 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Supprimer toutes les notifications avec target_id NULL
DELETE FROM notifications WHERE target_id IS NULL;

-- 3. Vérifier qu'il n'y a plus de NULL
SELECT COUNT(*) as "Notifications avec target_id NULL" 
FROM notifications 
WHERE target_id IS NULL;

-- 4. Afficher le nombre total de notifications restantes
SELECT COUNT(*) as "Total notifications" 
FROM notifications;
EOF < /dev/null

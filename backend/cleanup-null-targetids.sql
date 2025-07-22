-- Script de nettoyage des target_id NULL dans notifications
-- À exécuter sur la base de développement

-- 1. Afficher le nombre de notifications avec target_id NULL
SELECT COUNT(*) as null_count FROM notifications WHERE target_id IS NULL;

-- 2. Supprimer les notifications avec target_id NULL
DELETE FROM notifications WHERE target_id IS NULL;

-- 3. Vérifier qu'il n'y a plus de NULL
SELECT COUNT(*) as null_count_after FROM notifications WHERE target_id IS NULL;
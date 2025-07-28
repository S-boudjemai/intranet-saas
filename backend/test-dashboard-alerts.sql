-- Script SQL pour tester rapidement les alertes du dashboard
-- À exécuter directement dans PostgreSQL

-- 1. Créer un ticket non traité vieux de 5 jours (remplacer tenant_id et restaurant_id selon vos données)
INSERT INTO tickets (tenant_id, title, description, status, created_at, restaurant_id, category_id)
VALUES (
  '1', -- Votre tenant_id
  'TEST ALERTE - Problème frigo urgent',
  'Test pour dashboard - Température frigo anormale',
  'non_traitee',
  NOW() - INTERVAL '5 days',
  1, -- Votre restaurant_id
  1  -- Votre category_id
);

-- 2. Créer une action corrective en retard
INSERT INTO corrective_actions (action_description, assigned_to, due_date, status, created_at)
VALUES (
  'TEST ALERTE - Nettoyer les filtres de hotte',
  1, -- ID d'un utilisateur existant
  NOW() - INTERVAL '2 days', -- Échéance dépassée
  'in_progress',
  NOW() - INTERVAL '7 days'
);

-- 3. Pour tester les restaurants sans audit récent :
-- Option A : Modifier la date d'un audit existant
UPDATE audit_executions 
SET scheduled_date = NOW() - INTERVAL '45 days'
WHERE id = (SELECT id FROM audit_executions ORDER BY id DESC LIMIT 1);

-- Option B : Ou supprimer temporairement les audits récents d'un restaurant
-- DELETE FROM audit_executions WHERE restaurant_id = 1 AND scheduled_date > NOW() - INTERVAL '30 days';

-- Pour nettoyer après les tests :
-- DELETE FROM tickets WHERE title LIKE 'TEST ALERTE%';
-- DELETE FROM corrective_actions WHERE action_description LIKE 'TEST ALERTE%';
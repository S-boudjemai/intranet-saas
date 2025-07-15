-- Script SQL direct pour supprimer tous les audits non archivés
-- À exécuter dans PostgreSQL

-- 1. Voir d'abord ce qui serait supprimé (preview)
SELECT 
    'APERÇU DU NETTOYAGE' as info,
    (SELECT COUNT(*) FROM audit_executions) as total_audits_en_base,
    (SELECT COUNT(*) FROM audit_archives) as total_audits_archives,
    (SELECT COUNT(*) FROM audit_executions 
     WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)) as audits_a_supprimer;

-- 2. Compter les données liées qui seraient supprimées
SELECT 
    'DONNÉES LIÉES À SUPPRIMER' as info,
    (SELECT COUNT(*) FROM audit_responses ar
     WHERE ar.execution_id IN (
         SELECT id FROM audit_executions 
         WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
     )) as responses_a_supprimer,
    (SELECT COUNT(*) FROM non_conformities nc
     WHERE nc.execution_id IN (
         SELECT id FROM audit_executions 
         WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
     )) as non_conformities_a_supprimer,
    (SELECT COUNT(*) FROM corrective_actions ca
     WHERE ca.non_conformity_id IN (
         SELECT nc.id FROM non_conformities nc
         WHERE nc.execution_id IN (
             SELECT id FROM audit_executions 
             WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
         )
     )) as corrective_actions_a_supprimer;

-- 3. SUPPRESSION RÉELLE (décommenter pour exécuter)
-- ATTENTION: Ces commandes sont IRRÉVERSIBLES!

-- 3a. Supprimer les actions correctives liées
-- DELETE FROM corrective_actions 
-- WHERE non_conformity_id IN (
--     SELECT nc.id FROM non_conformities nc
--     WHERE nc.execution_id IN (
--         SELECT id FROM audit_executions 
--         WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
--     )
-- );

-- 3b. Supprimer les non-conformités
-- DELETE FROM non_conformities 
-- WHERE execution_id IN (
--     SELECT id FROM audit_executions 
--     WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
-- );

-- 3c. Supprimer les réponses d'audit
-- DELETE FROM audit_responses 
-- WHERE execution_id IN (
--     SELECT id FROM audit_executions 
--     WHERE id NOT IN (SELECT original_execution_id FROM audit_archives)
-- );

-- 3d. Supprimer les audits eux-mêmes
-- DELETE FROM audit_executions 
-- WHERE id NOT IN (SELECT original_execution_id FROM audit_archives);

-- 4. Vérification après suppression
-- SELECT 
--     'APRÈS NETTOYAGE' as info,
--     (SELECT COUNT(*) FROM audit_executions) as audits_restants,
--     (SELECT COUNT(*) FROM audit_archives) as archives_conservées,
--     (SELECT COUNT(*) FROM audit_responses) as responses_restantes,
--     (SELECT COUNT(*) FROM non_conformities) as nc_restantes,
--     (SELECT COUNT(*) FROM corrective_actions) as ca_restantes;
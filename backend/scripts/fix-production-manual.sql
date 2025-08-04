-- Script de correction manuelle pour la production
-- À exécuter directement dans PostgreSQL si la migration échoue

-- 1. Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ajouter la colonne name à users si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE users ADD COLUMN name character varying DEFAULT NULL;
    END IF;
END $$;

-- 3. Vérifier le type de la colonne id dans audit_templates
DO $$ 
DECLARE
    id_type text;
BEGIN
    -- Récupérer le type de la colonne id
    SELECT data_type INTO id_type
    FROM information_schema.columns 
    WHERE table_name = 'audit_templates' AND column_name = 'id';
    
    -- Si la table audit_template_items n'existe pas, la créer
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'audit_template_items') THEN
        
        IF id_type = 'integer' THEN
            -- Créer avec template_id INTEGER
            CREATE TABLE audit_template_items (
                id SERIAL PRIMARY KEY,
                template_id integer NOT NULL,
                question text NOT NULL,
                category varchar(100) NOT NULL,
                response_type varchar(20) NOT NULL DEFAULT 'boolean',
                "order" integer NOT NULL DEFAULT 0,
                is_required boolean NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT FK_audit_template_items_template 
                    FOREIGN KEY (template_id) 
                    REFERENCES audit_templates(id) 
                    ON DELETE CASCADE
            );
        ELSE
            -- Créer avec template_id UUID
            CREATE TABLE audit_template_items (
                id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
                template_id uuid NOT NULL,
                question text NOT NULL,
                category varchar(100) NOT NULL,
                response_type varchar(20) NOT NULL DEFAULT 'boolean',
                "order" integer NOT NULL DEFAULT 0,
                is_required boolean NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT FK_audit_template_items_template 
                    FOREIGN KEY (template_id) 
                    REFERENCES audit_templates(id) 
                    ON DELETE CASCADE
            );
        END IF;
        
        -- Créer l'index dans tous les cas
        CREATE INDEX IDX_audit_template_items_template 
        ON audit_template_items (template_id);
    END IF;
END $$;

-- 4. Afficher le résultat pour vérification
SELECT 
    'users.name exists' as check_item,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_name='users' AND column_name='name') as result
UNION ALL
SELECT 
    'audit_template_items exists',
    EXISTS (SELECT 1 FROM information_schema.tables 
            WHERE table_name='audit_template_items')
UNION ALL
SELECT 
    'audit_templates.id type',
    data_type
FROM information_schema.columns 
WHERE table_name = 'audit_templates' AND column_name = 'id';
-- Phase 0 — Migration one-shot : nouveaux champs sur card_instances
-- À exécuter UNE FOIS : npx wrangler d1 execute idolbias-db --file=scripts/migration_phase0.sql --remote

ALTER TABLE card_instances ADD COLUMN gk_stats TEXT;
ALTER TABLE card_instances ADD COLUMN set_piece_stats TEXT;
ALTER TABLE card_instances ADD COLUMN position12 TEXT NOT NULL DEFAULT 'ST';
ALTER TABLE card_instances ADD COLUMN role TEXT;
ALTER TABLE card_instances ADD COLUMN character_id TEXT;

-- Remplir character_id depuis card_prints
UPDATE card_instances
SET character_id = (
  SELECT cp.character_id FROM card_prints cp WHERE cp.id = card_instances.print_id
);

-- Migrer les GK : reverse-map tecStats → gkStats (tec_stats reste NOT NULL, on garde l'ancienne valeur)
UPDATE card_instances
SET
  gk_stats = json_object(
    'reflexes', json_extract(tec_stats, '$.passe'),
    'handling', json_extract(tec_stats, '$.tir'),
    'aerialReach', json_extract(tec_stats, '$.dribble'),
    'commandArea', json_extract(tec_stats, '$.centre'),
    'kicking', json_extract(tec_stats, '$.tacle'),
    'rushingOut', json_extract(tec_stats, '$.controle')
  ),
  position12 = 'GK'
WHERE character_id = 'esperanza-galvan';

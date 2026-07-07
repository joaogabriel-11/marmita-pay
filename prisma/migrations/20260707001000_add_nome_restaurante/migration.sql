ALTER TABLE "configuracao_restaurante"
ADD COLUMN IF NOT EXISTS "nomeRestaurante" TEXT NOT NULL DEFAULT 'Marmita Pay';

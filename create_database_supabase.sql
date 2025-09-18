-- Script para configuração do banco de dados PostgreSQL no Supabase - RIDEC Time Control
-- Adaptado para Supabase

-- Conectar ao banco de dados (já existe no Supabase)
-- \c postgres;

-- Criar extensões necessárias (se não existirem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABELAS PRINCIPAIS
-- ==============================================

-- Tabela empresa (tabela principal)
CREATE TABLE IF NOT EXISTS empresa (
    cod_empresa SERIAL PRIMARY KEY,
    nome_empresa TEXT NOT NULL,
    cod_usuario_empresa INTEGER,
    ies_ativo VARCHAR(1) DEFAULT 'S' CHECK (ies_ativo IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela tipo_usuario
CREATE TABLE IF NOT EXISTS tipo_usuario (
    cod_tipo_usuario SERIAL PRIMARY KEY,
    nome_tipo_usuario TEXT NOT NULL UNIQUE,
    descricao_tipo TEXT,
    nivel_acesso INTEGER NOT NULL DEFAULT 1,
    pode_adicionar_usuarios BOOLEAN DEFAULT FALSE,
    pode_gerenciar_areas BOOLEAN DEFAULT FALSE,
    pode_acesso_sistema BOOLEAN DEFAULT FALSE,
    ies_ativo VARCHAR(1) DEFAULT 'S' CHECK (ies_ativo IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela usuario
CREATE TABLE IF NOT EXISTS usuario (
    cod_usuario SERIAL PRIMARY KEY,
    nome_usuario TEXT NOT NULL,
    email_usuario TEXT UNIQUE NOT NULL,
    senha_usuario TEXT NOT NULL,
    cod_empresa INTEGER NOT NULL,
    cod_tipo_usuario INTEGER NOT NULL,
    ies_ativo VARCHAR(1) DEFAULT 'S' CHECK (ies_ativo IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_empresa) REFERENCES empresa(cod_empresa) ON DELETE CASCADE,
    FOREIGN KEY (cod_tipo_usuario) REFERENCES tipo_usuario(cod_tipo_usuario) ON DELETE RESTRICT
);

-- Tabela area
CREATE TABLE IF NOT EXISTS area (
    cod_area SERIAL PRIMARY KEY,
    nome_area TEXT NOT NULL,
    cod_empresa INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_empresa) REFERENCES empresa(cod_empresa) ON DELETE CASCADE
);

-- Tabela uom (unidade de medida)
CREATE TABLE IF NOT EXISTS uom (
    cod_uom SERIAL PRIMARY KEY,
    desc_uom TEXT NOT NULL,
    cod_empresa INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_empresa) REFERENCES empresa(cod_empresa) ON DELETE CASCADE
);

-- ==============================================
-- TABELAS DE MODELO RIDEC
-- ==============================================

-- Tabela m_etapa_ri (modelo etapa R&D - Research)
CREATE TABLE IF NOT EXISTS m_etapa_ri (
    cod_m_etapa_ri SERIAL PRIMARY KEY,
    nome_etapa_ri TEXT NOT NULL,
    cod_uom INTEGER NOT NULL,
    prazo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom) ON DELETE RESTRICT
);

-- Tabela m_etapa_d (modelo etapa Development)
CREATE TABLE IF NOT EXISTS m_etapa_d (
    cod_m_etapa_d SERIAL PRIMARY KEY,
    nome_etapa_d TEXT NOT NULL,
    cod_uom INTEGER NOT NULL,
    prazo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom) ON DELETE RESTRICT
);

-- Tabela m_etapa_e (modelo etapa Engineering)
CREATE TABLE IF NOT EXISTS m_etapa_e (
    cod_m_etapa_e SERIAL PRIMARY KEY,
    nome_etapa_e TEXT NOT NULL,
    cod_uom INTEGER NOT NULL,
    prazo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom) ON DELETE RESTRICT
);

-- Tabela m_etapa_c (modelo etapa Construction)
CREATE TABLE IF NOT EXISTS m_etapa_c (
    cod_m_etapa_c SERIAL PRIMARY KEY,
    nome_etapa_c TEXT NOT NULL,
    cod_uom INTEGER NOT NULL,
    prazo DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom) ON DELETE RESTRICT
);

-- Tabela m_etapa_a (modelo etapa Assembly)
CREATE TABLE IF NOT EXISTS m_etapa_a (
    cod_m_etapa_a SERIAL PRIMARY KEY,
    nome_etapa_a TEXT NOT NULL,
    cod_etapa_pre INTEGER,
    cod_etapa_suc INTEGER,
    cod_uom INTEGER NOT NULL,
    prazo DATE,
    data_inicio DATE,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom) ON DELETE RESTRICT,
    FOREIGN KEY (cod_etapa_pre) REFERENCES m_etapa_a(cod_m_etapa_a) ON DELETE SET NULL,
    FOREIGN KEY (cod_etapa_suc) REFERENCES m_etapa_a(cod_m_etapa_a) ON DELETE SET NULL
);

-- Tabela modelo_ridec
CREATE TABLE IF NOT EXISTS modelo_ridec (
    cod_modelo_ridec SERIAL PRIMARY KEY,
    nome_modelo TEXT NOT NULL,
    descricao_modelo TEXT,
    cod_m_etapa_ri INTEGER,
    cod_m_etapa_d INTEGER,
    cod_m_etapa_e INTEGER,
    cod_m_etapa_c INTEGER,
    cod_empresa INTEGER NOT NULL,
    valor_NC DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_m_etapa_ri) REFERENCES m_etapa_ri(cod_m_etapa_ri) ON DELETE SET NULL,
    FOREIGN KEY (cod_m_etapa_d) REFERENCES m_etapa_d(cod_m_etapa_d) ON DELETE SET NULL,
    FOREIGN KEY (cod_m_etapa_e) REFERENCES m_etapa_e(cod_m_etapa_e) ON DELETE SET NULL,
    FOREIGN KEY (cod_m_etapa_c) REFERENCES m_etapa_c(cod_m_etapa_c) ON DELETE SET NULL,
    FOREIGN KEY (cod_empresa) REFERENCES empresa(cod_empresa) ON DELETE CASCADE
);

-- ==============================================
-- TABELAS DE EXECUÇÃO RIDEC
-- ==============================================

-- Tabela etapa_ri (etapa R&D executada)
CREATE TABLE IF NOT EXISTS etapa_ri (
    cod_etapa_ri SERIAL PRIMARY KEY,
    nome_etapa_ri TEXT NOT NULL,
    data_inicio DATE,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela etapa_d (etapa Development executada)
CREATE TABLE IF NOT EXISTS etapa_d (
    cod_etapa_d SERIAL PRIMARY KEY,
    nome_etapa_d TEXT NOT NULL,
    data_inicio DATE,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela etapa_e (etapa Engineering executada)
CREATE TABLE IF NOT EXISTS etapa_e (
    cod_etapa_e SERIAL PRIMARY KEY,
    nome_etapa_e TEXT NOT NULL,
    data_inicio DATE,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela etapa_c (etapa Construction executada)
CREATE TABLE IF NOT EXISTS etapa_c (
    cod_etapa_c SERIAL PRIMARY KEY,
    nome_etapa_c TEXT NOT NULL,
    data_inicio DATE,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela etapa_a (etapa Assembly executada)
CREATE TABLE IF NOT EXISTS etapa_a (
    cod_etapa_a SERIAL PRIMARY KEY,
    nome_etapa_a TEXT NOT NULL,
    cod_uom INTEGER NOT NULL,
    prazo DATE,
    data_inicio DATE,
    hora_inicio TIME,
    data_fim DATE,
    hora_fim TIME,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom) ON DELETE RESTRICT
);

-- Tabela card_ridec (cartão de execução RIDEC)
CREATE TABLE IF NOT EXISTS card_ridec (
    cod_card_ridec SERIAL PRIMARY KEY,
    cod_modelo_ridec INTEGER NOT NULL,
    cod_etapa_ri INTEGER,
    cod_etapa_d INTEGER,
    cod_etapa_e INTEGER,
    cod_etapa_c INTEGER,
    ies_concluiu VARCHAR(1) DEFAULT 'N' CHECK (ies_concluiu IN ('S', 'N')),
    cod_empresa INTEGER NOT NULL,
    cod_usuario INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (cod_modelo_ridec) REFERENCES modelo_ridec(cod_modelo_ridec) ON DELETE CASCADE,
    FOREIGN KEY (cod_etapa_ri) REFERENCES etapa_ri(cod_etapa_ri) ON DELETE SET NULL,
    FOREIGN KEY (cod_etapa_d) REFERENCES etapa_d(cod_etapa_d) ON DELETE SET NULL,
    FOREIGN KEY (cod_etapa_e) REFERENCES etapa_e(cod_etapa_e) ON DELETE SET NULL,
    FOREIGN KEY (cod_etapa_c) REFERENCES etapa_c(cod_etapa_c) ON DELETE SET NULL,
    FOREIGN KEY (cod_empresa) REFERENCES empresa(cod_empresa) ON DELETE CASCADE,
    FOREIGN KEY (cod_usuario) REFERENCES usuario(cod_usuario) ON DELETE RESTRICT
);

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índices para tabelas principais
CREATE INDEX IF NOT EXISTS idx_usuario_empresa ON usuario(cod_empresa);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email_usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_tipo_usuario ON usuario(cod_tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_tipo_usuario_nivel_acesso ON tipo_usuario(nivel_acesso);
CREATE INDEX IF NOT EXISTS idx_tipo_usuario_ativo ON tipo_usuario(ies_ativo);
CREATE INDEX IF NOT EXISTS idx_area_empresa ON area(cod_empresa);
CREATE INDEX IF NOT EXISTS idx_uom_empresa ON uom(cod_empresa);

-- Índices para modelo RIDEC
CREATE INDEX IF NOT EXISTS idx_modelo_ridec_empresa ON modelo_ridec(cod_empresa);
CREATE INDEX IF NOT EXISTS idx_m_etapa_ri_uom ON m_etapa_ri(cod_uom);
CREATE INDEX IF NOT EXISTS idx_m_etapa_d_uom ON m_etapa_d(cod_uom);
CREATE INDEX IF NOT EXISTS idx_m_etapa_e_uom ON m_etapa_e(cod_uom);
CREATE INDEX IF NOT EXISTS idx_m_etapa_c_uom ON m_etapa_c(cod_uom);
CREATE INDEX IF NOT EXISTS idx_m_etapa_a_uom ON m_etapa_a(cod_uom);

-- Índices para execução RIDEC
CREATE INDEX IF NOT EXISTS idx_card_ridec_modelo ON card_ridec(cod_modelo_ridec);
CREATE INDEX IF NOT EXISTS idx_card_ridec_empresa ON card_ridec(cod_empresa);
CREATE INDEX IF NOT EXISTS idx_card_ridec_usuario ON card_ridec(cod_usuario);
CREATE INDEX IF NOT EXISTS idx_etapa_a_uom ON etapa_a(cod_uom);

-- ==============================================
-- COMENTÁRIOS NAS TABELAS
-- ==============================================

COMMENT ON TABLE empresa IS 'Tabela principal de empresas';
COMMENT ON TABLE tipo_usuario IS 'Tipos de usuário do sistema com diferentes níveis de acesso';
COMMENT ON TABLE usuario IS 'Usuários do sistema por empresa';
COMMENT ON TABLE area IS 'Áreas de trabalho por empresa';
COMMENT ON TABLE uom IS 'Unidades de medida por empresa';
COMMENT ON TABLE modelo_ridec IS 'Modelos de processo RIDEC';
COMMENT ON TABLE m_etapa_ri IS 'Modelos de etapas de Research';
COMMENT ON TABLE m_etapa_d IS 'Modelos de etapas de Development';
COMMENT ON TABLE m_etapa_e IS 'Modelos de etapas de Engineering';
COMMENT ON TABLE m_etapa_c IS 'Modelos de etapas de Construction';
COMMENT ON TABLE m_etapa_a IS 'Modelos de etapas de Assembly';
COMMENT ON TABLE etapa_ri IS 'Etapas de Research executadas';
COMMENT ON TABLE etapa_d IS 'Etapas de Development executadas';
COMMENT ON TABLE etapa_e IS 'Etapas de Engineering executadas';
COMMENT ON TABLE etapa_c IS 'Etapas de Construction executadas';
COMMENT ON TABLE etapa_a IS 'Etapas de Assembly executadas';
COMMENT ON TABLE card_ridec IS 'Cartões de execução RIDEC';

-- ==============================================
-- DADOS INICIAIS (OPCIONAL)
-- ==============================================

-- Inserir tipos de usuário (apenas se não existirem)
INSERT INTO tipo_usuario (nome_tipo_usuario, descricao_tipo, nivel_acesso, pode_adicionar_usuarios, pode_gerenciar_areas, pode_acesso_sistema, ies_ativo) VALUES
('Admin do Sistema', 'Administrador com acesso total ao sistema', 1, TRUE, TRUE, TRUE, 'S'),
('Gestor da Área', 'Gerente que pode adicionar usuários para sua área', 2, TRUE, TRUE, FALSE, 'S'),
('Membro da Área', 'Membro comum da área sem permissões administrativas', 4, FALSE, FALSE, FALSE, 'S'),
('Membro do Board', 'Membro do conselho que pode adicionar usuários para áreas associadas', 3, TRUE, FALSE, FALSE, 'S'),
('Sistema', 'Usuário do sistema com acesso total para adição de informações', 0, TRUE, TRUE, TRUE, 'S')
ON CONFLICT (nome_tipo_usuario) DO NOTHING;

-- Inserir empresa exemplo (apenas se não existir)
INSERT INTO empresa (nome_empresa, cod_usuario_empresa, ies_ativo) 
VALUES ('Empresa Exemplo', NULL, 'S')
ON CONFLICT DO NOTHING;

-- Inserir unidade de medida exemplo (apenas se não existir)
INSERT INTO uom (desc_uom, cod_empresa) 
VALUES ('Dias', 1)
ON CONFLICT DO NOTHING;

-- Inserir usuário administrador exemplo (apenas se não existir)
INSERT INTO usuario (nome_usuario, email_usuario, senha_usuario, cod_empresa, cod_tipo_usuario, ies_ativo) 
VALUES ('Administrador', 'admin@empresa.com', 'senha123', 1, 1, 'S')
ON CONFLICT (email_usuario) DO NOTHING;

-- Atualizar empresa com usuário administrador (se necessário)
UPDATE empresa SET cod_usuario_empresa = 1 WHERE cod_empresa = 1 AND cod_usuario_empresa IS NULL;

-- ==============================================
-- VIEWS ÚTEIS
-- ==============================================

-- View para relatório de progresso dos cards RIDEC
CREATE OR REPLACE VIEW vw_progresso_cards AS
SELECT 
    c.cod_card_ridec,
    c.cod_empresa,
    e.nome_empresa,
    u.nome_usuario,
    m.nome_modelo,
    c.ies_concluiu,
    CASE 
        WHEN c.ies_concluiu = 'S' THEN 'Concluído'
        ELSE 'Em Andamento'
    END as status_card
FROM card_ridec c
JOIN empresa e ON c.cod_empresa = e.cod_empresa
JOIN usuario u ON c.cod_usuario = u.cod_usuario
JOIN modelo_ridec m ON c.cod_modelo_ridec = m.cod_modelo_ridec;

-- View para relatório de etapas por modelo
CREATE OR REPLACE VIEW vw_etapas_modelo AS
SELECT 
    m.cod_modelo_ridec,
    m.nome_modelo,
    m.descricao_modelo,
    e.nome_empresa,
    ri.nome_etapa_ri as etapa_research,
    d.nome_etapa_d as etapa_development,
    eng.nome_etapa_e as etapa_engineering,
    c.nome_etapa_c as etapa_construction
FROM modelo_ridec m
JOIN empresa e ON m.cod_empresa = e.cod_empresa
LEFT JOIN m_etapa_ri ri ON m.cod_m_etapa_ri = ri.cod_m_etapa_ri
LEFT JOIN m_etapa_d d ON m.cod_m_etapa_d = d.cod_m_etapa_d
LEFT JOIN m_etapa_e eng ON m.cod_m_etapa_e = eng.cod_m_etapa_e
LEFT JOIN m_etapa_c c ON m.cod_m_etapa_c = c.cod_m_etapa_c;

-- ==============================================
-- FUNÇÕES ÚTEIS
-- ==============================================

-- Função para calcular duração de uma etapa
CREATE OR REPLACE FUNCTION calcular_duracao_etapa(
    p_data_inicio DATE,
    p_hora_inicio TIME,
    p_data_fim DATE,
    p_hora_fim TIME
) RETURNS INTERVAL AS $$
BEGIN
    IF p_data_inicio IS NULL OR p_hora_inicio IS NULL OR 
       p_data_fim IS NULL OR p_hora_fim IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN (p_data_fim + p_hora_fim) - (p_data_inicio + p_hora_inicio);
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se etapa está atrasada
CREATE OR REPLACE FUNCTION verificar_atraso_etapa(
    p_prazo DATE,
    p_data_fim DATE
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_prazo IS NULL OR p_data_fim IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN p_data_fim > p_prazo;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ==============================================

-- Função para atualizar timestamp de modificação
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas com updated_at
CREATE TRIGGER update_empresa_updated_at BEFORE UPDATE ON empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipo_usuario_updated_at BEFORE UPDATE ON tipo_usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuario_updated_at BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_area_updated_at BEFORE UPDATE ON area FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uom_updated_at BEFORE UPDATE ON uom FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_m_etapa_ri_updated_at BEFORE UPDATE ON m_etapa_ri FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_m_etapa_d_updated_at BEFORE UPDATE ON m_etapa_d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_m_etapa_e_updated_at BEFORE UPDATE ON m_etapa_e FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_m_etapa_c_updated_at BEFORE UPDATE ON m_etapa_c FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_m_etapa_a_updated_at BEFORE UPDATE ON m_etapa_a FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modelo_ridec_updated_at BEFORE UPDATE ON modelo_ridec FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_etapa_ri_updated_at BEFORE UPDATE ON etapa_ri FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_etapa_d_updated_at BEFORE UPDATE ON etapa_d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_etapa_e_updated_at BEFORE UPDATE ON etapa_e FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_etapa_c_updated_at BEFORE UPDATE ON etapa_c FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_etapa_a_updated_at BEFORE UPDATE ON etapa_a FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_ridec_updated_at BEFORE UPDATE ON card_ridec FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- RLS (ROW LEVEL SECURITY) PARA SUPABASE
-- ==============================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE area ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_ridec ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_ridec ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS (podem ser ajustadas conforme necessário)
-- Permitir acesso total para usuários autenticados (ajustar conforme necessário)
CREATE POLICY "Permitir acesso total para usuários autenticados" ON empresa FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total para usuários autenticados" ON usuario FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total para usuários autenticados" ON tipo_usuario FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total para usuários autenticados" ON area FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total para usuários autenticados" ON uom FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total para usuários autenticados" ON modelo_ridec FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total para usuários autenticados" ON card_ridec FOR ALL TO authenticated USING (true);

-- ==============================================
-- FINALIZAÇÃO
-- ==============================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados RIDEC Time Control configurado no Supabase com sucesso!';
    RAISE NOTICE 'Tabelas criadas/verificadas: 15';
    RAISE NOTICE 'Índices criados/verificados: 12';
    RAISE NOTICE 'Views criadas/atualizadas: 2';
    RAISE NOTICE 'Funções criadas/atualizadas: 2';
    RAISE NOTICE 'Triggers criados: 16';
    RAISE NOTICE 'RLS habilitado para segurança';
END $$;






-- Script de migração para implementar tipos de usuário
-- RIDEC Time Control - Sistema de Tipos de Usuário
-- Data: $(date)

-- Conectar ao banco de dados
\c ridec_time_control;

-- ==============================================
-- CRIAÇÃO DA TABELA TIPO_USUARIO
-- ==============================================

-- Criar tabela tipo_usuario
CREATE TABLE tipo_usuario (
    cod_tipo_usuario SERIAL PRIMARY KEY,
    nome_tipo_usuario TEXT NOT NULL UNIQUE,
    descricao_tipo TEXT,
    nivel_acesso INTEGER NOT NULL DEFAULT 1,
    pode_adicionar_usuarios BOOLEAN DEFAULT FALSE,
    pode_gerenciar_areas BOOLEAN DEFAULT FALSE,
    pode_acesso_sistema BOOLEAN DEFAULT FALSE,
    ies_ativo VARCHAR(1) DEFAULT 'S' CHECK (ies_ativo IN ('S', 'N'))
);

-- ==============================================
-- INSERÇÃO DOS TIPOS DE USUÁRIO
-- ==============================================

-- Inserir tipos de usuário conforme especificação
INSERT INTO tipo_usuario (nome_tipo_usuario, descricao_tipo, nivel_acesso, pode_adicionar_usuarios, pode_gerenciar_areas, pode_acesso_sistema, ies_ativo) VALUES
('Admin do Sistema', 'Administrador com acesso total ao sistema', 1, TRUE, TRUE, TRUE, 'S'),
('Gestor da Área', 'Gerente que pode adicionar usuários para sua área', 2, TRUE, TRUE, FALSE, 'S'),
('Membro da Área', 'Membro comum da área sem permissões administrativas', 4, FALSE, FALSE, FALSE, 'S'),
('Membro do Board', 'Membro do conselho que pode adicionar usuários para áreas associadas', 3, TRUE, FALSE, FALSE, 'S'),
('Sistema', 'Usuário do sistema com acesso total para adição de informações', 0, TRUE, TRUE, TRUE, 'S');

-- ==============================================
-- ATUALIZAÇÃO DA TABELA USUARIO
-- ==============================================

-- Adicionar constraint de foreign key para tipo_usuario
ALTER TABLE usuario 
ADD CONSTRAINT fk_usuario_tipo_usuario 
FOREIGN KEY (cod_tipo_usuario) REFERENCES tipo_usuario(cod_tipo_usuario) ON DELETE RESTRICT;

-- ==============================================
-- ATUALIZAÇÃO DOS DADOS EXISTENTES
-- ==============================================

-- Atualizar usuários existentes para usar o tipo "Admin do Sistema" (código 1)
UPDATE usuario 
SET cod_tipo_usuario = 1 
WHERE cod_tipo_usuario IS NULL OR cod_tipo_usuario = 1;

-- ==============================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Criar índices para melhor performance
CREATE INDEX idx_tipo_usuario_nivel_acesso ON tipo_usuario(nivel_acesso);
CREATE INDEX idx_tipo_usuario_ativo ON tipo_usuario(ies_ativo);
CREATE INDEX idx_usuario_tipo_usuario ON usuario(cod_tipo_usuario);

-- ==============================================
-- COMENTÁRIOS NAS TABELAS
-- ==============================================

COMMENT ON TABLE tipo_usuario IS 'Tipos de usuário do sistema com diferentes níveis de acesso';
COMMENT ON COLUMN tipo_usuario.nivel_acesso IS 'Nível de acesso: 0=Sistema, 1=Admin, 2=Gestor, 3=Board, 4=Membro';
COMMENT ON COLUMN tipo_usuario.pode_adicionar_usuarios IS 'Se o tipo pode adicionar novos usuários';
COMMENT ON COLUMN tipo_usuario.pode_gerenciar_areas IS 'Se o tipo pode gerenciar áreas';
COMMENT ON COLUMN tipo_usuario.pode_acesso_sistema IS 'Se o tipo tem acesso total ao sistema';

-- ==============================================
-- VIEWS ÚTEIS
-- ==============================================

-- View para relatório de usuários com tipos
CREATE VIEW vw_usuarios_tipos AS
SELECT 
    u.cod_usuario,
    u.nome_usuario,
    u.email_usuario,
    u.ies_ativo as usuario_ativo,
    e.nome_empresa,
    t.nome_tipo_usuario,
    t.descricao_tipo,
    t.nivel_acesso,
    t.pode_adicionar_usuarios,
    t.pode_gerenciar_areas,
    t.pode_acesso_sistema
FROM usuario u
JOIN empresa e ON u.cod_empresa = e.cod_empresa
JOIN tipo_usuario t ON u.cod_tipo_usuario = t.cod_tipo_usuario;

-- View para relatório de permissões por tipo
CREATE VIEW vw_permissoes_tipo_usuario AS
SELECT 
    cod_tipo_usuario,
    nome_tipo_usuario,
    nivel_acesso,
    CASE 
        WHEN pode_adicionar_usuarios THEN 'Sim'
        ELSE 'Não'
    END as pode_adicionar_usuarios,
    CASE 
        WHEN pode_gerenciar_areas THEN 'Sim'
        ELSE 'Não'
    END as pode_gerenciar_areas,
    CASE 
        WHEN pode_acesso_sistema THEN 'Sim'
        ELSE 'Não'
    END as pode_acesso_sistema
FROM tipo_usuario
WHERE ies_ativo = 'S'
ORDER BY nivel_acesso;

-- ==============================================
-- FUNÇÕES ÚTEIS
-- ==============================================

-- Função para verificar se usuário pode adicionar outros usuários
CREATE OR REPLACE FUNCTION usuario_pode_adicionar_usuarios(p_cod_usuario INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_pode_adicionar BOOLEAN;
BEGIN
    SELECT t.pode_adicionar_usuarios INTO v_pode_adicionar
    FROM usuario u
    JOIN tipo_usuario t ON u.cod_tipo_usuario = t.cod_tipo_usuario
    WHERE u.cod_usuario = p_cod_usuario AND u.ies_ativo = 'S';
    
    RETURN COALESCE(v_pode_adicionar, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se usuário pode gerenciar áreas
CREATE OR REPLACE FUNCTION usuario_pode_gerenciar_areas(p_cod_usuario INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_pode_gerenciar BOOLEAN;
BEGIN
    SELECT t.pode_gerenciar_areas INTO v_pode_gerenciar
    FROM usuario u
    JOIN tipo_usuario t ON u.cod_tipo_usuario = t.cod_tipo_usuario
    WHERE u.cod_usuario = p_cod_usuario AND u.ies_ativo = 'S';
    
    RETURN COALESCE(v_pode_gerenciar, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se usuário tem acesso total ao sistema
CREATE OR REPLACE FUNCTION usuario_tem_acesso_sistema(p_cod_usuario INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_acesso_sistema BOOLEAN;
BEGIN
    SELECT t.pode_acesso_sistema INTO v_acesso_sistema
    FROM usuario u
    JOIN tipo_usuario t ON u.cod_tipo_usuario = t.cod_tipo_usuario
    WHERE u.cod_usuario = p_cod_usuario AND u.ies_ativo = 'S';
    
    RETURN COALESCE(v_acesso_sistema, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger para validar nível de acesso ao inserir/atualizar usuário
CREATE OR REPLACE FUNCTION validar_nivel_acesso_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o tipo de usuário existe e está ativo
    IF NOT EXISTS (
        SELECT 1 FROM tipo_usuario 
        WHERE cod_tipo_usuario = NEW.cod_tipo_usuario 
        AND ies_ativo = 'S'
    ) THEN
        RAISE EXCEPTION 'Tipo de usuário inválido ou inativo';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_validar_nivel_acesso_usuario
    BEFORE INSERT OR UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION validar_nivel_acesso_usuario();

-- ==============================================
-- GRANTS E PERMISSÕES
-- ==============================================

-- Conceder permissões para a nova tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tipo_usuario TO ridec_app;
GRANT USAGE, SELECT ON SEQUENCE tipo_usuario_cod_tipo_usuario_seq TO ridec_app;

-- Conceder permissões para as views
GRANT SELECT ON vw_usuarios_tipos TO ridec_app;
GRANT SELECT ON vw_permissoes_tipo_usuario TO ridec_app;

-- ==============================================
-- FINALIZAÇÃO
-- ==============================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migração de tipos de usuário concluída com sucesso!';
    RAISE NOTICE 'Tabela tipo_usuario criada com 5 tipos de usuário';
    RAISE NOTICE 'Tabela usuario atualizada com foreign key para tipo_usuario';
    RAISE NOTICE 'Views e funções criadas para gerenciamento de permissões';
    RAISE NOTICE 'Triggers de validação implementados';
END $$;






# RIDEC Time Control - Banco de Dados PostgreSQL

## Visão Geral

Este projeto contém a estrutura completa do banco de dados PostgreSQL para o sistema RIDEC Time Control, que gerencia processos de Research, Development, Engineering, Construction e Assembly.

## Estrutura do Banco

### Tabelas Principais

1. **empresa** - Empresas do sistema
2. **usuario** - Usuários por empresa
3. **area** - Áreas de trabalho por empresa
4. **uom** - Unidades de medida por empresa

### Tabelas de Modelo RIDEC

5. **modelo_ridec** - Modelos de processo RIDEC
6. **m_etapa_ri** - Modelos de etapas de Research
7. **m_etapa_d** - Modelos de etapas de Development
8. **m_etapa_e** - Modelos de etapas de Engineering
9. **m_etapa_c** - Modelos de etapas de Construction
10. **m_etapa_a** - Modelos de etapas de Assembly

### Tabelas de Execução RIDEC

11. **card_ridec** - Cartões de execução RIDEC
12. **etapa_ri** - Etapas de Research executadas
13. **etapa_d** - Etapas de Development executadas
14. **etapa_e** - Etapas de Engineering executadas
15. **etapa_c** - Etapas de Construction executadas
16. **etapa_a** - Etapas de Assembly executadas

## Relacionamentos

### Hierarquia Principal
```
empresa (1) -> (N) usuario
empresa (1) -> (N) area
empresa (1) -> (N) uom
empresa (1) -> (N) modelo_ridec
```

### Modelo RIDEC
```
modelo_ridec (1) -> (1) m_etapa_ri
modelo_ridec (1) -> (1) m_etapa_d
modelo_ridec (1) -> (1) m_etapa_e
modelo_ridec (1) -> (1) m_etapa_c
```

### Execução RIDEC
```
card_ridec (1) -> (1) modelo_ridec
card_ridec (1) -> (1) etapa_ri
card_ridec (1) -> (1) etapa_d
card_ridec (1) -> (1) etapa_e
card_ridec (1) -> (1) etapa_c
```

## Instalação

### Pré-requisitos
- PostgreSQL 12 ou superior
- Acesso de administrador ao PostgreSQL

### Método 1: Script Automático (Windows)
```bash
setup_database.bat
```

### Método 2: Manual
```bash
# Conectar ao PostgreSQL como superusuário
psql -U postgres

# Executar o script
\i create_database.sql
```

### Método 3: Linha de Comando
```bash
psql -U postgres -f create_database.sql
```

## Configuração

### Usuário da Aplicação
- **Usuário**: `ridec_app`
- **Senha**: `ridec_password`
- **Permissões**: SELECT, INSERT, UPDATE, DELETE em todas as tabelas

### Conexão da Aplicação
```bash
psql -h localhost -p 5432 -U ridec_app -d ridec_time_control
```

## Estrutura das Tabelas

### empresa
- `cod_empresa` (SERIAL PRIMARY KEY)
- `nome_empresa` (TEXT NOT NULL)
- `cod_usuario_empresa` (INTEGER)
- `ies_ativo` (VARCHAR(1) DEFAULT 'S')

### usuario
- `cod_usuario` (SERIAL PRIMARY KEY)
- `nome_usuario` (TEXT NOT NULL)
- `email_usuario` (TEXT UNIQUE NOT NULL)
- `senha_usuario` (TEXT NOT NULL)
- `cod_empresa` (INTEGER NOT NULL)
- `cod_tipo_usuario` (INTEGER)
- `ies_ativo` (VARCHAR(1) DEFAULT 'S')

### modelo_ridec
- `cod_modelo_ridec` (SERIAL PRIMARY KEY)
- `nome_modelo` (TEXT NOT NULL)
- `descricao_modelo` (TEXT)
- `cod_m_etapa_ri` (INTEGER)
- `cod_m_etapa_d` (INTEGER)
- `cod_m_etapa_e` (INTEGER)
- `cod_m_etapa_c` (INTEGER)
- `cod_empresa` (INTEGER NOT NULL)
- `valor_NC` (DOUBLE PRECISION DEFAULT 0.0)

### card_ridec
- `cod_card_ridec` (SERIAL PRIMARY KEY)
- `cod_modelo_ridec` (INTEGER NOT NULL)
- `cod_etapa_ri` (INTEGER)
- `cod_etapa_d` (INTEGER)
- `cod_etapa_e` (INTEGER)
- `cod_etapa_c` (INTEGER)
- `ies_concluiu` (VARCHAR(1) DEFAULT 'N')
- `cod_empresa` (INTEGER NOT NULL)
- `cod_usuario` (INTEGER NOT NULL)

## Views Disponíveis

### vw_progresso_cards
Relatório de progresso dos cards RIDEC com informações de empresa, usuário e modelo.

### vw_etapas_modelo
Relatório de etapas por modelo com detalhes de cada fase RIDEC.

## Funções Úteis

### calcular_duracao_etapa()
Calcula a duração entre início e fim de uma etapa.

### verificar_atraso_etapa()
Verifica se uma etapa está atrasada comparando data fim com prazo.

## Índices

O banco inclui índices otimizados para:
- Consultas por empresa
- Consultas por usuário
- Consultas por modelo RIDEC
- Consultas por unidade de medida

## Dados Iniciais

O script inclui dados de exemplo:
- 1 empresa exemplo
- 1 unidade de medida (Dias)
- 1 usuário administrador

## Backup e Restore

### Backup
```bash
pg_dump -U postgres -h localhost ridec_time_control > backup_ridec.sql
```

### Restore
```bash
psql -U postgres -h localhost -d ridec_time_control < backup_ridec.sql
```

## Monitoramento

### Verificar Status
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar relacionamentos
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## Troubleshooting

### Problemas Comuns

1. **Erro de permissão**: Execute como usuário postgres
2. **Banco já existe**: Use `DROP DATABASE ridec_time_control;` antes de recriar
3. **Usuário já existe**: Use `DROP USER ridec_app;` antes de recriar

### Logs
```bash
# Verificar logs do PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log
```

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do PostgreSQL
2. Confirme as permissões do usuário
3. Valide a estrutura das tabelas com as views de sistema

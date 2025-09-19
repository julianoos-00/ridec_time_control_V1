# Sistema de Tipos de Usuário - RIDEC Time Control

## 📋 Visão Geral

Este documento descreve a implementação do sistema de tipos de usuário no RIDEC Time Control, que permite diferentes níveis de acesso e permissões para os usuários do sistema.

## 🗄️ Estrutura do Banco de Dados

### Nova Tabela: `tipo_usuario`

```sql
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
```

### Atualização da Tabela: `usuario`

A tabela `usuario` foi atualizada para referenciar a nova tabela `tipo_usuario`:

```sql
ALTER TABLE usuario 
ADD CONSTRAINT fk_usuario_tipo_usuario 
FOREIGN KEY (cod_tipo_usuario) REFERENCES tipo_usuario(cod_tipo_usuario) ON DELETE RESTRICT;
```

## 👥 Tipos de Usuário Implementados

### 1. **Sistema** (Nível 0)
- **Descrição**: Usuário do sistema com acesso total para adição de informações
- **Permissões**:
  - ✅ Pode adicionar usuários
  - ✅ Pode gerenciar áreas
  - ✅ Tem acesso total ao sistema
- **Uso**: Integrações e processos automatizados

### 2. **Admin do Sistema** (Nível 1)
- **Descrição**: Administrador com acesso total ao sistema
- **Permissões**:
  - ✅ Pode adicionar usuários
  - ✅ Pode gerenciar áreas
  - ✅ Tem acesso total ao sistema
- **Uso**: Administradores principais da empresa

### 3. **Gestor da Área** (Nível 2)
- **Descrição**: Gerente que pode adicionar usuários para sua área
- **Permissões**:
  - ✅ Pode adicionar usuários
  - ✅ Pode gerenciar áreas
  - ❌ Não tem acesso total ao sistema
- **Uso**: Gerentes de departamentos/áreas específicas

### 4. **Membro do Board** (Nível 3)
- **Descrição**: Membro do conselho que pode adicionar usuários para áreas associadas
- **Permissões**:
  - ✅ Pode adicionar usuários
  - ❌ Não pode gerenciar áreas
  - ❌ Não tem acesso total ao sistema
- **Uso**: Membros do conselho/diretoria

### 5. **Membro da Área** (Nível 4)
- **Descrição**: Membro comum da área sem permissões administrativas
- **Permissões**:
  - ❌ Não pode adicionar usuários
  - ❌ Não pode gerenciar áreas
  - ❌ Não tem acesso total ao sistema
- **Uso**: Usuários finais do sistema

## 🔧 Funcionalidades Implementadas

### Backend (Banco de Dados)

1. **Tabela `tipo_usuario`** com campos de controle de permissões
2. **Foreign Key** na tabela `usuario` para referenciar tipos
3. **Índices** para performance otimizada
4. **Views** para relatórios e consultas
5. **Funções** para verificação de permissões
6. **Triggers** para validação de dados

### Frontend (Interface)

1. **Selects dinâmicos** carregados do banco de dados
2. **Validação** de tipos de usuário
3. **Interface atualizada** com novos tipos
4. **Integração** com sistema de cadastro existente

## 📁 Arquivos Modificados

### Banco de Dados
- `create_database.sql` - Estrutura principal atualizada
- `migration_tipo_usuario.sql` - Script de migração para bancos existentes

### Frontend
- `cadastro.html` - Interface atualizada
- `cadastro.js` - Lógica JavaScript atualizada

### Documentação
- `README_TIPOS_USUARIO.md` - Este arquivo

## 🚀 Como Aplicar as Mudanças

### Para Novos Bancos de Dados
Execute o arquivo `create_database.sql` atualizado.

### Para Bancos Existentes
Execute o script de migração:

```bash
psql -U postgres -d ridec_time_control -f migration_tipo_usuario.sql
```

## 🔍 Views e Funções Úteis

### Views Criadas
- `vw_usuarios_tipos` - Relatório de usuários com tipos
- `vw_permissoes_tipo_usuario` - Relatório de permissões por tipo

### Funções Criadas
- `usuario_pode_adicionar_usuarios(cod_usuario)` - Verifica se pode adicionar usuários
- `usuario_pode_gerenciar_areas(cod_usuario)` - Verifica se pode gerenciar áreas
- `usuario_tem_acesso_sistema(cod_usuario)` - Verifica acesso total ao sistema

## 📊 Exemplos de Uso

### Verificar Permissões de um Usuário
```sql
SELECT 
    u.nome_usuario,
    t.nome_tipo_usuario,
    usuario_pode_adicionar_usuarios(u.cod_usuario) as pode_adicionar,
    usuario_pode_gerenciar_areas(u.cod_usuario) as pode_gerenciar,
    usuario_tem_acesso_sistema(u.cod_usuario) as acesso_sistema
FROM usuario u
JOIN tipo_usuario t ON u.cod_tipo_usuario = t.cod_tipo_usuario
WHERE u.cod_usuario = 1;
```

### Listar Usuários por Tipo
```sql
SELECT 
    t.nome_tipo_usuario,
    COUNT(u.cod_usuario) as total_usuarios
FROM tipo_usuario t
LEFT JOIN usuario u ON t.cod_tipo_usuario = u.cod_tipo_usuario
GROUP BY t.cod_tipo_usuario, t.nome_tipo_usuario
ORDER BY t.nivel_acesso;
```

## ⚠️ Considerações Importantes

1. **Backup**: Sempre faça backup antes de aplicar migrações
2. **Testes**: Teste em ambiente de desenvolvimento primeiro
3. **Permissões**: Verifique se as permissões do usuário `ridec_app` foram concedidas
4. **Dados Existentes**: Usuários existentes serão migrados para "Admin do Sistema"

## 🔄 Próximos Passos

1. **Implementar validações** de permissões no frontend
2. **Criar interface** para gerenciar tipos de usuário
3. **Implementar logs** de auditoria para mudanças de permissões
4. **Adicionar testes** automatizados para as funções de permissão

## 📞 Suporte

Para dúvidas ou problemas com a implementação, consulte:
- Documentação do banco de dados
- Logs de erro do sistema
- Equipe de desenvolvimento




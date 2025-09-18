# Configuração do Supabase - RIDEC Time Control

Este documento explica como configurar e conectar o sistema RIDEC Time Control ao Supabase.

## 📋 Informações de Conexão

### Credenciais do Supabase
- **Host**: `aws-1-sa-east-1.pooler.supabase.com`
- **Porta**: `5432`
- **Database**: `postgres`
- **Usuário**: `postgres.fphyoywhgelrxtjfovmz`
- **Senha**: `n40-M3-l3mbr0`

### URL do Projeto
- **URL**: `https://fphyoywhgelrxtjfovmz.supabase.co`

## 🚀 Como Configurar

### 1. Executar o Script de Configuração

Execute o arquivo `supabase_config.bat` para configurar automaticamente o banco de dados:

```bash
supabase_config.bat
```

Este script irá:
- Conectar ao banco Supabase
- Executar o script `create_database_supabase.sql`
- Criar todas as tabelas, índices, views e funções necessárias
- Configurar Row Level Security (RLS)
- Inserir dados iniciais

### 2. Configuração Manual (Alternativa)

Se preferir configurar manualmente:

```bash
psql -h aws-1-sa-east-1.pooler.supabase.com -p 5432 -U postgres.fphyoywhgelrxtjfovmz -d postgres -f create_database_supabase.sql
```

Quando solicitado, digite a senha: `n40-M3-l3mbr0`

### 3. Configurar a Aplicação

Para conectar a aplicação web ao Supabase:

1. **Obter a chave pública (anon key)** do painel do Supabase
2. **Editar o arquivo `supabase-config.js`** e substituir `SUA_ANON_KEY_AQUI` pela chave real
3. **Incluir o script do Supabase** nas suas páginas HTML:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

## 📁 Arquivos Criados

### Arquivos de Configuração
- `supabase_config.bat` - Script para configuração automática
- `create_database_supabase.sql` - Script SQL adaptado para Supabase
- `supabase-config.js` - Configuração JavaScript para a aplicação
- `README_SUPABASE.md` - Este arquivo de documentação

### Principais Diferenças do Script Original
- Adicionado `IF NOT EXISTS` para evitar erros de duplicação
- Incluído timestamps `created_at` e `updated_at` em todas as tabelas
- Configurado Row Level Security (RLS) para segurança
- Adicionado triggers para atualização automática de timestamps
- Usado `ON CONFLICT DO NOTHING` para inserções seguras

## 🔧 Estrutura do Banco

### Tabelas Principais
- `empresa` - Empresas do sistema
- `tipo_usuario` - Tipos de usuário com níveis de acesso
- `usuario` - Usuários do sistema
- `area` - Áreas de trabalho
- `uom` - Unidades de medida

### Tabelas RIDEC
- `modelo_ridec` - Modelos de processo RIDEC
- `m_etapa_ri`, `m_etapa_d`, `m_etapa_e`, `m_etapa_c`, `m_etapa_a` - Modelos de etapas
- `etapa_ri`, `etapa_d`, `etapa_e`, `etapa_c`, `etapa_a` - Etapas executadas
- `card_ridec` - Cartões de execução

### Views Úteis
- `vw_progresso_cards` - Relatório de progresso dos cards
- `vw_etapas_modelo` - Relatório de etapas por modelo

### Funções
- `calcular_duracao_etapa()` - Calcula duração entre datas/horas
- `verificar_atraso_etapa()` - Verifica se etapa está atrasada

## 🔐 Segurança

### Row Level Security (RLS)
- Habilitado em todas as tabelas principais
- Políticas básicas configuradas para usuários autenticados
- Pode ser ajustado conforme necessário no painel do Supabase

### Triggers
- Atualização automática de `updated_at` em todas as tabelas
- Mantém histórico de modificações

## 🧪 Testando a Conexão

### Via JavaScript
```javascript
// Testar conexão
testConnection().then(success => {
    if (success) {
        console.log('Conexão OK!');
    } else {
        console.log('Erro na conexão');
    }
});
```

### Via psql
```bash
psql -h aws-1-sa-east-1.pooler.supabase.com -p 5432 -U postgres.fphyoywhgelrxtjfovmz -d postgres
```

## 📊 Dados Iniciais

O script insere automaticamente:
- 5 tipos de usuário (Admin, Gestor, Membro, Board, Sistema)
- 1 empresa exemplo
- 1 unidade de medida (Dias)
- 1 usuário administrador (admin@empresa.com / senha123)

## 🆘 Solução de Problemas

### Erro de Conexão
- Verifique se as credenciais estão corretas
- Confirme se o PostgreSQL está instalado e no PATH
- Teste a conectividade de rede

### Erro de Permissão
- Verifique se o usuário tem permissões adequadas no Supabase
- Confirme se o RLS está configurado corretamente

### Erro de Tabela Já Existe
- O script usa `IF NOT EXISTS` para evitar este erro
- Se persistir, verifique se há conflitos de nomes

## 📞 Suporte

Para problemas específicos do Supabase, consulte:
- [Documentação oficial do Supabase](https://supabase.com/docs)
- [Guia de PostgreSQL do Supabase](https://supabase.com/docs/guides/database)

---

**Nota**: Mantenha as credenciais seguras e não as compartilhe publicamente.

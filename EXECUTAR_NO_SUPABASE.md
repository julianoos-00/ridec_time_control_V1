# 🚀 EXECUTAR NO PAINEL DO SUPABASE

Como o PostgreSQL não está instalado localmente, você pode executar o script SQL diretamente no painel web do Supabase.

## 📋 Passos para Executar:

### 1. Acesse o Painel do Supabase
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto: `fphyoywhgelrxtjfovmz`

### 2. Acesse o SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

### 3. Execute o Script
- Copie todo o conteúdo do arquivo `create_database_supabase.sql`
- Cole no editor SQL
- Clique em **"Run"** para executar

### 4. Verificar Resultado
O script deve criar:
- ✅ 15 tabelas
- ✅ 12 índices
- ✅ 2 views
- ✅ 2 funções
- ✅ 16 triggers
- ✅ RLS habilitado
- ✅ Dados iniciais inseridos

## 🔧 Alternativa: Instalar PostgreSQL

Se preferir executar localmente:

### Windows:
1. Baixe PostgreSQL: https://www.postgresql.org/download/windows/
2. Durante a instalação, marque "Add PostgreSQL to PATH"
3. Reinicie o terminal
4. Execute: `.\setup-supabase-simple.ps1`

### Ou instale Node.js:
1. Baixe Node.js: https://nodejs.org/
2. Execute: `npm install`
3. Execute: `node setup-supabase.js`

## 📊 Verificar se Funcionou

Após executar o script, você pode verificar se as tabelas foram criadas:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

```sql
-- Verificar dados iniciais
SELECT * FROM tipo_usuario;
SELECT * FROM empresa;
SELECT * FROM usuario;
```

## 🎯 Próximos Passos

Após executar o script no Supabase:

1. **Configure a aplicação web** editando `supabase-config.js`
2. **Obtenha a chave pública** do painel do Supabase
3. **Teste a conexão** na sua aplicação

---

**💡 Dica**: O painel web do Supabase é a forma mais fácil de executar o script sem instalar nada localmente!




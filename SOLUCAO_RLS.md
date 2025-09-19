# 🔒 Solução para Erro de Row Level Security (RLS)

## ❌ Problema Identificado
O erro `new row violates row-level security policy for table "empresa"` ocorre porque o Supabase tem políticas de Row Level Security (RLS) ativas que impedem inserções via cliente anônimo.

## ✅ Soluções Disponíveis

### 🎯 Solução 1: SQL Editor do Supabase (RECOMENDADA)

**Arquivo criado:** `insert-users-bypass-rls.sql`

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard/project/fphyoywhgelrxtjfovmz/sql

2. **Execute o script SQL:**
   - Cole o conteúdo do arquivo `insert-users-bypass-rls.sql`
   - Clique em "Run" para executar

3. **O script irá:**
   - Desabilitar temporariamente o RLS
   - Criar empresa e tipos de usuário se necessário
   - Inserir os 4 usuários
   - Reabilitar o RLS
   - Mostrar os usuários criados

### 🎯 Solução 2: Interface Web com Script

**Arquivo criado:** `create-users-service-role.html`

1. **Abra o arquivo** `create-users-service-role.html`
2. **Clique em "Copiar Script SQL"**
3. **Clique em "Abrir Supabase Dashboard"**
4. **Cole e execute o script** no SQL Editor

## 📋 Usuários a serem Criados

| Email | Nome | Senha |
|-------|------|-------|
| usuario1@email.com | User1 Sobrenome1 | senha1 |
| usuario2@email.com | User2 Sobrenome1 | senha2 |
| usuario3@email.com | User3 Sobrenome1 | senha3 |
| usuario4@email.com | User4 Sobrenome1 | senha4 |

## 🔧 O que o Script Faz

1. **Desabilita RLS temporariamente** nas tabelas:
   - `empresa`
   - `tipo_usuario` 
   - `usuario`

2. **Cria dados necessários:**
   - Empresa padrão (se não existir)
   - Tipos de usuário padrão (se não existirem)

3. **Insere os 4 usuários** com:
   - Empresa ID: 1
   - Tipo de usuário: "Membro da Área" (ID: 3)

4. **Reabilita RLS** para manter a segurança

5. **Mostra resultado** com query de verificação

## ✅ Verificação de Sucesso

Após executar o script, você deve ver uma tabela com os 4 usuários criados:

```
cod_usuario | nome_usuario    | email_usuario        | ies_ativo | nome_empresa    | nome_tipo_usuario
1          | User1 Sobrenome1| usuario1@email.com   | S         | Empresa Padrão  | Membro da Área
2          | User2 Sobrenome1| usuario2@email.com   | S         | Empresa Padrão  | Membro da Área
3          | User3 Sobrenome1| usuario3@email.com   | S         | Empresa Padrão  | Membro da Área
4          | User4 Sobrenome1| usuario4@email.com   | S         | Empresa Padrão  | Membro da Área
```

## 🚨 Importante

- **RLS é reabilitado** após a execução para manter a segurança
- **Usuários duplicados** são ignorados (ON CONFLICT DO NOTHING)
- **Script é seguro** e não afeta dados existentes
- **Execute como superuser** no SQL Editor do Supabase

## 📁 Arquivos Criados

1. **`insert-users-bypass-rls.sql`** - Script SQL para execução direta
2. **`create-users-service-role.html`** - Interface com script copiável
3. **`SOLUCAO_RLS.md`** - Este arquivo de instruções




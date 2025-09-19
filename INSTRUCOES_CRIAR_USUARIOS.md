# 📋 Instruções para Criar Usuários no Supabase

## 🎯 Objetivo
Criar 4 usuários no banco de dados Supabase com os seguintes dados:

| Email | Nome | Senha |
|-------|------|-------|
| usuario1@email.com | User1 Sobrenome1 | senha1 |
| usuario2@email.com | User2 Sobrenome1 | senha2 |
| usuario3@email.com | User3 Sobrenome1 | senha3 |
| usuario4@email.com | User4 Sobrenome1 | senha4 |

## 🚀 Métodos Disponíveis

### Método 1: Interface Web (Recomendado)
1. **Abra o arquivo `create-users.html`** no seu navegador
2. **Aguarde a conexão** com o Supabase ser estabelecida
3. **Clique em "Verificar Dados Existentes"** para verificar empresas e tipos de usuário
4. **Clique em "Criar Usuários"** para inserir os 4 usuários
5. **Acompanhe o log** de operações na tela

### Método 2: SQL Editor do Supabase
1. **Acesse o Supabase Dashboard** (https://supabase.com/dashboard)
2. **Vá para o seu projeto** RIDEC
3. **Abra o SQL Editor**
4. **Cole o conteúdo** do arquivo `insert-users.sql`
5. **Execute o script**

## 📊 Estrutura do Banco

### Tabela `usuario`
- `cod_usuario` (SERIAL PRIMARY KEY)
- `nome_usuario` (TEXT NOT NULL)
- `email_usuario` (TEXT UNIQUE NOT NULL)
- `senha_usuario` (TEXT NOT NULL)
- `cod_empresa` (INTEGER NOT NULL) - Referência à tabela empresa
- `cod_tipo_usuario` (INTEGER NOT NULL) - Referência à tabela tipo_usuario
- `ies_ativo` (VARCHAR(1) DEFAULT 'S')

### Dependências
- **Empresa**: Os usuários precisam estar associados a uma empresa
- **Tipo de Usuário**: Os usuários precisam ter um tipo de usuário definido

## 🔧 Configuração

O sistema está configurado para:
- **URL do Supabase**: `https://fphyoywhgelrxtjfovmz.supabase.co`
- **Chave Anon**: Configurada no arquivo `supabase-config.js`
- **Banco**: PostgreSQL no Supabase

## ✅ Verificação

Após a criação, você pode verificar os usuários com:

```sql
SELECT 
    u.cod_usuario,
    u.nome_usuario,
    u.email_usuario,
    u.ies_ativo,
    e.nome_empresa,
    t.nome_tipo_usuario
FROM usuario u
JOIN empresa e ON u.cod_empresa = e.cod_empresa
JOIN tipo_usuario t ON u.cod_tipo_usuario = t.cod_tipo_usuario
WHERE u.email_usuario IN (
    'usuario1@email.com',
    'usuario2@email.com', 
    'usuario3@email.com',
    'usuario4@email.com'
)
ORDER BY u.cod_usuario;
```

## 🚨 Tratamento de Erros

- **Usuário já existe**: O sistema detecta emails duplicados e pula a criação
- **Empresa não existe**: Cria automaticamente uma empresa padrão
- **Tipo de usuário não existe**: Cria automaticamente tipos padrão
- **Conexão falha**: Verifica configuração do Supabase

## 📁 Arquivos Criados

1. **`create-users.html`** - Interface web para criação de usuários
2. **`insert-users.sql`** - Script SQL para execução direta
3. **`INSTRUCOES_CRIAR_USUARIOS.md`** - Este arquivo de instruções

## 🎉 Resultado Esperado

Após a execução bem-sucedida, você terá:
- ✅ 4 usuários criados no banco de dados
- ✅ Empresa padrão (se não existir)
- ✅ Tipos de usuário padrão (se não existirem)
- ✅ Log detalhado de todas as operações




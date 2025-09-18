# 🚀 INSTRUÇÕES PARA CONECTAR AO SUPABASE

## ✅ Configuração Concluída!

O banco de dados RIDEC Time Control foi configurado para conectar ao Supabase com as seguintes credenciais:

### 📋 Credenciais do Supabase
- **Host**: `aws-1-sa-east-1.pooler.supabase.com`
- **Porta**: `5432`
- **Database**: `postgres`
- **Usuário**: `postgres.fphyoywhgelrxtjfovmz`
- **Senha**: `n40-M3-l3mbr0`
- **URL do Projeto**: `https://fphyoywhgelrxtjfovmz.supabase.co`

## 🛠️ Como Executar a Configuração

### Opção 1: Script PowerShell (Recomendado)
```powershell
.\setup-supabase-simple.ps1
```

### Opção 2: Script Batch
```cmd
supabase_config.bat
```

### Opção 3: Comando Direto (se PostgreSQL estiver instalado)
```cmd
psql -h aws-1-sa-east-1.pooler.supabase.com -p 5432 -U postgres.fphyoywhgelrxtjfovmz -d postgres -f create_database_supabase.sql
```

## 📁 Arquivos Criados

### Scripts de Configuração
- `supabase_config.bat` - Script batch para configuração
- `setup-supabase-simple.ps1` - Script PowerShell simplificado
- `setup-supabase.js` - Script Node.js (requer npm install)
- `test-connection.js` - Script para testar conexão

### Arquivos SQL
- `create_database_supabase.sql` - Script SQL adaptado para Supabase
- `package.json` - Dependências Node.js

### Configuração da Aplicação
- `supabase-config.js` - Configuração JavaScript para a aplicação web
- `README_SUPABASE.md` - Documentação detalhada

## 🔧 Próximos Passos

### 1. Executar a Configuração
Execute um dos scripts acima para criar as tabelas no Supabase.

### 2. Configurar a Aplicação Web
1. Obtenha a chave pública (anon key) do painel do Supabase
2. Edite `supabase-config.js` e substitua `SUA_ANON_KEY_AQUI` pela chave real
3. Inclua os scripts nas suas páginas HTML:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

### 3. Testar a Conexão
```javascript
// No console do navegador ou em um script
testConnection().then(success => {
    if (success) {
        console.log('✅ Conexão OK!');
    } else {
        console.log('❌ Erro na conexão');
    }
});
```

## 🗄️ Estrutura do Banco

O script criará as seguintes tabelas:

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

### Dados Iniciais
- 5 tipos de usuário (Admin, Gestor, Membro, Board, Sistema)
- 1 empresa exemplo
- 1 unidade de medida (Dias)
- 1 usuário administrador (admin@empresa.com / senha123)

## 🔐 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Triggers** para atualização automática de timestamps
- **Políticas básicas** configuradas para usuários autenticados

## 🆘 Solução de Problemas

### PostgreSQL não encontrado
- Instale o PostgreSQL: https://www.postgresql.org/download/windows/
- Certifique-se de adicionar ao PATH durante a instalação
- Reinicie o terminal após a instalação

### Erro de conexão
- Verifique se as credenciais estão corretas
- Confirme a conectividade com a internet
- Teste a conexão no painel web do Supabase

### Erro de permissão
- Verifique se o usuário tem permissões adequadas
- Confirme se o RLS está configurado corretamente

## 📞 Suporte

Para problemas específicos:
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de PostgreSQL do Supabase](https://supabase.com/docs/guides/database)

---

**🎉 Configuração concluída! O sistema RIDEC Time Control está pronto para usar com Supabase.**

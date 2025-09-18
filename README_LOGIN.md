# Sistema de Login RIDEC

Este documento descreve o sistema de autenticação implementado no Sistema RIDEC.

## 📁 Arquivos Criados

### 1. `login.html`
- Tela de login principal com design moderno
- Formulário de autenticação com validação
- Opções de login social (Google, GitHub)
- Modal para recuperação de senha
- Modal para registro de novos usuários
- Credenciais de demonstração

### 2. `login.js`
- Classe `LoginSystem` para gerenciar autenticação
- Integração com Supabase Auth
- Validação de formulários em tempo real
- Gerenciamento de estados de loading
- Tratamento de erros e mensagens

### 3. `login-styles.css`
- Estilos modernos para a tela de login
- Animações e efeitos visuais
- Design responsivo
- Tema escuro opcional
- Estados de validação visual

### 4. `auth-manager.js`
- Classe `AuthManager` para gerenciar autenticação global
- Integração com banco de dados Supabase
- Gerenciamento de permissões e níveis de acesso
- Criação automática de perfis de usuário
- Callbacks para eventos de autenticação

## 🔐 Funcionalidades

### Autenticação
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Recuperação de senha
- ✅ Login social (Google, GitHub)
- ✅ Sessões persistentes
- ✅ Logout seguro

### Validação
- ✅ Validação de email em tempo real
- ✅ Validação de senha (mínimo 6 caracteres)
- ✅ Confirmação de senha no registro
- ✅ Aceite de termos de uso

### Interface
- ✅ Design moderno e responsivo
- ✅ Animações suaves
- ✅ Estados de loading
- ✅ Mensagens de erro e sucesso
- ✅ Credenciais de demonstração

### Integração
- ✅ Integração com Supabase Auth
- ✅ Criação automática de perfis
- ✅ Gerenciamento de permissões
- ✅ Redirecionamento automático

## 🚀 Como Usar

### 1. Acessar o Sistema
```
http://localhost:3000/login.html
```

### 2. Credenciais de Demonstração
- **Admin:** `admin@ridec.com` / `admin123`
- **Usuário:** `user@ridec.com` / `user123`

### 3. Fluxo de Autenticação
1. Usuário acessa `login.html`
2. Sistema verifica se há sessão ativa
3. Se não houver, exibe tela de login
4. Após login bem-sucedido, redireciona para `index.html`
5. Sistema verifica permissões e atualiza UI

## 🔧 Configuração

### Supabase
O sistema usa as configurações do arquivo `supabase-config.js`:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://fphyoywhgelrxtjfovmz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### Tabelas Necessárias
O sistema espera as seguintes tabelas no Supabase:
- `usuario` - Dados dos usuários
- `empresa` - Empresas
- `tipo_usuario` - Tipos de usuário com níveis de acesso

## 📊 Níveis de Permissão

| Nível | Descrição | Permissões |
|-------|-----------|------------|
| 1 | Usuário Básico | Leitura |
| 2 | Usuário Avançado | Leitura + Escrita |
| 3 | Administrador | Leitura + Escrita + Admin |
| 4 | Super Admin | Todas as permissões |

## 🔄 Fluxo de Dados

### Login
1. Usuário insere credenciais
2. `LoginSystem` valida dados
3. Supabase Auth autentica usuário
4. `AuthManager` carrega perfil do usuário
5. Sistema atualiza UI e redireciona

### Logout
1. Usuário clica em "Sair"
2. `AuthManager` faz logout no Supabase
3. Dados locais são limpos
4. Redirecionamento para login

## 🛡️ Segurança

### Implementado
- ✅ Autenticação via Supabase Auth
- ✅ Validação de sessões
- ✅ Tokens JWT seguros
- ✅ HTTPS obrigatório
- ✅ Validação de entrada

### Recomendações
- 🔒 Implementar 2FA (Two-Factor Authentication)
- 🔒 Rate limiting para tentativas de login
- 🔒 Logs de auditoria
- 🔒 Política de senhas mais rigorosa

## 🎨 Personalização

### Cores
As cores principais podem ser alteradas no CSS:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #48bb78;
    --error-color: #f56565;
}
```

### Logo
Para alterar o logo, modifique o ícone no `login.html`:
```html
<div class="logo-icon">
    <i class="fas fa-project-diagram"></i>
</div>
```

## 🐛 Solução de Problemas

### Erro: "Biblioteca do Supabase não carregada"
- Verifique se o script do Supabase está carregado antes do `login.js`

### Erro: "Configuração do Supabase não encontrada"
- Verifique se o arquivo `supabase-config.js` está presente e configurado

### Usuário não é redirecionado após login
- Verifique se o `auth-manager.js` está carregado no `index.html`
- Verifique se há erros no console do navegador

### Permissões não funcionam
- Verifique se a tabela `tipo_usuario` tem os níveis corretos
- Verifique se o usuário tem um registro na tabela `usuario`

## 📝 Logs

O sistema gera logs detalhados no console:
- `🚀` - Inicialização
- `✅` - Sucesso
- `❌` - Erro
- `🔐` - Autenticação
- `👤` - Usuário
- `🔄` - Estado alterado

## 🔮 Próximas Funcionalidades

- [ ] Autenticação de dois fatores (2FA)
- [ ] Gerenciamento de perfis de usuário
- [ ] Logs de auditoria
- [ ] Integração com Active Directory
- [ ] Single Sign-On (SSO)
- [ ] Políticas de senha personalizáveis

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Consulte a documentação do Supabase
3. Verifique a configuração do banco de dados
4. Teste com as credenciais de demonstração

---

**Sistema RIDEC - Controle de Processos e Tempo**
*Desenvolvido com ❤️ para otimizar processos empresariais*


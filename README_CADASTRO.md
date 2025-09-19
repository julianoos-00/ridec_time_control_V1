# Sistema de Cadastros RIDEC

Este módulo implementa a funcionalidade de cadastro de usuários e áreas para o sistema RIDEC, permitindo o gerenciamento completo de recursos humanos e organizacionais.

## 🚀 Funcionalidades

### 👥 Gerenciamento de Usuários
- **Cadastro de novos usuários** com informações completas
- **Edição de usuários existentes** 
- **Exclusão de usuários** com confirmação
- **Filtros de busca** por nome ou email
- **Controle de status** (Ativo/Inativo)
- **Tipos de usuário** configuráveis:
  - Administrador
  - Gerente
  - Usuário
  - Visualizador

### 🏢 Gerenciamento de Áreas
- **Cadastro de novas áreas** da empresa
- **Edição de áreas existentes**
- **Exclusão de áreas** com confirmação
- **Filtros de busca** por nome
- **Vinculação com empresas**

## 📁 Arquivos do Sistema

- `cadastro.html` - Interface principal da tela de cadastros
- `cadastro.js` - Lógica de funcionamento e gerenciamento de dados
- `styles.css` - Estilos específicos para a tela de cadastros
- `script.js` - Integração com o sistema principal (botão de acesso)

## 🎯 Como Acessar

### Via Sistema Principal
1. Na tela principal do RIDEC, localize o botão **"Cadastros"** no header
2. Clique no botão para acessar a tela de gerenciamento
3. Use o botão **"Voltar"** para retornar ao sistema principal

### Acesso Direto
- URL: `cadastro.html`
- Navegação direta pelo navegador

## 🖥️ Interface do Sistema

### Layout em Abas
- **Aba Usuários**: Gerenciamento completo de usuários
- **Aba Áreas**: Gerenciamento de áreas organizacionais

### Barra de Busca
- Busca em tempo real
- Filtros específicos para cada tipo de cadastro
- Botão de limpar busca

### Cards de Dados
- Visualização em grid responsivo
- Informações organizadas e claras
- Ações de edição e exclusão

## 📝 Operações Disponíveis

### Para Usuários
1. **Novo Usuário**
   - Nome completo (obrigatório)
   - Email (obrigatório)
   - Senha (obrigatório)
   - Tipo de usuário (obrigatório)
   - Empresa (obrigatório)
   - Status (padrão: Ativo)

2. **Editar Usuário**
   - Modificar todos os campos exceto senha
   - Alterar status e tipo
   - Trocar empresa

3. **Excluir Usuário**
   - Confirmação obrigatória
   - Remoção permanente

### Para Áreas
1. **Nova Área**
   - Nome da área (obrigatório)
   - Empresa (obrigatório)

2. **Editar Área**
   - Modificar nome e empresa

3. **Excluir Área**
   - Confirmação obrigatória
   - Remoção permanente

## 🔧 Configuração

### Dados de Exemplo
O sistema inclui dados de demonstração:
- **Empresa Demo** (código 1)
- **Usuários de teste** com diferentes tipos
- **Áreas de exemplo** (Desenvolvimento, Qualidade)

### Personalização
- Adicione novas empresas conforme necessário
- Configure tipos de usuário específicos
- Adapte campos obrigatórios conforme regras de negócio

## 🔌 Integração com Banco de Dados

### Estrutura de Tabelas
- `usuario` - Dados dos usuários
- `area` - Dados das áreas
- `empresa` - Dados das empresas

### Campos Principais
- **Usuários**: cod_usuario, nome_usuario, email_usuario, senha_usuario, cod_empresa, cod_tipo_usuario, ies_ativo
- **Áreas**: cod_area, nome_area, cod_empresa
- **Empresas**: cod_empresa, nome_empresa, cod_usuario_empresa, ies_ativo

## 🎨 Design e UX

### Características Visuais
- **Design moderno** com gradientes e sombras
- **Responsivo** para diferentes tamanhos de tela
- **Animações suaves** para melhor experiência
- **Ícones intuitivos** do Font Awesome

### Estados Visuais
- **Hover effects** nos cards e botões
- **Status coloridos** (verde para ativo, vermelho para inativo)
- **Notificações toast** para feedback do usuário
- **Modais elegantes** para formulários

## 📱 Responsividade

### Breakpoints
- **Desktop**: Layout em grid com múltiplas colunas
- **Tablet**: Grid adaptativo com 2-3 colunas
- **Mobile**: Layout em coluna única

### Adaptações
- Botões redimensionados para touch
- Espaçamentos otimizados para mobile
- Navegação por abas adaptada

## 🔒 Segurança

### Validações
- **Campos obrigatórios** marcados com asterisco
- **Validação de email** no formato correto
- **Confirmações** para operações destrutivas
- **Sanitização** de dados de entrada

### Controle de Acesso
- **Tipos de usuário** com diferentes níveis
- **Status ativo/inativo** para controle de acesso
- **Vinculação com empresa** para isolamento de dados

## 🚨 Notificações

### Tipos de Notificação
- **Sucesso**: Operações realizadas com sucesso
- **Erro**: Problemas durante operações
- **Info**: Informações gerais do sistema

### Comportamento
- **Auto-remoção** após 5 segundos
- **Botão de fechar** manual
- **Posicionamento** no canto superior direito
- **Animações** de entrada e saída

## 🔄 Atualizações e Manutenção

### Funcionalidades Futuras
- **Importação em lote** de usuários
- **Exportação** de dados para relatórios
- **Histórico de alterações** com auditoria
- **Sincronização** com sistemas externos

### Manutenção
- **Backup automático** de dados
- **Logs de operações** para auditoria
- **Validação de integridade** de dados
- **Limpeza automática** de dados obsoletos

## 📋 Checklist de Implementação

- [x] Interface HTML responsiva
- [x] Lógica JavaScript para gerenciamento
- [x] Estilos CSS modernos
- [x] Integração com sistema principal
- [x] Dados de exemplo
- [x] Validações de formulário
- [x] Sistema de notificações
- [x] Busca e filtros
- [x] Operações CRUD completas
- [ ] Integração com API real
- [ ] Testes automatizados
- [ ] Documentação de API

## 🆘 Suporte e Troubleshooting

### Problemas Comuns
1. **Modal não abre**: Verificar se o JavaScript está carregado
2. **Dados não salvam**: Verificar console para erros
3. **Busca não funciona**: Verificar se os filtros estão configurados

### Logs e Debug
- **Console do navegador** para erros JavaScript
- **Network tab** para chamadas de API
- **Local Storage** para dados temporários

## 📞 Contato

Para dúvidas ou sugestões sobre o sistema de cadastros:
- **Desenvolvedor**: Sistema RIDEC
- **Versão**: 1.0
- **Data**: 2024
- **Status**: Em desenvolvimento ativo

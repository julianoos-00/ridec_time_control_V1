# Sistema RIDEC - Controle de Processos

Sistema completo para controle e monitoramento de processos RIDEC (Requisitos, Implementação, Desenvolvimento, Execução e Controle) com funcionalidades avançadas de integração com sistemas externos.

## 🚀 Funcionalidades Principais

### Controle de Processos
- **Gestão de RIDECs**: Criação, edição e monitoramento de processos
- **Controle de Tempo**: Cronômetros automáticos para cada etapa
- **Kanban Board**: Visualização em quadro para acompanhamento
- **Relatórios**: Gráficos e estatísticas em tempo real
- **Notificações**: Sistema de alertas e notificações

### Integrações Avançadas 🆕
- **Sistemas Externos**: Integração com Slack, Jira, Teams, Email, Webhooks e Google Calendar
- **Triggers Automáticos**: Disparo automático de ações baseado em eventos externos
- **Configuração Intuitiva**: Interface visual para configurar integrações
- **Logs Detalhados**: Registro completo de todas as integrações
- **Testes de Conectividade**: Verificação de conexão com sistemas externos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Estilização**: CSS Grid, Flexbox, Gradientes
- **Armazenamento**: LocalStorage
- **Gráficos**: Canvas API
- **Ícones**: Font Awesome

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ridec_time_control.git
cd ridec_time_control
```

2. Abra o arquivo `index.html` em seu navegador ou use um servidor local:
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx serve .

# Usando PHP
php -S localhost:8000
```

3. Acesse `http://localhost:8000` no seu navegador

## 🎯 Como Usar

### Configuração Básica

1. **Criar um RIDEC**:
   - Clique em "Criar RIDEC"
   - Preencha título, descrição e área
   - Configure prazos para cada etapa
   - Salve o RIDEC

2. **Gerenciar Etapas**:
   - Use os botões de play/pause para controlar o tempo
   - Marque etapas como concluídas
   - Acompanhe o progresso em tempo real

### Configuração de Integrações 🆕

#### 1. Configurar Sistemas Externos

Acesse o modal de integrações clicando no botão de integração de qualquer RIDEC:

```javascript
// Exemplo: Configurar Slack
const slackConfig = {
    webhook_url: 'https://hooks.slack.com/services/...',
    channel: '#ridec-integrations',
    start_message: '/ridec start {stage}',
    finish_message: '/ridec finish {stage}'
};

// Salvar configuração
localStorage.setItem('system_config_slack', JSON.stringify(slackConfig));
```

#### 2. Configurar Triggers por Etapa

Para cada etapa, você pode configurar:

- **Triggers de Início**: Quando iniciar automaticamente
- **Triggers de Finalização**: Quando finalizar automaticamente
- **Condições**: Horário, usuários, prioridade
- **Ações Adicionais**: Notificações, logs, webhooks

#### 3. Configuração Avançada

Use a aba "Configuração Avançada" para:

- **Triggers Detalhados**: Palavras-chave, comandos específicos
- **Condições Complexas**: Múltiplas condições combinadas
- **Ações Customizadas**: Webhooks personalizados, mensagens específicas
- **Logs de Integração**: Histórico completo de todas as integrações

### Exemplos de Uso

#### Integração com Slack

```javascript
// Configurar integração completa do Slack
function setupSlackIntegration() {
    const slackIntegration = {
        slack: {
            start: true,
            startKeyword: 'iniciar ri',
            finish: true,
            finishCommand: '/ridec finish ri'
        },
        conditions: {
            time: true,
            startTime: '08:00',
            endTime: '18:00',
            user: true,
            users: 'usuario1@exemplo.com, usuario2@exemplo.com'
        },
        actions: {
            notification: true,
            notificationMessage: 'Etapa {stage} do RIDEC {ridec} foi {trigger}ada via Slack',
            log: true,
            webhook: true,
            webhookUrl: 'https://api.exemplo.com/webhook/ridec-slack'
        }
    };
    
    configureStageIntegration(ridecId, 'RI', slackIntegration);
}
```

#### Integração com Jira

```javascript
// Configurar integração com Jira
function setupJiraIntegration() {
    const jiraIntegration = {
        jira: {
            start: true,
            startStatus: 'in-progress',
            finish: true,
            finishStatus: 'done'
        },
        conditions: {
            priority: true
        },
        actions: {
            notification: true,
            notificationMessage: 'Jira: Ticket {ticket} alterou status para {status}',
            log: true
        }
    };
    
    configureStageIntegration(ridecId, 'D', jiraIntegration);
}
```

## 🔧 API de Integração

### Métodos Principais

#### `processIntegrationTrigger(ridecId, stage, trigger, system, data)`
Processa um trigger de integração.

```javascript
ridecSystem.processIntegrationTrigger(
    'ridec-id', 
    'RI', 
    'start', 
    'slack', 
    { message: 'Trigger iniciado' }
);
```

#### `simulateIntegrationTrigger(ridecId, stage, system, trigger)`
Simula um trigger para testes.

```javascript
ridecSystem.simulateIntegrationTrigger('ridec-id', 'RI', 'slack', 'start');
```

#### `getIntegrationLogs(stage)`
Obtém logs de integração de uma etapa.

```javascript
const logs = ridecSystem.getIntegrationLogs('RI');
console.log(logs);
```

### Sistemas Suportados

| Sistema | Configuração | Triggers |
|---------|-------------|----------|
| **Slack** | Webhook URL, Canal | Mensagens, Comandos |
| **Jira** | API URL, Token | Status de Tickets |
| **Teams** | Webhook URL | Mensagens |
| **Email** | SMTP, Credenciais | Assuntos |
| **Webhook** | URLs Customizadas | POST/PUT |
| **Calendar** | API Key | Eventos |

## 📊 Visualizações

### 1. Visualização em Cards
- Cards organizados por área
- Indicadores visuais de status
- Ações rápidas em cada card

### 2. Visualização em Fluxo
- Diagrama de fluxo dos processos
- Conexões entre RIDECs
- Status visual de cada etapa

### 3. Visualização em Gráficos
- Gráficos de pizza por área
- Estatísticas de tempo
- Indicadores de performance

## 🔔 Sistema de Notificações

- **Notificações em Tempo Real**: Alertas instantâneos
- **Histórico de Notificações**: Registro completo
- **Tipos de Notificação**: Sucesso, Aviso, Erro, Info
- **Integração com Sistemas Externos**: Envio automático

## 📝 Logs e Auditoria

### Logs de Integração
- Registro de todos os triggers
- Detalhes de sistemas externos
- Timestamps precisos
- Status de execução

### Logs de Sistema
- Ações do usuário
- Mudanças de estado
- Erros e exceções
- Performance

## 🎨 Personalização

### Temas e Cores
- Interface moderna e intuitiva
- Cores suaves e profissionais
- Ícones modernos
- Responsivo para mobile

### Configurações
- Unidades de tempo configuráveis
- Áreas personalizáveis
- Triggers customizáveis
- Webhooks personalizados

## 🚀 Funcionalidades Avançadas

### IA Integrada
- Chat inteligente para sugestões
- Criação automática de RIDECs
- Análise de processos
- Recomendações de otimização

### Automação
- Triggers automáticos
- Ações em lote
- Sincronização com sistemas externos
- Relatórios automáticos

## 📱 Responsividade

- **Desktop**: Interface completa com todas as funcionalidades
- **Tablet**: Layout adaptado para telas médias
- **Mobile**: Interface otimizada para smartphones

## 🔒 Segurança

- **Dados Locais**: Armazenamento seguro no navegador
- **Configurações Criptografadas**: Tokens e senhas protegidos
- **Validação de Entrada**: Verificação de dados
- **Logs de Auditoria**: Rastreamento de ações

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Documentação**: Consulte este README
- **Exemplos**: Veja o arquivo `integration-example.js`
- **Issues**: Reporte problemas no GitHub
- **Discussions**: Participe das discussões da comunidade

## 🔄 Changelog

### v2.0.0 - Integrações Avançadas
- ✅ Sistema completo de integrações
- ✅ Triggers automáticos
- ✅ Configuração visual intuitiva
- ✅ Logs detalhados
- ✅ Testes de conectividade
- ✅ Webhooks personalizados

### v1.0.0 - Funcionalidades Básicas
- ✅ Controle de RIDECs
- ✅ Cronômetros
- ✅ Kanban Board
- ✅ Gráficos e relatórios
- ✅ Sistema de notificações

---

**Desenvolvido com ❤️ para otimizar o controle de processos empresariais** 
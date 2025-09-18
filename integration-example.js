// Exemplo de uso das funcionalidades de integração do Sistema RIDEC
// Este arquivo demonstra como configurar e usar as integrações com sistemas externos

// ============================================================================
// CONFIGURAÇÃO DE SISTEMAS EXTERNOS
// ============================================================================

// Exemplo 1: Configuração do Slack
const slackConfig = {
    webhook_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    channel: '#ridec-integrations',
    start_message: '/ridec start {stage}',
    finish_message: '/ridec finish {stage}'
};

// Exemplo 2: Configuração do Jira
const jiraConfig = {
    api_url: 'https://your-domain.atlassian.net',
    username: 'seu-email@exemplo.com',
    api_token: 'seu-token-de-api',
    project_key: 'PROJ'
};

// Exemplo 3: Configuração de Webhook Customizado
const webhookConfig = {
    start_url: 'https://api.exemplo.com/ridec/start',
    finish_url: 'https://api.exemplo.com/ridec/finish',
    api_key: 'sua-chave-de-api'
};

// ============================================================================
// EXEMPLOS DE USO DAS FUNCIONALIDADES
// ============================================================================

// Função para configurar um sistema externo
function configureExternalSystem(system, config) {
    localStorage.setItem(`system_config_${system}`, JSON.stringify(config));
    console.log(`Sistema ${system} configurado com sucesso!`);
}

// Função para configurar integração de uma etapa específica
function configureStageIntegration(ridecId, stage, integrationConfig) {
    const ridecSystem = window.ridecSystem;
    const ridec = ridecSystem.ridecs.find(r => r.id === ridecId);
    
    if (!ridec) {
        console.error('RIDEC não encontrado');
        return;
    }
    
    if (!ridec.integrations) {
        ridec.integrations = {};
    }
    
    ridec.integrations[stage] = integrationConfig;
    ridecSystem.saveToLocalStorage();
    ridecSystem.renderRidecList();
    
    console.log(`Integração configurada para etapa ${stage} do RIDEC ${ridec.title}`);
}

// ============================================================================
// EXEMPLOS PRÁTICOS
// ============================================================================

// Exemplo 1: Configurar integração completa do Slack
function setupSlackIntegration() {
    // Configurar sistema Slack
    configureExternalSystem('slack', slackConfig);
    
    // Configurar integração para etapa RI
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
    
    // Aplicar a um RIDEC específico (substitua pelo ID real)
    const ridecId = 'exemplo-ridec-id';
    configureStageIntegration(ridecId, 'RI', slackIntegration);
}

// Exemplo 2: Configurar integração com Jira
function setupJiraIntegration() {
    // Configurar sistema Jira
    configureExternalSystem('jira', jiraConfig);
    
    // Configurar integração para etapa D
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
    
    const ridecId = 'exemplo-ridec-id';
    configureStageIntegration(ridecId, 'D', jiraIntegration);
}

// Exemplo 3: Configurar webhook customizado
function setupCustomWebhook() {
    // Configurar sistema webhook
    configureExternalSystem('webhook', webhookConfig);
    
    // Configurar integração para etapa E
    const webhookIntegration = {
        webhook: {
            start: true,
            finish: true
        },
        conditions: {
            time: true,
            startTime: '09:00',
            endTime: '17:00'
        },
        actions: {
            notification: true,
            notificationMessage: 'Webhook externo acionado para etapa {stage}',
            log: true,
            webhook: true,
            webhookUrl: 'https://api.exemplo.com/notifications'
        }
    };
    
    const ridecId = 'exemplo-ridec-id';
    configureStageIntegration(ridecId, 'E', webhookIntegration);
}

// ============================================================================
// FUNÇÕES DE TESTE E SIMULAÇÃO
// ============================================================================

// Função para testar todas as integrações
function testAllIntegrations() {
    const ridecSystem = window.ridecSystem;
    const ridecId = 'exemplo-ridec-id';
    
    // Testar triggers de início
    console.log('Testando triggers de início...');
    ridecSystem.simulateIntegrationTrigger(ridecId, 'RI', 'slack', 'start');
    ridecSystem.simulateIntegrationTrigger(ridecId, 'D', 'jira', 'start');
    ridecSystem.simulateIntegrationTrigger(ridecId, 'E', 'webhook', 'start');
    
    // Aguardar um pouco e testar triggers de finalização
    setTimeout(() => {
        console.log('Testando triggers de finalização...');
        ridecSystem.simulateIntegrationTrigger(ridecId, 'RI', 'slack', 'finish');
        ridecSystem.simulateIntegrationTrigger(ridecId, 'D', 'jira', 'finish');
        ridecSystem.simulateIntegrationTrigger(ridecId, 'E', 'webhook', 'finish');
    }, 3000);
}

// Função para verificar logs de integração
function checkIntegrationLogs() {
    const ridecSystem = window.ridecSystem;
    const stages = ['RI', 'D', 'E', 'C'];
    
    stages.forEach(stage => {
        const logs = ridecSystem.getIntegrationLogs(stage);
        console.log(`Logs da etapa ${stage}:`, logs);
    });
}

// Função para limpar logs de integração
function clearIntegrationLogs() {
    localStorage.removeItem('integration_logs');
    console.log('Logs de integração limpos!');
}

// ============================================================================
// EXEMPLOS DE WEBHOOKS EXTERNOS
// ============================================================================

// Exemplo de webhook que pode ser chamado pelo sistema
function exampleWebhookHandler(data) {
    console.log('Webhook recebido:', data);
    
    // Exemplo de processamento dos dados
    const { ridecId, ridecTitle, stage, system, trigger, timestamp } = data;
    
    // Enviar notificação para outro sistema
    sendNotificationToExternalSystem({
        title: `RIDEC ${trigger}ado`,
        message: `Etapa ${stage} do RIDEC ${ridecTitle} foi ${trigger}ada via ${system}`,
        timestamp: new Date(timestamp).toISOString(),
        priority: 'medium'
    });
    
    // Registrar em banco de dados
    logToDatabase({
        event: 'ridec_integration',
        ridecId,
        stage,
        system,
        trigger,
        timestamp
    });
}

// Função para enviar notificação para sistema externo
function sendNotificationToExternalSystem(notification) {
    // Implementar envio para sistema de notificações
    console.log('Enviando notificação:', notification);
}

// Função para registrar em banco de dados
function logToDatabase(logEntry) {
    // Implementar registro em banco de dados
    console.log('Registrando no banco:', logEntry);
}

// ============================================================================
// CONFIGURAÇÕES AVANÇADAS
// ============================================================================

// Exemplo de configuração avançada com múltiplos sistemas
function setupAdvancedIntegration() {
    const advancedConfig = {
        slack: {
            start: true,
            startKeyword: 'iniciar processo',
            finish: true,
            finishCommand: '/ridec complete'
        },
        jira: {
            start: true,
            startStatus: 'in-progress',
            finish: true,
            finishStatus: 'done'
        },
        email: {
            start: true,
            startSubject: 'Início de Processo',
            finish: true,
            finishSubject: 'Processo Concluído'
        },
        conditions: {
            time: true,
            startTime: '08:30',
            endTime: '17:30',
            user: true,
            users: 'admin@exemplo.com, gerente@exemplo.com',
            priority: true
        },
        actions: {
            notification: true,
            notificationMessage: 'Processo {ridec} - Etapa {stage} {trigger}ada via {system}',
            log: true,
            webhook: true,
            webhookUrl: 'https://api.exemplo.com/process-management'
        }
    };
    
    const ridecId = 'exemplo-ridec-id';
    configureStageIntegration(ridecId, 'C', advancedConfig);
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

// Função para obter configuração de um sistema
function getSystemConfig(system) {
    return JSON.parse(localStorage.getItem(`system_config_${system}`)) || {};
}

// Função para listar todos os sistemas configurados
function listConfiguredSystems() {
    const systems = ['slack', 'jira', 'teams', 'email', 'webhook', 'calendar'];
    const configured = {};
    
    systems.forEach(system => {
        const config = getSystemConfig(system);
        if (Object.keys(config).length > 0) {
            configured[system] = config;
        }
    });
    
    return configured;
}

// Função para validar configuração de sistema
function validateSystemConfig(system, config) {
    const validators = {
        slack: (config) => {
            return config.webhook_url && config.webhook_url.includes('hooks.slack.com');
        },
        jira: (config) => {
            return config.api_url && config.username && config.api_token;
        },
        webhook: (config) => {
            return config.start_url && config.finish_url;
        }
    };
    
    const validator = validators[system];
    return validator ? validator(config) : true;
}

// ============================================================================
// INSTRUÇÕES DE USO
// ============================================================================

console.log(`
=== SISTEMA RIDEC - INTEGRAÇÕES ===

Para usar as funcionalidades de integração:

1. Configure os sistemas externos:
   - setupSlackIntegration()
   - setupJiraIntegration()
   - setupCustomWebhook()

2. Teste as integrações:
   - testAllIntegrations()
   - checkIntegrationLogs()

3. Configureções avançadas:
   - setupAdvancedIntegration()

4. Utilitários:
   - listConfiguredSystems()
   - validateSystemConfig('slack', config)
   - clearIntegrationLogs()

Para mais informações, consulte a documentação do sistema.
`);

// Exportar funções para uso global
window.ridecIntegrationExamples = {
    setupSlackIntegration,
    setupJiraIntegration,
    setupCustomWebhook,
    setupAdvancedIntegration,
    testAllIntegrations,
    checkIntegrationLogs,
    clearIntegrationLogs,
    listConfiguredSystems,
    validateSystemConfig,
    getSystemConfig
}; 
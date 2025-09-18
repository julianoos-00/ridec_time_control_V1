// Sistema RIDEC - Controle de Processos
class RIDECSystem {
    constructor() {
        this.ridecs = JSON.parse(localStorage.getItem('ridecs')) || [];
        this.currentRidecId = null;
        this.notificationId = 0;
        this.overdueCheckInterval = null;
        this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        this.notificationDropdownVisible = false;
        this.chatOpened = false;
        this.showAiWelcome = true;
        this.currentView = 'card';
        
        this.initializeEventListeners();
        this.checkAndCleanResidualData(); // Verificar e limpar dados residuais
        
        // VERIFICAÇÃO ADICIONAL - Garantir que não há dados residuais
        this.ensureCleanState();
        
        this.renderRidecList();
        this.startOverdueMonitoring();
        this.loadSampleData();
        this.updateNotificationCount();
        this.checkForEditRidec();
        this.showAiWelcomeMessage();
        

    }

    // Inicializar event listeners
    initializeEventListeners() {
        // Botão novo RIDEC
        document.getElementById('newRidecBtn').addEventListener('click', () => {
            this.openRidecModal();
        });

        // Botão criação automática com IA
        document.getElementById('autoCreateRidecBtn').addEventListener('click', () => {
            this.openAutoCreateModal();
        });

        // Botão deletar todos os RIDECs
        document.getElementById('deleteAllBtn').addEventListener('click', () => {
            this.deleteAllRidecs();
        });

        // Botão resetar configuração
        document.getElementById('resetConfigBtn').addEventListener('click', () => {
            this.resetToDefaultConfiguration();
        });

        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Botão de ocorrências
        document.getElementById('occurrencesBtn').addEventListener('click', () => {
            window.location.href = 'ridec-occurrences.html';
        });

        // Botão de cadastros
        document.getElementById('cadastroBtn').addEventListener('click', () => {
            window.location.href = 'cadastro.html';
        });

        // Event listeners para o modal de criação automática
        document.getElementById('closeAutoCreateModal').addEventListener('click', () => {
            this.closeAutoCreateModal();
        });

        document.getElementById('cancelAutoCreateBtn').addEventListener('click', () => {
            this.closeAutoCreateModal();
        });

        document.getElementById('createRidecsBtn').addEventListener('click', () => {
            this.processAutoCreate();
        });

        // Fechar modal ao clicar fora dele
        document.getElementById('autoCreateModal').addEventListener('click', (e) => {
            if (e.target.id === 'autoCreateModal') {
                this.closeAutoCreateModal();
            }
        });

        // View Toggle
        document.getElementById('cardViewBtn').addEventListener('click', () => {
            this.switchToCardView();
        });

        document.getElementById('flowViewBtn').addEventListener('click', () => {
            this.switchToFlowView();
        });



        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterRidecs(e.target.value);
        });

        // Clear search
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.filterRidecs('');
        });

        // Charts View Button
        document.getElementById('chartsViewBtn').addEventListener('click', () => {
            this.switchToChartsView();
        });

        // Modal RIDEC
        const ridecModal = document.getElementById('ridecModal');
        const closeBtn = ridecModal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBtn');

        closeBtn.addEventListener('click', () => this.closeRidecModal());
        cancelBtn.addEventListener('click', () => this.closeRidecModal());
        saveBtn.addEventListener('click', () => this.saveRidec());

        // Event listeners para navegação de etapas do modal moderno
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());

        // Modal Etapa A
        const stageAModal = document.getElementById('stageAModal');
        const closeStageABtn = stageAModal.querySelector('.close');
        const cancelStageABtn = document.getElementById('cancelStageABtn');
        const saveStageABtn = document.getElementById('saveStageABtn');

        closeStageABtn.addEventListener('click', () => this.closeStageAModal());
        cancelStageABtn.addEventListener('click', () => this.closeStageAModal());
        saveStageABtn.addEventListener('click', () => this.saveStageA());

        // Event listeners para sistema de notificações
        document.getElementById('notificationBell').addEventListener('click', () => {
            this.toggleNotificationDropdown();
        });

        document.getElementById('clearAllNotifications').addEventListener('click', () => {
            this.clearAllNotifications();
        });

        // Event listeners para chat com IA
        document.getElementById('aiChatBtn').addEventListener('click', () => {
            this.openAiChat();
        });

        document.getElementById('closeAiChat').addEventListener('click', () => {
            this.closeAiChat();
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Fechar dropdown de notificações ao clicar fora
        document.addEventListener('click', (e) => {
            const notificationBell = document.getElementById('notificationBell');
            const notificationDropdown = document.getElementById('notificationDropdown');
            
            if (!notificationBell.contains(e.target) && !notificationDropdown.contains(e.target)) {
                this.hideNotificationDropdown();
            }
        });

        // Fechar chat ao clicar fora
        window.addEventListener('click', (e) => {
            const aiChatModal = document.getElementById('aiChatModal');
            if (e.target === aiChatModal) {
                this.closeAiChat();
            }
        });

        // Fechar modais ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === ridecModal) this.closeRidecModal();
            if (e.target === stageAModal) this.closeStageAModal();
        });

        // Event listener para mudança de unidade de tempo
        document.getElementById('ridecTimeUnit').addEventListener('change', () => {
            this.updateTimeUnitLabels();
        });
    }

    // Carregar dados de exemplo
    loadSampleData() {
        if (this.ridecs.length === 0) {
            const ridec1 = {
                id: this.generateId(),
                title: 'Análise de Requisitos',
                description: 'Coleta e análise dos requisitos do sistema',
                area: 'Desenvolvimento',
                timeUnit: 'hours',
                maxTime: 20,
                deadlines: { RI: 4, D: 6, E: 8, C: 2 },
                deadlineUnits: { RI: 'hours', D: 'hours', E: 'hours', C: 'hours' },
                stageA: null,
                currentStage: 'RI',
                startTime: Date.now() - (2 * 60 * 60 * 1000), // 2 horas atrás
                stageStartTime: Date.now() - (2 * 60 * 60 * 1000),
                relations: { start: null, end: null },
                completed: false
            };

            const ridec2 = {
                id: this.generateId(),
                title: 'Desenvolvimento Frontend',
                description: 'Implementação da interface do usuário',
                area: 'Desenvolvimento',
                timeUnit: 'hours',
                maxTime: 35,
                deadlines: { RI: 6, D: 10, E: 15, C: 4 },
                deadlineUnits: { RI: 'hours', D: 'hours', E: 'hours', C: 'hours' },
                stagesA: [
                    { 
                        position: 'd-e', 
                        deadline: 8, 
                        timeUnit: 'hours',
                        description: 'Revisão de Design e Interface', 
                        identifier: 'Revisão Design',
                        startTime: Date.now() 
                    },
                    { 
                        position: 'e-c', 
                        deadline: 6, 
                        timeUnit: 'hours',
                        description: 'Testes de Usabilidade e Performance', 
                        identifier: 'Testes Usabilidade',
                        startTime: Date.now() 
                    }
                ],
                currentStage: 'D',
                startTime: Date.now() - (1 * 60 * 60 * 1000), // 1 hora atrás
                stageStartTime: Date.now() - (30 * 60 * 1000), // 30 minutos atrás
                relations: { start: ridec1.id, end: null },
                completed: false
            };

            const ridec3 = {
                id: this.generateId(),
                title: 'Desenvolvimento Backend',
                description: 'Implementação da lógica de negócio',
                area: 'Desenvolvimento',
                timeUnit: 'hours',
                maxTime: 30,
                deadlines: { RI: 5, D: 8, E: 12, C: 5 },
                stageA: null,
                currentStage: 'E',
                startTime: Date.now() - (3 * 60 * 60 * 1000), // 3 horas atrás
                stageStartTime: Date.now() - (1 * 60 * 60 * 1000), // 1 hora atrás
                relations: { start: ridec1.id, end: null },
                completed: false
            };

            const ridec4 = {
                id: this.generateId(),
                title: 'Venda de Caminhão',
                description: 'Processo de venda do caminhão',
                area: 'Vendas',
                timeUnit: 'hours',
                maxTime: 20,
                deadlines: { RI: 4, D: 6, E: 8, C: 2 },
                stageA: null,
                currentStage: 'RI',
                startTime: Date.now(),
                stageStartTime: Date.now(),
                relations: { start: null, end: null },
                completed: false
            };

            const ridec5 = {
                id: this.generateId(),
                title: 'Manutenção Pós-Venda',
                description: 'Serviços de manutenção após a venda',
                area: 'Suporte',
                timeUnit: 'hours',
                maxTime: 10,
                deadlines: { RI: 2, D: 3, E: 4, C: 1 },
                stageA: null,
                currentStage: 'RI',
                startTime: Date.now(),
                stageStartTime: Date.now(),
                relations: { start: null, end: null },
                completed: false
            };

            // Configurar relacionamentos de fluxo
            ridec2.relations.start = ridec1.id; // Frontend vem depois de Análise
            ridec3.relations.start = ridec1.id; // Backend vem depois de Análise
            ridec4.relations.start = ridec2.id; // Venda vem depois de Frontend
            ridec5.relations.start = ridec4.id; // Manutenção vem depois de Venda

            // Adicionar ocorrências de exemplo
            const occurrence1 = {
                id: this.generateId(),
                title: 'Implementação de Sistema de Backup',
                description: 'Implementação de sistema de backup automatizado para servidores críticos',
                area: 'TI',
                timeUnit: 'hours',
                maxTime: 15,
                deadlines: { RI: 3, D: 5, E: 5, C: 2 },
                deadlineUnits: { RI: 'hours', D: 'hours', E: 'hours', C: 'hours' },
                stageA: null,
                currentStage: 'D',
                startTime: Date.now() - (4 * 60 * 60 * 1000), // 4 horas atrás
                stageStartTime: Date.now() - (2 * 60 * 60 * 1000), // 2 horas atrás
                relations: { start: null, end: null },
                completed: false,
                isOccurrence: true,
                stages: [
                    { name: 'Análise', status: 'completed', time: '2h 30m', timeMs: 9000000 },
                    { name: 'Desenvolvimento', status: 'active', time: '5h 45m', timeMs: 20700000 },
                    { name: 'Testes', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Deploy', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            };

            const occurrence2 = {
                id: this.generateId(),
                title: 'Atualização de Políticas de RH',
                description: 'Revisão e atualização das políticas internas de recursos humanos',
                area: 'RH',
                timeUnit: 'hours',
                maxTime: 12,
                deadlines: { RI: 2, D: 4, E: 4, C: 2 },
                deadlineUnits: { RI: 'hours', D: 'hours', E: 'hours', C: 'hours' },
                stageA: null,
                currentStage: 'C',
                startTime: Date.now() - (8 * 60 * 60 * 1000), // 8 horas atrás
                stageStartTime: Date.now() - (1 * 60 * 60 * 1000), // 1 hora atrás
                relations: { start: null, end: null },
                completed: true,
                isOccurrence: true,
                stages: [
                    { name: 'Revisão', status: 'completed', time: '3h 15m', timeMs: 11700000 },
                    { name: 'Aprovação', status: 'completed', time: '1h 30m', timeMs: 5400000 },
                    { name: 'Implementação', status: 'completed', time: '4h 20m', timeMs: 15600000 },
                    { name: 'Treinamento', status: 'completed', time: '2h 45m', timeMs: 9900000 }
                ]
            };

            const occurrence3 = {
                id: this.generateId(),
                title: 'Auditoria Financeira Trimestral',
                description: 'Auditoria financeira do primeiro trimestre do ano',
                area: 'Financeiro',
                timeUnit: 'hours',
                maxTime: 25,
                deadlines: { RI: 5, D: 8, E: 8, C: 4 },
                deadlineUnits: { RI: 'hours', D: 'hours', E: 'hours', C: 'hours' },
                stageA: null,
                currentStage: 'E',
                startTime: Date.now() - (12 * 60 * 60 * 1000), // 12 horas atrás
                stageStartTime: Date.now() - (3 * 60 * 60 * 1000), // 3 horas atrás
                relations: { start: null, end: null },
                completed: false,
                isOccurrence: true,
                stages: [
                    { name: 'Coleta de Dados', status: 'completed', time: '6h 20m', timeMs: 22800000 },
                    { name: 'Análise', status: 'active', time: '8h 15m', timeMs: 29700000 },
                    { name: 'Relatório', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Apresentação', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            };

            const occurrence4 = {
                id: this.generateId(),
                title: 'Otimização de Processos Operacionais',
                description: 'Análise e otimização dos processos operacionais da empresa',
                area: 'Operacional',
                timeUnit: 'hours',
                maxTime: 18,
                deadlines: { RI: 4, D: 6, E: 6, C: 2 },
                deadlineUnits: { RI: 'hours', D: 'hours', E: 'hours', C: 'hours' },
                stageA: null,
                currentStage: 'RI',
                startTime: Date.now() - (1 * 60 * 60 * 1000), // 1 hora atrás
                stageStartTime: Date.now() - (30 * 60 * 1000), // 30 minutos atrás
                relations: { start: null, end: null },
                completed: false,
                isOccurrence: true,
                stages: [
                    { name: 'Mapeamento', status: 'active', time: '1h 30m', timeMs: 5400000 },
                    { name: 'Análise', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Proposta', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Implementação', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            };

            this.ridecs.push(ridec1, ridec2, ridec3, ridec4, ridec5, occurrence1, occurrence2, occurrence3, occurrence4);
            this.saveToLocalStorage();
            this.renderRidecList();
        }
    }

    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Abrir modal RIDEC
    openRidecModal(ridecId = null) {
        const modal = document.getElementById('ridecModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('ridecForm');

        this.currentRidecId = ridecId;

        if (ridecId) {
            const ridec = this.ridecs.find(r => r.id === ridecId);
            if (ridec) {
                if (ridec.isOccurrence) {
                    modalTitle.textContent = 'Editar Ocorrência';
                } else {
                    modalTitle.textContent = 'Editar RIDEC Modelo';
                }
                this.populateRidecForm(ridec);
            }
        } else {
            modalTitle.textContent = 'Novo RIDEC Modelo';
            form.reset();
        }

        this.updateRelationsDropdowns();
        this.initializeModernModal();
        modal.style.display = 'block';
    }

    // Inicializar modal moderno
    initializeModernModal() {
        this.currentStep = 1;
        this.updateStepNavigation();
        this.initializeFormValidation();
        this.initializeCharCounter();
    }

    // Atualizar navegação de etapas
    updateStepNavigation() {
        const progressSteps = document.querySelectorAll('.progress-step');
        const formSteps = document.querySelectorAll('.form-step');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const saveBtn = document.getElementById('saveBtn');

        // Atualizar indicadores de progresso
        progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Atualizar visibilidade das etapas
        formSteps.forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Atualizar botões
        prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        nextBtn.style.display = this.currentStep < 3 ? 'flex' : 'none';
        saveBtn.style.display = this.currentStep === 3 ? 'flex' : 'none';
    }

    // Navegar para próxima etapa
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < 3) {
                this.currentStep++;
                this.updateStepNavigation();
            }
        }
    }

    // Navegar para etapa anterior
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepNavigation();
        }
    }

    // Validar etapa atual
    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'Este campo é obrigatório');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Para o passo 2 (Configuração de Tempo), permitir campos vazios para modelos
        if (this.currentStep === 2) {
            const timeFields = currentStepElement.querySelectorAll('input[type="number"]');
            timeFields.forEach(field => {
                if (field.value.trim() === '') {
                    // Campo vazio é permitido para modelos, apenas limpar erro se existir
                    this.clearFieldError(field);
                } else if (parseInt(field.value) <= 0) {
                    this.showFieldError(field, 'O valor deve ser maior que zero');
                    isValid = false;
                } else {
                    this.clearFieldError(field);
                }
            });
        }

        return isValid;
    }

    // Inicializar validação de formulário
    initializeFormValidation() {
        const titleInput = document.getElementById('ridecTitle');
        const descriptionTextarea = document.getElementById('ridecDescription');

        // Validação em tempo real do título
        titleInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length < 3) {
                this.showFieldError(e.target, 'Título deve ter pelo menos 3 caracteres');
            } else if (value.length > 100) {
                this.showFieldError(e.target, 'Título deve ter no máximo 100 caracteres');
            } else {
                this.showFieldSuccess(e.target);
            }
        });

        // Validação da descrição
        descriptionTextarea.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length > 500) {
                this.showFieldError(e.target, 'Descrição deve ter no máximo 500 caracteres');
            } else {
                this.clearFieldError(e.target);
            }
        });

        // Inicializar funcionalidade de unificação de tempo
        this.initializeUnifiedTimeOption();
        
        // Inicializar controle de modo de tempo
        this.initializeTimeControlMode();
    }

    // Inicializar controle de modo de tempo
    initializeTimeControlMode() {
        const detailedMode = document.getElementById('detailedMode');
        const simpleMode = document.getElementById('simpleMode');
        const detailedSection = document.getElementById('detailedTimeSection');

        if (!detailedMode || !simpleMode || !detailedSection) return;

        // Função para alternar visibilidade
        const toggleDetailedSection = () => {
            if (detailedMode.checked) {
                detailedSection.style.display = 'block';
                detailedSection.style.opacity = '1';
                detailedSection.style.transform = 'translateY(0)';
            } else {
                detailedSection.style.opacity = '0';
                detailedSection.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    detailedSection.style.display = 'none';
                }, 300);
            }
        };

        // Event listeners
        detailedMode.addEventListener('change', toggleDetailedSection);
        simpleMode.addEventListener('change', toggleDetailedSection);

        // Inicializar estado
        toggleDetailedSection();
    }

    // Inicializar opção de unificação de tempo
    initializeUnifiedTimeOption() {
        const unifiedCheckbox = document.getElementById('useUnifiedTime');
        const unifiedSelector = document.querySelector('.unified-time-selector');
        const unifiedSelect = document.getElementById('unifiedTimeUnit');
        const stageSelects = ['unitRI', 'unitD', 'unitE', 'unitC'].map(id => document.getElementById(id));
        const deadlineCards = document.querySelectorAll('.deadline-card');

        if (!unifiedCheckbox) return;

        // Event listener para o checkbox
        unifiedCheckbox.addEventListener('change', (e) => {
            const isUnified = e.target.checked;
            
            if (isUnified) {
                // Mostrar seletor unificado
                unifiedSelector.style.display = 'flex';
                setTimeout(() => {
                    unifiedSelector.classList.add('show');
                }, 10);
                
                // Desabilitar selects individuais
                stageSelects.forEach(select => {
                    select.disabled = true;
                    select.classList.add('disabled');
                });
                
                // Adicionar classe visual aos cards
                deadlineCards.forEach(card => {
                    card.classList.add('unified');
                });
                
                // Aplicar unidade selecionada
                this.applyUnifiedTimeUnit(unifiedSelect.value);
                
            } else {
                // Esconder seletor unificado
                unifiedSelector.classList.remove('show');
                setTimeout(() => {
                    unifiedSelector.style.display = 'none';
                }, 300);
                
                // Habilitar selects individuais
                stageSelects.forEach(select => {
                    select.disabled = false;
                    select.classList.remove('disabled');
                });
                
                // Remover classe visual dos cards
                deadlineCards.forEach(card => {
                    card.classList.remove('unified');
                });
            }
        });

        // Event listener para mudança na unidade unificada
        unifiedSelect.addEventListener('change', (e) => {
            if (unifiedCheckbox.checked) {
                this.applyUnifiedTimeUnit(e.target.value);
            }
        });
    }

    // Aplicar unidade de tempo unificada
    applyUnifiedTimeUnit(unit) {
        const stageSelects = ['unitRI', 'unitD', 'unitE', 'unitC'].map(id => document.getElementById(id));
        
        stageSelects.forEach(select => {
            select.value = unit;
        });
        
        // Atualizar labels se necessário
        this.updateTimeUnitLabels();
    }

    // Mostrar erro no campo
    showFieldError(field, message) {
        field.classList.remove('valid');
        field.classList.add('error');
        
        const feedback = field.parentElement.querySelector('.input-feedback') || 
                        field.parentElement.parentElement.querySelector('.input-feedback');
        
        if (feedback) {
            feedback.textContent = message;
            feedback.className = 'input-feedback error';
        }
    }

    // Mostrar sucesso no campo
    showFieldSuccess(field) {
        field.classList.remove('error');
        field.classList.add('valid');
        
        const feedback = field.parentElement.querySelector('.input-feedback') || 
                        field.parentElement.parentElement.querySelector('.input-feedback');
        
        if (feedback) {
            feedback.textContent = 'Campo válido';
            feedback.className = 'input-feedback success';
        }
    }

    // Limpar erro do campo
    clearFieldError(field) {
        field.classList.remove('error', 'valid');
        
        const feedback = field.parentElement.querySelector('.input-feedback') || 
                        field.parentElement.parentElement.querySelector('.input-feedback');
        
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        }
    }

    // Inicializar contador de caracteres
    initializeCharCounter() {
        const descriptionTextarea = document.getElementById('ridecDescription');
        const currentChars = document.querySelector('.current-chars');
        const maxChars = document.querySelector('.max-chars');

        if (descriptionTextarea && currentChars) {
            descriptionTextarea.addEventListener('input', (e) => {
                const length = e.target.value.length;
                currentChars.textContent = length;
                
                if (length > 450) {
                    currentChars.style.color = '#e53e3e';
                } else if (length > 400) {
                    currentChars.style.color = '#ed8936';
                } else {
                    currentChars.style.color = '#64748b';
                }
            });
        }
    }

    // Abrir modal de criação automática
    openAutoCreateModal() {
        document.getElementById('autoCreateModal').style.display = 'block';
        document.getElementById('processDescription').value = '';
        document.getElementById('processDescription').focus();
    }

    // Fechar modal de criação automática
    closeAutoCreateModal() {
        document.getElementById('autoCreateModal').style.display = 'none';
    }

    // Preencher exemplo no textarea
    fillExample(type) {
        const examples = {
            'desenvolvimento': 'Processo de desenvolvimento de software que leva 40 horas, com análise de requisitos (8h), codificação (20h), testes (8h) e documentação (4h), responsabilidade da área de TI.',
            'aprovacao': 'Fluxo de aprovação de documentos que leva 24 horas, com revisão técnica (8h), validação gerencial (8h) e aprovação final (8h), responsabilidade da área administrativa.',
            'onboarding': 'Processo de onboarding de funcionários que leva 5 dias, com documentação (1 dia), treinamento (2 dias), integração (1 dia) e avaliação (1 dia), responsabilidade da área de RH.'
        };
        
        document.getElementById('processDescription').value = examples[type] || '';
    }

    // Processar criação automática
    processAutoCreate() {
        const description = document.getElementById('processDescription').value.trim();
        
        if (!description) {
            this.showNotification('Por favor, descreva seu processo para que a IA possa criar os RIDECs automaticamente.', 'warning', false);
            return;
        }

        // Mostrar loading
        const createBtn = document.getElementById('createRidecsBtn');
        const originalText = createBtn.innerHTML;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando RIDECs...';
        createBtn.disabled = true;

        // Simular processamento da IA
        setTimeout(() => {
            try {
                const createdRidecs = this.createRidecsFromDescription(description);
                
                if (createdRidecs.length > 0) {
                    this.showNotification(`✅ ${createdRidecs.length} RIDEC(s) criado(s) automaticamente com sucesso!`, 'success', false);
                    this.closeAutoCreateModal();
                    this.renderRidecList();
                } else {
                    this.showNotification('Não foi possível identificar um processo válido na descrição. Tente ser mais específico sobre etapas, prazos e responsabilidades.', 'warning', false);
                }
            } catch (error) {
                this.showNotification('Erro ao criar RIDECs automaticamente. Tente novamente.', 'error', false);
                console.error('Erro na criação automática:', error);
            } finally {
                // Restaurar botão
                createBtn.innerHTML = originalText;
                createBtn.disabled = false;
            }
        }, 2000);
    }

    // Fechar modal RIDEC
    closeRidecModal() {
        document.getElementById('ridecModal').style.display = 'none';
        this.currentRidecId = null;
    }

    // Preencher formulário RIDEC
    populateRidecForm(ridec) {
        document.getElementById('ridecTitle').value = ridec.title;
        document.getElementById('ridecDescription').value = ridec.description;
        document.getElementById('ridecArea').value = ridec.area || '';
        document.getElementById('ridecTimeUnit').value = ridec.timeUnit || 'hours';
        document.getElementById('ridecMaxTime').value = ridec.maxTime || '';
        
        // Definir modo de controle de tempo
        const timeControlMode = ridec.timeControlMode || 'detailed';
        document.getElementById(timeControlMode === 'detailed' ? 'detailedMode' : 'simpleMode').checked = true;
        
        // Atualizar visibilidade da seção detalhada
        this.initializeTimeControlMode();
        
        document.getElementById('deadlineRI').value = ridec.deadlines?.RI || '';
        document.getElementById('deadlineD').value = ridec.deadlines?.D || '';
        document.getElementById('deadlineE').value = ridec.deadlines?.E || '';
        document.getElementById('deadlineC').value = ridec.deadlines?.C || '';
        
        // Carregar unidades individuais das etapas
        if (ridec.deadlineUnits) {
            document.getElementById('unitRI').value = ridec.deadlineUnits.RI || 'hours';
            document.getElementById('unitD').value = ridec.deadlineUnits.D || 'hours';
            document.getElementById('unitE').value = ridec.deadlineUnits.E || 'hours';
            document.getElementById('unitC').value = ridec.deadlineUnits.C || 'hours';
        } else {
            // Fallback para RIDECs antigos
            document.getElementById('unitRI').value = 'hours';
            document.getElementById('unitD').value = 'hours';
            document.getElementById('unitE').value = 'hours';
            document.getElementById('unitC').value = 'hours';
        }
        
        document.getElementById('startRidec').value = ridec.relations.start || '';
        document.getElementById('endRidec').value = ridec.relations.end || '';
        
        // Atualizar labels das unidades de tempo
        this.updateTimeUnitLabels();
    }

    // Atualizar dropdowns de relacionamentos
    updateRelationsDropdowns() {
        const startSelect = document.getElementById('startRidec');
        const endSelect = document.getElementById('endRidec');

        // Limpar opções existentes
        startSelect.innerHTML = '<option value="">Nenhum</option>';
        endSelect.innerHTML = '<option value="">Nenhum</option>';


        const modelRidecs = this.ridecs.filter(ridec => 
            ridec && 
            ridec.id && 
            ridec.title && 
            !ridec.isOccurrence && 
            !ridec.occurrenceNumber
        );

        // Adicionar opções apenas dos RIDECs modelo
        modelRidecs.forEach(ridec => {
            if (ridec.id !== this.currentRidecId) {
                const startOption = document.createElement('option');
                startOption.value = ridec.id;
                startOption.textContent = ridec.title;
                startSelect.appendChild(startOption);

                const endOption = document.createElement('option');
                endOption.value = ridec.id;
                endOption.textContent = ridec.title;
                endSelect.appendChild(endOption);
            }
        });
    }

    // Salvar RIDEC
    saveRidec() {
        const form = document.getElementById('ridecForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Validar relações para garantir que apenas RIDECs modelo sejam referenciados
        const startRidecId = document.getElementById('startRidec').value || null;
        const endRidecId = document.getElementById('endRidec').value || null;
        
        // Verificar se as relações são válidas (apenas RIDECs modelo)
        if (startRidecId) {
            const startRidec = this.ridecs.find(r => r.id === startRidecId);
            if (startRidec && (startRidec.isOccurrence || startRidec.occurrenceNumber)) {
                this.showNotification('Erro: RIDEC de início deve ser um modelo, não uma ocorrência', 'error', false);
                return;
            }
        }
        
        if (endRidecId) {
            const endRidec = this.ridecs.find(r => r.id === endRidecId);
            if (endRidec && (endRidec.isOccurrence || endRidec.occurrenceNumber)) {
                this.showNotification('Erro: RIDEC de fim deve ser um modelo, não uma ocorrência', 'error', false);
                return;
            }
        }

        // Coletar dados dos campos de tempo, permitindo valores vazios
        const maxTimeValue = document.getElementById('ridecMaxTime').value;
        const timeControlMode = document.querySelector('input[name="timeControlMode"]:checked').value;
        
        let deadlines = {};
        let deadlineUnits = {};
        
        if (timeControlMode === 'detailed') {
            const deadlineRIValue = document.getElementById('deadlineRI').value;
            const deadlineDValue = document.getElementById('deadlineD').value;
            const deadlineEValue = document.getElementById('deadlineE').value;
            const deadlineCValue = document.getElementById('deadlineC').value;
            
            deadlines = {
                RI: deadlineRIValue ? parseInt(deadlineRIValue) : null,
                D: deadlineDValue ? parseInt(deadlineDValue) : null,
                E: deadlineEValue ? parseInt(deadlineEValue) : null,
                C: deadlineCValue ? parseInt(deadlineCValue) : null
            };
            
            deadlineUnits = {
                RI: document.getElementById('unitRI').value,
                D: document.getElementById('unitD').value,
                E: document.getElementById('unitE').value,
                C: document.getElementById('unitC').value
            };
        } else {
            // Modo simples - apenas tempo total
            deadlines = {
                RI: null,
                D: null,
                E: null,
                C: null
            };
            
            deadlineUnits = {
                RI: document.getElementById('ridecTimeUnit').value,
                D: document.getElementById('ridecTimeUnit').value,
                E: document.getElementById('ridecTimeUnit').value,
                C: document.getElementById('ridecTimeUnit').value
            };
        }

        const ridecData = {
            title: document.getElementById('ridecTitle').value,
            description: document.getElementById('ridecDescription').value,
            area: document.getElementById('ridecArea').value,
            timeUnit: document.getElementById('ridecTimeUnit').value,
            maxTime: maxTimeValue ? parseInt(maxTimeValue) : null,
            timeControlMode: timeControlMode,
            deadlines: deadlines,
            deadlineUnits: deadlineUnits,
            relations: {
                start: startRidecId,
                end: endRidecId
            }
        };

        if (this.currentRidecId) {
            // Editar RIDEC existente
            const index = this.ridecs.findIndex(r => r.id === this.currentRidecId);
            if (index !== -1) {
                this.ridecs[index] = { ...this.ridecs[index], ...ridecData };
                this.showNotification('RIDEC atualizado com sucesso!', 'success', false);
                this.integrateWithExternalSystem(this.currentRidecId, 'update', 'ridec_updated');
            }
        } else {
            // Criar novo RIDEC modelo
            const newRidec = {
                id: this.generateId(),
                ...ridecData,
                stageA: null,
                currentStage: 'RI',
                startTime: Date.now(),
                stageStartTime: Date.now(),
                completed: false,
                isOccurrence: false, // Marcar como modelo
                integrations: {} // Inicializar integrações vazias
            };
            this.ridecs.push(newRidec);
            this.showNotification('RIDEC modelo criado com sucesso!', 'success', false);
            this.integrateWithExternalSystem(newRidec.id, 'RI', 'ridec_created');
        }

        this.saveToLocalStorage();
        this.renderRidecList();
        this.closeRidecModal();
    }

    // Abrir modal Etapa A
    openStageAModal(ridecId) {
        this.currentRidecId = ridecId;
        const modal = document.getElementById('stageAModal');
        document.getElementById('stageAForm').reset();
        modal.style.display = 'block';
    }

    // Fechar modal Etapa A
    closeStageAModal() {
        document.getElementById('stageAModal').style.display = 'none';
        this.currentRidecId = null;
    }

    // Salvar Etapa A
    saveStageA() {
        const form = document.getElementById('stageAForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const stageAData = {
            position: document.getElementById('stageAPosition').value,
            deadline: parseInt(document.getElementById('stageADeadline').value),
            timeUnit: document.getElementById('stageAUnit').value,
            description: document.getElementById('stageADescription').value,
            identifier: document.getElementById('stageAIdentifier').value,
            startTime: Date.now()
        };

        const index = this.ridecs.findIndex(r => r.id === this.currentRidecId);
        if (index !== -1) {
            // Inicializar array de etapas A se não existir
            if (!this.ridecs[index].stagesA) {
                this.ridecs[index].stagesA = [];
            }
            
            // Verificar se já existe uma etapa A na mesma posição
            const existingStageIndex = this.ridecs[index].stagesA.findIndex(
                stage => stage.position === stageAData.position
            );
            
            if (existingStageIndex !== -1) {
                // Atualizar etapa existente
                this.ridecs[index].stagesA[existingStageIndex] = stageAData;
                this.showNotification('Etapa A atualizada com sucesso!', 'success', false);
            } else {
                // Adicionar nova etapa A
                this.ridecs[index].stagesA.push(stageAData);
                this.showNotification('Etapa A adicionada com sucesso!', 'success', false);
            }
            
            this.saveToLocalStorage();
            this.renderRidecList();
        }

        this.closeStageAModal();
    }

    // Renderizar lista de RIDECs
    renderRidecList() {
        const ridecList = document.getElementById('ridecList');
        if (!ridecList) return;
        
        ridecList.innerHTML = '';

        // Verificar se há dados residuais e limpar
        this.checkAndCleanResidualData();

        // GARANTIR QUE O ARRAY ESTÁ LIMPO
        if (!Array.isArray(this.ridecs)) {
            this.ridecs = [];
        }


        const modelRidecs = this.ridecs.filter(ridec => 
            ridec && 
            ridec.id && 
            ridec.title && 
            !ridec.isOccurrence &&
            typeof ridec === 'object'
        );
        
        console.log(`RIDECs encontrados: ${modelRidecs.length}`);
        
        if (modelRidecs.length === 0) {
            this.renderEmptyState();
            
            // Limpar dados residuais do localStorage se não há RIDECs
            if (this.ridecs.length === 0) {
                localStorage.removeItem('ridecs');
                console.log('localStorage limpo - array vazio');
            }
            return;
        }

        // Organizar RIDECs modelos por área
        const ridecsByArea = this.groupRidecsByArea(modelRidecs);

        Object.keys(ridecsByArea).forEach(area => {
            const areaSection = this.createAreaSection(area, ridecsByArea[area]);
            ridecList.appendChild(areaSection);
        });

        // Atualizar visualização de fluxo se estiver ativa
        if (document.getElementById('flowView').style.display !== 'none') {
            this.renderFlowView();
        }
        
        // Atualizar visualização de gráficos se estiver ativa
        if (document.getElementById('chartsView').style.display !== 'none') {
            this.renderChartsView();
        }
    }

    // Agrupar RIDECs por área
    groupRidecsByArea(ridecs) {
        const grouped = {};
        
        ridecs.forEach(ridec => {
            const area = ridec.area || 'Sem Área';
            if (!grouped[area]) {
                grouped[area] = [];
            }
            grouped[area].push(ridec);
        });

        return grouped;
    }

    // Criar seção de área
    createAreaSection(area, ridecs) {
        const areaSection = document.createElement('div');
        areaSection.className = 'ridec-area';

        const areaHeader = document.createElement('div');
        areaHeader.className = 'ridec-area-header';

        const areaTitle = document.createElement('div');
        areaTitle.className = 'ridec-area-title';
        areaTitle.innerHTML = `<i class="${this.getAreaIcon(area)}"></i> ${area}`;

        const areaCount = document.createElement('div');
        areaCount.className = 'ridec-area-count';
        areaCount.textContent = `${ridecs.length} RIDEC${ridecs.length !== 1 ? 's' : ''}`;

        const areaToggle = document.createElement('button');
        areaToggle.className = 'ridec-area-toggle';
        areaToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        areaToggle.title = 'Minimizar/Maximizar área';
        areaToggle.setAttribute('type', 'button');
        areaToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleAreaSection(areaSection);
        });

        const createRidecBtn = document.createElement('button');
        createRidecBtn.className = 'ridec-area-create-btn';
        createRidecBtn.innerHTML = '<i class="fas fa-plus"></i> Criar RIDEC';
        createRidecBtn.title = `Criar novo RIDEC na área ${area}`;
        createRidecBtn.setAttribute('type', 'button');
        createRidecBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.createRidecInArea(area);
        });

        areaHeader.appendChild(areaTitle);
        areaHeader.appendChild(areaCount);
        areaHeader.appendChild(createRidecBtn);
        areaHeader.appendChild(areaToggle);

        const areaContent = document.createElement('div');
        areaContent.className = 'ridec-area-content';

        const areaGrid = document.createElement('div');
        areaGrid.className = 'ridec-area-grid';
        
        // Aplicar classes baseadas na quantidade de RIDECs
        if (ridecs.length === 1) {
            areaGrid.classList.add('single-ridec');
        } else if (ridecs.length === 2) {
            areaGrid.classList.add('two-ridecs');
        } else if (ridecs.length === 4) {
            areaGrid.classList.add('four-ridecs');
        }

        ridecs.forEach(ridec => {
            const card = this.createRidecCard(ridec);
            areaGrid.appendChild(card);
        });

        areaContent.appendChild(areaGrid);
        areaSection.appendChild(areaHeader);
        areaSection.appendChild(areaContent);

        // Aplicar estado salvo após criar todos os elementos
        const isMinimized = this.loadAreaState(area);
        if (isMinimized) {
            areaContent.classList.add('minimized');
            areaToggle.classList.add('minimized');
            areaToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
            areaToggle.title = 'Expandir área';
        }

        return areaSection;
    }

    // Obter ícone da área
    getAreaIcon(area) {
        const icons = {
            'Desenvolvimento': 'fas fa-code',
            'Vendas': 'fas fa-chart-line',
            'Marketing': 'fas fa-bullhorn',
            'Financeiro': 'fas fa-dollar-sign',
            'Recursos Humanos': 'fas fa-users',
            'Operações': 'fas fa-cogs',
            'Suporte': 'fas fa-headset',
            'Qualidade': 'fas fa-check-circle',
            'Infraestrutura': 'fas fa-server',
            'Outros': 'fas fa-folder',
            'Sem Área': 'fas fa-question-circle'
        };
        
        return icons[area] || 'fas fa-folder';
    }

    // Criar card RIDEC
    createRidecCard(ridec) {
        const card = document.createElement('div');
        card.className = `ridec-card model-card ${this.isOverdue(ridec) ? 'overdue' : ''}`;
        
        card.innerHTML = `
            <div class="ridec-header">
                <div class="ridec-title">
                    ${ridec.title}
                    <span class="model-badge">Modelo</span>
                </div>
                <div class="ridec-description">${ridec.description}</div>
                <div class="ridec-area-badge">${ridec.area || 'Sem Área'}</div>
                <div class="ridec-actions">
                    <button class="action-btn" onclick="ridecSystem.editRidec('${ridec.id}')" title="Editar Modelo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="ridecSystem.deleteRidec('${ridec.id}')" title="Excluir Modelo">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn" onclick="ridecSystem.openStageAModal('${ridec.id}')" title="Adicionar Etapa A">
                        <i class="fas fa-plus"></i>
                        ${ridec.stagesA && ridec.stagesA.length > 0 ? `<span class="stage-count">${ridec.stagesA.length}</span>` : ''}
                    </button>
                    <button class="action-btn integration-btn" onclick="ridecSystem.openIntegrationModal('${ridec.id}')" title="Configurar Integrações">
                        <i class="fas fa-plug"></i>
                        ${ridec.integrations && Object.keys(ridec.integrations).length > 0 ? `<span class="integration-count">${Object.keys(ridec.integrations).length}</span>` : ''}
                    </button>
                    <button class="action-btn occurrences-btn" onclick="ridecSystem.openRidecOccurrences('${ridec.id}')" title="Ver Ocorrências">
                        <i class="fas fa-clipboard-list"></i>
                        <span class="occurrences-count">0</span>
                    </button>
                </div>
            </div>
            <div class="ridec-body">
                <div class="ridec-info">
                    <div class="info-item">
                        <div class="info-label">Tempo Máximo</div>
                        <div class="info-value ${!ridec.maxTime ? 'missing-value' : ''}">${ridec.maxTime ? ridec.maxTime + this.getTimeUnitLabel(ridec.timeUnit || 'hours').charAt(0) : 'Não configurado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Modo de Controle</div>
                        <div class="info-value">${ridec.timeControlMode === 'simple' ? 'Simples' : 'Detalhado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Etapas A</div>
                        <div class="info-value">${ridec.stagesA ? ridec.stagesA.length : 0}</div>
                    </div>
                </div>
                

                

            </div>
        `;
        

        

        
        return card;
    }







    // Criar quadro Kanban
    createKanbanBoard(ridec) {
        const stages = ['RI', 'D', 'E', 'C'];
        
        let kanbanHTML = `
            <div class="kanban-board">
                <div class="kanban-stages">
        `;

        // Conteúdo das etapas
        stages.forEach((stage, index) => {
            const stageStatus = this.getStageStatus(ridec, stage);
            const stageTime = this.getStageTime(ridec, stage);
            const progress = this.getStageProgress(ridec, stage);
            
            kanbanHTML += `
                <div class="kanban-stage ${stageStatus}">
                    <div class="stage-label">${stage}</div>
                    <div class="stage-time">${stageTime}</div>
                    <div class="stage-progress">
                        <div class="progress-bar ${progress > 100 ? 'overdue' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    ${this.getStageActions(ridec, stage)}
                </div>
            `;

            // Inserir Etapas A se necessário
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                ridec.stagesA.forEach(stageA => {
                    const position = stageA.position;
                    if ((position === 'ri-d' && stage === 'RI') ||
                        (position === 'd-e' && stage === 'D') ||
                        (position === 'e-c' && stage === 'E') ||
                        (position === 'after-c' && stage === 'C')) {
                        
                        const stageAStatus = this.getStageStatus(ridec, stageA.identifier);
                        const stageATime = this.getStageTime(ridec, stageA.identifier);
                        const stageAProgress = this.getStageProgress(ridec, stageA.identifier);
                        
                        kanbanHTML += `
                            <div class="kanban-stage ${stageAStatus}">
                                <div class="stage-a-container" title="${stageA.identifier}">
                                    <div class="stage-a-text">${stageA.identifier}</div>
                                    <button class="remove-stage-btn" onclick="ridecSystem.removeStageA('${ridec.id}', '${stageA.identifier}')" title="Remover etapa ${stageA.identifier}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="stage-label" title="${stageA.identifier}">${this.truncateText(stageA.identifier, 8)}</div>
                                <div class="stage-time">${stageATime}</div>
                                <div class="stage-progress">
                                    <div class="progress-bar ${stageAProgress > 100 ? 'overdue' : ''}" style="width: ${Math.min(stageAProgress, 100)}%"></div>
                                </div>
                                ${this.getStageActions(ridec, stageA.identifier)}
                            </div>
                        `;
                    }
                });
            }
        });

        kanbanHTML += `</div></div>`;
        return kanbanHTML;
    }

    // Obter status da etapa
    getStageStatus(ridec, stage) {
        if (ridec.completed) return 'completed';
        if (ridec.currentStage === stage) return 'active';
        if (this.isStageOverdue(ridec, stage)) return 'overdue';
        return '';
    }

    // Obter tempo da etapa
    getStageTime(ridec, stage) {
        const elapsedSeconds = this.getStageElapsedTime(ridec, stage);
        const elapsedFormatted = this.formatStageTime(elapsedSeconds);
        
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                const deadline = stageA.deadline;
                const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                const difference = elapsedSeconds - deadlineInSeconds;
                
                // Converter deadline para minutos para exibição
                const deadlineInMinutes = Math.floor(deadlineInSeconds / 60);
                const diffInMinutes = Math.abs(Math.floor(difference / 60));
                
                let status = '';
                if (difference > 0) {
                    status = ` (+${diffInMinutes}m)`;
                } else if (difference < 0) {
                    status = ` (-${diffInMinutes}m)`;
                }
                
                return `${elapsedFormatted}/${deadlineInMinutes}m${status}`;
            }
        }
        
        // Para etapas padrão
        const deadline = ridec.deadlines?.[stage];
        if (!deadline) {
            return `${elapsedFormatted}/Não configurado`;
        }
        
        const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
        const difference = elapsedSeconds - deadlineInSeconds;
        
        // Converter deadline para minutos para exibição
        const deadlineInMinutes = Math.floor(deadlineInSeconds / 60);
        const diffInMinutes = Math.abs(Math.floor(difference / 60));
        
        let status = '';
        if (difference > 0) {
            status = ` (+${diffInMinutes}m)`;
        } else if (difference < 0) {
            status = ` (-${diffInMinutes}m)`;
        }
        
        return `${elapsedFormatted}/${deadlineInMinutes}m${status}`;
    }

    // Obter progresso da etapa
    getStageProgress(ridec, stage) {
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                const elapsed = this.getStageElapsedTime(ridec, stage);
                const deadline = stageA.deadline;
                const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                return (elapsed / deadlineInSeconds) * 100;
            }
        }
        
        const elapsed = this.getStageElapsedTime(ridec, stage);
        const deadline = ridec.deadlines?.[stage];
        if (!deadline) {
            return 0; // Sem progresso se não há deadline configurado
        }
        
        const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
        return (elapsed / deadlineInSeconds) * 100;
    }

    // Obter ações da etapa
    getStageActions(ridec, stage) {
        if (ridec.completed) return '';
        
        // Estado da etapa
        const isCurrent = ridec.currentStage === stage;
        const running = ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running;
        let elapsed = 0;
        if (ridec.stageTimers && ridec.stageTimers[stage]) {
            elapsed = ridec.stageTimers[stage].elapsed || 0;
            if (running) {
                elapsed += Math.floor((Date.now() - ridec.stageTimers[stage].startTime) / 1000);
            }
        }
        
        // Formatar tempo sempre em minutos
        const elapsedStr = this.formatStageTime(elapsed);
        
        // Verificar se pode iniciar a etapa
        const canStart = this.canStartStage(ridec, stage);
        
        let btn = '';
        if (!running && canStart) {
            btn = `<button class="btn-timer play" onclick="ridecSystem.startStageTimer('${ridec.id}', '${stage}')" title="Iniciar ${stage}">
                <i class="fas fa-play"></i> Iniciar
            </button>`;
        } else if (running) {
            btn = `<button class="btn-timer stop" onclick="ridecSystem.stopStageTimer('${ridec.id}', '${stage}')" title="Parar ${stage}">
                <i class="fas fa-stop"></i> Parar
            </button>`;
        } else if (!canStart) {
            btn = `<button class="btn-timer disabled" disabled title="Aguarde etapas anteriores">
                <i class="fas fa-clock"></i> Aguardando
            </button>`;
        }
        
        const timerClass = running ? 'stage-timer-running' : '';
        const stageClass = this.getStageStatusClass(ridec, stage);
        const stageIcon = this.getStageIcon(stage);
        
        return `
            <div class="stage-timer-controls ${timerClass} ${stageClass}">
                <div class="stage-header">
                    <div class="stage-icon-container">
                        <i class="fas ${stageIcon}"></i>
                        <span class="stage-label">${stage}</span>
                    </div>
                    <div class="stage-status-indicator">
                        <div class="status-dot ${this.getStageStatusDotClass(ridec, stage)}"></div>
                    </div>
                </div>
                
                <div class="timer-display-container">
                    <div class="timer-main-display">
                        <span class="timer-value">${elapsedStr}</span>
                        <div class="timer-progress-ring">
                            <svg class="progress-ring" width="60" height="60">
                                <circle class="progress-ring-bg" cx="30" cy="30" r="25"></circle>
                                <circle class="progress-ring-fill" cx="30" cy="30" r="25" 
                                    stroke-dasharray="${this.getStageProgress(ridec, stage) * 1.57}" 
                                    stroke-dashoffset="157"></circle>
                            </svg>
                            <div class="progress-percentage">${Math.round(this.getStageProgress(ridec, stage))}%</div>
                        </div>
                    </div>
                    
                    <div class="timer-details">
                        <div class="deadline-info">
                            <span class="deadline-label">Prazo:</span>
                            <span class="deadline-value">${this.getStageDeadline(ridec, stage)}</span>
                        </div>
                        <div class="status-info">
                            <span class="status-label">Status:</span>
                            <span class="status-value ${this.getStageStatusClass(ridec, stage)}">${this.getStageStatusText(ridec, stage)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="stage-actions">
                    ${btn}
                    ${isCurrent && !running && this.isStageCompleted(ridec, stage) ? 
                        `<button class="btn-timer complete" onclick="ridecSystem.completeStage('${ridec.id}', '${stage}')" title="Concluir ${stage}">
                            <i class="fas fa-check"></i> Concluir
                        </button>` : ''}
                </div>
            </div>
        `;
    }

    // Formata segundos para HH:mm:ss
    formatElapsedTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    // Formata tempo sempre em minutos
    formatStageTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    }

    // Formata tempo decorrido total sempre em minutos
    formatTotalTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    // Iniciar timer da etapa
    startStageTimer(ridecId, stage) {
        const ridec = this.ridecs.find(r => r.id === ridecId);
        if (!ridec) return;
        
        if (!ridec.stageTimers) ridec.stageTimers = {};
        if (!ridec.stageTimers[stage]) ridec.stageTimers[stage] = { elapsed: 0, running: false };
        
        // Verificar se já está rodando
        if (ridec.stageTimers[stage].running) {
            this.showNotification(`Timer da etapa ${stage} já está rodando!`, 'warning', false);
            return;
        }
        
        // Verificar se pode iniciar esta etapa
        if (!this.canStartStage(ridec, stage)) {
            this.showNotification(`Não é possível iniciar a etapa ${stage} agora. Verifique as dependências.`, 'warning', false);
            return;
        }
        
        // Parar qualquer timer que esteja rodando
        const stages = ['RI', 'D', 'E', 'C'];
        for (const s of stages) {
            if (ridec.stageTimers[s] && ridec.stageTimers[s].running && s !== stage) {
                this.stopStageTimer(ridecId, s);
            }
        }
        
        // Se é a etapa RI, marcar como iniciada
        if (stage === 'RI' && !ridec.riStarted) {
            ridec.riStarted = true;
            ridec.riStartTime = Date.now();
            this.showNotification(`🚀 RIDEC iniciado! Contagem de tempo ativada.`, 'success', false);
        }
        
        ridec.stageTimers[stage].running = true;
        ridec.stageTimers[stage].startTime = Date.now();
        
        this.saveToLocalStorage();
        this.renderRidecList();
        this.showNotification(`⏱️ Timer iniciado para etapa ${stage}`, 'info', false);
    }

    // Parar timer da etapa
    stopStageTimer(ridecId, stage) {
        const ridec = this.ridecs.find(r => r.id === ridecId);
        if (!ridec || !ridec.stageTimers || !ridec.stageTimers[stage] || !ridec.stageTimers[stage].running) return;
        
        const now = Date.now();
        const elapsed = Math.floor((now - ridec.stageTimers[stage].startTime) / 1000);
        ridec.stageTimers[stage].elapsed = (ridec.stageTimers[stage].elapsed || 0) + elapsed;
        ridec.stageTimers[stage].running = false;
        delete ridec.stageTimers[stage].startTime;
        
        this.saveToLocalStorage();
        this.renderRidecList();
        this.showNotification(`Timer parado para etapa ${stage}. Tempo: ${this.formatElapsedTime(elapsed)}`, 'success', false);
    }

    // Obter tempo decorrido total (só conta após iniciar RI)
    getElapsedTime(ridec) {
        // Só contar tempo se a etapa RI já foi iniciada
        if (!ridec.riStarted) {
            return '0m';
        }
        
        const startTime = ridec.riStartTime || ridec.startTime;
        const elapsed = Date.now() - startTime;
        return this.formatTotalTime(Math.floor(elapsed / 1000));
    }

    // Obter tempo decorrido em segundos
    getElapsedTimeInSeconds(ridec) {
        // Só contar tempo se a etapa RI já foi iniciada
        if (!ridec.riStarted) {
            return 0;
        }
        
        const startTime = ridec.riStartTime || ridec.startTime;
        return Math.floor((Date.now() - startTime) / 1000);
    }

    // Obter tempo decorrido da etapa
    getStageElapsedTime(ridec, stage) {
        // Verificar se há timer para esta etapa
        if (ridec.stageTimers && ridec.stageTimers[stage]) {
            let elapsed = ridec.stageTimers[stage].elapsed || 0;
            if (ridec.stageTimers[stage].running) {
                elapsed += Math.floor((Date.now() - ridec.stageTimers[stage].startTime) / 1000);
            }
            return elapsed; // Retornar em segundos
        }
        
        // Fallback para o sistema antigo
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                const elapsed = Date.now() - stageA.startTime;
                return Math.floor(elapsed / 1000); // Retornar em segundos
            }
        }
        
        const elapsed = Date.now() - ridec.stageStartTime;
        return Math.floor(elapsed / 1000); // Retornar em segundos
    }

    // Verificar se pode iniciar uma etapa
    canStartStage(ridec, stage) {
        // Se é a etapa RI, sempre pode iniciar
        if (stage === 'RI') {
            return true;
        }
        

        if (ridec.isOccurrence) {
            const timeControlMode = ridec.timeControlMode || 'detailed';
            let hasTimeConfig = false;
            
            if (timeControlMode === 'simple') {
                // Modo simples: apenas tempo total é necessário
                hasTimeConfig = ridec.maxTime;
            } else {
                // Modo detalhado: todos os tempos das etapas são necessários
                hasTimeConfig = ridec.maxTime && 
                               ridec.deadlines && 
                               ridec.deadlines.RI && 
                               ridec.deadlines.D && 
                               ridec.deadlines.E && 
                               ridec.deadlines.C;
            }
            
            if (!hasTimeConfig) {
                return false; // Não pode iniciar etapas se não há tempos configurados
            }
        }
        
        // Para outras etapas, verificar se a etapa anterior foi concluída
        const stages = ['RI', 'D', 'E', 'C'];
        const stageIndex = stages.indexOf(stage);
        
        if (stageIndex > 0) {
            const previousStage = stages[stageIndex - 1];
            // Verificar se a etapa anterior foi concluída
            if (!this.isStageCompleted(ridec, previousStage)) {
                return false;
            }
            
            // Verificar se não há nenhuma etapa rodando
            for (const s of stages) {
                if (ridec.stageTimers && ridec.stageTimers[s] && ridec.stageTimers[s].running) {
                    return false;
                }
            }
            
            return true;
        }
        
        return false;
    }

    // Obter classe CSS do status da etapa
    getStageStatusClass(ridec, stage) {
        if (this.isStageCompleted(ridec, stage)) {
            return 'stage-completed';
        } else if (this.isStageOverdue(ridec, stage)) {
            return 'stage-overdue';
        } else if (ridec.currentStage === stage) {
            return 'stage-active';
        } else {
            return 'stage-pending';
        }
    }

    // Verificar se etapa está concluída
    isStageCompleted(ridec, stage) {
        // Verificar se há timer para esta etapa e se foi concluída
        if (ridec.stageTimers && ridec.stageTimers[stage]) {
            return ridec.stageTimers[stage].completed || false;
        }
        
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                return stageA.completed || false;
            }
        }
        
        return false;
    }

    // Obter progresso da etapa em porcentagem
    getStageProgress(ridec, stage) {
        const elapsedSeconds = this.getStageElapsedTime(ridec, stage);
        
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                const deadline = stageA.deadline;
                const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                const progress = (elapsedSeconds / deadlineInSeconds) * 100;
                return Math.min(progress, 100);
            }
        }
        
        // Para etapas padrão
        const deadline = ridec.deadlines?.[stage];
        if (!deadline) {
            return 0; // Sem progresso se não há deadline configurado
        }
        
        const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
        const progress = (elapsedSeconds / deadlineInSeconds) * 100;
        return Math.min(progress, 100);
    }

    // Obter ícone da etapa
    getStageIcon(stage) {
        const icons = {
            'RI': 'fa-search',
            'D': 'fa-lightbulb',
            'E': 'fa-cogs',
            'C': 'fa-check-circle'
        };
        return icons[stage] || 'fa-circle';
    }

    // Obter classe do status dot
    getStageStatusDotClass(ridec, stage) {
        if (this.isStageCompleted(ridec, stage)) {
            return 'completed';
        } else if (this.isStageOverdue(ridec, stage)) {
            return 'overdue';
        } else if (ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running) {
            return 'running';
        } else if (this.canStartStage(ridec, stage)) {
            return 'ready';
        } else {
            return 'pending';
        }
    }

    // Obter texto do status
    getStageStatusText(ridec, stage) {
        if (this.isStageCompleted(ridec, stage)) {
            return 'Concluída';
        } else if (this.isStageOverdue(ridec, stage)) {
            return 'Atrasada';
        } else if (ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running) {
            return 'Em andamento';
        } else if (this.canStartStage(ridec, stage)) {
            return 'Pronta';
        } else {
            return 'Aguardando';
        }
    }

    // Obter deadline formatado da etapa
    getStageDeadline(ridec, stage) {
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                const deadline = stageA.deadline;
                const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                const deadlineInMinutes = Math.floor(deadlineInSeconds / 60);
                return `${deadlineInMinutes}m`;
            }
        }
        
        // Para etapas padrão
        const deadline = ridec.deadlines?.[stage];
        if (!deadline) {
            return 'Não configurado';
        }
        
        const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
        const deadlineInMinutes = Math.floor(deadlineInSeconds / 60);
        return `${deadlineInMinutes}m`;
    }

    // Verificar se RIDEC está atrasado
    isOverdue(ridec) {
        if (ridec.completed) return false;
        
        // Verificar se qualquer etapa está atrasada
        const stages = ['RI', 'D', 'E', 'C'];
        for (const stage of stages) {
            if (this.isStageOverdue(ridec, stage)) {
                return true;
            }
        }
        
        // Verificar etapas A se existirem
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            for (const stageA of ridec.stagesA) {
                if (this.isStageOverdue(ridec, stageA.identifier)) {
                    return true;
                }
            }
        }
        
        // Verificar tempo total como fallback (só se RI foi iniciado e maxTime está configurado)
        if (ridec.riStarted && ridec.maxTime) {
            const elapsedSeconds = this.getElapsedTimeInSeconds(ridec);
            const timeUnit = ridec.timeUnit || 'hours';
            const maxTimeInSeconds = this.convertTimeToSeconds(ridec.maxTime, timeUnit);
            return elapsedSeconds > maxTimeInSeconds;
        }
        
        return false;
    }

    // Verificar se etapa está atrasada
    isStageOverdue(ridec, stage) {
        if (ridec.completed) return false;
        
        // Verificar se é uma etapa A
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            const stageA = ridec.stagesA.find(s => s.identifier === stage);
            if (stageA) {
                const elapsed = this.getStageElapsedTime(ridec, stage);
                const deadline = stageA.deadline;
                const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                return elapsed > deadlineInSeconds;
            }
        }
        
        // Verificar etapas padrão
        const elapsed = this.getStageElapsedTime(ridec, stage);
        const deadline = ridec.deadlines?.[stage];
        if (!deadline) {
            return false; // Não pode estar atrasado se não há deadline configurado
        }
        
        const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
        return elapsed > deadlineInSeconds;
    }

    // Editar RIDEC
    editRidec(ridecId) {
        this.openRidecModal(ridecId);
    }

    // Excluir RIDEC
    deleteRidec(ridecId) {
        if (confirm('Tem certeza que deseja excluir este RIDEC?')) {
            // Limpar relações que referenciam o RIDEC deletado
            this.cleanupRelations(ridecId);
            
            this.ridecs = this.ridecs.filter(r => r.id !== ridecId);
            this.saveToLocalStorage();
            this.renderRidecList();
            this.showNotification('RIDEC excluído com sucesso!', 'success', false);
        }
    }

    // Limpar relações que referenciam um RIDEC deletado
    cleanupRelations(deletedRidecId) {
        this.ridecs.forEach(ridec => {
            if (ridec.relations) {
                if (ridec.relations.start === deletedRidecId) {
                    ridec.relations.start = null;
                }
                if (ridec.relations.end === deletedRidecId) {
                    ridec.relations.end = null;
                }
            }
        });
    }

    // Criar RIDEC em uma área específica
    createRidecInArea(area) {
        this.currentRidecId = null; // Garantir que é um novo RIDEC
        this.openRidecModal();
        
        // Pré-preencher a área selecionada
        setTimeout(() => {
            const areaSelect = document.getElementById('ridecArea');
            if (areaSelect) {
                areaSelect.value = area;
                // Disparar evento change para atualizar labels se necessário
                areaSelect.dispatchEvent(new Event('change'));
            }
        }, 100);
        
        this.showNotification(`Criando novo RIDEC na área: ${area}`, 'info', false);
    }

    // Concluir etapa
    completeStage(ridecId, stage) {
        const index = this.ridecs.findIndex(r => r.id === ridecId);
        if (index === -1) return;

        const ridec = this.ridecs[index];
        const stages = ['RI', 'D', 'E', 'C'];
        
        // Construir sequência de etapas incluindo etapas A
        let stageSequence = [...stages];
        if (ridec.stagesA && ridec.stagesA.length > 0) {
            ridec.stagesA.forEach(stageA => {
                const position = stageA.position;
                const identifier = stageA.identifier;
                if (position === 'ri-d') stageSequence.splice(1, 0, identifier);
                else if (position === 'd-e') stageSequence.splice(2, 0, identifier);
                else if (position === 'e-c') stageSequence.splice(3, 0, identifier);
                else if (position === 'after-c') stageSequence.push(identifier);
            });
        }

        const currentIndex = stageSequence.indexOf(ridec.currentStage);
        const nextIndex = currentIndex + 1;

        if (nextIndex < stageSequence.length) {
            // Avançar para próxima etapa
            ridec.currentStage = stageSequence[nextIndex];
            ridec.stageStartTime = Date.now();
            
            // Se a próxima etapa é uma etapa A, atualizar seu tempo de início
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                const nextStageA = ridec.stagesA.find(s => s.identifier === ridec.currentStage);
                if (nextStageA) {
                    nextStageA.startTime = Date.now();
                }
            }
        } else {
            // Concluir RIDEC
            ridec.completed = true;
            ridec.currentStage = 'Concluído';
        }

        this.ridecs[index] = ridec;
        this.saveToLocalStorage();
        this.renderRidecList();
        
        const action = ridec.completed ? 'concluído' : 'avançou para a próxima etapa';
        this.showNotification(`RIDEC ${action}!`, 'success', false);
        
        // Integração com sistemas externos
        if (ridec.completed) {
            this.integrateWithExternalSystem(ridecId, 'C', 'ridec_completed');
        } else {
            this.integrateWithExternalSystem(ridecId, ridec.currentStage, 'stage_completed');
        }
    }

    // Mostrar notificação
    showNotification(message, type = 'info', saveToHistory = false) {
        // Se não deve salvar no histórico, mostrar apenas notificação temporária
        if (!saveToHistory) {
            this.showTemporaryNotification(message, type);
            return;
        }
        
        const notification = {
            id: this.generateId(),
            title: type.charAt(0).toUpperCase() + type.slice(1),
            message: message,
            type: type,
            timestamp: Date.now(),
            read: false
        };
        
        this.notifications.unshift(notification);
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotificationList();
        
        // Mostrar notificação temporária apenas se o dropdown não estiver aberto
        if (!this.notificationDropdownVisible) {
            this.showTemporaryNotification(message, type);
        }
    }

    showTemporaryNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notificationArea');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' :
                    type === 'warning' ? 'fas fa-exclamation-triangle' :
                    type === 'error' ? 'fas fa-times-circle' :
                    'fas fa-info-circle';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon}"></i>
                <div>
                    <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;
        
        notificationArea.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (this.notificationDropdownVisible) {
            this.hideNotificationDropdown();
        } else {
            this.showNotificationDropdown();
        }
    }

    showNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.add('show');
        this.notificationDropdownVisible = true;
        this.renderNotificationList();
    }

    hideNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.remove('show');
        this.notificationDropdownVisible = false;
    }

    renderNotificationList() {
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = '';
        
        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-item">
                    <div class="notification-content">
                        <div class="notification-text">
                            <div class="notification-title">Nenhum RIDEC atrasado</div>
                            <div class="notification-message">Todos os RIDECs estão dentro do prazo!</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        this.notifications.forEach(notification => {
            const notificationItem = this.createNotificationItem(notification);
            notificationList.appendChild(notificationItem);
        });
    }

    createNotificationItem(notification) {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? '' : 'unread'}`;
        
        const icon = notification.type === 'success' ? 'fas fa-check-circle' :
                    notification.type === 'warning' ? 'fas fa-exclamation-triangle' :
                    notification.type === 'error' ? 'fas fa-times-circle' :
                    'fas fa-info-circle';
        
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        item.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon ${notification.type}">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-text">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <button class="notification-close" onclick="ridecSystem.removeNotification('${notification.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                this.markNotificationAsRead(notification.id);
            }
        });
        
        return item;
    }

    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationCount();
            this.renderNotificationList();
        }
    }

    removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotificationList();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotificationList();
    }

    updateNotificationCount() {
        const countElement = document.getElementById('notificationCount');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            countElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
            countElement.style.display = 'flex';
        } else {
            countElement.style.display = 'none';
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours}h atrás`;
        return `${days}d atrás`;
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    // Iniciar monitoramento de atrasos
    startOverdueMonitoring() {
        // Verificar atrasos a cada minuto
        this.overdueCheckInterval = setInterval(() => {
            this.checkOverdueStages();
        }, 60000); // Verificar a cada minuto
        
        // Atualizar timers a cada segundo apenas se não estiver na visualização de gráficos
        this.timerInterval = setInterval(() => {
            // Só atualizar se estiver na visualização de cards ou fluxo
            const chartsView = document.getElementById('chartsView');
            if (chartsView && chartsView.style.display !== 'block') {
                this.renderRidecList();
            }
        }, 1000); // Atualizar a cada segundo
    }

    // Verificar etapas atrasadas
    checkOverdueStages() {

        
        this.ridecs.forEach(ridec => {
            if (ridec.completed) return;

            // Verificar etapa atual
            if (this.isStageOverdue(ridec, ridec.currentStage)) {
                this.showNotification(
                    `RIDEC "${ridec.title}" - Etapa ${ridec.currentStage} está atrasada!`,
                    'error',
                    true // Salvar no histórico
                );
                this.integrateWithExternalSystem(ridec.id, ridec.currentStage, 'overdue_alert');
                
                if (ridec.isOccurrence) {
                    hasOverdueOccurrences = true;
                }
            }

            // Verificar etapas A se existirem
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                ridec.stagesA.forEach(stageA => {
                    if (ridec.currentStage === stageA.identifier && this.isStageOverdue(ridec, stageA.identifier)) {
                        this.showNotification(
                            `RIDEC "${ridec.title}" - Etapa ${stageA.identifier} está atrasada!`,
                            'error',
                            true // Salvar no histórico
                        );
                        this.integrateWithExternalSystem(ridec.id, stageA.identifier, 'overdue_alert');
                        
                        
                    }
                });
            }
        });
        

    }

    // Obter unidade de tempo do RIDEC atual
    getCurrentRidecTimeUnit() {
        if (this.currentRidecId) {
            const ridec = this.ridecs.find(r => r.id === this.currentRidecId);
            return ridec ? ridec.timeUnit || 'hours' : 'hours';
        }
        return document.getElementById('ridecTimeUnit').value || 'hours';
    }

    // Converter tempo para segundos baseado na unidade
    convertTimeToSeconds(value, unit) {
        switch (unit) {
            case 'seconds': return value;
            case 'minutes': return value * 60;
            case 'hours': return value * 60 * 60;
            case 'days': return value * 24 * 60 * 60;
            case 'weeks': return value * 7 * 24 * 60 * 60;
            default: return value * 60 * 60; // horas como padrão
        }
    }

    // Converter segundos para a unidade especificada
    convertSecondsToUnit(seconds, unit) {
        switch (unit) {
            case 'seconds': return seconds;
            case 'minutes': return seconds / 60;
            case 'hours': return seconds / (60 * 60);
            case 'days': return seconds / (24 * 60 * 60);
            case 'weeks': return seconds / (7 * 24 * 60 * 60);
            default: return seconds / (60 * 60); // horas como padrão
        }
    }

    // Obter label da unidade de tempo
    getTimeUnitLabel(unit) {
        switch (unit) {
            case 'seconds': return 'segundos';
            case 'minutes': return 'minutos';
            case 'hours': return 'horas';
            case 'days': return 'dias';
            case 'weeks': return 'semanas';
            default: return 'horas';
        }
    }

    // Atualizar labels das unidades de tempo
    updateTimeUnitLabels() {
        const timeUnit = document.getElementById('ridecTimeUnit').value;
        const unitLabel = this.getTimeUnitLabel(timeUnit);
        
        // Atualizar label do tempo máximo
        document.getElementById('maxTimeUnitLabel').textContent = unitLabel;
        
        // Atualizar labels dos prazos das etapas
        const deadlineLabels = document.querySelectorAll('.deadline-unit-label');
        deadlineLabels.forEach(label => {
            label.textContent = unitLabel;
        });
        
        // Atualizar label da etapa A se o modal estiver aberto
        const stageAUnitLabel = document.getElementById('stageAUnitLabel');
        if (stageAUnitLabel) {
            stageAUnitLabel.textContent = unitLabel;
        }
    }

    // Salvar no localStorage
    saveToLocalStorage() {
        // Se o array de RIDECs estiver vazio, remover completamente do localStorage
        if (this.ridecs.length === 0) {
            localStorage.removeItem('ridecs');
            console.log('Array de RIDECs vazio - removido do localStorage');
        } else {
            localStorage.setItem('ridecs', JSON.stringify(this.ridecs));
        }
    }

    // Truncar texto para caber nos cards
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }

    // Remover etapa A
    removeStageA(ridecId, stageIdentifier) {
        if (confirm(`Tem certeza que deseja remover a etapa "${stageIdentifier}"?`)) {
            const index = this.ridecs.findIndex(r => r.id === ridecId);
            if (index !== -1) {
                const ridec = this.ridecs[index];
                
                // Remover a etapa A do array
                ridec.stagesA = ridec.stagesA.filter(stage => stage.identifier !== stageIdentifier);
                
                // Se não há mais etapas A, remover o array
                if (ridec.stagesA.length === 0) {
                    delete ridec.stagesA;
                }
                
                // Se a etapa atual era a que foi removida, voltar para a etapa anterior
                if (ridec.currentStage === stageIdentifier) {
                    const stages = ['RI', 'D', 'E', 'C'];
                    const currentIndex = stages.indexOf(ridec.currentStage);
                    if (currentIndex > 0) {
                        ridec.currentStage = stages[currentIndex - 1];
                    } else {
                        ridec.currentStage = 'RI';
                    }
                    ridec.stageStartTime = Date.now();
                }
                
                this.ridecs[index] = ridec;
                this.saveToLocalStorage();
                this.renderRidecList();
                this.showNotification(`Etapa "${stageIdentifier}" removida com sucesso!`, 'success', false);
            }
        }
    }

    // Alternar para visualização em cards
    switchToCardView() {
        this.currentView = 'card';
        document.getElementById('ridecList').style.display = 'grid';
        document.getElementById('flowView').style.display = 'none';
        document.getElementById('chartsView').style.display = 'none';
        document.getElementById('cardViewBtn').classList.add('active');
        document.getElementById('flowViewBtn').classList.remove('active');
        document.getElementById('chartsViewBtn').classList.remove('active');
        
        // Limpar gráficos e indicadores
        this.clearCharts();
    }

    // Alternar para visualização de fluxo
    switchToFlowView() {
        this.currentView = 'flow';
        document.getElementById('ridecList').style.display = 'none';
        document.getElementById('flowView').style.display = 'block';
        document.getElementById('chartsView').style.display = 'none';
        document.getElementById('cardViewBtn').classList.remove('active');
        document.getElementById('flowViewBtn').classList.add('active');
        document.getElementById('chartsViewBtn').classList.remove('active');
        
        // Limpar gráficos e indicadores
        this.clearCharts();
        
        this.renderFlowView();
    }

    // Alternar para visualização de gráficos
    switchToChartsView() {
        this.currentView = 'charts';
        document.getElementById('ridecList').style.display = 'none';
        document.getElementById('flowView').style.display = 'none';
        document.getElementById('chartsView').style.display = 'block';
        document.getElementById('cardViewBtn').classList.remove('active');
        document.getElementById('flowViewBtn').classList.remove('active');
        document.getElementById('chartsViewBtn').classList.add('active');
        this.renderChartsView();
    }

    // Renderizar visualização de fluxo
    renderFlowView() {
        const flowContainer = document.getElementById('flowContainer');
        flowContainer.innerHTML = '';

        // Adicionar legenda
        this.addFlowLegend(flowContainer);

        // Criar nós do fluxo
        const nodes = this.createFlowNodes();
        
        // Posicionar nós
        this.positionFlowNodes(nodes);
        
        // Adicionar nós ao container
        nodes.nodes.forEach(node => {
            flowContainer.appendChild(node.element);
        });

        // Criar conexões
        this.createFlowConnections(flowContainer, nodes);
    }

    // Adicionar legenda do fluxo
    addFlowLegend(container) {
        const legend = document.createElement('div');
        legend.className = 'flow-legend';
        legend.innerHTML = `
            <div class="flow-legend-item">
                <div class="flow-legend-color start"></div>
                <span>RIDEC de Início</span>
            </div>
            <div class="flow-legend-item">
                <div class="flow-legend-color middle"></div>
                <span>RIDEC Intermediário</span>
            </div>
            <div class="flow-legend-item">
                <div class="flow-legend-color end"></div>
                <span>RIDEC de Fim</span>
            </div>
            <div class="flow-legend-item">
                <div class="flow-legend-color completed"></div>
                <span>RIDEC Concluído</span>
            </div>
            <div class="flow-legend-item">
                <div class="flow-legend-color bpm"></div>
                <span>Fluxo BPM</span>
            </div>
            <div class="flow-legend-item">
                <div class="flow-legend-color mindmap"></div>
                <span>Mapa Mental</span>
            </div>
        `;
        container.appendChild(legend);
    }

    // Criar nós do fluxo
    createFlowNodes() {
        const nodes = [];
        const flowData = this.buildFlowSequence();
        const { flowMap, positions } = flowData;

        // Criar nós baseados no mapa de fluxo
        Object.keys(positions).forEach(ridecId => {
            const ridec = this.ridecs.find(r => r.id === ridecId);
            if (ridec) {
                const position = positions[ridecId];
                const node = {
                    id: ridec.id,
                    ridec: ridec,
                    element: this.createFlowNodeElement(ridec),
                    connections: {
                        predecessors: flowMap[ridecId].predecessors,
                        successors: flowMap[ridecId].successors
                    },
                    position: position
                };
                nodes.push(node);
            }
        });

        return { nodes, flowMap, positions };
    }

    // Construir estrutura de fluxo baseada nas relações
    buildFlowSequence() {
        const flowMap = this.buildFlowMap();
        const positions = this.calculateFlowPositions(flowMap);
        return { flowMap, positions };
    }

    // Construir mapa de fluxo baseado nas relações
    buildFlowMap() {
        const flowMap = {};
        
        // Criar mapa de todos os RIDECs
        this.ridecs.forEach(ridec => {
            flowMap[ridec.id] = {
                ridec: ridec,
                predecessors: [], // RIDECs que vêm antes
                successors: []    // RIDECs que vêm depois
            };
        });
        
        // Preencher as relações
        this.ridecs.forEach(ridec => {
            if (ridec.relations.start) {
                // Este RIDEC vem depois de outro
                flowMap[ridec.id].predecessors.push(ridec.relations.start);
                flowMap[ridec.relations.start].successors.push(ridec.id);
            }
        });
        
        return flowMap;
    }

    // Calcular posições para layout de fluxo
    calculateFlowPositions(flowMap) {
        const positions = {};
        const visited = new Set();
        const levels = {};
        
        // Encontrar RIDECs de início (sem predecessores)
        const startNodes = Object.keys(flowMap).filter(id => 
            flowMap[id].predecessors.length === 0
        );
        
        // Calcular níveis de cada RIDEC
        startNodes.forEach(startId => {
            this.calculateLevel(startId, flowMap, levels, visited, 0);
        });
        
        // Posicionar RIDECs baseado nos níveis
        const levelGroups = {};
        Object.keys(levels).forEach(id => {
            const level = levels[id];
            if (!levelGroups[level]) levelGroups[level] = [];
            levelGroups[level].push(id);
        });
        
        // Posicionar cada nível
        Object.keys(levelGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
            const nodesInLevel = levelGroups[level];
            const levelY = 100 + parseInt(level) * 200;
            
            nodesInLevel.forEach((nodeId, index) => {
                const x = 100 + index * 300;
                positions[nodeId] = { x, y: levelY, level: parseInt(level) };
            });
        });
        
        return positions;
    }

    // Calcular nível de um RIDEC recursivamente
    calculateLevel(nodeId, flowMap, levels, visited, currentLevel) {
        if (visited.has(nodeId)) return;
        
        visited.add(nodeId);
        levels[nodeId] = Math.max(levels[nodeId] || 0, currentLevel);
        
        // Calcular níveis dos sucessores
        flowMap[nodeId].successors.forEach(successorId => {
            this.calculateLevel(successorId, flowMap, levels, visited, currentLevel + 1);
        });
    }

    // Criar elemento do nó do fluxo
    createFlowNodeElement(ridec) {
        const node = document.createElement('div');
        node.className = `flow-node ${this.getFlowNodeClass(ridec)}`;
        node.setAttribute('data-ridec-id', ridec.id);
        
        const stageClass = ridec.completed ? 'completed' : 
                          this.isStageOverdue(ridec, ridec.currentStage) ? 'overdue' : '';

        node.innerHTML = `
            <div class="flow-node-title">${ridec.title}</div>
            <div class="flow-node-stage ${stageClass}">${ridec.currentStage}</div>
            <div class="flow-node-info">
                ${this.getElapsedTime(ridec)} / ${ridec.maxTime}${this.getTimeUnitLabel(ridec.timeUnit || 'hours').charAt(0)}
            </div>
            <div class="flow-node-relations">
                ${this.getFlowNodeRelations(ridec)}
            </div>
        `;

        // Adicionar evento de clique
        node.addEventListener('click', () => {
            this.editRidec(ridec.id);
        });

        return node;
    }

    // Obter classe CSS do nó do fluxo
    getFlowNodeClass(ridec) {
        if (ridec.completed) return 'completed';
        if (this.isOverdue(ridec)) return 'overdue';
        if (ridec.relations.start && !ridec.relations.end) return 'start-node';
        if (ridec.relations.end && !ridec.relations.start) return 'end-node';
        return 'middle-node';
    }

    // Obter informações de relacionamento do nó
    getFlowNodeRelations(ridec) {
        let relations = '';
        
        if (ridec.relations.start) {
            const startRidec = this.ridecs.find(r => r.id === ridec.relations.start);
            if (startRidec && !startRidec.isOccurrence && !startRidec.occurrenceNumber) {
                relations += `← ${startRidec.title}<br>`;
            }
        }
        
        if (ridec.relations.end) {
            const endRidec = this.ridecs.find(r => r.id === ridec.relations.end);
            if (endRidec && !endRidec.isOccurrence && !endRidec.occurrenceNumber) {
                relations += `→ ${endRidec.title}`;
            }
        }
        
        return relations;
    }

    // Posicionar nós do fluxo
    positionFlowNodes(nodeData) {
        const { nodes, positions } = nodeData;

        // Posicionar nós baseados na hierarquia calculada
        nodes.forEach(node => {
            const position = positions[node.id];
            if (position) {
                this.positionNode(node.element, position.x, position.y);
            }
        });
    }

    // Posicionar nó individual
    positionNode(element, x, y) {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    // Criar conexões do fluxo
    createFlowConnections(container, nodeData) {
        const { nodes, flowMap } = nodeData;
        
        // Criar conexões baseadas no mapa de fluxo
        nodes.forEach(node => {
            // Criar setas para todos os sucessores
            node.connections.successors.forEach(successorId => {
                this.createFlowConnection(container, node.id, successorId);
            });
        });
    }

    // Criar conexão de fluxo
    createFlowConnection(container, fromId, toId) {
        const fromNode = container.querySelector(`[data-ridec-id="${fromId}"]`);
        const toNode = container.querySelector(`[data-ridec-id="${toId}"]`);
        
        if (!fromNode || !toNode) return;

        // Usar posições absolutas dos nós
        const fromX = parseInt(fromNode.style.left) + 110;
        const fromY = parseInt(fromNode.style.top) + 60;
        const toX = parseInt(toNode.style.left) + 110;
        const toY = parseInt(toNode.style.top) + 60;

        const connection = document.createElement('div');
        connection.className = 'flow-connection';
        
        // Criar linha SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';

        // Calcular pontos de controle para curva suave
        const controlPoint1X = fromX + (toX - fromX) * 0.25;
        const controlPoint1Y = fromY;
        const controlPoint2X = fromX + (toX - fromX) * 0.75;
        const controlPoint2Y = toY;

        const pathData = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

        // Linha principal
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'flow-connection-line mindmap');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#4299e1');
        path.setAttribute('stroke-width', '4');

        // Seta
        const arrowSize = 15;
        const angle = Math.atan2(toY - controlPoint2Y, toX - controlPoint2X);
        const arrowX = toX - arrowSize * Math.cos(angle);
        const arrowY = toY - arrowSize * Math.sin(angle);

        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${toX},${toY} ${arrowX - arrowSize * Math.cos(angle - Math.PI/6)},${arrowY - arrowSize * Math.sin(angle - Math.PI/6)} ${arrowX - arrowSize * Math.cos(angle + Math.PI/6)},${arrowY - arrowSize * Math.sin(angle + Math.PI/6)}`);
        arrow.setAttribute('class', 'flow-connection-arrow mindmap');
        arrow.setAttribute('fill', '#4299e1');

        svg.appendChild(path);
        svg.appendChild(arrow);
        connection.appendChild(svg);
        container.appendChild(connection);
    }

    // Criar conexão individual
    createConnection(container, fromId, toId, type) {
        const fromNode = container.querySelector(`[data-ridec-id="${fromId}"]`);
        const toNode = container.querySelector(`[data-ridec-id="${toId}"]`);
        
        if (!fromNode || !toNode) return;

        // Usar posições absolutas dos nós
        const fromX = parseInt(fromNode.style.left) + 110; // Centro do nó (220/2)
        const fromY = parseInt(fromNode.style.top) + 60;   // Centro do nó (120/2)
        const toX = parseInt(toNode.style.left) + 110;
        const toY = parseInt(toNode.style.top) + 60;

        const connection = document.createElement('div');
        connection.className = 'flow-connection';
        
        // Criar linha SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';

        // Calcular pontos de controle para curva suave
        const controlPoint1X = fromX + (toX - fromX) * 0.25;
        const controlPoint1Y = fromY;
        const controlPoint2X = fromX + (toX - fromX) * 0.75;
        const controlPoint2Y = toY;

        const pathData = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

        // Linha principal
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', `flow-connection-line ${type}`);
        path.setAttribute('fill', 'none');

        // Seta maior e mais visível
        const arrowSize = 12;
        const angle = Math.atan2(toY - controlPoint2Y, toX - controlPoint2X);
        const arrowX = toX - arrowSize * Math.cos(angle);
        const arrowY = toY - arrowSize * Math.sin(angle);

        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${toX},${toY} ${arrowX - arrowSize * Math.cos(angle - Math.PI/6)},${arrowY - arrowSize * Math.sin(angle - Math.PI/6)} ${arrowX - arrowSize * Math.cos(angle + Math.PI/6)},${arrowY - arrowSize * Math.sin(angle + Math.PI/6)}`);
        arrow.setAttribute('class', `flow-connection-arrow ${type}`);

        // Adicionar rótulo da conexão
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', midX);
        label.setAttribute('y', midY - 10);
        label.setAttribute('class', 'flow-connection-label');
        label.textContent = type === 'start' ? 'Depende de' : 'Alimenta';

        svg.appendChild(path);
        svg.appendChild(arrow);
        svg.appendChild(label);
        connection.appendChild(svg);
        container.appendChild(connection);
    }

    // Filtrar RIDECs
    filterRidecs(searchTerm) {
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (searchTerm.trim() === '') {
            clearBtn.style.display = 'none';
            this.renderRidecList();
            return;
        }

        clearBtn.style.display = 'block';
        
        const filteredRidecs = this.ridecs.filter(ridec => {
            const searchLower = searchTerm.toLowerCase();
            return (
                ridec.title.toLowerCase().includes(searchLower) ||
                ridec.description.toLowerCase().includes(searchLower) ||
                (ridec.area && ridec.area.toLowerCase().includes(searchLower))
            );
        });

        this.renderFilteredRidecList(filteredRidecs);
    }

    // Renderizar lista filtrada
    renderFilteredRidecList(filteredRidecs) {
        const ridecList = document.getElementById('ridecList');
        ridecList.innerHTML = '';

        if (filteredRidecs.length === 0) {
            ridecList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #718096;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>Nenhum RIDEC encontrado</h3>
                    <p>Tente ajustar os termos de busca</p>
                </div>
            `;
            return;
        }

        // Organizar RIDECs filtrados por área
        const ridecsByArea = this.groupRidecsByArea(filteredRidecs);

        Object.keys(ridecsByArea).forEach(area => {
            const areaSection = this.createAreaSection(area, ridecsByArea[area]);
            ridecList.appendChild(areaSection);
        });
    }



    // Integração com sistemas externos
    integrateWithExternalSystem(ridecId, stage, action) {
        // Chamar integrações reais se disponíveis
        if (window.executeRIDECIntegration) {
            window.executeRIDECIntegration(ridecId, stage, action);
        }
        
        // Simular integração com sistemas externos
        console.log(`Integração: RIDEC ${ridecId}, Etapa ${stage}, Ação ${action}`);
        
        this.showNotification(`Integração com sistema externo executada para etapa ${stage}`, 'info', false);
    }

    // Renderizar visualização de gráficos
    renderChartsView() {
        // Só criar gráficos se eles não existem ou se foram destruídos
        if (!this.ridecsByAreaChart) {
            this.createRidecsByAreaChart();
        }
        if (!this.timeByAreaChart) {
            this.createTimeByAreaChart();
        }
        
        // Criar gráficos de ocorrências
        this.createOccurrencesStatusChart();
        this.createOccurrencesProgressChart();
        
        this.updateSummaryCards();
        
        // Adicionar indicadores de quantidade e tempo por área apenas se não existem
        const existingIndicators = document.querySelector('.area-indicators');
        if (!existingIndicators) {
            this.createAreaIndicators();
        }
    }

    // Limpar gráficos quando sair da visualização
    clearCharts() {
        if (this.ridecsByAreaChart) {
            this.ridecsByAreaChart.destroy();
            this.ridecsByAreaChart = null;
        }
        if (this.timeByAreaChart) {
            this.timeByAreaChart.destroy();
            this.timeByAreaChart = null;
        }
        
        // Limpar indicadores de área
        const existingIndicators = document.querySelector('.area-indicators');
        if (existingIndicators) {
            existingIndicators.remove();
        }
    }

    // Criar gráfico de distribuição de RIDECs por área
    createRidecsByAreaChart() {
        const canvas = document.getElementById('ridecsByAreaChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getRidecsByAreaData();
        
        this.ridecsByAreaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#4299e1', '#48bb78', '#ed8936', '#f56565',
                        '#9f7aea', '#38b2ac', '#ecc94b', '#ed64a6',
                        '#667eea', '#f09383'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Desabilitar animações para evitar piscadas
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed} modelos`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Criar gráfico de tempo por área
    createTimeByAreaChart() {
        const canvas = document.getElementById('timeByAreaChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getTimeByAreaData();
        
        this.timeByAreaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Tempo Total dos Modelos',
                    data: data.values,
                    backgroundColor: '#4299e1',
                    borderColor: '#3182ce',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Desabilitar animações para evitar piscadas
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            },
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }



    // Obter dados de RIDECs por área (apenas modelos)
    getRidecsByAreaData() {
        // Filtrar apenas RIDECs modelos
        const modelRidecs = this.ridecs.filter(ridec => !ridec.isOccurrence);
        const ridecsByArea = this.groupRidecsByArea(modelRidecs);
        return {
            labels: Object.keys(ridecsByArea),
            values: Object.values(ridecsByArea).map(ridecs => ridecs.length)
        };
    }

    // Obter dados de tempo por área (apenas modelos)
    getTimeByAreaData() {
        // Filtrar apenas RIDECs modelos
        const modelRidecs = this.ridecs.filter(ridec => !ridec.isOccurrence);
        const ridecsByArea = this.groupRidecsByArea(modelRidecs);
        return {
            labels: Object.keys(ridecsByArea),
            values: Object.values(ridecsByArea).map(ridecs => 
                ridecs.reduce((total, ridec) => total + ridec.maxTime, 0)
            )
        };
    }

    // Criar gráfico de status das ocorrências
    createOccurrencesStatusChart() {
        const ctx = document.getElementById('occurrencesStatusChart');
        if (!ctx) return;

        const data = this.getOccurrencesStatusData();
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',   // Concluída - Verde
                        'rgba(245, 158, 11, 0.8)',   // Ativa - Amarelo
                        'rgba(239, 68, 68, 0.8)',    // Atrasada - Vermelho
                        'rgba(107, 114, 128, 0.8)'   // Pendente - Cinza
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(107, 114, 128, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#6b7280',
                            font: {
                                size: 12
                            },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Criar gráfico de progresso das ocorrências por área
    createOccurrencesProgressChart() {
        const ctx = document.getElementById('occurrencesProgressChart');
        if (!ctx) return;

        const data = this.getOccurrencesProgressData();
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Progresso Médio (%)',
                    data: data.values,
                    backgroundColor: data.values.map(value => {
                        if (value >= 80) return 'rgba(16, 185, 129, 0.8)';      // Verde
                        if (value >= 60) return 'rgba(245, 158, 11, 0.8)';      // Amarelo
                        if (value >= 40) return 'rgba(251, 146, 60, 0.8)';      // Laranja
                        return 'rgba(239, 68, 68, 0.8)';                        // Vermelho
                    }),
                    borderColor: data.values.map(value => {
                        if (value >= 80) return 'rgba(16, 185, 129, 1)';
                        if (value >= 60) return 'rgba(245, 158, 11, 1)';
                        if (value >= 40) return 'rgba(251, 146, 60, 1)';
                        return 'rgba(239, 68, 68, 1)';
                    }),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Progresso: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Obter dados de status das ocorrências
    getOccurrencesStatusData() {
        // Filtrar apenas RIDECs que são ocorrências
        const occurrences = this.ridecs.filter(ridec => ridec.isOccurrence);
        
        const statusCount = {
            'Concluída': 0,
            'Ativa': 0,
            'Atrasada': 0,
            'Pendente': 0
        };

        occurrences.forEach(occurrence => {
            if (occurrence.completed) {
                statusCount['Concluída']++;
            } else if (this.isOverdue(occurrence)) {
                statusCount['Atrasada']++;
            } else if (occurrence.stages && occurrence.stages.some(stage => stage.status === 'active')) {
                statusCount['Ativa']++;
            } else {
                statusCount['Pendente']++;
            }
        });

        return {
            labels: Object.keys(statusCount),
            values: Object.values(statusCount)
        };
    }

    // Obter dados de progresso das ocorrências por área
    getOccurrencesProgressData() {
        // Filtrar apenas RIDECs que são ocorrências
        const occurrences = this.ridecs.filter(ridec => ridec.isOccurrence);
        
        const progressByArea = {};
        
        occurrences.forEach(occurrence => {
            if (!progressByArea[occurrence.area]) {
                progressByArea[occurrence.area] = [];
            }
            
            // Calcular progresso da ocorrência
            let progress = 0;
            if (occurrence.stages && occurrence.stages.length > 0) {
                const completedStages = occurrence.stages.filter(stage => stage.status === 'completed').length;
                progress = (completedStages / occurrence.stages.length) * 100;
            }
            
            progressByArea[occurrence.area].push(progress);
        });

        // Calcular progresso médio por área
        const labels = [];
        const values = [];
        
        Object.keys(progressByArea).forEach(area => {
            if (progressByArea[area].length > 0) {
                const averageProgress = progressByArea[area].reduce((sum, progress) => sum + progress, 0) / progressByArea[area].length;
                labels.push(area);
                values.push(Math.round(averageProgress));
            }
        });

        return { labels, values };
    }



    // Atualizar cards de resumo (apenas modelos)
    updateSummaryCards() {
        // Filtrar apenas RIDECs modelos
        const modelRidecs = this.ridecs.filter(ridec => !ridec.isOccurrence);
        const totalModels = modelRidecs.length;
        const totalPlannedTime = modelRidecs.reduce((total, ridec) => total + ridec.maxTime, 0);
        const completedModels = modelRidecs.filter(ridec => ridec.completed).length;
        
        // Calcular tempo total de integração (soma dos tempos das etapas RI)
        const totalIntegrationTime = modelRidecs.reduce((total, ridec) => {
            const riTime = ridec.deadlines && ridec.deadlines.RI ? ridec.deadlines.RI : 0;
            return total + riTime;
        }, 0);

        // Filtrar apenas RIDECs que são ocorrências
        const occurrences = this.ridecs.filter(ridec => ridec.isOccurrence);
        const totalOccurrences = occurrences.length;
        const activeOccurrences = occurrences.filter(occurrence => 
            occurrence.stages && occurrence.stages.some(stage => stage.status === 'active')
        ).length;
        const overdueOccurrences = occurrences.filter(occurrence => this.isOverdue(occurrence)).length;

        document.getElementById('totalRidecs').textContent = totalModels;
        document.getElementById('totalPlannedTime').textContent = totalPlannedTime + 'h';
        document.getElementById('completedRidecs').textContent = completedModels;
        document.getElementById('totalIntegrationTime').textContent = totalIntegrationTime + 'h';
        document.getElementById('totalOccurrences').textContent = totalOccurrences;
        document.getElementById('activeOccurrences').textContent = activeOccurrences;
        document.getElementById('overdueOccurrences').textContent = overdueOccurrences;
    }

    createAreaIndicators() {
        const chartsContainer = document.querySelector('.charts-grid');
        
        // Remover indicadores existentes se houver
        const existingIndicators = document.querySelector('.area-indicators');
        if (existingIndicators) {
            existingIndicators.remove();
        }

        // Criar container para indicadores
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'area-indicators';
        indicatorsContainer.style.cssText = `
            grid-column: 1 / -1;
            margin-top: 30px;
        `;

        // Adicionar título
        const title = document.createElement('h3');
                    title.textContent = 'Indicadores de Modelos por Área';
        title.style.cssText = `
            margin-bottom: 20px;
            color: #2d3748;
            font-size: 1.5rem;
            text-align: center;
        `;
        indicatorsContainer.appendChild(title);

        // Obter dados por área
        const areaData = this.getAreaIndicatorsData();
        
        // Criar grid de indicadores
        const indicatorsGrid = document.createElement('div');
        indicatorsGrid.className = 'area-indicators-grid';

        // Criar indicador para cada área
        Object.keys(areaData).forEach(area => {
            const data = areaData[area];
            const indicatorCard = this.createAreaIndicatorCard(area, data);
            indicatorsGrid.appendChild(indicatorCard);
        });

        indicatorsContainer.appendChild(indicatorsGrid);
        chartsContainer.appendChild(indicatorsContainer);
    }

    getAreaIndicatorsData() {
        const areaData = {};
        
        // Filtrar apenas RIDECs modelos
        const modelRidecs = this.ridecs.filter(ridec => !ridec.isOccurrence);
        
        modelRidecs.forEach(modelRidec => {
            const area = modelRidec.area || 'Sem Área';
            
            if (!areaData[area]) {
                areaData[area] = {
                    total: 0,
                    active: 0,
                    completed: 0,
                    overdue: 0,
                    totalTime: 0,
                    avgTime: 0,
                    
                };
            }
            
            // Dados do modelo
            areaData[area].total++;
            areaData[area].totalTime += modelRidec.maxTime || 0;
            
            if (modelRidec.completed) {
                areaData[area].completed++;
            } else {
                areaData[area].active++;
                if (this.isOverdue(modelRidec)) {
                    areaData[area].overdue++;
                }
            }
            

        });

        // Calcular médias
        Object.keys(areaData).forEach(area => {
            const data = areaData[area];
            data.avgTime = data.total > 0 ? (data.totalTime / data.total).toFixed(1) : 0;
        });

        return areaData;
    }

    createAreaIndicatorCard(area, data) {
        const card = document.createElement('div');
        card.className = 'area-indicator-card';

        // Calcular percentual de conclusão dos modelos
        const modelCompletionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : 0;

        const overdueRate = data.total > 0 ? ((data.overdue / data.total) * 100).toFixed(1) : 0;

        // Obter ícone da área
        const areaIcon = this.getAreaIcon(area);

        card.innerHTML = `
            <div class="area-indicator-header">
                <div class="area-indicator-title-wrapper">
                    <h4 class="area-indicator-title">
                        <i class="${areaIcon}"></i>
                        ${area}
                    </h4>
                </div>
                <div class="area-indicator-badge-wrapper">
                    <span class="area-indicator-badge">
                        ${data.total} Modelos
                    </span>
                </div>
            </div>
            
            <div class="area-stats-grid">
                <div class="area-stat-item">
                    <div class="area-stat-number completed">${data.completed}</div>
                    <div class="area-stat-label">Concluídos</div>
                </div>
                <div class="area-stat-item">
                    <div class="area-stat-number active">${data.active}</div>
                    <div class="area-stat-label">Ativos</div>
                </div>
                <div class="area-stat-item">
                    <div class="area-stat-number overdue">${data.overdue}</div>
                    <div class="area-stat-label">Atrasados</div>
                </div>
            </div>
            
            <div class="area-progress-bar">
                <div class="area-progress-fill" style="width: ${modelCompletionRate}%"></div>
            </div>
            
            <div class="area-time-grid">
                <div class="area-time-item">
                    <div class="area-time-value">${data.avgTime}h</div>
                    <div class="area-time-label">Tempo Médio</div>
                </div>
            </div>
            
            <div class="area-footer">
                <div class="area-footer-stats">
                    <div class="area-footer-stat">
                        <div class="area-footer-value total">${data.totalTime}h</div>
                        <div class="area-footer-label">Tempo Total</div>
                    </div>
                    <div class="area-footer-stat">
                        <div class="area-footer-value overdue">${data.overdue}</div>
                        <div class="area-footer-label">Atrasados</div>
                    </div>
                </div>
                <div class="area-overdue-rate">
                    ${overdueRate}% atrasados
                </div>
            </div>
        `;

        return card;
    }

    // Alternar visibilidade da seção de área
    toggleAreaSection(areaSection) {
        const areaContent = areaSection.querySelector('.ridec-area-content');
        const areaToggle = areaSection.querySelector('.ridec-area-toggle');
        const areaTitle = areaSection.querySelector('.ridec-area-title').textContent.trim();
        
        if (areaContent.classList.contains('minimized')) {
            // Expandir
            areaContent.classList.remove('minimized');
            areaToggle.classList.remove('minimized');
            areaToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
            areaToggle.title = 'Minimizar área';
            this.saveAreaState(areaTitle, false);
        } else {
            // Minimizar
            areaContent.classList.add('minimized');
            areaToggle.classList.add('minimized');
            areaToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
            areaToggle.title = 'Expandir área';
            this.saveAreaState(areaTitle, true);
        }
    }

    // Salvar estado da área no localStorage
    saveAreaState(areaName, isMinimized) {
        const areaStates = JSON.parse(localStorage.getItem('areaStates')) || {};
        areaStates[areaName] = isMinimized;
        localStorage.setItem('areaStates', JSON.stringify(areaStates));
    }

    // Carregar estado da área do localStorage
    loadAreaState(areaName) {
        const areaStates = JSON.parse(localStorage.getItem('areaStates')) || {};
        return areaStates[areaName] || false;
    }

    // Limpar todos os estados das áreas
    clearAreaStates() {
        localStorage.removeItem('areaStates');
    }

    // Expandir todas as áreas
    expandAllAreas() {
        const areaSections = document.querySelectorAll('.ridec-area');
        areaSections.forEach(areaSection => {
            const areaContent = areaSection.querySelector('.ridec-area-content');
            const areaToggle = areaSection.querySelector('.ridec-area-toggle');
            
            if (areaContent.classList.contains('minimized')) {
                areaContent.classList.remove('minimized');
                areaToggle.classList.remove('minimized');
                areaToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
                areaToggle.title = 'Minimizar área';
                
                const areaTitle = areaSection.querySelector('.ridec-area-title').textContent.trim();
                this.saveAreaState(areaTitle, false);
            }
        });
    }

    checkForEditRidec() {
        const editRidecId = sessionStorage.getItem('editRidecId');
        if (editRidecId) {
            sessionStorage.removeItem('editRidecId');
            this.editRidec(editRidecId);
        }
    }

    // Métodos do Chat com IA
    openAiChat() {
        // Adicionar efeito de bounce no botão
        const aiBtn = document.getElementById('aiChatBtn');
        aiBtn.style.animation = 'none';
        aiBtn.offsetHeight; // Trigger reflow
        aiBtn.style.animation = 'aiBounce 0.6s ease-out';
        
        setTimeout(() => {
            aiBtn.style.animation = 'floatingAiPulse 3s ease-in-out infinite';
        }, 600);

        document.getElementById('aiChatModal').style.display = 'block';
        document.getElementById('chatInput').focus();
        
        // Adicionar efeito de "nova mensagem" se for a primeira vez
        if (!this.chatOpened) {
            this.chatOpened = true;
            this.addWelcomeMessage();
        }
    }

    addWelcomeMessage() {
        setTimeout(() => {
            this.addAiMessage(
                `🎉 <strong>Bem-vindo ao Assistente IA!</strong><br><br>
                Posso ajudar você com qualquer pergunta sobre seus RIDECs. Algumas sugestões:`,
                [
                    'Quantos RIDECs estão atrasados?',
                    'Mostre estatísticas gerais',
                    'Como criar uma nova ocorrência?',
                    'Qual área tem mais RIDECs?'
                ]
            );
        }, 500);
    }

    closeAiChat() {
        document.getElementById('aiChatModal').style.display = 'none';
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Adicionar mensagem do usuário
        this.addUserMessage(message);
        input.value = '';

        // Processar e responder
        this.processAiResponse(message);
    }

    sendSuggestion(suggestion) {
        document.getElementById('chatInput').value = suggestion;
        this.sendMessage();
    }

    addUserMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addAiMessage(message, suggestions = []) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        
        // Converter quebras de linha em <br> e aplicar formatação melhorada
        const formattedMessage = message
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2d3748; font-weight: 700;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="color: #4a5568; font-style: italic;">$1</em>')
            .replace(/•/g, '<span style="color: #4299e1; margin-right: 8px; font-weight: bold;">•</span>')
            .replace(/📊/g, '<span style="font-size: 1.2em; margin-right: 5px;">📊</span>')
            .replace(/⏰/g, '<span style="font-size: 1.2em; margin-right: 5px;">⏰</span>')
            .replace(/🏢/g, '<span style="font-size: 1.2em; margin-right: 5px;">🏢</span>')
            .replace(/➕/g, '<span style="font-size: 1.2em; margin-right: 5px;">➕</span>')
            .replace(/⚠️/g, '<span style="font-size: 1.2em; margin-right: 5px;">⚠️</span>')
            .replace(/📈/g, '<span style="font-size: 1.2em; margin-right: 5px;">📈</span>')
            .replace(/🔧/g, '<span style="font-size: 1.2em; margin-right: 5px;">🔧</span>')
            .replace(/✅/g, '<span style="font-size: 1.2em; margin-right: 5px;">✅</span>')
            .replace(/🤖/g, '<span style="font-size: 1.2em; margin-right: 5px;">🤖</span>')
            .replace(/💡/g, '<span style="font-size: 1.2em; margin-right: 5px;">💡</span>')
            .replace(/🏆/g, '<span style="font-size: 1.2em; margin-right: 5px;">🏆</span>');
        
        let suggestionsHtml = '';
        if (suggestions.length > 0) {
            suggestionsHtml = `
                <div class="message-suggestions">
                    ${suggestions.map(suggestion => `
                        <button class="suggestion-btn" onclick="ridecSystem.sendSuggestion('${suggestion}')">
                            ${suggestion}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text" style="line-height: 1.6; color: #2d3748; font-size: 0.95rem;">
                    ${formattedMessage}
                </div>
                ${suggestionsHtml}
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    processAiResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Mostrar indicador de "digitando"
        this.showTypingIndicator();
        
        // Simular processamento
        setTimeout(() => {
            this.hideTypingIndicator();
            let response = '';
            let suggestions = [];

            if (message.includes('atrasado') || message.includes('atrasados') || message.includes('atraso')) {
                const overdueRidecs = this.ridecs.filter(r => !r.completed && this.isOverdue(r));
                response = `⚠️ **Relatório de RIDECs Atrasados**\n\n`;
                response += `**Status Atual:** ${overdueRidecs.length} RIDEC(s) atrasado(s)\n\n`;
                
                if (overdueRidecs.length > 0) {
                    response += `**📋 Lista Detalhada:**\n`;
                    overdueRidecs.forEach((ridec, index) => {
                        const elapsed = this.getElapsedTimeInHours(ridec);
                        const overdue = elapsed - ridec.maxTime;
                        response += `• **${ridec.title}**\n`;
                        response += `  📍 Área: ${ridec.area}\n`;
                        response += `  ⏰ Atraso: ${overdue.toFixed(1)}h\n`;
                        response += `  📊 Tempo Decorrido: ${elapsed.toFixed(1)}h\n\n`;
                    });
                } else {
                    response += `✅ **Parabéns!** Todos os RIDECs estão dentro do prazo estabelecido.\n\n`;
                    response += `🎯 **Dica:** Continue monitorando para manter essa excelente performance!`;
                }
                
                suggestions = [
                    'Como resolver RIDECs atrasados?',
                    'Mostrar estatísticas por área',
                    'Quais RIDECs estão próximos do prazo?'
                ];
            }
            else if (message.includes('estatística') || message.includes('estatisticas') || message.includes('relatório') || message.includes('relatorio') || message.includes('dados') || message.includes('resumo')) {
                const total = this.ridecs.length;
                const completed = this.ridecs.filter(r => r.completed).length;
                const active = total - completed;
                const overdue = this.ridecs.filter(r => !r.completed && this.isOverdue(r)).length;
                const completionRate = total > 0 ? ((completed/total)*100).toFixed(1) : 0;
                
                response = `📊 **Dashboard de Estatísticas - Sistema RIDEC**\n\n`;
                response += `**📈 Resumo Geral:**\n`;
                response += `• **Total de RIDECs:** ${total}\n`;
                response += `• **Concluídos:** ${completed} (${completionRate}%)\n`;
                response += `• **Em Andamento:** ${active}\n`;
                response += `• **Atrasados:** ${overdue}\n\n`;
                
                if (total > 0) {
                    const avgTime = this.ridecs.reduce((sum, r) => sum + r.maxTime, 0) / total;
                    const totalTime = this.ridecs.reduce((sum, r) => sum + r.maxTime, 0);
                    
                    response += `**⏰ Métricas de Tempo:**\n`;
                    response += `• **Tempo Total Planejado:** ${totalTime}h\n`;
                    response += `• **Tempo Médio por RIDEC:** ${avgTime.toFixed(1)}h\n\n`;
                    
                    response += `**🎯 Performance:**\n`;
                    if (completionRate >= 80) {
                        response += `• **Excelente!** Taxa de conclusão alta (${completionRate}%)\n`;
                    } else if (completionRate >= 60) {
                        response += `• **Bom!** Taxa de conclusão satisfatória (${completionRate}%)\n`;
                    } else {
                        response += `• **Atenção!** Taxa de conclusão baixa (${completionRate}%)\n`;
                    }
                }
                
                suggestions = [
                    'Mostrar RIDECs por área',
                    'Quais RIDECs estão atrasados?',
                    'Como criar um novo RIDEC?'
                ];
            }
            else if (message.includes('criar') || message.includes('novo') || message.includes('adicionar') || message.includes('ocorrência') || message.includes('ocorrencia')) {
                response = `➕ **Guia Completo - Criar RIDEC**\n\n`;
                response += `**📝 Passo a Passo:**\n`;
                response += `1. **Clique no botão "Novo RIDEC"** no cabeçalho da página\n`;
                response += `2. **Preencha os campos obrigatórios:**\n`;
                response += `   • Título do RIDEC\n`;
                response += `   • Descrição detalhada\n`;
                response += `   • Área responsável\n`;
                response += `   • Tempo máximo (em horas)\n`;
                response += `3. **Configure os prazos das etapas:** RI, D, E, C\n`;
                response += `4. **Clique em "Salvar"**\n\n`;
                
                
                response += `• Use o botão "Criar Nova Ocorrência" na página de detalhes\n`;
                response += `• Configure etapas A personalizadas se necessário\n\n`;
                
                response += `💡 **Dicas Importantes:**\n`;
                response += `• Defina prazos realistas para cada etapa\n`;
                response += `• Use descrições claras e objetivas\n`;
                response += `• Escolha a área responsável corretamente\n`;
                response += `• Configure etapas A para fluxos complexos`;
                
                suggestions = [
                    'Como configurar etapas A?',
                    'Mostrar RIDECs existentes',
                    'Como editar um RIDEC?'
                ];
            }
            else if (message.includes('área') || message.includes('areas') || message.includes('departamento') || message.includes('desenvolvimento')) {
                const areas = {};
                this.ridecs.forEach(ridec => {
                    const area = ridec.area || 'Sem Área';
                    if (!areas[area]) areas[area] = 0;
                    areas[area]++;
                });
                
                response = `🏢 **Análise por Áreas - Sistema RIDEC**\n\n`;
                response += `**📊 Distribuição Atual:**\n`;
                
                // Ordenar áreas por quantidade de RIDECs
                const sortedAreas = Object.keys(areas).sort((a, b) => areas[b] - areas[a]);
                
                sortedAreas.forEach((area, index) => {
                    const count = areas[area];
                    const percentage = this.ridecs.length > 0 ? ((count / this.ridecs.length) * 100).toFixed(1) : 0;
                    
                    if (index === 0) {
                        response += `🏆 **${area}:** ${count} RIDEC(s) (${percentage}%) - *Líder*\n`;
                    } else {
                        response += `• **${area}:** ${count} RIDEC(s) (${percentage}%)\n`;
                    }
                });
                
                response += `\n**📈 Insights:**\n`;
                if (sortedAreas.length > 0) {
                    const topArea = sortedAreas[0];
                    const topCount = areas[topArea];
                    response += `• **Área mais ativa:** ${topArea} com ${topCount} RIDEC(s)\n`;
                    response += `• **Total de áreas:** ${sortedAreas.length}\n`;
                    response += `• **Distribuição:** ${this.ridecs.length} RIDECs distribuídos\n`;
                }
                
                suggestions = [
                    'Mostrar estatísticas gerais',
                    'Quais RIDECs estão atrasados?',
                    'Como filtrar por área?'
                ];
            }
            else if (message.includes('tempo') || message.includes('prazo') || message.includes('duração') || message.includes('duracao') || message.includes('horas') || message.includes('tempo decorrido') || message.includes('mais tempo')) {
                const totalTime = this.ridecs.reduce((sum, r) => sum + r.maxTime, 0);
                const avgTime = this.ridecs.length > 0 ? totalTime / this.ridecs.length : 0;
                
                response = `⏰ **Informações sobre Tempos:**\n\n`;
                response += `• **Tempo Total Planejado:** ${totalTime}h\n`;
                response += `• **Tempo Médio por RIDEC:** ${avgTime.toFixed(1)}h\n\n`;
                
                // RIDEC com mais tempo decorrido
                const ridecWithMostTime = this.getRidecWithMostElapsedTime();
                if (ridecWithMostTime) {
                    response += `• **RIDEC com Maior Tempo Decorrido:** ${ridecWithMostTime.title} (${this.getElapsedTime(ridecWithMostTime)})\n`;
                }
                
                // RIDEC com mais tempo planejado
                if (this.ridecs.length > 0) {
                            const longestRidec = this.ridecs.reduce((max, r) => r.maxTime > max.maxTime ? r : max, this.ridecs[0]);
        const timeUnit = longestRidec.timeUnit || 'hours';
        const unitLabel = this.getTimeUnitLabel(timeUnit);
        response += `• **RIDEC com Maior Prazo:** ${longestRidec.title} (${longestRidec.maxTime}${unitLabel})\n`;
                }
                
                suggestions = [
                    'Quais RIDECs estão atrasados?',
                    'Mostrar progresso dos RIDECs',
                    'Como gerenciar prazos?'
                ];
            }
            else if (message.includes('progresso') || message.includes('status') || message.includes('andamento')) {
                const activeRidecs = this.ridecs.filter(r => !r.completed);
                const completedRidecs = this.ridecs.filter(r => r.completed);
                
                response = `📊 **Progresso dos RIDECs:**\n\n`;
                response += `• **Em Andamento:** ${activeRidecs.length} RIDEC(s)\n`;
                response += `• **Concluídos:** ${completedRidecs.length} RIDEC(s)\n`;
                
                if (activeRidecs.length > 0) {
                    response += `\n**RIDECs Ativos:**\n`;
                    activeRidecs.forEach(ridec => {
                        const progress = this.getProgress(ridec);
                        response += `• **${ridec.title}** - ${progress}% concluído\n`;
                    });
                }
                
                suggestions = [
                    'Quais RIDECs estão atrasados?',
                    'Mostrar estatísticas gerais',
                    'Como marcar RIDEC como concluído?'
                ];
            }
            else if (message.includes('ajuda') || message.includes('help') || message.includes('como usar') || message.includes('tutorial')) {
                response = `🤖 **Guia de Uso do Sistema RIDEC:**\n\n`;
                response += `**📋 Funcionalidades Principais:**\n`;
                response += `• **Criar RIDECs:** Use o botão "Novo RIDEC"\n`;
                response += `• **Criação Automática:** Descreva seu processo e a IA criará RIDECs\n`;

                response += `• **Visualizar Gráficos:** Acesse a aba "Gráficos"\n`;
                response += `• **Configurar Etapas:** Edite os modelos para adicionar etapas A\n`;
                response += `• **Monitorar Prazos:** Sistema alerta sobre atrasos\n\n`;
                response += `**🔧 Dicas de Uso:**\n`;
                response += `• Use o sistema de notificações para acompanhar atualizações\n`;
                response += `• Configure etapas A personalizadas para seu fluxo\n`;
                response += `• Monitore os gráficos para insights de performance\n`;
                response += `• Use o chat IA para dúvidas rápidas\n`;
                response += `• **Descreva seus processos** e a IA criará RIDECs automaticamente`;
                
                suggestions = [
                    'Como criar um novo RIDEC?',
                    'Criar RIDECs automaticamente',
                    'Mostrar estatísticas gerais',
                    'Como configurar etapas A?'
                ];
            }
            else if (message.includes('criar automaticamente') || message.includes('gerar automaticamente') || message.includes('processo') || message.includes('fluxo') || message.includes('descrever') || message.includes('automatizar')) {
                response = `🤖 **Criação Automática de RIDECs**\n\n`;
                response += `**✨ Nova Funcionalidade Inteligente!**\n\n`;
                response += `**📝 Como Funciona:**\n`;
                response += `• **Descreva seu processo** em linguagem natural\n`;
                response += `• **A IA analisa** e identifica etapas, prazos e responsabilidades\n`;
                response += `• **RIDECs são criados** automaticamente com configurações otimizadas\n`;
                response += `• **Etapas A personalizadas** são sugeridas quando necessário\n\n`;
                response += `**🎯 Exemplos de Descrições:**\n`;
                response += `• "Processo de desenvolvimento de software com análise, codificação e testes"\n`;
                response += `• "Fluxo de aprovação de documentos com revisão técnica e validação"\n`;
                response += `• "Processo de onboarding de funcionários com documentação e treinamento"\n\n`;
                response += `**💡 Dica:** Seja específico sobre prazos, responsabilidades e etapas para melhores resultados!`;
                
                suggestions = [
                    'Descrever processo de desenvolvimento',
                    'Criar fluxo de aprovação',
                    'Processo de onboarding',
                    'Como funciona a IA?'
                ];
            }
            else if (this.isProcessDescription(userMessage)) {
                // Tentar criar RIDECs automaticamente baseado na descrição
                const createdRidecs = this.createRidecsFromDescription(userMessage);
                
                if (createdRidecs.length > 0) {
                    response = `🤖 **RIDECs Criados Automaticamente!**\n\n`;
                    response += `**✅ Análise Concluída:** Identifiquei ${createdRidecs.length} processo(s) na sua descrição.\n\n`;
                    response += `**📋 RIDECs Criados:**\n`;
                    
                    createdRidecs.forEach((ridec, index) => {
                        response += `${index + 1}. **${ridec.title}**\n`;
                        response += `   📍 Área: ${ridec.area}\n`;
                        response += `   ⏰ Prazo: ${ridec.maxTime}${this.getTimeUnitLabel(ridec.timeUnit || 'hours').charAt(0)}\n`;
                        response += `   📝 Descrição: ${ridec.description}\n`;
                        if (ridec.stagesA && ridec.stagesA.length > 0) {
                            response += `   🔧 Etapas A: ${ridec.stagesA.map(s => s.identifier).join(', ')}\n`;
                        }
                        response += `\n`;
                    });
                    
                    response += `**🎯 Próximos Passos:**\n`;
                    response += `• Os RIDECs foram salvos como **modelos**\n`;
                    response += `• **Edite** os modelos se necessário\n`;
                    response += `💡 **Dica:** Os prazos e etapas foram otimizados baseados na sua descrição!`;
                    
                    suggestions = [
                        'Mostrar RIDECs criados',
        
                        'Editar configurações',
                        'Mostrar estatísticas'
                    ];
                } else {
                    response = `🤖 **Análise de Processo**\n\n`;
                    response += `**📝 Entendi sua descrição:** "${userMessage}"\n\n`;
                    response += `**❓ Preciso de mais detalhes para criar RIDECs:**\n`;
                    response += `• **Prazos específicos** para cada etapa\n`;
                    response += `• **Área responsável** pelo processo\n`;
                    response += `• **Etapas detalhadas** do fluxo\n`;
                    response += `• **Responsabilidades** de cada etapa\n\n`;
                    response += `**💡 Exemplo de descrição completa:**\n`;
                    response += `"Processo de desenvolvimento de software que leva 40 horas, com análise (8h), codificação (20h), testes (8h) e documentação (4h), responsabilidade da área de TI"`;
                    
                    suggestions = [
                        'Descrever com mais detalhes',
                        'Exemplo de processo completo',
                        'Como funciona a IA?',
                        'Criar manualmente'
                    ];
                }
            }
            else {
                // Resposta genérica para perguntas não reconhecidas
                response = `🤖 **Assistente IA - RIDEC System**\n\n`;
                response += `Entendi sua pergunta sobre **"${userMessage}"**.\n\n`;
                response += `**🎯 Como posso ajudar você hoje?**\n`;
                response += `• 📊 **Estatísticas e Relatórios** - Dados completos do sistema\n`;
                response += `• ⏰ **Gestão de Tempos** - Prazos e cronogramas\n`;
                response += `• 🏢 **Análise por Áreas** - Distribuição e performance\n`;
                response += `• ➕ **Criação de RIDECs** - Guias e tutoriais\n`;
                response += `• ⚠️ **Monitoramento** - Atrasos e alertas\n`;
                response += `• 📈 **Performance** - Métricas e insights\n`;
                response += `• 🔧 **Suporte** - Ajuda e dicas\n\n`;
                
                response += `💡 **Dica:** Use palavras-chave como "estatísticas", "atrasados", "criar", "área" para obter respostas mais específicas.\n\n`;
                response += `**Escolha uma das opções abaixo ou faça uma nova pergunta:**`;
                
                suggestions = [
                    'Quantos RIDECs estão atrasados?',
                    'Mostrar estatísticas gerais',
                    'Como criar uma nova ocorrência?',
                    'Qual área tem mais RIDECs?',
                    'Como usar o sistema?',
                    'Criar RIDECs automaticamente'
                ];
            }

            this.addAiMessage(response, suggestions);
        }, 1500);
    }

    getRidecWithMostElapsedTime() {
        let maxTime = 0;
        let ridecWithMaxTime = null;

        this.ridecs.forEach(ridec => {
            if (!ridec.completed) {
                const elapsed = this.getElapsedTimeInHours(ridec);
                if (elapsed > maxTime) {
                    maxTime = elapsed;
                    ridecWithMaxTime = ridec;
                }
            }
        });

        return ridecWithMaxTime;
    }

    getElapsedTimeInHours(ridec) {
        if (!ridec.startTime) return 0;
        const now = Date.now();
        return (now - ridec.startTime) / (1000 * 60 * 60);
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text typing-text">
                    <span class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showAiWelcomeMessage() {
        if (this.showAiWelcome) {
            setTimeout(() => {
                this.showNotification('🤖 Olá! Clique no botão IA para fazer perguntas sobre seus RIDECs!', 'info', false);
                this.showAiWelcome = false;
            }, 2000);
        }
    }

    // Verificar se a mensagem é uma descrição de processo
    isProcessDescription(message) {
        const processKeywords = [
            'processo', 'fluxo', 'etapa', 'fase', 'desenvolvimento', 'produção', 'análise', 
            'codificação', 'teste', 'documentação', 'revisão', 'aprovação', 'validação',
            'onboarding', 'treinamento', 'implementação', 'deploy', 'manutenção',
            'horas', 'dias', 'semanas', 'prazo', 'tempo', 'duração'
        ];
        
        const hasProcessKeywords = processKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        // Verificar se tem pelo menos 20 caracteres e não é uma pergunta direta
        const isLongEnough = message.length > 20;
        const isNotDirectQuestion = !message.includes('?') && !message.includes('como') && !message.includes('quando') && !message.includes('onde');
        
        return hasProcessKeywords && isLongEnough && isNotDirectQuestion;
    }

    // Criar RIDECs automaticamente baseado na descrição
    createRidecsFromDescription(description) {
        const createdRidecs = [];
        const lowerDesc = description.toLowerCase();
        
        // Padrões de reconhecimento de processos
        const processPatterns = [
            {
                name: 'Desenvolvimento de Software',
                keywords: ['desenvolvimento', 'software', 'programação', 'codificação', 'código'],
                area: 'TI',
                baseTime: 40,
                stages: [
                    { name: 'Análise de Requisitos', time: 8, position: 'ri-d' },
                    { name: 'Codificação', time: 20, position: 'd-e' },
                    { name: 'Testes', time: 8, position: 'e-c' },
                    { name: 'Documentação', time: 4, position: 'after-c' }
                ]
            },
            {
                name: 'Fluxo de Aprovação',
                keywords: ['aprovação', 'revisão', 'validação', 'autorização'],
                area: 'Administrativo',
                baseTime: 24,
                stages: [
                    { name: 'Análise Inicial', time: 4, position: 'ri-d' },
                    { name: 'Revisão Técnica', time: 8, position: 'd-e' },
                    { name: 'Aprovação Gerencial', time: 8, position: 'e-c' },
                    { name: 'Notificação', time: 4, position: 'after-c' }
                ]
            },
            {
                name: 'Onboarding de Funcionários',
                keywords: ['onboarding', 'funcionário', 'colaborador', 'treinamento', 'integração'],
                area: 'RH',
                baseTime: 32,
                stages: [
                    { name: 'Documentação', time: 8, position: 'ri-d' },
                    { name: 'Treinamento', time: 16, position: 'd-e' },
                    { name: 'Avaliação', time: 4, position: 'e-c' },
                    { name: 'Integração', time: 4, position: 'after-c' }
                ]
            },
            {
                name: 'Manutenção de Sistemas',
                keywords: ['manutenção', 'sistema', 'correção', 'bug', 'atualização'],
                area: 'TI',
                baseTime: 16,
                stages: [
                    { name: 'Identificação', time: 2, position: 'ri-d' },
                    { name: 'Análise', time: 4, position: 'd-e' },
                    { name: 'Correção', time: 6, position: 'e-c' },
                    { name: 'Teste', time: 4, position: 'after-c' }
                ]
            }
        ];
        
        // Procurar por padrões na descrição
        for (const pattern of processPatterns) {
            const matches = pattern.keywords.filter(keyword => lowerDesc.includes(keyword));
            if (matches.length >= 2) { // Pelo menos 2 palavras-chave devem corresponder
                // Extrair tempo da descrição se mencionado
                let time = pattern.baseTime;
                const timeMatch = description.match(/(\d+)\s*(horas?|h|dias?|d|semanas?|sem)/i);
                if (timeMatch) {
                    time = parseInt(timeMatch[1]);
                    if (timeMatch[2].toLowerCase().includes('dia')) time *= 8;
                    if (timeMatch[2].toLowerCase().includes('semana')) time *= 40;
                }
                
                // Extrair área da descrição se mencionada
                let area = pattern.area;
                const areaKeywords = {
                    'ti': ['ti', 'tecnologia', 'desenvolvimento', 'software', 'sistema'],
                    'rh': ['rh', 'recursos humanos', 'funcionário', 'colaborador'],
                    'administrativo': ['administrativo', 'administração', 'gerencial'],
                    'financeiro': ['financeiro', 'contabilidade', 'orçamento'],
                    'marketing': ['marketing', 'publicidade', 'comunicação']
                };
                
                for (const [areaName, keywords] of Object.entries(areaKeywords)) {
                    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                        area = areaName.charAt(0).toUpperCase() + areaName.slice(1);
                        break;
                    }
                }
                
                // Criar RIDEC
                const ridec = {
                    id: this.generateId(),
                    title: pattern.name,
                    description: `Processo de ${pattern.name.toLowerCase()} criado automaticamente baseado na descrição: "${description}"`,
                    area: area,
                    maxTime: time,
                    timeUnit: 'hours',
                    deadlines: {
                        RI: Math.floor(time * 0.2),
                        D: Math.floor(time * 0.3),
                        E: Math.floor(time * 0.3),
                        C: Math.floor(time * 0.2)
                    },
                    deadlineUnits: {
                        RI: 'hours',
                        D: 'hours',
                        E: 'hours',
                        C: 'hours'
                    },
                    stagesA: [],
                    currentStage: 'RI',
                    startTime: Date.now(),
                    completed: false,
                    isOccurrence: false
                };
                
                // Adicionar etapas A baseadas no padrão
                pattern.stages.forEach((stage, index) => {
                    ridec.stagesA.push({
                        identifier: `Etapa${index + 1}`,
                        name: stage.name,
                        deadline: stage.time,
                        timeUnit: 'hours',
                        description: `Etapa ${index + 1}: ${stage.name}`
                    });
                });
                
                // Adicionar relacionamentos se houver múltiplos RIDECs
                if (createdRidecs.length > 0) {
                    ridec.relations = {
                        start: createdRidecs[createdRidecs.length - 1].id,
                        end: ''
                    };
                } else {
                    ridec.relations = { start: '', end: '' };
                }
                
                createdRidecs.push(ridec);
                this.ridecs.push(ridec);
                break; // Parar após encontrar o primeiro padrão que corresponde
            }
        }
        
        // Se não encontrou padrões específicos, criar um RIDEC genérico
        if (createdRidecs.length === 0) {
            const genericRidec = this.createGenericRidec(description);
            if (genericRidec) {
                createdRidecs.push(genericRidec);
                this.ridecs.push(genericRidec);
            }
        }
        
        // Salvar no localStorage
        this.saveToLocalStorage();
        
        return createdRidecs;
    }

    // Criar RIDEC genérico quando não há padrão específico
    createGenericRidec(description) {
        const lowerDesc = description.toLowerCase();
        
        // Extrair informações básicas
        let time = 24; // Padrão: 24 horas
        let area = 'Geral';
        let title = 'Processo Personalizado';
        
        // Extrair tempo
        const timeMatch = description.match(/(\d+)\s*(horas?|h|dias?|d|semanas?|sem)/i);
        if (timeMatch) {
            time = parseInt(timeMatch[1]);
            if (timeMatch[2].toLowerCase().includes('dia')) time *= 8;
            if (timeMatch[2].toLowerCase().includes('semana')) time *= 40;
        }
        
        // Extrair área
        const areaKeywords = {
            'ti': ['ti', 'tecnologia', 'desenvolvimento', 'software', 'sistema'],
            'rh': ['rh', 'recursos humanos', 'funcionário', 'colaborador'],
            'administrativo': ['administrativo', 'administração', 'gerencial'],
            'financeiro': ['financeiro', 'contabilidade', 'orçamento'],
            'marketing': ['marketing', 'publicidade', 'comunicação']
        };
        
        for (const [areaName, keywords] of Object.entries(areaKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                area = areaName.charAt(0).toUpperCase() + areaName.slice(1);
                break;
            }
        }
        
        // Gerar título baseado no conteúdo
        if (lowerDesc.includes('processo')) title = 'Processo Operacional';
        if (lowerDesc.includes('fluxo')) title = 'Fluxo de Trabalho';
        if (lowerDesc.includes('sistema')) title = 'Processo de Sistema';
        
        const ridec = {
            id: this.generateId(),
            title: title,
            description: `Processo criado automaticamente baseado na descrição: "${description}"`,
            area: area,
            maxTime: time,
            timeUnit: 'hours',
            deadlines: {
                RI: Math.floor(time * 0.25),
                D: Math.floor(time * 0.25),
                E: Math.floor(time * 0.25),
                C: Math.floor(time * 0.25)
            },
            deadlineUnits: {
                RI: 'hours',
                D: 'hours',
                E: 'hours',
                C: 'hours'
            },
            stagesA: [],
            currentStage: 'RI',
            startTime: Date.now(),
            completed: false,
            isOccurrence: false,
            relations: { start: '', end: '' }
        };
        
        return ridec;
    }

    // Métodos para gerenciar integrações
    openIntegrationModal(ridecId) {
        this.currentRidecId = ridecId;
        const ridec = this.ridecs.find(r => r.id === ridecId);
        if (!ridec) return;

        document.getElementById('integrationRidecTitle').textContent = `Configurar Integrações - ${ridec.title}`;
        this.renderStagesIntegrationList(ridec);
        this.loadIntegrationConfig(ridec);
        this.initializeIntegrationEventListeners();
        this.addSimulationButtons();
        
        const modal = document.getElementById('integrationModal');
        modal.style.display = 'block';
    }

    closeIntegrationModal() {
        document.getElementById('integrationModal').style.display = 'none';
        this.currentRidecId = null;
    }

    initializeIntegrationEventListeners() {
        // Event listeners para configurações avançadas
        document.querySelectorAll('.system-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const system = card.dataset.system;
                this.openSystemConfigModal(system);
            });
        });

        // Event listeners para triggers
        document.querySelectorAll('.trigger-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateTriggerConfiguration(e.target);
            });
        });

        // Event listeners para configurações avançadas por etapa
        document.querySelectorAll('.stage-integration-item').forEach(item => {
            const advancedBtn = item.querySelector('.advanced-config-btn');
            if (advancedBtn) {
                advancedBtn.addEventListener('click', (e) => {
                    const stageId = item.dataset.stage;
                    this.openAdvancedStageConfig(stageId);
                });
            }
        });
    }

    openSystemConfigModal(system) {
        const systemConfigs = {
            slack: {
                name: 'Slack',
                icon: 'fab fa-slack',
                color: '#4a154b',
                fields: [
                    { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...' },
                    { name: 'channel', label: 'Canal', type: 'text', placeholder: '#general' },
                    { name: 'start_message', label: 'Mensagem para Iniciar', type: 'text', placeholder: '/ridec start {stage}' },
                    { name: 'finish_message', label: 'Mensagem para Finalizar', type: 'text', placeholder: '/ridec finish {stage}' }
                ]
            },
            jira: {
                name: 'Jira',
                icon: 'fab fa-jira',
                color: '#0052cc',
                fields: [
                    { name: 'api_url', label: 'API URL', type: 'url', placeholder: 'https://your-domain.atlassian.net' },
                    { name: 'username', label: 'Usuário', type: 'text', placeholder: 'seu-email@exemplo.com' },
                    { name: 'api_token', label: 'API Token', type: 'password', placeholder: 'Seu token de API' },
                    { name: 'project_key', label: 'Chave do Projeto', type: 'text', placeholder: 'PROJ' }
                ]
            },
            teams: {
                name: 'Microsoft Teams',
                icon: 'fab fa-microsoft',
                color: '#6264a7',
                fields: [
                    { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://outlook.office.com/webhook/...' },
                    { name: 'channel', label: 'Canal', type: 'text', placeholder: 'Geral' }
                ]
            },
            email: {
                name: 'Email',
                icon: 'fas fa-envelope',
                color: '#ea4335',
                fields: [
                    { name: 'smtp_server', label: 'Servidor SMTP', type: 'text', placeholder: 'smtp.gmail.com' },
                    { name: 'smtp_port', label: 'Porta SMTP', type: 'number', placeholder: '587' },
                    { name: 'username', label: 'Email', type: 'email', placeholder: 'seu-email@gmail.com' },
                    { name: 'password', label: 'Senha', type: 'password', placeholder: 'Sua senha' }
                ]
            },
            webhook: {
                name: 'Webhook Customizado',
                icon: 'fas fa-link',
                color: '#667eea',
                fields: [
                    { name: 'start_url', label: 'URL para Iniciar', type: 'url', placeholder: 'https://api.exemplo.com/start' },
                    { name: 'finish_url', label: 'URL para Finalizar', type: 'url', placeholder: 'https://api.exemplo.com/finish' },
                    { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua chave de API' }
                ]
            },
            calendar: {
                name: 'Google Calendar',
                icon: 'fas fa-calendar-alt',
                color: '#4285f4',
                fields: [
                    { name: 'calendar_id', label: 'ID do Calendário', type: 'text', placeholder: 'primary' },
                    { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua chave de API do Google' }
                ]
            }
        };

        const config = systemConfigs[system];
        if (!config) return;

        this.showSystemConfigModal(config);
    }

    showSystemConfigModal(config) {
        const modalHtml = `
            <div id="systemConfigModal" class="modal">
                <div class="modal-content system-config-modal">
                    <div class="modal-header">
                        <h2>
                            <i class="${config.icon}" style="color: ${config.color}"></i>
                            Configurar ${config.name}
                        </h2>
                        <span class="close" onclick="ridecSystem.closeSystemConfigModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="system-config-form">
                            ${config.fields.map(field => `
                                <div class="form-group">
                                    <label for="${field.name}">${field.label}</label>
                                    <input type="${field.type}" 
                                           id="${field.name}" 
                                           name="${field.name}" 
                                           placeholder="${field.placeholder}"
                                           class="form-control">
                                </div>
                            `).join('')}
                            
                            <div class="system-config-actions">
                                <button class="btn btn-secondary" onclick="ridecSystem.testSystemConnection('${config.name.toLowerCase()}')">
                                    <i class="fas fa-plug"></i>
                                    Testar Conexão
                                </button>
                                <button class="btn btn-primary" onclick="ridecSystem.saveSystemConfig('${config.name.toLowerCase()}')">
                                    <i class="fas fa-save"></i>
                                    Salvar Configuração
                                </button>
                            </div>
                            
                            <div class="connection-status" id="connectionStatus" style="display: none;">
                                <div class="status-indicator"></div>
                                <span class="status-text"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const existingModal = document.getElementById('systemConfigModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Carregar configurações existentes
        this.loadSystemConfig(config.name.toLowerCase());
        
        // Mostrar modal
        document.getElementById('systemConfigModal').style.display = 'block';
    }

    closeSystemConfigModal() {
        const modal = document.getElementById('systemConfigModal');
        if (modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    }

    loadSystemConfig(system) {
        const config = JSON.parse(localStorage.getItem(`system_config_${system}`)) || {};
        
        Object.keys(config).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = config[key];
            }
        });
    }

    saveSystemConfig(system) {
        const config = {};
        const fields = document.querySelectorAll(`#systemConfigModal input`);
        
        fields.forEach(field => {
            if (field.value.trim()) {
                config[field.name] = field.value;
            }
        });

        localStorage.setItem(`system_config_${system}`, JSON.stringify(config));
        
        // Atualizar status do sistema
        this.updateSystemStatus(system, 'connected');
        
        this.showNotification(`Configuração do ${system} salva com sucesso!`, 'success', false);
        this.closeSystemConfigModal();
    }

    testSystemConnection(system) {
        const statusDiv = document.getElementById('connectionStatus');
        const statusIndicator = statusDiv.querySelector('.status-indicator');
        const statusText = statusDiv.querySelector('.status-text');
        
        statusDiv.style.display = 'flex';
        statusIndicator.className = 'status-indicator testing';
        statusText.textContent = 'Testando conexão...';

        // Simular teste de conexão
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% de chance de sucesso
            
            if (success) {
                statusIndicator.className = 'status-indicator success';
                statusText.textContent = 'Conexão bem-sucedida!';
                this.showNotification(`Conexão com ${system} testada com sucesso!`, 'success', false);
            } else {
                statusIndicator.className = 'status-indicator error';
                statusText.textContent = 'Falha na conexão. Verifique as configurações.';
                this.showNotification(`Falha ao conectar com ${system}. Verifique as configurações.`, 'error', false);
            }
        }, 2000);
    }

    updateSystemStatus(system, status) {
        const systemCard = document.querySelector(`[data-system="${system}"]`);
        if (systemCard) {
            const statusBadge = systemCard.querySelector('.status-badge');
            statusBadge.className = `status-badge ${status}`;
            statusBadge.textContent = status === 'connected' ? 'Conectado' : 'Desconectado';
        }
    }

    openAdvancedStageConfig(stageId) {
        const ridec = this.ridecs.find(r => r.id === this.currentRidecId);
        if (!ridec) return;

        const stageConfig = ridec.integrations && ridec.integrations[stageId] ? ridec.integrations[stageId] : {};
        
        const modalHtml = `
            <div id="advancedStageConfigModal" class="modal">
                <div class="modal-content advanced-config-modal">
                    <div class="modal-header">
                        <h2>
                            <i class="fas fa-cogs"></i>
                            Configuração Avançada - Etapa ${stageId}
                        </h2>
                        <span class="close" onclick="ridecSystem.closeAdvancedStageConfig()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="advanced-config-tabs">
                            <div class="tab-buttons">
                                <button class="tab-btn active" data-tab="triggers">Triggers</button>
                                <button class="tab-btn" data-tab="conditions">Condições</button>
                                <button class="tab-btn" data-tab="actions">Ações</button>
                                <button class="tab-btn" data-tab="logs">Logs</button>
                            </div>
                            
                            <div class="tab-content">
                                <div class="tab-pane active" id="triggers-tab">
                                    ${this.createTriggersTab(stageId, stageConfig)}
                                </div>
                                
                                <div class="tab-pane" id="conditions-tab">
                                    ${this.createConditionsTab(stageId, stageConfig)}
                                </div>
                                
                                <div class="tab-pane" id="actions-tab">
                                    ${this.createActionsTab(stageId, stageConfig)}
                                </div>
                                
                                <div class="tab-pane" id="logs-tab">
                                    ${this.createLogsTab(stageId)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ridecSystem.closeAdvancedStageConfig()">Cancelar</button>
                        <button class="btn btn-primary" onclick="ridecSystem.saveAdvancedStageConfig('${stageId}')">
                            <i class="fas fa-save"></i>
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const existingModal = document.getElementById('advancedStageConfigModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Inicializar tabs
        this.initializeAdvancedConfigTabs();
        
        // Mostrar modal
        document.getElementById('advancedStageConfigModal').style.display = 'block';
    }

    createTriggersTab(stageId, stageConfig) {
        return `
            <div class="triggers-config-advanced">
                <div class="trigger-section">
                    <h4>Triggers de Início</h4>
                    <div class="trigger-grid">
                        <div class="trigger-card">
                            <div class="trigger-header">
                                <i class="fab fa-slack"></i>
                                <span>Slack</span>
                            </div>
                            <div class="trigger-content">
                                <label class="trigger-option">
                                    <input type="checkbox" data-system="slack" data-action="start" ${stageConfig.slack?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Mensagem específica</span>
                                </label>
                                <input type="text" placeholder="Palavra-chave para trigger" class="trigger-keyword" 
                                       value="${stageConfig.slack?.startKeyword || ''}" data-system="slack" data-action="start">
                            </div>
                        </div>
                        
                        <div class="trigger-card">
                            <div class="trigger-header">
                                <i class="fab fa-jira"></i>
                                <span>Jira</span>
                            </div>
                            <div class="trigger-content">
                                <label class="trigger-option">
                                    <input type="checkbox" data-system="jira" data-action="start" ${stageConfig.jira?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Status alterado</span>
                                </label>
                                <select class="trigger-status" data-system="jira" data-action="start">
                                    <option value="in-progress" ${stageConfig.jira?.startStatus === 'in-progress' ? 'selected' : ''}>Em Progresso</option>
                                    <option value="review" ${stageConfig.jira?.startStatus === 'review' ? 'selected' : ''}>Em Revisão</option>
                                    <option value="testing" ${stageConfig.jira?.startStatus === 'testing' ? 'selected' : ''}>Em Teste</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="trigger-card">
                            <div class="trigger-header">
                                <i class="fas fa-envelope"></i>
                                <span>Email</span>
                            </div>
                            <div class="trigger-content">
                                <label class="trigger-option">
                                    <input type="checkbox" data-system="email" data-action="start" ${stageConfig.email?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Assunto específico</span>
                                </label>
                                <input type="text" placeholder="Assunto do email" class="trigger-subject" 
                                       value="${stageConfig.email?.startSubject || ''}" data-system="email" data-action="start">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="trigger-section">
                    <h4>Triggers de Finalização</h4>
                    <div class="trigger-grid">
                        <div class="trigger-card">
                            <div class="trigger-header">
                                <i class="fab fa-slack"></i>
                                <span>Slack</span>
                            </div>
                            <div class="trigger-content">
                                <label class="trigger-option">
                                    <input type="checkbox" data-system="slack" data-action="finish" ${stageConfig.slack?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Comando específico</span>
                                </label>
                                <input type="text" placeholder="Comando para finalizar" class="trigger-command" 
                                       value="${stageConfig.slack?.finishCommand || ''}" data-system="slack" data-action="finish">
                            </div>
                        </div>
                        
                        <div class="trigger-card">
                            <div class="trigger-header">
                                <i class="fab fa-jira"></i>
                                <span>Jira</span>
                            </div>
                            <div class="trigger-content">
                                <label class="trigger-option">
                                    <input type="checkbox" data-system="jira" data-action="finish" ${stageConfig.jira?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Ticket fechado</span>
                                </label>
                                <select class="trigger-status" data-system="jira" data-action="finish">
                                    <option value="done" ${stageConfig.jira?.finishStatus === 'done' ? 'selected' : ''}>Concluído</option>
                                    <option value="closed" ${stageConfig.jira?.finishStatus === 'closed' ? 'selected' : ''}>Fechado</option>
                                    <option value="resolved" ${stageConfig.jira?.finishStatus === 'resolved' ? 'selected' : ''}>Resolvido</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="trigger-card">
                            <div class="trigger-header">
                                <i class="fas fa-envelope"></i>
                                <span>Email</span>
                            </div>
                            <div class="trigger-content">
                                <label class="trigger-option">
                                    <input type="checkbox" data-system="email" data-action="finish" ${stageConfig.email?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Confirmação</span>
                                </label>
                                <input type="text" placeholder="Assunto de confirmação" class="trigger-subject" 
                                       value="${stageConfig.email?.finishSubject || ''}" data-system="email" data-action="finish">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createConditionsTab(stageId, stageConfig) {
        return `
            <div class="conditions-config">
                <h4>Condições para Execução</h4>
                <div class="condition-group">
                    <label class="condition-label">
                        <input type="checkbox" id="timeCondition" ${stageConfig.conditions?.time ? 'checked' : ''}>
                        <span>Executar apenas em horário comercial</span>
                    </label>
                    <div class="condition-details" id="timeConditionDetails" style="display: ${stageConfig.conditions?.time ? 'block' : 'none'}">
                        <div class="time-range">
                            <label>Horário de início:</label>
                            <input type="time" value="${stageConfig.conditions?.startTime || '09:00'}">
                            <label>Horário de fim:</label>
                            <input type="time" value="${stageConfig.conditions?.endTime || '18:00'}">
                        </div>
                    </div>
                </div>
                
                <div class="condition-group">
                    <label class="condition-label">
                        <input type="checkbox" id="userCondition" ${stageConfig.conditions?.user ? 'checked' : ''}>
                        <span>Executar apenas para usuários específicos</span>
                    </label>
                    <div class="condition-details" id="userConditionDetails" style="display: ${stageConfig.conditions?.user ? 'block' : 'none'}">
                        <input type="text" placeholder="Usuários (separados por vírgula)" 
                               value="${stageConfig.conditions?.users || ''}">
                    </div>
                </div>
                
                <div class="condition-group">
                    <label class="condition-label">
                        <input type="checkbox" id="priorityCondition" ${stageConfig.conditions?.priority ? 'checked' : ''}>
                        <span>Executar apenas para RIDECs prioritários</span>
                    </label>
                </div>
            </div>
        `;
    }

    createActionsTab(stageId, stageConfig) {
        return `
            <div class="actions-config">
                <h4>Ações Adicionais</h4>
                <div class="action-group">
                    <label class="action-label">
                        <input type="checkbox" id="notificationAction" ${stageConfig.actions?.notification ? 'checked' : ''}>
                        <span>Enviar notificação</span>
                    </label>
                    <div class="action-details" id="notificationActionDetails" style="display: ${stageConfig.actions?.notification ? 'block' : 'none'}">
                        <textarea placeholder="Mensagem da notificação" rows="3">${stageConfig.actions?.notificationMessage || ''}</textarea>
                    </div>
                </div>
                
                <div class="action-group">
                    <label class="action-label">
                        <input type="checkbox" id="logAction" ${stageConfig.actions?.log ? 'checked' : ''}>
                        <span>Registrar no log</span>
                    </label>
                </div>
                
                <div class="action-group">
                    <label class="action-label">
                        <input type="checkbox" id="webhookAction" ${stageConfig.actions?.webhook ? 'checked' : ''}>
                        <span>Chamar webhook externo</span>
                    </label>
                    <div class="action-details" id="webhookActionDetails" style="display: ${stageConfig.actions?.webhook ? 'block' : 'none'}">
                        <input type="url" placeholder="URL do webhook" value="${stageConfig.actions?.webhookUrl || ''}">
                    </div>
                </div>
            </div>
        `;
    }

    createLogsTab(stageId) {
        const logs = this.getIntegrationLogs(stageId);
        
        return `
            <div class="logs-config">
                <h4>Logs de Integração</h4>
                <div class="logs-container">
                    ${logs.length > 0 ? logs.map(log => `
                        <div class="log-entry ${log.type}">
                            <div class="log-header">
                                <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                                <span class="log-type ${log.type}">${log.type.toUpperCase()}</span>
                            </div>
                            <div class="log-message">${log.message}</div>
                            <div class="log-details">
                                <span>Sistema: ${log.system}</span>
                                <span>Ação: ${log.action}</span>
                            </div>
                        </div>
                    `).join('') : '<p class="no-logs">Nenhum log encontrado para esta etapa.</p>'}
                </div>
            </div>
        `;
    }

    initializeAdvancedConfigTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remover classe active de todos os botões e painéis
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado e painel correspondente
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });

        // Event listeners para condições
        document.getElementById('timeCondition')?.addEventListener('change', (e) => {
            const details = document.getElementById('timeConditionDetails');
            details.style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('userCondition')?.addEventListener('change', (e) => {
            const details = document.getElementById('userConditionDetails');
            details.style.display = e.target.checked ? 'block' : 'none';
        });

        // Event listeners para ações
        document.getElementById('notificationAction')?.addEventListener('change', (e) => {
            const details = document.getElementById('notificationActionDetails');
            details.style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('webhookAction')?.addEventListener('change', (e) => {
            const details = document.getElementById('webhookActionDetails');
            details.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    closeAdvancedStageConfig() {
        const modal = document.getElementById('advancedStageConfigModal');
        if (modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    }

    saveAdvancedStageConfig(stageId) {
        const ridec = this.ridecs.find(r => r.id === this.currentRidecId);
        if (!ridec) return;

        // Coletar configurações de triggers
        const triggers = {};
        document.querySelectorAll('.trigger-option input[type="checkbox"]').forEach(checkbox => {
            const system = checkbox.dataset.system;
            const action = checkbox.dataset.action;
            
            if (!triggers[system]) {
                triggers[system] = {};
            }
            
            triggers[system][action] = checkbox.checked;
            
            // Coletar dados adicionais
            if (checkbox.checked) {
                const keyword = document.querySelector(`.trigger-keyword[data-system="${system}"][data-action="${action}"]`);
                const command = document.querySelector(`.trigger-command[data-system="${system}"][data-action="${action}"]`);
                const subject = document.querySelector(`.trigger-subject[data-system="${system}"][data-action="${action}"]`);
                const status = document.querySelector(`.trigger-status[data-system="${system}"][data-action="${action}"]`);
                
                if (keyword) triggers[system][`${action}Keyword`] = keyword.value;
                if (command) triggers[system][`${action}Command`] = command.value;
                if (subject) triggers[system][`${action}Subject`] = subject.value;
                if (status) triggers[system][`${action}Status`] = status.value;
            }
        });

        // Coletar configurações de condições
        const conditions = {
            time: document.getElementById('timeCondition')?.checked || false,
            user: document.getElementById('userCondition')?.checked || false,
            priority: document.getElementById('priorityCondition')?.checked || false
        };

        if (conditions.time) {
            const timeInputs = document.querySelectorAll('.time-range input[type="time"]');
            conditions.startTime = timeInputs[0]?.value || '09:00';
            conditions.endTime = timeInputs[1]?.value || '18:00';
        }

        if (conditions.user) {
            conditions.users = document.querySelector('#userConditionDetails input')?.value || '';
        }

        // Coletar configurações de ações
        const actions = {
            notification: document.getElementById('notificationAction')?.checked || false,
            log: document.getElementById('logAction')?.checked || false,
            webhook: document.getElementById('webhookAction')?.checked || false
        };

        if (actions.notification) {
            actions.notificationMessage = document.querySelector('#notificationActionDetails textarea')?.value || '';
        }

        if (actions.webhook) {
            actions.webhookUrl = document.querySelector('#webhookActionDetails input[type="url"]')?.value || '';
        }

        // Salvar configuração
        if (!ridec.integrations) {
            ridec.integrations = {};
        }

        ridec.integrations[stageId] = {
            ...triggers,
            conditions,
            actions
        };

        this.saveToLocalStorage();
        this.renderRidecList();
        
        this.showNotification(`Configuração avançada da etapa ${stageId} salva com sucesso!`, 'success', false);
        this.closeAdvancedStageConfig();
    }

    getIntegrationLogs(stageId) {
        const logs = JSON.parse(localStorage.getItem('integration_logs')) || {};
        return logs[stageId] || [];
    }

    addIntegrationLog(stageId, system, action, message, type = 'info') {
        const logs = JSON.parse(localStorage.getItem('integration_logs')) || {};
        
        if (!logs[stageId]) {
            logs[stageId] = [];
        }

        logs[stageId].push({
            timestamp: Date.now(),
            system,
            action,
            message,
            type
        });

        // Manter apenas os últimos 50 logs por etapa
        if (logs[stageId].length > 50) {
            logs[stageId] = logs[stageId].slice(-50);
        }

        localStorage.setItem('integration_logs', JSON.stringify(logs));
    }

    updateTriggerConfiguration(checkbox) {
        const stageId = checkbox.closest('.stage-integration-item').dataset.stage;
        const system = checkbox.dataset.system;
        const trigger = checkbox.dataset.trigger;
        
        // Atualizar indicador visual
        const statusIndicator = checkbox.closest('.stage-integration-item').querySelector('.status-indicator');
        const statusText = checkbox.closest('.stage-integration-item').querySelector('.stage-integration-status span:last-child');
        
        const hasTriggers = checkbox.closest('.stage-integration-item').querySelectorAll('input[type="checkbox"]:checked').length > 0;
        
        statusIndicator.className = `status-indicator ${hasTriggers ? 'active' : 'inactive'}`;
        statusText.textContent = hasTriggers ? 'Configurado' : 'Não configurado';
        
        // Adicionar log
        this.addIntegrationLog(
            stageId, 
            system, 
            trigger, 
            `${trigger === 'start' ? 'Início' : 'Finalização'} ${checkbox.checked ? 'ativado' : 'desativado'} para ${system}`,
            checkbox.checked ? 'success' : 'info'
        );
    }

    renderStagesIntegrationList(ridec) {
        const container = document.getElementById('stagesIntegrationList');
        const timeControlMode = ridec.timeControlMode || 'detailed';
        const stages = ['RI', 'D', 'E', 'C'];
        const stagesA = ridec.stagesA || [];
        
        let html = '';
        
        // Adicionar informação sobre o modo de controle de tempo
        html += `
            <div class="time-control-info">
                <div class="time-control-badge ${timeControlMode}">
                    <i class="fas fa-${timeControlMode === 'simple' ? 'play-circle' : 'clock'}"></i>
                    <span>Modo ${timeControlMode === 'simple' ? 'Simples' : 'Detalhado'}</span>
                </div>
                <p class="time-control-description">
                    ${timeControlMode === 'simple' ? 
                        'Controle apenas do tempo total do RIDEC. As integrações podem ser configuradas para o processo completo.' :
                        'Controle individual de cada etapa. Configure integrações específicas para cada fase do processo.'
                    }
                </p>
            </div>
        `;
        
        if (timeControlMode === 'simple') {
            // Modo simples: apenas uma seção para o RIDEC completo
            html += this.createSimpleModeIntegrationItem(ridec);
        } else {
            // Modo detalhado: seções para cada etapa
            stages.forEach(stage => {
                html += this.createStageIntegrationItem(stage, ridec);
            });
            
            // Etapas A
            stagesA.forEach(stageA => {
                html += this.createStageIntegrationItem(stageA.identifier, ridec, stageA);
            });
        }
        
        container.innerHTML = html;
    }

    createSimpleModeIntegrationItem(ridec) {
        const integrations = ridec.integrations && ridec.integrations['complete'] ? ridec.integrations['complete'] : {};
        const hasConfig = Object.keys(integrations).length > 0;
        
        return `
            <div class="stage-integration-item simple-mode" data-stage="complete">
                <div class="stage-integration-header">
                    <h5><i class="fas fa-play-circle"></i> Processo RIDEC Completo</h5>
                    <div class="stage-integration-status">
                        <span class="status-indicator ${hasConfig ? 'active' : 'inactive'}"></span>
                        <span>${hasConfig ? 'Configurado' : 'Não configurado'}</span>
                        <button class="advanced-config-btn" title="Configuração Avançada">
                            <i class="fas fa-cogs"></i>
                        </button>
                    </div>
                </div>
                <div class="stage-integration-config">
                    <div class="integration-triggers-stage">
                        <div class="trigger-group">
                            <label class="trigger-label">
                                <i class="fas fa-play"></i>
                                <span>Iniciar processo automaticamente quando:</span>
                            </label>
                            <div class="trigger-options-stage">
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="start" data-system="slack" ${integrations.slack?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Slack - Mensagem específica</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="start" data-system="jira" ${integrations.jira?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Jira - Status alterado</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="start" data-system="email" ${integrations.email?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Email - Assunto específico</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="trigger-group">
                            <label class="trigger-label">
                                <i class="fas fa-stop"></i>
                                <span>Finalizar processo automaticamente quando:</span>
                            </label>
                            <div class="trigger-options-stage">
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="finish" data-system="slack" ${integrations.slack?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Slack - Comando específico</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="finish" data-system="jira" ${integrations.jira?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Jira - Ticket fechado</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="finish" data-system="email" ${integrations.email?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Email - Confirmação</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="trigger-group">
                            <label class="trigger-label">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Alertar quando próximo do prazo:</span>
                            </label>
                            <div class="trigger-options-stage">
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="warning" data-system="slack" ${integrations.slack?.warning ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Slack - Alerta de prazo</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="complete" data-trigger="warning" data-system="email" ${integrations.email?.warning ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Email - Notificação de prazo</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createStageIntegrationItem(stageId, ridec, stageA = null) {
        const stageName = stageA ? stageA.description : stageId;
        const integrations = ridec.integrations && ridec.integrations[stageId] ? ridec.integrations[stageId] : {};
        const hasConfig = Object.keys(integrations).length > 0;
        
        return `
            <div class="stage-integration-item" data-stage="${stageId}">
                <div class="stage-integration-header">
                    <h5>${stageName}</h5>
                    <div class="stage-integration-status">
                        <span class="status-indicator ${hasConfig ? 'active' : 'inactive'}"></span>
                        <span>${hasConfig ? 'Configurado' : 'Não configurado'}</span>
                        <button class="advanced-config-btn" title="Configuração Avançada">
                            <i class="fas fa-cogs"></i>
                        </button>
                    </div>
                </div>
                <div class="stage-integration-config">
                    <div class="integration-triggers-stage">
                        <div class="trigger-group">
                            <label class="trigger-label">
                                <i class="fas fa-play"></i>
                                <span>Iniciar automaticamente quando:</span>
                            </label>
                            <div class="trigger-options-stage">
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="start" data-system="slack" ${integrations.slack?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Slack - Mensagem específica</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="start" data-system="jira" ${integrations.jira?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Jira - Status alterado</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="start" data-system="email" ${integrations.email?.start ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Email - Assunto específico</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="trigger-group">
                            <label class="trigger-label">
                                <i class="fas fa-stop"></i>
                                <span>Finalizar automaticamente quando:</span>
                            </label>
                            <div class="trigger-options-stage">
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="finish" data-system="slack" ${integrations.slack?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Slack - Comando específico</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="finish" data-system="jira" ${integrations.jira?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Jira - Ticket fechado</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="finish" data-system="email" ${integrations.email?.finish ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Email - Confirmação</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="trigger-group">
                            <label class="trigger-label">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Alertar quando próximo do prazo:</span>
                            </label>
                            <div class="trigger-options-stage">
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="warning" data-system="slack" ${integrations.slack?.warning ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Slack - Alerta de prazo</span>
                                </label>
                                <label class="trigger-option">
                                    <input type="checkbox" data-stage="${stageId}" data-trigger="warning" data-system="email" ${integrations.email?.warning ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    <span>Email - Notificação de prazo</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadIntegrationConfig(ridec) {
        // Carregar configurações existentes
        const integrations = ridec.integrations || {};
        
        // Configurar checkboxes globais
        document.getElementById('autoStartSlack').checked = this.hasGlobalTrigger(integrations, 'start', 'slack');
        document.getElementById('autoStartJira').checked = this.hasGlobalTrigger(integrations, 'start', 'jira');
        document.getElementById('autoStartEmail').checked = this.hasGlobalTrigger(integrations, 'start', 'email');
        
        document.getElementById('autoFinishSlack').checked = this.hasGlobalTrigger(integrations, 'finish', 'slack');
        document.getElementById('autoFinishJira').checked = this.hasGlobalTrigger(integrations, 'finish', 'jira');
        document.getElementById('autoFinishEmail').checked = this.hasGlobalTrigger(integrations, 'finish', 'email');
    }

    hasGlobalTrigger(integrations, trigger, system) {
        return Object.values(integrations).some(stageConfig => 
            stageConfig && stageConfig[system] && stageConfig[system][trigger]
        );
    }

    saveIntegrationConfig() {
        const ridec = this.ridecs.find(r => r.id === this.currentRidecId);
        if (!ridec) return;

        const integrations = {};
        const timeControlMode = ridec.timeControlMode || 'detailed';
        
        // Coletar configurações por etapa
        const stageItems = document.querySelectorAll('.stage-integration-item');
        stageItems.forEach(item => {
            const stageId = item.dataset.stage;
            const stageConfig = {};
            
            // Coletar checkboxes da etapa
            const checkboxes = item.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const system = checkbox.dataset.system;
                const trigger = checkbox.dataset.trigger;
                
                if (!stageConfig[system]) {
                    stageConfig[system] = {};
                }
                
                stageConfig[system][trigger] = checkbox.checked;
            });
            
            // Só adicionar se houver configurações
            if (Object.keys(stageConfig).length > 0) {
                integrations[stageId] = stageConfig;
            }
        });
        
        // Para modo simples, garantir que as configurações sejam salvas corretamente
        if (timeControlMode === 'simple' && integrations['complete']) {
            // No modo simples, as configurações são para o processo completo
            ridec.integrations = integrations;
        } else if (timeControlMode === 'detailed') {
            // No modo detalhado, manter as configurações por etapa
            ridec.integrations = integrations;
        }
        
        // Atualizar RIDEC
        this.saveToLocalStorage();
        this.renderRidecList();
        
        this.showNotification('Configurações de integração salvas com sucesso!', 'success', false);
        this.closeIntegrationModal();
    }

    // Método para processar triggers automáticos
    processIntegrationTrigger(ridecId, stage, trigger, system, data) {
        const ridec = this.ridecs.find(r => r.id === ridecId);
        if (!ridec || !ridec.integrations || !ridec.integrations[stage]) return;
        
        const stageConfig = ridec.integrations[stage];
        if (!stageConfig[system] || !stageConfig[system][trigger]) return;
        
        // Verificar condições antes de executar
        if (!this.checkIntegrationConditions(ridec, stage, stageConfig)) {
            this.addIntegrationLog(stage, system, trigger, 'Trigger bloqueado por condições não atendidas', 'warning');
            return;
        }
        
        const timeControlMode = ridec.timeControlMode || 'detailed';
        
        // Executar ação baseada no trigger
        let actionExecuted = false;
        
        if (trigger === 'start') {
            if (timeControlMode === 'simple' && stage === 'complete') {
                // No modo simples, iniciar o processo completo
                this.startStageTimer(ridecId, 'RI');
                actionExecuted = true;
                this.showNotification(`Processo RIDEC iniciado automaticamente via ${system}`, 'success', false);
            } else {
                // Modo detalhado ou etapa específica
                this.startStageTimer(ridecId, stage);
                actionExecuted = true;
                this.showNotification(`Etapa ${stage} iniciada automaticamente via ${system}`, 'success', false);
            }
        } else if (trigger === 'finish') {
            if (timeControlMode === 'simple' && stage === 'complete') {
                // No modo simples, finalizar o processo completo
                this.completeStage(ridecId, 'C');
                actionExecuted = true;
                this.showNotification(`Processo RIDEC finalizado automaticamente via ${system}`, 'success', false);
            } else {
                // Modo detalhado ou etapa específica
                this.completeStage(ridecId, stage);
                actionExecuted = true;
                this.showNotification(`Etapa ${stage} finalizada automaticamente via ${system}`, 'success', false);
            }
        } else if (trigger === 'warning') {
            // Trigger de alerta de prazo
            this.showNotification(`Alerta de prazo: ${ridec.title} está próximo do limite de tempo`, 'warning', false);
            actionExecuted = true;
        }
        
        if (actionExecuted) {
            // Executar ações adicionais
            this.executeAdditionalActions(ridec, stage, stageConfig, system, trigger, data);
            
            // Registrar log
            this.addIntegrationLog(stage, system, trigger, `Ação executada com sucesso via ${system}`, 'success');
        }
    }

    // Verificar condições de integração
    checkIntegrationConditions(ridec, stage, stageConfig) {
        const conditions = stageConfig.conditions || {};
        
        // Verificar condição de horário
        if (conditions.time) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const startTime = this.parseTimeString(conditions.startTime || '09:00');
            const endTime = this.parseTimeString(conditions.endTime || '18:00');
            
            if (currentTime < startTime || currentTime > endTime) {
                return false;
            }
        }
        
        // Verificar condição de usuário
        if (conditions.user && conditions.users) {
            const allowedUsers = conditions.users.split(',').map(u => u.trim());
            const currentUser = this.getCurrentUser(); // Implementar conforme necessário
            if (!allowedUsers.includes(currentUser)) {
                return false;
            }
        }
        
        // Verificar condição de prioridade
        if (conditions.priority && !ridec.priority) {
            return false;
        }
        
        return true;
    }

    // Executar ações adicionais
    executeAdditionalActions(ridec, stage, stageConfig, system, trigger, data) {
        const actions = stageConfig.actions || {};
        
        // Enviar notificação
        if (actions.notification && actions.notificationMessage) {
            const message = this.replacePlaceholders(actions.notificationMessage, {
                ridec: ridec.title,
                stage: stage,
                system: system,
                trigger: trigger,
                ...data
            });
            this.showNotification(message, 'info', true);
        }
        
        // Registrar no log
        if (actions.log) {
            this.addIntegrationLog(stage, system, trigger, 'Ação registrada no log conforme configuração', 'info');
        }
        
        // Chamar webhook externo
        if (actions.webhook && actions.webhookUrl) {
            this.callExternalWebhook(actions.webhookUrl, {
                ridecId: ridec.id,
                ridecTitle: ridec.title,
                stage: stage,
                system: system,
                trigger: trigger,
                timestamp: Date.now(),
                ...data
            });
        }
    }

    // Substituir placeholders em mensagens
    replacePlaceholders(message, data) {
        return message.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    // Chamar webhook externo
    callExternalWebhook(url, data) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                this.addIntegrationLog(data.stage, data.system, data.trigger, 'Webhook externo chamado com sucesso', 'success');
            } else {
                this.addIntegrationLog(data.stage, data.system, data.trigger, 'Falha ao chamar webhook externo', 'error');
            }
        })
        .catch(error => {
            this.addIntegrationLog(data.stage, data.system, data.trigger, `Erro ao chamar webhook: ${error.message}`, 'error');
        });
    }

    // Converter string de tempo para minutos
    parseTimeString(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Obter usuário atual (implementar conforme necessário)
    getCurrentUser() {
        // Por enquanto, retorna um usuário padrão
        // Em uma implementação real, isso viria do sistema de autenticação
        return 'usuario@exemplo.com';
    }

    // Simular trigger de integração para demonstração
    simulateIntegrationTrigger(ridecId, stage, system, trigger) {
        const ridec = this.ridecs.find(r => r.id === ridecId);
        if (!ridec) {
            this.showNotification('RIDEC não encontrado', 'error', false);
            return;
        }

        // Simular dados do sistema externo
        const mockData = {
            userId: 'usuario@exemplo.com',
            timestamp: Date.now(),
            source: system,
            message: `Trigger simulado do ${system}`,
            metadata: {
                channel: '#general',
                ticket: 'PROJ-123',
                subject: 'Assunto do email'
            }
        };

        this.processIntegrationTrigger(ridecId, stage, trigger, system, mockData);
    }

    // Adicionar botões de simulação ao modal de integração
    addSimulationButtons() {
        const ridec = this.ridecs.find(r => r.id === this.currentRidecId);
        if (!ridec) return;

        const timeControlMode = ridec.timeControlMode || 'detailed';
        const container = document.getElementById('stagesIntegrationList');
        
        let simulationHtml = `
            <div class="simulation-section">
                <h4>Simular Triggers</h4>
                <p class="simulation-description">Teste as integrações configuradas clicando nos botões abaixo:</p>
                <div class="simulation-buttons">
        `;

        if (timeControlMode === 'simple') {
            // Modo simples: apenas simulação para o processo completo
            simulationHtml += `
                <div class="stage-simulation simple-mode">
                    <h5><i class="fas fa-play-circle"></i> Processo RIDEC Completo</h5>
                    <div class="simulation-controls">
                        <button class="btn btn-success btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', 'complete', 'slack', 'start')">
                            <i class="fab fa-slack"></i> Iniciar via Slack
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', 'complete', 'slack', 'finish')">
                            <i class="fab fa-slack"></i> Finalizar via Slack
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', 'complete', 'slack', 'warning')">
                            <i class="fab fa-slack"></i> Alerta via Slack
                        </button>
                        <button class="btn btn-success btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', 'complete', 'jira', 'start')">
                            <i class="fab fa-jira"></i> Iniciar via Jira
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', 'complete', 'jira', 'finish')">
                            <i class="fab fa-jira"></i> Finalizar via Jira
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', 'complete', 'email', 'warning')">
                            <i class="fas fa-envelope"></i> Alerta via Email
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Modo detalhado: simulação para cada etapa
            simulationHtml += ['RI', 'D', 'E', 'C'].map(stage => `
                <div class="stage-simulation">
                    <h5>Etapa ${stage}</h5>
                    <div class="simulation-controls">
                        <button class="btn btn-success btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', '${stage}', 'slack', 'start')">
                            <i class="fab fa-slack"></i> Iniciar via Slack
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', '${stage}', 'slack', 'finish')">
                            <i class="fab fa-slack"></i> Finalizar via Slack
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', '${stage}', 'slack', 'warning')">
                            <i class="fab fa-slack"></i> Alerta via Slack
                        </button>
                        <button class="btn btn-success btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', '${stage}', 'jira', 'start')">
                            <i class="fab fa-jira"></i> Iniciar via Jira
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', '${stage}', 'jira', 'finish')">
                            <i class="fab fa-jira"></i> Finalizar via Jira
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="ridecSystem.simulateIntegrationTrigger('${ridec.id}', '${stage}', 'email', 'warning')">
                            <i class="fas fa-envelope"></i> Alerta via Email
                        </button>
                    </div>
                </div>
            `).join('');
        }

        simulationHtml += `
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', simulationHtml);
    }

            // Deletar todos os RIDECs modelo
    deleteAllRidecs() {
        // Mostrar modal de confirmação
        this.showDeleteAllConfirmationModal();
    }

    // Mostrar modal de confirmação para deletar todos os RIDECs
    showDeleteAllConfirmationModal() {
        const modalHtml = `
            <div id="deleteAllModal" class="modal">
                <div class="modal-content delete-all-modal">
                    <div class="modal-header">
                        <h2>
                            <i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>
                            Deletar Todos os RIDECs
                        </h2>
                        <span class="close" onclick="ridecSystem.closeDeleteAllModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="delete-all-warning">
                            <div class="warning-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="warning-content">
                                <h3>⚠️ ATENÇÃO!</h3>
                                <p>Esta ação irá <strong>deletar permanentemente</strong> todos os RIDECs modelo criados.</p>
                                <p>Esta ação <strong>NÃO PODE SER DESFEITA</strong>.</p>
                                
                                <div class="delete-stats">
                                    <div class="stat-item">
                                        <span class="stat-number">${this.ridecs.length}</span>
                                        <span class="stat-label">RIDECs Modelo</span>
                                    </div>
                                    
                                    <div class="stat-item">
                                        <span class="stat-number">${this.getTotalStages()}</span>
                                        <span class="stat-label">Etapas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="delete-options">
                            <h4>Opções de Deletar:</h4>
                            <div class="delete-option-group">
                                <label class="delete-option">
                                    <input type="checkbox" id="deleteModels" checked>
                                    <span class="checkmark"></span>
                                    <span>Deletar RIDECs Modelo</span>
                                </label>
                                <label class="delete-option">
                                    <input type="checkbox" id="deleteOccurrences" checked>
                                    <span class="checkmark"></span>
                                    <span>Deletar Ocorrências</span>
                                </label>
                                <label class="delete-option">
                                    <input type="checkbox" id="deleteIntegrations">
                                    <span class="checkmark"></span>
                                    <span>Deletar Configurações de Integração</span>
                                </label>
                                <label class="delete-option">
                                    <input type="checkbox" id="deleteLogs">
                                    <span class="checkmark"></span>
                                    <span>Deletar Logs de Integração</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="confirmation-input">
                            <label for="confirmDelete">Digite "DELETAR" para confirmar:</label>
                            <input type="text" id="confirmDelete" placeholder="Digite DELETAR" class="form-control">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ridecSystem.closeDeleteAllModal()">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                        <button class="btn btn-danger" onclick="ridecSystem.confirmDeleteAll()" id="confirmDeleteBtn" disabled>
                            <i class="fas fa-trash"></i>
                            Deletar Tudo
                        </button>
                        <button class="btn btn-warning" onclick="ridecSystem.forceCompleteCleanup()" title="Forçar limpeza completa">
                            <i class="fas fa-broom"></i>
                            Limpeza Forçada
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const existingModal = document.getElementById('deleteAllModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        document.getElementById('deleteAllModal').style.display = 'block';
        
        // Adicionar event listener para validação
        document.getElementById('confirmDelete').addEventListener('input', (e) => {
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            confirmBtn.disabled = e.target.value !== 'DELETAR';
        });
    }

    // Fechar modal de deletar todos
    closeDeleteAllModal() {
        const modal = document.getElementById('deleteAllModal');
        if (modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    }

    // Confirmar deletar todos os RIDECs
    confirmDeleteAll() {
        const deleteModels = document.getElementById('deleteModels').checked;

        const deleteIntegrations = document.getElementById('deleteIntegrations').checked;
        const deleteLogs = document.getElementById('deleteLogs').checked;

        let deletedCount = 0;

        // Deletar RIDECs modelo
        if (deleteModels) {
            deletedCount += this.ridecs.length;
            this.ridecs = [];
        }

        // Deletar configurações de integração
        if (deleteIntegrations) {
            const systems = ['slack', 'jira', 'teams', 'email', 'webhook', 'calendar'];
            systems.forEach(system => {
                localStorage.removeItem(`system_config_${system}`);
            });
        }

        // Deletar logs de integração
        if (deleteLogs) {
            localStorage.removeItem('integration_logs');
        }

        // LIMPEZA COMPLETA E FORÇADA
        this.performCompleteCleanup();

        // GARANTIR QUE O ARRAY ESTÁ VAZIO
        this.ridecs = [];
        
        // Salvar alterações
        this.saveToLocalStorage();
        
        // Limpar notificações
        this.notifications = [];
        this.saveNotifications();
        
        // Limpar estados de área
        this.clearAreaStates();
        
        // FORÇAR RENDERIZAÇÃO VAZIA
        this.forceEmptyRender();
        
        // Fechar modal
        this.closeDeleteAllModal();
        
        // Mostrar notificação de sucesso
        this.showNotification(`Todos os dados foram deletados com sucesso! (${deletedCount} itens removidos)`, 'success', false);
        
        // Recarregar página após 2 segundos para garantir limpeza completa
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // Realizar limpeza completa e forçada
    performCompleteCleanup() {
        console.log('Iniciando limpeza completa...');
        
        // LIMPEZA AGRESSIVA DO LOCALSTORAGE
        const keysToRemove = [];
        
        // Coletar TODAS as chaves do localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key === 'ridecs' ||
                key === 'notifications' ||
                key === 'integration_logs' ||
                key.startsWith('system_config_') ||
                key.startsWith('area_state_') ||
                key.includes('ridec') ||
                key.includes('RIDEC') ||
                key.includes('integration') ||
                key.includes('timer') ||
                key.includes('stage') ||
                key.includes('deadline') ||
                key.includes('relation')
            )) {
                keysToRemove.push(key);
            }
        }
        
        // Remover todas as chaves encontradas
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`Removido do localStorage: ${key}`);
        });
        
        // LIMPEZA FORÇADA DE ARRAYS INTERNOS
        this.ridecs = [];
        this.notifications = [];
        this.currentRidecId = null;
        this.notificationId = 0;
        
        // Parar TODOS os intervalos de monitoramento
        if (this.overdueCheckInterval) {
            clearInterval(this.overdueCheckInterval);
            this.overdueCheckInterval = null;
        }
        
        // Limpar TODOS os timers ativos
        this.clearAllTimers();
        
        // LIMPEZA ADICIONAL - Remover qualquer chave que possa conter dados de RIDEC
        const allKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            allKeys.push(localStorage.key(i));
        }
        
        allKeys.forEach(key => {
            if (key && (
                key.toLowerCase().includes('ridec') ||
                key.toLowerCase().includes('process') ||
                key.toLowerCase().includes('stage') ||
                key.toLowerCase().includes('timer')
            )) {
                localStorage.removeItem(key);
                console.log(`Removido chave adicional: ${key}`);
            }
        });
        
        console.log('Limpeza completa realizada');
    }

    // Limpar todos os timers ativos
    clearAllTimers() {
        // Limpar todos os timers de etapas
        this.ridecs.forEach(ridec => {
            if (ridec.timers) {
                Object.keys(ridec.timers).forEach(stage => {
                    if (ridec.timers[stage] && ridec.timers[stage].interval) {
                        clearInterval(ridec.timers[stage].interval);
                    }
                });
            }
        });
        
        // Limpar timers globais
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
    }




    // Obter total de etapas
    getTotalStages() {
        let total = 0;
        this.ridecs.forEach(ridec => {
            total += 4; // Etapas padrão (RI, D, E, C)
            if (ridec.stagesA) {
                total += ridec.stagesA.length;
            }
        });
        return total;
    }

    // Verificar e limpar dados residuais
    checkAndCleanResidualData() {
        const ridecsFromStorage = localStorage.getItem('ridecs');
        if (ridecsFromStorage) {
            try {
                const parsedRidecs = JSON.parse(ridecsFromStorage);
                if (Array.isArray(parsedRidecs) && parsedRidecs.length === 0) {
                    localStorage.removeItem('ridecs');
                    console.log('Dados residuais removidos do localStorage');
                }
            } catch (error) {
                console.error('Erro ao verificar dados residuais:', error);
                localStorage.removeItem('ridecs');
            }
        }
    }

    // Forçar limpeza completa (método público)
    forceCompleteCleanup() {
        console.log('Iniciando limpeza forçada...');
        
        // Limpar localStorage completamente
        this.performCompleteCleanup();
        
        // LIMPEZA NUCLEAR - Limpar todo o localStorage se necessário
        this.nuclearCleanup();
        
        // Forçar recarregamento da página
        window.location.reload();
    }

    // Limpeza nuclear - último recurso
    nuclearCleanup() {
        console.log('Executando limpeza nuclear...');
        
        // Limpar TODO o localStorage
        localStorage.clear();
        
        // Limpar arrays internos
        this.ridecs = [];
        this.notifications = [];
        this.currentRidecId = null;
        this.notificationId = 0;
        
        // Parar todos os intervalos
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        console.log('Limpeza nuclear concluída');
    }

    // Forçar renderização vazia
    forceEmptyRender() {
        console.log('Forçando renderização vazia...');
        
        // Garantir que o array está vazio
        this.ridecs = [];
        
        // Limpar localStorage
        localStorage.removeItem('ridecs');
        
        // Forçar renderização vazia em todas as visualizações
        this.renderEmptyState();
        
        // Limpar visualizações específicas
        this.clearAllViews();
        
        console.log('Renderização vazia forçada concluída');
    }

    // Renderizar estado vazio
    renderEmptyState() {
        const ridecList = document.getElementById('ridecList');
        const flowView = document.getElementById('flowView');
        const chartsView = document.getElementById('chartsView');
        
        if (ridecList) {
            ridecList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <h3>Nenhum RIDEC encontrado</h3>
                    <p>Clique em "Novo RIDEC" para criar seu primeiro processo</p>
                    <button class="btn btn-primary" onclick="ridecSystem.openRidecModal()">
                        <i class="fas fa-plus"></i>
                        Criar RIDEC
                    </button>
                </div>
            `;
        }
        
        if (flowView) {
            flowView.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <h3>Nenhum RIDEC para visualizar</h3>
                    <p>Crie alguns RIDECs para ver o fluxo de processos</p>
                </div>
            `;
        }
        
        if (chartsView) {
            chartsView.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <h3>Nenhum dado para analisar</h3>
                    <p>Crie alguns RIDECs para ver os gráficos e estatísticas</p>
                </div>
            `;
        }
    }

    // Limpar todas as visualizações
    clearAllViews() {
        // Limpar gráficos
        this.clearCharts();
        
        // Limpar contadores
        this.updateSummaryCards();
        
        // Limpar notificações
        this.updateNotificationCount();
        
        // Parar monitoramento de atrasos
        if (this.overdueCheckInterval) {
            clearInterval(this.overdueCheckInterval);
            this.overdueCheckInterval = null;
        }
    }

    // Garantir estado limpo
    ensureCleanState() {
        // Garantir que o estado está limpo
        if (!this.ridecs || this.ridecs.length === 0) {
            this.ridecs = [];
            this.saveToLocalStorage();
        }
    }

    // Verificar se todos os RIDECs de uma área estão no prazo












    // Criar efeito de onda de choque



    // Método para retornar à última configuração (reset completo)
    resetToDefaultConfiguration() {
        // Limpar todos os dados do localStorage
        localStorage.clear();
        
        // Resetar todas as variáveis do sistema
        this.ridecs = [];
        this.currentRidecId = null;
        this.notificationId = 0;
        this.notifications = [];
        this.notificationDropdownVisible = false;
        this.chatOpened = false;
        this.showAiWelcome = true;
        this.currentView = 'card';
        
        // Parar todos os timers
        this.clearAllTimers();
        
        // Limpar todas as visualizações
        this.clearAllViews();
        
        // Renderizar estado vazio
        this.renderEmptyState();
        
        // Mostrar notificação de sucesso
        this.showNotification('Sistema resetado para configuração padrão!', 'success');
    }

    // Método para fazer logout
    async handleLogout() {
        try {
            // Confirmar logout
            const confirmLogout = confirm('Tem certeza que deseja sair do sistema?');
            if (!confirmLogout) {
                return;
            }

            // Fazer logout através do authManager
            if (window.authManager) {
                await window.authManager.signOut();
            }

            // Limpar dados locais
            localStorage.clear();
            
            // Redirecionar para página de login
            window.location.href = 'login.html';
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
            alert('Erro ao fazer logout. Tente novamente.');
        }
    }

    // Abrir página de ocorrências de um RIDEC específico
    openRidecOccurrences(ridecId) {
        window.location.href = `ridec-occurrences-detail.html?ridecId=${ridecId}`;
    }
}

// Inicializar sistema
const ridecSystem = new RIDECSystem();

// Exportar para uso global
window.ridecSystem = ridecSystem; 
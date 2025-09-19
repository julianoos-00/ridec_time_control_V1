// Sistema RIDEC - Controle de Processos
class RIDECSystem {
    constructor() {
        // Limpar dados de exemplo do localStorage ANTES de carregar
        RIDECSystem.clearExampleDataStatic();
        
        // LIMPEZA AGRESSIVA - Remover dados antigos/corrompidos
        this.aggressiveDataCleanup();
        
        // Inicializar arrays vazios - dados serão carregados do banco
        this.ridecs = [];
        this.currentRidecId = null;
        this.notificationId = 0;
        this.overdueCheckInterval = null;
        this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        this.notificationDropdownVisible = false;
        this.chatOpened = false;
        this.showAiWelcome = true;
        this.currentView = 'card';
        this.loadingAreas = false;
        this.renderingList = false; // Flag para evitar múltiplas renderizações
        this.lastRidecsHash = null; // Hash para detectar mudanças significativas
        this.supabaseReadyListenerAdded = false; // Flag para evitar múltiplos listeners
        
        this.initializeEventListeners();
        this.checkAndCleanResidualData(); // Verificar e limpar dados residuais
        
        // VERIFICAÇÃO ADICIONAL - Garantir que não há dados residuais
        this.ensureCleanState();
        
        // Não renderizar lista ainda - aguardar dados do banco
        this.startOverdueMonitoring();
        this.updateNotificationCount();
        this.checkForEditRidec();
        this.showAiWelcomeMessage();
        
        // Aguardar Supabase estar pronto antes de inicializar
        this.waitForSupabaseAndInitialize();
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




        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterRidecs(e.target.value);
        });

        // Clear search
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.filterRidecs('');
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

        // Modal Criar Ocorrência
        const createOccurrenceModal = document.getElementById('createOccurrenceModal');
        const closeCreateOccurrenceBtn = document.getElementById('closeCreateOccurrenceModal');
        const cancelCreateOccurrenceBtn = document.getElementById('cancelCreateOccurrenceBtn');
        const confirmCreateOccurrenceBtn = document.getElementById('confirmCreateOccurrenceBtn');

        // Modal Editar Modelo
        const editModelModal = document.getElementById('editModelModal');
        const closeEditModelBtn = document.getElementById('closeEditModelModal');
        const cancelEditModelBtn = document.getElementById('cancelEditModelBtn');
        const saveEditModelBtn = document.getElementById('saveEditModelBtn');

        console.log('🔍 Configurando modal de criar ocorrência...');
        console.log('Modal:', createOccurrenceModal);
        console.log('Botão fechar:', closeCreateOccurrenceBtn);
        console.log('Botão cancelar:', cancelCreateOccurrenceBtn);
        console.log('Botão confirmar:', confirmCreateOccurrenceBtn);

        if (closeCreateOccurrenceBtn) {
            closeCreateOccurrenceBtn.addEventListener('click', () => this.closeCreateOccurrenceModal());
            console.log('✅ Event listener adicionado ao botão fechar');
        } else {
            console.error('❌ Botão fechar não encontrado');
        }

        if (cancelCreateOccurrenceBtn) {
            cancelCreateOccurrenceBtn.addEventListener('click', () => this.closeCreateOccurrenceModal());
            console.log('✅ Event listener adicionado ao botão cancelar');
        } else {
            console.error('❌ Botão cancelar não encontrado');
        }

        if (confirmCreateOccurrenceBtn) {
            confirmCreateOccurrenceBtn.addEventListener('click', () => this.createOccurrence());
            console.log('✅ Event listener adicionado ao botão confirmar');
        } else {
            console.error('❌ Botão confirmar não encontrado');
        }

        // Event listeners para modal de edição de modelo
        if (closeEditModelBtn) {
            closeEditModelBtn.addEventListener('click', () => this.closeEditModelModal());
        }
        
        if (cancelEditModelBtn) {
            cancelEditModelBtn.addEventListener('click', () => this.closeEditModelModal());
        }
        
        if (saveEditModelBtn) {
            saveEditModelBtn.addEventListener('click', () => this.saveEditModel());
        }

        // Event listener para botão criar ocorrência a partir do modelo
        const createOccurrenceFromModelBtn = document.getElementById('createOccurrenceFromModelBtn');
        if (createOccurrenceFromModelBtn) {
            createOccurrenceFromModelBtn.addEventListener('click', () => this.createOccurrenceFromModel());
        }

        // Event listener para botão excluir modelo a partir do modal
        const deleteModelFromModalBtn = document.getElementById('deleteModelFromModalBtn');
        if (deleteModelFromModalBtn) {
            deleteModelFromModalBtn.addEventListener('click', () => this.deleteModelFromModal());
        }

        // Event listeners para expanders de ocorrências
        const activeOccurrencesHeader = document.getElementById('activeOccurrencesHeader');
        const completedOccurrencesHeader = document.getElementById('completedOccurrencesHeader');
        
        if (activeOccurrencesHeader) {
            activeOccurrencesHeader.addEventListener('click', () => this.toggleOccurrencesExpander('activeOccurrences'));
        }
        
        if (completedOccurrencesHeader) {
            completedOccurrencesHeader.addEventListener('click', () => this.toggleOccurrencesExpander('completedOccurrences'));
        }

        // Event listener para o expander de informações do modelo
        const modelInfoExpanderHeader = document.getElementById('modelInfoExpanderHeader');
        if (modelInfoExpanderHeader) {
            modelInfoExpanderHeader.addEventListener('click', () => this.toggleModelInfoExpander());
            console.log('✅ Event listener adicionado ao expander de informações do modelo');
        } else {
            console.error('❌ Header do expander não encontrado');
        }

        // Fechar modais ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === ridecModal) this.closeRidecModal();
            if (e.target === stageAModal) this.closeStageAModal();
            if (e.target === createOccurrenceModal) this.closeCreateOccurrenceModal();
            if (e.target === editModelModal) this.closeEditModelModal();
        });

        // Event listener para mudança de unidade de tempo
        document.getElementById('ridecTimeUnit').addEventListener('change', () => {
            this.updateTimeUnitLabels();
        });
    }


    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Limpar dados de exemplo do localStorage
    clearExampleData() {
        try {
            // Limpar dados de RIDEC que podem ter sido criados como exemplo
            const ridecs = JSON.parse(localStorage.getItem('ridecs')) || [];
            const exampleTitles = [
                'Análise de Requisitos',
                'Desenvolvimento Frontend', 
                'Desenvolvimento Backend',
                'Venda de Caminhão',
                'Manutenção Pós-Venda',
                'Implementação de Sistema de Backup',
                'Atualização de Políticas de RH',
                'Auditoria Financeira Trimestral',
                'Otimização de Processos Operacionais',
                'Migração de Dados para Cloud'
            ];
            
            const filteredRidecs = ridecs.filter(ridec => 
                !exampleTitles.includes(ridec.title)
            );
            
            if (filteredRidecs.length !== ridecs.length) {
                console.log('🧹 Removendo dados de exemplo do localStorage...');
                localStorage.setItem('ridecs', JSON.stringify(filteredRidecs));
                if (this.ridecs) {
                    this.ridecs = filteredRidecs;
                }
                console.log(`✅ ${ridecs.length - filteredRidecs.length} RIDECs de exemplo removidos`);
            }
        } catch (error) {
            console.error('❌ Erro ao limpar dados de exemplo:', error);
        }
    }

    // Método estático para limpar dados antes da instanciação
    static clearExampleDataStatic() {
        try {
            const ridecs = JSON.parse(localStorage.getItem('ridecs')) || [];
            const exampleTitles = [
                'Análise de Requisitos',
                'Desenvolvimento Frontend', 
                'Desenvolvimento Backend',
                'Venda de Caminhão',
                'Manutenção Pós-Venda',
                'Implementação de Sistema de Backup',
                'Atualização de Políticas de RH',
                'Auditoria Financeira Trimestral',
                'Otimização de Processos Operacionais',
                'Migração de Dados para Cloud'
            ];
            
            const filteredRidecs = ridecs.filter(ridec => 
                !exampleTitles.includes(ridec.title)
            );
            
            if (filteredRidecs.length !== ridecs.length) {
                console.log('🧹 Removendo dados de exemplo do localStorage...');
                localStorage.setItem('ridecs', JSON.stringify(filteredRidecs));
                console.log(`✅ ${ridecs.length - filteredRidecs.length} RIDECs de exemplo removidos`);
            }
        } catch (error) {
            console.error('❌ Erro ao limpar dados de exemplo:', error);
        }
    }

    // Abrir modal RIDEC
    openRidecModal(ridecId = null) {
        const modal = document.getElementById('ridecModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('ridecForm');

        this.currentRidecId = ridecId;

        if (ridecId) {
            console.log(`🔍 Procurando RIDEC com ID: ${ridecId} (tipo: ${typeof ridecId})`);
            console.log(`📋 RIDECs disponíveis:`, this.ridecs.map(r => ({ 
                id: r.id, 
                idType: typeof r.id,
                title: r.title, 
                isModeloRidec: r.isModeloRidec 
            })));
            
            const ridec = this.ridecs.find(r => {
                console.log(`🔍 Comparando: ${r.id} (${typeof r.id}) === ${ridecId} (${typeof ridecId}) -> ${r.id === ridecId}`);
                return r.id === ridecId;
            });
            
            if (ridec) {
                console.log(`✅ RIDEC encontrado:`, ridec);
                if (ridec.isOccurrence) {
                    modalTitle.textContent = 'Editar Ocorrência';
                } else {
                    modalTitle.textContent = 'Editar RIDEC Modelo';
                }
                this.populateRidecForm(ridec);
            } else {
                console.log(`❌ RIDEC não encontrado com ID: ${ridecId}`);
                modalTitle.textContent = 'Novo RIDEC Modelo';
                form.reset();
                this.clearStageDescriptions();
            }
        } else {
            modalTitle.textContent = 'Novo RIDEC Modelo';
            form.reset();
            this.clearStageDescriptions();
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
        console.log('🔍 Preenchendo formulário RIDEC com dados:', ridec);
        console.log('📋 Dados das etapas recebidos:', {
            deadlines: ridec.deadlines,
            deadlineUnits: ridec.deadlineUnits,
            stageDescriptions: ridec.stageDescriptions,
            pathRI: ridec.pathRI,
            pathD: ridec.pathD,
            pathE: ridec.pathE,
            pathC: ridec.pathC
        });
        
        document.getElementById('ridecTitle').value = ridec.title;
        document.getElementById('ridecDescription').value = ridec.description;
        document.getElementById('ridecArea').value = ridec.area || '';
        document.getElementById('ridecTimeUnit').value = ridec.timeUnit || 'hours';
        document.getElementById('ridecMaxTime').value = ridec.maxTime || '';
        document.getElementById('ridecNonconformityPercent').value = ridec.nonconformityPercent || 0;
        
        // Definir modo de controle de tempo
        const timeControlMode = ridec.timeControlMode || 'detailed';
        document.getElementById(timeControlMode === 'detailed' ? 'detailedMode' : 'simpleMode').checked = true;
        
        // Atualizar visibilidade da seção detalhada
        this.initializeTimeControlMode();
        
        // Preencher prazos das etapas
        console.log('📝 Preenchendo prazos das etapas...');
        document.getElementById('deadlineRI').value = ridec.deadlines?.RI || '';
        document.getElementById('deadlineD').value = ridec.deadlines?.D || '';
        document.getElementById('deadlineE').value = ridec.deadlines?.E || '';
        document.getElementById('deadlineC').value = ridec.deadlines?.C || '';
        
        console.log('📝 Prazos preenchidos:', {
            RI: ridec.deadlines?.RI || '',
            D: ridec.deadlines?.D || '',
            E: ridec.deadlines?.E || '',
            C: ridec.deadlines?.C || ''
        });
        
        // Carregar unidades individuais das etapas
        console.log('📝 Preenchendo unidades das etapas...');
        if (ridec.deadlineUnits) {
            document.getElementById('unitRI').value = ridec.deadlineUnits.RI || 'hours';
            document.getElementById('unitD').value = ridec.deadlineUnits.D || 'hours';
            document.getElementById('unitE').value = ridec.deadlineUnits.E || 'hours';
            document.getElementById('unitC').value = ridec.deadlineUnits.C || 'hours';
            
            console.log('📝 Unidades preenchidas:', {
                RI: ridec.deadlineUnits.RI || 'hours',
                D: ridec.deadlineUnits.D || 'hours',
                E: ridec.deadlineUnits.E || 'hours',
                C: ridec.deadlineUnits.C || 'hours'
            });
        } else {
            console.log('⚠️ Nenhuma unidade de deadline encontrada, usando padrão');
            // Fallback para RIDECs antigos
            document.getElementById('unitRI').value = 'hours';
            document.getElementById('unitD').value = 'hours';
            document.getElementById('unitE').value = 'hours';
            document.getElementById('unitC').value = 'hours';
        }
        
        // Carregar descrições das etapas
        console.log('📝 Preenchendo descrições das etapas...');
        if (ridec.stageDescriptions) {
            document.getElementById('descriptionRI').value = ridec.stageDescriptions.RI || '';
            document.getElementById('descriptionD').value = ridec.stageDescriptions.D || '';
            document.getElementById('descriptionE').value = ridec.stageDescriptions.E || '';
            document.getElementById('descriptionC').value = ridec.stageDescriptions.C || '';
            
            console.log('📝 Descrições preenchidas:', {
                RI: ridec.stageDescriptions.RI || '',
                D: ridec.stageDescriptions.D || '',
                E: ridec.stageDescriptions.E || '',
                C: ridec.stageDescriptions.C || ''
            });
        } else {
            console.log('⚠️ Nenhuma descrição de etapa encontrada, limpando campos');
            // Fallback para RIDECs antigos - limpar campos
            document.getElementById('descriptionRI').value = '';
            document.getElementById('descriptionD').value = '';
            document.getElementById('descriptionE').value = '';
            document.getElementById('descriptionC').value = '';
        }
        
        // Carregar caminhos dos arquivos das etapas
        console.log('📝 Preenchendo caminhos das etapas...');
        document.getElementById('pathRI').value = ridec.pathRI || '';
        document.getElementById('pathD').value = ridec.pathD || '';
        document.getElementById('pathE').value = ridec.pathE || '';
        document.getElementById('pathC').value = ridec.pathC || '';
        
        console.log('📝 Caminhos preenchidos:', {
            pathRI: ridec.pathRI || '',
            pathD: ridec.pathD || '',
            pathE: ridec.pathE || '',
            pathC: ridec.pathC || ''
        });
        
        document.getElementById('startRidec').value = ridec.relations?.start || '';
        document.getElementById('endRidec').value = ridec.relations?.end || '';
        
        // Atualizar labels das unidades de tempo
        this.updateTimeUnitLabels();
    }

    // Limpar campos de descrição das etapas e não conformidades
    clearStageDescriptions() {
        const descriptionFields = ['descriptionRI', 'descriptionD', 'descriptionE', 'descriptionC'];
        descriptionFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
        
        // Limpar campo de não conformidades
        const nonconformityField = document.getElementById('ridecNonconformityPercent');
        if (nonconformityField) {
            nonconformityField.value = '';
        }
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
    async saveRidec() {
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
        const nonconformityPercentValue = document.getElementById('ridecNonconformityPercent').value;
        const timeControlMode = document.querySelector('input[name="timeControlMode"]:checked').value;
        
        let deadlines = {};
        let deadlineUnits = {};
        let stageDescriptions = {};
        let stagePaths = {};
        
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
            
            // Capturar descrições das etapas
            stageDescriptions = {
                RI: document.getElementById('descriptionRI').value || '',
                D: document.getElementById('descriptionD').value || '',
                E: document.getElementById('descriptionE').value || '',
                C: document.getElementById('descriptionC').value || ''
            };
            
            // Capturar caminhos dos arquivos das etapas
            stagePaths = {
                RI: document.getElementById('pathRI').value || '',
                D: document.getElementById('pathD').value || '',
                E: document.getElementById('pathE').value || '',
                C: document.getElementById('pathC').value || ''
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
            
            // No modo simples, usar descrições padrão
            stageDescriptions = {
                RI: 'Requisitos e Início - Definição inicial e planejamento',
                D: 'Desenvolvimento - Execução e implementação',
                E: 'Execução e Testes - Validação e qualidade',
                C: 'Conclusão - Finalização e entrega'
            };
            
            // No modo simples, não há campos de path específicos
            stagePaths = {
                RI: '',
                D: '',
                E: '',
                C: ''
            };
        }

        const ridecData = {
            title: document.getElementById('ridecTitle').value,
            description: document.getElementById('ridecDescription').value,
            area: document.getElementById('ridecArea').value,
            timeUnit: document.getElementById('ridecTimeUnit').value,
            maxTime: maxTimeValue ? parseInt(maxTimeValue) : null,
            nonconformityPercent: nonconformityPercentValue ? parseFloat(nonconformityPercentValue) : 0,
            timeControlMode: timeControlMode,
            deadlines: deadlines,
            deadlineUnits: deadlineUnits,
            stageDescriptions: stageDescriptions,
            pathRI: stagePaths.RI,
            pathD: stagePaths.D,
            pathE: stagePaths.E,
            pathC: stagePaths.C,
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
            try {
                // Verificar se o Supabase está disponível
                console.log('🔍 Verificando disponibilidade do Supabase...');
                console.log('📊 window.supabaseDB:', !!window.supabaseDB);
                console.log('📊 isConnected():', window.supabaseDB ? window.supabaseDB.isConnected() : 'N/A');
                
                if (window.supabaseDB && window.supabaseDB.isConnected()) {
                    console.log('🚀 Criando modelo RIDEC no Supabase...');
                    
                    try {
                        // Criar modelo no Supabase
                        const supabaseResult = await window.supabaseDB.createModeloRidecCompleto(ridecData);
                        
                        console.log('✅ Modelo criado no Supabase:', supabaseResult);
                        
                        // Criar também no localStorage para compatibilidade
                        const newRidec = {
                            id: this.generateId(),
                            ...ridecData,
                            stageA: null,
                            currentStage: 'RI',
                            startTime: Date.now(),
                            stageStartTime: Date.now(),
                            completed: false,
                            isOccurrence: false, // Marcar como modelo
                            integrations: {}, // Inicializar integrações vazias
                            supabaseId: supabaseResult.modelo.cod_modelo_ridec // Armazenar ID do Supabase
                        };
                        
                        this.ridecs.push(newRidec);
                        this.showNotification('RIDEC modelo criado com sucesso no Supabase!', 'success', false);
                        this.integrateWithExternalSystem(newRidec.id, 'RI', 'ridec_created');
                        
                    } catch (supabaseError) {
                        console.error('❌ Erro ao criar no Supabase:', supabaseError);
                        this.showNotification('Erro ao salvar no banco de dados: ' + supabaseError.message, 'error', false);
                        
                        // Fallback: criar apenas no localStorage
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
                        this.showNotification('RIDEC modelo criado localmente (erro no banco)', 'warning', false);
                        this.integrateWithExternalSystem(newRidec.id, 'RI', 'ridec_created');
                    }
                    
                } else {
                    console.log('⚠️ Supabase não disponível, criando apenas no localStorage...');
                    console.log('📊 Motivo: window.supabaseDB =', !!window.supabaseDB);
                    console.log('📊 Motivo: isConnected() =', window.supabaseDB ? window.supabaseDB.isConnected() : 'N/A');
                    
                    // Criar apenas no localStorage se Supabase não estiver disponível
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
                    this.showNotification('RIDEC modelo criado com sucesso! (Apenas local)', 'success', false);
                    this.integrateWithExternalSystem(newRidec.id, 'RI', 'ridec_created');
                }
                
            } catch (error) {
                console.error('❌ Erro ao criar modelo RIDEC:', error);
                
                // Fallback: criar apenas no localStorage
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
                this.showNotification('RIDEC modelo criado localmente (erro no Supabase)', 'warning', false);
                this.integrateWithExternalSystem(newRidec.id, 'RI', 'ridec_created');
            }
        }

        this.saveToLocalStorage();
        this.renderRidecList();
        this.closeRidecModal();
    }

    // Abrir modal Etapa A
    openStageAModal(ridecId) {
        // Converter para número se for string, pois os IDs no banco são números
        const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
        this.currentRidecId = numericRidecId;
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

    // Renderização otimizada para exclusão - sem operações custosas
    renderRidecListOptimized() {
        try {
            const ridecList = document.getElementById('ridecList');
            if (!ridecList) return;
            
            ridecList.innerHTML = '';

            // GARANTIR QUE O ARRAY ESTÁ LIMPO
            if (!Array.isArray(this.ridecs)) {
                this.ridecs = [];
            }

            const modelRidecs = this.ridecs.filter(ridec => {
                // Validações mais rigorosas
                const isValid = ridec && 
                    ridec.id && 
                    ridec.title && 
                    !ridec.isOccurrence &&
                    typeof ridec === 'object' &&
                    typeof ridec.id !== 'undefined' &&
                    ridec.id !== null &&
                    ridec.id !== 'undefined' &&
                    ridec.id !== 'null';
                
                if (!isValid) {
                    console.warn('⚠️ RIDEC inválido filtrado:', {
                        id: ridec?.id,
                        title: ridec?.title,
                        isOccurrence: ridec?.isOccurrence,
                        isModeloRidec: ridec?.isModeloRidec
                    });
                }
                
                return isValid;
            });
            
            console.log(`RIDECs encontrados (otimizado): ${modelRidecs.length}`);
            
            // Verificar se há áreas para renderizar
            if (!this.availableAreas || this.availableAreas.length === 0) {
                console.log('⚠️ Nenhuma área carregada, renderizando estado vazio');
                this.renderEmptyState();
                return;
            }

            if (modelRidecs.length === 0) {
                console.log('⚠️ Nenhum RIDEC encontrado, mas há áreas disponíveis');
            }

            // Organizar RIDECs modelos por área (filtrado pela empresa do usuário)
            const ridecsByArea = this.groupRidecsByArea(modelRidecs);

            // Verificar se há áreas para exibir
            const areasToShow = Object.keys(ridecsByArea);
            if (areasToShow.length === 0) {
                console.log('⚠️ Nenhuma área da empresa do usuário encontrada para exibir RIDECs');
                this.renderEmptyState('Nenhuma área da sua empresa encontrada');
                return;
            }

            Object.keys(ridecsByArea).forEach(area => {
                const areaSection = this.createAreaSection(area, ridecsByArea[area]);
                ridecList.appendChild(areaSection);
            });
            
        } catch (error) {
            console.error('❌ Erro ao renderizar lista de RIDECs (otimizado):', error);
        }
    }

    // Renderizar lista de RIDECs
    async renderRidecList() {
        // Evitar múltiplas renderizações simultâneas
        if (this.renderingList) {
            console.log('⏳ Renderização já em andamento, aguardando...');
            return;
        }
        
        // Verificar se há mudanças significativas antes de renderizar
        const currentRidecsHash = JSON.stringify(this.ridecs.map(r => ({
            id: r.id,
            title: r.title,
            currentStage: r.currentStage,
            completed: r.completed,
            stageTimers: r.stageTimers
        })));
        
        if (this.lastRidecsHash === currentRidecsHash) {
            // Não há mudanças significativas, não renderizar
            return;
        }
        
        this.lastRidecsHash = currentRidecsHash;
        this.renderingList = true;
        
        try {
            const ridecList = document.getElementById('ridecList');
            if (!ridecList) return;
            
            ridecList.innerHTML = '';

            // Verificar se há dados residuais e limpar
            this.checkAndCleanResidualData();

        // GARANTIR QUE O ARRAY ESTÁ LIMPO
        if (!Array.isArray(this.ridecs)) {
            this.ridecs = [];
        }

        const modelRidecs = this.ridecs.filter(ridec => {
            // Validações mais rigorosas
            const isValid = ridec && 
                ridec.id && 
                ridec.title && 
                !ridec.isOccurrence &&
                typeof ridec === 'object' &&
                typeof ridec.id !== 'undefined' &&
                ridec.id !== null &&
                ridec.id !== 'undefined' &&
                ridec.id !== 'null';
            
            if (!isValid) {
                console.warn('⚠️ RIDEC inválido filtrado:', {
                    id: ridec?.id,
                    title: ridec?.title,
                    isOccurrence: ridec?.isOccurrence,
                    isModeloRidec: ridec?.isModeloRidec
                });
            }
            
            return isValid;
        });
        
        console.log(`RIDECs encontrados: ${modelRidecs.length}`);
        
        // Verificar se há áreas para renderizar (mesmo sem RIDECs)
        if (!this.availableAreas || this.availableAreas.length === 0) {
            console.log('⚠️ Nenhuma área carregada, renderizando estado vazio');
            this.renderEmptyState();
            
            // Limpar dados residuais do localStorage se não há RIDECs
            if (this.ridecs.length === 0) {
                localStorage.removeItem('ridecs');
                console.log('localStorage limpo - array vazio');
            }
            return;
        }

        if (modelRidecs.length === 0) {
            console.log('⚠️ Nenhum RIDEC encontrado, mas há áreas disponíveis');
        }

        // As áreas já foram verificadas acima, continuar com o processamento

        // Organizar RIDECs modelos por área (filtrado pela empresa do usuário)
        const ridecsByArea = this.groupRidecsByArea(modelRidecs);

        // Verificar se há áreas para exibir
        const areasToShow = Object.keys(ridecsByArea);
        if (areasToShow.length === 0) {
            console.log('⚠️ Nenhuma área da empresa do usuário encontrada para exibir RIDECs');
            this.renderEmptyState('Nenhuma área da sua empresa encontrada');
            return;
        }

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
        
        } catch (error) {
            console.error('❌ Erro ao renderizar lista de RIDECs:', error);
        } finally {
            this.renderingList = false;
        }
    }

    // Agrupar RIDECs por área (apenas áreas da empresa do usuário)
    groupRidecsByArea(ridecs) {
        const grouped = {};
        
        // Obter áreas disponíveis da empresa do usuário
        const userAreas = this.getUserCompanyAreas();
        console.log('🏢 Áreas da empresa do usuário:', userAreas);
        
        // Primeiro, adicionar todas as áreas da empresa (mesmo sem RIDECs)
        userAreas.forEach(area => {
            grouped[area] = [];
            console.log(`🆕 Área adicionada: "${area}" (0 RIDECs)`);
        });
        
        // Depois, adicionar os RIDECs às suas respectivas áreas
        ridecs.forEach(ridec => {
            const area = ridec.area || 'Sem Área';
            
            // Filtrar apenas áreas da empresa do usuário
            if (userAreas.includes(area) || area === 'Sem Área') {
                if (!grouped[area]) {
                    grouped[area] = [];
                }
                grouped[area].push(ridec);
                console.log(`✅ RIDEC "${ridec.title}" adicionado à área "${area}"`);
            } else {
                console.log(`⚠️ RIDEC "${ridec.title}" ignorado - área "${area}" não pertence à empresa do usuário`);
            }
        });

        console.log('📊 RIDECs agrupados por área:', grouped);
        return grouped;
    }

    // Obter áreas da empresa do usuário
    getUserCompanyAreas() {
        // Se já temos as áreas carregadas, usar elas
        if (this.availableAreas && this.availableAreas.length > 0) {
            return this.availableAreas;
        }
        
        // Fallback: tentar obter do dropdown
        const areaSelect = document.getElementById('ridecArea');
        if (areaSelect) {
            const areas = [];
            for (let i = 1; i < areaSelect.options.length; i++) { // Pular primeira opção vazia
                areas.push(areaSelect.options[i].value);
            }
            return areas;
        }
        
        // Se não conseguir obter, retornar array vazio
        console.log('⚠️ Não foi possível obter áreas da empresa do usuário');
        return [];
    }

    // Agrupar RIDECs por área sem filtro (para evitar loop)
    groupRidecsByAreaWithoutFilter(ridecs) {
        const grouped = {};
        
        ridecs.forEach(ridec => {
            const area = ridec.area || 'Sem Área';
            if (!grouped[area]) {
                grouped[area] = [];
            }
            grouped[area].push(ridec);
        });

        console.log('📊 RIDECs agrupados por área (sem filtro):', grouped);
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

        if (ridecs.length > 0) {
            ridecs.forEach(ridec => {
                const card = this.createRidecCard(ridec);
                areaGrid.appendChild(card);
            });
        } else {
            // Mostrar mensagem quando não há RIDECs na área
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'ridec-area-empty';
            emptyMessage.innerHTML = `
                <div class="empty-area-content">
                    <i class="fas fa-inbox"></i>
                    <h4>Nenhum RIDEC cadastrado</h4>
                    <p>Esta área ainda não possui RIDECs cadastrados.</p>
                    <button class="btn-create-ridec" onclick="ridecSystem.createRidecInArea('${area}')">
                        <i class="fas fa-plus"></i>
                        Criar Primeiro RIDEC
                    </button>
                </div>
            `;
            areaGrid.appendChild(emptyMessage);
        }

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
        // Sem ícone para as áreas
        return '';
    }

    // Criar card RIDEC
    createRidecCard(ridec) {
        console.log('🎴 Criando card para RIDEC:', ridec.id, 'tipo:', typeof ridec.id, 'título:', ridec.title);
        
        const card = document.createElement('div');
        card.className = `ridec-card model-card ${this.isOverdue(ridec) ? 'overdue' : ''}`;
        card.setAttribute('data-ridec-id', ridec.id);
        
        card.innerHTML = `
            <div class="ridec-header" style="position: relative;">
                <div class="model-badge" style="position: absolute; top: 8px; left: 8px; z-index: 10;">${ridec.tipo_modelo?.nome_tipo_modelo || 'Modelo'}</div>
                <div class="ridec-title">
                    ${ridec.title}
                </div>
                <div class="ridec-description">${ridec.description}</div>
            </div>
            <div class="ridec-body">
                <div class="ridec-info">                    
                    <div class="info-item">
                        <div class="info-label">Tempo Máximo</div>
                        <div class="info-value ${!ridec.maxTime ? 'missing-value' : ''}">${ridec.maxTime ? ridec.maxTime + this.getTimeUnitLabel(ridec.timeUnit || 'hours').charAt(0) : 'Não configurado'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Etapas A</div>
                        <div class="info-value">${ridec.stagesA ? ridec.stagesA.length : 0}</div>
                    </div>
                </div>
                

                

            </div>
        `;
        
        // Adicionar event listener para clique no card (abrir modal de edição)
        card.addEventListener('click', (event) => {
            console.log('🖱️ Clique no card do modelo RIDEC:', ridec.id);
            this.editRidec(ridec.id);
        });

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
        // Converter para número se for string, pois os IDs no banco são números
        const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
        
        // Verificar se é um modelo RIDEC (tem a classe model-card)
        // Como todos os cards criados pela função createRidecCard são modelos, vamos verificar diretamente
        // se o ID corresponde a um modelo existente
        const isModelCard = document.querySelector(`.model-card[data-ridec-id="${numericRidecId}"]`) !== null;
        
        // Alternativamente, verificar se existe algum card modelo no DOM
        const hasModelCards = document.querySelectorAll('.model-card').length > 0;
        
        // Se há cards modelo e estamos editando um deles, abrir modal de edição de modelo
        if (hasModelCards && isModelCard) {
            this.openEditModelModal(numericRidecId);
        } else {
            this.openRidecModal(numericRidecId);
        }
    }

    // Excluir RIDEC (Soft Delete)
    async deleteRidec(ridecId) {
        if (confirm('Tem certeza que deseja excluir este modelo RIDEC?')) {
            try {
                // Converter para número se for string, pois os IDs no banco são números
                const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
                
                // Mostrar indicador de carregamento
                this.showNotification('Excluindo RIDEC...', 'info', false);
                
                // Chamar função de soft delete no banco de dados
                if (window.supabaseDB && window.supabaseDB.isConnected()) {
                    console.log('📡 Supabase conectado, executando soft delete...');
                    await window.supabaseDB.deleteModeloRidec(numericRidecId);
                    console.log('✅ RIDEC marcado como inativo no banco de dados');
                    
                    // Recarregar modelos após exclusão
                    console.log('🔄 Recarregando modelos após exclusão...');
                    await this.reloadModelsAfterDelete();
                    
                } else {
                    console.log('⚠️ Supabase não disponível, usando exclusão local');
                    
                    // Limpar relações que referenciam o RIDEC deletado
                    this.cleanupRelations(numericRidecId);
                    
                    // Remover da lista local
                    this.ridecs = this.ridecs.filter(r => r.id !== numericRidecId);
                    this.saveToLocalStorage();
                    
                    // Renderização otimizada para modo offline
                    this.renderRidecListOptimized();
                }
                
                this.showNotification('RIDEC excluído com sucesso! (marcado como inativo)', 'success', false);
                
            } catch (error) {
                console.error('❌ Erro ao excluir RIDEC:', error);
                this.showNotification('Erro ao excluir RIDEC. Tente novamente.', 'error', false);
            }
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

    // Recarregar modelos após exclusão
    async reloadModelsAfterDelete() {
        try {
            console.log('🔄 Recarregando modelos após exclusão...');
            
            // Limpar dados antigos
            this.ridecs = [];
            this.saveToLocalStorage();
            
            // Obter usuário atual
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.cod_empresa) {
                console.log('⚠️ Usuário não encontrado, não é possível recarregar modelos');
                return;
            }
            
            // Carregar áreas da empresa
            const areas = await window.supabaseDB.getAreasByEmpresa(currentUser.cod_empresa);
            if (areas && areas.length > 0) {
                console.log('✅ Áreas carregadas:', areas.length);
                
                // Carregar modelos das áreas
                await this.loadModelosRidecFromAreas(areas);
                
                // Renderizar lista
                this.renderRidecList();
                
                console.log('✅ Modelos recarregados com sucesso');
            } else {
                console.log('⚠️ Nenhuma área encontrada para recarregar');
                this.renderRidecList();
            }
            
        } catch (error) {
            console.error('❌ Erro ao recarregar modelos:', error);
            this.renderRidecList(); // Renderizar mesmo com erro
        }
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

        // Limpar notificações de atraso para esta etapa
        this.clearOverdueNotifications(ridecId, stage);

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
    showNotification(message, type = 'info', saveToHistory = false, ridecId = null, stage = null) {
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
            read: false,
            ridecId: ridecId,
            stage: stage
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
                // Verificar se há timers ativos antes de renderizar
                const hasActiveTimers = this.ridecs.some(ridec => 
                    ridec.stageTimers && Object.values(ridec.stageTimers).some(timer => timer.running)
                );
                
                if (hasActiveTimers) {
                    this.renderRidecList();
                }
            }
        }, 1000); // Atualizar a cada segundo
    }

    // Verificar etapas atrasadas
    checkOverdueStages() {
        console.log('🔍 Verificando etapas atrasadas...');
        
        this.ridecs.forEach(ridec => {
            if (ridec.completed) return;

            // Verificar etapa atual
            if (this.isStageOverdue(ridec, ridec.currentStage)) {
                // Verificar se já foi notificado sobre este atraso
                const notificationKey = `overdue_${ridec.id}_${ridec.currentStage}`;
                const alreadyNotified = this.notifications.some(n => 
                    n.type === 'overdue' && 
                    n.ridecId === ridec.id && 
                    n.stage === ridec.currentStage &&
                    !n.read
                );
                
                if (!alreadyNotified) {
                    console.log(`⚠️ Etapa atrasada detectada: ${ridec.title} - ${ridec.currentStage}`);
                    this.showNotification(
                        `RIDEC "${ridec.title}" - Etapa ${ridec.currentStage} está atrasada!`,
                        'error',
                        true, // Salvar no histórico
                        ridec.id, // ridecId
                        ridec.currentStage // stage
                    );
                    this.integrateWithExternalSystem(ridec.id, ridec.currentStage, 'overdue_alert');
                }
            }

            // Verificar etapas A se existirem
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                ridec.stagesA.forEach(stageA => {
                    if (ridec.currentStage === stageA.identifier && this.isStageOverdue(ridec, stageA.identifier)) {
                        // Verificar se já foi notificado sobre este atraso
                        const notificationKey = `overdue_${ridec.id}_${stageA.identifier}`;
                        const alreadyNotified = this.notifications.some(n => 
                            n.type === 'overdue' && 
                            n.ridecId === ridec.id && 
                            n.stage === stageA.identifier &&
                            !n.read
                        );
                        
                        if (!alreadyNotified) {
                            console.log(`⚠️ Etapa A atrasada detectada: ${ridec.title} - ${stageA.identifier}`);
                            this.showNotification(
                                `RIDEC "${ridec.title}" - Etapa ${stageA.identifier} está atrasada!`,
                                'error',
                                true, // Salvar no histórico
                                ridec.id, // ridecId
                                stageA.identifier // stage
                            );
                            this.integrateWithExternalSystem(ridec.id, stageA.identifier, 'overdue_alert');
                        }
                    }
                });
            }
        });
    }

    // Limpar notificações de atraso para uma etapa específica
    clearOverdueNotifications(ridecId, stage) {
        console.log(`🧹 Limpando notificações de atraso para RIDEC ${ridecId}, etapa ${stage}`);
        
        // Remover notificações de atraso não lidas para esta etapa
        this.notifications = this.notifications.filter(n => 
            !(n.type === 'overdue' && n.ridecId === ridecId && n.stage === stage && !n.read)
        );
        
        this.saveNotifications();
        this.updateNotificationCount();
        this.renderNotificationList();
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
        
        // Limpar gráficos e indicadores
        this.clearCharts();
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
            if (ridec.relations?.start) {
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
        if (ridec.relations?.start && !ridec.relations?.end) return 'start-node';
        if (ridec.relations?.end && !ridec.relations?.start) return 'end-node';
        return 'middle-node';
    }

    // Obter informações de relacionamento do nó
    getFlowNodeRelations(ridec) {
        let relations = '';
        
        if (ridec.relations?.start) {
            const startRidec = this.ridecs.find(r => r.id === ridec.relations.start);
            if (startRidec && !startRidec.isOccurrence && !startRidec.occurrenceNumber) {
                relations += `← ${startRidec.title}<br>`;
            }
        }
        
        if (ridec.relations?.end) {
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
        // Padrões de reconhecimento de processos - removidos para usar apenas dados do banco
        const processPatterns = [];
        
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
        // Converter para número se for string, pois os IDs no banco são números
        const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
        this.currentRidecId = numericRidecId;
        const ridec = this.ridecs.find(r => r.id === numericRidecId);
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
        console.log('🔍 getCurrentUser: Iniciando busca...');
        
        // PRIORIDADE 1: Obter usuário do sistema de autenticação (AuthChecker)
        if (window.authChecker && window.authChecker.getCurrentUser) {
            console.log('✅ AuthChecker disponível, obtendo usuário...');
            const user = window.authChecker.getCurrentUser();
            if (user) {
                console.log('👤 Usuário via AuthChecker:', user);
                console.log('🏢 Empresa do usuário (AuthChecker):', user.cod_empresa);
                return user;
            } else {
                console.log('⚠️ AuthChecker retornou null, tentando fallback...');
            }
        } else {
            console.log('❌ AuthChecker não disponível ou sem getCurrentUser');
        }
        
        // PRIORIDADE 2: Fallback - obter dados diretamente da sessão
        console.log('🔄 Tentando fallback via dados de sessão...');
        const sessionData = this.getSessionDataDirectly();
        if (sessionData && sessionData.user) {
            console.log('📦 Usando dados de sessão como fallback');
            console.log('👤 Usuário via sessão:', sessionData.user);
            console.log('🏢 Empresa do usuário (sessão):', sessionData.user.cod_empresa);
            
            // SINCRONIZAR: Atualizar AuthChecker se ele estiver disponível mas sem dados
            if (window.authChecker && !window.authChecker.currentUser) {
                console.log('🔄 Sincronizando AuthChecker com dados de sessão...');
                window.authChecker.currentUser = sessionData.user;
                console.log('✅ AuthChecker sincronizado');
            }
            
            return sessionData.user;
        } else {
            console.log('❌ Nenhum dado de sessão encontrado');
        }
        
        console.log('❌ getCurrentUser: Nenhum usuário encontrado');
        return null;
    }

    // Limpar dados do localStorage relacionados aos RIDECs
    clearLocalStorageData() {
        try {
            console.log('🧹 Limpando dados do localStorage...');
            
            // Remover apenas dados de RIDECs, mantendo notificações e configurações
            localStorage.removeItem('ridecs');
            
            // Limpar também dados de sessão antigos se existirem
            const sessionData = localStorage.getItem('ridec_session');
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    if (parsed.ridecs) {
                        delete parsed.ridecs;
                        localStorage.setItem('ridec_session', JSON.stringify(parsed));
                    }
                } catch (e) {
                    // Se não conseguir fazer parse, remover completamente
                    localStorage.removeItem('ridec_session');
                }
            }
            
            console.log('✅ Dados do localStorage limpos');
        } catch (error) {
            console.error('❌ Erro ao limpar localStorage:', error);
        }
    }

    // Carregar áreas da empresa do usuário do Supabase
    async loadAreasFromSupabase() {
        // Proteção contra chamadas múltiplas
        if (this.loadingAreas) {
            console.log('⏳ Carregamento de áreas já em andamento, aguardando...');
            return;
        }
        
        // Verificar se já foi carregado recentemente (evitar loops)
        const lastLoadTime = localStorage.getItem('lastAreasLoad');
        const now = Date.now();
        if (lastLoadTime && (now - parseInt(lastLoadTime)) < 5000) { // 5 segundos
            console.log('⏳ Áreas carregadas recentemente, aguardando...');
            return;
        }
        
        this.loadingAreas = true;
        
        try {
            console.log('🔍 Iniciando carregamento de áreas do Supabase...');
            
            // Limpar dados antigos do localStorage antes de carregar do banco
            console.log('🧹 Limpando dados antigos do localStorage...');
            this.clearLocalStorageData();
            
            // Validar consistência antes de carregar áreas
            this.validateUserDataConsistency();
            
            const currentUser = this.getCurrentUser();
            console.log('👤 Usuário atual:', currentUser);
            console.log('🏢 Empresa do usuário:', currentUser ? currentUser.cod_empresa : 'N/A');
            console.log('📧 Email do usuário:', currentUser ? (currentUser.email_usuario || currentUser.email) : 'N/A');
            
            if (!currentUser) {
                console.log('❌ Usuário não autenticado, usando áreas padrão');
                return;
            }

            // Inicializar conexão com Supabase se necessário
            if (!window.supabaseDB) {
                console.log('🔧 Aguardando Supabase estar pronto...');
                // Aguardar o Supabase estar pronto
                await this.waitForSupabase();
            }

            // Obter empresa do usuário
            const userEmpresa = currentUser.cod_empresa || currentUser.empresa;
            console.log('🏢 Empresa do usuário:', userEmpresa);
            
            if (!userEmpresa) {
                console.log('❌ Usuário não possui empresa associada');
                return;
            }

            // Carregar áreas da empresa
            console.log('📡 Buscando áreas para empresa:', userEmpresa);
            const areas = await window.supabaseDB.getAreasByEmpresa(userEmpresa);
            
            if (areas && areas.length > 0) {
                console.log('✅ Áreas carregadas do Supabase:', areas);
                this.updateAreaDropdown(areas);
                this.updateAreaOptions(areas);
                
                // Carregar modelos RIDEC das áreas
                await this.loadModelosRidecFromAreas(areas);
                
                // Re-renderizar a lista de RIDECs com as áreas filtradas
                console.log('🔄 Re-renderizando lista de RIDECs com áreas filtradas...');
                this.renderRidecList();
            } else {
                console.log('⚠️ Nenhuma área encontrada para a empresa do usuário');
                // Renderizar lista vazia mesmo sem áreas
                this.renderRidecList();
            }

        } catch (error) {
            console.error('❌ Erro ao carregar áreas do Supabase:', error);
            this.showNotification('Erro ao carregar áreas da empresa', 'error', false);
            // Renderizar lista vazia em caso de erro
            this.renderRidecList();
        } finally {
            this.loadingAreas = false;
            // Registrar timestamp do último carregamento
            localStorage.setItem('lastAreasLoad', Date.now().toString());
        }
    }

    // Carregar modelos RIDEC das áreas
    async loadModelosRidecFromAreas(areas) {
        try {
            console.log('🔄 Carregando modelos RIDEC das áreas...');
            
            const allModelos = [];
            
            for (const area of areas) {
                console.log(`🔍 Carregando modelos para área: ${area.nome_area} (${area.cod_area})`);
                
                const { data, error } = await window.supabaseDB.getClient()
                    .from('modelo_ridec')
                    .select(`
                        *,
                        empresa:cod_empresa(nome_empresa),
                        uom:cod_uom(desc_uom),
                        tipo_modelo:cod_tipo_modelo(nome_tipo_modelo)
                    `)
                    .eq('cod_area', area.cod_area)
                    .eq('ies_ativo', 'S') // Apenas modelos ativos
                    .order('nome_modelo');

                if (error) {
                    console.error(`❌ Erro ao buscar modelos da área ${area.nome_area}:`, error);
                    continue;
                }

                const modelos = data || [];
                console.log(`📋 Modelos encontrados para ${area.nome_area}: ${modelos.length}`);
                
                // Log dos modelos encontrados para debug
                modelos.forEach((modelo, index) => {
                    console.log(`📋 Modelo ${index + 1}:`, {
                        id: modelo.cod_modelo_ridec,
                        tipo: typeof modelo.cod_modelo_ridec,
                        nome: modelo.nome_modelo
                    });
                });
                
                // Converter modelos em RIDECs
                for (const modelo of modelos) {
                    const ridec = await this.convertModeloToRidec(modelo, area);
                    allModelos.push(ridec);
                }
            }

            console.log(`✅ Total de modelos RIDEC carregados: ${allModelos.length}`);
            
            // Adicionar aos RIDECs existentes (sem duplicar)
            const existingIds = this.ridecs.map(r => r.id);
            const newRidecs = allModelos.filter(r => !existingIds.includes(r.id));
            
            this.ridecs.push(...newRidecs);
            console.log(`✅ ${newRidecs.length} novos RIDECs adicionados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar modelos RIDEC:', error);
        }
    }

    // Converter modelo RIDEC em RIDEC
    async convertModeloToRidec(modelo, area) {
        // Mapear descrição UOM para unidade de tempo
        const uomMapping = {
            'Segundos': 'seconds',
            'Minutos': 'minutes', 
            'Horas': 'hours',
            'Dias': 'days',
            'Semanas': 'weeks'
        };

        // Determinar unidade de tempo baseada na descrição UOM
        let timeUnit = 'hours'; // padrão
        if (modelo.uom && modelo.uom.desc_uom) {
            timeUnit = uomMapping[modelo.uom.desc_uom] || 'hours';
        }

        // Carregar etapas do modelo
        let etapas = [];
        let deadlines = {};
        let deadlineUnits = {};
        let stageDescriptions = {};
        let stagePaths = {};

        try {
            if (window.supabaseDB && window.supabaseDB.isConnected()) {
                console.log(`🔍 Carregando etapas para modelo ${modelo.cod_modelo_ridec}...`);
                etapas = await window.supabaseDB.getEtapasModeloRidec(modelo.cod_modelo_ridec);
                console.log(`📋 Etapas carregadas para modelo ${modelo.cod_modelo_ridec}:`, etapas);
                
                // Processar etapas para extrair dados do step 2
                if (etapas && etapas.length > 0) {
                    console.log(`🔧 Processando ${etapas.length} etapas encontradas...`);
                    
                    etapas.forEach((etapa, index) => {
                        console.log(`🔧 Processando etapa ${index + 1}:`, etapa);
                        const tipoEtapa = this.getTipoEtapaName(etapa.cod_tipo_etapa);
                        console.log(`📝 Tipo da etapa ${etapa.cod_tipo_etapa} -> ${tipoEtapa}`);
                        
                        if (tipoEtapa) {
                            deadlines[tipoEtapa] = etapa.valor_uom || 0;
                            
                            // Mapear UOM da etapa para unidade de tempo
                            let etapaTimeUnit = 'hours';
                            if (etapa.uom && etapa.uom.desc_uom) {
                                etapaTimeUnit = uomMapping[etapa.uom.desc_uom] || 'hours';
                            }
                            deadlineUnits[tipoEtapa] = etapaTimeUnit;
                            stageDescriptions[tipoEtapa] = etapa.desc_etapa_modelo || '';
                            stagePaths[tipoEtapa] = etapa.path_arquivo || '';
                            
                            console.log(`✅ Dados da etapa ${tipoEtapa}:`, {
                                deadline: deadlines[tipoEtapa],
                                unit: deadlineUnits[tipoEtapa],
                                description: stageDescriptions[tipoEtapa],
                                path: stagePaths[tipoEtapa]
                            });
                        } else {
                            console.log(`❌ Tipo de etapa inválido: ${etapa.cod_tipo_etapa}`);
                        }
                    });
                } else {
                    console.log('⚠️ Nenhuma etapa encontrada para processar');
                }
                
                console.log(`📊 Resumo dos dados processados:`, {
                    deadlines,
                    deadlineUnits,
                    stageDescriptions,
                    stagePaths
                });
            } else {
                console.log('⚠️ Supabase não disponível para carregar etapas');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar etapas do modelo:', error);
        }

        console.log('🔧 Criando RIDEC com ID:', modelo.cod_modelo_ridec, 'tipo:', typeof modelo.cod_modelo_ridec);
        
        return {
            id: modelo.cod_modelo_ridec,
            title: modelo.nome_modelo,
            description: modelo.descricao_modelo || 'Modelo RIDEC sem descrição',
            area: area.nome_area,
            areaId: area.cod_area,
            priority: modelo.prioridade || 'média',
            responsible: modelo.responsavel || 'Não definido',
            status: 'pending',
            createdAt: modelo.created_at || new Date().toISOString().split('T')[0],
            deadline: modelo.prazo_estimado || null,
            progress: 0,
            stages: [],
            isOccurrence: false,
            isModeloRidec: true,
            codModeloRidec: modelo.cod_modelo_ridec,
            // Campos de tempo máximo baseados em valor_uom e cod_uom
            maxTime: modelo.valor_uom || null,
            timeUnit: timeUnit,
            // Incluir dados do tipo de modelo
            tipo_modelo: modelo.tipo_modelo,
            // Campos do step 2 carregados das etapas
            deadlines: deadlines,
            deadlineUnits: deadlineUnits,
            stageDescriptions: stageDescriptions,
            // Campos de caminhos de arquivo
            pathRI: stagePaths.RI || '',
            pathD: stagePaths.D || '',
            pathE: stagePaths.E || '',
            pathC: stagePaths.C || '',
            // Percentual de não conformidades
            nonconformityPercent: modelo.valor_nc || 0,
            // Modo de controle de tempo baseado no tipo de modelo
            timeControlMode: modelo.tipo_modelo?.nome_tipo_modelo === 'Simples' ? 'simple' : 'detailed'
        };
    }

    // Mapear código do tipo de etapa para nome
    getTipoEtapaName(codTipoEtapa) {
        const tipoMapping = {
            1: 'RI',
            2: 'D', 
            3: 'E',
            4: 'C'
        };
        return tipoMapping[codTipoEtapa] || null;
    }

    // Atualizar dropdown de áreas no modal
    updateAreaDropdown(areas) {
        const areaSelect = document.getElementById('ridecArea');
        if (!areaSelect) {
            console.log('❌ Elemento ridecArea não encontrado');
            return;
        }

        console.log('🔄 Atualizando dropdown de áreas com:', areas);

        // Limpar opções existentes (exceto a primeira)
        areaSelect.innerHTML = '<option value="">Selecione uma área</option>';

        // Adicionar áreas do Supabase
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.nome_area;
            option.textContent = area.nome_area;
            option.setAttribute('data-icon', this.getAreaIcon(area.nome_area));
            areaSelect.appendChild(option);
        });

        console.log('✅ Dropdown de áreas atualizado com', areas.length, 'áreas');
    }

    // Atualizar opções de área para criação automática
    updateAreaOptions(areas) {
        // Armazenar áreas para uso em outras funções
        this.availableAreas = areas.map(area => area.nome_area);
        console.log('Áreas disponíveis atualizadas:', this.availableAreas);
    }

    // Aguardar Supabase estar pronto
    async waitForSupabase() {
        return new Promise((resolve) => {
            if (window.supabaseDB && window.supabaseDB.isConnected()) {
                resolve(true);
                return;
            }

            const checkSupabase = () => {
                if (window.supabaseDB && window.supabaseDB.isConnected()) {
                    resolve(true);
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    }

    // Aguardar Supabase estar pronto e inicializar sistema
    async waitForSupabaseAndInitialize() {
        console.log('⏳ Aguardando Supabase estar pronto...');
        
        // Validar consistência dos dados do usuário antes de prosseguir
        this.validateUserDataConsistency();
        
        // Aguardar evento de Supabase pronto (apenas uma vez)
        if (!this.supabaseReadyListenerAdded) {
            this.supabaseReadyListenerAdded = true;
            window.addEventListener('supabaseReady', async (event) => {
                if (event.detail.success) {
                    console.log('✅ Supabase pronto, inicializando sistema...');
                    await this.waitForAuthAndInitialize();
                } else {
                    console.error('❌ Falha na inicialização do Supabase');
                    this.showNotification('Erro ao conectar com o banco de dados', 'error');
                }
            });
        }
        
        // Se o Supabase já estiver pronto, inicializar imediatamente
        if (window.supabaseDB && window.supabaseDB.isConnected()) {
            console.log('✅ Supabase já está pronto, inicializando sistema...');
            await this.waitForAuthAndInitialize();
        }
    }

    // Aguardar autenticação estar pronta e inicializar sistema
    async waitForAuthAndInitialize() {
        console.log('⏳ Aguardando sistema de autenticação estar pronto...');
        
        // Verificar se já está carregando para evitar múltiplas chamadas
        if (this.loadingAreas) {
            console.log('⏳ Carregamento de áreas já em andamento, aguardando...');
            return;
        }
        
        // Limpar dados de exemplo se existirem
        this.clearExampleData();
        
        let attempts = 0;
        const maxAttempts = 20; // Aumentar tentativas
        
        while (attempts < maxAttempts) {
            // Verificar se authChecker está disponível
            if (window.authChecker) {
                console.log('✅ AuthChecker disponível');
                
                if (window.authChecker.currentUser) {
                    console.log('✅ AuthChecker.currentUser disponível');
                    const currentUser = this.getCurrentUser();
                    console.log('👤 Usuário obtido:', currentUser);
                    
                    if (currentUser && currentUser.cod_empresa) {
                        console.log('✅ Autenticação pronta, carregando áreas...');
                        console.log('🏢 Empresa do usuário:', currentUser.cod_empresa);
                        await this.loadAreasFromSupabase();
                        return;
                    } else if (currentUser) {
                        console.log('⚠️ Usuário autenticado mas sem empresa:', currentUser);
                        console.log('🔍 Campos disponíveis:', Object.keys(currentUser));
                        return;
                    } else {
                        console.log('❌ getCurrentUser retornou null');
                    }
                } else {
                    console.log('❌ AuthChecker.currentUser não disponível');
                }
            } else {
                console.log('❌ AuthChecker não disponível');
            }
            
            attempts++;
            console.log(`⏳ Tentativa ${attempts}/${maxAttempts} - Aguardando authChecker...`);
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        
        console.log('⚠️ Timeout aguardando autenticação. Verificando se há dados de sessão...');
        
        // Fallback: tentar obter dados diretamente da sessão
        const sessionData = this.getSessionDataDirectly();
        if (sessionData && sessionData.user && sessionData.user.cod_empresa) {
            console.log('✅ Dados de sessão encontrados, carregando áreas...');
            console.log('👤 Usuário da sessão:', sessionData.user);
            console.log('🏢 Empresa da sessão:', sessionData.user.cod_empresa);
            await this.loadAreasFromSupabase();
        } else {
            console.log('❌ Nenhuma sessão válida encontrada');
            if (sessionData) {
                console.log('📦 Dados de sessão encontrados mas inválidos:', sessionData);
            }
        }
    }

    // Limpeza agressiva de dados antigos/corrompidos
    aggressiveDataCleanup() {
        console.log('🧹 Iniciando limpeza agressiva de dados...');
        
        try {
            // Não bloquear usuários específicos - apenas dados realmente corrompidos
            const problematicEmails = [];
            const problematicNames = [];
            
            // Verificar localStorage
            const localData = localStorage.getItem('ridec_session');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (parsed.user) {
                        const email = parsed.user.email_usuario || parsed.user.email;
                        const name = parsed.user.nome_usuario || parsed.user.name;
                        
                        if (problematicEmails.includes(email) || problematicNames.includes(name)) {
                            console.log(`🚨 Removendo dados problemáticos do localStorage: ${email} / ${name}`);
                            localStorage.removeItem('ridec_session');
                        }
                    }
                } catch (error) {
                    console.log('🧹 Removendo dados corrompidos do localStorage');
                    localStorage.removeItem('ridec_session');
                }
            }
            
            // Verificar sessionStorage
            const sessionData = sessionStorage.getItem('ridec_session');
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    if (parsed.user) {
                        const email = parsed.user.email_usuario || parsed.user.email;
                        const name = parsed.user.nome_usuario || parsed.user.name;
                        
                        if (problematicEmails.includes(email) || problematicNames.includes(name)) {
                            console.log(`🚨 Removendo dados problemáticos do sessionStorage: ${email} / ${name}`);
                            sessionStorage.removeItem('ridec_session');
                        }
                    }
                } catch (error) {
                    console.log('🧹 Removendo dados corrompidos do sessionStorage');
                    sessionStorage.removeItem('ridec_session');
                }
            }
            
            console.log('✅ Limpeza agressiva concluída');
            
        } catch (error) {
            console.error('❌ Erro durante limpeza agressiva:', error);
        }
    }

    // Limpar dados de exemplo
    clearExampleData() {
        try {
            const sessionData = this.getSessionDataDirectly();
            if (sessionData && sessionData.user) {
                const user = sessionData.user;
                // Verificar se são dados de exemplo
                if (user.email_usuario === 'joao@empresa.com' || 
                    user.email === 'joao@empresa.com' ||
                    user.nome_usuario === 'João Silva') {
                    console.log('🧹 Limpando dados de exemplo...');
                    localStorage.removeItem('ridec_session');
                    sessionStorage.removeItem('ridec_session');
                    console.log('✅ Dados de exemplo removidos');
                }
            }
        } catch (error) {
            console.error('Erro ao limpar dados de exemplo:', error);
        }
    }

    // Obter dados de sessão diretamente (fallback)
    getSessionDataDirectly() {
        console.log('🔍 getSessionDataDirectly: Iniciando busca...');
        
        try {
            let sessionData = localStorage.getItem('ridec_session');
            console.log('📦 localStorage:', sessionData ? 'Dados encontrados' : 'Vazio');
            
            if (!sessionData) {
                sessionData = sessionStorage.getItem('ridec_session');
                console.log('📦 sessionStorage:', sessionData ? 'Dados encontrados' : 'Vazio');
            }
            
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                console.log('✅ Dados de sessão parseados:', parsed);
                return parsed;
            } else {
                console.log('❌ Nenhum dado de sessão encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao obter dados de sessão:', error);
        }
        return null;
    }

    // Validar consistência dos dados do usuário entre diferentes fontes
    validateUserDataConsistency() {
        console.log('🔍 validateUserDataConsistency: Verificando consistência dos dados...');
        
        try {
            // Obter dados do AuthChecker
            let authCheckerUser = null;
            if (window.authChecker && window.authChecker.getCurrentUser) {
                authCheckerUser = window.authChecker.getCurrentUser();
            }
            
            // Obter dados da sessão direta
            const sessionData = this.getSessionDataDirectly();
            const sessionUser = sessionData ? sessionData.user : null;
            
            // Verificar se há dados antigos ou corrompidos
            this.checkForCorruptedData(authCheckerUser, sessionUser);
            
            // Comparar dados
            if (authCheckerUser && sessionUser) {
                const isSameUser = (
                    authCheckerUser.email_usuario === sessionUser.email_usuario ||
                    authCheckerUser.email === sessionUser.email ||
                    authCheckerUser.cod_usuario === sessionUser.cod_usuario
                );
                
                if (isSameUser) {
                    console.log('✅ Dados de usuário consistentes entre AuthChecker e sessão');
                } else {
                    console.error('❌ INCONSISTÊNCIA DETECTADA: Dados de usuário diferentes!');
                    console.error('AuthChecker:', authCheckerUser);
                    console.error('Sessão:', sessionUser);
                    
                    // Tentar corrigir usando os dados da sessão como fonte de verdade
                    if (window.authChecker) {
                        console.log('🔄 Corrigindo AuthChecker com dados da sessão...');
                        window.authChecker.currentUser = sessionUser;
                        console.log('✅ AuthChecker corrigido');
                    }
                }
            } else if (authCheckerUser && !sessionUser) {
                console.log('⚠️ AuthChecker tem dados mas sessão não - isso pode indicar problema');
            } else if (!authCheckerUser && sessionUser) {
                console.log('⚠️ Sessão tem dados mas AuthChecker não - sincronizando...');
                if (window.authChecker) {
                    window.authChecker.currentUser = sessionUser;
                    console.log('✅ AuthChecker sincronizado com dados da sessão');
                }
            } else {
                console.log('❌ Nenhum dado de usuário encontrado em nenhuma fonte');
            }
            
        } catch (error) {
            console.error('❌ Erro ao validar consistência dos dados:', error);
        }
    }

    // Verificar e limpar dados corrompidos ou antigos
    checkForCorruptedData(authUser, sessionUser) {
        console.log('🔍 checkForCorruptedData: Verificando dados corrompidos...');
        
        // Não bloquear usuários específicos - apenas dados realmente corrompidos
        const knownOldEmails = [];
        const knownOldNames = [];
        
        let foundCorruptedData = false;
        
        // Verificar AuthChecker
        if (authUser) {
            const authEmail = authUser.email_usuario || authUser.email;
            const authName = authUser.nome_usuario || authUser.name;
            
            if (knownOldEmails.includes(authEmail) || knownOldNames.includes(authName)) {
                console.error('🚨 DADOS CORROMPIDOS DETECTADOS no AuthChecker!');
                console.error(`Email: ${authEmail}, Nome: ${authName}`);
                foundCorruptedData = true;
                
                // LIMPEZA AGRESSIVA IMEDIATA
                this.emergencyDataCleanup();
            }
        }
        
        // Verificar sessão
        if (sessionUser) {
            const sessionEmail = sessionUser.email_usuario || sessionUser.email;
            const sessionName = sessionUser.nome_usuario || sessionUser.name;
            
            if (knownOldEmails.includes(sessionEmail) || knownOldNames.includes(sessionName)) {
                console.error('🚨 DADOS CORROMPIDOS DETECTADOS na sessão!');
                console.error(`Email: ${sessionEmail}, Nome: ${sessionName}`);
                foundCorruptedData = true;
                
                // LIMPEZA AGRESSIVA IMEDIATA
                this.emergencyDataCleanup();
            }
        }
        
        if (foundCorruptedData) {
            console.log('🔄 Dados corrompidos removidos. Usuário deve fazer login novamente.');
            // Opcional: redirecionar para login
            // window.location.href = 'login.html';
        }
    }

    // Limpeza de emergência de dados corrompidos
    emergencyDataCleanup() {
        console.log('🚨 LIMPEZA DE EMERGÊNCIA: Removendo dados corrompidos...');
        
        try {
            // Limpar AuthChecker
            if (window.authChecker) {
                window.authChecker.currentUser = null;
                console.log('🧹 AuthChecker limpo (emergência)');
            }
            
            // Limpar todas as sessões
            localStorage.removeItem('ridec_session');
            sessionStorage.removeItem('ridec_session');
            console.log('🧹 Sessões limpas (emergência)');
            
            // Limpar outros dados relacionados
            localStorage.removeItem('ridecs');
            localStorage.removeItem('notifications');
            console.log('🧹 Dados relacionados limpos (emergência)');
            
            // Forçar recarregamento da página para garantir limpeza completa
            console.log('🔄 Recarregando página para garantir limpeza completa...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro durante limpeza de emergência:', error);
        }
    }

    // Aguardar autenticação estar pronta e carregar áreas
    async waitForAuthenticationAndLoadAreas() {
        console.log('⏳ Aguardando autenticação estar pronta...');
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const currentUser = this.getCurrentUser();
            
            if (currentUser && currentUser.cod_empresa) {
                console.log('✅ Autenticação pronta, carregando áreas...');
                await this.loadAreasFromSupabase();
                return;
            }
            
            attempts++;
            console.log(`⏳ Tentativa ${attempts}/${maxAttempts} - Aguardando autenticação...`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('⚠️ Timeout aguardando autenticação. Tentando carregar áreas mesmo assim...');
        await this.loadAreasFromSupabase();
    }

    // Função de teste para verificar carregamento de áreas
    async testLoadAreas() {
        console.log('🧪 Iniciando teste de carregamento de áreas...');
        
        // Verificar autenticação
        const currentUser = this.getCurrentUser();
        console.log('👤 Usuário atual no teste:', currentUser);
        
        if (!currentUser) {
            console.log('❌ Teste falhou: Usuário não autenticado');
            return false;
        }
        
        // Verificar empresa
        const userEmpresa = currentUser.cod_empresa || currentUser.empresa;
        console.log('🏢 Empresa do usuário no teste:', userEmpresa);
        
        if (!userEmpresa) {
            console.log('❌ Teste falhou: Usuário não possui empresa');
            return false;
        }
        
        // Testar conexão Supabase
        if (!window.supabaseDB) {
            console.log('🔧 Aguardando Supabase estar pronto...');
            await this.waitForSupabase();
        }
        
        // Testar busca de áreas
        try {
            const areas = await window.supabaseDB.getAreasByEmpresa(userEmpresa);
            console.log('✅ Teste concluído. Áreas encontradas:', areas);
            return areas && areas.length > 0;
        } catch (error) {
            console.error('❌ Teste falhou com erro:', error);
            return false;
        }
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




    // Renderizar estado vazio
    renderEmptyState(customMessage = null) {
        const ridecList = document.getElementById('ridecList');
        const flowView = document.getElementById('flowView');
        const chartsView = document.getElementById('chartsView');
        
        if (ridecList) {
            const message = customMessage || 'Nenhum RIDEC encontrado';
            const description = customMessage ? 
                'Verifique se há RIDECs cadastrados para as áreas da sua empresa' : 
                'Clique em "Novo RIDEC" para criar seu primeiro processo';
            
            ridecList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <h3>${message}</h3>
                    <p>${description}</p>
                    ${!customMessage ? `
                    <button class="btn btn-primary" onclick="ridecSystem.openRidecModal()">
                        <i class="fas fa-plus"></i>
                        Criar RIDEC
                    </button>
                    ` : ''}
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




    // Abrir página de ocorrências de um RIDEC específico
    openRidecOccurrences(ridecId) {
        // Converter para número se for string, pois os IDs no banco são números
        const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
        window.location.href = `ridec-occurrences-detail.html?ridecId=${numericRidecId}`;
    }

    // Abrir modal de edição de modelo RIDEC
    async openEditModelModal(ridecId) {
        console.log('🔍 Abrindo modal de edição para modelo RIDEC:', ridecId);
        
        try {
            // Converter para número se for string, pois os IDs no banco são números
            const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
            
            // Validar se a conversão foi bem-sucedida
            if (isNaN(numericRidecId) || numericRidecId <= 0) {
                console.error('❌ ID inválido:', numericRidecId, 'original:', ridecId);
                alert('ID do modelo inválido');
                return;
            }
            
            // Verificar se Supabase está disponível
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.error('❌ Supabase não disponível para carregar dados do modelo');
                alert('Sistema de banco de dados não disponível. Tente novamente em alguns instantes.');
                return;
            }

            // Buscar dados do modelo
            const modelo = await this.getModeloById(numericRidecId);
            if (!modelo) {
                console.error('❌ Modelo não encontrado:', numericRidecId);
                alert('Modelo não encontrado no banco de dados');
                return;
            }

            // Buscar etapas do modelo
            const etapas = await this.getEtapasByModelo(numericRidecId);
            
            // Buscar ocorrências do modelo
            const ocorrencias = await this.getOccurrencesByModelo(numericRidecId);
            
            // Armazenar o ID do modelo atual para uso posterior
            this.currentModelId = numericRidecId;
            
            // Preencher dados do modal
            this.populateEditModelModal(modelo, etapas, ocorrencias);
            
            // Mostrar modal
            const modal = document.getElementById('editModelModal');
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Erro ao abrir modal de edição:', error);
            alert('Erro ao carregar dados do modelo: ' + error.message);
        }
    }

    // Buscar modelo por ID
    async getModeloById(ridecId) {
        try {
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.error('❌ Supabase não disponível');
                return null;
            }

            const { data, error } = await window.supabaseDB.supabase
                .from('modelo_ridec')
                .select(`
                    *,
                    area:cod_area(nome_area),
                    tipo_modelo:cod_tipo_modelo(nome_tipo_modelo)
                `)
                .eq('cod_modelo_ridec', ridecId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Erro ao buscar modelo:', error);
            return null;
        }
    }

    // Buscar etapas do modelo
    async getEtapasByModelo(modeloId) {
        try {
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.error('❌ Supabase não disponível');
                return [];
            }

            const { data, error } = await window.supabaseDB.supabase
                .from('modelo_etapa_ridec')
                .select(`
                    *,
                    tipo_etapa:cod_tipo_etapa(
                        nome_tipo_etapa
                    ),
                    uom:cod_uom(
                        desc_uom
                    )
                `)
                .eq('cod_modelo_ridec', modeloId);

            if (error) throw error;
            
            // Ordenar etapas pela sequência baseada em cod_m_etapa_anterior
            const etapas = data || [];
            return this.sortEtapasBySequence(etapas);
        } catch (error) {
            console.error('❌ Erro ao buscar etapas:', error);
            return [];
        }
    }

    // Ordenar etapas pela sequência baseada em cod_m_etapa_anterior
    sortEtapasBySequence(etapas) {
        if (!etapas || etapas.length === 0) return [];

        // Encontrar a etapa inicial (cod_m_etapa_anterior = 0)
        const etapasOrdenadas = [];
        const etapasProcessadas = new Set(); // Para evitar loops infinitos
        
        // Encontrar a primeira etapa (cod_m_etapa_anterior = 0)
        let etapaAtual = etapas.find(etapa => etapa.cod_m_etapa_anterior === 0);
        let contador = 0;
        const maxIteracoes = etapas.length * 2; // Proteção contra loop infinito
        
        console.log('🔍 Iniciando ordenação de etapas...');
        console.log('📋 Etapas disponíveis:', etapas.map(e => ({ 
            cod_modelo_etapa: e.cod_modelo_etapa, 
            cod_etapa: e.cod_etapa, 
            cod_m_etapa_anterior: e.cod_m_etapa_anterior 
        })));
        
        while (etapaAtual && contador < maxIteracoes) {
            // Verificar se já processamos esta etapa (evitar loops)
            if (etapasProcessadas.has(etapaAtual.cod_modelo_etapa)) {
                console.warn('⚠️ Loop detectado na sequência de etapas, interrompendo...');
                break;
            }
            
            console.log(`📍 Processando etapa ${contador + 1}:`, {
                cod_modelo_etapa: etapaAtual.cod_modelo_etapa,
                cod_etapa: etapaAtual.cod_etapa,
                cod_m_etapa_anterior: etapaAtual.cod_m_etapa_anterior
            });
            
            etapasOrdenadas.push(etapaAtual);
            etapasProcessadas.add(etapaAtual.cod_modelo_etapa);
            
            // Encontrar próxima etapa (onde cod_m_etapa_anterior = cod_modelo_etapa da atual)
            etapaAtual = etapas.find(etapa => 
                etapa.cod_m_etapa_anterior === etapaAtual.cod_modelo_etapa &&
                !etapasProcessadas.has(etapa.cod_modelo_etapa)
            );
            
            contador++;
        }

        // Se não conseguiu ordenar pela sequência, retornar as etapas padrão RIDEC
        if (etapasOrdenadas.length === 0) {
            console.log('📋 Usando ordenação padrão RIDEC');
            const etapasPadrao = ['RI', 'D', 'E', 'C'];
            return etapasPadrao.map(codEtapa => 
                etapas.find(etapa => etapa.cod_etapa === codEtapa)
            ).filter(Boolean);
        }

        console.log('✅ Etapas ordenadas:', etapasOrdenadas.map(e => ({
            cod_modelo_etapa: e.cod_modelo_etapa,
            cod_etapa: e.cod_etapa,
            sequencia: etapasOrdenadas.indexOf(e) + 1
        })));
        return etapasOrdenadas;
    }

    // Buscar ocorrências do modelo
    async getOccurrencesByModelo(modeloId) {
        try {
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.error('❌ Supabase não disponível');
                return [];
            }

            console.log('🔍 Buscando ocorrências para modelo ID:', modeloId);

            const { data, error } = await window.supabaseDB.supabase
                .from('card_ridec')
                .select(`
                    *,
                    modelo:cod_modelo_ridec(nome_modelo)
                `)
                .eq('cod_modelo_ridec', modeloId);

            if (error) {
                console.error('❌ Erro na consulta de ocorrências:', error);
                throw error;
            }

            console.log('📊 Ocorrências encontradas:', data?.length || 0);
            console.log('📋 Dados das ocorrências:', data);

            return data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar ocorrências:', error);
            return [];
        }
    }

    // Preencher modal de edição
    populateEditModelModal(modelo, etapas, ocorrencias) {
        // Preencher informações do modelo
        document.getElementById('editModelName').textContent = modelo.nome_modelo || '-';
        document.getElementById('editModelArea').textContent = modelo.area?.nome_area || '-';
        document.getElementById('editModelType').textContent = modelo.tipo_modelo?.nome_tipo_modelo || '-';
        document.getElementById('editModelUom').textContent = modelo.valor_uom || '-';
        document.getElementById('editModelNc').textContent = modelo.valor_nc ? `${modelo.valor_nc}%` : '-';
        document.getElementById('editModelDescription').textContent = modelo.descricao_modelo || '-';

        // Preencher etapas
        this.populateModelStages(etapas);

        // Preencher ocorrências
        this.populateModelOccurrences(ocorrencias);
    }

    // Preencher etapas do modelo
    populateModelStages(etapas) {
        const stagesContainer = document.getElementById('editModelStages');
        stagesContainer.innerHTML = '';

        if (!etapas || etapas.length === 0) {
            stagesContainer.innerHTML = '<div class="no-stages">Nenhuma etapa encontrada para este modelo</div>';
            return;
        }

        // Mapear códigos de etapa para ícones (mantido para compatibilidade visual)
        const stageIcons = {
            'RI': { icon: 'fa-play', class: 'ri-icon' },
            'D': { icon: 'fa-cogs', class: 'd-icon' },
            'E': { icon: 'fa-vial', class: 'e-icon' },
            'C': { icon: 'fa-check-double', class: 'c-icon' }
        };

        etapas.forEach((etapa, index) => {
            const stageCode = etapa.cod_etapa;
            const iconInfo = stageIcons[stageCode] || { 
                icon: 'fa-circle', 
                class: 'default-icon' 
            };
            
            // Usar nome_tipo_etapa da tabela tipo_etapa
            const stageTitle = etapa.tipo_etapa?.nome_tipo_etapa || etapa.nome_etapa || `Etapa ${index + 1}`;
            
            const stageCard = document.createElement('div');
            stageCard.className = 'stage-card';
            stageCard.innerHTML = `
                <div class="stage-header">
                    <div class="stage-icon ${iconInfo.class}">
                        <i class="fas ${iconInfo.icon}"></i>
                    </div>
                    <div class="stage-title">${stageTitle}</div>
                </div>
                <div class="stage-details">
                    <div class="stage-detail-item">
                        <div class="stage-detail-label">Descrição</div>
                        <div class="stage-detail-value">${etapa.desc_etapa_modelo || '-'}</div>
                    </div>
                    <div class="stage-detail-item">
                        <div class="stage-detail-label">Path Arquivo</div>
                        <div class="stage-detail-value">${etapa.path_arquivo || '-'}</div>
                    </div>
                    <div class="stage-detail-item">
                        <div class="stage-detail-label">Tempo Etapa</div>
                        <div class="stage-detail-value">${this.formatTempoEtapa(etapa.valor_uom, etapa.uom?.desc_uom)}</div>
                    </div>
                </div>
            `;
            
            stagesContainer.appendChild(stageCard);
        });
    }

    // Preencher ocorrências do modelo
    populateModelOccurrences(ocorrencias) {
        console.log('🔍 Processando ocorrências para exibição:', ocorrencias);
        
        // Filtrar por ies_concluiu: "N" = ativas, "S" = concluídas
        const activeOccurrences = ocorrencias.filter(o => o.ies_concluiu === 'N');
        const completedOccurrences = ocorrencias.filter(o => o.ies_concluiu === 'S');

        console.log('📊 Ocorrências ativas (ies_concluiu = "N"):', activeOccurrences.length);
        console.log('📊 Ocorrências concluídas (ies_concluiu = "S"):', completedOccurrences.length);
        console.log('📋 Valores de ies_concluiu encontrados:', [...new Set(ocorrencias.map(o => o.ies_concluiu))]);

        // Atualizar contadores
        document.getElementById('activeOccurrencesCount').textContent = activeOccurrences.length;
        document.getElementById('completedOccurrencesCount').textContent = completedOccurrences.length;

        // Preencher lista de ocorrências ativas
        this.populateOccurrencesList('activeOccurrencesList', activeOccurrences);

        // Preencher lista de ocorrências concluídas
        this.populateOccurrencesList('completedOccurrencesList', completedOccurrences);
    }

    // Preencher lista de ocorrências
    populateOccurrencesList(containerId, ocorrencias) {
        console.log(`🔍 Preenchendo lista ${containerId} com ${ocorrencias.length} ocorrências`);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container ${containerId} não encontrado`);
            return;
        }
        
        container.innerHTML = '';

        if (ocorrencias.length === 0) {
            container.innerHTML = '<div class="no-occurrences">Nenhuma ocorrência encontrada</div>';
            console.log(`📝 Exibindo mensagem "Nenhuma ocorrência encontrada" para ${containerId}`);
            return;
        }

        ocorrencias.forEach((ocorrencia, index) => {
            console.log(`📋 Processando ocorrência ${index + 1}:`, {
                titulo: ocorrencia.titulo_card,
                ies_concluiu: ocorrencia.ies_concluiu,
                id_externo: ocorrencia.id_externo,
                cod_card_ridec: ocorrencia.cod_card_ridec
            });
            
            // Determinar status baseado em ies_concluiu
            const isCompleted = ocorrencia.ies_concluiu === 'S';
            const statusClass = isCompleted ? 'completed' : 'active';
            const statusLabel = isCompleted ? 'Concluída' : 'Ativa';
            
            const item = document.createElement('div');
            item.className = 'occurrence-item';
            item.innerHTML = `
                <div class="occurrence-info">
                    <div class="occurrence-title">${ocorrencia.titulo_card || ocorrencia.modelo?.nome_modelo || 'Ocorrência sem título'}</div>
                    <div class="occurrence-meta">ID: ${ocorrencia.id_externo || ocorrencia.cod_card_ridec}</div>
                </div>
                <div class="occurrence-status ${statusClass}">${statusLabel}</div>
            `;
            container.appendChild(item);
        });
        
        console.log(`✅ Lista ${containerId} preenchida com ${ocorrencias.length} itens`);
    }

    // Obter ícone da etapa
    getStageIcon(stageCode) {
        const icons = {
            'RI': 'fa-play',
            'D': 'fa-cogs',
            'E': 'fa-vial',
            'C': 'fa-check-double'
        };
        return icons[stageCode] || 'fa-circle';
    }

    // Obter label do status
    getStatusLabel(status) {
        const labels = {
            'active': 'Ativa',
            'in_progress': 'Em Andamento',
            'completed': 'Concluída',
            'finished': 'Finalizada',
            'cancelled': 'Cancelada'
        };
        return labels[status] || status;
    }

    // Formatar tempo da etapa combinando valor e descrição UOM
    formatTempoEtapa(valorUom, descUom) {
        if (!valorUom && !descUom) {
            return '-';
        }
        
        if (valorUom && descUom) {
            return `${valorUom} ${descUom}`;
        }
        
        if (valorUom) {
            return valorUom.toString();
        }
        
        if (descUom) {
            return descUom;
        }
        
        return '-';
    }

    // Fechar modal de edição de modelo
    closeEditModelModal() {
        const modal = document.getElementById('editModelModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Salvar alterações do modelo
    async saveEditModel() {
        try {
            // Aqui você pode implementar a lógica para salvar as alterações
            // Por enquanto, apenas fechar o modal
            console.log('💾 Salvando alterações do modelo...');
            this.closeEditModelModal();
            this.showNotification('Alterações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro ao salvar alterações:', error);
            this.showNotification('Erro ao salvar alterações', 'error');
        }
    }

    // Criar ocorrência a partir do modelo atual
    async createOccurrenceFromModel() {
        console.log('🔍 Criando ocorrência a partir do modelo...');
        
        try {
            // Verificar se há um modelo selecionado
            if (!this.currentModelId) {
                console.error('❌ Nenhum modelo selecionado');
                this.showNotification('Erro: Nenhum modelo selecionado', 'error', false);
                return;
            }

            console.log('✅ Modelo selecionado:', this.currentModelId);
            
            // Fechar o modal de edição de modelo
            this.closeEditModelModal();
            
            // Abrir o modal de criação de ocorrência com os dados do modelo
            await this.openCreateOccurrenceModal(this.currentModelId);
            
            console.log('✅ Modal de criação de ocorrência aberto com dados do modelo');
            
        } catch (error) {
            console.error('❌ Erro ao criar ocorrência a partir do modelo:', error);
            this.showNotification('Erro ao criar ocorrência: ' + error.message, 'error', false);
        }
    }

    // Excluir modelo a partir do modal
    async deleteModelFromModal() {
        console.log('🔍 Excluindo modelo a partir do modal...');
        
        try {
            // Verificar se há um modelo selecionado
            if (!this.currentModelId) {
                console.error('❌ Nenhum modelo selecionado');
                this.showNotification('Erro: Nenhum modelo selecionado', 'error', false);
                return;
            }

            console.log('✅ Modelo selecionado para exclusão:', this.currentModelId);
            
            // Fechar o modal de edição de modelo
            this.closeEditModelModal();
            
            // Chamar a função de exclusão existente
            await this.deleteRidec(this.currentModelId);
            
            console.log('✅ Modelo excluído com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao excluir modelo a partir do modal:', error);
            this.showNotification('Erro ao excluir modelo: ' + error.message, 'error', false);
        }
    }

    // Alternar expander de ocorrências
    toggleOccurrencesExpander(type) {
        const header = document.getElementById(`${type}Header`);
        const content = document.getElementById(`${type}Content`);
        
        if (header && content) {
            const isActive = header.classList.contains('active');
            
            if (isActive) {
                header.classList.remove('active');
                content.classList.remove('active');
            } else {
                header.classList.add('active');
                content.classList.add('active');
            }
        }
    }

    // Abrir modal para criar ocorrência
    async openCreateOccurrenceModal(ridecId) {
        console.log('🔍 openCreateOccurrenceModal chamada com ID original:', ridecId, 'tipo:', typeof ridecId);
        
        // Validar se o ID é válido
        if (!ridecId || ridecId === 'undefined' || ridecId === 'null') {
            console.error('❌ ID inválido fornecido:', ridecId);
            this.showNotification('Erro: ID do modelo não encontrado', 'error', false);
            return;
        }
        
        // Converter para número se for string, pois os IDs no banco são números
        const numericRidecId = typeof ridecId === 'string' ? parseInt(ridecId, 10) : ridecId;
        
        // Validar se a conversão foi bem-sucedida
        if (isNaN(numericRidecId) || numericRidecId <= 0) {
            console.error('❌ ID inválido após conversão:', numericRidecId, 'original:', ridecId);
            this.showNotification('Erro: ID do modelo inválido', 'error', false);
            return;
        }
        
        console.log('🔍 ID validado e convertido:', numericRidecId);
        
        try {
            // Armazenar o ID do modelo selecionado
            this.selectedModelId = numericRidecId;

            // Buscar informações completas do modelo no banco de dados
            let modeloCompleto = null;
            
            if (window.supabaseDB && window.supabaseDB.isConnected()) {
                console.log('📡 Buscando dados do banco de dados...');
                modeloCompleto = await window.supabaseDB.getModeloRidecCompleto(numericRidecId);
            } else {
                console.log('⚠️ Supabase não disponível, usando dados locais...');
                // Fallback para dados locais
                const ridecIdStr = String(numericRidecId);
                const ridec = this.ridecs.find(r => String(r.id) === ridecIdStr);
                
                if (!ridec) {
                    console.error('❌ RIDEC não encontrado:', numericRidecId);
                    this.showNotification('RIDEC não encontrado', 'error', false);
                    return;
                }
                
                modeloCompleto = {
                    modelo: {
                        cod_modelo_ridec: ridec.id,
                        nome_modelo: ridec.title,
                        descricao_modelo: ridec.description,
                        cod_empresa: 1,
                        area: { nome_area: ridec.area }
                    },
                    etapas: {
                        ri: ridec.descriptionRI ? { nome_etapa_ri: ridec.descriptionRI, valor_uom: ridec.deadlineRI, uom: { sigla_uom: ridec.unitRI || 'horas' } } : null,
                        d: ridec.descriptionD ? { nome_etapa_d: ridec.descriptionD, valor_uom: ridec.deadlineD, uom: { sigla_uom: ridec.unitD || 'horas' } } : null,
                        e: ridec.descriptionE ? { nome_etapa_e: ridec.descriptionE, valor_uom: ridec.deadlineE, uom: { sigla_uom: ridec.unitE || 'horas' } } : null,
                        c: ridec.descriptionC ? { nome_etapa_c: ridec.descriptionC, valor_uom: ridec.deadlineC, uom: { sigla_uom: ridec.unitC || 'horas' } } : null
                    }
                };
            }

            if (!modeloCompleto) {
                console.error('❌ Modelo não encontrado no banco de dados');
                this.showNotification('Modelo não encontrado', 'error', false);
                return;
            }

            console.log('✅ Modelo completo encontrado:', modeloCompleto);

        // Verificar se os elementos existem
        const titleElement = document.getElementById('selectedModelTitle');
        const areaElement = document.getElementById('selectedModelArea');
        const descriptionElement = document.getElementById('selectedModelDescription');
        const externalIdElement = document.getElementById('externalId');
        const modalElement = document.getElementById('createOccurrenceModal');

        // Elementos das etapas
        const stageRIDescription = document.getElementById('stageRIDescription');
        const stageRITime = document.getElementById('stageRITime');
        const stageDDescription = document.getElementById('stageDDescription');
        const stageDTime = document.getElementById('stageDTime');
        const stageEDescription = document.getElementById('stageEDescription');
        const stageETime = document.getElementById('stageETime');
        const stageCDescription = document.getElementById('stageCDescription');
        const stageCTime = document.getElementById('stageCTime');

        if (!titleElement) {
            console.error('❌ Elemento selectedModelTitle não encontrado');
            return;
        }
        if (!areaElement) {
            console.error('❌ Elemento selectedModelArea não encontrado');
            return;
        }
        if (!descriptionElement) {
            console.error('❌ Elemento selectedModelDescription não encontrado');
            return;
        }
        if (!externalIdElement) {
            console.error('❌ Elemento externalId não encontrado');
            return;
        }
        if (!modalElement) {
            console.error('❌ Elemento createOccurrenceModal não encontrado');
            return;
        }

            // Preencher informações básicas do modelo no modal
            titleElement.textContent = modeloCompleto.modelo.nome_modelo;
            areaElement.textContent = modeloCompleto.modelo.area?.nome_area || 'Sem Área';
            descriptionElement.textContent = modeloCompleto.modelo.descricao_modelo || 'Sem descrição';

            // Função auxiliar para formatar tempo
            const formatStageTime = (valorUom, uom) => {
                if (!valorUom) return 'Não configurado';
                const unitLabel = uom?.desc_uom || 'horas';
                return `${valorUom} ${unitLabel}`;
            };

            // Preencher informações das etapas
            console.log('📊 Dados das etapas para exibição:', modeloCompleto.etapas);
            console.log('📊 Detalhes das etapas:');
            Object.keys(modeloCompleto.etapas).forEach(tipo => {
                const etapa = modeloCompleto.etapas[tipo];
                if (etapa) {
                    console.log(`  ${tipo.toUpperCase()}:`, {
                        nome: etapa[`nome_etapa_${tipo}`],
                        valor_uom: etapa.valor_uom,
                        uom: etapa.uom?.desc_uom,
                        cod_tipo_etapa: etapa.cod_tipo_etapa
                    });
                } else {
                    console.log(`  ${tipo.toUpperCase()}: null`);
                }
            });
            
            if (stageRIDescription) {
                stageRIDescription.textContent = modeloCompleto.etapas.ri?.nome_etapa_ri || 'Etapa não configurada';
            }
            if (stageRITime) {
                const tempoRI = formatStageTime(modeloCompleto.etapas.ri?.valor_uom, modeloCompleto.etapas.ri?.uom);
                stageRITime.textContent = tempoRI;
                console.log('⏰ Tempo RI formatado:', tempoRI, 'UOM:', modeloCompleto.etapas.ri?.uom);
            }
            
            if (stageDDescription) {
                stageDDescription.textContent = modeloCompleto.etapas.d?.nome_etapa_d || 'Etapa não configurada';
            }
            if (stageDTime) {
                const tempoD = formatStageTime(modeloCompleto.etapas.d?.valor_uom, modeloCompleto.etapas.d?.uom);
                stageDTime.textContent = tempoD;
                console.log('⏰ Tempo D formatado:', tempoD, 'UOM:', modeloCompleto.etapas.d?.uom);
            }
            
            if (stageEDescription) {
                stageEDescription.textContent = modeloCompleto.etapas.e?.nome_etapa_e || 'Etapa não configurada';
            }
            if (stageETime) {
                const tempoE = formatStageTime(modeloCompleto.etapas.e?.valor_uom, modeloCompleto.etapas.e?.uom);
                stageETime.textContent = tempoE;
                console.log('⏰ Tempo E formatado:', tempoE, 'UOM:', modeloCompleto.etapas.e?.uom);
            }
            
            if (stageCDescription) {
                stageCDescription.textContent = modeloCompleto.etapas.c?.nome_etapa_c || 'Etapa não configurada';
            }
            if (stageCTime) {
                const tempoC = formatStageTime(modeloCompleto.etapas.c?.valor_uom, modeloCompleto.etapas.c?.uom);
                stageCTime.textContent = tempoC;
                console.log('⏰ Tempo C formatado:', tempoC, 'UOM:', modeloCompleto.etapas.c?.uom);
            }

            // Limpar campo de ID externo
            externalIdElement.value = '';

            // Mostrar modal
            modalElement.classList.add('show');
            
            // Garantir que o expander esteja fechado por padrão
            this.closeModelInfoExpander();
            
            // Carregar etapas do modelo dinamicamente
            try {
                const stages = await this.loadModelStages(numericRidecId);
                if (stages && stages.length > 0) {
                    this.updateStagesInfoHTML(stages);
                    console.log('✅ Etapas do modelo carregadas dinamicamente');
                } else {
                    console.log('⚠️ Nenhuma etapa encontrada para o modelo');
                    // Limpar etapas existentes se não houver etapas
                    this.updateStagesInfoHTML([]);
                }
            } catch (error) {
                console.error('❌ Erro ao carregar etapas do modelo:', error);
                this.updateStagesInfoHTML([]);
            }
            
            console.log('✅ Modal exibido com sucesso');

        } catch (error) {
            console.error('❌ Erro ao abrir modal de criação de ocorrência:', error);
            this.showNotification('Erro ao carregar informações do modelo', 'error', false);
        }
    }

    // Função de teste para debug das UOM
    async testarUOMs() {
        if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
            console.log('⚠️ Supabase não disponível para teste');
            return;
        }

        console.log('🧪 Iniciando teste de UOMs...');
        
        // Testar estrutura da tabela UOM primeiro
        console.log('🔍 Testando estrutura da tabela UOM...');
        await window.supabaseDB.testarEstruturaUOM();
        
        // Testar tabelas
        const tabelasExistem = await window.supabaseDB.testarTabelasEtapas();
        console.log('📊 Status das tabelas:', tabelasExistem);
        
        // Testar UOMs específicas
        const codigosUOM = [1, 2, 3, 4, 5]; // Códigos comuns de UOM
        for (const codUom of codigosUOM) {
            await window.supabaseDB.testarUOM(codUom);
        }
        
        console.log('✅ Teste de UOMs concluído');
    }

    // Fechar modal de criação de ocorrência
    closeCreateOccurrenceModal() {
        const modalElement = document.getElementById('createOccurrenceModal');
        if (modalElement) {
            modalElement.classList.remove('show');
        }
        this.selectedModelId = null;
        
        // Fechar o expander quando o modal for fechado
        this.closeModelInfoExpander();
        
        console.log('✅ Modal fechado');
    }

    // Controlar o expander de informações do modelo
    toggleModelInfoExpander() {
        const expanderContainer = document.querySelector('#createOccurrenceModal .expander-container');
        if (!expanderContainer) {
            console.error('❌ Container do expander não encontrado');
            return;
        }

        const isExpanded = expanderContainer.classList.contains('expanded');
        
        if (isExpanded) {
            this.closeModelInfoExpander();
        } else {
            this.openModelInfoExpander();
        }
    }

    // Abrir o expander de informações do modelo
    openModelInfoExpander() {
        const expanderContainer = document.querySelector('#createOccurrenceModal .expander-container');
        if (expanderContainer) {
            expanderContainer.classList.add('expanded');
            console.log('✅ Expander de informações do modelo aberto');
        }
    }

    // Fechar o expander de informações do modelo
    closeModelInfoExpander() {
        const expanderContainer = document.querySelector('#createOccurrenceModal .expander-container');
        if (expanderContainer) {
            expanderContainer.classList.remove('expanded');
            console.log('✅ Expander de informações do modelo fechado');
        }
    }

    // Carregar etapas do modelo dinamicamente
    async loadModelStages(modelId) {
        try {
            console.log('🔍 Carregando etapas do modelo:', modelId);
            
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.error('❌ Supabase não disponível');
                return [];
            }

            // Consulta para obter as etapas do modelo em sequência
            const { data: stages, error } = await window.supabaseDB.supabase
                .from('modelo_etapa_ridec')
                .select(`
                    cod_modelo_etapa,
                    cod_tipo_etapa,
                    desc_etapa_modelo,
                    valor_uom,
                    path_arquivo,
                    cod_m_etapa_anterior,
                    uom:cod_uom (
                        desc_uom
                    ),
                    tipo_etapa:cod_tipo_etapa (
                        nome_tipo_etapa
                    )
                `)
                .eq('cod_modelo_ridec', modelId)
                .order('cod_tipo_etapa');

            if (error) {
                console.error('❌ Erro ao carregar etapas:', error);
                return [];
            }

            if (!stages || stages.length === 0) {
                console.log('⚠️ Nenhuma etapa encontrada para o modelo:', modelId);
                return [];
            }

            // Ordenar etapas sequencialmente baseado na lógica de cod_m_etapa_anterior
            const orderedStages = this.orderStagesSequentially(stages);
            
            console.log('✅ Etapas carregadas:', orderedStages);
            return orderedStages;

        } catch (error) {
            console.error('❌ Erro ao carregar etapas do modelo:', error);
            return [];
        }
    }

    // Ordenar etapas sequencialmente baseado na lógica de cod_m_etapa_anterior
    orderStagesSequentially(stages) {
        const orderedStages = [];
        const stageMap = new Map();
        
        // Criar mapa das etapas
        stages.forEach(stage => {
            stageMap.set(stage.cod_modelo_etapa, stage);
        });

        // Encontrar a primeira etapa (cod_m_etapa_anterior = 0)
        const firstStage = stages.find(stage => stage.cod_m_etapa_anterior === 0);
        if (!firstStage) {
            console.warn('⚠️ Nenhuma etapa inicial encontrada (cod_m_etapa_anterior = 0)');
            return stages; // Retornar como estão se não encontrar a primeira
        }

        // Construir sequência
        let currentStage = firstStage;
        while (currentStage) {
            orderedStages.push(currentStage);
            
            // Procurar próxima etapa (onde cod_m_etapa_anterior = cod_modelo_etapa da atual)
            const nextStage = stages.find(stage => 
                stage.cod_m_etapa_anterior === currentStage.cod_modelo_etapa
            );
            
            currentStage = nextStage;
        }

        console.log('✅ Etapas ordenadas sequencialmente:', orderedStages.map(s => s.tipo_etapa?.nome_tipo_etapa || `Etapa ${s.cod_tipo_etapa}`));
        return orderedStages;
    }

    // Atualizar HTML com as etapas carregadas
    updateStagesInfoHTML(stages) {
        const stagesContainer = document.getElementById('stages-info-section');
        if (!stagesContainer) {
            console.error('❌ Container de etapas não encontrado');
            return;
        }

        // Limpar etapas existentes (manter apenas o título)
        const titleElement = stagesContainer.querySelector('.stages-info-title');
        stagesContainer.innerHTML = '';
        if (titleElement) {
            stagesContainer.appendChild(titleElement);
        }

        // Adicionar cada etapa dinamicamente
        stages.forEach((stage, index) => {
            const stageCard = this.createStageCard(stage, index);
            stagesContainer.appendChild(stageCard);
        });

        console.log('✅ HTML das etapas atualizado com', stages.length, 'etapas');
    }

    // Criar card HTML para uma etapa
    createStageCard(stage, index) {
        const stageCard = document.createElement('div');
        stageCard.className = 'stage-info-card';
        stageCard.setAttribute('data-stage', `ETAPA_${stage.cod_tipo_etapa}`);

        const stageIcon = this.getStageIcon(stage.cod_tipo_etapa);
        const stageTitle = stage.tipo_etapa?.nome_tipo_etapa || `Etapa ${stage.cod_tipo_etapa}`;
        const stageDescription = stage.desc_etapa_modelo || 'Sem descrição';
        const stageTime = this.formatStageTime(stage.valor_uom, stage.uom);
        const stagePath = stage.path_arquivo || '';

        stageCard.innerHTML = `
            <div class="stage-header">
                <div class="stage-icon ${this.getStageIconClass(stage.cod_tipo_etapa)}">
                    <i class="${stageIcon}"></i>
                </div>
                <div class="stage-title">${stageTitle}</div>
            </div>
            <div class="stage-details">
                <div class="stage-description">
                    <span class="stage-desc-label">Descrição:</span>
                    <span class="stage-desc-value">${stageDescription}</span>
                </div>
                <div class="stage-time">
                    <span class="stage-time-label">Tempo:</span>
                    <span class="stage-time-value">${stageTime}</span>
                </div>
                ${stagePath ? `
                <div class="stage-path">
                    <span class="stage-path-label">Arquivo:</span>
                    <span class="stage-path-value">${stagePath}</span>
                </div>
                ` : ''}
            </div>
        `;

        return stageCard;
    }

    // Obter ícone da etapa baseado no tipo
    getStageIcon(stageType) {
        const iconMap = {
            'RI': 'fas fa-play',
            'D': 'fas fa-cogs',
            'E': 'fas fa-vial',
            'C': 'fas fa-check-double',
            'A': 'fas fa-puzzle-piece',
            1: 'fas fa-play',
            2: 'fas fa-cogs',
            3: 'fas fa-vial',
            4: 'fas fa-check-double',
            5: 'fas fa-puzzle-piece',
            6: 'fas fa-cog'
        };
        return iconMap[stageType] || 'fas fa-circle';
    }

    // Obter classe CSS do ícone da etapa
    getStageIconClass(stageType) {
        const classMap = {
            'RI': 'ri-icon',
            'D': 'd-icon',
            'E': 'e-icon',
            'C': 'c-icon',
            'A': 'a-icon',
            1: 'ri-icon',
            2: 'd-icon',
            3: 'e-icon',
            4: 'c-icon',
            5: 'a-icon',
            6: 'custom-icon'
        };
        return classMap[stageType] || 'default-icon';
    }

    // Formatar tempo da etapa
    formatStageTime(value, uom) {
        if (!value || !uom) return 'Não definido';
        
        const formattedValue = Math.round(parseFloat(value));
        const unit = uom.desc_uom || 'unidade';
        
        return `${formattedValue} ${unit}`;
    }

    // Obter usuário atual
    getCurrentUser() {
        try {
            // Tentar obter do AuthChecker primeiro
            if (window.authChecker && window.authChecker.getCurrentUser) {
                const user = window.authChecker.getCurrentUser();
                if (user) {
                    console.log('✅ Usuário obtido do AuthChecker:', user);
                    return user;
                }
            }
            
            // Fallback: tentar obter da sessão
            const sessionData = this.getSessionDataDirectly();
            if (sessionData && sessionData.user) {
                console.log('✅ Usuário obtido da sessão:', sessionData.user);
                return sessionData.user;
            }
            
            console.log('❌ Nenhum usuário encontrado');
            return null;
        } catch (error) {
            console.error('❌ Erro ao obter usuário atual:', error);
            return null;
        }
    }

    // Carregar modelos RIDEC do Supabase
    async loadModelosRidecFromSupabase() {
        try {
            console.log('🔄 Carregando modelos RIDEC do Supabase...');
            
            // Conectar ao Supabase
            const supabase = connectToSupabase();
            if (!supabase) {
                console.log('❌ Erro de conexão com Supabase');
                return false;
            }

            // Buscar modelos RIDEC (query mínima) - apenas ativos
            console.log('📡 Executando query no Supabase...');
            const { data: modelos, error } = await supabase
                .from('modelo_ridec')
                .select('*')
                .eq('ies_ativo', 'S') // Apenas modelos ativos
                .order('nome_modelo');
            
            console.log('📊 Resultado da query:', { data: modelos, error });

            if (error) {
                console.error('❌ Erro ao buscar modelos RIDEC:', error);
                return false;
            }

            console.log('✅ Modelos RIDEC carregados do Supabase:', modelos);
            console.log('📋 IDs dos modelos carregados:', modelos.map(m => m.cod_modelo_ridec || m.id));

            // Converter para formato da aplicação
            const modelosConvertidos = modelos.map(modelo => ({
                id: modelo.cod_modelo_ridec || modelo.id,
                title: modelo.nome_modelo || modelo.title || 'Modelo sem nome',
                description: modelo.descricao_modelo || modelo.description || '',
                area: modelo.cod_area || modelo.area || 'Sem Área',
                priority: 'média', // Valor padrão
                maxTime: 24, // Valor padrão
                timeUnit: 'hours',
                responsible: modelo.responsavel || modelo.responsible || 'Não definido',
                createdAt: modelo.created_at || new Date().toISOString(),
                updatedAt: modelo.updated_at || new Date().toISOString(),
                isOccurrence: false // Modelos não são ocorrências
            }));

            // Adicionar aos RIDECs existentes (sem duplicar)
            const existingIds = this.ridecs.map(r => r.id);
            const newModelos = modelosConvertidos.filter(m => !existingIds.includes(m.id));
            
            this.ridecs.push(...newModelos);
            console.log(`✅ ${newModelos.length} novos modelos RIDEC adicionados`);
            console.log('📋 Todos os IDs de RIDECs disponíveis:', this.ridecs.map(r => r.id));

            // Salvar no localStorage
            this.saveToLocalStorage();
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao carregar modelos RIDEC:', error);
            return false;
        }
    }

    // Criar ocorrência
    async createOccurrence() {
        console.log('🚀 createOccurrence iniciada');
        
        const externalId = document.getElementById('externalId').value.trim();
        console.log('📝 ID externo:', externalId);
        
        if (!externalId) {
            console.log('❌ ID externo vazio');
            this.showNotification('Por favor, digite o ID externo', 'error', false);
            return;
        }

        if (!this.selectedModelId) {
            console.log('❌ Modelo RIDEC não selecionado');
            this.showNotification('Modelo RIDEC não selecionado', 'error', false);
            return;
        }

        console.log('✅ Validações básicas passaram');

        try {
            // Obter dados do usuário atual
            console.log('👤 Obtendo dados do usuário...');
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                console.log('❌ Usuário não encontrado');
                this.showNotification('Usuário não autenticado', 'error', false);
                return;
            }
            console.log('✅ Usuário obtido:', currentUser);

            // Verificar se o usuário tem as propriedades necessárias
            if (!currentUser.cod_empresa || !currentUser.cod_usuario) {
                console.log('❌ Usuário não possui cod_empresa ou cod_usuario');
                console.log('cod_empresa:', currentUser.cod_empresa);
                console.log('cod_usuario:', currentUser.cod_usuario);
                this.showNotification('Dados do usuário incompletos. Faça login novamente.', 'error', false);
                return;
            }
            console.log('✅ Usuário tem todas as propriedades necessárias');

            // Verificar se o Supabase está disponível
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.log('❌ Supabase não disponível');
                this.showNotification('Erro de conexão com o banco de dados', 'error', false);
                return;
            }

            // Obter data e hora atual
            const now = new Date();
            const dataInicio = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const horaInicio = now.toTimeString().split(' ')[0]; // HH:MM:SS
            const usuarioCriacao = currentUser.nome_usuario || currentUser.email_usuario || 'Usuário';
            
            console.log('📅 Data e hora:', dataInicio, horaInicio);
            console.log('👤 Usuário de criação:', usuarioCriacao);

            // PASSO 1: Criar linha na tabela card_ridec
            console.log('📝 PASSO 1: Criando linha na tabela card_ridec...');
            const cardRidecData = {
                cod_modelo_ridec: this.selectedModelId,
                cod_empresa: currentUser.cod_empresa,
                id_externo: externalId,
                cod_usuario: currentUser.cod_usuario,
                data_criacao: dataInicio,
                usuario_criacao: usuarioCriacao
            };
            console.log('📋 Dados para card_ridec:', cardRidecData);

            const { data: cardRidecResult, error: cardRidecError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .insert(cardRidecData)
                .select('cod_card_ridec')
                .single();

            if (cardRidecError) {
                console.error('❌ Erro ao criar card_ridec:', cardRidecError);
                this.showNotification('Erro ao criar card RIDEC: ' + cardRidecError.message, 'error', false);
                return;
            }
            console.log('✅ Card RIDEC criado:', cardRidecResult);

            // Obter o valor de cod_card_ridec da linha criada
            const codCardRidec = cardRidecResult.cod_card_ridec;
            console.log('🔑 Código do card RIDEC obtido:', codCardRidec);

            // PASSO 2: Buscar o tipo de modelo do modelo_ridec
            console.log('🔍 PASSO 2: Buscando tipo de modelo...');
            const { data: modeloData, error: modeloError } = await window.supabaseDB.getClient()
                .from('modelo_ridec')
                .select('cod_tipo_modelo')
                .eq('cod_modelo_ridec', this.selectedModelId)
                .single();

            if (modeloError) {
                console.error('❌ Erro ao buscar tipo de modelo:', modeloError);
                this.showNotification('Erro ao buscar informações do modelo: ' + modeloError.message, 'error', false);
                return;
            }
            console.log('✅ Tipo de modelo encontrado:', modeloData);

            const codTipoModelo = modeloData.cod_tipo_modelo;
            console.log('📊 Código do tipo de modelo:', codTipoModelo);

            // PASSO 3: Inserir linha na tabela etapa_ridec baseada no tipo de modelo
            console.log('📝 PASSO 3: Criando linha na tabela etapa_ridec...');
            
            let etapaRidecData = {
                cod_card_ridec: codCardRidec,
                cod_etapa_anterior: 0,
                data_inicio: dataInicio,
                hora_inicio: horaInicio
            };

            if (codTipoModelo === 1) {
                // Se cod_tipo_modelo for igual a 1, inserir com cod_tipo_etapa = 1
                console.log('📊 Tipo de modelo 1 (Detalhado): inserindo cod_tipo_etapa = 1');
                etapaRidecData.cod_tipo_etapa = 1;
            } else if (codTipoModelo === 2) {
                // Se cod_tipo_modelo for igual a 2, inserir com cod_tipo_etapa = 6
                console.log('📊 Tipo de modelo 2 (Simples): inserindo cod_tipo_etapa = 6');
                etapaRidecData.cod_tipo_etapa = 6;
            } else {
                console.error('❌ Tipo de modelo desconhecido:', codTipoModelo);
                this.showNotification('Tipo de modelo não reconhecido: ' + codTipoModelo, 'error', false);
                return;
            }

            console.log('📋 Dados para etapa_ridec:', etapaRidecData);

            // Inserir linha na tabela etapa_ridec
            console.log('📝 Inserindo dados na tabela etapa_ridec...');
            const { data: etapaRidecResult, error: etapaRidecError } = await window.supabaseDB.getClient()
                .from('etapa_ridec')
                .insert(etapaRidecData)
                .select()
                .single();

            if (etapaRidecError) {
                console.error('❌ Erro ao criar etapa_ridec:', etapaRidecError);
                console.error('📋 Detalhes completos do erro:', {
                    message: etapaRidecError.message,
                    details: etapaRidecError.details,
                    hint: etapaRidecError.hint,
                    code: etapaRidecError.code,
                    status: etapaRidecError.status,
                    statusText: etapaRidecError.statusText
                });
                
                if (etapaRidecError.status === 400) {
                    console.log('💡 Erro 400: Problema com os dados enviados ou estrutura da tabela etapa_ridec');
                    this.showNotification('Erro 400: Problema com os dados da tabela etapa_ridec. Verifique a estrutura.', 'error', false);
                } else if (etapaRidecError.status === 401) {
                    console.log('💡 Erro 401: Problema de autenticação/autorização');
                    this.showNotification('Erro de autenticação. Verifique se você tem permissão para criar etapas.', 'error', false);
                } else if (etapaRidecError.status === 403) {
                    console.log('💡 Erro 403: Problema de permissão RLS');
                    this.showNotification('Erro de permissão. Verifique as políticas RLS da tabela etapa_ridec.', 'error', false);
                } else {
                    this.showNotification('Erro ao criar etapa RIDEC: ' + etapaRidecError.message, 'error', false);
                }
                return;
            }
            console.log('✅ Etapa RIDEC criada:', etapaRidecResult);

            // Sucesso
            console.log('🎉 Ocorrência criada com sucesso!');
            console.log('📋 Resumo da criação:');
            console.log('  - Card RIDEC:', codCardRidec);
            console.log('  - Tipo de modelo:', codTipoModelo);
            console.log('  - Tipo de etapa:', etapaRidecData.cod_tipo_etapa);
            console.log('  - Etapa iniciada:', codTipoModelo === 1 ? 'RI (Detalhado)' : 'Etapa Simples');
            console.log('  - Data de início:', dataInicio);
            console.log('  - Hora de início:', horaInicio);
            console.log('  - Etapa RIDEC ID:', etapaRidecResult.cod_etapa_ridec || 'N/A');
            
            this.showNotification('Ocorrência criada com sucesso!', 'success', false);
            this.closeCreateOccurrenceModal();

        } catch (error) {
            console.error('❌ Erro ao criar ocorrência:', error);
            this.showNotification('Erro inesperado: ' + error.message, 'error', false);
        }
    }

}

// Inicializar sistema quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema RIDEC...');
    
    // Aguardar um pouco para garantir que auth-check.js foi carregado
    setTimeout(() => {
const ridecSystem = new RIDECSystem();

// Exportar para uso global
window.ridecSystem = ridecSystem; 
        
        console.log('✅ Sistema RIDEC inicializado');
    }, 100);
});

// Fallback: inicializar imediatamente se DOM já estiver pronto
if (document.readyState === 'loading') {
    // DOM ainda carregando, aguardar evento DOMContentLoaded
} else {
    // DOM já carregado, inicializar imediatamente
    console.log('🚀 DOM já carregado, inicializando sistema RIDEC...');
    
    setTimeout(() => {
        const ridecSystem = new RIDECSystem();
        window.ridecSystem = ridecSystem;
        console.log('✅ Sistema RIDEC inicializado (fallback)');
    }, 100);
}

// Função de teste para o modal
function testModal() {
    console.log('🧪 Testando modal...');
    const modal = document.getElementById('createOccurrenceModal');
    if (modal) {
        console.log('✅ Modal encontrado');
        modal.classList.add('show');
        console.log('✅ Modal exibido');
    } else {
        console.error('❌ Modal não encontrado');
    }
} 
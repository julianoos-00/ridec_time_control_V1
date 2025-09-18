class RIDECTypeDetails {
    constructor() {
        this.ridecType = null;
        this.ridecs = [];
        this.modelRidec = null; // RIDEC modelo
        this.init();
    }

    init() {
        try {
            console.log('Iniciando RIDECTypeDetails...');
            this.loadRidecType();
            this.loadRidecs();
            this.loadModelRidec();
            this.renderPage();
            this.startTimer();
            this.initializeEventListeners();
            console.log('RIDECTypeDetails inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar RIDECTypeDetails:', error);
        }
    }

    initializeEventListeners() {
        try {
            const createOccurrenceBtn = document.getElementById('createOccurrenceBtn');
            if (createOccurrenceBtn) {
                createOccurrenceBtn.addEventListener('click', () => {
                    this.createNewOccurrence();
                });
            } else {
                console.error('Botão createOccurrenceBtn não encontrado');
            }

            // Event listeners para configuração do modelo
            const editConfigBtn = document.getElementById('editConfigBtn');
            if (editConfigBtn) {
                editConfigBtn.addEventListener('click', () => {
                    this.editModel();
                });
            } else {
                console.error('Botão editConfigBtn não encontrado');
            }

            const addStageABtn = document.getElementById('addStageABtn');
            if (addStageABtn) {
                addStageABtn.addEventListener('click', () => {
                    this.addStageA();
                });
            } else {
                console.error('Botão addStageABtn não encontrado');
            }

            const saveConfigBtn = document.getElementById('saveConfigBtn');
            if (saveConfigBtn) {
                saveConfigBtn.addEventListener('click', () => {
                    this.saveModelConfig();
                });
            } else {
                console.error('Botão saveConfigBtn não encontrado');
            }

            const resetConfigBtn = document.getElementById('resetConfigBtn');
            if (resetConfigBtn) {
                resetConfigBtn.addEventListener('click', () => {
                    this.resetModelConfig();
                });
            } else {
                console.error('Botão resetConfigBtn não encontrado');
            }

            // Event listeners para integrações
            const testIntegrationsBtn = document.getElementById('testIntegrationsBtn');
            if (testIntegrationsBtn) {
                testIntegrationsBtn.addEventListener('click', () => {
                    this.testIntegrations();
                });
            } else {
                console.error('Botão testIntegrationsBtn não encontrado');
            }

            const saveIntegrationsBtn = document.getElementById('saveIntegrationsBtn');
            if (saveIntegrationsBtn) {
                saveIntegrationsBtn.addEventListener('click', () => {
                    this.saveIntegrations();
                });
            } else {
                console.error('Botão saveIntegrationsBtn não encontrado');
            }

            // Event listeners para checkboxes de integração
            document.addEventListener('change', (e) => {
                if (e.target.matches('.integration-checkbox input[type="checkbox"]')) {
                    this.updateIntegrationCheckbox(e.target);
                }
            });

            // Event listeners para seletor de modo
            const simpleModeRadio = document.getElementById('simpleModeRadio');
            const detailedModeRadio = document.getElementById('detailedModeRadio');
            
            if (simpleModeRadio) {
                simpleModeRadio.addEventListener('change', () => {
                    this.changeTimeControlMode('simple');
                });
            }
            
            if (detailedModeRadio) {
                detailedModeRadio.addEventListener('change', () => {
                    this.changeTimeControlMode('detailed');
                });
            }

            // Botão de teste para premiação (temporário)
            const testAwardBtn = document.getElementById('testAwardBtn');
            if (testAwardBtn) {
                testAwardBtn.addEventListener('click', () => {
                    this.showAwardNotification();
                    this.createConfetti();
                });
            }

            console.log('Event listeners inicializados com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar event listeners:', error);
        }
    }

    loadRidecType() {
        this.ridecType = sessionStorage.getItem('selectedRidecType');
        if (!this.ridecType) {
            // Se não há tipo selecionado, redirecionar para a página principal
            window.location.href = 'index.html';
            return;
        }
    }

    loadRidecs() {
        const savedRidecs = localStorage.getItem('ridecs');
        if (savedRidecs) {
            const allRidecs = JSON.parse(savedRidecs);
            // Filtrar apenas ocorrências do tipo selecionado
            this.ridecs = allRidecs.filter(ridec => ridec.title === this.ridecType && ridec.isOccurrence);
        } else {
            this.ridecs = [];
        }
    }

    loadModelRidec() {
        const savedRidecs = localStorage.getItem('ridecs');
        if (savedRidecs) {
            const allRidecs = JSON.parse(savedRidecs);
            // Encontrar o RIDEC modelo (não ocorrência) do tipo selecionado
            this.modelRidec = allRidecs.find(ridec => ridec.title === this.ridecType && !ridec.isOccurrence);
        }
    }

    renderPage() {
        try {
            this.updateHeader();
            this.updateModelConfig();
            this.updateStats();
            this.renderRidecList();
            this.updateAreaAward(); // Adicionar verificação da premiação
        } catch (error) {
            console.error('Erro ao renderizar página:', error);
        }
    }

    updateHeader() {
        try {
            const titleElement = document.getElementById('ridecTypeTitle');
            if (titleElement) {
                titleElement.textContent = this.ridecType;
            } else {
                console.error('Elemento ridecTypeTitle não encontrado');
            }
        } catch (error) {
            console.error('Erro ao atualizar header:', error);
        }
    }

    updateModelConfig() {
        try {
            if (!this.modelRidec) {
                // Se não há modelo, ocultar a seção de configuração
                const configSection = document.querySelector('.model-config-section');
                if (configSection) {
                    configSection.style.display = 'none';
                }
                return;
            }

            // Mostrar a seção de configuração
            const configSection = document.querySelector('.model-config-section');
            if (configSection) {
                configSection.style.display = 'block';
            }

            // Atualizar informações do modelo
            const modelTitle = document.getElementById('modelTitle');
            const modelDescription = document.getElementById('modelDescription');
            const modelMaxTime = document.getElementById('modelMaxTime');
            const modelArea = document.getElementById('modelArea');

            if (modelTitle) modelTitle.textContent = this.modelRidec.title;
            if (modelDescription) modelDescription.textContent = this.modelRidec.description || 'Sem descrição';
            
            const timeUnit = this.modelRidec.timeUnit || 'hours';
            const unitLabel = this.getTimeUnitLabel(timeUnit);
            if (modelMaxTime) modelMaxTime.textContent = `${this.modelRidec.maxTime}${unitLabel.charAt(0)}`;
            if (modelArea) modelArea.textContent = this.modelRidec.area || 'Sem Área';

            // Preencher campos das etapas padrão
            if (this.modelRidec.deadlines) {
                const deadlineRI = document.getElementById('deadlineRI');
                const deadlineD = document.getElementById('deadlineD');
                const deadlineE = document.getElementById('deadlineE');
                const deadlineC = document.getElementById('deadlineC');

                if (deadlineRI) deadlineRI.value = this.modelRidec.deadlines.RI || '';
                if (deadlineD) deadlineD.value = this.modelRidec.deadlines.D || '';
                if (deadlineE) deadlineE.value = this.modelRidec.deadlines.E || '';
                if (deadlineC) deadlineC.value = this.modelRidec.deadlines.C || '';
            }

            // Renderizar etapas A
            this.renderStagesA();
            
            // Atualizar configuração de integrações
            this.updateIntegrationsConfig();
            
            // Atualizar seletor de modo
            this.updateModeSelector();
        } catch (error) {
            console.error('Erro ao atualizar configuração do modelo:', error);
        }
    }

    renderStagesA() {
        try {
            const container = document.getElementById('stagesAList');
            if (!container) {
                console.error('Container stagesAList não encontrado');
                return;
            }

            container.innerHTML = '';

            if (!this.modelRidec.stagesA || this.modelRidec.stagesA.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 20px; text-align: center; color: #718096;">
                        <i class="fas fa-plus-circle"></i>
                        <p>Nenhuma etapa A configurada. Clique em "Adicionar Etapa A" para começar.</p>
                    </div>
                `;
                return;
            }

            this.modelRidec.stagesA.forEach((stage, index) => {
                const stageElement = this.createStageAElement(stage, index);
                container.appendChild(stageElement);
            });
        } catch (error) {
            console.error('Erro ao renderizar etapas A:', error);
        }
    }

    createStageAElement(stage, index) {
        const element = document.createElement('div');
        element.className = 'stage-a-card';
        element.innerHTML = `
            <div class="stage-a-header">
                <div class="stage-a-title">
                    <i class="fas fa-plus-circle"></i>
                    ${stage.identifier}
                </div>
                <div class="stage-a-actions">
                    <button class="action-btn edit" onclick="ridecTypeDetails.editStageA(${index})" title="Editar etapa">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete" onclick="ridecTypeDetails.removeStageA(${index})" title="Remover etapa">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            </div>
            <div class="stage-a-fields">
                <div class="field-group">
                    <label class="field-label">Posição no Fluxo</label>
                    <input type="text" class="field-input" value="${stage.position}" readonly>
                </div>
                <div class="field-group">
                    <label class="field-label">Prazo</label>
                    <input type="number" class="field-input" value="${stage.deadline}" readonly>
                </div>
                <div class="field-group">
                    <label class="field-label">Unidade de Tempo</label>
                    <input type="text" class="field-input" value="${this.getTimeUnitLabel(stage.timeUnit || this.modelRidec.timeUnit || 'hours')}" readonly>
                </div>
                <div class="field-group">
                    <label class="field-label">Descrição</label>
                    <textarea class="field-input" readonly rows="2">${stage.description || ''}</textarea>
                </div>
            </div>
        `;
        return element;
    }

    updateStats() {
        try {
            const total = this.ridecs.length;
            const active = this.ridecs.filter(r => !r.completed).length;
            const overdue = this.ridecs.filter(r => !r.completed && this.isOverdue(r)).length;
            const completed = this.ridecs.filter(r => r.completed).length;

            const totalElement = document.getElementById('totalRidecs');
            const activeElement = document.getElementById('activeRidecs');
            const overdueElement = document.getElementById('overdueRidecs');
            const completedElement = document.getElementById('completedRidecs');

            if (totalElement) totalElement.textContent = total;
            if (activeElement) activeElement.textContent = active;
            if (overdueElement) overdueElement.textContent = overdue;
            if (completedElement) completedElement.textContent = completed;
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    renderRidecList() {
        try {
            const container = document.getElementById('ridecList');
            if (!container) {
                console.error('Container ridecList não encontrado');
                return;
            }
            
            if (!this.ridecs || this.ridecs.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>Nenhum RIDEC encontrado</h3>
                        <p>Não há RIDECs do tipo "${this.ridecType}" no sistema.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '<div class="ridec-grid"></div>';
            const ridecGrid = container.querySelector('.ridec-grid');
            
            this.ridecs.forEach(ridec => {
                try {
                    const ridecElement = this.createRidecElement(ridec);
                    ridecGrid.appendChild(ridecElement);
                } catch (error) {
                    console.error('Erro ao criar elemento do RIDEC:', error);
                }
            });
        } catch (error) {
            console.error('Erro ao renderizar lista de RIDECs:', error);
        }
    }

    createRidecElement(ridec) {
        try {
            const element = document.createElement('div');
            element.className = 'ridec-item';
            
            const status = this.getRidecStatus(ridec);
            const elapsedTime = this.getElapsedTime(ridec);
            const currentStage = this.getCurrentStageInfo(ridec);
            const progress = this.getProgress(ridec);
            const createdAt = new Date(ridec.startTime).toLocaleDateString('pt-BR');
            const timeUnit = this.getTimeUnitLabel(ridec.timeUnit || 'hours');
            const stagesInfo = this.getStagesInfo(ridec);
            
            element.innerHTML = `
                <div class="ridec-header">
                    <div class="ridec-header-left">
                        <div class="ridec-title">${ridec.title || 'Sem título'}</div>
                        <div class="ridec-meta">
                            <div class="meta-item">
                                <i class="fas fa-hashtag"></i>
                                #${ridec.occurrenceNumber || 1}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-building"></i>
                                ${ridec.area || 'Sem Área'}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                ${createdAt}
                            </div>
                        </div>
                    </div>
                    <div class="ridec-header-right">
                        <div class="ridec-status ${status.class}">
                            ${status.text}
                        </div>
                        <button class="action-btn delete" onclick="ridecTypeDetails.deleteRidec('${ridec.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="ridec-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${status.class}" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>${progress}% concluído</span>
                        <span>${elapsedTime} / ${ridec.maxTime || 0} ${timeUnit}</span>
                    </div>
                </div>
                
                <div class="ridec-stages-summary">
                    <div class="stages-summary-header">
                        <i class="fas fa-tasks"></i>
                        <span>Tempos das Etapas</span>
                    </div>
                    <div class="stages-summary-grid">
                        ${stagesInfo.map(stage => {
                            const stageColor = this.getStageColor(stage.key);
                            const stageDescription = this.getStageDescription(stage.key);
                            const isCompleted = stage.status === 'completed';
                            const isRunning = stage.status === 'running';
                            const isActive = stage.status === 'active';
                            const canStart = this.canStartStage(ridec, stage.key);
                            const canFinish = isRunning || isActive;
                            
                            return `
                                <div class="stage-summary-item ${stage.status}" style="--stage-color: ${stageColor}">
                                    <div class="particles"></div>
                                    <div class="stage-summary-content">
                                        <div class="stage-summary-header">
                                            <div class="stage-summary-title">
                                                <span class="stage-emoji">${this.getStageEmoji(stage.key)}</span>
                                                <span class="stage-name">${stage.label}</span>
                                            </div>
                                            <div class="stage-summary-status">
                                                <div class="status-dot ${stage.status}"></div>
                                            </div>
                                        </div>
                                        <div class="stage-summary-info">
                                            <div class="stage-time">${stage.time}</div>
                                            <div class="stage-progress">
                                                <div class="progress-ring">
                                                    <svg width="40" height="40">
                                                        <circle cx="20" cy="20" r="18" fill="none" stroke="#e2e8f0" stroke-width="3"/>
                                                        <circle cx="20" cy="20" r="18" fill="none" stroke="${stageColor}" stroke-width="3" 
                                                                stroke-dasharray="${2 * Math.PI * 18}" 
                                                                stroke-dashoffset="${2 * Math.PI * 18 * (1 - stage.progress / 100)}"
                                                                stroke-linecap="round"/>
                                                    </svg>
                                                    <span class="progress-text">${Math.round(stage.progress)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="stage-summary-actions">
                                            ${canStart ? `
                                                <button class="stage-action-btn start" onclick="ridecTypeDetails.startStage('${ridec.id}', '${stage.key}')" title="Iniciar ${stage.label}">
                                                    <i class="fas fa-play"></i>
                                                </button>
                                            ` : ''}
                                            ${canFinish ? `
                                                <button class="stage-action-btn finish" onclick="ridecTypeDetails.finishStage('${ridec.id}', '${stage.key}')" title="Finalizar ${stage.label}">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            return element;
        } catch (error) {
            console.error('Erro ao criar elemento do RIDEC:', error);
            const errorElement = document.createElement('div');
            errorElement.className = 'ridec-item error';
            errorElement.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Erro ao carregar RIDEC</span>
                </div>
            `;
            return errorElement;
        }
    }

    getStageDescription(stage) {
        const descriptions = {
            'RI': 'Requisitos e Integração',
            'D': 'Desenvolvimento',
            'E': 'Execução',
            'C': 'Conclusão'
        };
        return descriptions[stage] || stage;
    }

    getStageEmoji(stage) {
        const emojis = {
            'RI': '📋', // Prancheta para Requisitos e Integração
            'D': '💻',  // Computador para Desenvolvimento
            'E': '🚀',  // Foguete para Execução
            'C': '✅'   // Check para Conclusão
        };
        return emojis[stage] || '📍';
    }

    getStageColor(stage) {
        const colors = {
            'RI': '#667eea',
            'D': '#f093fb',
            'E': '#f5576c',
            'C': '#4facfe'
        };
        return colors[stage] || '#667eea';
    }

    getStageColorRGB(stage) {
        const colors = {
            'RI': '102, 126, 234',
            'D': '240, 147, 251',
            'E': '245, 87, 108',
            'C': '79, 172, 254'
        };
        return colors[stage] || '102, 126, 234';
    }

    getStatusIcon(statusClass) {
        const icons = {
            'pending': '<i class="fas fa-clock"></i>',
            'active': '<i class="fas fa-play"></i>',
            'running': '<i class="fas fa-running"></i>',
            'completed': '<i class="fas fa-check"></i>',
            'overdue': '<i class="fas fa-exclamation-triangle"></i>'
        };
        return icons[statusClass] || '<i class="fas fa-circle"></i>';
    }

    createSimpleStagesView(ridec) {
        const stages = ['RI', 'D', 'E', 'C'];
        const timeControlMode = ridec.timeControlMode || 'detailed';
        
        if (timeControlMode === 'simple') {
            // Modo simples: mostrar progresso geral com informações de tempo
            const progress = this.getProgress(ridec);
            const elapsedTime = this.getElapsedTime(ridec);
            const maxTime = ridec.maxTime;
            const timeUnit = this.getTimeUnitLabel(ridec.timeUnit || 'hours');
            const isOverdue = this.isOverdue(ridec);
            
            return `
                <div class="simple-stages-view modern">
                    <div class="simple-progress-header">
                        <div class="progress-title">
                            <i class="fas fa-play-circle"></i>
                            <span>Processo RIDEC</span>
                        </div>
                        <div class="progress-percentage ${isOverdue ? 'overdue' : ''}">
                            ${progress}%
                        </div>
                    </div>
                    
                    <div class="simple-progress-container">
                        <div class="simple-progress-bar modern">
                            <div class="simple-progress-fill ${isOverdue ? 'overdue' : ''}" style="width: ${progress}%">
                                <div class="progress-glow"></div>
                            </div>
                            <div class="progress-marker" style="left: ${progress}%">
                                <div class="marker-dot"></div>
                            </div>
                        </div>
                        
                        <div class="time-info">
                            <div class="time-elapsed">
                                <i class="fas fa-clock"></i>
                                <span>${elapsedTime}</span>
                            </div>
                            <div class="time-total">
                                <i class="fas fa-stopwatch"></i>
                                <span>${maxTime} ${timeUnit}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Modo detalhado: mostrar cards modernos das etapas
            return `
                <div class="stages-grid modern">
                    ${stages.map((stage, index) => {
                        const isCompleted = this.isStageCompleted(ridec, stage);
                        const isActive = ridec.currentStage === stage;
                        const isOverdue = this.isStageOverdue(ridec, stage);
                        const stageTime = this.getStageTime(ridec, stage);
                        const stageProgress = this.getStageProgress(ridec, stage);
                        const stageDeadline = this.getStageDeadline(ridec, stage);
                        const canStart = this.canStartStage(ridec, stage);
                        const isRunning = ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running;
                        const stageColor = this.getStageColor(stage);
                        const stageColorRGB = this.getStageColorRGB(stage);
                        
                        let statusClass = 'pending';
                        if (isCompleted) statusClass = 'completed';
                        else if (isActive && isRunning) statusClass = 'running';
                        else if (isActive) statusClass = 'active';
                        else if (isOverdue) statusClass = 'overdue';

                        const statusText = this.getStageStatusText(ridec, stage);
                        const emoji = this.getStageEmoji(stage);
                        const stageDescription = this.getStageDescription(stage);
                        
                        return `
                            <div class="stage-card ${statusClass}" data-stage="${stage}" data-ridec-id="${ridec.id}" style="--stage-color: ${stageColor}; --stage-color-rgb: ${stageColorRGB}">
                                <div class="stage-card-header">
                                    <div class="stage-emoji">${emoji}</div>
                                    <div class="stage-info">
                                        <div class="stage-name">${stage}</div>
                                        <div class="stage-description">${stageDescription}</div>
                                    </div>
                                    <div class="stage-status">
                                        <span class="status-badge ${statusClass}">
                                            ${this.getStatusIcon(statusClass)}
                                            ${statusText}
                                        </span>
                                    </div>
                                </div>

                                <div class="stage-card-body">
                                    <div class="stage-metrics">
                                        <div class="metric-item">
                                            <div class="metric-ring">
                                                <svg viewBox="0 0 36 36">
                                                    <path d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="#e2e8f0"
                                                        stroke-width="3"
                                                        stroke-dasharray="100, 100"/>
                                                    <path d="M18 2.0845
                                                        a 15.9155 15.9155 0 0 1 0 31.831
                                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="${stageColor}"
                                                        stroke-width="3"
                                                        stroke-dasharray="${Math.min(stageProgress, 100)}, 100"
                                                        stroke-linecap="round"/>
                                                </svg>
                                                <div class="metric-value">${Math.round(stageProgress)}%</div>
                                            </div>
                                            <div class="metric-label">Progresso</div>
                                        </div>
                                        <div class="metric-info">
                                            <div class="time-row">
                                                <i class="fas fa-clock"></i>
                                                <span>${stageTime}</span>
                                            </div>
                                            <div class="time-row">
                                                <i class="fas fa-hourglass-half"></i>
                                                <span>Prazo: ${stageDeadline}</span>
                                            </div>
                                            ${isOverdue ? `
                                                <div class="time-row overdue-warning">
                                                    <i class="fas fa-exclamation-triangle"></i>
                                                    <span>Em atraso!</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>

                                    <div class="stage-actions">
                                        ${!isCompleted ? `
                                            ${!isRunning ? `
                                                <button class="stage-btn start ${canStart ? '' : 'disabled'}"
                                                        onclick="ridecTypeDetails.startStage('${ridec.id}', '${stage}')"
                                                        ${canStart ? '' : 'disabled'}
                                                        title="${canStart ? 'Iniciar etapa' : 'Etapa não pode ser iniciada'}">
                                                    <i class="fas fa-play"></i>
                                                    <span>Iniciar Etapa</span>
                                                </button>
                                            ` : `
                                                <button class="stage-btn stop"
                                                        onclick="ridecTypeDetails.finishStage('${ridec.id}', '${stage}')"
                                                        title="Finalizar etapa">
                                                    <i class="fas fa-stop"></i>
                                                    <span>Finalizar Etapa</span>
                                                </button>
                                            `}
                                        ` : `
                                            <div class="completion-info">
                                                <i class="fas fa-check-circle"></i>
                                                <span class="completion-time">
                                                    ${this.formatCompletionTime(ridec.stageTimers[stage]?.completedAt)}
                                                </span>
                                            </div>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    }

    getStagesInfo(ridec) {
        try {
            const stages = ['RI', 'D', 'E', 'C'];
            const stagesInfo = [];
            
            stages.forEach(stage => {
                const stageTime = this.getStageTime(ridec, stage);
                const stageProgress = this.getStageProgress(ridec, stage);
                const isOverdue = this.isStageOverdue(ridec, stage);
                const isCompleted = this.isStageCompleted(ridec, stage);
                const isActive = ridec.currentStage === stage;
                
                let status = 'pending';
                if (isCompleted) status = 'completed';
                else if (isActive) status = 'active';
                else if (isOverdue) status = 'overdue';
                
                stagesInfo.push({
                    key: stage,
                    label: stage,
                    time: stageTime,
                    progress: stageProgress,
                    overdue: isOverdue,
                    status: status
                });
            });
            
            // Adicionar etapas A se existirem
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                ridec.stagesA.forEach(stageA => {
                    const stageTime = this.getStageTime(ridec, stageA.identifier);
                    const stageProgress = this.getStageProgress(ridec, stageA.identifier);
                    const isOverdue = this.isStageOverdue(ridec, stageA.identifier);
                    const isCompleted = this.isStageCompleted(ridec, stageA.identifier);
                    const isActive = ridec.currentStage === stageA.identifier;
                    
                    let status = 'pending';
                    if (isCompleted) status = 'completed';
                    else if (isActive) status = 'active';
                    else if (isOverdue) status = 'overdue';
                    
                    stagesInfo.push({
                        key: stageA.identifier,
                        label: stageA.identifier,
                        time: stageTime,
                        progress: stageProgress,
                        overdue: isOverdue,
                        status: status
                    });
                });
            }
            
            return stagesInfo;
        } catch (error) {
            console.error('Erro ao obter informações das etapas:', error);
            return [];
        }
    }

    getStageTime(ridec, stage) {
        try {
            const elapsedSeconds = this.getStageElapsedTime(ridec, stage);
            
            // Se não há tempo decorrido, retornar "Não iniciada"
            if (elapsedSeconds === 0) {
                return 'Não iniciada';
            }
            
            // Formatar o tempo decorrido
            const minutes = Math.floor(elapsedSeconds / 60);
            const remainingSeconds = elapsedSeconds % 60;
            let elapsedFormatted = '';
            
            if (minutes > 0) {
                elapsedFormatted = `${minutes}m ${remainingSeconds}s`;
            } else {
                elapsedFormatted = `${remainingSeconds}s`;
            }
            
            return elapsedFormatted;
        } catch (error) {
            console.error('Erro ao obter tempo da etapa:', error);
            return 'Não iniciada';
        }
    }

    getStageProgress(ridec, stage) {
        try {
            // Verificar se há timer para esta etapa
            if (ridec.stageTimers && ridec.stageTimers[stage]) {
                let elapsed = ridec.stageTimers[stage].elapsed || 0;
                if (ridec.stageTimers[stage].running && ridec.stageTimers[stage].startTime) {
                    elapsed += Math.floor((Date.now() - ridec.stageTimers[stage].startTime) / 1000);
                }
                
                // Verificar se é uma etapa A
                if (ridec.stagesA && ridec.stagesA.length > 0) {
                    const stageA = ridec.stagesA.find(s => s.identifier === stage);
                    if (stageA && stageA.deadline) {
                        const deadline = stageA.deadline;
                        const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                        if (deadlineInSeconds > 0) {
                            return Math.min((elapsed / deadlineInSeconds) * 100, 100);
                        }
                    }
                }
                
                // Para etapas padrão
                const deadline = ridec.deadlines && ridec.deadlines[stage] ? ridec.deadlines[stage] : 0;
                if (deadline === 0) return 0;
                
                const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                if (deadlineInSeconds > 0) {
                    return Math.min((elapsed / deadlineInSeconds) * 100, 100);
                }
            }
            
            return 0;
        } catch (error) {
            console.error('Erro ao calcular progresso da etapa:', error);
            return 0;
        }
    }

    isStageOverdue(ridec, stage) {
        try {
            // Verificar se há timer para esta etapa
            if (ridec.stageTimers && ridec.stageTimers[stage]) {
                let elapsed = ridec.stageTimers[stage].elapsed || 0;
                if (ridec.stageTimers[stage].running && ridec.stageTimers[stage].startTime) {
                    elapsed += Math.floor((Date.now() - ridec.stageTimers[stage].startTime) / 1000);
                }
                
                // Verificar se é uma etapa A
                if (ridec.stagesA && ridec.stagesA.length > 0) {
                    const stageA = ridec.stagesA.find(s => s.identifier === stage);
                    if (stageA && stageA.deadline) {
                        const deadline = stageA.deadline;
                        const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                        const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                        if (deadlineInSeconds > 0) {
                            return elapsed > deadlineInSeconds;
                        }
                    }
                }
                
                // Para etapas padrão
                const deadline = ridec.deadlines && ridec.deadlines[stage] ? ridec.deadlines[stage] : 0;
                if (deadline === 0) return false;
                
                const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
                const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                if (deadlineInSeconds > 0) {
                    return elapsed > deadlineInSeconds;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao verificar se etapa está em atraso:', error);
            return false;
        }
    }

    isStageCompleted(ridec, stage) {
        try {
            // Verificar se há timer para esta etapa e se foi completada
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
            
            // Verificar se há etapas completadas registradas
            if (ridec.completedStages && ridec.completedStages.includes(stage)) {
                return true;
            }
            
            // Fallback: verificar se a etapa atual é posterior à etapa em questão
            const stageOrder = ['RI', 'D', 'E', 'C'];
            const currentIndex = stageOrder.indexOf(ridec.currentStage);
            const stageIndex = stageOrder.indexOf(stage);
            
            // Se a etapa atual é posterior à etapa em questão, então a etapa foi concluída
            return stageIndex < currentIndex && currentIndex > 0;
        } catch (error) {
            console.error('Erro ao verificar se etapa foi concluída:', error);
            return false;
        }
    }

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
        const elapsedStr = this.formatElapsedTime(elapsed);
        
        // Verificar se pode iniciar a etapa
        const canStart = this.canStartStage(ridec, stage);
        
        let btn = '';
        if (!running && canStart) {
            btn = `<button class="btn-timer play" onclick="ridecTypeDetails.startStageTimer('${ridec.id}', '${stage}')" title="Iniciar ${stage}">
                <i class="fas fa-play"></i> Iniciar
            </button>`;
        } else if (running) {
            btn = `<button class="btn-timer stop" onclick="ridecTypeDetails.finishStage('${ridec.id}', '${stage}')" title="Parar ${stage}">
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
                        `<button class="btn-timer complete" onclick="ridecTypeDetails.finishStage('${ridec.id}', '${stage}')" title="Concluir ${stage}">
                            <i class="fas fa-check"></i> Concluir
                        </button>` : ''}
                </div>
            </div>
        `;
    }

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

    stopStageTimer(ridecId, stage) {
        const ridec = this.ridecs.find(r => r.id === ridecId);
        if (!ridec || !ridec.stageTimers || !ridec.stageTimers[stage]) return;
        
        if (ridec.stageTimers[stage].running) {
            const now = Date.now();
            const elapsed = Math.floor((now - ridec.stageTimers[stage].startTime) / 1000);
            ridec.stageTimers[stage].elapsed = (ridec.stageTimers[stage].elapsed || 0) + elapsed;
            ridec.stageTimers[stage].running = false;
            delete ridec.stageTimers[stage].startTime;
            
            this.saveToLocalStorage();
            this.renderRidecList();
            this.showNotification(`⏹️ Timer parado para etapa ${stage}`, 'info', false);
        }
    }



    finishStage(ridecId, stage) {
        try {
            const ridec = this.ridecs.find(r => r.id === ridecId);
            if (!ridec) {
                this.showNotification('RIDEC não encontrado', 'error', false);
                return;
            }

            // Parar o timer da etapa atual
            if (ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running) {
                const now = Date.now();
                const elapsed = Math.floor((now - ridec.stageTimers[stage].startTime) / 1000);
                ridec.stageTimers[stage].elapsed = (ridec.stageTimers[stage].elapsed || 0) + elapsed;
                ridec.stageTimers[stage].running = false;
                ridec.stageTimers[stage].completedAt = endTime;
            }

            // Marcar etapa como concluída
            if (!ridec.completedStages) {
                ridec.completedStages = [];
            }
            if (!ridec.completedStages.includes(stage)) {
                ridec.completedStages.push(stage);
            }

            // Verificar se é a última etapa
            const stages = ['RI', 'D', 'E', 'C'];
            const currentIndex = stages.indexOf(stage);
            const nextStage = stages[currentIndex + 1];

            if (nextStage) {
                // Inicializar próxima etapa sem começar a contagem
                if (!ridec.stageTimers) {
                    ridec.stageTimers = {};
                }
                ridec.stageTimers[nextStage] = {
                    startTime: null,
                    elapsed: 0,
                    running: false,
                    readyToStart: true
                };

                // Atualizar etapa atual
                ridec.currentStage = nextStage;

                // Mostrar notificação para iniciar próxima etapa
                this.showNotification(`Etapa ${stage} concluída. Clique em "Iniciar Etapa" para começar ${nextStage}.`, 'success', false);
            } else {
                // Última etapa concluída - finalizar RIDEC
                ridec.completed = true;
                ridec.completedAt = Date.now();
                this.showNotification('RIDEC concluído com sucesso!', 'success', false);
            }

            // Salvar no localStorage
            this.saveToLocalStorage();

            // Atualizar interface
            this.renderRidecList();

            // Verificar se a área ganhou premiação
            setTimeout(() => {
                this.updateAreaAward();
            }, 500);

        } catch (error) {
            console.error('Erro ao finalizar etapa:', error);
            this.showNotification('Erro ao finalizar etapa', 'error', false);
        }
    }

    createNewOccurrence() {
        try {
            console.log('Iniciando criação de nova ocorrência...');
            console.log('Tipo RIDEC:', this.ridecType);
            
            // Encontrar o template do RIDEC (primeiro RIDEC do tipo que não é ocorrência)
            const allRidecs = JSON.parse(localStorage.getItem('ridecs') || '[]');
            console.log('Todos os RIDECs:', allRidecs);
            
            const templateRidec = allRidecs.find(r => r.title === this.ridecType && !r.isOccurrence);
            console.log('Template encontrado:', templateRidec);
            
            if (!templateRidec) {
                console.error('Template do RIDEC não encontrado!');
                this.showNotification('Template do RIDEC não encontrado! Crie um modelo primeiro.', 'error', false);
                return;
            }

            // Gerar ID único
            const generateId = () => {
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            };

            // Criar nova ocorrência baseada no template
            const newOccurrence = {
                id: generateId(),
                title: this.ridecType,
                description: templateRidec.description || '',
                area: templateRidec.area || '',
                timeUnit: templateRidec.timeUnit || 'hours',
                maxTime: templateRidec.maxTime || 10,
                deadlines: templateRidec.deadlines ? { ...templateRidec.deadlines } : {
                    RI: 2,
                    D: 4,
                    E: 3,
                    C: 1
                },
                deadlineUnits: templateRidec.deadlineUnits ? { ...templateRidec.deadlineUnits } : {
                    RI: templateRidec.timeUnit || 'hours',
                    D: templateRidec.timeUnit || 'hours',
                    E: templateRidec.timeUnit || 'hours',
                    C: templateRidec.timeUnit || 'hours'
                },
                stagesA: templateRidec.stagesA ? [...templateRidec.stagesA] : [],
                currentStage: 'RI',
                startTime: Date.now(),
                stageStartTime: Date.now(),
                completed: false,
                isOccurrence: true,
                occurrenceNumber: this.getNextOccurrenceNumber(),
                stageTimers: {
                    'RI': {
                        elapsed: 0,
                        running: false
                    }
                },
                riStarted: false,
                riStartTime: null
            };

            console.log('Nova ocorrência criada:', newOccurrence);

            // Adicionar ao localStorage
            allRidecs.push(newOccurrence);
            localStorage.setItem('ridecs', JSON.stringify(allRidecs));
            console.log('Ocorrência salva no localStorage');

            // Recarregar a página
            this.loadRidecs();
            this.renderPage();
            console.log('Página recarregada');

            // Verificar se a área ganhou premiação
            setTimeout(() => {
                this.updateAreaAward();
            }, 500);

            // Mostrar notificação
            this.showNotification(`Nova ocorrência do RIDEC "${this.ridecType}" criada com sucesso!`, 'success', false);
            
        } catch (error) {
            console.error('Erro ao criar nova ocorrência:', error);
            this.showNotification('Erro ao criar nova ocorrência. Tente novamente.', 'error', false);
        }
    }

    getNextOccurrenceNumber() {
        // Contar apenas as ocorrências do tipo atual
        const occurrenceCount = this.ridecs.filter(ridec => 
            ridec.title === this.ridecType && ridec.isOccurrence
        ).length;
        return occurrenceCount + 1;
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

    showNotification(message, type = 'info', saveToHistory = false) {
        // Criar notificação temporária
        const notification = document.createElement('div');
        
        // Definir cores baseadas no tipo
        let bgColor = 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)';
        if (type === 'success') bgColor = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        if (type === 'warning') bgColor = 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
        if (type === 'error') bgColor = 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    formatElapsedTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    saveToLocalStorage() {
        // Carregar todos os RIDECs do localStorage
        const allRidecs = JSON.parse(localStorage.getItem('ridecs') || '[]');
        
        // Atualizar apenas as ocorrências deste tipo
        this.ridecs.forEach(occurrence => {
            const index = allRidecs.findIndex(r => r.id === occurrence.id);
            if (index !== -1) {
                allRidecs[index] = occurrence;
            }
        });
        
        localStorage.setItem('ridecs', JSON.stringify(allRidecs));
    }

    // Métodos para gerenciar configuração do modelo
    editModel() {
        // Salvar ID do modelo para edição e redirecionar
        sessionStorage.setItem('editRidecId', this.modelRidec.id);
        window.location.href = 'index.html';
    }

    addStageA() {
        // Abrir modal para adicionar etapa A
        this.openStageAModal();
    }

    openStageAModal() {
        // Criar modal para adicionar etapa A
        const modal = document.createElement('div');
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Adicionar Etapa A</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <form id="stageAForm">
                    <div>
                        <label>Posição da Etapa A</label>
                        <select id="stageAPosition" required>
                            <option value="">Selecione a posição</option>
                            <option value="ri-d">Entre RI e D</option>
                            <option value="d-e">Entre D e E</option>
                            <option value="e-c">Entre E e C</option>
                            <option value="after-c">Depois do C</option>
                        </select>
                    </div>
                    <div>
                        <label>Prazo da Etapa A (horas)</label>
                        <input type="number" id="stageADeadline" min="1" required>
                    </div>
                    <div>
                        <label>Descrição da Etapa A</label>
                        <textarea id="stageADescription" rows="3"></textarea>
                    </div>
                    <div>
                        <label>Identificador da Etapa A</label>
                        <input type="text" id="stageAIdentifier" placeholder="Ex: A1, A2, Revisão, etc." required>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="ridecTypeDetails.closeStageAModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="ridecTypeDetails.saveStageA()">
                            <i class="fas fa-plus"></i> Adicionar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.closeStageAModal();
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeStageAModal();
            }
        });
    }

    closeStageAModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }

    saveStageA() {
        const position = document.getElementById('stageAPosition').value;
        const deadline = parseInt(document.getElementById('stageADeadline').value);
        const description = document.getElementById('stageADescription').value;
        const identifier = document.getElementById('stageAIdentifier').value;

        if (!position || !deadline || !identifier) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const stageAData = {
            position,
            deadline,
            timeUnit: this.modelRidec.timeUnit || 'hours',
            description,
            identifier
        };

        // Adicionar etapa A ao modelo
        if (!this.modelRidec.stagesA) {
            this.modelRidec.stagesA = [];
        }

        this.modelRidec.stagesA.push(stageAData);

        // Salvar no localStorage
        this.saveModelToLocalStorage();

        // Fechar modal e atualizar interface
        this.closeStageAModal();
        this.renderStagesA();
        this.showNotification('Etapa A adicionada com sucesso!', 'success', false);
    }

    editStageA(index) {
        const stage = this.modelRidec.stagesA[index];
        // Implementar edição de etapa A (similar ao modal de adição)
        alert('Funcionalidade de edição será implementada em breve.');
    }

    removeStageA(index) {
        if (confirm('Tem certeza que deseja remover esta etapa A?')) {
            this.modelRidec.stagesA.splice(index, 1);
            this.saveModelToLocalStorage();
            this.renderStagesA();
            this.showNotification('Etapa A removida com sucesso!', 'success', false);
        }
    }

    saveModelConfig() {
        // Salvar configurações das etapas padrão
        const deadlines = {
            RI: parseInt(document.getElementById('deadlineRI').value) || 0,
            D: parseInt(document.getElementById('deadlineD').value) || 0,
            E: parseInt(document.getElementById('deadlineE').value) || 0,
            C: parseInt(document.getElementById('deadlineC').value) || 0
        };

        this.modelRidec.deadlines = deadlines;
        // Manter a unidade de tempo atual do modelo
        this.modelRidec.timeUnit = this.modelRidec.timeUnit || 'hours';

        // Salvar no localStorage
        this.saveModelToLocalStorage();

        this.showNotification('Configuração do modelo salva com sucesso!', 'success', false);
    }

    resetModelConfig() {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão? Isso removerá todas as etapas A.')) {
            // Restaurar valores padrão
            this.modelRidec.deadlines = {
                RI: 2,
                D: 4,
                E: 3,
                C: 1
            };
            this.modelRidec.timeUnit = 'hours';
            this.modelRidec.stagesA = [];

            // Atualizar interface
            this.updateModelConfig();
            this.saveModelToLocalStorage();
            this.showNotification('Configurações restauradas para o padrão!', 'success', false);
        }
    }

    saveModelToLocalStorage() {
        const savedRidecs = localStorage.getItem('ridecs');
        let allRidecs = [];
        
        if (savedRidecs) {
            allRidecs = JSON.parse(savedRidecs);
        }

        // Atualizar o modelo no array
        const index = allRidecs.findIndex(r => r.id === this.modelRidec.id);
        if (index !== -1) {
            allRidecs[index] = this.modelRidec;
        }

        localStorage.setItem('ridecs', JSON.stringify(allRidecs));
    }

    getRidecStatus(ridec) {
        try {
            if (ridec.completed) {
                return { text: 'Concluído', class: 'completed' };
            }
            
            if (this.isOverdue(ridec)) {
                return { text: 'Em Atraso', class: 'overdue' };
            }
            
            if (ridec.stageTimers) {
                // Verificar se alguma etapa está rodando
                for (const stage in ridec.stageTimers) {
                    if (ridec.stageTimers[stage].running) {
                        return { text: 'Em Execução', class: 'running' };
                    }
                }
            }
            
            return { text: 'Aguardando', class: 'pending' };
        } catch (error) {
            console.error('Erro ao obter status do RIDEC:', error);
            return { text: 'Erro', class: 'error' };
        }
    }

    isOverdue(ridec) {
        try {
            if (ridec.completed) {
                return false;
            }
            
            const elapsedSeconds = this.getElapsedTimeInSeconds(ridec);
            const timeUnit = ridec.timeUnit || 'hours';
            const maxTimeInSeconds = this.convertTimeToSeconds(ridec.maxTime || 0, timeUnit);
            
            if (maxTimeInSeconds === 0) {
                return false;
            }
            
            return elapsedSeconds > maxTimeInSeconds;
        } catch (error) {
            console.error('Erro ao verificar se RIDEC está em atraso:', error);
            return false;
        }
    }

    getElapsedTime(ridec) {
        try {
            const elapsedSeconds = this.getElapsedTimeInSeconds(ridec);
            return this.formatElapsedTime(elapsedSeconds);
        } catch (error) {
            console.error('Erro ao obter tempo decorrido:', error);
            return '0s';
        }
    }

    getElapsedTimeInSeconds(ridec) {
        try {
            // Só contar tempo se a etapa RI já foi iniciada
            if (!ridec.riStarted || !ridec.riStartTime) {
                return 0;
            }
            
            const now = Date.now();
            return Math.floor((now - ridec.riStartTime) / 1000);
        } catch (error) {
            console.error('Erro ao calcular tempo decorrido em segundos:', error);
            return 0;
        }
    }

    getElapsedTimeInHours(ridec) {
        if (!ridec.startTime) return 0;
        
        const now = Date.now();
        const elapsed = (now - ridec.startTime) / (1000 * 60 * 60); // Converter para horas
        return elapsed;
    }

    getStageElapsedTime(ridec, stage) {
        try {
            // Verificar se há timer para esta etapa
            if (ridec.stageTimers && ridec.stageTimers[stage]) {
                let elapsed = ridec.stageTimers[stage].elapsed || 0;
                if (ridec.stageTimers[stage].running && ridec.stageTimers[stage].startTime) {
                    elapsed += Math.floor((Date.now() - ridec.stageTimers[stage].startTime) / 1000);
                }
                return elapsed; // Retornar em segundos
            }
            
            // Fallback para o sistema antigo
            // Verificar se é uma etapa A
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                const stageA = ridec.stagesA.find(s => s.identifier === stage);
                if (stageA && stageA.startTime) {
                    const elapsed = Date.now() - stageA.startTime;
                    return Math.floor(elapsed / 1000); // Retornar em segundos
                }
            }
            
            // Se não há timer específico, verificar se há tempo geral
            if (ridec.stageStartTime) {
                const elapsed = Date.now() - ridec.stageStartTime;
                return Math.floor(elapsed / 1000); // Retornar em segundos
            }
            
            return 0; // Retornar 0 se não há tempo registrado
        } catch (error) {
            console.error('Erro ao calcular tempo decorrido da etapa:', error);
            return 0;
        }
    }

    getCurrentStageInfo(ridec) {
        try {
            const currentStage = ridec.currentStage || 'RI';
            const stageDescription = this.getStageDescription(currentStage);
            const stageColor = this.getStageColor(currentStage);
            
            return {
                stage: currentStage,
                description: stageDescription,
                color: stageColor
            };
        } catch (error) {
            console.error('Erro ao obter informações da etapa atual:', error);
            return {
                stage: 'RI',
                description: 'Requisitos e Implementação',
                color: '#3b82f6'
            };
        }
    }

    getProgress(ridec) {
        try {
            if (ridec.completed) {
                return 100;
            }
            
            const stages = ['RI', 'D', 'E', 'C'];
            let completedStages = 0;
            
            stages.forEach(stage => {
                if (this.isStageCompleted(ridec, stage)) {
                    completedStages++;
                }
            });
            
            // Adicionar etapas A se existirem
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                ridec.stagesA.forEach(stageA => {
                    if (this.isStageCompleted(ridec, stageA.identifier)) {
                        completedStages++;
                    }
                });
            }
            
            const totalStages = stages.length + (ridec.stagesA ? ridec.stagesA.length : 0);
            return totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
        } catch (error) {
            console.error('Erro ao calcular progresso do RIDEC:', error);
            return 0;
        }
    }

    editRidec(ridecId) {
        // Salvar o ID do RIDEC para edição
        sessionStorage.setItem('editRidecId', ridecId);
        window.location.href = 'index.html';
    }

    viewDetails(ridecId) {
        // Implementar visualização detalhada do RIDEC
        alert(`Visualizar detalhes do RIDEC ${ridecId}`);
    }

    deleteRidec(ridecId) {
        // Encontrar o RIDEC para mostrar informações na confirmação
        const savedRidecs = JSON.parse(localStorage.getItem('ridecs') || '[]');
        const ridecToDelete = savedRidecs.find(r => r.id === ridecId);
        
        if (!ridecToDelete) {
            this.showNotification('RIDEC não encontrado', 'error');
            return;
        }

        // Criar modal de confirmação personalizado
        const confirmModal = document.createElement('div');
        confirmModal.className = 'delete-confirm-modal';
        confirmModal.innerHTML = `
            <div class="delete-confirm-content">
                <div class="delete-confirm-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Exclusão</h3>
                </div>
                <div class="delete-confirm-body">
                    <p>Tem certeza que deseja excluir o RIDEC:</p>
                    <div class="ridec-to-delete">
                        <strong>${ridecToDelete.title}</strong>
                        <span class="ridec-meta">#${ridecToDelete.occurrenceNumber || 1} - ${ridecToDelete.area || 'Sem Área'}</span>
                    </div>
                    <p class="delete-warning">Esta ação não pode ser desfeita!</p>
                </div>
                <div class="delete-confirm-actions">
                    <button class="btn-cancel" onclick="this.closest('.delete-confirm-modal').remove()">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="ridecTypeDetails.confirmDeleteRidec('${ridecId}')">
                        <i class="fas fa-trash"></i>
                        Deletar RIDEC
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        // Adicionar overlay
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        document.body.appendChild(overlay);
        
        // Fechar modal ao clicar no overlay
        overlay.addEventListener('click', () => {
            confirmModal.remove();
            overlay.remove();
        });
    }

    confirmDeleteRidec(ridecId) {
        // Remover do localStorage
        const savedRidecs = JSON.parse(localStorage.getItem('ridecs') || '[]');
        const updatedRidecs = savedRidecs.filter(r => r.id !== ridecId);
        localStorage.setItem('ridecs', JSON.stringify(updatedRidecs));
        
        // Remover modal e overlay
        const modal = document.querySelector('.delete-confirm-modal');
        const overlay = document.querySelector('.delete-confirm-overlay');
        if (modal) modal.remove();
        if (overlay) overlay.remove();
        
        // Mostrar notificação de sucesso
        this.showNotification('RIDEC excluído com sucesso!', 'success');
        
        // Recarregar a página
        this.loadRidecs();
        this.renderPage();
    }

    startTimer() {
        // Atualizar a página a cada segundo para mostrar tempos em tempo real
        setInterval(() => {
            this.updateStats();
            this.renderRidecList();
            this.updateAreaAward(); // Verificar premiação periodicamente
        }, 1000);
    }

    // Obter ícone da etapa
    formatCompletionTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return `Concluída em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    getStageIcon(stage) {
        const icons = {
            'RI': 'fa-clipboard-list',
            'D': 'fa-code',
            'E': 'fa-rocket',
            'C': 'fa-flag-checkered'
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
            return 'Etapa Concluída';
        } else if (this.isStageOverdue(ridec, stage)) {
            return 'Prazo Excedido';
        } else if (ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running) {
            return 'Em Execução';
        } else if (this.canStartStage(ridec, stage)) {
            return 'Pronta para Iniciar';
        } else {
            return 'Aguardando Etapa Anterior';
        }
    }

    // Obter deadline formatado da etapa
    getStageDeadline(ridec, stage) {
        try {
            // Verificar se é uma etapa A
            if (ridec.stagesA && ridec.stagesA.length > 0) {
                const stageA = ridec.stagesA.find(s => s.identifier === stage);
                if (stageA && stageA.deadline) {
                    const deadline = stageA.deadline;
                    const timeUnit = stageA.timeUnit || ridec.timeUnit || 'hours';
                    const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
                    const deadlineInMinutes = Math.floor(deadlineInSeconds / 60);
                    return deadlineInMinutes > 0 ? `${deadlineInMinutes}m` : 'Não definido';
                }
            }
            
            // Para etapas padrão
            const deadline = ridec.deadlines && ridec.deadlines[stage] ? ridec.deadlines[stage] : 0;
            if (deadline === 0) return 'Não definido';
            
            const timeUnit = ridec.deadlineUnits && ridec.deadlineUnits[stage] ? ridec.deadlineUnits[stage] : (ridec.timeUnit || 'hours');
            const deadlineInSeconds = this.convertTimeToSeconds(deadline, timeUnit);
            const deadlineInMinutes = Math.floor(deadlineInSeconds / 60);
            return deadlineInMinutes > 0 ? `${deadlineInMinutes}m` : 'Não definido';
        } catch (error) {
            console.error('Erro ao obter deadline da etapa:', error);
            return 'Não definido';
        }
    }

    // Verificar se pode iniciar uma etapa
    canStartStage(ridec, stage) {
        try {
            // Se é a etapa RI, sempre pode iniciar se não estiver rodando
            if (stage === 'RI') {
                return !(ridec.stageTimers && ridec.stageTimers[stage] && ridec.stageTimers[stage].running);
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
                
                // Verificar se a etapa atual não foi completada
                if (this.isStageCompleted(ridec, stage)) {
                    return false;
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao verificar se pode iniciar etapa:', error);
            return false;
        }
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

    // Funções para gerenciar integrações
    updateIntegrationsConfig() {
        try {
            const timeControlMode = this.modelRidec.timeControlMode || 'detailed';
            
            // Atualizar badge e descrição do modo
            const modeBadge = document.getElementById('integrationModeBadge');
            const modeDescription = document.getElementById('integrationModeDescription');
            
            if (modeBadge) {
                const icon = timeControlMode === 'simple' ? 'play-circle' : 'clock';
                const text = timeControlMode === 'simple' ? 'Modo Simples' : 'Modo Detalhado';
                modeBadge.innerHTML = `<i class="fas fa-${icon}"></i><span>${text}</span>`;
                modeBadge.className = `mode-badge ${timeControlMode}`;
            }
            
            if (modeDescription) {
                const description = timeControlMode === 'simple' 
                    ? 'Configure integrações para o processo RIDEC completo.'
                    : 'Configure integrações específicas para cada etapa do processo.';
                modeDescription.textContent = description;
            }
            
            // Mostrar/ocultar seções baseado no modo
            const detailedSection = document.getElementById('detailedIntegrations');
            const simpleSection = document.getElementById('simpleIntegrations');
            
            if (detailedSection && simpleSection) {
                if (timeControlMode === 'simple') {
                    detailedSection.style.display = 'none';
                    simpleSection.style.display = 'block';
                } else {
                    detailedSection.style.display = 'block';
                    simpleSection.style.display = 'none';
                }
            }
            
            // Carregar configurações existentes
            this.loadIntegrationSettings();
        } catch (error) {
            console.error('Erro ao atualizar configuração de integrações:', error);
        }
    }

    loadIntegrationSettings() {
        try {
            if (!this.modelRidec.integrations) return;
            
            const integrations = this.modelRidec.integrations;
            
            // Carregar configurações para modo detalhado
            ['RI', 'D', 'E', 'C'].forEach(stage => {
                if (integrations[stage]) {
                    Object.keys(integrations[stage]).forEach(system => {
                        Object.keys(integrations[stage][system]).forEach(trigger => {
                            const checkbox = document.querySelector(
                                `input[data-stage="${stage}"][data-system="${system}"][data-trigger="${trigger}"]`
                            );
                            if (checkbox) {
                                checkbox.checked = integrations[stage][system][trigger];
                            }
                        });
                    });
                }
            });
            
            // Carregar configurações para modo simples
            if (integrations['complete']) {
                Object.keys(integrations['complete']).forEach(system => {
                    Object.keys(integrations['complete'][system]).forEach(trigger => {
                        const checkbox = document.querySelector(
                            `input[data-stage="complete"][data-system="${system}"][data-trigger="${trigger}"]`
                        );
                        if (checkbox) {
                            checkbox.checked = integrations['complete'][system][trigger];
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de integração:', error);
        }
    }

    updateIntegrationCheckbox(checkbox) {
        try {
            const stage = checkbox.dataset.stage;
            const system = checkbox.dataset.system;
            const trigger = checkbox.dataset.trigger;
            const isChecked = checkbox.checked;
            
            // Atualizar modelo
            if (!this.modelRidec.integrations) {
                this.modelRidec.integrations = {};
            }
            
            if (!this.modelRidec.integrations[stage]) {
                this.modelRidec.integrations[stage] = {};
            }
            
            if (!this.modelRidec.integrations[stage][system]) {
                this.modelRidec.integrations[stage][system] = {};
            }
            
            this.modelRidec.integrations[stage][system][trigger] = isChecked;
            
            // Salvar no localStorage
            this.saveModelToLocalStorage();
            
            console.log(`Integração atualizada: ${stage} - ${system} - ${trigger} = ${isChecked}`);
        } catch (error) {
            console.error('Erro ao atualizar checkbox de integração:', error);
        }
    }

    saveIntegrations() {
        try {
            // As integrações já são salvas automaticamente quando os checkboxes são alterados
            this.showNotification('Configurações de integração salvas com sucesso!', 'success', false);
        } catch (error) {
            console.error('Erro ao salvar integrações:', error);
            this.showNotification('Erro ao salvar integrações', 'error', false);
        }
    }

    testIntegrations() {
        try {
            const timeControlMode = this.modelRidec.timeControlMode || 'detailed';
            
            if (timeControlMode === 'simple') {
                this.testSimpleModeIntegrations();
            } else {
                this.testDetailedModeIntegrations();
            }
        } catch (error) {
            console.error('Erro ao testar integrações:', error);
        }
    }

    testSimpleModeIntegrations() {
        // Simular testes para modo simples
        this.showNotification('Testando integrações do modo simples...', 'info', false);
        
        setTimeout(() => {
            this.showNotification('Teste de integração Slack - Iniciar Processo: OK', 'success', false);
        }, 1000);
        
        setTimeout(() => {
            this.showNotification('Teste de integração Jira - Finalizar Processo: OK', 'success', false);
        }, 2000);
        
        setTimeout(() => {
            this.showNotification('Todos os testes de integração concluídos com sucesso!', 'success', false);
        }, 3000);
    }

    testDetailedModeIntegrations() {
        // Simular testes para modo detalhado
        this.showNotification('Testando integrações do modo detalhado...', 'info', false);
        
        const stages = ['RI', 'D', 'E', 'C'];
        let currentStage = 0;
        
        const testNextStage = () => {
            if (currentStage < stages.length) {
                const stage = stages[currentStage];
                this.showNotification(`Teste de integração ${stage} - Slack: OK`, 'success', false);
                currentStage++;
                setTimeout(testNextStage, 1000);
            } else {
                this.showNotification('Todos os testes de integração concluídos com sucesso!', 'success', false);
            }
        };
        
        testNextStage();
    }

    // Funções para gerenciar o seletor de modo
    updateModeSelector() {
        try {
            const timeControlMode = this.modelRidec.timeControlMode || 'detailed';
            
            // Atualizar radio buttons
            const simpleModeRadio = document.getElementById('simpleModeRadio');
            const detailedModeRadio = document.getElementById('detailedModeRadio');
            
            if (simpleModeRadio && detailedModeRadio) {
                if (timeControlMode === 'simple') {
                    simpleModeRadio.checked = true;
                    detailedModeRadio.checked = false;
                } else {
                    simpleModeRadio.checked = false;
                    detailedModeRadio.checked = true;
                }
            }
            
            // Atualizar visibilidade das seções
            this.updateSectionsVisibility(timeControlMode);
            
        } catch (error) {
            console.error('Erro ao atualizar seletor de modo:', error);
        }
    }

    changeTimeControlMode(newMode) {
        try {
            const oldMode = this.modelRidec.timeControlMode || 'detailed';
            
            if (oldMode === newMode) return;
            
            // Confirmar mudança se houver dados que possam ser perdidos
            if (oldMode === 'detailed' && newMode === 'simple') {
                const hasDetailedConfig = this.modelRidec.deadlines && 
                    (this.modelRidec.deadlines.RI || this.modelRidec.deadlines.D || 
                     this.modelRidec.deadlines.E || this.modelRidec.deadlines.C);
                
                if (hasDetailedConfig) {
                    const confirmed = confirm(
                        'Ao mudar para o modo simples, as configurações detalhadas das etapas serão removidas. ' +
                        'Deseja continuar?'
                    );
                    if (!confirmed) {
                        // Reverter seleção
                        this.updateModeSelector();
                        return;
                    }
                }
            }
            
            // Atualizar modo no modelo
            this.modelRidec.timeControlMode = newMode;
            
            // Limpar configurações detalhadas se mudando para simples
            if (newMode === 'simple') {
                this.modelRidec.deadlines = { RI: null, D: null, E: null, C: null };
                this.modelRidec.deadlineUnits = {
                    RI: this.modelRidec.timeUnit || 'hours',
                    D: this.modelRidec.timeUnit || 'hours',
                    E: this.modelRidec.timeUnit || 'hours',
                    C: this.modelRidec.timeUnit || 'hours'
                };
            } else if (newMode === 'detailed' && oldMode === 'simple') {
                // Configurar valores padrão para modo detalhado
                this.modelRidec.deadlines = {
                    RI: 2,
                    D: 4,
                    E: 3,
                    C: 1
                };
                this.modelRidec.deadlineUnits = {
                    RI: this.modelRidec.timeUnit || 'hours',
                    D: this.modelRidec.timeUnit || 'hours',
                    E: this.modelRidec.timeUnit || 'hours',
                    C: this.modelRidec.timeUnit || 'hours'
                };
            }
            
            // Atualizar interface
            this.updateSectionsVisibility(newMode);
            this.updateModelConfig();
            
            // Salvar no localStorage
            this.saveModelToLocalStorage();
            
            // Mostrar notificação
            const modeText = newMode === 'simple' ? 'Simples' : 'Detalhado';
            this.showNotification(`Modo de controle alterado para ${modeText}`, 'success', false);
            
        } catch (error) {
            console.error('Erro ao alterar modo de controle:', error);
            this.showNotification('Erro ao alterar modo de controle', 'error', false);
        }
    }

    updateSectionsVisibility(mode) {
        try {
            const stagesSection = document.getElementById('stagesSection');
            
            if (stagesSection) {
                if (mode === 'simple') {
                    stagesSection.classList.add('hidden');
                    setTimeout(() => {
                        stagesSection.style.display = 'none';
                    }, 300);
                } else {
                    stagesSection.style.display = 'block';
                    setTimeout(() => {
                        stagesSection.classList.remove('hidden');
                    }, 50);
                }
            }
            
            // Atualizar integrações também
            this.updateIntegrationsConfig();
            
        } catch (error) {
            console.error('Erro ao atualizar visibilidade das seções:', error);
        }
    }

    // Funções para controle de etapas com transição automática
    startStage(ridecId, stage) {
        try {
            const ridec = this.ridecs.find(r => r.id === ridecId);
            if (!ridec) {
                this.showNotification('RIDEC não encontrado', 'error', false);
                return;
            }

            if (!this.canStartStage(ridec, stage)) {
                this.showNotification('Não é possível iniciar esta etapa', 'error', false);
                return;
            }

            // Inicializar timers se não existirem
            if (!ridec.stageTimers) {
                ridec.stageTimers = {};
            }

            // Verificar se é a primeira etapa (RI)
            if (stage === 'RI' && !ridec.riStarted) {
                ridec.riStarted = true;
                ridec.riStartTime = Date.now();
            }

            // Inicializar timer da etapa
            if (!ridec.stageTimers[stage]) {
                ridec.stageTimers[stage] = {
                    startTime: Date.now(),
                    elapsed: 0,
                    running: true,
                    startedAt: Date.now()
                };
            } else {
                ridec.stageTimers[stage].startTime = Date.now();
                ridec.stageTimers[stage].running = true;
                ridec.stageTimers[stage].startedAt = Date.now();
            }

            // Atualizar etapa atual
            ridec.currentStage = stage;
            ridec.stageStartTime = Date.now();

            // Salvar no localStorage
            this.saveToLocalStorage();

            // Atualizar interface
            this.renderRidecList();

            // Verificar se a área ganhou premiação
            setTimeout(() => {
                this.updateAreaAward();
            }, 500);

            this.showNotification(`Etapa ${stage} iniciada`, 'success', false);

        } catch (error) {
            console.error('Erro ao iniciar etapa:', error);
            this.showNotification('Erro ao iniciar etapa', 'error', false);
        }
    }

    finishStage(ridecId, stage) {
        try {
            const ridec = this.ridecs.find(r => r.id === ridecId);
            if (!ridec) {
                this.showNotification('RIDEC não encontrado', 'error', false);
                return;
            }

            // Parar timer da etapa atual
            if (ridec.stageTimers && ridec.stageTimers[stage]) {
                const endTime = Date.now();
                const startTime = ridec.stageTimers[stage].startTime;
                ridec.stageTimers[stage].elapsed += (endTime - startTime);
                ridec.stageTimers[stage].running = false;
                ridec.stageTimers[stage].completedAt = endTime;
            }

            // Marcar etapa como concluída
            if (!ridec.completedStages) {
                ridec.completedStages = [];
            }
            if (!ridec.completedStages.includes(stage)) {
                ridec.completedStages.push(stage);
            }

            // Verificar se é a última etapa
            const stages = ['RI', 'D', 'E', 'C'];
            const currentIndex = stages.indexOf(stage);
            const nextStage = stages[currentIndex + 1];

            if (nextStage) {
                // Inicializar próxima etapa sem começar a contagem
                if (!ridec.stageTimers) {
                    ridec.stageTimers = {};
                }
                ridec.stageTimers[nextStage] = {
                    startTime: null,
                    elapsed: 0,
                    running: false,
                    readyToStart: true
                };

                // Atualizar etapa atual
                ridec.currentStage = nextStage;

                // Mostrar notificação para iniciar próxima etapa
                this.showNotification(`Etapa ${stage} concluída. Clique em "Iniciar Etapa" para começar ${nextStage}.`, 'success', false);
            } else {
                // Última etapa concluída - finalizar RIDEC
                ridec.completed = true;
                ridec.completedAt = Date.now();
                this.showNotification('RIDEC concluído com sucesso!', 'success', false);
            }

            // Salvar no localStorage
            this.saveToLocalStorage();

            // Atualizar interface
            this.renderRidecList();

            // Verificar se a área ganhou premiação
            setTimeout(() => {
                this.updateAreaAward();
            }, 500);

        } catch (error) {
            console.error('Erro ao finalizar etapa:', error);
            this.showNotification('Erro ao finalizar etapa', 'error', false);
        }
    }

    // Verificar se todos os RIDECs da área estão no prazo
    checkAreaPerformance() {
        try {
            if (!this.ridecs || this.ridecs.length === 0) {
                return false;
            }
            
            // Verificar se todos os RIDECs estão no prazo
            const allOnTime = this.ridecs.every(ridec => {
                if (ridec.completed) {
                    return true; // RIDECs concluídos são considerados no prazo
                }
                return !this.isOverdue(ridec);
            });
            
            // Verificar se há pelo menos 3 RIDECs para considerar uma premiação
            const hasMinimumRidecs = this.ridecs.length >= 3;
            
            return allOnTime && hasMinimumRidecs;
        } catch (error) {
            console.error('Erro ao verificar performance da área:', error);
            return false;
        }
    }

    // Mostrar premiação da área
    showAreaAward() {
        try {
            const awardContainer = document.getElementById('areaAwardContainer');
            if (!awardContainer) {
                console.error('Container de premiação não encontrado');
                return;
            }
            
            const isEligible = this.checkAreaPerformance();
            
            if (isEligible) {
                awardContainer.innerHTML = `
                    <div class="area-award">
                        <div class="award-content">
                            <div class="award-icon">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="award-text">
                                <h3>🏆 Área em Excelência!</h3>
                                <p>Todos os ${this.ridecs.length} RIDECs da área "${this.ridecType}" estão no prazo!</p>
                                <div class="award-stats">
                                    <div class="award-stat">
                                        <i class="fas fa-check-circle"></i>
                                        <span>100% no prazo</span>
                                    </div>
                                    <div class="award-stat">
                                        <i class="fas fa-clock"></i>
                                        <span>Eficiência máxima</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="award-particles">
                            <div class="particle"></div>
                            <div class="particle"></div>
                            <div class="particle"></div>
                            <div class="particle"></div>
                            <div class="particle"></div>
                        </div>
                    </div>
                `;
                awardContainer.style.display = 'block';
                
                // Adicionar animação de confete
                this.createConfetti();
            } else {
                awardContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao mostrar premiação da área:', error);
        }
    }

    // Criar efeito de confete
    createConfetti() {
        try {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            confettiContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            `;
            
            document.body.appendChild(confettiContainer);
            
            // Criar confetes
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.cssText = `
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        background: ${colors[Math.floor(Math.random() * colors.length)]};
                        left: ${Math.random() * 100}%;
                        top: -10px;
                        animation: confetti-fall 3s linear forwards;
                        border-radius: 2px;
                    `;
                    confettiContainer.appendChild(confetti);
                    
                    // Remover confete após animação
                    setTimeout(() => {
                        if (confetti.parentNode) {
                            confetti.parentNode.removeChild(confetti);
                        }
                    }, 3000);
                }, i * 100);
            }
            
            // Remover container após 4 segundos
            setTimeout(() => {
                if (confettiContainer.parentNode) {
                    confettiContainer.parentNode.removeChild(confettiContainer);
                }
            }, 4000);
        } catch (error) {
            console.error('Erro ao criar confete:', error);
        }
    }

    // Atualizar premiação da área
    updateAreaAward() {
        const wasEligible = this.checkAreaPerformance();
        this.showAreaAward();
        
        // Se acabou de se tornar elegível, mostrar notificação especial
        const isEligible = this.checkAreaPerformance();
        if (isEligible && !wasEligible) {
            this.showAwardNotification();
        }
    }

    // Mostrar notificação especial de premiação
    showAwardNotification() {
        try {
            const notification = document.createElement('div');
            notification.className = 'award-notification';
            
            notification.innerHTML = `
                <div class="award-notification-content">
                    <div class="award-notification-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="award-notification-text">
                        <h4>🏆 Parabéns!</h4>
                        <p>Sua área "${this.ridecType}" está em excelência!</p>
                        <p>Todos os RIDECs estão no prazo!</p>
                    </div>
                </div>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                z-index: 1001;
                max-width: 350px;
                animation: award-notification-slide 0.5s ease;
                border: 2px solid #ffd700;
            `;
            
            document.body.appendChild(notification);
            
            // Remover após 5 segundos
            setTimeout(() => {
                notification.style.animation = 'award-notification-slide-out 0.5s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }, 5000);
        } catch (error) {
            console.error('Erro ao mostrar notificação de premiação:', error);
        }
    }
}

// Inicializar a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.ridecTypeDetails = new RIDECTypeDetails();
}); 
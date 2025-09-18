// Sistema de Ocorrências RIDEC
class RIDECOccurrences {
    constructor() {
        this.occurrences = [];
        this.filteredOccurrences = [];
        this.filters = {
            title: '',
            model: '',
            status: '',
            area: '',
            date: ''
        };
        
        // Sistema de timer para etapas
        this.activeTimers = new Map(); // Map para armazenar timers ativos
        this.stageTimers = new Map(); // Map para armazenar tempo acumulado das etapas
        
        this.init();
    }

    init() {
        this.loadOccurrences();
        this.initializeStageTimers();
        this.setupEventListeners();
        this.renderOccurrences();
        this.updateStats();
    }

    // Carregar dados de ocorrências (simulado)
    loadOccurrences() {
        // Dados de exemplo - em produção viriam de uma API
        this.occurrences = [
            {
                id: 1,
                title: 'Implementação de Sistema de Backup',
                model: 'modelo-a',
                modelName: 'Modelo A',
                status: 'active',
                area: 'ti',
                areaName: 'TI',
                createdAt: '2024-01-15',
                deadline: '2024-02-15',
                progress: 65,
                description: 'Implementação de sistema de backup automatizado para servidores críticos',
                priority: 'alta',
                responsible: 'João Silva',
                stages: [
                    { name: 'Análise', status: 'completed', time: '2h 30m', timeMs: 9000000 },
                    { name: 'Desenvolvimento', status: 'active', time: '5h 45m', timeMs: 20700000 },
                    { name: 'Testes', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Deploy', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            },
            {
                id: 2,
                title: 'Atualização de Políticas de RH',
                model: 'modelo-b',
                modelName: 'Modelo B',
                status: 'completed',
                area: 'rh',
                areaName: 'RH',
                createdAt: '2024-01-10',
                deadline: '2024-01-25',
                progress: 100,
                description: 'Revisão e atualização das políticas internas de recursos humanos',
                priority: 'média',
                responsible: 'Maria Santos',
                stages: [
                    { name: 'Revisão', status: 'completed', time: '3h 15m', timeMs: 11700000 },
                    { name: 'Aprovação', status: 'completed', time: '1h 30m', timeMs: 5400000 },
                    { name: 'Implementação', status: 'completed', time: '4h 20m', timeMs: 15600000 },
                    { name: 'Treinamento', status: 'completed', time: '2h 45m', timeMs: 9900000 }
                ]
            },
            {
                id: 3,
                title: 'Auditoria Financeira Trimestral',
                model: 'modelo-c',
                modelName: 'Modelo C',
                status: 'overdue',
                area: 'financeiro',
                areaName: 'Financeiro',
                createdAt: '2024-01-05',
                deadline: '2024-01-20',
                progress: 40,
                description: 'Auditoria financeira do primeiro trimestre do ano',
                priority: 'alta',
                responsible: 'Carlos Oliveira',
                stages: [
                    { name: 'Coleta de Dados', status: 'completed', time: '6h 20m', timeMs: 22800000 },
                    { name: 'Análise', status: 'active', time: '8h 15m', timeMs: 29700000 },
                    { name: 'Relatório', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Apresentação', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            },
            {
                id: 4,
                title: 'Otimização de Processos Operacionais',
                model: 'modelo-d',
                modelName: 'Modelo D',
                status: 'pending',
                area: 'operacional',
                areaName: 'Operacional',
                createdAt: '2024-01-20',
                deadline: '2024-03-01',
                progress: 0,
                description: 'Análise e otimização dos processos operacionais da empresa',
                priority: 'média',
                responsible: 'Ana Costa',
                stages: [
                    { name: 'Mapeamento', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Análise', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Proposta', status: 'pending', time: '0h 0m', timeMs: 0 },
                    { name: 'Implementação', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            },
            {
                id: 5,
                title: 'Migração de Dados para Cloud',
                model: 'modelo-a',
                modelName: 'Modelo A',
                status: 'active',
                area: 'ti',
                areaName: 'TI',
                createdAt: '2024-01-18',
                deadline: '2024-02-28',
                progress: 30,
                description: 'Migração de dados críticos para infraestrutura em nuvem',
                priority: 'alta',
                responsible: 'Pedro Lima',
                stages: [
                    { name: 'Planejamento', status: 'completed', time: '4h 10m', timeMs: 15000000 },
                    { name: 'Preparação', status: 'completed', time: '3h 45m', timeMs: 13500000 },
                    { name: 'Migração', status: 'active', time: '12h 30m', timeMs: 45000000 },
                    { name: 'Validação', status: 'pending', time: '0h 0m', timeMs: 0 }
                ]
            }
        ];
        
        this.filteredOccurrences = [...this.occurrences];
    }

    // Configurar event listeners
    setupEventListeners() {
        // Filtros
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // Busca em tempo real
        document.getElementById('searchTitle').addEventListener('input', (e) => {
            this.filters.title = e.target.value;
            this.applyFilters();
        });

        // Filtros de select
        document.getElementById('filterModel').addEventListener('change', (e) => {
            this.filters.model = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterArea').addEventListener('change', (e) => {
            this.filters.area = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterDate').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.applyFilters();
        });

        // Botão criar primeira ocorrência
        document.getElementById('createFirstOccurrence').addEventListener('click', () => {
            this.showCreateOccurrenceModal();
        });
    }

    // Aplicar filtros
    applyFilters() {
        this.filteredOccurrences = this.occurrences.filter(occurrence => {
            const titleMatch = !this.filters.title || 
                occurrence.title.toLowerCase().includes(this.filters.title.toLowerCase());
            
            const modelMatch = !this.filters.model || 
                occurrence.model === this.filters.model;
            
            const statusMatch = !this.filters.status || 
                occurrence.status === this.filters.status;
            
            const areaMatch = !this.filters.area || 
                occurrence.area === this.filters.area;
            
            const dateMatch = !this.filters.date || 
                occurrence.createdAt === this.filters.date;

            return titleMatch && modelMatch && statusMatch && areaMatch && dateMatch;
        });

        this.renderOccurrences();
        this.updateStats();
    }

    // Limpar filtros
    clearFilters() {
        this.filters = {
            title: '',
            model: '',
            status: '',
            area: '',
            date: ''
        };

        // Limpar campos
        document.getElementById('searchTitle').value = '';
        document.getElementById('filterModel').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterArea').value = '';
        document.getElementById('filterDate').value = '';

        this.filteredOccurrences = [...this.occurrences];
        this.renderOccurrences();
        this.updateStats();
    }

    // Renderizar ocorrências
    renderOccurrences() {
        const grid = document.getElementById('occurrencesGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredOccurrences.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        grid.innerHTML = this.filteredOccurrences.map(occurrence => 
            this.createOccurrenceCard(occurrence)
        ).join('');

        // Adicionar event listeners aos botões dos cards
        this.setupCardEventListeners();
    }

    // Criar card de ocorrência
    createOccurrenceCard(occurrence) {
        const statusClass = this.getStatusClass(occurrence.status);
        const statusText = this.getStatusText(occurrence.status);
        const progressClass = occurrence.status === 'overdue' ? 'overdue' : 
                            occurrence.status === 'completed' ? 'completed' : '';

        const stagesHtml = occurrence.stages.map((stage, index) => {
            const stageIcon = this.getStageIcon(stage.status);
            const stageClass = this.getStageClass(stage.status);
            const statusText = this.getStatusText(stage.status);
            
            // Determinar botões baseado no status
            let startButton = '';
            let stopButton = '';
            let completeButton = '';
            
            if (stage.status === 'pending') {
                startButton = `<button class="btn-stage btn-start" onclick="ridecOccurrences.startStage(${occurrence.id}, ${index})">
                    <i class="fas fa-play"></i> Iniciar
                </button>`;
            } else if (stage.status === 'active') {
                stopButton = `<button class="btn-stage btn-stop" onclick="ridecOccurrences.stopStage(${occurrence.id}, ${index})">
                    <i class="fas fa-pause"></i> Pausar
                </button>`;
                completeButton = `<button class="btn-stage btn-complete" onclick="ridecOccurrences.completeStage(${occurrence.id}, ${index})">
                    <i class="fas fa-check"></i> Concluir
                </button>`;
            } else if (stage.status === 'completed') {
                completeButton = `<button class="btn-stage btn-complete" disabled>
                    <i class="fas fa-check"></i> Concluída
                </button>`;
            }
            
            return `
                <div class="stage-card ${stageClass}" data-occurrence-id="${occurrence.id}" data-stage-index="${index}">
                    <div class="stage-header">
                        <div class="stage-icon ${stageClass}">
                            <i class="${stageIcon}"></i>
                        </div>
                        <div class="stage-info">
                            <div class="stage-name">${stage.name}</div>
                            <div class="stage-status ${stageClass}">${statusText}</div>
                        </div>
                    </div>
                    
                    <div class="stage-progress">
                        <div class="stage-progress-bar">
                            <div class="stage-progress-fill ${stageClass}"></div>
                        </div>
                    </div>
                    
                    <div class="stage-timer">
                        <div class="timer-display" id="timer-${occurrence.id}-${index}">${stage.time}</div>
                        <div class="timer-label">Tempo de Execução</div>
                    </div>
                    
                    <div class="stage-actions">
                        ${startButton}
                        ${stopButton}
                        ${completeButton}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="occurrence-card" data-id="${occurrence.id}">
                <div class="occurrence-header">
                    <h3 class="occurrence-title">${occurrence.title}</h3>
                    <span class="occurrence-badge badge-${occurrence.status}">${statusText}</span>
                </div>
                
                <div class="occurrence-info">
                    <div class="info-item">
                        <span class="info-label">Modelo</span>
                        <span class="info-value">${occurrence.modelName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Área</span>
                        <span class="info-value">${occurrence.areaName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Responsável</span>
                        <span class="info-value">${occurrence.responsible}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Prioridade</span>
                        <span class="info-value">${occurrence.priority}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Criado em</span>
                        <span class="info-value">${this.formatDate(occurrence.createdAt)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Prazo</span>
                        <span class="info-value">${this.formatDate(occurrence.deadline)}</span>
                    </div>
                </div>

                <div class="occurrence-progress">
                    <div class="progress-header">
                        <span class="progress-label">Progresso</span>
                        <span class="progress-percentage">${occurrence.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${occurrence.progress}%"></div>
                    </div>
                </div>

                <div class="occurrence-stages">
                    <div class="stages-header">
                        <i class="fas fa-tasks"></i>
                        <h4 class="stages-title">Etapas do Processo</h4>
                    </div>
                    <div class="stages-grid">
                        ${stagesHtml}
                    </div>
                </div>

                <div class="occurrence-actions">
                    <button class="btn-action btn-view" onclick="ridecOccurrences.viewOccurrence(${occurrence.id})">
                        <i class="fas fa-eye"></i>
                        Visualizar
                    </button>
                    <button class="btn-action btn-edit" onclick="ridecOccurrences.editOccurrence(${occurrence.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-action btn-delete" onclick="ridecOccurrences.deleteOccurrence(${occurrence.id})">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }

    // Configurar event listeners dos cards
    setupCardEventListeners() {
        // Event listeners já estão nos botões via onclick
    }

    // Atualizar estatísticas
    updateStats() {
        const total = this.filteredOccurrences.length;
        const active = this.filteredOccurrences.filter(o => o.status === 'active').length;
        const completed = this.filteredOccurrences.filter(o => o.status === 'completed').length;
        const overdue = this.filteredOccurrences.filter(o => o.status === 'overdue').length;
        const pending = this.filteredOccurrences.filter(o => o.status === 'pending').length;

        // Header stats
        document.getElementById('totalOccurrences').textContent = total;
        document.getElementById('activeOccurrences').textContent = active;
        document.getElementById('completedOccurrences').textContent = completed;
        document.getElementById('overdueOccurrences').textContent = overdue;

        // Summary stats
        document.getElementById('summaryActive').textContent = active;
        document.getElementById('summaryCompleted').textContent = completed;
        document.getElementById('summaryOverdue').textContent = overdue;
        document.getElementById('summaryPending').textContent = pending;
    }

    // Utilitários
    getStatusClass(status) {
        const classes = {
            'active': 'active',
            'completed': 'completed',
            'overdue': 'overdue',
            'pending': 'pending'
        };
        return classes[status] || 'pending';
    }

    getStatusText(status) {
        const texts = {
            'active': 'Ativa',
            'completed': 'Concluída',
            'overdue': 'Atrasada',
            'pending': 'Pendente'
        };
        return texts[status] || 'Pendente';
    }

    getStageIcon(status) {
        const icons = {
            'completed': 'fas fa-check',
            'active': 'fas fa-play',
            'pending': 'fas fa-clock',
            'overdue': 'fas fa-exclamation'
        };
        return icons[status] || 'fas fa-clock';
    }

    getStageClass(status) {
        const classes = {
            'completed': 'complete',
            'active': 'progress',
            'pending': 'start',
            'overdue': 'overdue'
        };
        return classes[status] || 'start';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Ações dos cards
    viewOccurrence(id) {
        const occurrence = this.occurrences.find(o => o.id === id);
        if (occurrence) {
            this.showOccurrenceDetails(occurrence);
        }
    }

    editOccurrence(id) {
        const occurrence = this.occurrences.find(o => o.id === id);
        if (occurrence) {
            this.showEditOccurrenceModal(occurrence);
        }
    }

    deleteOccurrence(id) {
        const occurrence = this.occurrences.find(o => o.id === id);
        if (occurrence) {
            if (confirm(`Tem certeza que deseja excluir a ocorrência "${occurrence.title}"?`)) {
                this.occurrences = this.occurrences.filter(o => o.id !== id);
                this.applyFilters();
                this.showNotification('Ocorrência excluída com sucesso!', 'success');
            }
        }
    }

    // Modal de detalhes da ocorrência
    showOccurrenceDetails(occurrence) {
        const modal = document.createElement('div');
        modal.className = 'modal modern-modal';
        modal.innerHTML = `
            <div class="modal-content modern-modal-content">
                <div class="modal-header modern-header">
                    <div class="modal-title-section">
                        <div class="modal-icon">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <div class="modal-title-content">
                            <h2>${occurrence.title}</h2>
                            <p class="modal-subtitle">Detalhes da Ocorrência</p>
                        </div>
                    </div>
                    <span class="close modern-close">&times;</span>
                </div>
                <div class="modal-body modern-body">
                    <div style="padding: 30px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <div>
                                <h4 style="margin-bottom: 10px; color: #1e293b;">Informações Gerais</h4>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
                                    <p><strong>Modelo:</strong> ${occurrence.modelName}</p>
                                    <p><strong>Área:</strong> ${occurrence.areaName}</p>
                                    <p><strong>Responsável:</strong> ${occurrence.responsible}</p>
                                    <p><strong>Prioridade:</strong> ${occurrence.priority}</p>
                                    <p><strong>Status:</strong> ${this.getStatusText(occurrence.status)}</p>
                                    <p><strong>Criado em:</strong> ${this.formatDate(occurrence.createdAt)}</p>
                                    <p><strong>Prazo:</strong> ${this.formatDate(occurrence.deadline)}</p>
                                </div>
                            </div>
                            <div>
                                <h4 style="margin-bottom: 10px; color: #1e293b;">Progresso</h4>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
                                    <div style="margin-bottom: 15px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span>Progresso Geral</span>
                                            <span>${occurrence.progress}%</span>
                                        </div>
                                        <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                            <div style="width: ${occurrence.progress}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
                                        </div>
                                    </div>
                                    <p><strong>Descrição:</strong></p>
                                    <p style="color: #64748b; line-height: 1.5;">${occurrence.description}</p>
                                </div>
                            </div>
                        </div>
                        
                        <h4 style="margin-bottom: 15px; color: #1e293b;">Etapas do Processo</h4>
                        <div style="display: grid; gap: 10px;">
                            ${occurrence.stages.map(stage => `
                                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8fafc; border-radius: 10px;">
                                    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${this.getStageColor(stage.status)}; display: flex; align-items: center; justify-content: center; color: white;">
                                        <i class="${this.getStageIcon(stage.status)}"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #1e293b;">${stage.name}</div>
                                        <div style="font-size: 0.9rem; color: #64748b;">${stage.time}</div>
                                    </div>
                                    <span style="padding: 4px 8px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; background: ${this.getStatusBadgeColor(stage.status)}; color: ${this.getStatusBadgeTextColor(stage.status)};">
                                        ${this.getStatusText(stage.status)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Utilitários para cores
    getStageColor(status) {
        const colors = {
            'completed': '#10b981',
            'active': '#f59e0b',
            'pending': '#6b7280',
            'overdue': '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    getStatusBadgeColor(status) {
        const colors = {
            'completed': '#dcfce7',
            'active': '#fef3c7',
            'pending': '#f1f5f9',
            'overdue': '#fef2f2'
        };
        return colors[status] || '#f1f5f9';
    }

    getStatusBadgeTextColor(status) {
        const colors = {
            'completed': '#166534',
            'active': '#d97706',
            'pending': '#475569',
            'overdue': '#dc2626'
        };
        return colors[status] || '#475569';
    }

    // Modal de criação de ocorrência
    showCreateOccurrenceModal() {
        this.showNotification('Funcionalidade de criação será implementada em breve!', 'info');
    }

    // Modal de edição de ocorrência
    showEditOccurrenceModal(occurrence) {
        this.showNotification('Funcionalidade de edição será implementada em breve!', 'info');
    }

    // Métodos para controle de etapas
    startStage(occurrenceId, stageIndex) {
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.stages[stageIndex]) return;

        const stage = occurrence.stages[stageIndex];
        const timerKey = `${occurrenceId}-${stageIndex}`;
        
        // Inicializar timer se não existir
        if (!this.stageTimers.has(timerKey)) {
            this.stageTimers.set(timerKey, 0);
        }
        
        // Iniciar timer
        const startTime = Date.now();
        this.activeTimers.set(timerKey, startTime);
        
        // Atualizar status da etapa
        stage.status = 'active';
        
        // Atualizar interface
        this.updateStageCard(occurrenceId, stageIndex);
        this.updateOccurrenceProgress(occurrenceId);
        this.renderOccurrences();
        
        this.showNotification(`Etapa "${stage.name}" iniciada!`, 'success');
    }

    stopStage(occurrenceId, stageIndex) {
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.stages[stageIndex]) return;

        const stage = occurrence.stages[stageIndex];
        const timerKey = `${occurrenceId}-${stageIndex}`;
        
        // Parar timer e acumular tempo
        const startTime = this.activeTimers.get(timerKey);
        if (startTime) {
            const elapsed = Date.now() - startTime;
            const currentAccumulated = this.stageTimers.get(timerKey) || 0;
            this.stageTimers.set(timerKey, currentAccumulated + elapsed);
            this.activeTimers.delete(timerKey);
        }
        
        // Atualizar status da etapa
        stage.status = 'pending';
        
        // Atualizar tempo da etapa
        const totalTime = this.stageTimers.get(timerKey) || 0;
        stage.time = this.formatTime(totalTime);
        stage.timeMs = totalTime;
        
        // Atualizar interface
        this.updateStageCard(occurrenceId, stageIndex);
        this.updateOccurrenceProgress(occurrenceId);
        this.renderOccurrences();
        
        this.showNotification(`Etapa "${stage.name}" pausada!`, 'warning');
    }

    completeStage(occurrenceId, stageIndex) {
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.stages[stageIndex]) return;

        const stage = occurrence.stages[stageIndex];
        const timerKey = `${occurrenceId}-${stageIndex}`;
        
        // Parar timer e acumular tempo final
        const startTime = this.activeTimers.get(timerKey);
        if (startTime) {
            const elapsed = Date.now() - startTime;
            const currentAccumulated = this.stageTimers.get(timerKey) || 0;
            this.stageTimers.set(timerKey, currentAccumulated + elapsed);
            this.activeTimers.delete(timerKey);
        }
        
        // Atualizar status da etapa
        stage.status = 'completed';
        
        // Atualizar tempo da etapa
        const totalTime = this.stageTimers.get(timerKey) || 0;
        stage.time = this.formatTime(totalTime);
        stage.timeMs = totalTime;
        
        // Atualizar interface
        this.updateStageCard(occurrenceId, stageIndex);
        this.updateOccurrenceProgress(occurrenceId);
        this.renderOccurrences();
        
        this.showNotification(`Etapa "${stage.name}" concluída!`, 'success');
    }

    updateStageCard(occurrenceId, stageIndex) {
        const timerKey = `${occurrenceId}-${stageIndex}`;
        const timerElement = document.getElementById(`timer-${occurrenceId}-${stageIndex}`);
        
        if (timerElement) {
            const totalTime = this.stageTimers.get(timerKey) || 0;
            const isActive = this.activeTimers.has(timerKey);
            
            if (isActive) {
                // Timer ativo - atualizar em tempo real
                const startTime = this.activeTimers.get(timerKey);
                const currentElapsed = Date.now() - startTime;
                const displayTime = totalTime + currentElapsed;
                timerElement.textContent = this.formatTime(displayTime);
                
                // Agendar próxima atualização
                setTimeout(() => this.updateStageCard(occurrenceId, stageIndex), 1000);
            } else {
                // Timer parado - mostrar tempo acumulado
                timerElement.textContent = this.formatTime(totalTime);
            }
        }
    }

    updateOccurrenceProgress(occurrenceId) {
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence) return;

        const totalStages = occurrence.stages.length;
        const completedStages = occurrence.stages.filter(s => s.status === 'completed').length;
        const activeStages = occurrence.stages.filter(s => s.status === 'active').length;
        
        // Calcular progresso
        let progress = 0;
        if (totalStages > 0) {
            progress = Math.round((completedStages / totalStages) * 100);
        }
        
        // Atualizar progresso da ocorrência
        occurrence.progress = progress;
        
        // Atualizar status da ocorrência
        if (completedStages === totalStages) {
            occurrence.status = 'completed';
        } else if (activeStages > 0) {
            occurrence.status = 'active';
        } else if (occurrence.progress > 0) {
            occurrence.status = 'pending';
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    initializeStageTimers() {
        // Inicializar timers com dados existentes
        this.occurrences.forEach(occurrence => {
            occurrence.stages.forEach((stage, index) => {
                const timerKey = `${occurrence.id}-${index}`;
                if (stage.timeMs) {
                    this.stageTimers.set(timerKey, stage.timeMs);
                }
            });
        });
    }

    // Sistema de notificações
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 10px;
            padding: 15px 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            border-left: 4px solid ${this.getNotificationColor(type)};
            animation: slideInRight 0.3s ease;
        `;

        const icon = document.createElement('i');
        icon.className = this.getNotificationIcon(type);
        icon.style.color = this.getNotificationColor(type);

        const text = document.createElement('span');
        text.textContent = message;

        notification.appendChild(icon);
        notification.appendChild(text);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-info-circle';
    }
}

    // Inicializar o sistema quando a página carregar
    let ridecOccurrences;
    document.addEventListener('DOMContentLoaded', () => {
        ridecOccurrences = new RIDECOccurrences();
    });

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 
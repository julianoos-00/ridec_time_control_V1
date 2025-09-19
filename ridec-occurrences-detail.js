// Sistema de Ocorrências de RIDEC Específico
class RIDECOccurrencesDetail {
    constructor() {
        this.ridecId = this.getRidecIdFromUrl();
        this.ridec = null;
        this.occurrences = [];
        this.filteredOccurrences = [];
        this.filters = {
            title: '',
            status: '',
            date: ''
        };
        
        this.init();
    }

    init() {
        this.loadRidecData();
        this.loadOccurrences();
        this.setupEventListeners();
        this.renderOccurrences();
        this.updateStats();
    }

    // Obter ID do RIDEC da URL
    getRidecIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ridecId');
    }

    // Carregar dados do RIDEC modelo
    loadRidecData() {
        const ridecs = JSON.parse(localStorage.getItem('ridecs')) || [];
        this.ridec = ridecs.find(ridec => ridec.id === this.ridecId);
        
        if (!this.ridec) {
            this.showError('RIDEC não encontrado');
            return;
        }

        // Atualizar informações do header
        document.getElementById('ridecTitle').textContent = `Ocorrências: ${this.ridec.title}`;
        document.getElementById('ridecDescription').textContent = this.ridec.description;
    }

    // Carregar ocorrências do RIDEC
    loadOccurrences() {
        const ridecs = JSON.parse(localStorage.getItem('ridecs')) || [];
        this.occurrences = ridecs.filter(ridec => 
            ridec.isOccurrence && ridec.modelRidecId === this.ridecId
        );
        this.filteredOccurrences = [...this.occurrences];
    }

    // Configurar event listeners
    setupEventListeners() {
        // Filtros
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Busca por título
        document.getElementById('searchTitle').addEventListener('input', (e) => {
            this.filters.title = e.target.value;
            this.applyFilters();
        });

        // Filtro de status
        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        // Filtro de data
        document.getElementById('filterDate').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.applyFilters();
        });

        // Botões de criar ocorrência
        document.getElementById('createOccurrenceBtn').addEventListener('click', () => {
            this.createOccurrence();
        });

        document.getElementById('createFirstOccurrence').addEventListener('click', () => {
            this.createOccurrence();
        });
    }

    // Aplicar filtros
    applyFilters() {
        this.filteredOccurrences = this.occurrences.filter(occurrence => {
            // Filtro por título
            if (this.filters.title && !occurrence.title.toLowerCase().includes(this.filters.title.toLowerCase())) {
                return false;
            }

            // Filtro por status
            if (this.filters.status) {
                const status = this.getOccurrenceStatus(occurrence);
                if (status !== this.filters.status) {
                    return false;
                }
            }

            // Filtro por data
            if (this.filters.date) {
                const occurrenceDate = new Date(occurrence.startTime).toISOString().split('T')[0];
                if (occurrenceDate !== this.filters.date) {
                    return false;
                }
            }

            return true;
        });

        this.renderOccurrences();
        this.updateStats();
    }

    // Limpar filtros
    clearFilters() {
        this.filters = {
            title: '',
            status: '',
            date: ''
        };

        document.getElementById('searchTitle').value = '';
        document.getElementById('filterStatus').value = '';
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

        this.setupCardEventListeners();
    }

    // Criar card de ocorrência
    createOccurrenceCard(occurrence) {
        const status = this.getOccurrenceStatus(occurrence);
        const progress = this.calculateProgress(occurrence);
        const elapsedTime = this.formatElapsedTime(occurrence.startTime);

        return `
            <div class="ridec-occurrence-card" data-id="${occurrence.id}">
                <div class="ridec-occurrence-header">
                    <h3 class="ridec-occurrence-title">${occurrence.title}</h3>
                    <span class="ridec-occurrence-badge ${status}">${this.getStatusText(status)}</span>
                </div>

                <div class="ridec-occurrence-info">
                    <div class="ridec-info-item">
                        <span class="ridec-info-label">Área</span>
                        <span class="ridec-info-value">${occurrence.area}</span>
                    </div>
                    <div class="ridec-info-item">
                        <span class="ridec-info-label">Tempo Máximo</span>
                        <span class="ridec-info-value">${occurrence.maxTime}h</span>
                    </div>
                    <div class="ridec-info-item">
                        <span class="ridec-info-label">Iniciado</span>
                        <span class="ridec-info-value">${elapsedTime}</span>
                    </div>
                    <div class="ridec-info-item">
                        <span class="ridec-info-label">Etapa Atual</span>
                        <span class="ridec-info-value">${this.getCurrentStage(occurrence)}</span>
                    </div>
                </div>

                <div class="ridec-occurrence-progress">
                    <div class="ridec-progress-header">
                        <span class="ridec-progress-label">Progresso Geral</span>
                        <span class="ridec-progress-percentage">${progress}%</span>
                    </div>
                    <div class="ridec-progress-bar">
                        <div class="ridec-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="ridec-occurrence-stages">
                    <h4 class="ridec-stages-title">Etapas</h4>
                    <div class="ridec-stages-list">
                        ${this.renderStages(occurrence)}
                    </div>
                </div>

                <div class="ridec-occurrence-actions">
                    <button class="btn-ridec-action primary" onclick="ridecOccurrencesDetail.viewOccurrence('${occurrence.id}')">
                        <i class="fas fa-eye"></i>
                        Visualizar
                    </button>
                    <button class="btn-ridec-action secondary" onclick="ridecOccurrencesDetail.editOccurrence('${occurrence.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-ridec-action danger" onclick="ridecOccurrencesDetail.deleteOccurrence('${occurrence.id}')">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }

    // Renderizar etapas
    renderStages(occurrence) {
        if (!occurrence.stages || occurrence.stages.length === 0) {
            return '<p style="color: #64748b; font-style: italic;">Nenhuma etapa definida</p>';
        }

        return occurrence.stages.map(stage => `
            <div class="ridec-stage-item">
                <div class="ridec-stage-icon ${stage.status}">
                    <i class="fas ${this.getStageIcon(stage.status)}"></i>
                </div>
                <div class="ridec-stage-info">
                    <p class="ridec-stage-name">${stage.name}</p>
                    <p class="ridec-stage-time">${stage.time}</p>
                </div>
            </div>
        `).join('');
    }

    // Configurar event listeners dos cards
    setupCardEventListeners() {
        // Event listeners específicos dos cards podem ser adicionados aqui
    }

    // Atualizar estatísticas
    updateStats() {
        const total = this.filteredOccurrences.length;
        const active = this.filteredOccurrences.filter(o => this.getOccurrenceStatus(o) === 'active').length;
        const completed = this.filteredOccurrences.filter(o => this.getOccurrenceStatus(o) === 'completed').length;
        const overdue = this.filteredOccurrences.filter(o => this.getOccurrenceStatus(o) === 'overdue').length;

        document.getElementById('totalOccurrences').textContent = total;
        document.getElementById('activeOccurrences').textContent = active;
        document.getElementById('completedOccurrences').textContent = completed;
        document.getElementById('overdueOccurrences').textContent = overdue;
    }

    // Obter status da ocorrência
    getOccurrenceStatus(occurrence) {
        if (occurrence.completed) {
            return 'completed';
        }
        
        if (this.isOverdue(occurrence)) {
            return 'overdue';
        }
        
        if (occurrence.stages && occurrence.stages.some(stage => stage.status === 'active')) {
            return 'active';
        }
        
        return 'pending';
    }

    // Verificar se está atrasado
    isOverdue(occurrence) {
        const now = Date.now();
        const startTime = occurrence.startTime;
        const maxTimeMs = occurrence.maxTime * 60 * 60 * 1000; // Converter horas para milissegundos
        
        return (now - startTime) > maxTimeMs;
    }

    // Calcular progresso
    calculateProgress(occurrence) {
        if (!occurrence.stages || occurrence.stages.length === 0) {
            return 0;
        }

        const completedStages = occurrence.stages.filter(stage => stage.status === 'completed').length;
        return Math.round((completedStages / occurrence.stages.length) * 100);
    }

    // Obter texto do status
    getStatusText(status) {
        const statusMap = {
            'completed': 'Concluída',
            'active': 'Ativa',
            'overdue': 'Atrasada',
            'pending': 'Pendente'
        };
        return statusMap[status] || status;
    }

    // Obter ícone da etapa
    getStageIcon(status) {
        const iconMap = {
            'completed': 'fa-check',
            'active': 'fa-play',
            'pending': 'fa-clock'
        };
        return iconMap[status] || 'fa-circle';
    }

    // Obter etapa atual
    getCurrentStage(occurrence) {
        if (!occurrence.stages || occurrence.stages.length === 0) {
            return 'N/A';
        }

        const activeStage = occurrence.stages.find(stage => stage.status === 'active');
        if (activeStage) {
            return activeStage.name;
        }

        const lastCompletedStage = occurrence.stages.filter(stage => stage.status === 'completed').pop();
        if (lastCompletedStage) {
            return lastCompletedStage.name;
        }

        return occurrence.stages[0].name;
    }

    // Formatar tempo decorrido
    formatElapsedTime(startTime) {
        const now = Date.now();
        const elapsed = now - startTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} dia${days > 1 ? 's' : ''} atrás`;
        } else if (hours > 0) {
            return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        } else {
            return 'Agora mesmo';
        }
    }

    // Criar nova ocorrência
    createOccurrence() {
        if (!this.ridec) {
            this.showError('RIDEC não encontrado');
            return;
        }

        // Redirecionar para a página de criação de ocorrência com o ID do RIDEC modelo
        window.location.href = `ridec-occurrences.html?modelRidecId=${this.ridecId}`;
    }

    // Visualizar ocorrência
    viewOccurrence(id) {
        // Implementar visualização detalhada da ocorrência
        this.showNotification('Funcionalidade de visualização em desenvolvimento', 'info');
    }

    // Editar ocorrência
    editOccurrence(id) {
        // Implementar edição da ocorrência
        this.showNotification('Funcionalidade de edição em desenvolvimento', 'info');
    }

    // Excluir ocorrência
    deleteOccurrence(id) {
        if (confirm('Tem certeza que deseja excluir esta ocorrência?')) {
            const ridecs = JSON.parse(localStorage.getItem('ridecs')) || [];
            const updatedRidecs = ridecs.filter(ridec => ridec.id !== id);
            localStorage.setItem('ridecs', JSON.stringify(updatedRidecs));
            
            this.loadOccurrences();
            this.applyFilters();
            this.showNotification('Ocorrência excluída com sucesso', 'success');
        }
    }

    // Mostrar erro
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Mostrar notificação
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.ridecOccurrencesDetail = new RIDECOccurrencesDetail();
}); 
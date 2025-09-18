// Sistema de Cadastros RIDEC
class CadastroManager {
    constructor() {
        this.currentTab = 'usuarios';
        this.usuarios = [];
        this.areas = [];
        this.empresas = [];
        this.tiposUsuario = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        
        // Aguardar inicialização do Supabase
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            console.log('✅ Conectado ao Supabase, inicializando sistema...');
            // Carregar apenas os dados da aba inicial (usuários)
            await this.loadTabData('usuarios');
        } else {
            console.warn('⚠️ Supabase não inicializado, aguardando conexão...');
            // Tentar reconectar após um delay
            setTimeout(() => this.init(), 1000);
        }
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Botões principais
        document.getElementById('voltarBtn').addEventListener('click', () => this.voltar());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        
        // Botões de usuários
        document.getElementById('novoUsuarioBtn').addEventListener('click', () => this.showModalUsuario());
        document.getElementById('novaAreaBtn').addEventListener('click', () => this.showModalArea());
        document.getElementById('novaEmpresaBtn').addEventListener('click', () => this.showModalEmpresa());
        document.getElementById('novoTipoUsuarioBtn').addEventListener('click', () => this.showModalTipoUsuario());
        
        // Modais de usuário
        document.getElementById('closeModalUsuario').addEventListener('click', () => this.hideModalUsuario());
        document.getElementById('cancelarUsuarioBtn').addEventListener('click', () => this.hideModalUsuario());
        document.getElementById('formUsuario').addEventListener('submit', (e) => this.salvarUsuario(e));
        
        // Modais de área
        document.getElementById('closeModalArea').addEventListener('click', () => this.hideModalArea());
        document.getElementById('cancelarAreaBtn').addEventListener('click', () => this.hideModalArea());
        document.getElementById('formArea').addEventListener('submit', (e) => this.salvarArea(e));
        
        // Modais de empresa
        document.getElementById('closeModalEmpresa').addEventListener('click', () => this.hideModalEmpresa());
        document.getElementById('cancelarEmpresaBtn').addEventListener('click', () => this.hideModalEmpresa());
        document.getElementById('formEmpresa').addEventListener('submit', (e) => this.salvarEmpresa(e));
        
        // Modais de tipo de usuário
        document.getElementById('closeModalTipoUsuario').addEventListener('click', () => this.hideModalTipoUsuario());
        document.getElementById('cancelarTipoUsuarioBtn').addEventListener('click', () => this.hideModalTipoUsuario());
        document.getElementById('formTipoUsuario').addEventListener('submit', (e) => this.salvarTipoUsuario(e));
        
        // Modais de edição
        document.getElementById('closeModalEditarUsuario').addEventListener('click', () => this.hideModalEditarUsuario());
        document.getElementById('cancelarEditarUsuarioBtn').addEventListener('click', () => this.hideModalEditarUsuario());
        document.getElementById('formEditarUsuario').addEventListener('submit', (e) => this.atualizarUsuario(e));
        
        document.getElementById('closeModalEditarArea').addEventListener('click', () => this.hideModalEditarArea());
        document.getElementById('cancelarEditarAreaBtn').addEventListener('click', () => this.hideModalEditarArea());
        document.getElementById('formEditarArea').addEventListener('submit', (e) => this.atualizarArea(e));
        
        document.getElementById('closeModalEditarEmpresa').addEventListener('click', () => this.hideModalEditarEmpresa());
        document.getElementById('cancelarEditarEmpresaBtn').addEventListener('click', () => this.hideModalEditarEmpresa());
        document.getElementById('formEditarEmpresa').addEventListener('submit', (e) => this.atualizarEmpresa(e));
        
        document.getElementById('closeModalEditarTipoUsuario').addEventListener('click', () => this.hideModalEditarTipoUsuario());
        document.getElementById('cancelarEditarTipoUsuarioBtn').addEventListener('click', () => this.hideModalEditarTipoUsuario());
        document.getElementById('formEditarTipoUsuario').addEventListener('submit', (e) => this.atualizarTipoUsuario(e));
        
        // Toggle de senha
        document.getElementById('toggleSenha').addEventListener('click', () => this.togglePassword());
        
        // Busca
        document.getElementById('searchUsuario').addEventListener('input', (e) => this.filtrarUsuarios(e.target.value));
        document.getElementById('searchArea').addEventListener('input', (e) => this.filtrarAreas(e.target.value));
        document.getElementById('searchEmpresa').addEventListener('input', (e) => this.filtrarEmpresas(e.target.value));
        document.getElementById('searchTipoUsuario').addEventListener('input', (e) => this.filtrarTiposUsuario(e.target.value));
        
        // Botões de limpar busca
        document.getElementById('clearSearchUsuarioBtn').addEventListener('click', () => this.limparBuscaUsuario());
        document.getElementById('clearSearchAreaBtn').addEventListener('click', () => this.limparBuscaArea());
        document.getElementById('clearSearchEmpresaBtn').addEventListener('click', () => this.limparBuscaEmpresa());
        document.getElementById('clearSearchTipoUsuarioBtn').addEventListener('click', () => this.limparBuscaTipoUsuario());
    }

    async switchTab(tabName) {
        // Remove active class de todas as tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Adiciona active class na tab selecionada
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Carregar dados específicos da aba selecionada
        await this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        try {
            // Verificar se os dados já foram carregados
            let dataLoaded = false;
            switch (tabName) {
                case 'usuarios':
                    dataLoaded = this.usuarios.length > 0;
                    break;
                case 'areas':
                    dataLoaded = this.areas.length > 0;
                    break;
                case 'empresas':
                    dataLoaded = this.empresas.length > 0;
                    break;
                case 'tipos-usuario':
                    dataLoaded = this.tiposUsuario.length > 0;
                    break;
            }

            // Se os dados já estão carregados, apenas renderizar
            if (dataLoaded) {
                this.renderTabData(tabName);
                return;
            }

            // Mostrar indicador de carregamento
            this.showLoadingState(tabName);
            
            // Carregar dados específicos da aba
            switch (tabName) {
                case 'usuarios':
                    await this.loadUsuarios();
                    break;
                case 'areas':
                    await this.loadAreas();
                    break;
                case 'empresas':
                    await this.loadEmpresas();
                    break;
                case 'tipos-usuario':
                    await this.loadTiposUsuario();
                    break;
                default:
                    console.warn(`Aba desconhecida: ${tabName}`);
            }
            
            // Remover indicador de carregamento
            this.hideLoadingState(tabName);
        } catch (error) {
            console.error(`Erro ao carregar dados da aba ${tabName}:`, error);
            this.hideLoadingState(tabName);
            this.showNotification(`Erro ao carregar dados da aba ${tabName}`, 'error');
        }
    }

    renderTabData(tabName) {
        switch (tabName) {
            case 'usuarios':
                this.renderizarUsuarios();
                break;
            case 'areas':
                this.renderizarAreas();
                break;
            case 'empresas':
                this.renderizarEmpresas();
                break;
            case 'tipos-usuario':
                this.renderizarTiposUsuario();
                break;
        }
    }

    showLoadingState(tabName) {
        const container = document.getElementById(`${tabName}List`);
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Carregando dados...</p>
                </div>
            `;
        }
    }

    hideLoadingState(tabName) {
        // O estado de carregamento será removido quando os dados forem renderizados
        // pelas funções específicas de cada aba
    }

    voltar() {
        window.location.href = 'index.html';
    }

    async refreshData() {
        try {
            // Limpar dados carregados para forçar recarregamento
            this.usuarios = [];
            this.areas = [];
            this.empresas = [];
            this.tiposUsuario = [];
            
            // Recarregar dados da aba atual
            await this.loadTabData(this.currentTab);
            this.showNotification('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            this.showNotification('Erro ao atualizar dados', 'error');
        }
    }

    // Carregar tipos de usuário
    async loadTiposUsuario() {
        try {
            if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
                this.tiposUsuario = await supabaseDB.getTiposUsuario();
            } else {
                // Dados de fallback se Supabase não estiver disponível
                this.tiposUsuario = [
                    { cod_tipo_usuario: 1, nome_tipo_usuario: 'Admin do Sistema', descricao_tipo: 'Administrador com acesso total ao sistema', nivel_acesso: 1, pode_adicionar_usuarios: true, pode_gerenciar_areas: true, pode_acesso_sistema: true, ies_ativo: 'S' },
                    { cod_tipo_usuario: 2, nome_tipo_usuario: 'Gestor da Área', descricao_tipo: 'Gerente que pode adicionar usuários para sua área', nivel_acesso: 2, pode_adicionar_usuarios: true, pode_gerenciar_areas: true, pode_acesso_sistema: false, ies_ativo: 'S' },
                    { cod_tipo_usuario: 3, nome_tipo_usuario: 'Membro do Board', descricao_tipo: 'Membro do conselho que pode adicionar usuários para áreas associadas', nivel_acesso: 3, pode_adicionar_usuarios: true, pode_gerenciar_areas: false, pode_acesso_sistema: false, ies_ativo: 'S' },
                    { cod_tipo_usuario: 4, nome_tipo_usuario: 'Membro da Área', descricao_tipo: 'Membro comum da área sem permissões administrativas', nivel_acesso: 4, pode_adicionar_usuarios: false, pode_gerenciar_areas: false, pode_acesso_sistema: false, ies_ativo: 'S' },
                    { cod_tipo_usuario: 5, nome_tipo_usuario: 'Sistema', descricao_tipo: 'Usuário do sistema com acesso total para adição de informações', nivel_acesso: 0, pode_adicionar_usuarios: true, pode_gerenciar_areas: true, pode_acesso_sistema: true, ies_ativo: 'S' }
                ];
            }
            
            this.popularSelectsTiposUsuario();
            this.renderizarTiposUsuario();
        } catch (error) {
            console.error('Erro ao carregar tipos de usuário:', error);
            this.showNotification('Erro ao carregar tipos de usuário', 'error');
        }
    }

    popularSelectsTiposUsuario() {
        const selects = [
            'tipoUsuario',
            'editTipoUsuario'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione o tipo</option>';
                this.tiposUsuario.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.cod_tipo_usuario;
                    option.textContent = tipo.nome_tipo_usuario;
                    select.appendChild(option);
                });
            }
        });
    }

    // Gerenciamento de Usuários
    async loadUsuarios() {
        try {
            if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
                this.usuarios = await supabaseDB.getUsuarios();
            } else {
                // Dados de exemplo para fallback
                this.usuarios = [
                    {
                        cod_usuario: 1,
                        nome_usuario: 'João Silva',
                        email_usuario: 'joao@empresa.com',
                        cod_empresa: 1,
                        cod_tipo_usuario: 1,
                        ies_ativo: 'S',
                        empresa_nome: 'Empresa Demo'
                    },
                    {
                        cod_usuario: 2,
                        nome_usuario: 'Maria Santos',
                        email_usuario: 'maria@empresa.com',
                        cod_empresa: 1,
                        cod_tipo_usuario: 2,
                        ies_ativo: 'S',
                        empresa_nome: 'Empresa Demo'
                    }
                ];
            }
            
            this.renderizarUsuarios();
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            this.showNotification('Erro ao carregar usuários', 'error');
        }
    }

    renderizarUsuarios() {
        const container = document.getElementById('usuariosList');
        container.innerHTML = '';

        if (this.usuarios.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum usuário cadastrado</p></div>';
            return;
        }

        this.usuarios.forEach(usuario => {
            const card = this.criarCardUsuario(usuario);
            container.appendChild(card);
        });
    }

    criarCardUsuario(usuario) {
        const card = document.createElement('div');
        card.className = 'data-card';
        const empresaNome = usuario.empresa ? usuario.empresa.nome_empresa : usuario.empresa_nome || 'N/A';
        card.innerHTML = `
            <div class="card-header">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-info">
                    <h3>${usuario.nome_usuario}</h3>
                    <p class="user-email">${usuario.email_usuario}</p>
                    <p class="user-company">${empresaNome}</p>
                </div>
                <div class="user-status ${usuario.ies_ativo === 'S' ? 'active' : 'inactive'}">
                    <span class="status-dot"></span>
                    ${usuario.ies_ativo === 'S' ? 'Ativo' : 'Inativo'}
                </div>
            </div>
            <div class="card-body">
                <div class="user-details">
                    <span class="user-type">${this.getTipoUsuarioLabel(usuario.cod_tipo_usuario)}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="cadastroManager.editarUsuario(${usuario.cod_usuario})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="cadastroManager.excluirUsuario(${usuario.cod_usuario})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        return card;
    }

    getTipoUsuarioLabel(tipo) {
        const tipoUsuario = this.tiposUsuario.find(t => t.cod_tipo_usuario === tipo);
        return tipoUsuario ? tipoUsuario.nome_tipo_usuario : 'Desconhecido';
    }

    // Gerenciamento de Áreas
    async loadAreas() {
        try {
            if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
                this.areas = await supabaseDB.getAreas();
            } else {
                // Dados de fallback se Supabase não estiver disponível
                this.areas = [
                    {
                        cod_area: 1,
                        nome_area: 'Desenvolvimento',
                        cod_empresa: 1,
                        empresa: { nome_empresa: 'Empresa Demo' }
                    },
                    {
                        cod_area: 2,
                        nome_area: 'Qualidade',
                        cod_empresa: 1,
                        empresa: { nome_empresa: 'Empresa Demo' }
                    }
                ];
            }
            
            this.renderizarAreas();
        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
            this.showNotification('Erro ao carregar áreas', 'error');
        }
    }

    renderizarAreas() {
        const container = document.getElementById('areasList');
        container.innerHTML = '';

        if (this.areas.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><p>Nenhuma área cadastrada</p></div>';
            return;
        }

        this.areas.forEach(area => {
            const card = this.criarCardArea(area);
            container.appendChild(card);
        });
    }

    criarCardArea(area) {
        const card = document.createElement('div');
        card.className = 'data-card';
        const empresaNome = area.empresa ? area.empresa.nome_empresa : area.empresa_nome || 'N/A';
        card.innerHTML = `
            <div class="card-header">
                <div class="area-icon">
                    <i class="fas fa-building"></i>
                </div>
                <div class="area-info">
                    <h3>${area.nome_area}</h3>
                    <p class="area-company">${empresaNome}</p>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="cadastroManager.editarArea(${area.cod_area})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="cadastroManager.excluirArea(${area.cod_area})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        return card;
    }

    // Carregar empresas para os selects
    async loadEmpresas() {
        try {
            console.log('🏢 Iniciando carregamento de empresas...');
            console.log('🔗 supabaseDB disponível:', typeof supabaseDB !== 'undefined');
            console.log('🔗 supabaseDB conectado:', typeof supabaseDB !== 'undefined' ? supabaseDB.isConnected() : 'N/A');
            
            if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
                console.log('📡 Carregando empresas do Supabase...');
                this.empresas = await supabaseDB.getEmpresas();
                console.log('✅ Empresas carregadas do Supabase:', this.empresas);
            } else {
                console.log('⚠️ Supabase não disponível, usando dados de fallback...');
                // Dados de fallback se Supabase não estiver disponível
                this.empresas = [
                    { cod_empresa: 1, nome_empresa: 'Empresa Demo', ies_ativo: 'S' },
                    { cod_empresa: 2, nome_empresa: 'Tech Solutions', ies_ativo: 'S' },
                    { cod_empresa: 3, nome_empresa: 'Inovação Corp', ies_ativo: 'N' }
                ];
                console.log('📋 Usando dados de fallback:', this.empresas);
            }
            
            console.log('🎯 Populando selects de empresas...');
            this.popularSelectsEmpresas();
            console.log('🎨 Renderizando empresas...');
            this.renderizarEmpresas();
            console.log('✅ Carregamento de empresas concluído!');
        } catch (error) {
            console.error('❌ Erro ao carregar empresas:', error);
            this.showNotification('Erro ao carregar empresas: ' + error.message, 'error');
        }
    }

    popularSelectsEmpresas() {
        const selects = [
            'empresaUsuario',
            'empresaArea',
            'editEmpresaUsuario',
            'editEmpresaArea'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione a empresa</option>';
                this.empresas.forEach(empresa => {
                    const option = document.createElement('option');
                    option.value = empresa.cod_empresa;
                    option.textContent = empresa.nome_empresa;
                    select.appendChild(option);
                });
            }
        });
    }

    // Gerenciamento de Empresas
    renderizarEmpresas() {
        const container = document.getElementById('empresasList');
        container.innerHTML = '';

        if (this.empresas.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-industry"></i><p>Nenhuma empresa cadastrada</p></div>';
            return;
        }

        this.empresas.forEach(empresa => {
            const card = this.criarCardEmpresa(empresa);
            container.appendChild(card);
        });
    }

    criarCardEmpresa(empresa) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="empresa-icon">
                    <i class="fas fa-industry"></i>
                </div>
                <div class="empresa-info">
                    <h3>${empresa.nome_empresa}</h3>
                    <p class="empresa-id">ID: ${empresa.cod_empresa}</p>
                </div>
                <div class="empresa-status ${empresa.ies_ativo === 'S' ? 'active' : 'inactive'}">
                    <span class="status-dot"></span>
                    ${empresa.ies_ativo === 'S' ? 'Ativo' : 'Inativo'}
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="cadastroManager.editarEmpresa(${empresa.cod_empresa})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="cadastroManager.excluirEmpresa(${empresa.cod_empresa})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        return card;
    }

    // Gerenciamento de Tipos de Usuário
    renderizarTiposUsuario() {
        const container = document.getElementById('tiposUsuarioList');
        container.innerHTML = '';

        if (this.tiposUsuario.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-tag"></i><p>Nenhum tipo de usuário cadastrado</p></div>';
            return;
        }

        this.tiposUsuario.forEach(tipo => {
            const card = this.criarCardTipoUsuario(tipo);
            container.appendChild(card);
        });
    }

    criarCardTipoUsuario(tipo) {
        const card = document.createElement('div');
        card.className = 'data-card';
        
        const permissoes = [];
        if (tipo.pode_adicionar_usuarios) permissoes.push('<span class="permission-badge"><i class="fas fa-user-plus"></i> Adicionar Usuários</span>');
        if (tipo.pode_gerenciar_areas) permissoes.push('<span class="permission-badge"><i class="fas fa-building"></i> Gerenciar Áreas</span>');
        if (tipo.pode_acesso_sistema) permissoes.push('<span class="permission-badge"><i class="fas fa-cog"></i> Acesso Sistema</span>');
        
        card.innerHTML = `
            <div class="card-header">
                <div class="tipo-icon">
                    <i class="fas fa-user-tag"></i>
                </div>
                <div class="tipo-info">
                    <h3>${tipo.nome_tipo_usuario}</h3>
                    <p class="tipo-descricao">${tipo.descricao_tipo || 'Sem descrição'}</p>
                    <p class="tipo-nivel">Nível: ${tipo.nivel_acesso}</p>
                </div>
                <div class="tipo-status ${tipo.ies_ativo === 'S' ? 'active' : 'inactive'}">
                    <span class="status-dot"></span>
                    ${tipo.ies_ativo === 'S' ? 'Ativo' : 'Inativo'}
                </div>
            </div>
            <div class="card-body">
                <div class="permissions-display">
                    <h4>Permissões:</h4>
                    <div class="permissions-list">
                        ${permissoes.length > 0 ? permissoes.join('') : '<span class="no-permissions">Nenhuma permissão especial</span>'}
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="cadastroManager.editarTipoUsuario(${tipo.cod_tipo_usuario})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="cadastroManager.excluirTipoUsuario(${tipo.cod_tipo_usuario})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        return card;
    }

    // Funcionalidades auxiliares
    togglePassword() {
        const senhaInput = document.getElementById('senhaUsuario');
        const toggleBtn = document.getElementById('toggleSenha');
        const icon = toggleBtn.querySelector('i');

        if (senhaInput.type === 'password') {
            senhaInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            senhaInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    filtrarUsuarios(termo) {
        const container = document.getElementById('usuariosList');
        const clearBtn = document.getElementById('clearSearchUsuarioBtn');
        
        if (termo.trim() === '') {
            this.renderizarUsuarios();
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        
        const usuariosFiltrados = this.usuarios.filter(usuario =>
            usuario.nome_usuario.toLowerCase().includes(termo.toLowerCase()) ||
            usuario.email_usuario.toLowerCase().includes(termo.toLowerCase())
        );

        container.innerHTML = '';
        if (usuariosFiltrados.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum usuário encontrado</p></div>';
            return;
        }

        usuariosFiltrados.forEach(usuario => {
            const card = this.criarCardUsuario(usuario);
            container.appendChild(card);
        });
    }

    filtrarAreas(termo) {
        const container = document.getElementById('areasList');
        const clearBtn = document.getElementById('clearSearchAreaBtn');
        
        if (termo.trim() === '') {
            this.renderizarAreas();
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        
        const areasFiltradas = this.areas.filter(area =>
            area.nome_area.toLowerCase().includes(termo.toLowerCase())
        );

        container.innerHTML = '';
        if (areasFiltradas.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhuma área encontrada</p></div>';
            return;
        }

        areasFiltradas.forEach(area => {
            const card = this.criarCardArea(area);
            container.appendChild(card);
        });
    }

    limparBuscaUsuario() {
        document.getElementById('searchUsuario').value = '';
        this.filtrarUsuarios('');
    }

    limparBuscaArea() {
        document.getElementById('searchArea').value = '';
        this.filtrarAreas('');
    }

    filtrarEmpresas(termo) {
        const container = document.getElementById('empresasList');
        const clearBtn = document.getElementById('clearSearchEmpresaBtn');
        
        if (termo.trim() === '') {
            this.renderizarEmpresas();
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        
        const empresasFiltradas = this.empresas.filter(empresa =>
            empresa.nome_empresa.toLowerCase().includes(termo.toLowerCase())
        );

        container.innerHTML = '';
        if (empresasFiltradas.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhuma empresa encontrada</p></div>';
            return;
        }

        empresasFiltradas.forEach(empresa => {
            const card = this.criarCardEmpresa(empresa);
            container.appendChild(card);
        });
    }

    limparBuscaEmpresa() {
        document.getElementById('searchEmpresa').value = '';
        this.filtrarEmpresas('');
    }

    filtrarTiposUsuario(termo) {
        const container = document.getElementById('tiposUsuarioList');
        const clearBtn = document.getElementById('clearSearchTipoUsuarioBtn');
        
        if (termo.trim() === '') {
            this.renderizarTiposUsuario();
            clearBtn.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'block';
        
        const tiposFiltrados = this.tiposUsuario.filter(tipo =>
            tipo.nome_tipo_usuario.toLowerCase().includes(termo.toLowerCase()) ||
            (tipo.descricao_tipo && tipo.descricao_tipo.toLowerCase().includes(termo.toLowerCase()))
        );

        container.innerHTML = '';
        if (tiposFiltrados.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum tipo encontrado</p></div>';
            return;
        }

        tiposFiltrados.forEach(tipo => {
            const card = this.criarCardTipoUsuario(tipo);
            container.appendChild(card);
        });
    }

    limparBuscaTipoUsuario() {
        document.getElementById('searchTipoUsuario').value = '';
        this.filtrarTiposUsuario('');
    }

    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notificationArea');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        notificationArea.appendChild(notification);
        notificationArea.style.display = 'block';

        // Auto-remove após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                if (notificationArea.children.length === 0) {
                    notificationArea.style.display = 'none';
                }
            }
        }, 5000);

        // Botão de fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
            if (notificationArea.children.length === 0) {
                notificationArea.style.display = 'none';
            }
        });
    }
}

// Adicionar as operações CRUD ao protótipo da classe
CadastroManager.prototype.showModalUsuario = function() {
    document.getElementById('modalUsuario').style.display = 'block';
    document.getElementById('formUsuario').reset();
};

CadastroManager.prototype.hideModalUsuario = function() {
    document.getElementById('modalUsuario').style.display = 'none';
};

CadastroManager.prototype.salvarUsuario = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const usuarioData = {
        nome_usuario: formData.get('nomeUsuario'),
        email_usuario: formData.get('emailUsuario'),
        senha_usuario: formData.get('senhaUsuario'),
        cod_tipo_usuario: parseInt(formData.get('tipoUsuario')),
        cod_empresa: parseInt(formData.get('empresaUsuario')),
        ies_ativo: formData.get('statusUsuario')
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.createUsuario(usuarioData);
            await this.loadUsuarios();
        } else {
            const novoUsuario = {
                cod_usuario: this.usuarios.length + 1,
                ...usuarioData,
                empresa_nome: this.empresas.find(e => e.cod_empresa === usuarioData.cod_empresa)?.nome_empresa
            };
            this.usuarios.push(novoUsuario);
            this.renderizarUsuarios();
        }
        
        this.hideModalUsuario();
        this.showNotification('Usuário cadastrado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        this.showNotification('Erro ao salvar usuário: ' + error.message, 'error');
    }
};

CadastroManager.prototype.editarUsuario = function(codUsuario) {
    const usuario = this.usuarios.find(u => u.cod_usuario === codUsuario);
    if (!usuario) return;

    document.getElementById('editCodUsuario').value = usuario.cod_usuario;
    document.getElementById('editNomeUsuario').value = usuario.nome_usuario;
    document.getElementById('editEmailUsuario').value = usuario.email_usuario;
    document.getElementById('editTipoUsuario').value = usuario.cod_tipo_usuario;
    document.getElementById('editEmpresaUsuario').value = usuario.cod_empresa;
    document.getElementById('editStatusUsuario').value = usuario.ies_ativo;

    document.getElementById('modalEditarUsuario').style.display = 'block';
};

CadastroManager.prototype.hideModalEditarUsuario = function() {
    document.getElementById('modalEditarUsuario').style.display = 'none';
};

CadastroManager.prototype.atualizarUsuario = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const codUsuario = parseInt(formData.get('codUsuario'));
    const usuarioData = {
        nome_usuario: formData.get('nomeUsuario'),
        email_usuario: formData.get('emailUsuario'),
        cod_tipo_usuario: parseInt(formData.get('tipoUsuario')),
        cod_empresa: parseInt(formData.get('empresaUsuario')),
        ies_ativo: formData.get('statusUsuario')
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.updateUsuario(codUsuario, usuarioData);
            await this.loadUsuarios();
        } else {
            const index = this.usuarios.findIndex(u => u.cod_usuario === codUsuario);
            if (index !== -1) {
                this.usuarios[index] = {
                    ...this.usuarios[index],
                    ...usuarioData,
                    empresa_nome: this.empresas.find(e => e.cod_empresa === usuarioData.cod_empresa)?.nome_empresa
                };
                this.renderizarUsuarios();
            }
        }
        
        this.hideModalEditarUsuario();
        this.showNotification('Usuário atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        this.showNotification('Erro ao atualizar usuário: ' + error.message, 'error');
    }
};

CadastroManager.prototype.excluirUsuario = async function(codUsuario) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.deleteUsuario(codUsuario);
            await this.loadUsuarios();
        } else {
            this.usuarios = this.usuarios.filter(u => u.cod_usuario !== codUsuario);
            this.renderizarUsuarios();
        }
        
        this.showNotification('Usuário excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        this.showNotification('Erro ao excluir usuário: ' + error.message, 'error');
    }
};

// ==============================================
// OPERAÇÕES CRUD DE ÁREAS
// ==============================================

CadastroManager.prototype.showModalArea = function() {
    document.getElementById('modalArea').style.display = 'block';
    document.getElementById('formArea').reset();
};

CadastroManager.prototype.hideModalArea = function() {
    document.getElementById('modalArea').style.display = 'none';
};

CadastroManager.prototype.salvarArea = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const areaData = {
        nome_area: formData.get('nomeArea'),
        cod_empresa: parseInt(formData.get('empresaArea'))
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.createArea(areaData);
            await this.loadAreas();
        } else {
            const novaArea = {
                cod_area: this.areas.length + 1,
                ...areaData,
                empresa: { nome_empresa: this.empresas.find(e => e.cod_empresa === areaData.cod_empresa)?.nome_empresa }
            };
            this.areas.push(novaArea);
            this.renderizarAreas();
        }
        
        this.hideModalArea();
        this.showNotification('Área cadastrada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar área:', error);
        this.showNotification('Erro ao salvar área: ' + error.message, 'error');
    }
};

CadastroManager.prototype.editarArea = function(codArea) {
    const area = this.areas.find(a => a.cod_area === codArea);
    if (!area) return;

    document.getElementById('editCodArea').value = area.cod_area;
    document.getElementById('editNomeArea').value = area.nome_area;
    document.getElementById('editEmpresaArea').value = area.cod_empresa;

    document.getElementById('modalEditarArea').style.display = 'block';
};

CadastroManager.prototype.hideModalEditarArea = function() {
    document.getElementById('modalEditarArea').style.display = 'none';
};

CadastroManager.prototype.atualizarArea = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const codArea = parseInt(formData.get('codArea'));
    const areaData = {
        nome_area: formData.get('nomeArea'),
        cod_empresa: parseInt(formData.get('empresaArea'))
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.updateArea(codArea, areaData);
            await this.loadAreas();
        } else {
            const index = this.areas.findIndex(a => a.cod_area === codArea);
            if (index !== -1) {
                this.areas[index] = {
                    ...this.areas[index],
                    ...areaData,
                    empresa: { nome_empresa: this.empresas.find(e => e.cod_empresa === areaData.cod_empresa)?.nome_empresa }
                };
                this.renderizarAreas();
            }
        }
        
        this.hideModalEditarArea();
        this.showNotification('Área atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar área:', error);
        this.showNotification('Erro ao atualizar área: ' + error.message, 'error');
    }
};

CadastroManager.prototype.excluirArea = async function(codArea) {
    if (!confirm('Tem certeza que deseja excluir esta área?')) return;

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.deleteArea(codArea);
            await this.loadAreas();
        } else {
            this.areas = this.areas.filter(a => a.cod_area !== codArea);
            this.renderizarAreas();
        }
        
        this.showNotification('Área excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir área:', error);
        this.showNotification('Erro ao excluir área: ' + error.message, 'error');
    }
};

// ==============================================
// OPERAÇÕES CRUD DE EMPRESAS
// ==============================================

CadastroManager.prototype.showModalEmpresa = function() {
    document.getElementById('modalEmpresa').style.display = 'block';
    document.getElementById('formEmpresa').reset();
};

CadastroManager.prototype.hideModalEmpresa = function() {
    document.getElementById('modalEmpresa').style.display = 'none';
};

CadastroManager.prototype.salvarEmpresa = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const empresaData = {
        nome_empresa: formData.get('nomeEmpresa'),
        ies_ativo: formData.get('statusEmpresa')
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.createEmpresa(empresaData);
            await this.loadEmpresas();
        } else {
            const novaEmpresa = {
                cod_empresa: this.empresas.length + 1,
                ...empresaData
            };
            this.empresas.push(novaEmpresa);
            this.renderizarEmpresas();
            this.popularSelectsEmpresas();
        }
        
        this.hideModalEmpresa();
        this.showNotification('Empresa cadastrada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar empresa:', error);
        this.showNotification('Erro ao salvar empresa: ' + error.message, 'error');
    }
};

CadastroManager.prototype.editarEmpresa = function(codEmpresa) {
    const empresa = this.empresas.find(e => e.cod_empresa === codEmpresa);
    if (!empresa) return;

    document.getElementById('editCodEmpresa').value = empresa.cod_empresa;
    document.getElementById('editNomeEmpresa').value = empresa.nome_empresa;
    document.getElementById('editStatusEmpresa').value = empresa.ies_ativo;

    document.getElementById('modalEditarEmpresa').style.display = 'block';
};

CadastroManager.prototype.hideModalEditarEmpresa = function() {
    document.getElementById('modalEditarEmpresa').style.display = 'none';
};

CadastroManager.prototype.atualizarEmpresa = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const codEmpresa = parseInt(formData.get('codEmpresa'));
    const empresaData = {
        nome_empresa: formData.get('nomeEmpresa'),
        ies_ativo: formData.get('statusEmpresa')
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.updateEmpresa(codEmpresa, empresaData);
            await this.loadEmpresas();
        } else {
            const index = this.empresas.findIndex(e => e.cod_empresa === codEmpresa);
            if (index !== -1) {
                this.empresas[index] = {
                    ...this.empresas[index],
                    ...empresaData
                };
                this.renderizarEmpresas();
                this.popularSelectsEmpresas();
            }
        }
        
        this.hideModalEditarEmpresa();
        this.showNotification('Empresa atualizada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar empresa:', error);
        this.showNotification('Erro ao atualizar empresa: ' + error.message, 'error');
    }
};

CadastroManager.prototype.excluirEmpresa = async function(codEmpresa) {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação pode afetar usuários e áreas vinculadas.')) return;

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.deleteEmpresa(codEmpresa);
            await this.loadEmpresas();
        } else {
            this.empresas = this.empresas.filter(e => e.cod_empresa !== codEmpresa);
            this.renderizarEmpresas();
            this.popularSelectsEmpresas();
        }
        
        this.showNotification('Empresa excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir empresa:', error);
        this.showNotification('Erro ao excluir empresa: ' + error.message, 'error');
    }
};

// ==============================================
// OPERAÇÕES CRUD DE TIPOS DE USUÁRIO
// ==============================================

CadastroManager.prototype.showModalTipoUsuario = function() {
    document.getElementById('modalTipoUsuario').style.display = 'block';
    document.getElementById('formTipoUsuario').reset();
};

CadastroManager.prototype.hideModalTipoUsuario = function() {
    document.getElementById('modalTipoUsuario').style.display = 'none';
};

CadastroManager.prototype.salvarTipoUsuario = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const tipoData = {
        nome_tipo_usuario: formData.get('nomeTipoUsuario'),
        descricao_tipo: formData.get('descricaoTipoUsuario'),
        nivel_acesso: parseInt(formData.get('nivelAcessoTipoUsuario')),
        pode_adicionar_usuarios: formData.get('podeAdicionarUsuarios') === 'on',
        pode_gerenciar_areas: formData.get('podeGerenciarAreas') === 'on',
        pode_acesso_sistema: formData.get('podeAcessoSistema') === 'on',
        ies_ativo: formData.get('statusTipoUsuario')
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.createTipoUsuario(tipoData);
            await this.loadTiposUsuario();
        } else {
            const novoTipo = {
                cod_tipo_usuario: this.tiposUsuario.length + 1,
                ...tipoData
            };
            this.tiposUsuario.push(novoTipo);
            this.renderizarTiposUsuario();
            this.popularSelectsTiposUsuario();
        }
        
        this.hideModalTipoUsuario();
        this.showNotification('Tipo de usuário cadastrado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar tipo de usuário:', error);
        this.showNotification('Erro ao salvar tipo de usuário: ' + error.message, 'error');
    }
};

CadastroManager.prototype.editarTipoUsuario = function(codTipoUsuario) {
    const tipo = this.tiposUsuario.find(t => t.cod_tipo_usuario === codTipoUsuario);
    if (!tipo) return;

    document.getElementById('editCodTipoUsuario').value = tipo.cod_tipo_usuario;
    document.getElementById('editNomeTipoUsuario').value = tipo.nome_tipo_usuario;
    document.getElementById('editDescricaoTipoUsuario').value = tipo.descricao_tipo || '';
    document.getElementById('editNivelAcessoTipoUsuario').value = tipo.nivel_acesso;
    document.getElementById('editPodeAdicionarUsuarios').checked = tipo.pode_adicionar_usuarios;
    document.getElementById('editPodeGerenciarAreas').checked = tipo.pode_gerenciar_areas;
    document.getElementById('editPodeAcessoSistema').checked = tipo.pode_acesso_sistema;
    document.getElementById('editStatusTipoUsuario').value = tipo.ies_ativo;

    document.getElementById('modalEditarTipoUsuario').style.display = 'block';
};

CadastroManager.prototype.hideModalEditarTipoUsuario = function() {
    document.getElementById('modalEditarTipoUsuario').style.display = 'none';
};

CadastroManager.prototype.atualizarTipoUsuario = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const codTipoUsuario = parseInt(formData.get('codTipoUsuario'));
    const tipoData = {
        nome_tipo_usuario: formData.get('nomeTipoUsuario'),
        descricao_tipo: formData.get('descricaoTipoUsuario'),
        nivel_acesso: parseInt(formData.get('nivelAcessoTipoUsuario')),
        pode_adicionar_usuarios: formData.get('podeAdicionarUsuarios') === 'on',
        pode_gerenciar_areas: formData.get('podeGerenciarAreas') === 'on',
        pode_acesso_sistema: formData.get('podeAcessoSistema') === 'on',
        ies_ativo: formData.get('statusTipoUsuario')
    };

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.updateTipoUsuario(codTipoUsuario, tipoData);
            await this.loadTiposUsuario();
        } else {
            const index = this.tiposUsuario.findIndex(t => t.cod_tipo_usuario === codTipoUsuario);
            if (index !== -1) {
                this.tiposUsuario[index] = {
                    ...this.tiposUsuario[index],
                    ...tipoData
                };
                this.renderizarTiposUsuario();
                this.popularSelectsTiposUsuario();
            }
        }
        
        this.hideModalEditarTipoUsuario();
        this.showNotification('Tipo de usuário atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar tipo de usuário:', error);
        this.showNotification('Erro ao atualizar tipo de usuário: ' + error.message, 'error');
    }
};

CadastroManager.prototype.excluirTipoUsuario = async function(codTipoUsuario) {
    if (!confirm('Tem certeza que deseja excluir este tipo de usuário? Esta ação pode afetar usuários vinculados.')) return;

    try {
        if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
            await supabaseDB.deleteTipoUsuario(codTipoUsuario);
            await this.loadTiposUsuario();
        } else {
            this.tiposUsuario = this.tiposUsuario.filter(t => t.cod_tipo_usuario !== codTipoUsuario);
            this.renderizarTiposUsuario();
            this.popularSelectsTiposUsuario();
        }
        
        this.showNotification('Tipo de usuário excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir tipo de usuário:', error);
        this.showNotification('Erro ao excluir tipo de usuário: ' + error.message, 'error');
    }
};

// Inicializar o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.cadastroManager = new CadastroManager();
});

// Sistema de verificação de autenticação
class AuthChecker {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
    }

    checkAuthentication() {
        console.log('🔍 AuthChecker: Verificando autenticação...');
        
        // Verificar se há sessão ativa
        const sessionData = this.getSessionData();
        console.log('📦 AuthChecker: Dados de sessão encontrados:', !!sessionData);
        
        if (sessionData && sessionData.user) {
            this.currentUser = sessionData.user;
            console.log('✅ AuthChecker: Usuário autenticado:', this.currentUser);
            console.log('🏢 AuthChecker: Empresa do usuário:', this.currentUser.cod_empresa);
            console.log('📧 AuthChecker: Email do usuário:', this.currentUser.email_usuario || this.currentUser.email);
            console.log('👤 AuthChecker: Nome do usuário:', this.currentUser.nome_usuario || this.currentUser.name);
            
            // Aguardar o DOM estar pronto antes de mostrar as informações do usuário
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.showUserInfo();
                });
            } else {
                this.showUserInfo();
            }
            return true;
        } else {
            console.log('❌ AuthChecker: Nenhuma sessão ativa encontrada');
            
            // FALLBACK: Verificar se estamos na página de login
            if (window.location.pathname.includes('login.html')) {
                console.log('ℹ️ AuthChecker: Já na página de login, não redirecionando');
                return false;
            }
            
            // FALLBACK: Verificar se há dados válidos em outras fontes
            const fallbackData = this.getFallbackSessionData();
            if (fallbackData && fallbackData.user) {
                console.log('🔄 AuthChecker: Usando dados de fallback:', fallbackData.user);
                this.currentUser = fallbackData.user;
                return true;
            }
            
            this.redirectToLogin();
            return false;
        }
    }

    getSessionData() {
        console.log('🔍 AuthChecker: Buscando dados de sessão...');
        
        // Verificar localStorage primeiro (usuário marcou "lembrar de mim")
        let sessionData = localStorage.getItem('ridec_session');
        console.log('📦 AuthChecker: localStorage:', sessionData ? 'Dados encontrados' : 'Vazio');
        
        if (!sessionData) {
            // Verificar sessionStorage (sessão temporária)
            sessionData = sessionStorage.getItem('ridec_session');
            console.log('📦 AuthChecker: sessionStorage:', sessionData ? 'Dados encontrados' : 'Vazio');
        }

        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                console.log('✅ AuthChecker: Dados de sessão válidos:', parsed);
                
                // Verificar se são dados de exemplo e limpar se necessário
                if (parsed.user && this.isExampleData(parsed.user)) {
                    console.log('🧹 AuthChecker: Dados de exemplo detectados, limpando...');
                    this.clearSession();
                    return null;
                }
                
                // Verificar se a sessão não expirou (24 horas para sessões normais, 30 dias para "lembrar de mim")
                const loginTime = new Date(parsed.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                
                console.log('⏰ AuthChecker: Horas desde login:', hoursDiff);
                
                if (parsed.rememberMe && hoursDiff > 24 * 30) {
                    // Sessão "lembrar de mim" expirou (30 dias)
                    console.log('⏰ AuthChecker: Sessão "lembrar de mim" expirou');
                    this.clearSession();
                    return null;
                } else if (!parsed.rememberMe && hoursDiff > 24) {
                    // Sessão normal expirou (24 horas)
                    console.log('⏰ AuthChecker: Sessão normal expirou');
                    this.clearSession();
                    return null;
                }
                
                console.log('✅ AuthChecker: Sessão válida, retornando dados');
                return parsed;
            } catch (error) {
                console.error('❌ AuthChecker: Erro ao analisar dados da sessão:', error);
                this.clearSession();
                return null;
            }
        }
        
        console.log('❌ AuthChecker: Nenhum dado de sessão encontrado');
        return null;
    }

    // Verificar se são dados de exemplo
    isExampleData(user) {
        if (!user) return false;
        
        // Apenas bloquear dados realmente de exemplo/teste
        const exampleEmails = [
            'joao@empresa.com', 
            'maria@empresa.com', 
            'admin@ridec.com', 
            'usuario@ridec.com',
            'teste@empresa.com'
        ];
        const exampleNames = [
            'João Silva', 
            'Maria Santos', 
            'Administrador', 
            'Usuário',
            'Teste'
        ];
        
        // Verificar se é um email de exemplo
        const isExampleEmail = exampleEmails.includes(user.email_usuario) || 
                              exampleEmails.includes(user.email);
        
        // Verificar se é um nome de exemplo
        const isExampleName = exampleNames.includes(user.nome_usuario) ||
                             exampleNames.includes(user.name);
        
        // Log para debug
        if (isExampleEmail || isExampleName) {
            console.log('🧹 AuthChecker: Dados de exemplo detectados:', {
                email: user.email_usuario || user.email,
                name: user.nome_usuario || user.name,
                isExampleEmail,
                isExampleName
            });
        }
        
        return isExampleEmail || isExampleName;
    }

    clearSession() {
        localStorage.removeItem('ridec_session');
        sessionStorage.removeItem('ridec_session');
    }

    // Obter dados de sessão de fallback (menos restritivo)
    getFallbackSessionData() {
        console.log('🔄 AuthChecker: Tentando obter dados de fallback...');
        
        try {
            // Verificar localStorage sem validação restritiva
            let sessionData = localStorage.getItem('ridec_session');
            if (!sessionData) {
                sessionData = sessionStorage.getItem('ridec_session');
            }
            
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                if (parsed.user) {
                    // Verificar se é usuário corrompido (não bloqueando usuários válidos)
                    if (this.isCorruptedUser(parsed.user)) {
                        console.log('🚨 AuthChecker: Dados de fallback são corrompidos, ignorando');
                        return null;
                    }
                    
                    console.log('✅ AuthChecker: Dados de fallback válidos encontrados');
                    return parsed;
                }
            }
        } catch (error) {
            console.error('❌ AuthChecker: Erro ao obter dados de fallback:', error);
        }
        
        return null;
    }

    // Verificar se usuário é corrompido
    isCorruptedUser(user) {
        if (!user) return false;
        
        // Não bloquear nenhum usuário específico - apenas dados realmente corrompidos
        const corruptedEmails = [];
        const corruptedNames = [];
        
        const email = user.email_usuario || user.email;
        const name = user.nome_usuario || user.name;
        
        return corruptedEmails.includes(email) || corruptedNames.includes(name);
    }

    // Limpeza de emergência
    emergencyCleanup() {
        console.log('🚨 AuthChecker: LIMPEZA DE EMERGÊNCIA iniciada...');
        
        try {
            // Limpar usuário atual
            this.currentUser = null;
            
            // Limpar todas as sessões
            this.clearSession();
            
            // Limpar outros dados relacionados
            localStorage.removeItem('ridecs');
            localStorage.removeItem('notifications');
            
            console.log('✅ AuthChecker: Limpeza de emergência concluída');
            
            // Redirecionar para login após limpeza
            setTimeout(() => {
                if (!window.location.pathname.includes('login.html')) {
                    console.log('🔄 AuthChecker: Redirecionando para login após limpeza...');
                    this.redirectToLogin();
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ AuthChecker: Erro durante limpeza de emergência:', error);
        }
    }

    showUserInfo() {
        // Usar a nova seção de usuário no header
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (userSection && this.currentUser) {
            // Usar nome_usuario se disponível, senão usar email
            const displayName = this.currentUser.nome_usuario || 
                               this.currentUser.name || 
                               this.currentUser.email_usuario || 
                               this.currentUser.email || 
                               'Usuário';
            
            // Atualizar o elemento do nome
            if (userName) userName.textContent = displayName;
            
            // Configurar o botão de logout
            if (logoutBtn) {
                logoutBtn.onclick = () => this.logout();
            }
            
            // Mostrar a seção do usuário
            userSection.style.display = 'flex';
            
            console.log('✅ Informações do usuário exibidas:', {
                nome: displayName,
                user: this.currentUser
            });
        } else {
            console.log('❌ Seção de usuário ou usuário não encontrado:', { 
                userSection: !!userSection, 
                user: this.currentUser 
            });
            
            // Esconder a seção se não há usuário
            if (userSection) {
                userSection.style.display = 'none';
            }
        }
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': 'Administrador',
            'user': 'Usuário',
            'manager': 'Gerente',
            'supervisor': 'Supervisor'
        };
        return roleNames[role] || 'Usuário';
    }

    logout() {
        console.log('🚪 AuthChecker: Iniciando processo de logout...');
        
        if (confirm('Tem certeza que deseja sair do sistema?')) {
            console.log('✅ AuthChecker: Usuário confirmou logout');
            
            // Limpar dados da sessão
            this.clearSession();
            
            // Limpar usuário atual
            this.currentUser = null;
            
            // Limpar dados do localStorage relacionados ao RIDEC
            localStorage.removeItem('ridecs');
            localStorage.removeItem('notifications');
            localStorage.removeItem('ridec_settings');
            
            // Limpar dados do sessionStorage
            sessionStorage.clear();
            
            console.log('✅ AuthChecker: Dados limpos, redirecionando para login...');
            
            // Mostrar mensagem de logout
            this.showLogoutMessage();
            
            // Redirecionar para login após um pequeno delay
            setTimeout(() => {
                this.redirectToLogin();
            }, 1000);
        } else {
            console.log('❌ AuthChecker: Logout cancelado pelo usuário');
        }
    }
    
    showLogoutMessage() {
        // Criar uma mensagem temporária de logout
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #28a745;
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
            Logout realizado com sucesso!
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover a mensagem após 2 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 2000);
    }

    redirectToLogin() {
        // Verificar se já estamos na página de login
        if (window.location.pathname.includes('login.html')) {
            return;
        }
        
        // Redirecionar para a página de login
        window.location.href = 'login.html';
    }

    // Método para verificar se o usuário tem permissão para uma ação
    hasPermission(action) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'admin': ['create', 'edit', 'delete', 'view', 'manage_users', 'view_reports'],
            'manager': ['create', 'edit', 'view', 'view_reports'],
            'supervisor': ['create', 'edit', 'view'],
            'user': ['view']
        };
        
        const userPermissions = permissions[this.currentUser.role] || permissions['user'];
        return userPermissions.includes(action);
    }

    // Método para obter informações do usuário atual
    getCurrentUser() {
        console.log('🔍 AuthChecker: getCurrentUser chamado');
        console.log('👤 AuthChecker: currentUser:', this.currentUser);
        
        // Verificar se o usuário atual é corrompido
        if (this.currentUser && this.isCorruptedUser(this.currentUser)) {
            console.error('🚨 AuthChecker: Usuário atual é corrompido, limpando...');
            this.emergencyCleanup();
            return null;
        }
        
        // Se não há usuário atual, tentar recarregar da sessão
        if (!this.currentUser) {
            console.log('⚠️ AuthChecker: currentUser é null, tentando recarregar da sessão...');
            const sessionData = this.getSessionData();
            if (sessionData && sessionData.user) {
                // Verificar se o usuário da sessão é corrompido
                if (this.isCorruptedUser(sessionData.user)) {
                    console.error('🚨 AuthChecker: Usuário da sessão é corrompido, limpando...');
                    this.emergencyCleanup();
                    return null;
                }
                
                this.currentUser = sessionData.user;
                console.log('✅ AuthChecker: Usuário recarregado da sessão:', this.currentUser);
            }
        }
        
        return this.currentUser;
    }

    // Método para verificar se é administrador
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Método para verificar se é gerente ou superior
    isManagerOrAbove() {
        return this.currentUser && ['admin', 'manager'].includes(this.currentUser.role);
    }

    // Método para atualizar as informações do usuário no header
    updateUserInfo() {
        if (this.currentUser) {
            this.showUserInfo();
        }
    }

    // Método para obter o nome do usuário atual
    getCurrentUserName() {
        return this.currentUser ? (this.currentUser.name || this.currentUser.email) : 'Usuário';
    }
}

// Estilos para as informações do usuário
const userInfoStyles = `
    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255, 255, 255, 0.1);
        padding: 8px 16px;
        border-radius: 20px;
        margin-right: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
    }

    .user-details {
        display: flex;
        flex-direction: column;
        color: white;
    }

    .user-name {
        font-weight: 600;
        font-size: 14px;
        line-height: 1.2;
    }

    .user-role {
        font-size: 12px;
        opacity: 0.8;
        line-height: 1.2;
    }

    .logout-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 12px;
    }

    .logout-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }

    @media (max-width: 768px) {
        .user-info {
            margin-right: 10px;
            padding: 6px 12px;
        }
        
        .user-details {
            display: none;
        }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = userInfoStyles;
document.head.appendChild(styleSheet);

// Inicializar verificador de autenticação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AuthChecker: DOM carregado, inicializando...');
    window.authChecker = new AuthChecker();
    console.log('✅ AuthChecker: Instância criada e atribuída ao window.authChecker');
    
    // Garantir que as informações do usuário sejam exibidas após um pequeno delay
    // para permitir que todos os elementos sejam carregados
    setTimeout(() => {
        console.log('⏰ AuthChecker: Verificando usuário após delay...');
        if (window.authChecker && window.authChecker.currentUser) {
            console.log('✅ AuthChecker: Atualizando informações do usuário');
            window.authChecker.updateUserInfo();
        } else {
            console.log('❌ AuthChecker: Nenhum usuário para atualizar');
        }
    }, 100);
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthChecker;
}

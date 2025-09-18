// Gerenciador de Autenticação RIDEC
// Sistema de autenticação integrado com Supabase

class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userProfile = null;
        
        this.init();
    }

    // Inicializar sistema de autenticação
    async init() {
        try {
            console.log('🔐 Inicializando sistema de autenticação...');
            
            if (typeof supabase === 'undefined') {
                throw new Error('Biblioteca do Supabase não carregada');
            }

            if (typeof SUPABASE_CONFIG === 'undefined') {
                throw new Error('Configuração do Supabase não encontrada');
            }

            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.anonKey
            );

            // Verificar sessão ativa
            await this.checkCurrentSession();
            
            // Escutar mudanças de autenticação
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔄 Estado de autenticação alterado:', event, session?.user?.email);
                this.handleAuthStateChange(event, session);
            });

            console.log('✅ Sistema de autenticação inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar autenticação:', error);
        }
    }

    // Verificar sessão atual
    async checkCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Erro ao verificar sessão:', error);
                return;
            }

            if (session) {
                this.currentUser = session.user;
                this.isAuthenticated = true;
                await this.loadUserProfile();
                console.log('✅ Usuário autenticado:', session.user.email);
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.userProfile = null;
                console.log('ℹ️ Nenhuma sessão ativa');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar sessão atual:', error);
        }
    }

    // Gerenciar mudanças de estado de autenticação
    async handleAuthStateChange(event, session) {
        switch (event) {
            case 'SIGNED_IN':
                this.currentUser = session.user;
                this.isAuthenticated = true;
                await this.loadUserProfile();
                this.onUserSignedIn(session.user);
                break;
                
            case 'SIGNED_OUT':
                this.currentUser = null;
                this.isAuthenticated = false;
                this.userProfile = null;
                this.onUserSignedOut();
                break;
                
            case 'TOKEN_REFRESHED':
                this.currentUser = session.user;
                this.onTokenRefreshed(session.user);
                break;
                
            case 'PASSWORD_RECOVERY':
                this.onPasswordRecovery();
                break;
        }
    }

    // Carregar perfil do usuário
    async loadUserProfile() {
        if (!this.currentUser) return;

        try {
            // Buscar dados do usuário na tabela usuario
            const { data, error } = await this.supabase
                .from('usuario')
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa),
                    tipo_usuario:cod_tipo_usuario(nome_tipo_usuario, nivel_acesso)
                `)
                .eq('email', this.currentUser.email)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('❌ Erro ao carregar perfil:', error);
                return;
            }

            if (data) {
                this.userProfile = data;
                console.log('✅ Perfil do usuário carregado:', data.nome_usuario);
            } else {
                // Usuário não encontrado na tabela usuario, criar perfil básico
                console.log('ℹ️ Usuário não encontrado na tabela usuario, criando perfil básico...');
                await this.createBasicUserProfile();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar perfil do usuário:', error);
        }
    }

    // Criar perfil básico do usuário
    async createBasicUserProfile() {
        if (!this.currentUser) return;

        try {
            // Buscar empresa padrão ou criar uma
            let empresaId = 1; // ID padrão
            const { data: empresas } = await this.supabase
                .from('empresa')
                .select('cod_empresa')
                .limit(1);

            if (empresas && empresas.length > 0) {
                empresaId = empresas[0].cod_empresa;
            }

            // Buscar tipo de usuário padrão
            let tipoUsuarioId = 1; // ID padrão
            const { data: tiposUsuario } = await this.supabase
                .from('tipo_usuario')
                .select('cod_tipo_usuario')
                .eq('nivel_acesso', 1) // Nível básico
                .limit(1);

            if (tiposUsuario && tiposUsuario.length > 0) {
                tipoUsuarioId = tiposUsuario[0].cod_tipo_usuario;
            }

            // Criar usuário na tabela usuario
            const userData = {
                nome_usuario: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
                email: this.currentUser.email,
                cod_empresa: empresaId,
                cod_tipo_usuario: tipoUsuarioId,
                ativo: true,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('usuario')
                .insert([userData])
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa),
                    tipo_usuario:cod_tipo_usuario(nome_tipo_usuario, nivel_acesso)
                `)
                .single();

            if (error) {
                console.error('❌ Erro ao criar perfil do usuário:', error);
                return;
            }

            this.userProfile = data;
            console.log('✅ Perfil básico criado:', data.nome_usuario);
        } catch (error) {
            console.error('❌ Erro ao criar perfil básico:', error);
        }
    }

    // Fazer login
    async signIn(email, password, rememberMe = false) {
        try {
            console.log('🔐 Fazendo login...', { email });
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ Erro no login:', error);
                throw error;
            }

            if (data.user) {
                console.log('✅ Login realizado com sucesso:', data.user.email);
                return data.user;
            }
        } catch (error) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    }

    // Fazer logout
    async signOut() {
        try {
            console.log('🚪 Fazendo logout...');
            
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                console.error('❌ Erro no logout:', error);
                throw error;
            }

            console.log('✅ Logout realizado com sucesso');
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            throw error;
        }
    }

    // Registrar novo usuário
    async signUp(email, password, userData = {}) {
        try {
            console.log('📝 Registrando novo usuário...', { email });
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });

            if (error) {
                console.error('❌ Erro no registro:', error);
                throw error;
            }

            if (data.user) {
                console.log('✅ Usuário registrado com sucesso:', data.user.email);
                return data.user;
            }
        } catch (error) {
            console.error('❌ Erro no registro:', error);
            throw error;
        }
    }

    // Recuperar senha
    async resetPassword(email) {
        try {
            console.log('🔑 Enviando email de recuperação...', { email });
            
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) {
                console.error('❌ Erro ao enviar email:', error);
                throw error;
            }

            console.log('✅ Email de recuperação enviado');
        } catch (error) {
            console.error('❌ Erro na recuperação:', error);
            throw error;
        }
    }

    // Login social
    async signInWithProvider(provider) {
        try {
            console.log(`🔐 Fazendo login com ${provider}...`);
            
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/index.html`
                }
            });

            if (error) {
                console.error(`❌ Erro no login com ${provider}:`, error);
                throw error;
            }

            console.log(`✅ Redirecionando para ${provider}...`);
        } catch (error) {
            console.error(`❌ Erro no login social:`, error);
            throw error;
        }
    }

    // Verificar se usuário tem permissão
    hasPermission(permission) {
        if (!this.isAuthenticated || !this.userProfile) {
            return false;
        }

        const userLevel = this.userProfile.tipo_usuario?.nivel_acesso || 0;
        
        // Definir níveis de permissão
        const permissions = {
            'read': 1,
            'write': 2,
            'admin': 3,
            'super_admin': 4
        };

        const requiredLevel = permissions[permission] || 0;
        return userLevel >= requiredLevel;
    }

    // Verificar se usuário é admin
    isAdmin() {
        return this.hasPermission('admin');
    }

    // Verificar se usuário é super admin
    isSuperAdmin() {
        return this.hasPermission('super_admin');
    }

    // Obter informações do usuário
    getUserInfo() {
        return {
            user: this.currentUser,
            profile: this.userProfile,
            isAuthenticated: this.isAuthenticated,
            isAdmin: this.isAdmin(),
            isSuperAdmin: this.isSuperAdmin()
        };
    }

    // Callbacks para eventos de autenticação
    onUserSignedIn(user) {
        console.log('👤 Usuário fez login:', user.email);
        // Implementar lógica específica quando usuário faz login
        this.updateUIForAuthenticatedUser();
    }

    onUserSignedOut() {
        console.log('👋 Usuário fez logout');
        // Implementar lógica específica quando usuário faz logout
        this.updateUIForUnauthenticatedUser();
    }

    onTokenRefreshed(user) {
        console.log('🔄 Token renovado para:', user.email);
    }

    onPasswordRecovery() {
        console.log('🔑 Recuperação de senha iniciada');
    }

    // Atualizar UI para usuário autenticado
    updateUIForAuthenticatedUser() {
        // Mostrar elementos para usuário logado
        const authElements = document.querySelectorAll('.auth-required');
        authElements.forEach(element => {
            element.style.display = 'block';
        });

        // Esconder elementos para usuário não logado
        const unauthElements = document.querySelectorAll('.auth-not-required');
        unauthElements.forEach(element => {
            element.style.display = 'none';
        });

        // Atualizar informações do usuário na UI
        this.updateUserInfoInUI();
    }

    // Atualizar UI para usuário não autenticado
    updateUIForUnauthenticatedUser() {
        // Esconder elementos para usuário logado
        const authElements = document.querySelectorAll('.auth-required');
        authElements.forEach(element => {
            element.style.display = 'none';
        });

        // Mostrar elementos para usuário não logado
        const unauthElements = document.querySelectorAll('.auth-not-required');
        unauthElements.forEach(element => {
            element.style.display = 'block';
        });
    }

    // Atualizar informações do usuário na UI
    updateUserInfoInUI() {
        if (!this.userProfile) return;

        // Atualizar nome do usuário
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = this.userProfile.nome_usuario;
        });

        // Atualizar email do usuário
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(element => {
            element.textContent = this.userProfile.email;
        });

        // Atualizar empresa do usuário
        const userCompanyElements = document.querySelectorAll('.user-company');
        userCompanyElements.forEach(element => {
            element.textContent = this.userProfile.empresa?.nome_empresa || 'N/A';
        });

        // Atualizar tipo de usuário
        const userTypeElements = document.querySelectorAll('.user-type');
        userTypeElements.forEach(element => {
            element.textContent = this.userProfile.tipo_usuario?.nome_tipo_usuario || 'Usuário';
        });
    }

    // Verificar se deve redirecionar para login
    requireAuth() {
        if (!this.isAuthenticated) {
            console.log('🔒 Acesso negado - redirecionando para login');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Verificar permissão específica
    requirePermission(permission) {
        if (!this.requireAuth()) {
            return false;
        }

        if (!this.hasPermission(permission)) {
            console.log(`🚫 Permissão negada: ${permission}`);
            this.showPermissionDenied();
            return false;
        }

        return true;
    }

    // Mostrar mensagem de permissão negada
    showPermissionDenied() {
        // Implementar UI para mostrar erro de permissão
        alert('Você não tem permissão para acessar esta funcionalidade.');
    }

    // Obter cliente Supabase
    getSupabaseClient() {
        return this.supabase;
    }

    // Verificar se está inicializado
    isInitialized() {
        return this.supabase !== null;
    }
}

// Criar instância global
const authManager = new AuthManager();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.authManager = authManager;
    window.AuthManager = AuthManager;
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de login
    if (window.location.pathname.includes('login.html')) {
        return; // Não fazer verificação de autenticação na página de login
    }

    // Verificar autenticação em outras páginas
    setTimeout(() => {
        if (!authManager.isAuthenticated) {
            console.log('🔒 Usuário não autenticado - redirecionando para login');
            window.location.href = 'login.html';
        }
    }, 1000);
});


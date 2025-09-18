// Sistema de Login RIDEC
// Integração com Supabase para autenticação

class LoginSystem {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.currentUser = null;
        
        this.init();
        this.bindEvents();
    }

    // Inicializar conexão com Supabase
    async init() {
        try {
            console.log('🚀 Inicializando sistema de login...');
            
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

            // Verificar se há sessão ativa
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                console.log('✅ Sessão ativa encontrada:', session.user.email);
                this.currentUser = session.user;
                this.redirectToMain();
                return;
            }

            this.initialized = true;
            console.log('✅ Sistema de login inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de login:', error);
            this.showError('Erro ao conectar com o servidor. Tente novamente.');
        }
    }

    // Vincular eventos
    bindEvents() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Toggle de senha
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePassword());
        }

        // Botões de demo
        const demoAdminBtn = document.getElementById('demoAdminBtn');
        const demoUserBtn = document.getElementById('demoUserBtn');
        
        if (demoAdminBtn) {
            demoAdminBtn.addEventListener('click', () => this.useDemoCredentials('admin'));
        }
        if (demoUserBtn) {
            demoUserBtn.addEventListener('click', () => this.useDemoCredentials('user'));
        }

        // Links de modal
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const registerLink = document.getElementById('registerLink');
        
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }
        
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        // Modais
        this.bindModalEvents();

        // Login social
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const githubLoginBtn = document.getElementById('githubLoginBtn');
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.socialLogin('google'));
        }
        if (githubLoginBtn) {
            githubLoginBtn.addEventListener('click', () => this.socialLogin('github'));
        }

        // Validação em tempo real
        this.bindValidationEvents();
    }

    // Vincular eventos dos modais
    bindModalEvents() {
        // Modal de esqueci senha
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        const closeForgotModal = document.getElementById('closeForgotModal');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        
        if (closeForgotModal) {
            closeForgotModal.addEventListener('click', () => this.hideForgotPasswordModal());
        }
        
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Modal de registro
        const registerModal = document.getElementById('registerModal');
        const closeRegisterModal = document.getElementById('closeRegisterModal');
        const registerForm = document.getElementById('registerForm');
        
        if (closeRegisterModal) {
            closeRegisterModal.addEventListener('click', () => this.hideRegisterModal());
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Fechar modais clicando fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
    }

    // Vincular eventos de validação
    bindValidationEvents() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateEmail(emailInput));
            emailInput.addEventListener('blur', () => this.validateEmail(emailInput));
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePassword(passwordInput));
            passwordInput.addEventListener('blur', () => this.validatePassword(passwordInput));
        }
    }

    // Validar email
    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        this.updateInputValidation(input, isValid, 'Email inválido');
        return isValid;
    }

    // Validar senha
    validatePassword(input) {
        const password = input.value;
        const isValid = password.length >= 6;
        
        this.updateInputValidation(input, isValid, 'Senha deve ter pelo menos 6 caracteres');
        return isValid;
    }

    // Atualizar validação visual do input
    updateInputValidation(input, isValid, errorMessage) {
        const wrapper = input.closest('.input-wrapper');
        const feedback = input.closest('.form-group').querySelector('.input-feedback');
        const validIcon = wrapper.querySelector('.valid-icon');
        const errorIcon = wrapper.querySelector('.error-icon');
        
        // Remover classes anteriores
        input.classList.remove('valid', 'invalid');
        wrapper.classList.remove('valid', 'invalid');
        
        if (input.value.trim() === '') {
            // Campo vazio
            validIcon.style.display = 'none';
            errorIcon.style.display = 'none';
            if (feedback) feedback.textContent = '';
        } else if (isValid) {
            // Campo válido
            input.classList.add('valid');
            wrapper.classList.add('valid');
            validIcon.style.display = 'block';
            errorIcon.style.display = 'none';
            if (feedback) feedback.textContent = '';
        } else {
            // Campo inválido
            input.classList.add('invalid');
            wrapper.classList.add('invalid');
            validIcon.style.display = 'none';
            errorIcon.style.display = 'block';
            if (feedback) feedback.textContent = errorMessage;
        }
    }

    // Toggle de visibilidade da senha
    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('passwordToggle');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Usar credenciais de demonstração
    useDemoCredentials(type) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (type === 'admin') {
            emailInput.value = 'admin@ridec.com';
            passwordInput.value = 'admin123';
        } else if (type === 'user') {
            emailInput.value = 'user@ridec.com';
            passwordInput.value = 'user123';
        }
        
        // Validar campos
        this.validateEmail(emailInput);
        this.validatePassword(passwordInput);
        
        // Focar no botão de login
        document.getElementById('loginBtn').focus();
    }

    // Processar login
    async handleLogin(e) {
        e.preventDefault();
        
        if (!this.initialized) {
            this.showError('Sistema ainda não foi inicializado. Aguarde...');
            return;
        }

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validar campos
        if (!this.validateEmail(document.getElementById('email'))) {
            this.showError('Por favor, insira um email válido.');
            return;
        }

        if (!this.validatePassword(document.getElementById('password'))) {
            this.showError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        // Mostrar loading
        this.setLoading(true);

        try {
            console.log('🔐 Tentando fazer login...', { email });
            
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
                this.currentUser = data.user;
                
                // Configurar sessão persistente se "Lembrar de mim" estiver marcado
                if (rememberMe) {
                    // A sessão já é persistente por padrão no Supabase
                    console.log('💾 Sessão configurada para persistir');
                }
                
                this.showSuccess('Login realizado com sucesso! Redirecionando...');
                
                // Redirecionar após um breve delay
                setTimeout(() => {
                    this.redirectToMain();
                }, 1500);
            }
        } catch (error) {
            console.error('❌ Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login. Tente novamente.';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou senha incorretos.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor, confirme seu email antes de fazer login.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
            }
            
            this.showError(errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    // Login social
    async socialLogin(provider) {
        if (!this.initialized) {
            this.showError('Sistema ainda não foi inicializado. Aguarde...');
            return;
        }

        try {
            console.log(`🔐 Tentando login com ${provider}...`);
            
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
            this.showError(`Erro ao conectar com ${provider}. Tente novamente.`);
        }
    }

    // Processar registro
    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        // Validações
        if (!name) {
            this.showError('Nome é obrigatório.');
            return;
        }

        if (!this.validateEmail(document.getElementById('registerEmail'))) {
            this.showError('Por favor, insira um email válido.');
            return;
        }

        if (password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('As senhas não coincidem.');
            return;
        }

        if (!acceptTerms) {
            this.showError('Você deve aceitar os termos de uso.');
            return;
        }

        try {
            console.log('📝 Criando nova conta...', { email, name });
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) {
                console.error('❌ Erro no registro:', error);
                throw error;
            }

            if (data.user) {
                console.log('✅ Conta criada com sucesso:', data.user.email);
                this.showSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
                this.hideRegisterModal();
            }
        } catch (error) {
            console.error('❌ Erro no registro:', error);
            
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            
            if (error.message.includes('User already registered')) {
                errorMessage = 'Este email já está cadastrado.';
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            }
            
            this.showError(errorMessage);
        }
    }

    // Processar recuperação de senha
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!this.validateEmail(document.getElementById('resetEmail'))) {
            this.showError('Por favor, insira um email válido.');
            return;
        }

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
            this.showSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
            this.hideForgotPasswordModal();
        } catch (error) {
            console.error('❌ Erro na recuperação:', error);
            this.showError('Erro ao enviar email de recuperação. Tente novamente.');
        }
    }

    // Mostrar modal de esqueci senha
    showForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('resetEmail').focus();
        }
    }

    // Esconder modal de esqueci senha
    hideForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('forgotPasswordForm').reset();
        }
    }

    // Mostrar modal de registro
    showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('registerName').focus();
        }
    }

    // Esconder modal de registro
    hideRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('registerForm').reset();
        }
    }

    // Esconder todos os modais
    hideAllModals() {
        this.hideForgotPasswordModal();
        this.hideRegisterModal();
    }

    // Definir estado de loading
    setLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');
        
        if (loading) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'inline-flex';
            btnLoading.style.display = 'none';
        }
    }

    // Mostrar mensagem de erro
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) {
            errorDiv.querySelector('.error-text').textContent = message;
            errorDiv.style.display = 'block';
        }
        
        if (successDiv) {
            successDiv.style.display = 'none';
        }
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }

    // Mostrar mensagem de sucesso
    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        const errorDiv = document.getElementById('errorMessage');
        
        if (successDiv) {
            successDiv.querySelector('.success-text').textContent = message;
            successDiv.style.display = 'block';
        }
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Auto-hide após 3 segundos
        setTimeout(() => {
            if (successDiv) successDiv.style.display = 'none';
        }, 3000);
    }

    // Redirecionar para página principal
    redirectToMain() {
        console.log('🔄 Redirecionando para página principal...');
        window.location.href = 'index.html';
    }

    // Verificar se está logado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Fazer logout
    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
                this.currentUser = null;
                console.log('✅ Logout realizado com sucesso');
            }
        } catch (error) {
            console.error('❌ Erro no logout:', error);
        }
    }
}

// Inicializar sistema de login quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.loginSystem = new LoginSystem();
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.LoginSystem = LoginSystem;
}


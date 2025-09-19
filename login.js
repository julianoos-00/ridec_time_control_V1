// Login System JavaScript
class LoginSystem {
    constructor() {
        this.supabase = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        try {
            // Usar instância global do Supabase se disponível
            if (window.supabaseClient && window.supabaseClientInitialized) {
                this.supabase = window.supabaseClient;
                console.log('✅ Reutilizando instância global do Supabase');
            } else if (typeof connectToSupabase === 'function') {
                this.supabase = connectToSupabase();
                if (this.supabase) {
                    console.log('✅ Conectado ao Supabase com sucesso');
                    // Armazenar como instância global
                    window.supabaseClient = this.supabase;
                    window.supabaseClientInitialized = true;
                }
            } else {
                console.warn('⚠️ Configuração do Supabase não encontrada. Usando modo demo.');
            }
            
            this.setupEventListeners();
            this.checkExistingSession();
            this.setupFormValidation();
            this.ensureInputsEnabled();
        } catch (error) {
            console.error('Erro ao inicializar sistema de login:', error);
            this.showMessage('Erro ao inicializar sistema. Usando modo offline.', 'warning');
        }
    }

    setupEventListeners() {
        // Form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Password toggle
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }


        // Forgot password
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => this.handleForgotPassword(e));
        }

        // Form input validation
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateInput(input));
            input.addEventListener('input', () => this.clearInputError(input));
        });
    }

    setupFormValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateEmail(emailInput));
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePassword(passwordInput));
        }
    }

    ensureInputsEnabled() {
        // Garantir que os campos de entrada estejam habilitados
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.disabled = false;
            emailInput.readOnly = false;
            emailInput.style.pointerEvents = 'auto';
            emailInput.style.cursor = 'text';
        }
        
        if (passwordInput) {
            passwordInput.disabled = false;
            passwordInput.readOnly = false;
            passwordInput.style.pointerEvents = 'auto';
            passwordInput.style.cursor = 'text';
        }
        
        console.log('✅ Campos de entrada verificados e habilitados');
    }

    async checkExistingSession() {
        try {
            if (this.supabase) {
                const { data: { session } } = await this.supabase.auth.getSession();
                if (session) {
                    this.redirectToMain();
                }
            }
        } catch (error) {
            console.log('Nenhuma sessão ativa encontrada');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate inputs
        if (!this.validateForm(email, password)) {
            return;
        }

        this.setLoading(true);

        try {
            // Usar autenticação customizada com verificação de senha criptografada
            await this.handleDemoLogin(email, password, rememberMe);
        } catch (error) {
            console.error('Erro no login:', error);
            this.handleLoginError(error);
        } finally {
            this.setLoading(false);
        }
    }

    async handleDemoLogin(email, password, rememberMe) {
        try {
            console.log('🔍 Login: Tentando login para:', email);
            
            // Primeiro, tentar buscar usuário no banco de dados
            if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
                console.log('✅ Login: Supabase conectado, buscando usuário...');
                const usuario = await this.buscarUsuarioPorEmail(email);
                console.log('👤 Login: Usuário encontrado:', usuario);
                
                if (usuario) {
                    // Verificar senha criptografada
                    if (typeof passwordSecurity !== 'undefined') {
                        console.log('🔐 Login: Verificando senha...');
                        const senhaValida = await passwordSecurity.verifyPassword(password, usuario.senha_usuario);
                        console.log('🔐 Login: Senha válida:', senhaValida);
                        
                        if (senhaValida) {
                            const userData = {
                                id: usuario.cod_usuario.toString(),
                                email: usuario.email_usuario,
                                role: this.getUserRole(usuario.cod_tipo_usuario),
                                name: usuario.nome_usuario,
                                created_at: new Date().toISOString(),
                                // Incluir todos os dados do usuário do banco
                                cod_usuario: usuario.cod_usuario,
                                nome_usuario: usuario.nome_usuario,
                                email_usuario: usuario.email_usuario,
                                cod_empresa: usuario.cod_empresa,
                                cod_tipo_usuario: usuario.cod_tipo_usuario,
                                ies_ativo: usuario.ies_ativo
                            };
                            console.log('✅ Login: Dados do usuário preparados:', userData);
                            this.handleLoginSuccess(userData, rememberMe);
                            return;
                        } else {
                            console.log('❌ Login: Senha inválida');
                        }
                    } else {
                        console.log('❌ Login: passwordSecurity não disponível');
                    }
                } else {
                    console.log('❌ Login: Usuário não encontrado no banco');
                }
            } else {
                console.log('❌ Login: Supabase não conectado');
            }
            
            // Fallback para credenciais demo (sem criptografia)
            const demoUsers = {
                'admin@ridec.com': { 
                    password: 'admin123', 
                    role: 'admin', 
                    name: 'Administrador',
                    cod_empresa: 1,
                    cod_tipo_usuario: 1
                },
                'usuario@ridec.com': { 
                    password: 'user123', 
                    role: 'user', 
                    name: 'Usuário',
                    cod_empresa: 1,
                    cod_tipo_usuario: 2
                },
                'admin': { 
                    password: 'admin123', 
                    role: 'admin', 
                    name: 'Administrador',
                    cod_empresa: 1,
                    cod_tipo_usuario: 1
                },
                'user': { 
                    password: 'user123', 
                    role: 'user', 
                    name: 'Usuário',
                    cod_empresa: 1,
                    cod_tipo_usuario: 2
                }
            };

            const user = demoUsers[email.toLowerCase()];
            
            if (user && user.password === password) {
                const userData = {
                    id: Date.now().toString(),
                    email: email,
                    role: user.role,
                    name: user.name,
                    created_at: new Date().toISOString(),
                    // Incluir dados completos do usuário demo
                    cod_usuario: Date.now(),
                    nome_usuario: user.name,
                    email_usuario: email,
                    cod_empresa: user.cod_empresa,
                    cod_tipo_usuario: user.cod_tipo_usuario,
                    ies_ativo: 'S'
                };

                this.handleLoginSuccess(userData, rememberMe);
            } else {
                this.showMessage('Email ou senha incorretos. Verifique suas credenciais.', 'error');
            }
        } catch (error) {
            console.error('Erro no login demo:', error);
            this.showMessage('Erro ao verificar credenciais. Tente novamente.', 'error');
        }
    }

    // Buscar usuário por email no banco de dados
    async buscarUsuarioPorEmail(email) {
        try {
            console.log('🔍 buscarUsuarioPorEmail: Buscando usuário:', email);
            
            if (typeof supabaseDB !== 'undefined' && supabaseDB.isConnected()) {
                console.log('✅ buscarUsuarioPorEmail: Supabase conectado');
                
                const { data, error } = await supabaseDB.getClient()
                    .from('usuario')
                    .select('*')
                    .eq('email_usuario', email)
                    .eq('ies_ativo', 'S')
                    .single();

                if (error) {
                    console.log('❌ buscarUsuarioPorEmail: Usuário não encontrado:', error.message);
                    return null;
                }
                
                console.log('✅ buscarUsuarioPorEmail: Usuário encontrado:', data);
                return data;
            } else {
                console.log('❌ buscarUsuarioPorEmail: Supabase não conectado');
            }
        } catch (error) {
            console.error('❌ buscarUsuarioPorEmail: Erro ao buscar usuário:', error);
        }
        return null;
    }

    // Mapear tipo de usuário para role
    getUserRole(codTipoUsuario) {
        const roleMap = {
            1: 'admin',    // Admin do Sistema
            2: 'manager',  // Gestor da Área
            3: 'board',    // Membro do Board
            4: 'user',     // Membro da Área
            5: 'system'    // Sistema
        };
        return roleMap[codTipoUsuario] || 'user';
    }

    handleLoginSuccess(user, rememberMe) {
        console.log('✅ handleLoginSuccess: Login bem-sucedido para:', user);
        
        // Store user session
        const sessionData = {
            user: user,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };

        console.log('💾 handleLoginSuccess: Armazenando dados de sessão:', sessionData);

        if (rememberMe) {
            localStorage.setItem('ridec_session', JSON.stringify(sessionData));
            console.log('💾 handleLoginSuccess: Dados armazenados no localStorage');
        } else {
            sessionStorage.setItem('ridec_session', JSON.stringify(sessionData));
            console.log('💾 handleLoginSuccess: Dados armazenados no sessionStorage');
        }

        this.showMessage(`Bem-vindo, ${user.name || user.email}!`, 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            this.redirectToMain();
        }, 1500);
    }

    handleLoginError(error) {
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        
        if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou senha incorretos.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor, confirme seu email antes de fazer login.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
            } else {
                errorMessage = error.message;
            }
        }

        this.showMessage(errorMessage, 'error');
    }


    handleForgotPassword(event) {
        event.preventDefault();
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            this.showMessage('Digite seu email para recuperar a senha.', 'warning');
            return;
        }

        if (!this.validateEmail(document.getElementById('email'))) {
            return;
        }

        this.showMessage('Funcionalidade de recuperação de senha será implementada em breve.', 'info');
    }

    validateForm(email, password) {
        let isValid = true;

        if (!email) {
            this.showInputError('email', 'Email é obrigatório');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showInputError('email', 'Email inválido');
            isValid = false;
        }

        if (!password) {
            this.showInputError('password', 'Senha é obrigatória');
            isValid = false;
        } else if (password.length < 6) {
            this.showInputError('password', 'Senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        return isValid;
    }

    validateInput(input) {
        const value = input.value.trim();
        const fieldName = input.id;

        if (fieldName === 'email') {
            return this.validateEmail(input);
        } else if (fieldName === 'password') {
            return this.validatePassword(input);
        }

        return true;
    }

    validateEmail(input) {
        const email = input.value.trim();
        
        if (!email) {
            this.clearInputError(input);
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showInputError('email', 'Email inválido');
            return false;
        }

        this.clearInputError(input);
        return true;
    }

    validatePassword(input) {
        const password = input.value;
        
        if (!password) {
            this.clearInputError(input);
            return false;
        }

        if (password.length < 6) {
            this.showInputError('password', 'Senha deve ter pelo menos 6 caracteres');
            return false;
        }

        this.clearInputError(input);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showInputError(fieldName, message) {
        const input = document.getElementById(fieldName);
        const feedback = input.parentNode.querySelector('.input-feedback');
        
        if (input) {
            input.classList.add('error');
        }
        
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    clearInputError(input) {
        input.classList.remove('error');
        const feedback = input.parentNode.querySelector('.input-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
    }

    togglePasswordVisibility() {
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

    setLoading(loading) {
        this.isLoading = loading;
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        if (loading) {
            loginBtn.disabled = true;
            loginBtn.classList.add('loading');
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
        
        // Garantir que os campos de entrada não sejam afetados pelo loading
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) {
            emailInput.disabled = false;
            emailInput.readOnly = false;
        }
        
        if (passwordInput) {
            passwordInput.disabled = false;
            passwordInput.readOnly = false;
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }

    getMessageIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    redirectToMain() {
        // Check if we're already on the main page
        if (window.location.pathname.includes('index.html')) {
            return;
        }

        // Redirect to main application
        window.location.href = 'index.html';
    }

    // Demo credentials helper
    fillDemoCredentials(type) {
        const credentials = {
            admin: { email: 'admin@ridec.com', password: 'admin123' },
            user: { email: 'usuario@ridec.com', password: 'user123' }
        };

        const cred = credentials[type];
        if (cred) {
            document.getElementById('email').value = cred.email;
            document.getElementById('password').value = cred.password;
            
            // Trigger validation
            this.validateEmail(document.getElementById('email'));
            this.validatePassword(document.getElementById('password'));
            
            this.showMessage(`Credenciais ${type} preenchidas!`, 'success');
        }
    }
}

// Initialize login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginSystem = new LoginSystem();
});

// Global function for demo credentials
function fillDemoCredentials(type) {
    if (window.loginSystem) {
        window.loginSystem.fillDemoCredentials(type);
    }
}

// Handle page visibility change to check session
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.loginSystem) {
        window.loginSystem.checkExistingSession();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginSystem;
}

// Sistema de segurança para senhas - Implementação robusta
class PasswordSecurity {
    constructor() {
        this.saltRounds = 12;
        this.algorithm = 'PBKDF2';
        this.iterations = 100000; // Número de iterações para PBKDF2
    }

    // Gerar salt aleatório seguro
    generateSalt() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Hash de senha usando PBKDF2 (mais seguro que SHA-256 simples)
    async hashPassword(password) {
        try {
            // Gerar salt aleatório
            const salt = this.generateSalt();
            
            // Converter senha e salt para ArrayBuffer
            const passwordBuffer = new TextEncoder().encode(password);
            const saltBuffer = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            // Importar a chave (senha) para uso com PBKDF2
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits']
            );
            
            // Derivar a chave usando PBKDF2
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: this.iterations,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256 // 256 bits = 32 bytes
            );
            
            // Converter para string hexadecimal
            const hashArray = Array.from(new Uint8Array(derivedBits));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Retornar salt + hash (formato: salt:hash)
            return `${salt}:${hash}`;
        } catch (error) {
            console.error('Erro ao gerar hash da senha:', error);
            throw new Error('Falha na criptografia da senha');
        }
    }

    // Verificar senha
    async verifyPassword(password, hashedPassword) {
        try {
            // Separar salt e hash
            const [salt, hash] = hashedPassword.split(':');
            if (!salt || !hash) {
                throw new Error('Formato de hash inválido');
            }
            
            // Converter senha e salt para ArrayBuffer
            const passwordBuffer = new TextEncoder().encode(password);
            const saltBuffer = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            // Importar a chave (senha) para uso com PBKDF2
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits']
            );
            
            // Derivar a chave usando PBKDF2 com o mesmo salt
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: this.iterations,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256 // 256 bits = 32 bytes
            );
            
            // Converter para string hexadecimal
            const hashArray = Array.from(new Uint8Array(derivedBits));
            const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Comparar hashes de forma segura (timing-safe)
            return this.timingSafeEqual(hash, computedHash);
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            return false;
        }
    }

    // Comparação segura contra timing attacks
    timingSafeEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        
        return result === 0;
    }


    // Validar força da senha
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const score = [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ].filter(Boolean).length;

        return {
            score: score,
            maxScore: 5,
            strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
            requirements: {
                minLength: password.length >= minLength,
                hasUpperCase,
                hasLowerCase,
                hasNumbers,
                hasSpecialChar
            }
        };
    }
}

// Exemplo de uso
const passwordSecurity = new PasswordSecurity();

// Função para demonstrar segurança
async function demonstratePasswordSecurity() {
    const password = 'MinhaSenh@123';
    
    console.log('🔐 Demonstração de Segurança de Senhas');
    console.log('=====================================');
    
    // Validar força da senha
    const strength = passwordSecurity.validatePasswordStrength(password);
    console.log('📊 Força da senha:', strength);
    
    try {
        // Hash da senha
        const hashedPassword = await passwordSecurity.hashPassword(password);
        console.log('🔒 Senha original:', password);
        console.log('🔐 Senha com hash:', hashedPassword);
        
        // Verificar senha
        const isValid = await passwordSecurity.verifyPassword(password, hashedPassword);
        console.log('✅ Verificação:', isValid ? 'Senha correta' : 'Senha incorreta');
        
        // Teste com senha incorreta
        const isInvalid = await passwordSecurity.verifyPassword('senha_errada', hashedPassword);
        console.log('❌ Verificação (senha errada):', isInvalid ? 'Senha correta' : 'Senha incorreta');
    } catch (error) {
        console.error('❌ Erro na demonstração:', error);
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordSecurity;
}

// Para uso no navegador
if (typeof window !== 'undefined') {
    window.PasswordSecurity = PasswordSecurity;
    window.demonstratePasswordSecurity = demonstratePasswordSecurity;
}

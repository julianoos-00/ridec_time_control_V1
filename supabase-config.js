// Configuração do Supabase para RIDEC Time Control
// Substitua as credenciais pelas suas do Supabase

const SUPABASE_CONFIG = {
    // URL do seu projeto Supabase
    url: 'https://fphyoywhgelrxtjfovmz.supabase.co',
    
    // Chave pública do Supabase (anon key)
    // Chave real do projeto Supabase
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwaHlveXdoZ2Vscnh0amZvdm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MzI2NDAsImV4cCI6MjA3MjUwODY0MH0.y3wOGH-YlcVMKVm9KeDaEve0fJDTFSmSVyKYBp2L2bY',
    
    // Configurações de conexão direta ao PostgreSQL
    database: {
        host: 'aws-1-sa-east-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.fphyoywhgelrxtjfovmz',
        password: 'n40-M3-l3mbr0',
        ssl: true
    }
};

// Função para conectar ao Supabase via JavaScript
function connectToSupabase() {
    // Verificar se já existe uma instância global
    if (window.supabaseClient && window.supabaseClientInitialized) {
        console.log('✅ Reutilizando instância global do Supabase');
        return window.supabaseClient;
    }

    // Verificar se a biblioteca do Supabase está carregada
    if (typeof supabase === 'undefined') {
        console.error('Biblioteca do Supabase não encontrada. Carregue o script do Supabase primeiro.');
        return null;
    }
    
    // Criar cliente Supabase
    const supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    
    // Armazenar como instância global
    window.supabaseClient = supabaseClient;
    window.supabaseClientInitialized = true;
    
    return supabaseClient;
}

// Função para conectar diretamente ao PostgreSQL (para uso com psql ou outras ferramentas)
function getPostgreSQLConnectionString() {
    const config = SUPABASE_CONFIG.database;
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?sslmode=require`;
}

// Função para validar configuração
function validateConfig() {
    const issues = [];
    
    if (!SUPABASE_CONFIG.url) {
        issues.push('URL do Supabase não configurada');
    }
    
    if (!SUPABASE_CONFIG.anonKey) {
        issues.push('Chave anonKey não configurada');
    } else if (SUPABASE_CONFIG.anonKey.includes('EjemploDeChavePublica')) {
        issues.push('Chave anonKey ainda é o exemplo - substitua pela sua chave real');
    }
    
    if (issues.length > 0) {
        console.warn('⚠️ Problemas na configuração do Supabase:', issues);
        return false;
    }
    
    console.log('✅ Configuração do Supabase válida');
    return true;
}

// Função para testar conexão
async function testConnection() {
    try {
        // Validar configuração primeiro
        if (!validateConfig()) {
            throw new Error('Configuração do Supabase inválida');
        }
        
        const supabase = connectToSupabase();
        if (!supabase) {
            throw new Error('Não foi possível conectar ao Supabase');
        }
        
        // Testar conexão fazendo uma consulta simples
        const { data, error } = await supabase
            .from('empresa')
            .select('count')
            .limit(1);
            
        if (error) {
            throw error;
        }
        
        console.log('Conexão com Supabase estabelecida com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao conectar com Supabase:', error);
        return false;
    }
}

// Exportar configurações para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        connectToSupabase,
        getPostgreSQLConnectionString,
        validateConfig,
        testConnection
    };
}

// Para uso no navegador
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.connectToSupabase = connectToSupabase;
    window.getPostgreSQLConnectionString = getPostgreSQLConnectionString;
    window.validateConfig = validateConfig;
    window.testConnection = testConnection;
}

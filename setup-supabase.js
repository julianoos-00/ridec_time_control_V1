// Script Node.js para configurar o banco Supabase
// Execute com: node setup-supabase.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const config = {
    host: 'aws-1-sa-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.fphyoywhgelrxtjfovmz',
    password: 'n40-M3-l3mbr0',
    ssl: {
        rejectUnauthorized: false
    }
};

async function setupDatabase() {
    const client = new Client(config);
    
    try {
        console.log('🔌 Conectando ao Supabase...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');
        
        console.log('📖 Lendo script SQL...');
        const sqlScript = fs.readFileSync(path.join(__dirname, 'create_database_supabase.sql'), 'utf8');
        
        console.log('🚀 Executando script de configuração...');
        await client.query(sqlScript);
        
        console.log('✅ Banco de dados configurado com sucesso!');
        console.log('');
        console.log('📊 Resumo da configuração:');
        console.log('- 15 tabelas criadas/verificadas');
        console.log('- 12 índices criados/verificados');
        console.log('- 2 views criadas/atualizadas');
        console.log('- 2 funções criadas/atualizadas');
        console.log('- 16 triggers criados');
        console.log('- RLS habilitado para segurança');
        console.log('');
        console.log('🎉 Configuração concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error.message);
        console.error('Detalhes:', error);
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.');
    }
}

// Verificar se o arquivo SQL existe
if (!fs.existsSync('create_database_supabase.sql')) {
    console.error('❌ Arquivo create_database_supabase.sql não encontrado!');
    process.exit(1);
}

// Executar configuração
setupDatabase().catch(console.error);

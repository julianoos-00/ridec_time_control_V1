// Script para testar conexão com Supabase
// Execute com: node test-connection.js

const { Client } = require('pg');

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

async function testConnection() {
    const client = new Client(config);
    
    try {
        console.log('🔌 Testando conexão com Supabase...');
        console.log(`Host: ${config.host}:${config.port}`);
        console.log(`Database: ${config.database}`);
        console.log(`User: ${config.user}`);
        console.log('');
        
        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Testar consulta simples
        console.log('🧪 Testando consulta...');
        const result = await client.query('SELECT version()');
        console.log('✅ Consulta executada com sucesso!');
        console.log(`📊 Versão do PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
        
        // Verificar se as tabelas existem
        console.log('🔍 Verificando tabelas...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('empresa', 'usuario', 'tipo_usuario', 'modelo_ridec')
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('✅ Tabelas encontradas:');
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        } else {
            console.log('⚠️  Nenhuma tabela RIDEC encontrada. Execute o setup primeiro.');
        }
        
        console.log('');
        console.log('🎉 Teste de conexão concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Dica: Verifique se o host e porta estão corretos');
        } else if (error.code === '28P01') {
            console.error('💡 Dica: Verifique se o usuário e senha estão corretos');
        } else if (error.code === '3D000') {
            console.error('💡 Dica: Verifique se o nome do banco está correto');
        }
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.');
    }
}

// Executar teste
testConnection().catch(console.error);

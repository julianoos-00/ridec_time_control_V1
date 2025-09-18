# Script PowerShell simples para configurar o banco Supabase
# Execute com: .\setup-supabase-simple.ps1

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    RIDEC Time Control - Supabase Setup" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Configurações do Supabase
$SUPABASE_HOST = "aws-1-sa-east-1.pooler.supabase.com"
$SUPABASE_PORT = "5432"
$SUPABASE_DB = "postgres"
$SUPABASE_USER = "postgres.fphyoywhgelrxtjfovmz"
$SUPABASE_PASSWORD = "n40-M3-l3mbr0"

Write-Host "Configurações do Supabase:" -ForegroundColor Yellow
Write-Host "- Host: $SUPABASE_HOST" -ForegroundColor White
Write-Host "- Porta: $SUPABASE_PORT" -ForegroundColor White
Write-Host "- Database: $SUPABASE_DB" -ForegroundColor White
Write-Host "- Usuario: $SUPABASE_USER" -ForegroundColor White
Write-Host ""

# Verificar se o arquivo SQL existe
if (-not (Test-Path "create_database_supabase.sql")) {
    Write-Host "ERRO: Arquivo create_database_supabase.sql nao encontrado!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "Arquivo SQL encontrado!" -ForegroundColor Green
Write-Host ""

# Verificar se psql está disponível
try {
    $null = & psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL encontrado!" -ForegroundColor Green
    } else {
        throw "psql nao encontrado"
    }
} catch {
    Write-Host "ERRO: PostgreSQL (psql) nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar o PostgreSQL:" -ForegroundColor Yellow
    Write-Host "1. Baixe em: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Durante a instalacao, certifique-se de adicionar ao PATH" -ForegroundColor White
    Write-Host "3. Reinicie o PowerShell apos a instalacao" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""

# Confirmar execução
$confirm = Read-Host "Deseja executar o script de configuracao? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Operacao cancelada." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 0
}

Write-Host ""
Write-Host "Executando script de configuracao..." -ForegroundColor Cyan
Write-Host ""

# Definir variável de ambiente para senha
$env:PGPASSWORD = $SUPABASE_PASSWORD

# Executar o script SQL
try {
    & psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB -f "create_database_supabase.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "    BANCO CONFIGURADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Configuracao concluida!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para conectar ao banco:" -ForegroundColor Yellow
        Write-Host "psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB" -ForegroundColor White
        Write-Host ""
    } else {
        throw "Erro na execucao do script"
    }
} catch {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host "    ERRO AO CONFIGURAR BANCO!" -ForegroundColor Red
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique as credenciais e tente novamente." -ForegroundColor Red
    Write-Host ""
}

# Limpar variável de ambiente
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Read-Host "Pressione Enter para sair"

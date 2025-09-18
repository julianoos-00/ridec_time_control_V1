@echo off
echo ===============================================
echo    RIDEC Time Control - Database Setup
echo ===============================================
echo.

REM Verificar se PostgreSQL está instalado
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: PostgreSQL nao encontrado!
    echo Por favor, instale o PostgreSQL e adicione ao PATH.
    pause
    exit /b 1
)

echo PostgreSQL encontrado!
echo.

REM Solicitar informações de conexão
set /p DB_HOST="Host do banco (padrao: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Porta do banco (padrao: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_USER="Usuario do PostgreSQL (padrao: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

echo.
echo Configuracoes:
echo - Host: %DB_HOST%
echo - Porta: %DB_PORT%
echo - Usuario: %DB_USER%
echo - Arquivo SQL: create_database.sql
echo.

set /p CONFIRM="Deseja continuar? (s/n): "
if /i not "%CONFIRM%"=="s" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo Executando script de criacao do banco...
echo.

REM Executar o script SQL
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -f create_database.sql

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    BANCO DE DADOS CRIADO COM SUCESSO!
    echo ===============================================
    echo.
    echo Banco: ridec_time_control
    echo Usuario da aplicacao: ridec_app
    echo Senha da aplicacao: ridec_password
    echo.
    echo Para conectar ao banco:
    echo psql -h %DB_HOST% -p %DB_PORT% -U ridec_app -d ridec_time_control
    echo.
) else (
    echo.
    echo ===============================================
    echo    ERRO AO CRIAR BANCO DE DADOS!
    echo ===============================================
    echo.
    echo Verifique as configuracoes e tente novamente.
    echo.
)

pause

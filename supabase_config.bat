@echo off
echo ===============================================
echo    RIDEC Time Control - Supabase Setup
echo ===============================================
echo.

REM Configurações do Supabase
set SUPABASE_HOST=aws-1-sa-east-1.pooler.supabase.com
set SUPABASE_PORT=5432
set SUPABASE_DB=postgres
set SUPABASE_USER=postgres.fphyoywhgelrxtjfovmz
set SUPABASE_PASSWORD=n40-M3-l3mbr0

echo Configuracoes do Supabase:
echo - Host: %SUPABASE_HOST%
echo - Porta: %SUPABASE_PORT%
echo - Database: %SUPABASE_DB%
echo - Usuario: %SUPABASE_USER%
echo - Arquivo SQL: create_database_supabase.sql
echo.

set /p CONFIRM="Deseja executar o script no Supabase? (s/n): "
if /i not "%CONFIRM%"=="s" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo Executando script de criacao do banco no Supabase...
echo.

REM Executar o script SQL no Supabase
psql -h %SUPABASE_HOST% -p %SUPABASE_PORT% -U %SUPABASE_USER% -d %SUPABASE_DB% -f create_database_supabase.sql

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo    BANCO DE DADOS CONFIGURADO NO SUPABASE!
    echo ===============================================
    echo.
    echo Host: %SUPABASE_HOST%
    echo Porta: %SUPABASE_PORT%
    echo Database: %SUPABASE_DB%
    echo Usuario: %SUPABASE_USER%
    echo.
    echo Para conectar ao banco:
    echo psql -h %SUPABASE_HOST% -p %SUPABASE_PORT% -U %SUPABASE_USER% -d %SUPABASE_DB%
    echo.
) else (
    echo.
    echo ===============================================
    echo    ERRO AO CONFIGURAR BANCO NO SUPABASE!
    echo ===============================================
    echo.
    echo Verifique as configuracoes e tente novamente.
    echo.
)

pause

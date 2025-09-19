# Implementação - Campo stage-header com nome_tipo_etapa

## Resumo da Implementação

Este documento descreve as modificações implementadas para que o campo `stage-header` na tela `ridec-occurrences.html` carregue o valor de `nome_tipo_etapa` correspondente, considerando os valores da tabela `tipo_etapa`.

## Problema Identificado

- Os nomes das etapas estavam sendo exibidos como siglas hardcoded (RI, D, E, C, A)
- Não existia uma tabela `tipo_etapa` para armazenar os nomes descritivos das etapas
- As funções estavam usando mapeamentos estáticos em vez de dados do banco

## Solução Implementada

### 1. Criação da Tabela `tipo_etapa`

**Arquivo:** `create-tipo-etapa-table.sql`

```sql
CREATE TABLE IF NOT EXISTS tipo_etapa (
    cod_tipo_etapa SERIAL PRIMARY KEY,
    nome_tipo_etapa VARCHAR(50) NOT NULL UNIQUE,
    sigla_tipo_etapa VARCHAR(10) NOT NULL UNIQUE,
    descricao TEXT,
    ordem_etapa INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Dados inseridos:**
- 1: Research (RI) - Fase de pesquisa e análise inicial
- 2: Development (D) - Fase de desenvolvimento e planejamento  
- 3: Engineering (E) - Fase de engenharia e projeto detalhado
- 4: Construction (C) - Fase de construção e implementação
- 5: Assembly (A) - Fase de montagem e integração final

### 2. Modificação da Função `getEtapasByFase`

**Arquivo:** `ridec-occurrences.js` (linha 463-479)

**Antes:**
```javascript
const { data, error } = await window.supabaseDB.getClient()
    .from('modelo_etapa_ridec')
    .select(`
        *,
        uom:cod_uom (
            desc_uom
        )
    `)
```

**Depois:**
```javascript
const { data, error } = await window.supabaseDB.getClient()
    .from('modelo_etapa_ridec')
    .select(`
        *,
        uom:cod_uom (
            desc_uom
        ),
        tipo_etapa:tipo_etapa (
            cod_tipo_etapa,
            nome_tipo_etapa,
            sigla_tipo_etapa,
            descricao,
            ordem_etapa
        )
    `)
```

### 3. Atualização da Função `getModelStageInfo`

**Arquivo:** `ridec-occurrences.js` (linha 1426-1428)

**Antes:**
```javascript
const sigla = this.getFaseSigla(fase);
```

**Depois:**
```javascript
// Usar nome da etapa da tabela tipo_etapa se disponível, senão usar sigla hardcoded
const nomeEtapa = etapa.tipo_etapa?.nome_tipo_etapa || this.getFaseSigla(fase);
const siglaEtapa = etapa.tipo_etapa?.sigla_tipo_etapa || this.getFaseSigla(fase);
```

**Renderização atualizada:**
```javascript
return `
    <div class="stage-column">
        <div class="stage-sigla" title="${siglaEtapa}">${nomeEtapa}</div>
        <div class="stage-uom">
            <div class="uom-value">${uomValue}</div>
            <div class="uom-unit">${uomUnit}</div>
        </div>
    </div>
`;
```

### 4. Atualização da Função `createStagesColumnsNew`

**Arquivo:** `ridec-occurrences.js` (linha 1790-1792)

**Antes:**
```javascript
const sigla = this.getSiglaFromTipoEtapa(etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa');
```

**Depois:**
```javascript
// Obter nome e sigla do tipo de etapa
const nomeEtapa = etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa';
const siglaEtapa = etapa.tipo_etapa?.sigla_tipo_etapa || this.getSiglaFromTipoEtapa(nomeEtapa);
```

**Renderização atualizada:**
```javascript
return `
    <div class="stage-column">
        <div class="stage-header">
            <div class="stage-sigla" title="${siglaEtapa}">${nomeEtapa}</div>
        </div>
        <!-- resto do conteúdo -->
    </div>
`;
```

## Funcionalidades Implementadas

### 1. Nomes Completos das Etapas
- O campo `stage-sigla` agora exibe o nome completo da etapa
- Exemplo: "Research" em vez de "RI"
- Tooltip mostra a sigla para referência rápida

### 2. Fallback para Compatibilidade
- Se a tabela `tipo_etapa` não estiver disponível, o sistema usa as siglas hardcoded
- Mantém compatibilidade com dados existentes

### 3. Dados Estruturados
- Nomes descritivos das etapas
- Siglas padronizadas
- Ordem sequencial das etapas
- Descrições detalhadas

## Arquivos Modificados

1. **`create-tipo-etapa-table.sql`** (NOVO)
   - Script para criar a tabela `tipo_etapa`
   - Inserção dos dados padrão
   - Configuração de foreign keys

2. **`ridec-occurrences.js`** (MODIFICADO)
   - Função `getEtapasByFase`: Adicionado JOIN com `tipo_etapa`
   - Função `getModelStageInfo`: Uso de `nome_tipo_etapa` e `sigla_tipo_etapa`
   - Função `createStagesColumnsNew`: Uso de nomes da tabela `tipo_etapa`

3. **`test-tipo-etapa-implementation.html`** (NOVO)
   - Script de teste para verificar a implementação
   - Testes de conexão, JOIN, renderização e nomes

## Como Executar

### 1. Criar a Tabela
```sql
-- Execute no SQL Editor do Supabase Dashboard
\i create-tipo-etapa-table.sql
```

### 2. Testar a Implementação
```bash
# Abra o arquivo de teste no navegador
open test-tipo-etapa-implementation.html
```

### 3. Verificar na Tela de Ocorrências
- Acesse `ridec-occurrences.html`
- Os campos `stage-header` agora exibem os nomes completos das etapas
- Tooltips mostram as siglas para referência rápida

## Benefícios

1. **Nomes Completos**: Etapas agora exibem nomes completos em vez de siglas
2. **Tooltips com Siglas**: Usuários podem ver a sigla ao passar o mouse para referência rápida
3. **Dados Estruturados**: Informações organizadas em tabela dedicada
4. **Compatibilidade**: Sistema funciona com ou sem a nova tabela
5. **Manutenibilidade**: Fácil adição de novas etapas ou modificação de nomes

## Estrutura da Tabela `tipo_etapa`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cod_tipo_etapa` | SERIAL | Código único da etapa |
| `nome_tipo_etapa` | VARCHAR(50) | Nome completo da etapa |
| `sigla_tipo_etapa` | VARCHAR(10) | Sigla da etapa |
| `descricao` | TEXT | Descrição detalhada |
| `ordem_etapa` | INTEGER | Ordem sequencial |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

## Relacionamentos

- `modelo_etapa_ridec.cod_tipo_etapa` → `tipo_etapa.cod_tipo_etapa`
- `etapa_ridec.cod_tipo_etapa` → `tipo_etapa.cod_tipo_etapa`

## Status da Implementação

✅ **Concluído:**
- Criação da tabela `tipo_etapa`
- Modificação das funções de consulta
- Atualização das funções de renderização
- Implementação de tooltips
- Criação de script de teste

🔄 **Próximos Passos:**
- Executar o script SQL no banco de dados
- Testar a implementação
- Verificar funcionamento na tela de ocorrências

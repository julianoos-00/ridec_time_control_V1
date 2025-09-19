# Implementação - Busca Sequencial de Etapas por cod_m_etapa_anterior

## Resumo da Implementação

Este documento descreve as modificações implementadas para que as informações das etapas do modelo sejam carregadas da tabela `modelo_etapa_ridec` seguindo uma sequência baseada no campo `cod_m_etapa_anterior`.

## Problema Identificado

- As etapas do modelo não estavam sendo carregadas na ordem correta
- A busca anterior usava mapeamentos hardcoded por fase (Research, Development, etc.)
- Não seguia a sequência definida pelo campo `cod_m_etapa_anterior`

## Solução Implementada

### 1. Nova Lógica de Busca Sequencial

**Algoritmo implementado:**
1. Procurar pela linha onde `cod_modelo_ridec` é igual ao valor correspondente e `cod_m_etapa_anterior = 0`
2. Após coletar os valores, `x = cod_modelo_etapa`
3. Para as demais etapas, procurar pela linha onde `cod_m_etapa_anterior = x`
4. Se encontrar, `x = cod_modelo_etapa` e repetir o processo

### 2. Função `getEtapasByModelo` Atualizada

**Arquivo:** `ridec-occurrences.js` (linha 372-475)

**Antes:**
```javascript
// Buscar etapas de cada fase RIDEC
const etapas = [];
const etapasRI = await this.getEtapasByFase(codModelo, 'm_etapa_ri');
// ... outras fases
```

**Depois:**
```javascript
// Buscar todas as etapas do modelo
const { data: todasEtapas, error } = await window.supabaseDB.getClient()
    .from('modelo_etapa_ridec')
    .select(`
        *,
        uom:cod_uom (desc_uom),
        tipo_etapa:tipo_etapa (
            cod_tipo_etapa,
            nome_tipo_etapa,
            sigla_tipo_etapa,
            descricao,
            ordem_etapa
        )
    `)
    .eq('cod_modelo_ridec', codModelo)
    .order('cod_modelo_etapa');

// Encontrar primeira etapa (cod_m_etapa_anterior = 0)
const primeiraEtapa = todasEtapas.find(etapa => etapa.cod_m_etapa_anterior === 0);

// Construir sequência das etapas
const etapasSequenciais = [];
let etapaAtual = primeiraEtapa;
let x = etapaAtual.cod_modelo_etapa;

etapasSequenciais.push(etapaAtual);

// Buscar próximas etapas seguindo a sequência
while (true) {
    const proximaEtapa = todasEtapas.find(etapa => etapa.cod_m_etapa_anterior === x);
    if (!proximaEtapa) break;
    
    etapasSequenciais.push(proximaEtapa);
    x = proximaEtapa.cod_modelo_etapa;
}
```

### 3. Função `getModelStageInfo` Atualizada

**Arquivo:** `ridec-occurrences.js` (linha 1421-1485)

**Mudanças principais:**
- Usa a nova função `getEtapasByModelo` com lógica sequencial
- Renderiza etapas na ordem encontrada pela sequência
- Exibe contador de etapas no cabeçalho
- Mantém compatibilidade com dados existentes

**Renderização atualizada:**
```javascript
// Renderizar etapas na ordem sequencial encontrada
const stagesHtml = etapas.map((etapa, index) => {
    const nomeEtapa = etapa.tipo_etapa?.nome_tipo_etapa || etapa.fase || 'Etapa';
    const siglaEtapa = etapa.tipo_etapa?.sigla_tipo_etapa || etapa.fase?.substring(0, 2).toUpperCase() || 'ET';
    
    return `
        <div class="stage-column">
            <div class="stage-sigla" title="${siglaEtapa}">${nomeEtapa}</div>
            <div class="stage-uom">
                <div class="uom-value">${etapa.valor_uom || '1.0'}</div>
                <div class="uom-unit">${etapa.uom?.desc_uom || 'un'}</div>
            </div>
        </div>
    `;
}).join('');
```

## Funcionalidades Implementadas

### 1. Busca Sequencial Inteligente
- Encontra automaticamente a primeira etapa (`cod_m_etapa_anterior = 0`)
- Segue a sequência definida pelo campo `cod_m_etapa_anterior`
- Para quando não encontra mais etapas na sequência

### 2. Renderização em Ordem Correta
- Etapas são exibidas na ordem sequencial encontrada
- Nomes completos das etapas (Research, Development, etc.)
- Tooltips com siglas para referência rápida

### 3. Logs Detalhados
- Console logs para debug da sequência
- Informações sobre cada etapa encontrada
- Verificação da ordem das etapas

### 4. Compatibilidade
- Mantém compatibilidade com dados existentes
- Fallback para casos onde não há etapas sequenciais
- Tratamento de erros robusto

## Estrutura da Sequência

### Exemplo de Sequência:
```
Etapa 1: Research (cod_m_etapa_anterior = 0)
Etapa 2: Development (cod_m_etapa_anterior = cod_modelo_etapa da Research)
Etapa 3: Engineering (cod_m_etapa_anterior = cod_modelo_etapa da Development)
Etapa 4: Construction (cod_m_etapa_anterior = cod_modelo_etapa da Engineering)
Etapa 5: Assembly (cod_m_etapa_anterior = cod_modelo_etapa da Construction)
```

### Campos Utilizados:
- `cod_modelo_etapa`: ID único da etapa
- `cod_modelo_ridec`: ID do modelo
- `cod_m_etapa_anterior`: ID da etapa anterior (0 = primeira etapa)
- `cod_tipo_etapa`: Tipo da etapa (referência à tabela tipo_etapa)

## Arquivos Modificados

1. **`ridec-occurrences.js`** (MODIFICADO)
   - Função `getEtapasByModelo`: Implementada lógica sequencial
   - Função `getModelStageInfo`: Atualizada para usar nova lógica
   - Logs detalhados para debug

2. **`test-sequencia-etapas.html`** (NOVO)
   - Script de teste para verificar a implementação
   - Testes de conexão, estrutura, sequência e renderização
   - Verificação da ordem das etapas

## Como Executar

### 1. Testar a Implementação
```bash
# Abra o arquivo de teste no navegador
open test-sequencia-etapas.html
```

### 2. Verificar na Tela de Ocorrências
- Acesse `ridec-occurrences.html`
- As etapas do modelo devem ser exibidas na ordem sequencial correta
- O cabeçalho mostra o número de etapas encontradas

### 3. Verificar Logs do Console
- Abra o DevTools (F12)
- Verifique os logs detalhados da sequência
- Confirme que a ordem está correta

## Benefícios

1. **Ordem Correta**: Etapas são exibidas na sequência definida pelo banco
2. **Flexibilidade**: Suporta qualquer sequência de etapas
3. **Manutenibilidade**: Fácil modificação da ordem das etapas
4. **Debugging**: Logs detalhados para verificação
5. **Compatibilidade**: Funciona com dados existentes

## Estrutura da Tabela `modelo_etapa_ridec`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cod_modelo_etapa` | SERIAL | ID único da etapa |
| `cod_modelo_ridec` | INTEGER | ID do modelo |
| `cod_m_etapa_anterior` | INTEGER | ID da etapa anterior (0 = primeira) |
| `cod_tipo_etapa` | INTEGER | Tipo da etapa |
| `desc_etapa_modelo` | TEXT | Descrição da etapa |
| `cod_uom` | INTEGER | Unidade de medida |
| `valor_uom` | DECIMAL | Valor da unidade |

## Relacionamentos

- `modelo_etapa_ridec.cod_modelo_ridec` → `modelo_ridec.cod_modelo_ridec`
- `modelo_etapa_ridec.cod_tipo_etapa` → `tipo_etapa.cod_tipo_etapa`
- `modelo_etapa_ridec.cod_m_etapa_anterior` → `modelo_etapa_ridec.cod_modelo_etapa`

## Status da Implementação

✅ **Concluído:**
- Implementação da lógica sequencial
- Atualização das funções de busca
- Renderização em ordem correta
- Script de teste completo
- Logs detalhados para debug

🔄 **Próximos Passos:**
- Executar testes para verificar funcionamento
- Verificar na tela de ocorrências
- Ajustar se necessário baseado nos resultados

## Exemplo de Uso

```javascript
// Buscar etapas de um modelo
const etapas = await ridecOccurrences.getEtapasByModelo(codModelo);

// Etapas retornadas em ordem sequencial:
// [
//   { fase: 'Research', cod_etapa: 1, cod_m_etapa_anterior: 0 },
//   { fase: 'Development', cod_etapa: 2, cod_m_etapa_anterior: 1 },
//   { fase: 'Engineering', cod_etapa: 3, cod_m_etapa_anterior: 2 },
//   // ...
// ]
```

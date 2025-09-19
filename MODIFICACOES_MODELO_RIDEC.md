# Modificações no Sistema de Criação de Modelo RIDEC

## Resumo das Alterações

Este documento descreve as modificações implementadas no sistema de criação de modelo RIDEC conforme solicitado.

## Estrutura Anterior vs Nova

### Estrutura Anterior
- O sistema criava etapas em tabelas separadas (`m_etapa_ri`, `m_etapa_d`, `m_etapa_e`, `m_etapa_c`)
- A tabela `modelo_ridec` continha colunas `cod_m_etapa_ri`, `cod_m_etapa_d`, `cod_m_etapa_e`, `cod_m_etapa_c` para referenciar essas etapas

### Nova Estrutura
- A tabela `modelo_ridec` não usa mais as colunas `cod_m_etapa_*`
- Foi criada a tabela `modelo_etapa_ridec` para armazenar as etapas do modelo
- Foi criada a tabela `tipo_modelo` para classificar modelos como "Detalhado" ou "Simples"

## Arquivos Modificados

### 1. `create-modelo-etapa-ridec-tables.sql` (NOVO)
Script SQL para criar as novas tabelas:
- `tipo_modelo`: Armazena tipos de modelo (Detalhado/Simples)
- `modelo_etapa_ridec`: Armazena as etapas de cada modelo RIDEC
- Adiciona campo `cod_tipo_modelo` à tabela `modelo_ridec`

### 2. `supabase-database.js` (MODIFICADO)
- **Função `createModeloRidecCompleto`**: Reescrita para seguir o novo fluxo
- **Nova função `getTipoModeloByNome`**: Busca tipo de modelo por nome
- **Nova função `criarEtapasModeloRidec`**: Cria todas as etapas do modelo
- **Nova função `criarEtapaModeloRidec`**: Cria uma etapa individual

## Novo Fluxo de Criação

### Passo 1: Criar Modelo RIDEC
```sql
INSERT INTO modelo_ridec (
    nome_modelo,
    descricao_modelo,
    cod_area,
    cod_empresa,
    valor_nc,
    cod_uom,
    valor_uom,
    cod_tipo_modelo
) VALUES (...)
```

### Passo 2: Criar Etapas do Modelo
Para cada etapa (RI, D, E, C), inserir na tabela `modelo_etapa_ridec`:

```sql
-- Etapa RI
INSERT INTO modelo_etapa_ridec (
    cod_modelo_ridec,
    cod_tipo_etapa,
    cod_uom,
    valor_uom,
    path_arquivo,
    cod_m_etapa_anterior
) VALUES (cod_modelo_ridec, 'RI', cod_uom, valor_uom, path_arquivo, 0)

-- Etapa D
INSERT INTO modelo_etapa_ridec (
    cod_modelo_ridec,
    cod_tipo_etapa,
    cod_uom,
    valor_uom,
    path_arquivo,
    cod_m_etapa_anterior
) VALUES (cod_modelo_ridec, 'D', cod_uom, valor_uom, path_arquivo, cod_etapa_ri)

-- Etapa E
INSERT INTO modelo_etapa_ridec (
    cod_modelo_ridec,
    cod_tipo_etapa,
    cod_uom,
    valor_uom,
    path_arquivo,
    cod_m_etapa_anterior
) VALUES (cod_modelo_ridec, 'E', cod_uom, valor_uom, path_arquivo, cod_etapa_d)

-- Etapa C
INSERT INTO modelo_etapa_ridec (
    cod_modelo_ridec,
    cod_tipo_etapa,
    cod_uom,
    valor_uom,
    path_arquivo,
    cod_m_etapa_anterior
) VALUES (cod_modelo_ridec, 'C', cod_uom, valor_uom, path_arquivo, cod_etapa_e)
```

## Estrutura das Novas Tabelas

### Tabela `tipo_modelo`
```sql
CREATE TABLE tipo_modelo (
    cod_tipo_modelo SERIAL PRIMARY KEY,
    nome_tipo_modelo VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `modelo_etapa_ridec`
```sql
CREATE TABLE modelo_etapa_ridec (
    cod_modelo_etapa_ridec SERIAL PRIMARY KEY,
    cod_modelo_ridec INTEGER NOT NULL,
    cod_tipo_etapa INTEGER NOT NULL, -- 1=RI, 2=D, 3=E, 4=C
    desc_etapa_modelo TEXT,
    cod_uom INTEGER NOT NULL,
    valor_uom DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    path_arquivo TEXT,
    cod_m_etapa_anterior INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cod_modelo_ridec) REFERENCES modelo_ridec(cod_modelo_ridec) ON DELETE CASCADE,
    FOREIGN KEY (cod_uom) REFERENCES uom(cod_uom)
);
```

## Campos da Tabela `modelo_ridec` Atualizada

A tabela `modelo_ridec` agora inclui:
- `cod_tipo_modelo`: Referência ao tipo de modelo (Detalhado/Simples)
- **Removidos**: `cod_m_etapa_ri`, `cod_m_etapa_d`, `cod_m_etapa_e`, `cod_m_etapa_c`

## Como Executar as Modificações

1. **Execute o script SQL**:
   ```bash
   # No Supabase Dashboard, execute o arquivo:
   create-modelo-etapa-ridec-tables.sql
   ```

2. **As modificações no JavaScript já estão implementadas** e funcionarão automaticamente após a execução do script SQL.

## Benefícios da Nova Estrutura

1. **Flexibilidade**: Permite adicionar mais etapas facilmente
2. **Relacionamentos**: Mantém a sequência das etapas através de `cod_m_etapa_anterior`
3. **Classificação**: Diferencia modelos "Detalhado" vs "Simples"
4. **Normalização**: Evita redundância de dados
5. **Escalabilidade**: Facilita futuras expansões do sistema

## Compatibilidade

- O sistema mantém compatibilidade com a interface existente
- As modificações são transparentes para o usuário final
- O fluxo de criação permanece o mesmo na interface

## Correções Implementadas

### 1. Adicionado campo `desc_etapa_modelo`
- Incluído na tabela `modelo_etapa_ridec`
- Preenchido com as descrições das etapas do formulário
- Campo obrigatório para todas as etapas

### 2. Corrigida lógica de `cod_m_etapa_anterior`
- **Etapa RI**: `cod_m_etapa_anterior = 0` (primeira etapa)
- **Etapa D**: `cod_m_etapa_anterior = cod_modelo_etapa` da etapa RI
- **Etapa E**: `cod_m_etapa_anterior = cod_modelo_etapa` da etapa D
- **Etapa C**: `cod_m_etapa_anterior = cod_modelo_etapa` da etapa E

### 3. Corrigido método `criarEtapaModeloRidec`
- Adicionado array `[etapaData]` no método `insert()`
- Melhorados logs de debug para identificar problemas
- Validação de dados antes da inserção

### 4. Corrigido processo de criação de etapas
- Implementado processo sequencial correto:
  1. Grava a etapa RI
  2. Obtém o valor de x = cod_modelo_etapa da linha gravada
  3. Para as etapas seguintes:
     - Utiliza x para o valor de cod_m_etapa_anterior
     - Grava os dados da etapa
     - Obtém o valor de x = cod_modelo_etapa da linha gravada
- Logs detalhados para cada etapa do processo
- Verificação da sequência correta de relacionamentos

## Arquivos de Teste Criados

### 1. `test-etapas-modelo.html`
- Interface para testar a criação de etapas
- Verifica se `cod_m_etapa_anterior` está sendo gravado corretamente
- Lista todas as etapas criadas com seus relacionamentos

### 2. `debug-etapas-modelo.html`
- Debug detalhado com logs específicos para `cod_m_etapa_anterior`
- Verifica sequência de etapas por modelo
- Identifica problemas na gravação e relacionamentos

### 3. `test-simple-etapas.html`
- Teste simples para verificar inserção individual de etapas
- Testa especificamente o campo `cod_m_etapa_anterior`
- Valida se a referência entre etapas está funcionando

### 4. `verificar-etapas-modelo.sql`
- Script SQL para verificar a estrutura e dados da tabela
- Valida se a sequência de etapas está correta
- Identifica problemas na gravação de `cod_m_etapa_anterior`

### 5. `debug-cod-etapa-anterior.sql`
- Script SQL específico para debug de `cod_m_etapa_anterior`
- Verifica problemas na sequência de etapas
- Valida relacionamentos entre etapas

### 6. `test-processo-correto.html`
- Teste específico para verificar o processo sequencial correto
- Valida se cada etapa está referenciando a anterior corretamente
- Verifica se o fluxo está sendo seguido exatamente como especificado

## Testes Recomendados

1. **Execute o script SQL** `setup-complete-database.sql` no Supabase Dashboard
2. **Abra o arquivo** `test-etapas-modelo.html` no navegador
3. **Teste a criação** de um modelo RIDEC completo
4. **Verifique no log** se as etapas estão sendo criadas com `cod_m_etapa_anterior` correto
5. **Execute o script** `verificar-etapas-modelo.sql` para validar os dados
6. **Crie um modelo RIDEC "Detalhado"** e outro "Simples"
7. **Teste a criação de ocorrências** baseadas nos novos modelos

# Executar Alteração - Coluna tempo_diferenca

## Instruções para Adicionar Coluna tempo_diferenca

### 1. Executar Script SQL
Execute o arquivo `add-tempo-diferenca-column.sql` no SQL Editor do Supabase Dashboard:

```sql
-- Adicionar coluna tempo_diferenca à tabela etapa_ridec
-- ==============================================

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'etapa_ridec' 
        AND column_name = 'tempo_diferenca'
    ) THEN
        -- Adicionar coluna tempo_diferenca
        ALTER TABLE etapa_ridec 
        ADD COLUMN tempo_diferenca DECIMAL(10,2) DEFAULT 0.0;
        
        -- Adicionar comentário
        COMMENT ON COLUMN etapa_ridec.tempo_diferenca IS 'Diferença de tempo entre início e fim da etapa na unidade de medida (UOM) do modelo';
        
        RAISE NOTICE 'Coluna tempo_diferenca adicionada à tabela etapa_ridec';
    ELSE
        RAISE NOTICE 'Coluna tempo_diferenca já existe na tabela etapa_ridec';
    END IF;
END $$;
```

### 2. Verificar Alteração
Após executar o script, verifique se a coluna foi adicionada:

```sql
-- Verificar estrutura da tabela após alteração
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'etapa_ridec'
ORDER BY ordinal_position;
```

### 3. Funcionalidades Implementadas

#### Cálculo Automático de Tempo
- Quando uma etapa for concluída (botão `btn-complete`), o sistema agora:
  1. Busca a UOM (Unidade de Medida) do modelo_etapa_ridec correspondente
  2. Calcula a diferença entre data_inicio/hora_inicio e data_fim/hora_fim
  3. Converte o tempo para a unidade correta (segundos, minutos, horas, dias)
  4. Aplica o fator de conversão se configurado
  5. Salva o resultado na coluna `tempo_diferenca`

#### Unidades Suportadas
- **Segundos** (s, segundos)
- **Minutos** (min, m, minutos)
- **Horas** (h, hr, horas) - padrão
- **Dias** (d, dias)

#### Fator de Conversão
- Se a UOM tiver um `fator_conversao` configurado, ele será aplicado ao cálculo final

### 4. Exemplo de Uso
```javascript
// O cálculo é feito automaticamente quando uma etapa é concluída
// Exemplo: Se uma etapa durou 2 horas e 30 minutos
// e a UOM for "horas", o tempo_diferenca será 2.5
```

### 5. Logs de Debug
O sistema gera logs detalhados para acompanhar o cálculo:
- `⏱️ Calculando tempo diferenca para card X, tipo Y`
- `📊 UOM encontrada: {desc_uom: "horas", fator_conversao: 1}`
- `✅ Tempo calculado: 2.50 horas`

### 6. Tratamento de Erros
- Se a UOM não for encontrada, retorna 0
- Se a data de fim for anterior à data de início, retorna 0
- Se a UOM não for reconhecida, usa "horas" como padrão
- Todos os erros são logados no console para debug


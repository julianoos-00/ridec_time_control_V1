# Página de Ocorrências RIDEC

## Visão Geral

A página de Ocorrências RIDEC é uma interface moderna e interativa para gerenciar e acompanhar todas as ocorrências dos modelos de RIDEC. Esta página foi desenvolvida com foco em usabilidade, design intuitivo e funcionalidades avançadas de filtragem e visualização.

## Características Principais

### 🎨 Design Moderno e Intuitivo
- Interface limpa e moderna com gradientes e efeitos visuais
- Cards interativos com animações suaves
- Design responsivo para diferentes tamanhos de tela
- Ícones intuitivos e cores semânticas para status

### 📊 Dashboard Completo
- **Estatísticas em Tempo Real**: Total, ativas, concluídas e atrasadas
- **Resumo Visual**: Cards com métricas importantes
- **Progresso Detalhado**: Barras de progresso com cores semânticas
- **Timeline de Etapas**: Visualização cronológica do processo

### 🔍 Sistema de Filtros Avançado
- **Busca por Título**: Filtro em tempo real
- **Filtro por Modelo**: Modelo A, B, C, D
- **Filtro por Status**: Ativa, Concluída, Atrasada, Pendente
- **Filtro por Área**: TI, RH, Financeiro, Operacional
- **Filtro por Data**: Data de criação específica

### 📱 Funcionalidades Interativas
- **Visualização de Detalhes**: Modal com informações completas
- **Ações Rápidas**: Visualizar, Editar, Excluir
- **Notificações**: Sistema de feedback visual
- **Navegação Intuitiva**: Botão de retorno ao sistema principal

## Estrutura dos Arquivos

```
ridec-occurrences.html    # Página principal de ocorrências
ridec-occurrences.js      # Lógica JavaScript e funcionalidades
styles.css               # Estilos compartilhados (já existente)
```

## Funcionalidades Detalhadas

### 1. Header com Estatísticas
- **Contador Total**: Número total de ocorrências
- **Ocorrências Ativas**: Em andamento
- **Ocorrências Concluídas**: Finalizadas com sucesso
- **Ocorrências Atrasadas**: Fora do prazo

### 2. Sistema de Filtros
- **Aplicar Filtros**: Combina múltiplos critérios
- **Limpar Filtros**: Reset para visualização completa
- **Busca Instantânea**: Resultados em tempo real

### 3. Cards de Ocorrências
Cada card contém:
- **Título e Status**: Com badge colorido
- **Informações Básicas**: Modelo, área, responsável, prioridade
- **Datas**: Criação e prazo
- **Progresso**: Barra visual com porcentagem
- **Timeline**: Etapas do processo com status
- **Ações**: Botões para visualizar, editar, excluir

### 4. Modal de Detalhes
- **Informações Completas**: Todos os dados da ocorrência
- **Progresso Detalhado**: Visualização avançada
- **Etapas do Processo**: Status e tempo de cada etapa
- **Layout Responsivo**: Adaptável a diferentes telas

## Dados de Exemplo

A página inclui dados simulados para demonstração:

### Ocorrências Incluídas:
1. **Implementação de Sistema de Backup** (Modelo A - TI)
2. **Atualização de Políticas de RH** (Modelo B - RH)
3. **Auditoria Financeira Trimestral** (Modelo C - Financeiro)
4. **Otimização de Processos Operacionais** (Modelo D - Operacional)
5. **Migração de Dados para Cloud** (Modelo A - TI)

### Estrutura de Dados:
```javascript
{
    id: 1,
    title: "Título da Ocorrência",
    model: "modelo-a",
    modelName: "Modelo A",
    status: "active", // active, completed, overdue, pending
    area: "ti",
    areaName: "TI",
    createdAt: "2024-01-15",
    deadline: "2024-02-15",
    progress: 65,
    description: "Descrição detalhada",
    priority: "alta",
    responsible: "Nome do Responsável",
    stages: [
        {
            name: "Nome da Etapa",
            status: "completed",
            time: "2h 30m"
        }
    ]
}
```

## Status e Cores

### Status das Ocorrências:
- **🟡 Ativa**: Em andamento (amarelo)
- **🟢 Concluída**: Finalizada (verde)
- **🔴 Atrasada**: Fora do prazo (vermelho)
- **⚪ Pendente**: Aguardando início (cinza)

### Status das Etapas:
- **✅ Concluída**: Etapa finalizada
- **▶️ Ativa**: Etapa em andamento
- **⏰ Pendente**: Etapa aguardando
- **⚠️ Atrasada**: Etapa fora do prazo

## Navegação

### Acesso à Página:
1. Na página principal do sistema RIDEC
2. Clicar no botão "Ocorrências" no header
3. Ou acessar diretamente: `ridec-occurrences.html`

### Retorno ao Sistema:
- Botão "Voltar ao Sistema" no canto superior direito
- Ou usar o navegador para voltar

## Responsividade

A página é totalmente responsiva e se adapta a:
- **Desktop**: Layout completo com grid de cards
- **Tablet**: Cards em coluna única
- **Mobile**: Interface otimizada para toque

## Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com flexbox e grid
- **JavaScript ES6+**: Funcionalidades interativas
- **Font Awesome**: Ícones modernos
- **Gradientes CSS**: Efeitos visuais avançados

## Próximas Funcionalidades

### Planejadas para Implementação:
- **Criação de Ocorrências**: Modal para adicionar novas ocorrências
- **Edição Avançada**: Interface para modificar ocorrências existentes
- **Exportação de Dados**: PDF, Excel, CSV
- **Notificações Push**: Alertas em tempo real
- **Integração com API**: Conectividade com backend
- **Filtros Avançados**: Mais opções de busca
- **Gráficos Interativos**: Visualizações estatísticas

## Personalização

### Cores e Temas:
As cores podem ser facilmente personalizadas editando as variáveis CSS no arquivo `styles.css`:

```css
/* Cores principais */
--primary-color: #667eea;
--secondary-color: #764ba2;
--success-color: #10b981;
--warning-color: #f59e0b;
--error-color: #ef4444;
```

### Adicionar Novos Modelos:
Para adicionar novos modelos de RIDEC, edite o array de opções no HTML:

```html
<option value="novo-modelo">Novo Modelo</option>
```

## Suporte e Manutenção

### Estrutura Modular:
- Código organizado em classes JavaScript
- Estilos modulares e reutilizáveis
- Fácil manutenção e extensão

### Compatibilidade:
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Suporte a dispositivos móveis
- Acessibilidade básica implementada

---

**Desenvolvido com foco em usabilidade e experiência do usuário** 
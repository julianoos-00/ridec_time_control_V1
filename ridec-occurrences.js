// Sistema de Ocorrências RIDEC
class RIDECOccurrences {
    constructor() {
        this.occurrences = [];
        this.filteredOccurrences = [];
        this.filters = {
            title: '',
            model: '',
            status: '',
            area: '',
            date: ''
        };
        
        // Sistema de timer para etapas
        this.activeTimers = new Map(); // Map para armazenar timers ativos
        this.stageTimers = new Map(); // Map para armazenar tempo acumulado das etapas
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadOccurrences();
        
        // Só inicializar timers se houver ocorrências carregadas
        if (this.occurrences && this.occurrences.length > 0) {
            this.initializeStageTimers();
        }
        
        await this.renderOccurrences();
        this.updateStats();
    }

    // Carregar dados de ocorrências do banco de dados
    async loadOccurrences() {
        try {
            console.log('🔄 Carregando ocorrências do banco de dados...');
            
            // Obter usuário atual
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                console.error('❌ Usuário não encontrado');
                this.showNotification('Usuário não autenticado', 'error');
                return;
            }

            console.log('👤 Usuário atual:', currentUser);
            console.log('🏢 Empresa do usuário:', currentUser.cod_empresa);

            // Aguardar Supabase estar pronto
            if (!window.supabaseDB || !window.supabaseDB.isConnected()) {
                console.log('⏳ Aguardando Supabase estar pronto...');
                await this.waitForSupabase();
            }

            // Inicializar SupabaseDatabase se necessário
            if (!window.supabaseDB) {
                console.log('🔧 Inicializando SupabaseDatabase...');
                window.supabaseDB = SupabaseDatabase.getInstance();
                await window.supabaseDB.init();
            }

            // Verificar se a tabela card_ridec existe
            const tableExists = await this.checkTableExists('card_ridec');
            if (!tableExists) {
                console.log('⚠️ Tabela card_ridec não existe, carregando modelos RIDEC...');
                await this.loadModelosInstead();
                return;
            }

            // Carregar cards RIDEC da empresa do usuário
            const cards = await this.getCardsByEmpresa(currentUser.cod_empresa);
            console.log('📋 Cards RIDEC encontrados:', cards.length);

            if (!cards || cards.length === 0) {
                console.log('⚠️ Nenhum card RIDEC encontrado para a empresa');
                this.occurrences = [];
                this.filteredOccurrences = [];
                this.areasData = [];
                return;
            }

            // Converter cards em ocorrências
            this.occurrences = [];
            this.areasData = [];

            for (const card of cards) {
                const ocorrencia = await this.convertCardToOccurrence(card);
                this.occurrences.push(ocorrencia);
                
                // Adicionar área única se não existir (usando área do modelo)
                if (card.modelo?.area && !this.areasData.find(a => a.cod_area === card.modelo.area.cod_area)) {
                    this.areasData.push(card.modelo.area);
                }
            }

            console.log('✅ Cards RIDEC carregados:', this.occurrences.length);
            this.filteredOccurrences = [...this.occurrences];
            
            // Atualizar filtro de área com dados reais
            this.updateAreaFilter();
            
        } catch (error) {
            console.error('❌ Erro ao carregar ocorrências:', error);
            this.showNotification('Erro ao carregar ocorrências', 'error');
            
            // Em caso de erro, manter array vazio
            this.occurrences = [];
            this.filteredOccurrences = [];
        }
    }

    // Aguardar Supabase estar pronto
    async waitForSupabase() {
        return new Promise(async (resolve) => {
            // Tentar inicializar SupabaseDatabase
            try {
                if (!window.supabaseDB) {
                    console.log('🔧 Inicializando SupabaseDatabase...');
                    window.supabaseDB = SupabaseDatabase.getInstance();
                    const initialized = await window.supabaseDB.init();
                    if (initialized) {
                        resolve(true);
                        return;
                    }
                } else if (window.supabaseDB.isConnected()) {
                    resolve(true);
                    return;
                }
            } catch (error) {
                console.error('❌ Erro ao inicializar Supabase:', error);
            }

            // Se não conseguiu inicializar, aguardar evento
            const checkSupabase = () => {
                if (window.supabaseDB && window.supabaseDB.isConnected()) {
                    resolve(true);
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    }

    // Verificar se uma tabela existe
    async checkTableExists(tableName) {
        try {
            console.log(`🔍 Verificando se a tabela ${tableName} existe...`);
            const { data, error } = await window.supabaseDB.getClient()
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ Tabela ${tableName} não existe ou não é acessível:`, error.message);
                return false;
            }
            
            console.log(`✅ Tabela ${tableName} existe e é acessível`);
            return true;
        } catch (error) {
            console.log(`❌ Erro ao verificar tabela ${tableName}:`, error.message);
            return false;
        }
    }

    // Carregar modelos RIDEC como fallback
    async loadModelosInstead() {
        try {
            console.log('🔄 Carregando modelos RIDEC como fallback...');
            
            // Carregar áreas da empresa do usuário
            const areas = await window.supabaseDB.getAreasByEmpresa(this.getCurrentUser().cod_empresa);
            console.log('🏢 Áreas encontradas:', areas);

            if (!areas || areas.length === 0) {
                console.log('⚠️ Nenhuma área encontrada para a empresa');
                this.occurrences = [];
                this.filteredOccurrences = [];
                this.areasData = [];
                return;
            }

            // Carregar modelos RIDEC por área
            this.occurrences = [];
            this.areasData = areas;

            for (const area of areas) {
                console.log(`🔍 Carregando modelos para área: ${area.nome_area} (${area.cod_area})`);
                
                // Buscar modelos RIDEC desta área
                const modelos = await this.getModelosByArea(area.cod_area);
                console.log(`📋 Modelos encontrados para ${area.nome_area}:`, modelos);

                // Converter modelos em ocorrências
                for (const modelo of modelos) {
                    const ocorrencia = await this.convertModeloToOccurrence(modelo, area);
                    this.occurrences.push(ocorrencia);
                }
            }

            console.log('✅ Modelos RIDEC carregados como fallback:', this.occurrences.length);
            this.filteredOccurrences = [...this.occurrences];
            
            // Atualizar filtro de área com dados reais
            this.updateAreaFilter();
            
        } catch (error) {
            console.error('❌ Erro ao carregar modelos como fallback:', error);
            this.occurrences = [];
            this.filteredOccurrences = [];
            this.areasData = [];
        }
    }

    // Buscar cards RIDEC por empresa
    async getCardsByEmpresa(codEmpresa) {
        try {
            console.log(`🔍 Buscando cards RIDEC para empresa: ${codEmpresa}`);
            
            // Primeiro, tentar uma consulta simples para verificar se a tabela existe
            console.log('🔍 Testando consulta simples...');
            const { data: simpleData, error: simpleError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('*')
                .eq('cod_empresa', codEmpresa)
                .eq('ies_concluiu', 'N')
                .limit(5);

            if (simpleError) {
                console.error('❌ Erro na consulta simples:', simpleError);
                console.error('❌ Detalhes do erro simples:', {
                    message: simpleError.message,
                    details: simpleError.details,
                    hint: simpleError.hint,
                    code: simpleError.code
                });
                return [];
            }

            console.log(`✅ Consulta simples funcionou. Encontrados: ${simpleData ? simpleData.length : 0} cards`);

            // Se a consulta simples funcionou, tentar com relacionamentos
            console.log('🔍 Testando consulta com relacionamentos...');
            const { data, error } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select(`
                    *,
                    modelo:cod_modelo_ridec(
                        nome_modelo,
                        descricao_modelo,
                        cod_area,
                        area:cod_area(nome_area)
                    )
                `)
                .eq('cod_empresa', codEmpresa)
                .eq('ies_concluiu', 'N')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Erro ao buscar cards RIDEC por empresa:', error);
                console.error('❌ Detalhes do erro:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                return [];
            }

            console.log(`✅ Cards RIDEC encontrados: ${data ? data.length : 0}`);
            return data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar cards RIDEC por empresa:', error);
            return [];
        }
    }

    // Buscar modelos RIDEC por área (mantido para compatibilidade)
    async getModelosByArea(codArea) {
        try {
            const { data, error } = await window.supabaseDB.getClient()
                .from('modelo_ridec')
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa)
                `)
                .eq('cod_area', codArea)
                .order('nome_modelo');

            if (error) {
                console.error('❌ Erro ao buscar modelos por área:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar modelos por área:', error);
            return [];
        }
    }

    // Converter card RIDEC em ocorrência
    async convertCardToOccurrence(card) {
        console.log(`🔄 Convertendo card para ocorrência:`, card);
        
        // Buscar etapas do card usando nova estrutura
        const etapas = await this.getEtapasCard(card.cod_card_ridec);
        console.log(`📋 Etapas do card encontradas:`, etapas.length);
        
        // Determinar status baseado no progresso do card
        const status = this.determineCardStatusNew(card, etapas);
        
        // Calcular progresso baseado nas etapas executadas
        const progress = this.calculateCardProgressNew(etapas);
        
        const ocorrencia = {
            id: card.cod_card_ridec,
            title: card.titulo_card || card.modelo?.nome_modelo || 'Card sem título',
            model: card.cod_modelo_ridec,
            modelName: card.modelo?.nome_modelo || 'Modelo não encontrado',
            status: status,
            area: card.modelo?.cod_area || card.cod_area,
            areaName: card.modelo?.area?.nome_area || 'Área não definida',
            createdAt: card.created_at ? card.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            deadline: card.prazo_final || card.prazo_estimado || null,
            progress: progress,
            description: card.descricao_card || card.modelo?.descricao_modelo || 'Card sem descrição',
            priority: card.prioridade || 'média',
            responsible: card.responsavel || 'Não definido',
            company: card.empresa?.nome_empresa || 'Empresa não definida',
            externalId: card.id_externo || null,
            isModel: false, // Indica que é um card real
            cardData: card, // Dados completos do card
            etapas: etapas // Etapas usando nova estrutura
        };

        console.log('✅ Card convertido para ocorrência:', ocorrencia);
        return ocorrencia;
    }

    // Converter modelo RIDEC em ocorrência (mantido para compatibilidade)
    async convertModeloToOccurrence(modelo, area) {
        console.log(`🔄 Convertendo modelo para ocorrência:`, modelo);
        console.log(`🏢 Área associada:`, area);
        
        // Buscar etapas do modelo
        const etapas = await this.getEtapasByModelo(modelo.cod_modelo_ridec);
        console.log(`📋 Etapas encontradas:`, etapas.length);
        
        const ocorrencia = {
            id: modelo.cod_modelo_ridec,
            title: modelo.nome_modelo,
            model: modelo.cod_modelo_ridec,
            modelName: modelo.nome_modelo,
            status: this.determineModeloStatus(etapas),
            area: area.cod_area,
            areaName: area.nome_area,
            createdAt: modelo.created_at || new Date().toISOString().split('T')[0],
            deadline: modelo.prazo_estimado || this.calculateDeadline(etapas),
            progress: this.calculateProgress(etapas),
            description: modelo.descricao_modelo || 'Modelo RIDEC sem descrição',
            priority: modelo.prioridade || 'média',
            responsible: modelo.responsavel || 'Não definido',
            stages: etapas
        };
        
        console.log(`✅ Ocorrência criada:`, ocorrencia);
        return ocorrencia;
    }

    // Buscar etapas de um modelo seguindo sequência cod_m_etapa_anterior
    async getEtapasByModelo(codModelo) {
        try {
            console.log(`🔍 getEtapasByModelo: Buscando etapas para modelo ${codModelo} com sequência cod_m_etapa_anterior`);
            console.log(`🔍 getEtapasByModelo: codModelo type:`, typeof codModelo, 'value:', codModelo);
            
            // Buscar todas as etapas do modelo
            const { data: todasEtapas, error } = await window.supabaseDB.getClient()
                .from('modelo_etapa_ridec')
                .select(`
                    *,
                    uom:cod_uom (
                        desc_uom
                    ),
                    tipo_etapa:tipo_etapa (
                        cod_tipo_etapa,
                        nome_tipo_etapa
                    )
                `)
                .eq('cod_modelo_ridec', codModelo)
                .order('cod_modelo_etapa');

            if (error) {
                console.error('❌ Erro ao buscar etapas do modelo:', error);
                return [];
            }

            console.log('🔍 Todas as etapas encontradas:', todasEtapas);

            if (!todasEtapas || todasEtapas.length === 0) {
                console.log('⚠️ Nenhuma etapa encontrada para o modelo:', codModelo);
                return [];
            }

            console.log('📋 Todas as etapas encontradas:', todasEtapas.map(e => ({
                cod_modelo_etapa: e.cod_modelo_etapa,
                cod_tipo_etapa: e.cod_tipo_etapa,
                cod_m_etapa_anterior: e.cod_m_etapa_anterior,
                nome_tipo_etapa: e.tipo_etapa?.nome_tipo_etapa
            })));

            // Encontrar a primeira etapa (cod_m_etapa_anterior = 0)
            const primeiraEtapa = todasEtapas.find(etapa => etapa.cod_m_etapa_anterior === 0);
            if (!primeiraEtapa) {
                console.log('⚠️ Nenhuma etapa inicial encontrada (cod_m_etapa_anterior = 0)');
                console.log('📋 Etapas disponíveis com cod_m_etapa_anterior:', todasEtapas.map(e => e.cod_m_etapa_anterior));
                return [];
            }

            console.log('✅ Primeira etapa encontrada:', {
                cod_modelo_etapa: primeiraEtapa.cod_modelo_etapa,
                cod_tipo_etapa: primeiraEtapa.cod_tipo_etapa,
                cod_m_etapa_anterior: primeiraEtapa.cod_m_etapa_anterior,
                nome_tipo_etapa: primeiraEtapa.tipo_etapa?.nome_tipo_etapa
            });

            // Construir sequência das etapas
            const etapasSequenciais = [];
            let etapaAtual = primeiraEtapa;
            let x = etapaAtual.cod_modelo_etapa;

            etapasSequenciais.push(etapaAtual);

            // Buscar próximas etapas seguindo a sequência
            let iteracao = 1;
            while (true) {
                console.log(`🔍 Iteração ${iteracao}: Buscando etapa onde cod_m_etapa_anterior = ${x}`);
                
                const proximaEtapa = todasEtapas.find(etapa => etapa.cod_m_etapa_anterior === x);
                if (!proximaEtapa) {
                    console.log(`✅ Fim da sequência alcançado (não encontrou etapa com cod_m_etapa_anterior = ${x})`);
                    break;
                }

                console.log(`🔗 Próxima etapa encontrada:`, {
                    cod_modelo_etapa: proximaEtapa.cod_modelo_etapa,
                    cod_tipo_etapa: proximaEtapa.cod_tipo_etapa,
                    cod_m_etapa_anterior: proximaEtapa.cod_m_etapa_anterior,
                    nome_tipo_etapa: proximaEtapa.tipo_etapa?.nome_tipo_etapa
                });
                
                etapasSequenciais.push(proximaEtapa);
                x = proximaEtapa.cod_modelo_etapa;
                iteracao++;

                // Proteção contra loop infinito
                if (iteracao > 20) {
                    console.log('⚠️ Limite de iterações atingido (possível loop infinito)');
                    break;
                }
            }

            console.log('📊 Sequência final das etapas:', etapasSequenciais.map((e, index) => ({
                ordem: index + 1,
                cod_modelo_etapa: e.cod_modelo_etapa,
                cod_tipo_etapa: e.cod_tipo_etapa,
                nome_tipo_etapa: e.tipo_etapa?.nome_tipo_etapa,
                cod_m_etapa_anterior: e.cod_m_etapa_anterior,
                sigla: this.getSiglaFromCodTipoEtapa(e.cod_tipo_etapa)
            })));

            // Mapear etapas para o formato esperado
            const etapasMapeadas = etapasSequenciais.map(etapa => {
                console.log('🔍 Processando etapa da sequência:', etapa);
                
                // Usar apenas nome_tipo_etapa da tabela tipo_etapa
                const nomeTipoEtapa = etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa';
                
                // Mapear campos da tabela modelo_etapa_ridec
                const etapaMapeada = {
                    name: `${nomeTipoEtapa}: ${etapa.desc_etapa_modelo || 'Etapa sem nome'}`,
                    nome_etapa: etapa.desc_etapa_modelo || 'Etapa sem nome',
                    valor_uom: etapa.valor_uom || '1.0',
                    unidade_uom: etapa.uom?.desc_uom || 'un',
                    status: 'pending',
                    time: '0h 0m',
                    timeMs: 0,
                    fase: nomeTipoEtapa,
                    cod_etapa: etapa.cod_modelo_etapa,
                    cod_tipo_etapa: etapa.cod_tipo_etapa,
                    cod_m_etapa_anterior: etapa.cod_m_etapa_anterior,
                    path_arquivo: etapa.path_arquivo, // Incluir path_arquivo
                    // Manter referência ao objeto UOM e tipo_etapa completo
                    uom: etapa.uom,
                    tipo_etapa: etapa.tipo_etapa
                };
                
                console.log('📊 Etapa mapeada:', etapaMapeada);
                return etapaMapeada;
            });
            
            console.log('✅ Todas as etapas mapeadas em sequência:', etapasMapeadas);
            return etapasMapeadas;
        } catch (error) {
            console.error('❌ Erro ao buscar etapas do modelo:', error);
            return [];
        }
    }


    // Buscar etapas de uma fase específica
    async getEtapasByFase(codModelo, tabelaFase) {
        try {
            console.log(`🔍 getEtapasByFase: Buscando modelo ${codModelo} para fase ${tabelaFase}`);
            
            // Mapear tabelaFase para cod_tipo_etapa
            let codTipoEtapa;
            switch (tabelaFase) {
                case 'm_etapa_ri':
                    codTipoEtapa = 1; // RI
                    break;
                case 'm_etapa_d':
                    codTipoEtapa = 2; // D
                    break;
                case 'm_etapa_e':
                    codTipoEtapa = 3; // E
                    break;
                case 'm_etapa_c':
                    codTipoEtapa = 4; // C
                    break;
                case 'm_etapa_a':
                    codTipoEtapa = 5; // A (Assembly)
                    break;
                default:
                    console.error(`❌ Tabela de fase não reconhecida: ${tabelaFase}`);
                    return [];
            }

            // Buscar etapa na tabela modelo_etapa_ridec usando cod_modelo_ridec e cod_tipo_etapa
            console.log(`🔍 Buscando na tabela modelo_etapa_ridec: cod_modelo_ridec=${codModelo}, cod_tipo_etapa=${codTipoEtapa}`);
            
            const { data, error } = await window.supabaseDB.getClient()
                .from('modelo_etapa_ridec')
                .select(`
                    *,
                    uom:cod_uom (
                        desc_uom
                    ),
                    tipo_etapa:tipo_etapa (
                        cod_tipo_etapa,
                        nome_tipo_etapa
                    )
                `)
                .eq('cod_modelo_ridec', codModelo)
                .eq('cod_tipo_etapa', codTipoEtapa);

            if (error) {
                console.error(`❌ Erro ao buscar etapa modelo_etapa_ridec:`, error);
                return [];
            }

            console.log(`📊 Etapa encontrada para ${tabelaFase}:`, data);
            console.log(`📊 Tipo de data:`, typeof data, 'Array?', Array.isArray(data));
            
            if (data && data.length > 0) {
                console.log(`📋 Campos disponíveis na etapa:`, Object.keys(data[0]));
                console.log(`📋 Etapa completa:`, data[0]);
                console.log(`📋 UOM data:`, data[0].uom);
                console.log(`📋 desc_uom:`, data[0].uom?.desc_uom);
            }

            // Retornar como array para manter compatibilidade
            if (data && data.length > 0) {
                console.log(`✅ Retornando ${data.length} etapa(s) para ${tabelaFase}`);
                return data;
            } else {
                console.log(`⚠️ Nenhuma etapa encontrada para ${tabelaFase} com cod_modelo_ridec=${codModelo} e cod_tipo_etapa=${codTipoEtapa}`);
                return [];
            }
        } catch (error) {
            console.error(`❌ Erro ao buscar etapas da fase ${tabelaFase}:`, error);
            return [];
        }
    }

    // Determinar status do card baseado no progresso
    determineCardStatus(card) {
        // Verificar se o card tem prazo e está atrasado
        if (card.prazo_final) {
            const prazo = new Date(card.prazo_final);
            const hoje = new Date();
            if (hoje > prazo && card.status !== 'completed') {
                return 'overdue';
            }
        }
        
        // Retornar status do card ou determinar baseado no progresso
        switch (card.status) {
            case 'completed':
            case 'concluido':
                return 'completed';
            case 'active':
            case 'ativo':
            case 'em_andamento':
                return 'active';
            case 'pending':
            case 'pendente':
                return 'pending';
            case 'cancelled':
            case 'cancelado':
                return 'cancelled';
            default:
                // Se não tem status definido, determinar baseado no progresso
                const progress = this.calculateCardProgress(card);
                if (progress === 0) return 'pending';
                if (progress === 100) return 'completed';
                return 'active';
        }
    }

    // Calcular progresso do card baseado nas etapas executadas
    calculateCardProgress(card) {
        // Se o card tem progresso definido, usar ele
        if (card.progresso !== undefined && card.progresso !== null) {
            return Math.min(100, Math.max(0, card.progresso));
        }
        
        // Se não tem progresso definido, calcular baseado no status
        switch (card.status) {
            case 'completed':
            case 'concluido':
                return 100;
            case 'active':
            case 'ativo':
            case 'em_andamento':
                return 50; // Progresso médio para cards ativos
            case 'pending':
            case 'pendente':
                return 0;
            default:
                return 0;
        }
    }

    // Determinar status do modelo baseado nas etapas (mantido para compatibilidade)
    determineModeloStatus(etapas) {
        if (etapas.length === 0) return 'pending';
        
        const completed = etapas.filter(e => e.status === 'completed').length;
        const active = etapas.filter(e => e.status === 'active').length;
        
        if (completed === etapas.length) return 'completed';
        if (active > 0) return 'active';
        return 'pending';
    }

    // Calcular progresso baseado nas etapas
    calculateProgress(etapas) {
        if (etapas.length === 0) return 0;
        const completed = etapas.filter(e => e.status === 'completed').length;
        return Math.round((completed / etapas.length) * 100);
    }

    // Calcular prazo estimado
    calculateDeadline(etapas) {
        const today = new Date();
        const daysToAdd = etapas.length * 7; // 7 dias por etapa
        today.setDate(today.getDate() + daysToAdd);
        return today.toISOString().split('T')[0];
    }

    // Obter usuário atual da sessão
    getCurrentUser() {
        try {
            let sessionData = localStorage.getItem('ridec_session');
            if (!sessionData) {
                sessionData = sessionStorage.getItem('ridec_session');
            }
            
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                return parsed.user;
            }
            
            // Usuário de teste para julianooschulz@gmail.com
            console.log('⚠️ Nenhuma sessão encontrada, usando usuário de teste');
            return {
                cod_usuario: 1,
                nome_usuario: 'Juliano Schulz',
                email_usuario: 'julianooschulz@gmail.com',
                cod_empresa: 1,
                cod_tipo_usuario: 1,
                ies_ativo: 'S'
            };
        } catch (error) {
            console.error('❌ Erro ao obter usuário da sessão:', error);
            // Usuário de teste para julianooschulz@gmail.com
            return {
                cod_usuario: 1,
                nome_usuario: 'Juliano Schulz',
                email_usuario: 'julianooschulz@gmail.com',
                cod_empresa: 1,
                cod_tipo_usuario: 1,
                ies_ativo: 'S'
            };
        }
    }


    // Configurar event listeners
    setupEventListeners() {
        // Filtros
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // Busca em tempo real
        document.getElementById('searchTitle').addEventListener('input', (e) => {
            this.filters.title = e.target.value;
            this.applyFilters();
        });

        // Filtros de select
        document.getElementById('filterModel').addEventListener('change', (e) => {
            this.filters.model = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterArea').addEventListener('change', (e) => {
            this.filters.area = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterDate').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.applyFilters();
        });

        // Botão criar primeira ocorrência
        const createFirstBtn = document.getElementById('createFirstOccurrence');
        if (createFirstBtn && !createFirstBtn.hasAttribute('data-listener-added')) {
            createFirstBtn.addEventListener('click', () => {
            this.showCreateOccurrenceModal();
        });
            createFirstBtn.setAttribute('data-listener-added', 'true');
        }

        // Botão criar nova ocorrência
        const createNewBtn = document.getElementById('createNewOccurrence');
        if (createNewBtn && !createNewBtn.hasAttribute('data-listener-added')) {
            createNewBtn.addEventListener('click', () => {
            this.showCreateOccurrenceModal();
        });
            createNewBtn.setAttribute('data-listener-added', 'true');
        }
    }

    // Atualizar opções do filtro de área com dados reais
    updateAreaFilter() {
        const areaSelect = document.getElementById('filterArea');
        if (!areaSelect || !this.areasData) return;

        // Limpar opções existentes (exceto a primeira)
        areaSelect.innerHTML = '<option value="">Todas as áreas</option>';

        // Adicionar áreas reais
        this.areasData.forEach(area => {
            const option = document.createElement('option');
            option.value = area.cod_area;
            option.textContent = area.nome_area;
            areaSelect.appendChild(option);
        });
    }

    // Aplicar filtros
    async applyFilters() {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível para filtrar');
            this.filteredOccurrences = [];
            return;
        }

        this.filteredOccurrences = this.occurrences.filter(occurrence => {
            const titleMatch = !this.filters.title || 
                occurrence.title.toLowerCase().includes(this.filters.title.toLowerCase());
            
            const modelMatch = !this.filters.model || 
                occurrence.model === this.filters.model;
            
            const statusMatch = !this.filters.status || 
                occurrence.status === this.filters.status;
            
            const areaMatch = !this.filters.area || 
                occurrence.area == this.filters.area; // Usar == para comparar string com número
            
            const dateMatch = !this.filters.date || 
                occurrence.createdAt === this.filters.date;

            return titleMatch && modelMatch && statusMatch && areaMatch && dateMatch;
        });

        await this.renderOccurrences();
        this.updateStats();
    }

    // Limpar filtros
    async clearFilters() {
        this.filters = {
            title: '',
            model: '',
            status: '',
            area: '',
            date: ''
        };

        // Limpar campos
        document.getElementById('searchTitle').value = '';
        document.getElementById('filterModel').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterArea').value = '';
        document.getElementById('filterDate').value = '';

        this.filteredOccurrences = [...this.occurrences];
        await this.renderOccurrences();
        this.updateStats();
    }

    // ==============================================
    // FUNÇÕES DE VERIFICAÇÃO DE STATUS DAS ETAPAS
    // ==============================================

    // Verificar se uma etapa está concluída (tem data_fim e hora_fim válidos)
    async verificarEtapaConcluida(codCardRidec, fase) {
        try {
            // Primeiro, buscar o código da etapa específica na tabela card_ridec
            const { data: cardData, error: cardError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('cod_etapa_ri, cod_etapa_d, cod_etapa_e, cod_etapa_c')
                .eq('cod_card_ridec', codCardRidec)
                .single();

            if (cardError || !cardData) {
                console.log(`⚠️ Erro ao buscar card ${codCardRidec}:`, cardError);
                return false;
            }

            // Obter o código da etapa específica baseado na fase
            let codEtapa = null;
            switch (fase) {
                case 'Research':
                    codEtapa = cardData.cod_etapa_ri;
                    break;
                case 'Development':
                    codEtapa = cardData.cod_etapa_d;
                    break;
                case 'Engineering':
                    codEtapa = cardData.cod_etapa_e;
                    break;
                case 'Construction':
                    codEtapa = cardData.cod_etapa_c;
                    break;
                default:
                    console.log(`⚠️ Fase não reconhecida: ${fase}`);
                    return false;
            }

            // Se não há código da etapa, a etapa não foi iniciada
            if (!codEtapa) {
                console.log(`⚠️ Etapa ${fase} não foi iniciada para card ${codCardRidec}`);
                return false;
            }

            // Agora buscar os dados da etapa específica
            const tabelaEtapa = this.getTabelaEtapaCard(fase);
            if (!tabelaEtapa) {
                console.log(`⚠️ Tabela de etapa não encontrada para fase: ${fase}`);
                return false;
            }

            console.log(`🔍 Verificando etapa ${fase} na tabela ${tabelaEtapa} com cod_etapa: ${codEtapa}`);

            const { data, error } = await window.supabaseDB.getClient()
                .from(tabelaEtapa)
                .select('data_fim, hora_fim')
                .eq(`cod_${tabelaEtapa}`, codEtapa)
                .single();

            if (error) {
                console.log(`⚠️ Erro ao verificar etapa ${fase}:`, error);
                console.log(`📋 Detalhes do erro:`, {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                
                // Se a tabela não existe, retornar false sem erro
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.log(`⚠️ Tabela ${tabelaEtapa} não existe, considerando etapa não concluída`);
                    return false;
                }
                
                return false;
            }

            if (!data) {
                console.log(`⚠️ Etapa ${fase} não encontrada com cod_etapa: ${codEtapa}`);
                return false;
            }

            // Verificar se data_fim e hora_fim têm valores válidos
            const temDataFim = data.data_fim && data.data_fim !== null && data.data_fim !== '';
            const temHoraFim = data.hora_fim && data.hora_fim !== null && data.hora_fim !== '';

            console.log(`🔍 Etapa ${fase} - data_fim: ${data.data_fim}, hora_fim: ${data.hora_fim}`);
            console.log(`🔍 Etapa ${fase} concluída: ${temDataFim && temHoraFim}`);

            return temDataFim && temHoraFim;
        } catch (error) {
            console.error(`❌ Erro ao verificar etapa ${fase}:`, error);
            return false;
        }
    }

    // Verificar status de todas as etapas de um card
    async verificarStatusEtapas(codCardRidec) {
        try {
            console.log(`🔍 Verificando status das etapas para card: ${codCardRidec}`);

            const status = {
                RI: await this.verificarEtapaConcluida(codCardRidec, 'Research'),
                D: await this.verificarEtapaConcluida(codCardRidec, 'Development'),
                E: await this.verificarEtapaConcluida(codCardRidec, 'Engineering'),
                C: await this.verificarEtapaConcluida(codCardRidec, 'Construction')
            };

            console.log(`📊 Status das etapas:`, status);
            return status;
        } catch (error) {
            console.error('❌ Erro ao verificar status das etapas:', error);
            return { RI: false, D: false, E: false, C: false };
        }
    }

    // Determinar qual botão de concluir deve ser exibido
    determinarBotaoConcluir(statusEtapas) {
        const { RI, D, E, C } = statusEtapas;

        if (RI && D && E && C) {
            return { mostrar: false, etapa: null, concluido: true };
        } else if (RI && D && E && !C) {
            return { mostrar: true, etapa: 'C', concluido: false };
        } else if (RI && D && !E) {
            return { mostrar: true, etapa: 'E', concluido: false };
        } else if (RI && !D) {
            return { mostrar: true, etapa: 'D', concluido: false };
        } else {
            return { mostrar: true, etapa: 'RI', concluido: false };
        }
    }

    // ==============================================
    // FUNÇÕES DE CONCLUSÃO DE ETAPAS
    // ==============================================

    // Concluir uma etapa específica
    async concluirEtapa(codCardRidec, fase) {
        try {
            console.log(`🎯 Concluindo etapa ${fase} para card ${codCardRidec}`);

            // Primeiro, buscar o código da etapa específica na tabela card_ridec
            const { data: cardData, error: cardError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('cod_etapa_ri, cod_etapa_d, cod_etapa_e, cod_etapa_c')
                .eq('cod_card_ridec', codCardRidec)
                .single();

            if (cardError || !cardData) {
                console.error(`❌ Erro ao buscar card ${codCardRidec}:`, cardError);
                throw new Error(`Erro ao buscar card: ${cardError?.message}`);
            }

            // Obter o código da etapa específica baseado na fase
            let codEtapa = null;
            switch (fase) {
                case 'Research':
                    codEtapa = cardData.cod_etapa_ri;
                    break;
                case 'Development':
                    codEtapa = cardData.cod_etapa_d;
                    break;
                case 'Engineering':
                    codEtapa = cardData.cod_etapa_e;
                    break;
                case 'Construction':
                    codEtapa = cardData.cod_etapa_c;
                    break;
                default:
                    throw new Error(`Fase não reconhecida: ${fase}`);
            }

            // Se não há código da etapa, a etapa não foi iniciada
            if (!codEtapa) {
                throw new Error(`Etapa ${fase} não foi iniciada para card ${codCardRidec}`);
            }

            const tabelaEtapa = this.getTabelaEtapaCard(fase);
            if (!tabelaEtapa) {
                throw new Error(`Tabela de etapa não encontrada para fase: ${fase}`);
            }

            // Obter data e hora atual
            const agora = new Date();
            const dataAtual = agora.toISOString().split('T')[0]; // YYYY-MM-DD
            const horaAtual = agora.toTimeString().split(' ')[0]; // HH:MM:SS

            console.log(`📅 Data atual: ${dataAtual}, Hora atual: ${horaAtual}`);
            console.log(`🔧 Atualizando etapa ${fase} com cod_etapa: ${codEtapa}`);

            // Buscar dados da etapa para calcular tempo diferenca
            const { data: etapaData, error: etapaError } = await window.supabaseDB.getClient()
                .from(tabelaEtapa)
                .select('data_inicio, hora_inicio, cod_card_ridec')
                .eq(`cod_${tabelaEtapa}`, codEtapa)
                .single();

            let tempoDiferenca = 0;
            if (!etapaError && etapaData) {
                // Calcular tempo diferenca baseado na UOM do modelo
                tempoDiferenca = await this.calcularTempoDiferenca(
                    etapaData.cod_card_ridec,
                    this.getCodTipoEtapaFromFase(fase),
                    etapaData.data_inicio,
                    etapaData.hora_inicio,
                    dataAtual,
                    horaAtual
                );
                console.log(`⏱️ Tempo diferenca calculado: ${tempoDiferenca}`);
            }

            // Atualizar etapa atual com data_fim, hora_fim e tempo_diferenca
            const { error: updateError } = await window.supabaseDB.getClient()
                .from(tabelaEtapa)
                .update({
                    data_fim: dataAtual,
                    hora_fim: horaAtual,
                    tempo_diferenca: tempoDiferenca
                })
                .eq(`cod_${tabelaEtapa}`, codEtapa);

            if (updateError) {
                console.error(`❌ Erro ao atualizar etapa ${fase}:`, updateError);
                throw updateError;
            }

            console.log(`✅ Etapa ${fase} concluída com sucesso`);

            // Verificar se há próxima etapa no modelo antes de decidir o que fazer
            console.log(`🔍 [DEBUG] Iniciando verificação de próxima etapa para card ${codCardRidec}, fase ${fase}`);
            
            try {
                const codModeloRidec = await this.getCodModeloRidecFromCard(codCardRidec);
                console.log(`🔍 [DEBUG] Cod_modelo_ridec obtido: ${codModeloRidec}`);
                
                const codTipoEtapa = this.getCodTipoEtapaFromFase(fase);
                console.log(`🔍 [DEBUG] Cod_tipo_etapa obtido: ${codTipoEtapa}`);
                
                const proximaEtapaModelo = await this.getProximaEtapaModelo(codModeloRidec, codTipoEtapa);
                console.log(`🔍 [DEBUG] Próxima etapa do modelo:`, proximaEtapaModelo);
                
                if (proximaEtapaModelo) {
                    // Há próxima etapa no modelo, iniciar a próxima fase
                    console.log(`✅ [DEBUG] Há próxima etapa no modelo, verificando próxima fase na sequência`);
                    const proximaFase = this.obterProximaFase(fase);
                    console.log(`🔍 [DEBUG] Próxima fase na sequência: ${proximaFase}`);
                    
                    if (proximaFase) {
                        console.log(`🚀 Iniciando próxima etapa ${proximaFase} com data_fim e hora_fim da etapa anterior`);
                        await this.iniciarProximaEtapa(codCardRidec, proximaFase, dataAtual, horaAtual);
                    } else {
                        // Não há próxima fase na sequência, mas há próxima etapa no modelo
                        console.log(`⚠️ Não há próxima fase na sequência, mas há próxima etapa no modelo - marcando como concluído`);
                        await this.marcarCardComoConcluido(codCardRidec);
                    }
                } else {
                    // Não há próxima etapa no modelo, marcar o card como concluído
                    console.log(`🏁 Não há próxima etapa no modelo, marcando card como concluído`);
                    await this.marcarCardComoConcluido(codCardRidec);
                }
            } catch (error) {
                console.error(`❌ [DEBUG] Erro na verificação de próxima etapa:`, error);
                // Em caso de erro, marcar como concluído por segurança
                console.log(`🛡️ [DEBUG] Erro na verificação, marcando card como concluído por segurança`);
                await this.marcarCardComoConcluido(codCardRidec);
            }

            return true;
        } catch (error) {
            console.error(`❌ Erro ao concluir etapa ${fase}:`, error);
            throw error;
        }
    }

    // Obter próxima fase na sequência
    obterProximaFase(faseAtual) {
        const sequencia = ['Research', 'Development', 'Engineering', 'Construction'];
        const indiceAtual = sequencia.indexOf(faseAtual);
        
        if (indiceAtual === -1 || indiceAtual === sequencia.length - 1) {
            return null; // Não há próxima fase
        }
        
        return sequencia[indiceAtual + 1];
    }

    // Obter cod_modelo_ridec de um card
    async getCodModeloRidecFromCard(codCardRidec) {
        try {
            console.log(`🔍 [DEBUG] Buscando cod_modelo_ridec para card ${codCardRidec}`);
            console.log(`🔍 [DEBUG] Verificando se Supabase está disponível:`, !!window.supabaseDB);
            
            if (!window.supabaseDB) {
                console.error('❌ [DEBUG] Supabase não está disponível');
                throw new Error('Supabase não está disponível');
            }
            
            const { data: cardData, error: cardError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('cod_modelo_ridec')
                .eq('cod_card_ridec', codCardRidec)
                .single();

            console.log(`🔍 [DEBUG] Resultado da busca:`, { cardData, cardError });

            if (cardError || !cardData) {
                console.error(`❌ [DEBUG] Erro ao buscar cod_modelo_ridec para card ${codCardRidec}:`, cardError);
                console.error(`❌ [DEBUG] Detalhes do erro:`, {
                    message: cardError?.message,
                    details: cardError?.details,
                    hint: cardError?.hint,
                    code: cardError?.code
                });
                throw new Error(`Erro ao buscar modelo do card: ${cardError?.message}`);
            }

            console.log(`✅ [DEBUG] Cod_modelo_ridec encontrado: ${cardData.cod_modelo_ridec}`);
            return cardData.cod_modelo_ridec;
        } catch (error) {
            console.error(`❌ [DEBUG] Erro ao obter cod_modelo_ridec do card:`, error);
            throw error;
        }
    }

    // Iniciar próxima etapa
    async iniciarProximaEtapa(codCardRidec, fase, dataInicio, horaInicio) {
        try {
            console.log(`🚀 Iniciando próxima etapa ${fase} para card ${codCardRidec}`);

            const tabelaEtapa = this.getTabelaEtapaCard(fase);
            if (!tabelaEtapa) {
                console.log(`⚠️ Tabela de etapa não encontrada para fase: ${fase}`);
                return;
            }

            // Criar nova etapa na tabela específica
            const etapaData = {
                cod_card_ridec: codCardRidec,
                data_inicio: dataInicio,
                hora_inicio: horaInicio
            };

            console.log(`🔧 Criando etapa ${fase} com dados:`, etapaData);
            console.log(`📋 Inserindo na tabela: ${tabelaEtapa}`);

            const { data: insertData, error: insertError } = await window.supabaseDB.getClient()
                .from(tabelaEtapa)
                .insert([etapaData])
                .select();

            if (insertError) {
                console.error(`❌ Erro ao criar etapa ${fase}:`, insertError);
                console.error(`📋 Detalhes do erro:`, {
                    message: insertError.message,
                    details: insertError.details,
                    hint: insertError.hint,
                    code: insertError.code
                });
                
                // Se a tabela não existe, informar o usuário
                if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
                    console.log(`⚠️ Tabela ${tabelaEtapa} não existe. Execute o script SQL create-etapas-executadas.sql para criar as tabelas necessárias.`);
                    this.showNotification(`Tabela ${tabelaEtapa} não existe. Execute o script SQL para criar as tabelas.`, 'error');
                    return;
                } else {
                    return;
                }
            }

            if (insertData && insertData.length > 0) {
                const codEtapa = insertData[0][`cod_${tabelaEtapa}`];
                console.log(`✅ Etapa ${fase} criada com sucesso, cod_etapa: ${codEtapa}`);

                // Atualizar o card_ridec com o código da nova etapa
                const campoEtapa = `cod_${tabelaEtapa}`;
                const { error: updateCardError } = await window.supabaseDB.getClient()
                    .from('card_ridec')
                    .update({ [campoEtapa]: codEtapa })
                    .eq('cod_card_ridec', codCardRidec);

                if (updateCardError) {
                    console.error(`❌ Erro ao atualizar card com código da etapa ${fase}:`, updateCardError);
                } else {
                    console.log(`✅ Card atualizado com código da etapa ${fase}: ${codEtapa}`);
                }
            }
        } catch (error) {
            console.error(`❌ Erro ao iniciar próxima etapa ${fase}:`, error);
        }
    }

    // Verificar se a tabela de etapa existe
    async verificarTabelaEtapa(tabelaEtapa) {
        try {
            console.log(`🔍 Verificando se tabela ${tabelaEtapa} existe...`);
            
            // Tentar fazer uma consulta simples para verificar se a tabela existe
            const { data, error } = await window.supabaseDB.getClient()
                .from(tabelaEtapa)
                .select('*')
                .limit(1);
            
            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.log(`⚠️ Tabela ${tabelaEtapa} não existe`);
                    return false;
                }
                console.error(`❌ Erro ao verificar tabela ${tabelaEtapa}:`, error);
                return false;
            }
            
            console.log(`✅ Tabela ${tabelaEtapa} existe`);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao verificar tabela ${tabelaEtapa}:`, error);
            return false;
        }
    }

    // Marcar card como concluído
    async marcarCardComoConcluido(codCardRidec) {
        try {
            console.log(`🎉 [DEBUG] Iniciando marcação do card ${codCardRidec} como concluído`);
            console.log(`🔍 [DEBUG] Verificando se Supabase está disponível:`, !!window.supabaseDB);

            if (!window.supabaseDB) {
                console.error('❌ [DEBUG] Supabase não está disponível');
                throw new Error('Supabase não está disponível');
            }

            console.log(`🔧 [DEBUG] Executando update na tabela card_ridec para cod_card_ridec: ${codCardRidec}`);

            const { data, error } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .update({
                    ies_concluiu: 'S'
                })
                .eq('cod_card_ridec', codCardRidec)
                .select();

            console.log(`🔍 [DEBUG] Resultado do update:`, { data, error });

            if (error) {
                console.error('❌ [DEBUG] Erro ao marcar card como concluído:', error);
                console.error('❌ [DEBUG] Detalhes do erro:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log(`✅ [DEBUG] Card ${codCardRidec} marcado como concluído com sucesso`);
            console.log(`📊 [DEBUG] Dados retornados:`, data);
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao marcar card como concluído:', error);
            throw error;
        }
    }

    // Obter fase completa baseada na sigla
    obterFaseCompleta(sigla) {
        const fases = {
            'RI': 'Research',
            'D': 'Development',
            'E': 'Engineering',
            'C': 'Construction'
        };
        return fases[sigla] || sigla;
    }

    // Função para ser chamada pelo botão de concluir
    async concluirEtapaCard(codCardRidec, fase) {
        try {
            console.log(`🎯 Concluindo etapa ${fase} para card ${codCardRidec}`);
            
            await this.concluirEtapa(codCardRidec, fase);
            
            // Atualizar interface
            await this.renderOccurrences();
            this.updateStats();
            
            this.showNotification(`Etapa ${fase} concluída com sucesso!`, 'success');
        } catch (error) {
            console.error('❌ Erro ao concluir etapa:', error);
            this.showNotification('Erro ao concluir etapa', 'error');
        }
    }

    // Renderizar ocorrências organizadas por área
    async renderOccurrences() {
        console.log('🎨 Iniciando renderização de ocorrências...');
        console.log('📊 Ocorrências filtradas:', this.filteredOccurrences.length);
        
        const grid = document.getElementById('occurrencesGrid');
        const emptyState = document.getElementById('emptyState');

        if (!grid) {
            console.error('❌ Elemento occurrencesGrid não encontrado');
            return;
        }

        // Verificar se há áreas para renderizar (mesmo sem ocorrências)
        if (!this.areasData || this.areasData.length === 0) {
            console.log('⚠️ Nenhuma área encontrada para renderizar');
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        if (this.filteredOccurrences.length === 0) {
            console.log('⚠️ Nenhuma ocorrência para renderizar, mas há áreas disponíveis');
        }

        console.log('✅ Renderizando', this.filteredOccurrences.length, 'ocorrências');

        grid.style.display = 'block';
        emptyState.style.display = 'none';

        // Organizar ocorrências por área
        const occurrencesByArea = this.groupOccurrencesByArea(this.filteredOccurrences);
        console.log('🏢 Ocorrências agrupadas por área:', occurrencesByArea);
        
        // Renderizar cada área com suas ocorrências
        if (!occurrencesByArea || typeof occurrencesByArea !== 'object') {
            console.log('⚠️ Nenhum agrupamento de áreas disponível');
            grid.innerHTML = '<div class="no-data">Nenhuma ocorrência encontrada</div>';
            return;
        }
        
        const areasHtml = await Promise.all(Object.keys(occurrencesByArea).map(async areaName => {
            console.log(`🔨 Criando seção para área: ${areaName} com ${occurrencesByArea[areaName].length} ocorrências`);
            return await this.createAreaSection(areaName, occurrencesByArea[areaName]);
        }));

        console.log('📝 HTML gerado:', areasHtml.length, 'caracteres');
        grid.innerHTML = areasHtml;

        // Adicionar event listeners aos botões dos cards
        this.setupCardEventListeners();
        
        console.log('✅ Renderização concluída');
    }

    // Agrupar ocorrências por área e modelo
    groupOccurrencesByArea(occurrences) {
        console.log('🔄 Agrupando ocorrências por área e modelo...');
        console.log('📋 Ocorrências recebidas:', occurrences);
        
        if (!occurrences || !Array.isArray(occurrences)) {
            console.log('⚠️ Nenhuma ocorrência válida para agrupar');
            return {};
        }
        
        const grouped = {};
        
        // Adicionar apenas as ocorrências às suas respectivas áreas e modelos
        // Não adicionar áreas vazias - apenas áreas que têm cards ativos
        occurrences.forEach((occurrence, index) => {
            console.log(`🔍 Processando ocorrência ${index + 1}:`, occurrence);
            const areaName = occurrence.areaName || 'Área não definida';
            const modelName = occurrence.modelName || 'Modelo não definido';
            console.log(`📍 Área da ocorrência: "${areaName}", Modelo: "${modelName}"`);
            
            if (!grouped[areaName]) {
                grouped[areaName] = {};
                console.log(`🆕 Nova área criada: "${areaName}"`);
            }
            
            if (!grouped[areaName][modelName]) {
                grouped[areaName][modelName] = [];
                console.log(`🆕 Novo modelo criado: "${modelName}" na área "${areaName}"`);
            }
            
            grouped[areaName][modelName].push(occurrence);
            console.log(`✅ Ocorrência adicionada ao modelo "${modelName}" na área "${areaName}"`);
        });
        
        console.log('📊 Resultado do agrupamento:', grouped);
        return grouped;
    }

    // Criar seção de área com seus modelos (expander)
    async createAreaSection(areaName, modelsData) {
        console.log(`🏗️ Criando seção para área: "${areaName}" com modelos:`, modelsData);
        
        if (!modelsData || typeof modelsData !== 'object') {
            console.log('⚠️ Dados de modelos inválidos para área:', areaName);
            return '';
        }
        
        // Calcular estatísticas totais da área
        let totalOccurrences = 0;
        let activeCount = 0;
        let completedCount = 0;
        
        Object.values(modelsData).forEach(occurrences => {
            if (occurrences && Array.isArray(occurrences)) {
                totalOccurrences += occurrences.length;
                activeCount += occurrences.filter(o => o.status === 'active').length;
                completedCount += occurrences.filter(o => o.status === 'completed').length;
            }
        });
        
        // Se não há ocorrências ativas, não renderizar a área
        if (totalOccurrences === 0) {
            console.log(`⚠️ Área "${areaName}" não tem cards ativos, não será renderizada`);
            return '';
        }
        
        const areaId = `area-${areaName.replace(/\s+/g, '-').toLowerCase()}`;
        
        console.log(`📊 Estatísticas da área "${areaName}":`, {
            total: totalOccurrences,
            ativos: activeCount,
            concluidos: completedCount,
            areaId: areaId
        });
        
        const html = `
            <div class="ridec-area-expander" data-area="${areaName}">
                <div class="area-expander-header" onclick="toggleAreaExpander('${areaId}')">
                    <div class="area-title">
                        <h3>${areaName}</h3>
                        <span class="area-badge">${totalOccurrences} ocorrência${totalOccurrences !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="area-stats">
                        <div class="area-stat">
                            <i class="fas fa-play-circle active"></i>
                            <span>${activeCount} ativo${activeCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="area-stat">
                            <i class="fas fa-check-circle completed"></i>
                            <span>${completedCount} concluído${completedCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="area-expander-toggle">
                        <i class="fas fa-chevron-down expander-icon" id="icon-${areaId}"></i>
                    </div>
                </div>
                <div class="area-expander-content" id="${areaId}" style="display: none;">
                    <div class="area-models-container">
                        ${Object.keys(modelsData).length > 0 
                            ? (await Promise.all(Object.entries(modelsData)
                                .filter(([modelName, occurrences]) => occurrences && occurrences.length > 0)
                                .map(async ([modelName, occurrences]) => 
                                await this.createModelExpander(areaName, modelName, occurrences)
                              ))).join('')
                            : this.createEmptyAreaMessage()
                        }
                    </div>
                </div>
            </div>
        `;
        
        console.log(`✅ HTML da área "${areaName}" criado:`, html.length, 'caracteres');
        return html;
    }

    // Criar expander de modelo dentro de uma área
    async createModelExpander(areaName, modelName, occurrences) {
        console.log(`🏗️ Criando expander para modelo: "${modelName}" com ${occurrences.length} ocorrências`);
        
        // Se não há ocorrências, não renderizar o modelo
        if (!occurrences || occurrences.length === 0) {
            console.log(`⚠️ Modelo "${modelName}" não tem cards ativos, não será renderizado`);
            return '';
        }
        
        const activeCount = occurrences.filter(o => o.status === 'active').length;
        const completedCount = occurrences.filter(o => o.status === 'completed').length;
        
        // Buscar percentual de NC real da tabela modelo_ridec
        let ncPercentage = '0.0';
        if (occurrences.length > 0 && occurrences[0].model) {
            try {
                const { data: modelo, error } = await window.supabaseDB.getClient()
                    .from('modelo_ridec')
                    .select('valor_nc')
                    .eq('cod_modelo_ridec', occurrences[0].model)
                    .single();
                
                if (!error && modelo && modelo.valor_nc !== null && modelo.valor_nc !== undefined) {
                    ncPercentage = parseFloat(modelo.valor_nc).toFixed(1);
                }
            } catch (error) {
                console.error('❌ Erro ao buscar valor_nc:', error);
                // Manter valor padrão
            }
        }
        
        const modelId = `model-${areaName.replace(/\s+/g, '-').toLowerCase()}-${modelName.replace(/\s+/g, '-').toLowerCase()}`;
        
        // Obter informações das etapas RIDEC do primeiro modelo
        console.log('🔍 Chamando getModelStageInfo para:', occurrences[0]);
        const stageInfo = await this.getModelStageInfo(occurrences[0]);
        console.log('🔍 stageInfo retornado:', stageInfo);
        
        const html = `
            <div class="ridec-model-expander" data-area="${areaName}" data-model="${modelName}">
                <div class="model-expander-header" onclick="toggleModelExpander('${modelId}')">
                    <div class="model-title">
                        <i class="fas fa-cogs"></i>
                        <h4>${modelName}</h4>
                        <span class="model-badge">${occurrences.length} ocorrência${occurrences.length !== 1 ? 's' : ''} - ${ncPercentage}% NC</span>
                    </div>
                    <div class="model-stats">
                        <div class="model-stat">
                            <i class="fas fa-play-circle active"></i>
                            <span>${activeCount} ativo${activeCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="model-stat">
                            <i class="fas fa-check-circle completed"></i>
                            <span>${completedCount} concluído${completedCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="model-stat">
                            <i class="fas fa-exclamation-triangle overdue"></i>
                            <span>${ncPercentage}% NC</span>
                        </div>
                    </div>
                    <div class="model-expander-toggle">
                        <i class="fas fa-chevron-down expander-icon" id="icon-${modelId}"></i>
                    </div>
                </div>
                <div class="model-expander-content" id="${modelId}" style="display: none;">
                    ${stageInfo}
                    <div class="model-occurrences-grid">
                        ${(await Promise.all(occurrences.map(occurrence => this.createOccurrenceCard(occurrence)))).join('')}
                    </div>
                </div>
            </div>
        `;
        
        console.log(`✅ HTML do modelo "${modelName}" criado:`, html.length, 'caracteres');
        return html;
    }

    // Obter informações das etapas RIDEC do modelo
    async getModelStageInfo(occurrence) {
        console.log('🔍 getModelStageInfo chamado com occurrence:', occurrence);
        
        if (!occurrence || !occurrence.model) {
            console.log('⚠️ Occurrence ou model não encontrado');
            return '<div class="no-stages-info">Nenhuma etapa RIDEC disponível</div>';
        }

        try {
            console.log(`🔍 getModelStageInfo: Buscando etapas para modelo ${occurrence.model}`);
            
            // Buscar etapas reais do banco de dados usando a nova lógica sequencial
            const etapas = await this.getEtapasByModelo(occurrence.model);
            console.log('🔍 Etapas retornadas pelo getEtapasByModelo:', etapas);
            
            if (!etapas || etapas.length === 0) {
                console.log('⚠️ Nenhuma etapa encontrada para o modelo:', occurrence.model);
                return '<div class="no-stages-info">Nenhuma etapa RIDEC disponível</div>';
            }

            console.log('📊 Etapas encontradas em sequência:', etapas.map(e => ({
                fase: e.fase,
                cod_etapa: e.cod_etapa,
                cod_m_etapa_anterior: e.cod_m_etapa_anterior,
                nome_tipo_etapa: e.tipo_etapa?.nome_tipo_etapa,
                path_arquivo: e.path_arquivo,
                hasPathArquivo: !!(e.path_arquivo && e.path_arquivo.trim() !== '')
            })));

            // Renderizar etapas na ordem sequencial encontrada
            const stagesHtml = etapas.map((etapa, index) => {
                console.log(`🔍 Processando etapa ${index + 1}/${etapas.length}:`, etapa);

                // Usar os campos da tabela modelo_etapa_ridec
                const uomValue = etapa.valor_uom || '1.0';
                const uomUnit = etapa.uom?.desc_uom || etapa.unidade_uom || 'un';
                
                // Usar apenas nome_tipo_etapa da tabela tipo_etapa
                const nomeEtapa = etapa.tipo_etapa?.nome_tipo_etapa || etapa.fase || 'Etapa';
                // Usar sigla baseada no cod_tipo_etapa
                console.log(`🔍 etapa.cod_tipo_etapa:`, etapa.cod_tipo_etapa, 'type:', typeof etapa.cod_tipo_etapa);
                const siglaEtapa = this.getSiglaFromCodTipoEtapa(etapa.cod_tipo_etapa);
                
                console.log(`📊 Valores finais - uomValue: ${uomValue}, uomUnit: ${uomUnit}, nomeEtapa: ${nomeEtapa}, siglaEtapa: ${siglaEtapa}`);
                
                // Verificar se existe path_arquivo para mostrar ícone
                const hasFile = etapa.path_arquivo && etapa.path_arquivo.trim() !== '';
                console.log(`🔍 Etapa ${siglaEtapa} - path_arquivo: "${etapa.path_arquivo}", hasFile: ${hasFile}`);
                
                let fileIcon = '';
                if (hasFile) {
                    // Verificar se é um link local (começa com C:, D:, etc.)
                    const isLocalPath = /^[A-Za-z]:/.test(etapa.path_arquivo);
                    
                    if (isLocalPath) {
                        // Para arquivos locais, mostrar ícone com funcionalidade de copiar
                        fileIcon = `<i class="fas fa-file-alt stage-file-icon" 
                            title="Arquivo local: ${etapa.path_arquivo} (clique para copiar caminho)" 
                            onclick="copyLocalPath('${etapa.path_arquivo}')"
                            style="cursor: pointer;"></i>`;
                    } else {
                        // Para URLs, tentar abrir normalmente
                        fileIcon = `<i class="fas fa-file-alt stage-file-icon" 
                            title="Abrir arquivo: ${etapa.path_arquivo}" 
                            onclick="openFile('${etapa.path_arquivo}')"
                            style="cursor: pointer;"></i>`;
                    }
                }

                console.log(`🔍 HTML do ícone para ${siglaEtapa}:`, fileIcon);
                console.log(`🔍 HTML completo da etapa ${siglaEtapa}:`, `
                    <div class="stage-column">
                        <div class="stage-sigla-container">
                            <div class="stage-sigla" title="${nomeEtapa}">${siglaEtapa}</div>
                            ${fileIcon}
                        </div>
                        <div class="stage-uom">
                            <div class="uom-value">${uomValue}</div>
                            <div class="uom-unit">${uomUnit}</div>
                        </div>
                    </div>
                `);

                return `
                    <div class="stage-column">
                        <div class="stage-sigla-container">
                            <div class="stage-sigla" title="${nomeEtapa}">${siglaEtapa}</div>
                            ${fileIcon}
                        </div>
                        <div class="stage-uom">
                            <div class="uom-value">${uomValue}</div>
                            <div class="uom-unit">${uomUnit}</div>
                        </div>
                    </div>
                `;
            }).join('');

            const finalHtml = `
                <div class="model-stages-info">
                    <div class="stages-info-header">
                        <i class="fas fa-list-alt"></i>
                        <h4>Etapas RIDEC (Sequência: ${etapas.length} etapas)</h4>
                    </div>
                    <div class="stages-info-grid">
                        ${stagesHtml}
                    </div>
                </div>
            `;
            
            console.log('🔍 HTML final das etapas:', finalHtml);
            console.log('🔍 stagesHtml individual:', stagesHtml);
            return finalHtml;
        } catch (error) {
            console.error('❌ Erro ao buscar informações das etapas:', error);
            return '<div class="no-stages-info">Erro ao carregar etapas RIDEC</div>';
        }
    }

    // Obter sigla da fase
    getFaseSigla(fase) {
        const siglas = {
            'Research': 'RI',
            'Development': 'D',
            'Engineering': 'E',
            'Construction': 'C',
            'Assembly': 'A'
        };
        return siglas[fase] || fase.substring(0, 1).toUpperCase();
    }

    // Mapear cod_tipo_etapa para sigla
    getSiglaFromCodTipoEtapa(codTipoEtapa) {
        console.log(`🔍 getSiglaFromCodTipoEtapa: codTipoEtapa = ${codTipoEtapa}, type = ${typeof codTipoEtapa}`);
        
        const mapeamento = {
            1: 'RI',      // Research
            2: 'D',       // Development
            3: 'E',       // Engineering
            4: 'C',       // Construction
            5: 'A',       // Assembly
            6: 'SIMPLES'  // Simples
        };
        
        const sigla = mapeamento[codTipoEtapa] || `T${codTipoEtapa}`;
        console.log(`🔍 getSiglaFromCodTipoEtapa: sigla = ${sigla}`);
        return sigla;
    }

    // Função para abrir arquivos (URLs)
    openFile(filePath) {
        try {
            console.log('🔍 Tentando abrir arquivo:', filePath);
            window.open(filePath, '_blank');
        } catch (error) {
            console.error('❌ Erro ao abrir arquivo:', error);
            this.showNotification('Erro ao abrir arquivo', 'error');
        }
    }

    // Função para copiar caminho de arquivo local
    copyLocalPath(filePath) {
        try {
            console.log('🔍 Copiando caminho local:', filePath);
            
            // Copiar para área de transferência
            navigator.clipboard.writeText(filePath).then(() => {
                this.showNotification(`Caminho copiado: ${filePath}`, 'success');
                console.log('✅ Caminho copiado com sucesso');
            }).catch(err => {
                console.error('❌ Erro ao copiar para área de transferência:', err);
                // Fallback: mostrar em prompt
                this.showLocalPathDialog(filePath);
            });
        } catch (error) {
            console.error('❌ Erro ao copiar caminho:', error);
            this.showLocalPathDialog(filePath);
        }
    }

    // Mostrar diálogo com caminho local
    showLocalPathDialog(filePath) {
        // Verificar se já existe um modal aberto
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            console.log('⚠️ Modal já está aberto, não criando novo');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modern-modal-content" style="max-width: 600px;">
                <div class="modern-header">
                    <div class="modal-title-section">
                        <div class="modal-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="modal-title-content">
                            <h2>Arquivo Local</h2>
                            <p class="modal-subtitle">Caminho do arquivo local</p>
                        </div>
                    </div>
                    <div class="modern-close" onclick="this.closest('.modal').remove()">&times;</div>
                </div>
                <div class="modern-body" style="padding: 20px;">
                    <div class="form-group">
                        <label class="form-label">Caminho do arquivo:</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" class="form-input" value="${filePath}" readonly style="flex: 1;">
                            <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${filePath}').then(() => this.showNotification('Caminho copiado!', 'success')).catch(() => this.showNotification('Erro ao copiar', 'error'))">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #495057;">Instruções:</h4>
                        <ol style="margin: 0; padding-left: 20px; color: #6c757d;">
                            <li>Copie o caminho acima</li>
                            <li>Cole no Windows Explorer (Win + E)</li>
                            <li>Ou cole na barra de endereços do navegador</li>
                        </ol>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Criar mensagem para área sem modelos
    createEmptyAreaMessage() {
        return `
            <div class="empty-area-message">
                <div class="empty-area-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <div class="empty-area-text">
                    <h4>Nenhum modelo RIDEC cadastrado</h4>
                    <p>Esta área ainda não possui modelos RIDEC cadastrados.</p>
                    <button class="btn-create-model" onclick="createNewModel()">
                        <i class="fas fa-plus"></i>
                        Criar Primeiro Modelo
                    </button>
                </div>
            </div>
        `;
    }

    // Criar card de modelo RIDEC
    createModelCard(occurrence) {
        const statusClass = this.getStatusClass(occurrence.status);
        const statusText = this.getStatusText(occurrence.status);
        const progressClass = occurrence.status === 'overdue' ? 'overdue' : 
                             occurrence.status === 'completed' ? 'completed' : 'active';
        
        return `
            <div class="model-card" data-model-id="${occurrence.id}">
                <div class="model-card-header">
                    <div class="model-title">
                        <h4>${occurrence.title}</h4>
                        <span class="model-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="model-actions">
                        <button class="btn-action btn-edit" onclick="editModel('${occurrence.id}')" title="Editar modelo">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-connect" onclick="connectModel('${occurrence.id}')" title="Conectar">
                            <i class="fas fa-link"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteModel('${occurrence.id}')" title="Excluir modelo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="model-card-content">
                    <div class="model-description">
                        <p>${occurrence.description || 'Sem descrição disponível'}</p>
                    </div>
                    <div class="model-details">
                        <div class="model-detail">
                            <i class="fas fa-clock"></i>
                            <span>Tempo máximo: ${occurrence.maxTime || 'N/A'}</span>
                        </div>
                        <div class="model-detail">
                            <i class="fas fa-percentage"></i>
                            <span>Progresso: ${occurrence.progress || 0}%</span>
                        </div>
                        <div class="model-detail">
                            <i class="fas fa-calendar"></i>
                            <span>Prazo: ${this.formatDateDDMMYYYY(occurrence.deadline)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Criar card de ocorrência (método original mantido para compatibilidade)
    async createOccurrenceCard(occurrence) {
        if (!occurrence) {
            console.log('⚠️ Ocorrência inválida para criar card');
            return '<div class="error-card">Ocorrência inválida</div>';
        }

        const statusClass = this.getStatusClass(occurrence.status);
        const statusText = this.getStatusText(occurrence.status);
        const occurrenceId = `occurrence-${occurrence.id}`;
        const idExterno = occurrence.externalId || occurrence.id_externo || occurrence.id;

        // Verificar status das etapas para determinar botões de concluir
        let botaoConcluir = '';
        try {
            const statusEtapas = await this.verificarStatusEtapas(occurrence.id);
            const botaoInfo = this.determinarBotaoConcluir(statusEtapas);
            
            if (botaoInfo.mostrar) {
                const faseCompleta = this.obterFaseCompleta(botaoInfo.etapa);
                botaoConcluir = `
                    <button class="btn-stage btn-complete" onclick="window.ridecOccurrences.concluirEtapaCard(${occurrence.id}, '${faseCompleta}')">
                        <i class="fas fa-check"></i>
                        Concluir ${botaoInfo.etapa}
                    </button>
                `;
            } else if (botaoInfo.concluido) {
                botaoConcluir = `
                    <div class="stage-status completed">
                        <i class="fas fa-check-circle"></i>
                        Concluído
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Erro ao verificar status das etapas:', error);
        }

        // Criar colunas das etapas com datas e horários
        const stagesColumnsHtml = await this.createStagesColumns(occurrence);

        return `
            <div class="occurrence-expander" data-id="${occurrence.id}">
                <div class="occurrence-expander-header" onclick="toggleOccurrenceExpander('${occurrenceId}')">
                    <div class="occurrence-title">
                        <i class="fas fa-file-alt"></i>
                        <h4>ID: ${idExterno}</h4>
                        <span class="occurrence-badge badge-${occurrence.status}">${statusText}</span>
                    </div>
                    <div class="occurrence-expander-toggle">
                        <i class="fas fa-chevron-down expander-icon" id="icon-${occurrenceId}"></i>
                    </div>
                </div>
                <div class="occurrence-expander-content" id="${occurrenceId}" style="display: none;">
                    <div class="occurrence-stages-table">
                        ${stagesColumnsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // Criar colunas das etapas com datas e horários
    async createStagesColumns(occurrence) {
        console.log('🔄 createStagesColumns chamada com ocorrência:', {
            id: occurrence.id,
            etapas: occurrence.etapas?.length || 0,
            etapasDetalhes: occurrence.etapas?.map(e => ({
                fase: e.fase,
                sigla: e.sigla,
                data_inicio: e.data_inicio,
                hora_inicio: e.hora_inicio,
                data_fim: e.data_fim,
                hora_fim: e.hora_fim
            }))
        });

        // Usar etapas da nova estrutura se disponível
        if (occurrence.etapas && occurrence.etapas.length > 0) {
            console.log('✅ Usando createStagesColumnsNew (nova estrutura)');
            return this.createStagesColumnsNew(occurrence);
        }
        
        // Fallback para estrutura antiga
        const etapas = [
            { sigla: 'RI', fase: 'Research' },
            { sigla: 'D', fase: 'Development' },
            { sigla: 'E', fase: 'Engineering' },
            { sigla: 'C', fase: 'Construction' },
            { sigla: 'A', fase: 'Assembly' }
        ];
        
        // Verificar status das etapas para determinar botões de concluir
        let statusEtapas = { RI: false, D: false, E: false, C: false };
        try {
            statusEtapas = await this.verificarStatusEtapas(occurrence.id);
        } catch (error) {
            console.error('❌ Erro ao verificar status das etapas:', error);
        }
        
        const botaoInfo = this.determinarBotaoConcluir(statusEtapas);
        
        // Buscar dados reais das etapas executadas da tabela etapa_ridec
        console.log(`🔍 Buscando etapas executadas para ocorrência ${occurrence.id}`);
        const etapasExecutadas = await this.getEtapasCard(occurrence.id);
        
        // Organizar etapas por tipo para facilitar a busca
        const etapasPorTipo = {};
        etapasExecutadas.forEach(etapa => {
            const tipoEtapa = etapa.tipo_etapa?.nome_tipo_etapa;
            if (tipoEtapa) {
                etapasPorTipo[tipoEtapa] = etapa;
            }
        });
        
        console.log('📊 Etapas organizadas por tipo:', etapasPorTipo);
        
        const columns = etapas.map(etapa => {
            // Buscar dados reais da etapa executada baseado no tipo
            let etapaData = {
                data_inicio: null,
                hora_inicio: null,
                data_fim: null,
                hora_fim: null
            };
            
            // Mapear fase para tipo de etapa
            const tipoEtapaMap = {
                'Research': 'RI',
                'Development': 'D', 
                'Engineering': 'E',
                'Construction': 'C',
                'Assembly': 'A'
            };
            
            const tipoEtapa = tipoEtapaMap[etapa.fase];
            if (tipoEtapa && etapasPorTipo[tipoEtapa]) {
                const etapaExecutada = etapasPorTipo[tipoEtapa];
                etapaData = {
                    data_inicio: etapaExecutada.data_inicio,
                    hora_inicio: etapaExecutada.hora_inicio,
                    data_fim: etapaExecutada.data_fim,
                    hora_fim: etapaExecutada.hora_fim
                };
                console.log(`✅ Dados encontrados para ${etapa.fase}:`, etapaData);
            } else {
                console.log(`⚠️ Nenhum dado encontrado para ${etapa.fase} (${tipoEtapa})`);
            }
            
            // Determinar se deve mostrar botão de concluir para esta etapa
            let botaoConcluir = '';
            if (botaoInfo.mostrar && botaoInfo.etapa === etapa.sigla) {
                botaoConcluir = `
                    <div class="stage-actions" style="margin-top: 10px;">
                        <button class="btn-stage btn-complete" onclick="window.ridecOccurrences.concluirEtapaCard(${occurrence.id}, '${etapa.fase}')">
                            <i class="fas fa-check"></i>
                            Concluir
                        </button>
                    </div>
                `;
            } else if (botaoInfo.concluido && etapa.sigla === 'C') {
                botaoConcluir = `
                    <div class="stage-status completed" style="margin-top: 10px; text-align: center;">
                        <i class="fas fa-check-circle"></i>
                        <div>Concluído</div>
                    </div>
                `;
            }
            
            return `
                <div class="stage-column">
                    <div class="stage-header">
                        <div class="stage-sigla" title="${etapa.sigla}">${etapa.fase}</div>
                    </div>
                    <div class="stage-datetime">
                        <div class="datetime-row">
                            <div class="datetime-label">Início</div>
                            <div class="datetime-value">
                                <div class="date">${this.formatDateDDMMYYYY(etapaData.data_inicio)}</div>
                                <div class="time">${etapaData.hora_inicio || '-'}</div>
                            </div>
                        </div>
                        <div class="datetime-row">
                            <div class="datetime-label">Fim</div>
                            <div class="datetime-value">
                                <div class="date">${this.formatDateDDMMYYYY(etapaData.data_fim)}</div>
                                <div class="time">${etapaData.hora_fim || '-'}</div>
                            </div>
                        </div>
                    </div>
                    ${botaoConcluir}
                </div>
            `;
        });

        return `
            <div class="stages-table-content">
                ${columns.join('')}
            </div>
        `;
    }

    // Nova função para criar colunas das etapas usando a nova estrutura
    createStagesColumnsNew(occurrence) {
        const etapas = occurrence.etapas || [];
        console.log('🔄 createStagesColumnsNew chamada com etapas:', etapas.length);
        console.log('📊 Detalhes das etapas:', etapas.map(e => ({
            fase: e.fase,
            sigla: e.sigla,
            data_inicio: e.data_inicio,
            hora_inicio: e.hora_inicio,
            data_fim: e.data_fim,
            hora_fim: e.hora_fim
        })));
        
        const columnsHtml = etapas.map((etapa, index) => {
            // Determinar status da etapa
            let status = 'pending';
            let botaoConcluir = '';
            
            if (etapa.data_fim && etapa.hora_fim) {
                status = 'completed';
                botaoConcluir = `
                    <div class="stage-status completed" style="margin-top: 10px; text-align: center;">
                        <i class="fas fa-check-circle"></i>
                        <div>Concluído</div>
                    </div>
                `;
            } else if (etapa.data_inicio && etapa.hora_inicio) {
                status = 'active';
                botaoConcluir = `
                    <div class="stage-actions" style="margin-top: 10px;">
                        <button class="btn-stage btn-complete" onclick="window.ridecOccurrences.completeStage(${occurrence.id}, ${index})">
                            <i class="fas fa-check"></i>
                            Concluir
                        </button>
                    </div>
                `;
            } else {
                status = 'pending';
                botaoConcluir = `
                    <div class="stage-actions" style="margin-top: 10px;">
                        <button class="btn-stage btn-start" onclick="window.ridecOccurrences.startStage(${occurrence.id}, ${index})">
                            <i class="fas fa-play"></i>
                            Iniciar
                        </button>
                    </div>
                `;
            }
            
            // Obter nome e sigla do tipo de etapa
            const nomeEtapa = etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa';
            const siglaEtapa = this.getSiglaFromTipoEtapa(nomeEtapa);
            
            // Verificar se a etapa está concluída para exibir tempo_diferenca e uom
            const isCompleted = etapa.data_fim && etapa.hora_fim;
            const tempoDiferenca = etapa.tempo_diferenca || 0;
            const uomDesc = etapa.uom?.desc_uom || 'h';
            const valorUom = etapa.valor_uom || 0;
            
            // Verificar se o tempo excedeu o planejado
            const tempoExcedido = tempoDiferenca > valorUom;
            const tempoInfoClass = tempoExcedido ? 'stage-tempo-info tempo-excedido' : 'stage-tempo-info';
            
            // Criar seção de tempo_diferenca e uom para etapas concluídas
            let tempoInfoHtml = '';
            if (isCompleted && tempoDiferenca > 0) {
                tempoInfoHtml = `
                    <div class="${tempoInfoClass}">
                        <div class="tempo-diferenca">
                            <div class="tempo-value">${tempoDiferenca}</div>
                            <div class="tempo-unit">${uomDesc}</div>
                        </div>
                        <div class="tempo-planned">
                            <div class="tempo-label">Planejado:</div>
                            <div class="tempo-planned-value">${valorUom} ${uomDesc}</div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="stage-column">
                    <div class="stage-header">
                        <div class="stage-sigla" title="${siglaEtapa}">${nomeEtapa}</div>
                        ${tempoInfoHtml}
                    </div>
                    <div class="stage-datetime">
                        <div class="datetime-row">
                            <div class="datetime-label">Início</div>
                            <div class="datetime-value">
                                <div class="date">${this.formatDateDDMMYYYY(etapa.data_inicio)}</div>
                                <div class="time">${etapa.hora_inicio || '-'}</div>
                            </div>
                        </div>
                        <div class="datetime-row">
                            <div class="datetime-label">Fim</div>
                            <div class="datetime-value">
                                <div class="date">${this.formatDateDDMMYYYY(etapa.data_fim)}</div>
                                <div class="time">${etapa.hora_fim || '-'}</div>
                            </div>
                        </div>
                    </div>
                    ${botaoConcluir}
                </div>
            `;
        }).join('');

        return `
            <div class="stages-table-scroll">
                <div class="stages-table-content">
                    ${columnsHtml}
                </div>
            </div>
        `;
    }

    // Função auxiliar para obter sigla do tipo de etapa
    getSiglaFromTipoEtapa(nomeTipoEtapa) {
        const mapeamento = {
            'Research': 'RI',
            'Development': 'D',
            'Engineering': 'E',
            'Construction': 'C',
            'Assembly': 'A'
        };
        
        // Tentar encontrar correspondência exata
        for (const [tipo, sigla] of Object.entries(mapeamento)) {
            if (nomeTipoEtapa.toLowerCase().includes(tipo.toLowerCase())) {
                return sigla;
            }
        }
        
        // Se não encontrar, retornar primeira letra
        return nomeTipoEtapa.charAt(0).toUpperCase();
    }

    // Obter dados da etapa para uma ocorrência específica
    async getStageDataForOccurrence(occurrence, etapa) {
        console.log(`🔍 Buscando dados da etapa ${etapa.sigla} para card ${occurrence.id}`);
        
        try {
            // Primeiro, buscar o código da etapa específica na tabela card_ridec
            const { data: cardData, error: cardError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('cod_etapa_ri, cod_etapa_d, cod_etapa_e, cod_etapa_c')
                .eq('cod_card_ridec', occurrence.id)
                .single();

            if (cardError || !cardData) {
                console.log(`⚠️ Erro ao buscar card ${occurrence.id}:`, cardError);
                return {
                    data_inicio: null,
                    hora_inicio: null,
                    data_fim: null,
                    hora_fim: null
                };
            }

            // Obter o código da etapa específica baseado na fase
            let codEtapa = null;
            switch (etapa.fase) {
                case 'Research':
                    codEtapa = cardData.cod_etapa_ri;
                    break;
                case 'Development':
                    codEtapa = cardData.cod_etapa_d;
                    break;
                case 'Engineering':
                    codEtapa = cardData.cod_etapa_e;
                    break;
                case 'Construction':
                    codEtapa = cardData.cod_etapa_c;
                    break;
                default:
                    console.log(`⚠️ Fase não reconhecida: ${etapa.fase}`);
                    return {
                        data_inicio: null,
                        hora_inicio: null,
                        data_fim: null,
                        hora_fim: null
                    };
            }

            // Se não há código da etapa, a etapa não foi iniciada
            if (!codEtapa) {
                console.log(`⚠️ Etapa ${etapa.sigla} não foi iniciada para card ${occurrence.id}`);
                return {
                    data_inicio: null,
                    hora_inicio: null,
                    data_fim: null,
                    hora_fim: null
                };
            }

            // Buscar dados da tabela específica da etapa
            const tabelaEtapaCard = this.getTabelaEtapaCard(etapa.fase);
            console.log(`📋 Buscando na tabela: ${tabelaEtapaCard} com cod_etapa: ${codEtapa}`);
            
            if (tabelaEtapaCard) {
                // Buscar dados da etapa específica usando o código da etapa
                const { data, error } = await window.supabaseDB.getClient()
                    .from(tabelaEtapaCard)
                    .select('data_inicio, hora_inicio, data_fim, hora_fim')
                    .eq(`cod_${tabelaEtapaCard}`, codEtapa)
                    .single();
                
                if (error) {
                    console.log(`⚠️ Erro ao buscar dados da etapa ${etapa.sigla}:`, error.message);
                    console.log(`📋 Detalhes do erro:`, {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    
                    // Se a tabela não existe, retornar dados vazios
                    if (error.code === '42P01' || error.message.includes('does not exist')) {
                        console.log(`⚠️ Tabela ${tabelaEtapaCard} não existe, retornando dados vazios`);
                        return {
                            data_inicio: null,
                            hora_inicio: null,
                            data_fim: null,
                            hora_fim: null
                        };
                    }
                } else if (data) {
                    console.log(`✅ Dados da etapa ${etapa.sigla} encontrados:`, data);
                    return {
                        data_inicio: data.data_inicio,
                        hora_inicio: data.hora_inicio,
                        data_fim: data.data_fim,
                        hora_fim: data.hora_fim
                    };
                } else {
                    console.log(`⚠️ Nenhum dado encontrado para etapa ${etapa.sigla} na tabela ${tabelaEtapaCard}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ Erro ao buscar dados da etapa ${etapa.sigla}:`, error);
        }
        
        // Retornar dados vazios se não encontrar
        console.log(`⚠️ Nenhum dado encontrado para etapa ${etapa.sigla}`);
        return {
            data_inicio: null,
            hora_inicio: null,
            data_fim: null,
            hora_fim: null
        };
    }
    
    // Obter nome da tabela de etapa de card baseado na fase
    getTabelaEtapaCard(fase) {
        const tabelas = {
            'Research': 'etapa_ridec',
            'Development': 'etapa_ridec', 
            'Engineering': 'etapa_ridec',
            'Construction': 'etapa_ridec',
            'Assembly': 'etapa_ridec'
        };
        return tabelas[fase] || null;
    }

    // ===== NOVAS FUNÇÕES PARA ESTRUTURA ATUALIZADA =====

    // Obter tipos de etapa da tabela tipo_etapa
    async getTipoEtapas() {
        try {
            const { data, error } = await window.supabaseDB.getClient()
                .from('tipo_etapa')
                .select('*')
                .order('cod_tipo_etapa');

            if (error) {
                console.error('❌ Erro ao buscar tipos de etapa:', error);
                return [];
            }

            console.log('📋 Tipos de etapa carregados:', data.length);
            return data;
        } catch (error) {
            console.error('❌ Erro ao buscar tipos de etapa:', error);
            return [];
        }
    }

    // Obter etapas de um card específico da tabela etapa_ridec
    async getEtapasCard(codCardRidec) {
        try {
            console.log(`🔍 getEtapasCard: Buscando etapas para card ${codCardRidec}`);
            
            // Primeiro, buscar o cod_modelo_ridec do card
            const { data: cardData, error: cardError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('cod_modelo_ridec')
                .eq('cod_card_ridec', codCardRidec)
                .single();

            if (cardError) {
                console.error('❌ Erro ao buscar card:', cardError);
                return [];
            }

            if (!cardData || !cardData.cod_modelo_ridec) {
                console.error('❌ Card não encontrado ou sem cod_modelo_ridec');
                return [];
            }

            const codModeloRidec = cardData.cod_modelo_ridec;
            console.log(`📋 Cod_modelo_ridec encontrado: ${codModeloRidec}`);

            // Buscar etapas da tabela etapa_ridec
            const { data, error } = await window.supabaseDB.getClient()
                .from('etapa_ridec')
                .select(`
                    *,
                    tipo_etapa:tipo_etapa(
                        cod_tipo_etapa,
                        nome_tipo_etapa
                    )
                `)
                .eq('cod_card_ridec', codCardRidec)
                .order('cod_etapa_ridec');

            if (error) {
                console.error('❌ Erro ao buscar etapas do card:', error);
                return [];
            }

            console.log('📋 Etapas do card carregadas:', data.length);
            console.log('📊 Dados das etapas:', data);

            // Para cada etapa, buscar dados de UOM do modelo correspondente
            const etapasComUom = await Promise.all(data.map(async (etapa) => {
                try {
                    // Buscar UOM do modelo_etapa_ridec correspondente usando o cod_modelo_ridec do card
                    const { data: modeloEtapa, error: modeloError } = await window.supabaseDB.getClient()
                        .from('modelo_etapa_ridec')
                        .select(`
                            cod_uom,
                            valor_uom,
                            uom:cod_uom(
                                desc_uom
                            )
                        `)
                        .eq('cod_modelo_ridec', codModeloRidec)
                        .eq('cod_tipo_etapa', etapa.cod_tipo_etapa)
                        .single();

                    if (modeloError) {
                        console.warn(`⚠️ Erro ao buscar UOM para etapa ${etapa.cod_etapa_ridec}:`, modeloError);
                        return {
                            ...etapa,
                            uom: null,
                            valor_uom: null
                        };
                    }

                    return {
                        ...etapa,
                        uom: modeloEtapa?.uom || null,
                        valor_uom: modeloEtapa?.valor_uom || null
                    };
                } catch (error) {
                    console.warn(`⚠️ Erro ao buscar UOM para etapa ${etapa.cod_etapa_ridec}:`, error);
                    return {
                        ...etapa,
                        uom: null,
                        valor_uom: null
                    };
                }
            }));

            console.log('📊 Etapas com UOM carregadas:', etapasComUom);
            return etapasComUom;
        } catch (error) {
            console.error('❌ Erro ao buscar etapas do card:', error);
            return [];
        }
    }

    // Obter próxima etapa do modelo baseado na etapa atual
    async getProximaEtapaModelo(codModeloRidec, codTipoEtapaAtual) {
        try {
            console.log(`🔍 [DEBUG] getProximaEtapaModelo: Buscando próxima etapa para modelo ${codModeloRidec}, etapa atual ${codTipoEtapaAtual}`);
            console.log(`🔍 [DEBUG] Verificando se Supabase está disponível:`, !!window.supabaseDB);
            
            if (!window.supabaseDB) {
                console.error('❌ [DEBUG] Supabase não está disponível');
                return null;
            }
            
            // Buscar todas as etapas do modelo ordenadas por cod_modelo_etapa
            const { data: etapasModelo, error: errorModelo } = await window.supabaseDB.getClient()
                .from('modelo_etapa_ridec')
                .select(`
                    cod_modelo_etapa,
                    cod_tipo_etapa,
                    cod_m_etapa_anterior,
                    desc_etapa_modelo,
                    tipo_etapa:tipo_etapa(
                        cod_tipo_etapa,
                        nome_tipo_etapa
                    )
                `)
                .eq('cod_modelo_ridec', codModeloRidec)
                .order('cod_modelo_etapa');

            console.log(`🔍 [DEBUG] Resultado da busca de etapas do modelo:`, { etapasModelo, errorModelo });

            if (errorModelo) {
                console.error('❌ [DEBUG] Erro ao buscar etapas do modelo:', errorModelo);
                console.error('❌ [DEBUG] Detalhes do erro:', {
                    message: errorModelo.message,
                    details: errorModelo.details,
                    hint: errorModelo.hint,
                    code: errorModelo.code
                });
                return null;
            }

            console.log('📋 [DEBUG] Etapas do modelo encontradas:', etapasModelo?.length || 0);
            console.log('📊 [DEBUG] Dados das etapas:', etapasModelo);
            console.log(`🔍 [DEBUG] Buscando etapa atual com cod_tipo_etapa: ${codTipoEtapaAtual} (tipo: ${typeof codTipoEtapaAtual})`);

            // Encontrar a etapa atual - converter para número se necessário
            const codTipoEtapaAtualNum = parseInt(codTipoEtapaAtual);
            console.log(`🔍 [DEBUG] Cod_tipo_etapa convertido para número: ${codTipoEtapaAtualNum}`);
            
            const etapaAtual = etapasModelo.find(etapa => etapa.cod_tipo_etapa === codTipoEtapaAtualNum);
            if (!etapaAtual) {
                console.log('⚠️ [DEBUG] Etapa atual não encontrada no modelo');
                console.log('📊 [DEBUG] Tipos de etapa disponíveis:', etapasModelo?.map(e => `${e.cod_tipo_etapa} (${typeof e.cod_tipo_etapa})`) || 'Nenhuma etapa encontrada');
                return null;
            }

            console.log('🔍 [DEBUG] Etapa atual encontrada:', etapaAtual);
            console.log(`🔍 [DEBUG] Cod_modelo_etapa da etapa atual: ${etapaAtual.cod_modelo_etapa}`);

            // Encontrar a próxima etapa (que tem cod_m_etapa_anterior = cod_modelo_etapa da etapa atual)
            const proximaEtapa = etapasModelo.find(etapa => 
                etapa.cod_m_etapa_anterior === etapaAtual.cod_modelo_etapa
            );

            console.log(`🔍 [DEBUG] Buscando próxima etapa onde cod_m_etapa_anterior = ${etapaAtual.cod_modelo_etapa}`);
            console.log(`🔍 [DEBUG] Próxima etapa encontrada:`, proximaEtapa);

            if (!proximaEtapa) {
                console.log('ℹ️ [DEBUG] Esta é a última etapa do modelo - não há próxima etapa');
                return null;
            }

            console.log('✅ [DEBUG] Próxima etapa encontrada:', proximaEtapa);
            return proximaEtapa;
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao buscar próxima etapa do modelo:', error);
            return null;
        }
    }

    // Criar nova etapa executada na tabela etapa_ridec
    async criarNovaEtapaExecutada(codCardRidec, codTipoEtapa, codEtapaAnterior) {
        try {
            console.log(`🔍 criarNovaEtapaExecutada: Criando nova etapa ${codTipoEtapa} para card ${codCardRidec}`);
            
            const agora = new Date();
            const dataInicio = agora.toISOString().split('T')[0];
            const horaInicio = agora.toTimeString().split(' ')[0];

            const { data, error } = await window.supabaseDB.getClient()
                .from('etapa_ridec')
                .insert({
                    cod_card_ridec: codCardRidec,
                    cod_tipo_etapa: codTipoEtapa,
                    cod_etapa_anterior: codEtapaAnterior,
                    data_inicio: dataInicio,
                    hora_inicio: horaInicio,
                    data_fim: null,
                    hora_fim: null
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Erro ao criar nova etapa executada:', error);
                return null;
            }

            console.log('✅ Nova etapa executada criada:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro ao criar nova etapa executada:', error);
            return null;
        }
    }

    // Obter etapas de modelo da tabela modelo_etapa_ridec
    async getEtapasModelo(codModeloRidec) {
        try {
            const { data, error } = await window.supabaseDB.getClient()
                .from('modelo_etapa_ridec')
                .select(`
                    *,
                    tipo_etapa:tipo_etapa(
                        cod_tipo_etapa,
                        nome_tipo_etapa
                    ),
                    etapa_anterior:modelo_etapa_ridec!cod_m_etapa_anterior(
                        cod_modelo_etapa,
                        cod_tipo_etapa
                    )
                `)
                .eq('cod_modelo_ridec', codModeloRidec)
                .order('cod_modelo_etapa');

            if (error) {
                console.error('❌ Erro ao buscar etapas do modelo:', error);
                return [];
            }

            console.log('📋 Etapas do modelo carregadas:', data.length);
            return data;
        } catch (error) {
            console.error('❌ Erro ao buscar etapas do modelo:', error);
            return [];
        }
    }

    // Determinar status do card usando nova estrutura de etapas
    determineCardStatusNew(card, etapas) {
        if (!etapas || etapas.length === 0) {
            return 'pending';
        }

        // Verificar se todas as etapas estão concluídas
        const todasConcluidas = etapas.every(etapa => etapa.data_fim && etapa.hora_fim);
        if (todasConcluidas) {
            return 'completed';
        }

        // Verificar se há pelo menos uma etapa em andamento
        const emAndamento = etapas.some(etapa => etapa.data_inicio && etapa.hora_inicio && !etapa.data_fim);
        if (emAndamento) {
            return 'active';
        }

        // Verificar se há etapas atrasadas
        const hoje = new Date();
        const temAtraso = etapas.some(etapa => {
            if (etapa.data_inicio && !etapa.data_fim) {
                const dataInicio = new Date(etapa.data_inicio);
                const diasDecorridos = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
                return diasDecorridos > 7; // Considerar atrasado se passar de 7 dias
            }
            return false;
        });

        if (temAtraso) {
            return 'overdue';
        }

        return 'pending';
    }

    // Calcular progresso do card usando nova estrutura de etapas
    calculateCardProgressNew(etapas) {
        if (!etapas || etapas.length === 0) {
            return 0;
        }

        const etapasConcluidas = etapas.filter(etapa => etapa.data_fim && etapa.hora_fim).length;
        return Math.round((etapasConcluidas / etapas.length) * 100);
    }

    // Obter prefixo da etapa para campos na tabela card_ridec
    getEtapaPrefix(fase) {
        const prefixos = {
            'Research': 'ri',
            'Development': 'd',
            'Engineering': 'e',
            'Construction': 'c',
            'Assembly': 'a'
        };
        return prefixos[fase] || fase.toLowerCase();
    }
    

    // Configurar event listeners dos cards
    setupCardEventListeners() {
        // Event listeners já estão nos botões via onclick
    }

    // Função global para controlar expander de ocorrências
    toggleOccurrenceExpander(occurrenceId) {
        const content = document.getElementById(occurrenceId);
        const icon = document.getElementById(`icon-${occurrenceId}`);
        const expander = content.closest('.occurrence-expander');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
            expander.classList.add('expanded');
        } else {
            content.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
            expander.classList.remove('expanded');
        }
    }

    // Atualizar estatísticas
    updateStats() {
        const total = this.filteredOccurrences.length;
        const active = this.filteredOccurrences.filter(o => o.status === 'active').length;
        const overdue = this.filteredOccurrences.filter(o => o.status === 'overdue').length;
        const pending = this.filteredOccurrences.filter(o => o.status === 'pending').length;

        // Header stats
        document.getElementById('totalOccurrences').textContent = total;
        document.getElementById('activeOccurrences').textContent = active;
        document.getElementById('overdueOccurrences').textContent = overdue;

        // Summary stats
        document.getElementById('summaryActive').textContent = active;
        document.getElementById('summaryOverdue').textContent = overdue;
        document.getElementById('summaryPending').textContent = pending;
    }

    // Utilitários
    getStatusClass(status) {
        const classes = {
            'active': 'active',
            'completed': 'completed',
            'overdue': 'overdue',
            'pending': 'pending'
        };
        return classes[status] || 'pending';
    }

    getStatusText(status) {
        const texts = {
            'active': 'Ativa',
            'completed': 'Concluída',
            'overdue': 'Atrasada',
            'pending': 'Pendente'
        };
        return texts[status] || 'Pendente';
    }

    getStageIcon(status) {
        const icons = {
            'completed': 'fas fa-check',
            'active': 'fas fa-play',
            'pending': 'fas fa-clock',
            'overdue': 'fas fa-exclamation'
        };
        return icons[status] || 'fas fa-clock';
    }

    getStageClass(status) {
        const classes = {
            'completed': 'complete',
            'active': 'progress',
            'pending': 'start',
            'overdue': 'overdue'
        };
        return classes[status] || 'start';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Formatar data no formato dd-MM-yyyy
    formatDateDDMMYYYY(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
    }

    // Obter código do tipo de etapa baseado na fase
    getCodTipoEtapaFromFase(fase) {
        const faseMap = {
            'Research': 1,
            'Development': 2,
            'Engineering': 3,
            'Construction': 4,
            'Assembly': 5
        };
        return faseMap[fase] || 1;
    }

    // Calcular diferença de tempo entre início e fim baseada na UOM
    async calcularTempoDiferenca(codCardRidec, codTipoEtapa, dataInicio, horaInicio, dataFim, horaFim) {
        try {
            console.log(`⏱️ Calculando tempo diferenca para card ${codCardRidec}, tipo ${codTipoEtapa}`);
            
            // Primeiro, buscar o modelo do card para obter o cod_modelo_ridec
            const { data: cardData, error: cardError } = await window.supabaseDB.getClient()
                .from('card_ridec')
                .select('cod_modelo_ridec')
                .eq('cod_card_ridec', codCardRidec)
                .single();

            if (cardError || !cardData) {
                console.error('❌ Erro ao buscar modelo do card:', cardError);
                return 0;
            }

            // Buscar UOM do modelo_etapa_ridec usando o cod_modelo_ridec do card
            const { data: modeloEtapa, error: modeloError } = await window.supabaseDB.getClient()
                .from('modelo_etapa_ridec')
                .select(`
                    cod_uom,
                    uom:cod_uom (
                        desc_uom
                    )
                `)
                .eq('cod_modelo_ridec', cardData.cod_modelo_ridec)
                .eq('cod_tipo_etapa', codTipoEtapa)
                .single();

            if (modeloError || !modeloEtapa) {
                console.warn('⚠️ UOM não encontrada para o modelo, usando horas como padrão');
                console.log(`🔍 Tentando buscar: cod_modelo_ridec=${cardData.cod_modelo_ridec}, cod_tipo_etapa=${codTipoEtapa}`);
                
                // Usar horas como padrão se não encontrar UOM
                const diferencaMs = new Date(`${dataFim}T${horaFim}`).getTime() - new Date(`${dataInicio}T${horaInicio}`).getTime();
                if (diferencaMs < 0) {
                    console.warn('⚠️ Data de fim anterior à data de início');
                    return 0;
                }
                
                const tempoDiferenca = diferencaMs / (1000 * 60 * 60); // Converter para horas
                console.log(`✅ Tempo calculado (padrão): ${tempoDiferenca.toFixed(2)} horas`);
                return parseFloat(tempoDiferenca.toFixed(2));
            }

            console.log(`📊 UOM encontrada:`, modeloEtapa.uom);

            // Calcular diferença em milissegundos
            const inicioDateTime = new Date(`${dataInicio}T${horaInicio}`);
            const fimDateTime = new Date(`${dataFim}T${horaFim}`);
            const diferencaMs = fimDateTime.getTime() - inicioDateTime.getTime();

            if (diferencaMs < 0) {
                console.warn('⚠️ Data de fim anterior à data de início');
                return 0;
            }

            // Converter baseado na UOM
            const uomDesc = modeloEtapa.uom?.desc_uom?.toLowerCase() || 'horas';

            let tempoDiferenca = 0;

            switch (uomDesc) {
                case 'segundos':
                case 's':
                    tempoDiferenca = diferencaMs / 1000;
                    break;
                case 'minutos':
                case 'min':
                case 'm':
                    tempoDiferenca = diferencaMs / (1000 * 60);
                    break;
                case 'horas':
                case 'h':
                case 'hr':
                    tempoDiferenca = diferencaMs / (1000 * 60 * 60);
                    break;
                case 'dias':
                case 'd':
                    tempoDiferenca = diferencaMs / (1000 * 60 * 60 * 24);
                    break;
                default:
                    // Assumir horas como padrão
                    tempoDiferenca = diferencaMs / (1000 * 60 * 60);
                    console.warn(`⚠️ UOM '${uomDesc}' não reconhecida, usando horas como padrão`);
            }

            console.log(`✅ Tempo calculado: ${tempoDiferenca.toFixed(2)} ${uomDesc}`);
            return parseFloat(tempoDiferenca.toFixed(2));

        } catch (error) {
            console.error('❌ Erro ao calcular tempo diferenca:', error);
            return 0;
        }
    }

    // Ações dos cards
    viewOccurrence(id) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === id);
        if (occurrence) {
            this.showOccurrenceDetails(occurrence);
        }
    }

    editOccurrence(id) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === id);
        if (occurrence) {
            this.showEditOccurrenceModal(occurrence);
        }
    }

    deleteOccurrence(id) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === id);
        if (occurrence) {
            if (confirm(`Tem certeza que deseja excluir a ocorrência "${occurrence.title}"?`)) {
                this.occurrences = this.occurrences.filter(o => o.id !== id);
                this.applyFilters();
                this.showNotification('Ocorrência excluída com sucesso!', 'success');
            }
        }
    }

    // Modal de detalhes da ocorrência
    showOccurrenceDetails(occurrence) {
        // Verificar se já existe um modal aberto
        const existingModal = document.querySelector('.modal.modern-modal');
        if (existingModal) {
            console.log('⚠️ Modal já está aberto, não criando novo');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal modern-modal';
        modal.innerHTML = `
            <div class="modal-content modern-modal-content">
                <div class="modal-header modern-header">
                    <div class="modal-title-section">
                        <div class="modal-icon">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <div class="modal-title-content">
                            <h2>${occurrence.title}</h2>
                            <p class="modal-subtitle">Detalhes da Ocorrência</p>
                        </div>
                    </div>
                    <span class="close modern-close">&times;</span>
                </div>
                <div class="modal-body modern-body">
                    <div style="padding: 30px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <div>
                                <h4 style="margin-bottom: 10px; color: #1e293b;">Informações Gerais</h4>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
                                    <p><strong>Modelo:</strong> ${occurrence.modelName}</p>
                                    <p><strong>Área:</strong> ${occurrence.areaName}</p>
                                    <p><strong>Responsável:</strong> ${occurrence.responsible}</p>
                                    <p><strong>Prioridade:</strong> ${occurrence.priority}</p>
                                    <p><strong>Status:</strong> ${this.getStatusText(occurrence.status)}</p>
                                    <p><strong>Criado em:</strong> ${this.formatDateDDMMYYYY(occurrence.createdAt)}</p>
                                    <p><strong>Prazo:</strong> ${this.formatDateDDMMYYYY(occurrence.deadline)}</p>
                                </div>
                            </div>
                            <div>
                                <h4 style="margin-bottom: 10px; color: #1e293b;">Progresso</h4>
                                <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
                                    <div style="margin-bottom: 15px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span>Progresso Geral</span>
                                            <span>${occurrence.progress}%</span>
                                        </div>
                                        <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                                            <div style="width: ${occurrence.progress}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
                                        </div>
                                    </div>
                                    <p><strong>Descrição:</strong></p>
                                    <p style="color: #64748b; line-height: 1.5;">${occurrence.description}</p>
                                </div>
                            </div>
                        </div>
                        
                        <h4 style="margin-bottom: 15px; color: #1e293b;">Etapas do Processo</h4>
                        <div style="display: grid; gap: 10px;">
                            ${occurrence.stages.map(stage => `
                                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8fafc; border-radius: 10px;">
                                    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${this.getStageColor(stage.status)}; display: flex; align-items: center; justify-content: center; color: white;">
                                        <i class="${this.getStageIcon(stage.status)}"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #1e293b;">${stage.name}</div>
                                        <div style="font-size: 0.9rem; color: #64748b;">${stage.time}</div>
                                    </div>
                                    <span style="padding: 4px 8px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; background: ${this.getStatusBadgeColor(stage.status)}; color: ${this.getStatusBadgeTextColor(stage.status)};">
                                        ${this.getStatusText(stage.status)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Utilitários para cores
    getStageColor(status) {
        const colors = {
            'completed': '#10b981',
            'active': '#f59e0b',
            'pending': '#6b7280',
            'overdue': '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    getStatusBadgeColor(status) {
        const colors = {
            'completed': '#dcfce7',
            'active': '#fef3c7',
            'pending': '#f1f5f9',
            'overdue': '#fef2f2'
        };
        return colors[status] || '#f1f5f9';
    }

    getStatusBadgeTextColor(status) {
        const colors = {
            'completed': '#166534',
            'active': '#d97706',
            'pending': '#475569',
            'overdue': '#dc2626'
        };
        return colors[status] || '#475569';
    }

    // Modal de criação de ocorrência
    showCreateOccurrenceModal() {
        // Verificar se já existe um modal aberto
        const existingModal = document.querySelector('.modal.modern-modal');
        if (existingModal) {
            console.log('⚠️ Modal já está aberto, não criando novo');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal modern-modal';
        modal.innerHTML = `
            <div class="modal-content modern-modal-content" style="max-width: 900px;">
                <div class="modal-header modern-header">
                    <div class="modal-title-section">
                        <div class="modal-icon">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div class="modal-title-content">
                            <h2>Novo Card</h2>
                            <p class="modal-subtitle">Criar uma novo card baseado em um modelo RIDEC</p>
                        </div>
                    </div>
                    <span class="close modern-close">&times;</span>
                </div>
                <div class="modal-body modern-body">
                    <form id="createOccurrenceForm" style="padding: 30px;">                        

                        <div class="form-group" style="margin-bottom: 25px;">
                            <label for="occurrenceArea" class="form-label">Área Responsável *</label>
                            <select id="occurrenceArea" class="form-select" required>
                                <option value="">Selecione a área responsável</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 25px;">
                            <label for="occurrenceModel" class="form-label">Modelo RIDEC *</label>
                            <select id="occurrenceModel" class="form-select" required disabled>
                                <option value="">Primeiro selecione uma área</option>
                            </select>
                        </div>

                        <div class="input-wrapper">
                            <input type="text" id="externalId" class="modern-input" placeholder="Digite o ID externo da ocorrência" required>
                            <div class="input-icon">
                                <i class="fas fa-check-circle valid-icon"></i>
                                <i class="fas fa-exclamation-circle error-icon"></i>
                            </div>
                        </div>

                        <!-- Expander para informações do modelo selecionado -->
                        <div class="expander-container" style="margin-bottom: 30px;">
                            <div class="expander-header" id="modelInfoExpanderHeader">
                                <div class="expander-title">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Informações do Modelo</span>
                                </div>
                                <div class="expander-toggle">
                                    <i class="fas fa-chevron-down expander-icon"></i>
                                </div>
                            </div>
                            
                            <div class="expander-content" id="modelInfoExpanderContent">
                                <div class="info-display">
                                    <div class="info-item">
                                        <span class="info-label">Modelo RIDEC:</span>
                                        <span id="selectedModelTitle" class="info-value">-</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Área:</span>
                                        <span id="selectedModelArea" class="info-value">-</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Descrição:</span>
                                        <span id="selectedModelDescription" class="info-value">-</span>
                                    </div>
                                    
                                    <!-- Seção de Etapas RIDEC -->
                                    <div class="stages-info-section">
                                        <h4 class="stages-info-title">
                                            <i class="fas fa-list-ol"></i> Etapas do Modelo
                                        </h4>
                                        
                                        <!-- Etapa RI -->
                                        <div class="stage-info-card" data-stage="RI">
                                            <div class="stage-header">
                                                <div class="stage-icon ri-icon">
                                                    <i class="fas fa-play"></i>
                                                </div>
                                                <div class="stage-title">Requisitos e Início (RI)</div>
                                            </div>
                                            <div class="stage-details">
                                                <div class="stage-description">
                                                    <span class="stage-desc-label">Descrição:</span>
                                                    <span id="stageRIDescription" class="stage-desc-value">-</span>
                                                </div>
                                                <div class="stage-time">
                                                    <span class="stage-time-label">Tempo:</span>
                                                    <span id="stageRITime" class="stage-time-value">-</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Etapa D -->
                                        <div class="stage-info-card" data-stage="D">
                                            <div class="stage-header">
                                                <div class="stage-icon d-icon">
                                                    <i class="fas fa-cogs"></i>
                                                </div>
                                                <div class="stage-title">Desenvolvimento (D)</div>
                                            </div>
                                            <div class="stage-details">
                                                <div class="stage-description">
                                                    <span class="stage-desc-label">Descrição:</span>
                                                    <span id="stageDDescription" class="stage-desc-value">-</span>
                                                </div>
                                                <div class="stage-time">
                                                    <span class="stage-time-label">Tempo:</span>
                                                    <span id="stageDTime" class="stage-time-value">-</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Etapa E -->
                                        <div class="stage-info-card" data-stage="E">
                                            <div class="stage-header">
                                                <div class="stage-icon e-icon">
                                                    <i class="fas fa-vial"></i>
                                                </div>
                                                <div class="stage-title">Execução e Testes (E)</div>
                                            </div>
                                            <div class="stage-details">
                                                <div class="stage-description">
                                                    <span class="stage-desc-label">Descrição:</span>
                                                    <span id="stageEDescription" class="stage-desc-value">-</span>
                                                </div>
                                                <div class="stage-time">
                                                    <span class="stage-time-label">Tempo:</span>
                                                    <span id="stageETime" class="stage-time-value">-</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Etapa C -->
                                        <div class="stage-info-card" data-stage="C">
                                            <div class="stage-header">
                                                <div class="stage-icon c-icon">
                                                    <i class="fas fa-check-double"></i>
                                                </div>
                                                <div class="stage-title">Conclusão (C)</div>
                                            </div>
                                            <div class="stage-details">
                                                <div class="stage-description">
                                                    <span class="stage-desc-label">Descrição:</span>
                                                    <span id="stageCDescription" class="stage-desc-value">-</span>
                                                </div>
                                                <div class="stage-time">
                                                    <span class="stage-time-label">Tempo:</span>
                                                    <span id="stageCTime" class="stage-time-value">-</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions" style="display: flex; gap: 15px; justify-content: flex-end;">
                            <button type="button" class="btn btn-secondary" id="cancelCreateOccurrence">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary" id="saveCreateOccurrence">
                                <i class="fas fa-check"></i>
                                Concluir
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Aguardar um pouco para garantir que o DOM foi atualizado
        setTimeout(() => {
            // Carregar dados nos selects
            this.loadCreateOccurrenceData();
        }, 100);

        // Event listeners
        this.setupCreateOccurrenceEventListeners(modal);

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Carregar dados para o modal de criação
    async loadCreateOccurrenceData() {
        try {
            // Carregar áreas da empresa do usuário
            await this.loadAreasForCompany();

            // Definir data padrão (7 dias a partir de hoje)
            const deadlineInput = document.getElementById('occurrenceDeadline');
            if (deadlineInput) {
                const today = new Date();
                today.setDate(today.getDate() + 7);
                deadlineInput.value = today.toISOString().split('T')[0];
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dados do modal:', error);
            this.showNotification('Erro ao carregar dados do formulário', 'error');
        }
    }

    // Carregar áreas da empresa do usuário
    async loadAreasForCompany() {
        try {
            const areaSelect = document.getElementById('occurrenceArea');
            if (!areaSelect) return;

            areaSelect.innerHTML = '<option value="">Selecione a área responsável</option>';
            
            // Obter usuário atual
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                console.error('❌ Usuário não encontrado');
                return;
            }

            console.log('🏢 Carregando áreas para empresa:', currentUser.cod_empresa);

            // Buscar todas as áreas da empresa
            const { data: areas, error } = await window.supabaseDB.getClient()
                .from('area')
                .select('*')
                .eq('cod_empresa', currentUser.cod_empresa)
                .order('nome_area');

            if (error) {
                console.error('❌ Erro ao buscar áreas da empresa:', error);
                this.showNotification('Erro ao carregar áreas da empresa', 'error');
                return;
            }

            console.log('🏢 Áreas encontradas:', areas);

            // Adicionar áreas ao select
            areas.forEach(area => {
                const option = document.createElement('option');
                option.value = area.cod_area;
                option.textContent = area.nome_area;
                option.dataset.area = JSON.stringify(area);
                areaSelect.appendChild(option);
            });

        } catch (error) {
            console.error('❌ Erro ao carregar áreas da empresa:', error);
            this.showNotification('Erro ao carregar áreas da empresa', 'error');
        }
    }

    // Carregar modelos para uma área específica
    async loadModelsForArea(areaId) {
        try {
            const modelSelect = document.getElementById('occurrenceModel');
            if (!modelSelect) return;

            modelSelect.innerHTML = '<option value="">Carregando modelos...</option>';
            modelSelect.disabled = true;
            
            if (!areaId) {
                modelSelect.innerHTML = '<option value="">Primeiro selecione uma área</option>';
                modelSelect.disabled = true;
                return;
            }

            console.log('🔍 Carregando modelos ativos para área:', areaId);

            // Buscar modelos ativos da área específica
            const { data: modelos, error } = await window.supabaseDB.getClient()
                .from('modelo_ridec')
                .select(`
                    *,
                    area:cod_area(nome_area)
                `)
                .eq('cod_area', areaId)
                .eq('ies_ativo', 'S')
                .order('nome_modelo');

            if (error) {
                console.error('❌ Erro ao buscar modelos da área:', error);
                this.showNotification('Erro ao carregar modelos da área', 'error');
                modelSelect.innerHTML = '<option value="">Erro ao carregar modelos</option>';
                return;
            }

            console.log('📋 Modelos ativos encontrados para a área:', modelos);

            // Limpar e adicionar modelos ao select
            modelSelect.innerHTML = '<option value="">Selecione o modelo RIDEC</option>';
            
            if (modelos && modelos.length > 0) {
            modelos.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo.cod_modelo_ridec;
                option.textContent = modelo.nome_modelo;
                option.dataset.modelo = JSON.stringify(modelo);
                modelSelect.appendChild(option);
            });
                modelSelect.disabled = false;
            } else {
                modelSelect.innerHTML = '<option value="">Nenhum modelo ativo encontrado para esta área</option>';
                modelSelect.disabled = true;
            }

        } catch (error) {
            console.error('❌ Erro ao carregar modelos da área:', error);
            this.showNotification('Erro ao carregar modelos da área', 'error');
            const modelSelect = document.getElementById('occurrenceModel');
            if (modelSelect) {
                modelSelect.innerHTML = '<option value="">Erro ao carregar modelos</option>';
                modelSelect.disabled = true;
            }
        }
    }

    // Limpar informações do modelo
    clearModelInfo() {
        const elements = [
            'selectedModelTitle',
            'selectedModelArea', 
            'selectedModelDescription',
            'stageRIDescription',
            'stageRITime',
            'stageDDescription',
            'stageDTime',
            'stageEDescription',
            'stageETime',
            'stageCDescription',
            'stageCTime'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '-';
            }
        });
    }

    // Limpar todas as informações das etapas
    clearAllStageInfo() {
        const stageTypes = ['RI', 'D', 'E', 'C'];
        
        stageTypes.forEach(tipo => {
            const descElement = document.getElementById(`stage${tipo}Description`);
            const timeElement = document.getElementById(`stage${tipo}Time`);
            const stageCard = descElement?.closest('.stage-info-card');
            
            if (descElement) {
                descElement.textContent = 'Etapa não configurada';
                descElement.style.display = 'block';
            }
            if (timeElement) {
                timeElement.textContent = 'Não configurado';
                timeElement.style.display = 'block';
            }
            if (stageCard) {
                stageCard.style.display = 'block';
            }
        });
    }

    // Ocultar etapas não utilizadas
    hideUnusedStages(stagesToHide) {
        stagesToHide.forEach(tipo => {
            const descElement = document.getElementById(`stage${tipo.toUpperCase()}Description`);
            const timeElement = document.getElementById(`stage${tipo.toUpperCase()}Time`);
            const stageCard = descElement?.closest('.stage-info-card');
            
            if (stageCard) {
                stageCard.style.display = 'none';
                console.log(`🔒 Ocultando etapa ${tipo.toUpperCase()}`);
            }
        });
    }

    // Configurar event listeners do modal de criação
    setupCreateOccurrenceEventListeners(modal) {
        // Fechar modal
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#cancelCreateOccurrence').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Carregar modelos quando área for selecionada
        const areaSelect = modal.querySelector('#occurrenceArea');
        if (areaSelect) {
            areaSelect.addEventListener('change', (e) => {
                const areaId = e.target.value;
                this.loadModelsForArea(areaId);
                
                // Limpar informações do modelo quando área mudar
                this.clearModelInfo();
            });
        }

        // Mostrar informações do modelo selecionado
        const modelSelect = modal.querySelector('#occurrenceModel');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.showModelInfo(e.target.value);
            });
        }

        // Event listener para o expander
        const expanderHeader = modal.querySelector('#modelInfoExpanderHeader');
        if (expanderHeader) {
            expanderHeader.addEventListener('click', () => {
                toggleModelInfoExpander();
            });
        }

        // Submissão do formulário
        const form = modal.querySelector('#createOccurrenceForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewOccurrence(modal);
            });
        }
    }

    // Mostrar informações do modelo selecionado
    async showModelInfo(modelId) {
        const selectedModelTitle = document.getElementById('selectedModelTitle');
        const selectedModelArea = document.getElementById('selectedModelArea');
        const selectedModelDescription = document.getElementById('selectedModelDescription');

        if (!modelId) {
            // Resetar informações
            selectedModelTitle.textContent = '-';
            selectedModelArea.textContent = '-';
            selectedModelDescription.textContent = '-';
            
            // Resetar etapas
            this.resetStageInfo();
            return;
        }

        try {
            // Buscar dados do modelo com área
            const { data: modelo, error } = await window.supabaseDB.getClient()
                .from('modelo_ridec')
                .select(`
                    *,
                    area:cod_area(nome_area)
                `)
                .eq('cod_modelo_ridec', modelId)
                .single();

            if (error || !modelo) {
                console.error('❌ Erro ao buscar modelo:', error);
                return;
            }

            // Atualizar informações básicas
            selectedModelTitle.textContent = modelo.nome_modelo || '-';
            selectedModelArea.textContent = modelo.area?.nome_area || '-';
            selectedModelDescription.textContent = modelo.descricao_modelo || '-';

            // Buscar e atualizar etapas
            await this.loadStageInfo(modelId);

            // Auto-expandir o expander quando um modelo for selecionado
            this.expandModelInfo();

        } catch (error) {
            console.error('❌ Erro ao carregar informações do modelo:', error);
            this.showNotification('Erro ao carregar informações do modelo', 'error');
        }
    }

    // Carregar informações das etapas
    async loadStageInfo(modelId) {
        try {
            console.log(`🔍 Carregando informações das etapas para modelo: ${modelId}`);
            
            // Usar a mesma função que funciona na tela index
            const modeloCompleto = await window.supabaseDB.getModeloRidecCompleto(modelId);
            
            if (!modeloCompleto) {
                console.error('❌ Modelo não encontrado ou sem etapas');
                this.showStagesNotAvailable('Modelo não encontrado ou sem etapas configuradas.');
                return;
            }

            console.log('📊 Modelo completo carregado:', modeloCompleto);
            console.log('📊 Etapas disponíveis:', modeloCompleto.etapas);

            // Função auxiliar para formatar tempo (igual à implementação que funciona)
            const formatStageTime = (valorUom, uom) => {
                if (!valorUom) return 'Não configurado';
                const unitLabel = uom?.desc_uom || 'horas';
                return `${valorUom} ${unitLabel}`;
            };

            // Primeiro, limpar todas as etapas
            this.clearAllStageInfo();

            // Mapear tipos de etapa para elementos DOM
            const stageMapping = {
                'ri': { 
                    sigla: 'RI', 
                    nome: 'Requisitos e Início',
                    stageCard: 'stageRI',
                    descElement: 'stageRIDescription',
                    timeElement: 'stageRITime',
                    nomeField: 'nome_etapa_ri'
                },
                'd': { 
                    sigla: 'D', 
                    nome: 'Desenvolvimento',
                    stageCard: 'stageD',
                    descElement: 'stageDDescription',
                    timeElement: 'stageDTime',
                    nomeField: 'nome_etapa_d'
                },
                'e': { 
                    sigla: 'E', 
                    nome: 'Execução',
                    stageCard: 'stageE',
                    descElement: 'stageEDescription',
                    timeElement: 'stageETime',
                    nomeField: 'nome_etapa_e'
                },
                'c': { 
                    sigla: 'C', 
                    nome: 'Conclusão',
                    stageCard: 'stageC',
                    descElement: 'stageCDescription',
                    timeElement: 'stageCTime',
                    nomeField: 'nome_etapa_c'
                },
                'simples': { 
                    sigla: 'SIMPLES', 
                    nome: 'Etapa Simples',
                    stageCard: 'stageRI', // Usar RI como placeholder
                    descElement: 'stageRIDescription',
                    timeElement: 'stageRITime',
                    nomeField: 'nome_etapa_simples'
                }
            };

            // Atualizar apenas as etapas que existem no modelo
            Object.keys(modeloCompleto.etapas).forEach(tipoEtapa => {
                const etapa = modeloCompleto.etapas[tipoEtapa];
                const mapping = stageMapping[tipoEtapa];
                
                if (etapa && mapping) {
                    console.log(`🔄 Atualizando etapa ${tipoEtapa.toUpperCase()}:`, etapa);
                    
                    const descElement = document.getElementById(mapping.descElement);
                    const timeElement = document.getElementById(mapping.timeElement);
                    const stageCard = descElement?.closest('.stage-info-card');
                    
                    // Atualizar título da etapa com nome_tipo_etapa
                    if (stageCard) {
                        const titleElement = stageCard.querySelector('.stage-title');
                        if (titleElement) {
                            const nomeTipoEtapa = etapa.tipo_etapa?.nome_tipo_etapa || mapping.nome;
                            titleElement.textContent = nomeTipoEtapa;
                            console.log(`📝 Título da etapa ${tipoEtapa.toUpperCase()} atualizado para: "${nomeTipoEtapa}"`);
                        }
                    }
                    
                    // Atualizar descrição da etapa
                    if (descElement) {
                        const nomeEtapa = etapa[mapping.nomeField] || `Etapa ${mapping.sigla}`;
                        descElement.textContent = nomeEtapa;
                        descElement.style.display = 'block';
                        if (stageCard) {
                            stageCard.style.display = 'block';
                        }
                    }
                    
                    // Atualizar tempo da etapa
                    if (timeElement) {
                        const tempo = formatStageTime(etapa.valor_uom, etapa.uom);
                        timeElement.textContent = tempo;
                        timeElement.style.display = 'block';
                    }
                    
                    console.log(`✅ Etapa ${tipoEtapa.toUpperCase()} atualizada`);
                }
            });

            // Se for etapa simples, ocultar as outras etapas
            if (modeloCompleto.etapas.simples) {
                this.hideUnusedStages(['d', 'e', 'c']);
                console.log('✅ Modelo com etapa simples - ocultando etapas RI, D, E, C');
            }

            console.log('✅ Carregamento das etapas concluído');

        } catch (error) {
            console.error('❌ Erro ao carregar informações das etapas:', error);
            this.showStagesNotAvailable('Erro ao carregar etapas do modelo.');
        }
    }

    // Atualizar informações de uma etapa específica
    updateStageInfo(fase, etapas) {
        console.log(`🔄 Atualizando etapa ${fase} com dados:`, etapas);
        
        const descriptionElement = document.getElementById(`stage${fase}Description`);
        const timeElement = document.getElementById(`stage${fase}Time`);

        console.log(`🔍 Elementos encontrados para ${fase}:`, {
            descriptionElement: descriptionElement,
            timeElement: timeElement
        });

        if (!descriptionElement || !timeElement) {
            console.error(`❌ Elementos não encontrados para etapa ${fase}`);
            return;
        }

        if (etapas && etapas.length > 0) {
            const etapa = etapas[0]; // Pegar a primeira (e única) etapa
            console.log(`📋 Dados completos da etapa ${fase}:`, JSON.stringify(etapa, null, 2));
            
            // Mapear campos baseado na fase
            // Os campos corretos da tabela modelo_etapa_ridec são:
            // - desc_etapa_modelo (descrição da etapa)
            // - valor_uom (valor da UOM)
            // - cod_uom (código da UOM)
            // - uom.desc_uom (descrição da UOM via relacionamento)
            let nomeField, valorField, uomField;
            switch (fase) {
                case 'RI':
                    nomeField = 'desc_etapa_modelo';
                    valorField = 'valor_uom';
                    uomField = 'cod_uom';
                    break;
                case 'D':
                    nomeField = 'desc_etapa_modelo';
                    valorField = 'valor_uom';
                    uomField = 'cod_uom';
                    break;
                case 'E':
                    nomeField = 'desc_etapa_modelo';
                    valorField = 'valor_uom';
                    uomField = 'cod_uom';
                    break;
                case 'C':
                    nomeField = 'desc_etapa_modelo';
                    valorField = 'valor_uom';
                    uomField = 'cod_uom';
                    break;
                default:
                    nomeField = 'desc_etapa_modelo';
                    valorField = 'valor_uom';
                    uomField = 'cod_uom';
            }

            console.log(`🔍 Campos mapeados para ${fase}:`, {
                nomeField: nomeField,
                valorField: valorField,
                uomField: uomField
            });

            // Atualizar descrição
            const descricao = etapa[nomeField];
            console.log(`📝 Campo ${nomeField}: "${descricao}"`);
            
            if (descricao && descricao.trim() !== '') {
                descriptionElement.textContent = descricao;
                descriptionElement.style.fontStyle = 'normal';
                descriptionElement.style.color = '#1e293b';
                console.log(`✅ Descrição ${fase} atualizada para: "${descricao}"`);
            } else {
                descriptionElement.textContent = 'Etapa sem nome';
                descriptionElement.style.fontStyle = 'italic';
                descriptionElement.style.color = '#6c757d';
                console.log(`⚠️ Descrição ${fase} vazia ou nula`);
            }

            // Atualizar tempo/valor
            const valor = etapa[valorField];
            const codUom = etapa[uomField];
            const descUom = etapa.uom?.desc_uom;
            
            console.log(`⏱️ Campo ${valorField}: ${valor}, Campo ${uomField}: ${codUom}, UOM desc: ${descUom}`);
            
            if (valor && valor > 0) {
                const uomText = descUom ? ` ${descUom}` : (codUom ? ` ${codUom}` : ' UOM');
                timeElement.textContent = `${valor}${uomText}`;
                timeElement.style.color = '#1e293b';
                console.log(`✅ Tempo ${fase} atualizado para: ${valor}${uomText}`);
            } else {
                timeElement.textContent = 'Não definido';
                timeElement.style.color = '#6c757d';
                console.log(`⚠️ Tempo ${fase} não definido (valor: ${valor})`);
            }
        } else {
            descriptionElement.textContent = 'Nenhuma etapa cadastrada';
            descriptionElement.style.fontStyle = 'italic';
            descriptionElement.style.color = '#6c757d';
            timeElement.textContent = '-';
            timeElement.style.color = '#6c757d';
            console.log(`⚠️ Nenhuma etapa encontrada para ${fase}`);
        }
    }

    // Resetar informações das etapas
    resetStageInfo() {
        const fases = ['RI', 'D', 'E', 'C'];
        fases.forEach(fase => {
            const descriptionElement = document.getElementById(`stage${fase}Description`);
            const timeElement = document.getElementById(`stage${fase}Time`);
            
            if (descriptionElement) descriptionElement.textContent = '-';
            if (timeElement) timeElement.textContent = '-';
        });
    }

    // Mostrar mensagem quando etapas não estão disponíveis
    showStagesNotAvailable(message = 'Etapas não disponíveis para este modelo.') {
        const fases = ['RI', 'D', 'E', 'C'];
        fases.forEach(fase => {
            const descriptionElement = document.getElementById(`stage${fase}Description`);
            const timeElement = document.getElementById(`stage${fase}Time`);
            
            if (descriptionElement) {
                descriptionElement.textContent = message;
                descriptionElement.style.fontStyle = 'italic';
                descriptionElement.style.color = '#6c757d';
            }
            if (timeElement) {
                timeElement.textContent = '-';
                timeElement.style.color = '#6c757d';
            }
        });
        
        console.log(`⚠️ Etapas não disponíveis: ${message}`);
    }

    // Renderizar etapas do modelo
    renderModelStages(etapas, container) {
        if (!container) return;

        const etapasHtml = etapas.map((etapa, index) => {
            const faseIcon = this.getFaseIcon(etapa.fase);
            const faseColor = this.getFaseColor(etapa.fase);
            
            return `
                <div class="model-stage-item" style="
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    padding: 12px 15px; 
                    background: #f8fafc; 
                    border-radius: 8px; 
                    border-left: 4px solid ${faseColor};
                    margin-bottom: 8px;
                ">
                    <div class="stage-icon" style="
                        width: 30px; 
                        height: 30px; 
                        border-radius: 50%; 
                        background: ${faseColor}; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        color: white;
                        font-size: 0.9rem;
                    ">
                        <i class="${faseIcon}"></i>
                    </div>
                    <div class="stage-content" style="flex: 1;">
                        <div style="font-weight: 600; color: #1e293b; font-size: 0.95rem;">
                            ${etapa.fase}
                        </div>
                        <div style="color: #64748b; font-size: 0.85rem;">
                            ${etapa.nome_etapa}
                        </div>
                    </div>
                    <div class="stage-order" style="
                        background: #e2e8f0; 
                        color: #64748b; 
                        padding: 4px 8px; 
                        border-radius: 12px; 
                        font-size: 0.8rem; 
                        font-weight: 600;
                    ">
                        ${index + 1}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = etapasHtml;
    }

    // Obter ícone da fase
    getFaseIcon(fase) {
        const icons = {
            'Research': 'fas fa-search',
            'Development': 'fas fa-code',
            'Engineering': 'fas fa-cogs',
            'Construction': 'fas fa-hammer',
            'Assembly': 'fas fa-tools'
        };
        return icons[fase] || 'fas fa-circle';
    }

    // Obter cor da fase
    getFaseColor(fase) {
        const colors = {
            'Research': '#3b82f6',
            'Development': '#8b5cf6',
            'Engineering': '#f59e0b',
            'Construction': '#ef4444',
            'Assembly': '#10b981'
        };
        return colors[fase] || '#6b7280';
    }

    // Expandir informações do modelo
    expandModelInfo() {
        const container = document.querySelector('.expander-container');
        const content = document.getElementById('modelInfoExpanderContent');
        const icon = document.querySelector('.expander-icon');
        
        if (container && content && icon) {
            container.classList.add('expanded');
            content.style.maxHeight = '2000px';
            content.style.padding = '20px';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }

    // Contrair informações do modelo
    collapseModelInfo() {
        const container = document.querySelector('.expander-container');
        const content = document.getElementById('modelInfoExpanderContent');
        const icon = document.querySelector('.expander-icon');
        
        if (container && content && icon) {
            container.classList.remove('expanded');
            content.style.maxHeight = '0';
            content.style.padding = '0 20px';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Salvar nova ocorrência
    async saveNewOccurrence(modal) {
        try {
            const formData = {
                title: document.getElementById('occurrenceTitle').value,
                description: document.getElementById('occurrenceDescription').value,
                priority: document.getElementById('occurrencePriority').value,
                area: document.getElementById('occurrenceArea').value,
                model: document.getElementById('occurrenceModel').value,
                responsible: document.getElementById('occurrenceResponsible').value,
                deadline: document.getElementById('occurrenceDeadline').value
            };

            // Validação básica
            if (!formData.title || !formData.priority || !formData.area || !formData.model) {
                this.showNotification('Preencha todos os campos obrigatórios', 'error');
                return;
            }

            // Criar ocorrência baseada no modelo
            const newOccurrence = await this.createOccurrenceFromModel(formData);
            
            // Adicionar à lista de ocorrências
            this.occurrences.push(newOccurrence);
            this.filteredOccurrences = [...this.occurrences];
            
            // Atualizar interface
            await this.renderOccurrences();
            this.updateStats();
            
            // Fechar modal
            document.body.removeChild(modal);
            
            this.showNotification('Ocorrência criada com sucesso!', 'success');

        } catch (error) {
            console.error('❌ Erro ao salvar ocorrência:', error);
            this.showNotification('Erro ao criar ocorrência', 'error');
        }
    }

    // Criar ocorrência baseada em um modelo
    async createOccurrenceFromModel(formData) {
        try {
            // Buscar dados do modelo com área
            const { data: modelo, error } = await window.supabaseDB.getClient()
                .from('modelo_ridec')
                .select(`
                    *,
                    area:cod_area(nome_area)
                `)
                .eq('cod_modelo_ridec', formData.model)
                .single();

            if (error || !modelo) {
                throw new Error('Modelo não encontrado');
            }

            // Buscar etapas do modelo
            const etapas = await this.getEtapasByModelo(formData.model);

            // Criar ocorrência
            const occurrence = {
                id: Date.now(), // ID temporário
                title: formData.title,
                model: formData.model,
                modelName: modelo.nome_modelo,
                status: 'pending',
                area: modelo.cod_area,
                areaName: modelo.area?.nome_area || 'Área não definida',
                createdAt: new Date().toISOString().split('T')[0],
                deadline: formData.deadline || this.calculateDeadline(etapas),
                progress: 0,
                description: formData.description || modelo.descricao_modelo || 'Ocorrência criada a partir do modelo',
                priority: formData.priority,
                responsible: formData.responsible || modelo.responsavel || 'Não definido',
                stages: etapas.map(etapa => ({
                    name: `${etapa.fase}: ${etapa.nome_etapa}`,
                    status: 'pending',
                    time: '0h 0m',
                    timeMs: 0
                }))
            };

            return occurrence;

        } catch (error) {
            console.error('❌ Erro ao criar ocorrência do modelo:', error);
            throw error;
        }
    }

    // Modal de edição de ocorrência
    showEditOccurrenceModal(occurrence) {
        this.showNotification('Funcionalidade de edição será implementada em breve!', 'info');
    }

    // Métodos para controle de etapas
    // ===== NOVAS FUNÇÕES DE CONTROLE DE ETAPAS PARA ESTRUTURA ATUALIZADA =====

    async startStage(occurrenceId, stageIndex) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.etapas || !occurrence.etapas[stageIndex]) return;

        const etapa = occurrence.etapas[stageIndex];
        const timerKey = `${occurrenceId}-${stageIndex}`;
        
        try {
            // Verificar se já está em andamento
            if (etapa.data_inicio && etapa.hora_inicio && !etapa.data_fim) {
                this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" já está em andamento!`, 'warning');
                return;
            }

            // Inicializar timer se não existir
            if (!this.stageTimers.has(timerKey)) {
                this.stageTimers.set(timerKey, 0);
            }
            
            // Iniciar timer
            const startTime = Date.now();
            this.activeTimers.set(timerKey, startTime);
            
            // Atualizar etapa no banco de dados
            const agora = new Date();
            const dataInicio = agora.toISOString().split('T')[0];
            const horaInicio = agora.toTimeString().split(' ')[0];

            const { error } = await window.supabaseDB.getClient()
                .from('etapa_ridec')
                .update({
                    data_inicio: dataInicio,
                    hora_inicio: horaInicio,
                    data_fim: null,
                    hora_fim: null
                })
                .eq('cod_etapa_ridec', etapa.cod_etapa_ridec);

            if (error) {
                console.error('❌ Erro ao iniciar etapa:', error);
                this.showNotification('Erro ao iniciar etapa', 'error');
                return;
            }

            // Atualizar etapa na memória
            etapa.data_inicio = dataInicio;
            etapa.hora_inicio = horaInicio;
            etapa.data_fim = null;
            etapa.hora_fim = null;
            
            // Atualizar interface
            this.updateStageCard(occurrenceId, stageIndex);
            this.updateOccurrenceProgress(occurrenceId);
            await this.renderOccurrences();
            
            this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" iniciada!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar etapa:', error);
            this.showNotification('Erro ao iniciar etapa', 'error');
        }
    }

    async stopStage(occurrenceId, stageIndex) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.etapas || !occurrence.etapas[stageIndex]) return;

        const etapa = occurrence.etapas[stageIndex];
        const timerKey = `${occurrenceId}-${stageIndex}`;
        
        try {
            // Verificar se está em andamento
            if (!etapa.data_inicio || !etapa.hora_inicio || etapa.data_fim) {
                this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" não está em andamento!`, 'warning');
                return;
            }

            // Parar timer e acumular tempo
            const startTime = this.activeTimers.get(timerKey);
            if (startTime) {
                const elapsed = Date.now() - startTime;
                const currentAccumulated = this.stageTimers.get(timerKey) || 0;
                this.stageTimers.set(timerKey, currentAccumulated + elapsed);
                this.activeTimers.delete(timerKey);
            }
            
            // Atualizar etapa no banco de dados - manter data_inicio e hora_inicio, mas limpar data_fim e hora_fim
            const { error } = await window.supabaseDB.getClient()
                .from('etapa_ridec')
                .update({
                    data_fim: null,
                    hora_fim: null
                })
                .eq('cod_etapa_ridec', etapa.cod_etapa_ridec);

            if (error) {
                console.error('❌ Erro ao pausar etapa:', error);
                this.showNotification('Erro ao pausar etapa', 'error');
                return;
            }

            // Atualizar etapa na memória
            etapa.data_fim = null;
            etapa.hora_fim = null;
            
            // Atualizar interface
            this.updateStageCard(occurrenceId, stageIndex);
            this.updateOccurrenceProgress(occurrenceId);
            await this.renderOccurrences();
            
            this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" pausada!`, 'warning');
            
        } catch (error) {
            console.error('❌ Erro ao pausar etapa:', error);
            this.showNotification('Erro ao pausar etapa', 'error');
        }
    }

    async completeStage(occurrenceId, stageIndex) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.etapas || !occurrence.etapas[stageIndex]) return;

        const etapa = occurrence.etapas[stageIndex];
        const timerKey = `${occurrenceId}-${stageIndex}`;
        
        try {
            // Verificar se já está concluída
            if (etapa.data_fim && etapa.hora_fim) {
                this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" já está concluída!`, 'info');
                return;
            }

            // Parar timer e acumular tempo final
            const startTime = this.activeTimers.get(timerKey);
            if (startTime) {
                const elapsed = Date.now() - startTime;
                const currentAccumulated = this.stageTimers.get(timerKey) || 0;
                this.stageTimers.set(timerKey, currentAccumulated + elapsed);
                this.activeTimers.delete(timerKey);
            }
            
            // 1. Registrar data_fim e hora_fim na etapa atual
            const agora = new Date();
            const dataFim = agora.toISOString().split('T')[0];
            const horaFim = agora.toTimeString().split(' ')[0];

            console.log(`🔄 Concluindo etapa ${etapa.cod_etapa_ridec} com data_fim: ${dataFim}, hora_fim: ${horaFim}`);

            // Calcular tempo diferenca baseado na UOM do modelo
            const tempoDiferenca = await this.calcularTempoDiferenca(
                occurrence.id, // cod_card_ridec
                etapa.cod_tipo_etapa,
                etapa.data_inicio,
                etapa.hora_inicio,
                dataFim,
                horaFim
            );

            console.log(`⏱️ Tempo diferenca calculado: ${tempoDiferenca}`);

            const { error: errorConcluir } = await window.supabaseDB.getClient()
                .from('etapa_ridec')
                .update({
                    data_fim: dataFim,
                    hora_fim: horaFim,
                    tempo_diferenca: tempoDiferenca
                })
                .eq('cod_etapa_ridec', etapa.cod_etapa_ridec);

            if (errorConcluir) {
                console.error('❌ Erro ao concluir etapa:', errorConcluir);
                this.showNotification('Erro ao concluir etapa', 'error');
                return;
            }

            // Atualizar etapa na memória
            etapa.data_fim = dataFim;
            etapa.hora_fim = horaFim;

            // 2. Obter próxima etapa do modelo
            console.log(`🔍 Buscando próxima etapa para modelo ${occurrence.model}, etapa atual ${etapa.cod_tipo_etapa}`);
            console.log(`📊 Dados da ocorrência:`, {
                id: occurrence.id,
                model: occurrence.model,
                modelName: occurrence.modelName
            });
            console.log(`📊 Dados da etapa:`, {
                cod_tipo_etapa: etapa.cod_tipo_etapa,
                cod_etapa_ridec: etapa.cod_etapa_ridec
            });
            
            const proximaEtapa = await this.getProximaEtapaModelo(occurrence.model, etapa.cod_tipo_etapa);
            
            if (proximaEtapa) {
                console.log(`✅ Próxima etapa encontrada: ${proximaEtapa.tipo_etapa?.nome_tipo_etapa} (${proximaEtapa.cod_tipo_etapa})`);
                
                // 3. Criar nova linha para a próxima etapa
                const novaEtapa = await this.criarNovaEtapaExecutada(
                    occurrence.id, // cod_card_ridec
                    proximaEtapa.cod_tipo_etapa, // cod_tipo_etapa
                    etapa.cod_etapa_ridec // cod_etapa_anterior
                );
                
                if (novaEtapa) {
                    console.log(`✅ Nova etapa criada: ${novaEtapa.cod_etapa_ridec}`);
                    this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" concluída! Próxima etapa "${proximaEtapa.tipo_etapa?.nome_tipo_etapa}" iniciada automaticamente.`, 'success');
                } else {
                    console.error('❌ Erro ao criar próxima etapa');
                    this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" concluída, mas erro ao iniciar próxima etapa.`, 'warning');
                }
            } else {
                console.log('ℹ️ Esta foi a última etapa do modelo');
                console.log('🏁 Marcando card como concluído pois não há próxima etapa no modelo');
                
                // Marcar o card como concluído
                try {
                    await this.marcarCardComoConcluido(occurrence.id);
                    this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" concluída! Card marcado como concluído.`, 'success');
                } catch (error) {
                    console.error('❌ Erro ao marcar card como concluído:', error);
                    this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" concluída, mas erro ao marcar card como concluído.`, 'warning');
                }
            }
            
            // Recarregar dados da ocorrência para incluir nova etapa
            console.log('🔄 Recarregando dados da ocorrência...');
            await this.reloadOccurrenceData(occurrenceId);
            console.log('✅ Dados da ocorrência recarregados');

            // Atualizar interface específica do card (sem fechar expanders)
            console.log('🔄 Iniciando atualizações da interface...');
            
            this.updateStageCard(occurrenceId, stageIndex);
            console.log('✅ updateStageCard executado');
            
            this.updateOccurrenceProgress(occurrenceId);
            console.log('✅ updateOccurrenceProgress executado');
            
            // Atualizar occurrence-expander-content com dados mais recentes
            console.log('🔄 Chamando updateOccurrenceExpanderContent...');
            await this.updateOccurrenceExpanderContent(occurrenceId);
            console.log('✅ updateOccurrenceExpanderContent executado');
            
            // Atualizar apenas o card específico na lista
            console.log('🔄 Chamando updateSpecificCard...');
            await this.updateSpecificCard(occurrenceId);
            console.log('✅ updateSpecificCard executado');
            
            this.showNotification(`Etapa "${etapa.tipo_etapa?.nome_tipo_etapa || 'Etapa'}" concluída!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao concluir etapa:', error);
            this.showNotification('Erro ao concluir etapa', 'error');
        }
    }

    // Recarregar dados da ocorrência para incluir nova etapa
    async reloadOccurrenceData(occurrenceId) {
        try {
            console.log(`🔄 Recarregando dados da ocorrência ${occurrenceId}`);
            
            // Buscar etapas atualizadas da tabela etapa_ridec
            const etapasExecutadas = await this.getEtapasCard(occurrenceId);
            console.log('📋 Etapas executadas carregadas:', etapasExecutadas.length);
            
            // Encontrar a ocorrência na lista
            const occurrence = this.occurrences.find(o => o.id === occurrenceId);
            if (!occurrence) {
                console.log('⚠️ Ocorrência não encontrada para recarregar');
                return;
            }

            // Atualizar etapas da ocorrência com dados mais recentes
            if (etapasExecutadas.length > 0) {
                // Mapear etapas executadas para a estrutura esperada
                const etapasAtualizadas = etapasExecutadas.map(etapa => {
                    const faseMap = {
                        'RI': 'Research',
                        'D': 'Development', 
                        'E': 'Engineering',
                        'C': 'Construction',
                        'A': 'Assembly'
                    };
                    
                    return {
                        fase: faseMap[etapa.tipo_etapa?.nome_tipo_etapa] || etapa.tipo_etapa?.nome_tipo_etapa,
                        sigla: etapa.tipo_etapa?.nome_tipo_etapa || 'ET',
                        data_inicio: etapa.data_inicio,
                        hora_inicio: etapa.hora_inicio,
                        data_fim: etapa.data_fim,
                        hora_fim: etapa.hora_fim,
                        cod_etapa_ridec: etapa.cod_etapa_ridec,
                        cod_tipo_etapa: etapa.cod_tipo_etapa,
                        tipo_etapa: etapa.tipo_etapa
                    };
                });

                occurrence.etapas = etapasAtualizadas;
                console.log('✅ Etapas da ocorrência atualizadas:', etapasAtualizadas.length);
                console.log('📊 Detalhes das etapas atualizadas:', etapasAtualizadas.map(e => ({
                    fase: e.fase,
                    sigla: e.sigla,
                    data_inicio: e.data_inicio,
                    hora_inicio: e.hora_inicio,
                    data_fim: e.data_fim,
                    hora_fim: e.hora_fim
                })));
            }
        } catch (error) {
            console.error('❌ Erro ao recarregar dados da ocorrência:', error);
        }
    }

    // Atualizar occurrence-expander-content com dados mais recentes
    async updateOccurrenceExpanderContent(occurrenceId) {
        try {
            console.log(`🔄 Atualizando occurrence-expander-content para ocorrência ${occurrenceId}`);
            
            // Buscar dados atualizados da ocorrência
            const occurrence = this.occurrences.find(o => o.id === occurrenceId);
            if (!occurrence) {
                console.log('⚠️ Ocorrência não encontrada para atualização');
                return;
            }

            console.log('📊 Dados da ocorrência antes da atualização:', {
                id: occurrence.id,
                etapas: occurrence.etapas?.length || 0,
                etapasDetalhes: occurrence.etapas?.map(e => ({
                    fase: e.fase,
                    data_inicio: e.data_inicio,
                    hora_inicio: e.hora_inicio,
                    data_fim: e.data_fim,
                    hora_fim: e.hora_fim
                }))
            });

            // Recriar as colunas das etapas com dados atualizados
            console.log('🔄 Chamando createStagesColumns...');
            const stagesColumnsHtml = await this.createStagesColumns(occurrence);
            console.log('📊 HTML das colunas gerado:', stagesColumnsHtml.length, 'caracteres');
            console.log('📋 Preview do HTML:', stagesColumnsHtml.substring(0, 300) + '...');
            
            // Atualizar o conteúdo do expander
            const expanderId = `occurrence-${occurrenceId}`;
            console.log(`🔍 Procurando elemento com ID: ${expanderId}`);
            const expanderElement = document.getElementById(expanderId);
            if (expanderElement) {
                console.log('✅ Elemento occurrence-expander-content encontrado:', expanderElement);
                const stagesTableElement = expanderElement.querySelector('.occurrence-stages-table');
                if (stagesTableElement) {
                    console.log('✅ Elemento .occurrence-stages-table encontrado');
                    
                    // Procurar pelo stages-table-content dentro do occurrence-stages-table
                    const stagesContentElement = stagesTableElement.querySelector('.stages-table-content');
                    if (stagesContentElement) {
                        console.log('✅ Elemento .stages-table-content encontrado');
                        console.log('📊 Conteúdo atual antes da atualização:', stagesContentElement.innerHTML.substring(0, 200) + '...');
                        
                        stagesContentElement.innerHTML = stagesColumnsHtml;
                        
                        console.log('📊 Conteúdo após atualização:', stagesContentElement.innerHTML.substring(0, 200) + '...');
                        console.log('✅ stages-table-content atualizado com sucesso');
                    } else {
                        console.log('⚠️ Elemento .stages-table-content não encontrado, atualizando .occurrence-stages-table diretamente');
                        console.log('📊 Conteúdo atual antes da atualização:', stagesTableElement.innerHTML.substring(0, 200) + '...');
                        
                        stagesTableElement.innerHTML = stagesColumnsHtml;
                        
                        console.log('📊 Conteúdo após atualização:', stagesTableElement.innerHTML.substring(0, 200) + '...');
                        console.log('✅ occurrence-stages-table atualizado com sucesso');
                    }
                } else {
                    console.log('⚠️ Elemento .occurrence-stages-table não encontrado dentro do expander');
                    console.log('📊 Conteúdo do expander:', expanderElement.innerHTML.substring(0, 200) + '...');
                }
            } else {
                console.log('⚠️ Elemento occurrence-expander-content não encontrado');
                console.log('🔍 Verificando se existe algum elemento com ID similar...');
                const allElements = document.querySelectorAll('[id*="occurrence"]');
                console.log('📋 Elementos com "occurrence" no ID:', Array.from(allElements).map(el => el.id));
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar occurrence-expander-content:', error);
        }
    }

    // Atualizar apenas o card específico na lista (sem fechar expanders)
    async updateSpecificCard(occurrenceId) {
        try {
            console.log(`🔄 Atualizando card específico ${occurrenceId}`);
            
            // Buscar dados atualizados da ocorrência
            const occurrence = this.occurrences.find(o => o.id === occurrenceId);
            if (!occurrence) {
                console.log('⚠️ Ocorrência não encontrada para atualização');
                return;
            }

            // Buscar o elemento do card na lista
            const cardElement = document.querySelector(`[data-id="${occurrenceId}"]`);
            if (!cardElement) {
                console.log('⚠️ Elemento do card não encontrado na lista');
                console.log(`🔍 Procurando por data-id="${occurrenceId}"`);
                return;
            }

            // Atualizar informações básicas do card
            const titleElement = cardElement.querySelector('.occurrence-title h4');
            if (titleElement) {
                const idExterno = occurrence.externalId || occurrence.id_externo || occurrence.id;
                titleElement.textContent = `ID: ${idExterno}`;
            }

            const statusElement = cardElement.querySelector('.occurrence-badge');
            if (statusElement) {
                const statusText = this.getStatusText(occurrence.status);
                statusElement.textContent = statusText;
                statusElement.className = `occurrence-badge badge-${occurrence.status}`;
            }

            // Atualizar model-stages-info se existir (pode estar dentro do expander)
            const modelStagesElement = cardElement.querySelector('.model-stages-info');
            if (modelStagesElement) {
                const modelStagesHtml = await this.getModelStageInfo(occurrence);
                console.log('🔍 Inserindo HTML das etapas no DOM:', modelStagesHtml);
                modelStagesElement.innerHTML = modelStagesHtml;
                
                // Verificar se os ícones foram inseridos
                const fileIcons = modelStagesElement.querySelectorAll('.stage-file-icon');
                console.log('🔍 Ícones encontrados no DOM:', fileIcons.length, fileIcons);
            }

            console.log('✅ Card específico atualizado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao atualizar card específico:', error);
        }
    }

    updateStageCard(occurrenceId, stageIndex) {
        const timerKey = `${occurrenceId}-${stageIndex}`;
        const timerElement = document.getElementById(`timer-${occurrenceId}-${stageIndex}`);
        
        if (timerElement) {
            const totalTime = this.stageTimers.get(timerKey) || 0;
            const isActive = this.activeTimers.has(timerKey);
            
            if (isActive) {
                // Timer ativo - atualizar em tempo real
                const startTime = this.activeTimers.get(timerKey);
                const currentElapsed = Date.now() - startTime;
                const displayTime = totalTime + currentElapsed;
                timerElement.textContent = this.formatTime(displayTime);
                
                // Agendar próxima atualização
                setTimeout(() => this.updateStageCard(occurrenceId, stageIndex), 1000);
            } else {
                // Timer parado - mostrar tempo acumulado
                timerElement.textContent = this.formatTime(totalTime);
            }
        }
    }

    updateOccurrenceProgress(occurrenceId) {
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível');
            return;
        }
        
        const occurrence = this.occurrences.find(o => o.id === occurrenceId);
        if (!occurrence || !occurrence.etapas) return;

        const totalEtapas = occurrence.etapas.length;
        const completedEtapas = occurrence.etapas.filter(e => e.data_fim && e.hora_fim).length;
        const activeEtapas = occurrence.etapas.filter(e => e.data_inicio && e.hora_inicio && !e.data_fim).length;
        
        // Calcular progresso
        let progress = 0;
        if (totalEtapas > 0) {
            progress = Math.round((completedEtapas / totalEtapas) * 100);
        }
        
        // Atualizar progresso da ocorrência
        occurrence.progress = progress;
        
        // Atualizar status da ocorrência
        if (completedEtapas === totalEtapas) {
            occurrence.status = 'completed';
        } else if (activeEtapas > 0) {
            occurrence.status = 'active';
        } else if (occurrence.progress > 0) {
            occurrence.status = 'pending';
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    initializeStageTimers() {
        // Inicializar timers com dados existentes
        if (!this.occurrences || !Array.isArray(this.occurrences)) {
            console.log('⚠️ Nenhuma ocorrência disponível para inicializar timers');
            return;
        }

        this.occurrences.forEach(occurrence => {
            if (occurrence.stages && Array.isArray(occurrence.stages)) {
                occurrence.stages.forEach((stage, index) => {
                    const timerKey = `${occurrence.id}-${index}`;
                    if (stage.timeMs) {
                        this.stageTimers.set(timerKey, stage.timeMs);
                    }
                });
            }
        });
    }

    // Sistema de notificações
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 10px;
            padding: 15px 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            border-left: 4px solid ${this.getNotificationColor(type)};
            animation: slideInRight 0.3s ease;
        `;

        const icon = document.createElement('i');
        icon.className = this.getNotificationIcon(type);
        icon.style.color = this.getNotificationColor(type);

        const text = document.createElement('span');
        text.textContent = message;

        notification.appendChild(icon);
        notification.appendChild(text);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-info-circle';
    }
}

    // Função para alternar expander de área
    function toggleAreaExpander(areaId) {
        const content = document.getElementById(areaId);
        const icon = document.getElementById(`icon-${areaId}`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Função para alternar expander de modelo
    function toggleModelExpander(modelId) {
        const content = document.getElementById(modelId);
        const icon = document.getElementById(`icon-${modelId}`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    // Função para editar modelo
    function editModel(modelId) {
        console.log('Editar modelo:', modelId);
        // TODO: Implementar edição de modelo
        if (window.ridecOccurrences) {
            window.ridecOccurrences.showNotification('Funcionalidade de edição será implementada', 'info');
        }
    }

    // Função para conectar modelo
    function connectModel(modelId) {
        console.log('Conectar modelo:', modelId);
        // TODO: Implementar conexão de modelo
        if (window.ridecOccurrences) {
            window.ridecOccurrences.showNotification('Funcionalidade de conexão será implementada', 'info');
        }
    }

    // Função para excluir modelo
    function deleteModel(modelId) {
        console.log('Excluir modelo:', modelId);
        if (confirm('Tem certeza que deseja excluir este modelo?')) {
            // TODO: Implementar exclusão de modelo
            if (window.ridecOccurrences) {
                window.ridecOccurrences.showNotification('Funcionalidade de exclusão será implementada', 'info');
            }
        }
    }

    // Função para criar novo modelo
    function createNewModel() {
        console.log('Criar novo modelo');
        // TODO: Implementar criação de modelo
        if (window.ridecOccurrences) {
            window.ridecOccurrences.showNotification('Funcionalidade de criação será implementada', 'info');
        }
    }

    // Função para alternar expander de informações do modelo
    function toggleModelInfoExpander() {
        const container = document.querySelector('.expander-container');
        const content = document.getElementById('modelInfoExpanderContent');
        const icon = document.querySelector('.expander-icon');
        
        if (container && content && icon) {
            if (container.classList.contains('expanded')) {
                container.classList.remove('expanded');
                content.style.maxHeight = '0';
                content.style.padding = '0 20px';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                container.classList.add('expanded');
                content.style.maxHeight = '2000px';
                content.style.padding = '20px';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }
    }

    // Inicializar o sistema quando a página carregar
    let ridecOccurrences;
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            console.log('🚀 Inicializando sistema de ocorrências...');
            
            // Inicializar SupabaseDatabase
            window.supabaseDB = SupabaseDatabase.getInstance();
            const initialized = await window.supabaseDB.init();
            
            if (initialized) {
                console.log('✅ Supabase inicializado, criando instância RIDECOccurrences...');
                ridecOccurrences = new RIDECOccurrences();
                window.ridecOccurrences = ridecOccurrences; // Disponibilizar globalmente
            } else {
                console.error('❌ Falha na inicialização do Supabase');
                // Tentar inicializar mesmo assim com dados de exemplo
                ridecOccurrences = new RIDECOccurrences();
                window.ridecOccurrences = ridecOccurrences;
            }
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            // Tentar inicializar mesmo assim
            ridecOccurrences = new RIDECOccurrences();
            window.ridecOccurrences = ridecOccurrences;
        }
    });

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Função global para controlar expander de ocorrências
function toggleOccurrenceExpander(occurrenceId) {
    if (window.ridecOccurrences) {
        window.ridecOccurrences.toggleOccurrenceExpander(occurrenceId);
    }
}

// Funções globais para acesso do HTML
window.openFile = function(filePath) {
    if (window.ridecOccurrences) {
        window.ridecOccurrences.openFile(filePath);
    }
};

window.copyLocalPath = function(filePath) {
    if (window.ridecOccurrences) {
        window.ridecOccurrences.copyLocalPath(filePath);
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.ridecOccurrences = new RIDECOccurrences();
}); 
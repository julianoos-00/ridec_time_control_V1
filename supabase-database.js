// Gerenciador de operações do banco de dados Supabase
// Este arquivo contém todas as funções para interagir com o banco

class SupabaseDatabase {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    // Padrão Singleton para evitar múltiplas instâncias
    static getInstance() {
        if (!SupabaseDatabase.instance) {
            SupabaseDatabase.instance = new SupabaseDatabase();
        }
        return SupabaseDatabase.instance;
    }

    // Inicializar conexão com Supabase
    async init() {
        try {
            // Se já estiver inicializado, retornar true
            if (this.initialized && this.supabase) {
                console.log('✅ Supabase já inicializado, reutilizando instância');
                return true;
            }

            console.log('🚀 Iniciando conexão com Supabase...');
            
            // Verificar se a configuração está disponível
            if (typeof window.SUPABASE_CONFIG === 'undefined') {
                console.error('❌ SUPABASE_CONFIG não está disponível');
                throw new Error('Configuração do Supabase não encontrada');
            }
            
            console.log('✅ Configuração encontrada:', window.SUPABASE_CONFIG.url);
            
            // Validar configuração
            if (typeof validateConfig === 'function') {
                console.log('🔍 Validando configuração...');
                const configValid = validateConfig();
                if (!configValid) {
                    throw new Error('Configuração do Supabase inválida');
                }
                console.log('✅ Configuração válida');
            }
            
            if (typeof supabase === 'undefined') {
                console.error('❌ Biblioteca do Supabase não carregada');
                throw new Error('Biblioteca do Supabase não carregada');
            }
            
            console.log('✅ Biblioteca do Supabase carregada');

            // Verificar se já existe uma instância global
            if (window.supabaseClient && window.supabaseClientInitialized) {
                console.log('✅ Reutilizando instância global do Supabase');
                this.supabase = window.supabaseClient;
                this.initialized = true;
                return true;
            }

            console.log('📡 Criando nova instância do cliente Supabase...');
            this.supabase = supabase.createClient(
                window.SUPABASE_CONFIG.url, 
                window.SUPABASE_CONFIG.anonKey
            );

            // Armazenar instância globalmente para reutilização
            window.supabaseClient = this.supabase;
            window.supabaseClientInitialized = true;

            console.log('🔍 Testando conexão com banco de dados...');
            // Testar conexão
            const { data, error } = await this.supabase
                .from('empresa')
                .select('count')
                .limit(1);

            if (error) {
                console.error('❌ Erro na query de teste:', error);
                throw error;
            }

            this.initialized = true;
            console.log('✅ Supabase conectado com sucesso!');
            console.log('📊 Dados de teste retornados:', data);
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar com Supabase:', error);
            console.error('📋 Detalhes do erro:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return false;
        }
    }

    // ==============================================
    // OPERAÇÕES DE EMPRESA
    // ==============================================

    async getEmpresas() {
        try {
            console.log('🔍 Iniciando busca de empresas...');
            console.log('📊 Supabase client:', this.supabase);
            console.log('🔗 Conexão inicializada:', this.initialized);
            
            if (!this.supabase) {
                throw new Error('Cliente Supabase não inicializado');
            }
            
            if (!this.initialized) {
                throw new Error('Supabase não foi inicializado corretamente');
            }

            console.log('📡 Executando query para buscar empresas...');
            const { data, error } = await this.supabase
                .from('empresa')
                .select('*')
                .order('nome_empresa');

            console.log('📋 Resultado da query:', { data, error });

            if (error) {
                console.error('❌ Erro na query:', error);
                throw error;
            }
            
            console.log('✅ Empresas carregadas com sucesso:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro ao buscar empresas:', error);
            console.error('📊 Detalhes do erro:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
    }

    async createEmpresa(empresaData) {
        try {
            const { data, error } = await this.supabase
                .from('empresa')
                .insert([empresaData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar empresa:', error);
            throw error;
        }
    }

    async updateEmpresa(id, empresaData) {
        try {
            const { data, error } = await this.supabase
                .from('empresa')
                .update(empresaData)
                .eq('cod_empresa', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar empresa:', error);
            throw error;
        }
    }

    async deleteEmpresa(id) {
        try {
            const { error } = await this.supabase
                .from('empresa')
                .delete()
                .eq('cod_empresa', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar empresa:', error);
            throw error;
        }
    }

    // ==============================================
    // OPERAÇÕES DE USUÁRIO
    // ==============================================

    async getUsuarios() {
        try {
            const { data, error } = await this.supabase
                .from('usuario')
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa),
                    tipo_usuario:cod_tipo_usuario(nome_tipo_usuario, nivel_acesso)
                `)
                .order('nome_usuario');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }

    async createUsuario(usuarioData) {
        try {
            const { data, error } = await this.supabase
                .from('usuario')
                .insert([usuarioData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    }

    async updateUsuario(id, usuarioData) {
        try {
            const { data, error } = await this.supabase
                .from('usuario')
                .update(usuarioData)
                .eq('cod_usuario', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }

    async deleteUsuario(id) {
        try {
            const { error } = await this.supabase
                .from('usuario')
                .delete()
                .eq('cod_usuario', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            throw error;
        }
    }

    // ==============================================
    // OPERAÇÕES DE ÁREA
    // ==============================================

    async getAreas() {
        try {
            const { data, error } = await this.supabase
                .from('area')
                .select(`
                    cod_area,
                    nome_area,
                    cod_empresa,
                    empresa:cod_empresa(nome_empresa)
                `)
                .order('nome_area');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar áreas:', error);
            throw error;
        }
    }

    // Buscar áreas por empresa específica
    async getAreasByEmpresa(codEmpresa) {
        try {
            console.log('🔍 Buscando áreas para empresa:', codEmpresa);
            console.log('🔧 Supabase inicializado:', this.initialized);
            console.log('🔧 Cliente Supabase:', !!this.supabase);
            
            if (!this.initialized || !this.supabase) {
                console.error('❌ Supabase não inicializado');
                return [];
            }
            
            // Query simplificada - apenas campos essenciais
            const { data, error } = await this.supabase
                .from('area')
                .select(`
                    cod_area,
                    nome_area,
                    cod_empresa
                `)
                .eq('cod_empresa', codEmpresa)
                .order('nome_area');

            if (error) {
                console.error('❌ Erro ao buscar áreas por empresa:', error);
                console.error('❌ Detalhes do erro:', error.message, error.details, error.hint);
                
                // Se não há áreas, retornar array vazio
                if (error.message.includes('does not exist') || data?.length === 0) {
                    console.log('⚠️ Nenhuma área encontrada para a empresa:', codEmpresa);
                    return [];
                }
                
                return [];
            }

            console.log('✅ Áreas encontradas:', data);
            console.log('📊 Total de áreas:', data ? data.length : 0);
            
            // Se não há áreas, retornar array vazio
            if (!data || data.length === 0) {
                console.log('⚠️ Nenhuma área encontrada para a empresa:', codEmpresa);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar áreas por empresa:', error);
            return [];
        }
    }


    async createArea(areaData) {
        try {
            const { data, error } = await this.supabase
                .from('area')
                .insert([areaData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar área:', error);
            throw error;
        }
    }

    async updateArea(id, areaData) {
        try {
            const { data, error } = await this.supabase
                .from('area')
                .update(areaData)
                .eq('cod_area', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar área:', error);
            throw error;
        }
    }

    async deleteArea(id) {
        try {
            const { error } = await this.supabase
                .from('area')
                .delete()
                .eq('cod_area', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar área:', error);
            throw error;
        }
    }

    // ==============================================
    // OPERAÇÕES DE TIPO DE USUÁRIO
    // ==============================================

    async getTiposUsuario() {
        try {
            const { data, error } = await this.supabase
                .from('tipo_usuario')
                .select('*')
                .order('nivel_acesso');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar tipos de usuário:', error);
            throw error;
        }
    }

    async createTipoUsuario(tipoData) {
        try {
            const { data, error } = await this.supabase
                .from('tipo_usuario')
                .insert([tipoData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar tipo de usuário:', error);
            throw error;
        }
    }

    async updateTipoUsuario(id, tipoData) {
        try {
            const { data, error } = await this.supabase
                .from('tipo_usuario')
                .update(tipoData)
                .eq('cod_tipo_usuario', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar tipo de usuário:', error);
            throw error;
        }
    }

    async deleteTipoUsuario(id) {
        try {
            const { error } = await this.supabase
                .from('tipo_usuario')
                .delete()
                .eq('cod_tipo_usuario', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar tipo de usuário:', error);
            throw error;
        }
    }

    // ==============================================
    // OPERAÇÕES DE MODELO RIDEC
    // ==============================================

    async getModelosRidec() {
        try {
            const { data, error } = await this.supabase
                .from('modelo_ridec')
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa),
                    tipo_modelo:cod_tipo_modelo(nome_tipo_modelo)
                `)
                .eq('ies_ativo', 'S') // Apenas registros ativos
                .order('nome_modelo');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar modelos RIDEC:', error);
            throw error;
        }
    }

    // Buscar etapas de um modelo RIDEC específico
    async getEtapasModeloRidec(codModeloRidec) {
        try {
            console.log(`🔍 Buscando etapas do modelo RIDEC: ${codModeloRidec}`);
            
            const { data, error } = await this.supabase
                .from('modelo_etapa_ridec')
                .select(`
                    *,
                    uom:cod_uom(desc_uom)
                `)
                .eq('cod_modelo_ridec', codModeloRidec)
                .order('cod_tipo_etapa');

            if (error) {
                console.error('❌ Erro ao buscar etapas do modelo RIDEC:', error);
                console.error('📋 Detalhes do erro:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log(`✅ Etapas encontradas para modelo ${codModeloRidec}:`, data);
            console.log(`📊 Total de etapas encontradas: ${data ? data.length : 0}`);
            
            // Log detalhado de cada etapa
            if (data && data.length > 0) {
                data.forEach((etapa, index) => {
                    console.log(`📋 Etapa ${index + 1}:`, {
                        cod_modelo_etapa: etapa.cod_modelo_etapa,
                        cod_modelo_ridec: etapa.cod_modelo_ridec,
                        cod_tipo_etapa: etapa.cod_tipo_etapa,
                        desc_etapa_modelo: etapa.desc_etapa_modelo,
                        cod_uom: etapa.cod_uom,
                        valor_uom: etapa.valor_uom,
                        path_arquivo: etapa.path_arquivo,
                        uom: etapa.uom
                    });
                });
            } else {
                console.log('⚠️ Nenhuma etapa encontrada para este modelo');
            }
            
            return data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar etapas do modelo RIDEC:', error);
            return [];
        }
    }

    async createModeloRidec(modeloData) {
        try {
            console.log('📋 Criando modelo RIDEC com dados:', modeloData);
            console.log('📋 Tipo dos dados:', typeof modeloData);
            console.log('📋 Chaves dos dados:', Object.keys(modeloData));
            
            // Obter ID do usuário atual
            const userId = await this.getCurrentUserId();
            
            // Garantir que o registro seja criado como ativo
            const dataWithActive = {
                ...modeloData,
                ies_ativo: 'S',
                data_criacao: new Date().toISOString(),
                usuario_criacao: userId
            };
            
            const { data, error } = await this.supabase
                .from('modelo_ridec')
                .insert([dataWithActive])
                .select();

            if (error) {
                console.error('❌ Erro ao criar modelo RIDEC:', error);
                console.error('📋 Detalhes do erro:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            console.log('✅ Modelo RIDEC criado:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Erro ao criar modelo RIDEC:', error);
            console.error('📋 Dados que causaram o erro:', modeloData);
            throw error;
        }
    }

    // Criar modelo RIDEC completo com todas as etapas
    async createModeloRidecCompleto(ridecData) {
        try {
            console.log('🚀 Iniciando criação do modelo RIDEC completo...');
            console.log('📊 Dados recebidos:', ridecData);

            // Mapear unidades de tempo para códigos UOM
            const uomMapping = {
                'seconds': 'Segundos',
                'minutes': 'Minutos', 
                'hours': 'Horas',
                'days': 'Dias',
                'weeks': 'Semanas'
            };

            // Obter usuário atual para pegar cod_empresa correto
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.cod_empresa) {
                throw new Error('Usuário não encontrado ou sem empresa associada');
            }
            
            const codEmpresa = currentUser.cod_empresa;
            console.log('👤 Usuário atual:', currentUser);
            console.log('🏢 Código da empresa do usuário:', codEmpresa);
            
            // Buscar código da área usando a empresa correta do usuário
            const codArea = await this.getAreaByName(ridecData.area, codEmpresa);
            console.log('🏢 Código da área encontrado:', codArea, 'para área:', ridecData.area, 'empresa:', codEmpresa);
            
            // Determinar tipo do modelo baseado no timeControlMode
            const tipoModelo = ridecData.timeControlMode === 'detailed' ? 'Detalhado' : 'Simples';
            console.log(`🔍 Determinando tipo de modelo: ${tipoModelo}`);
            
            const codTipoModelo = await this.getTipoModeloByNome(tipoModelo);
            
            if (!codTipoModelo) {
                console.error(`❌ Tipo de modelo '${tipoModelo}' não encontrado na tabela tipo_modelo`);
                console.error('💡 Solução: Execute o script SQL setup-tipo-modelo-complete.sql no Supabase Dashboard');
                throw new Error(`Tipo de modelo '${tipoModelo}' não encontrado. Execute o script SQL setup-tipo-modelo-complete.sql`);
            }
            
            console.log(`✅ Tipo de modelo encontrado: ${tipoModelo} (ID: ${codTipoModelo})`);

            // Buscar códigos UOM para cada etapa
            const codUomRI = await this.getUomByDescription(uomMapping[ridecData.deadlineUnits.RI] || 'Horas');
            const codUomD = await this.getUomByDescription(uomMapping[ridecData.deadlineUnits.D] || 'Horas');
            const codUomE = await this.getUomByDescription(uomMapping[ridecData.deadlineUnits.E] || 'Horas');
            const codUomC = await this.getUomByDescription(uomMapping[ridecData.deadlineUnits.C] || 'Horas');

            console.log('🔍 Códigos UOM encontrados:', { codUomRI, codUomD, codUomE, codUomC });

            // Usar ridecMaxTime como valor_uom e ridecTimeUnit para buscar cod_uom
            const tempoTotal = ridecData.maxTime || 0;
            const unidadeTempo = ridecData.timeUnit || 'hours';

            // Buscar código UOM para a unidade de tempo
            const codUomTotal = await this.getUomByDescription(uomMapping[unidadeTempo] || 'Horas');

            console.log('📊 Dados do tempo total:', {
                ridecMaxTime: tempoTotal,
                ridecTimeUnit: unidadeTempo,
                codUomTotal,
                uomMapping: uomMapping[unidadeTempo]
            });

            // Criar modelo RIDEC (sem as colunas cod_m_etapa_*)
            const modeloData = {
                nome_modelo: ridecData.title,
                descricao_modelo: ridecData.description,
                cod_area: codArea,
                cod_empresa: codEmpresa,
                valor_nc: ridecData.nonconformityPercent || 0,
                cod_uom: codUomTotal || 1,
                valor_uom: tempoTotal,
                cod_tipo_modelo: codTipoModelo
            };

            // Validar dados antes de enviar
            console.log('🔍 Validando dados do modelo...');
            if (!modeloData.nome_modelo) {
                throw new Error('Nome do modelo é obrigatório');
            }
            if (!modeloData.cod_empresa) {
                throw new Error('Código da empresa é obrigatório');
            }
            console.log('✅ Dados do modelo validados com sucesso');

            console.log('📋 Criando modelo RIDEC...');
            console.log('📋 Dados do modelo:', modeloData);
            const modelo = await this.createModeloRidec(modeloData);

            console.log('✅ Modelo RIDEC criado com sucesso:', modelo);

            // Agora criar as etapas na tabela modelo_etapa_ridec
            const etapasCriadas = await this.criarEtapasModeloRidec(modelo.cod_modelo_ridec, ridecData, {
                codUomRI: codUomRI || 1,
                codUomD: codUomD || 1,
                codUomE: codUomE || 1,
                codUomC: codUomC || 1
            });

            console.log('✅ Etapas do modelo criadas com sucesso:', etapasCriadas);
            
            return {
                modelo,
                etapas: etapasCriadas
            };

        } catch (error) {
            console.error('❌ Erro ao criar modelo RIDEC completo:', error);
            throw error;
        }
    }

    async updateModeloRidec(id, modeloData) {
        try {
            const { data, error } = await this.supabase
                .from('modelo_ridec')
                .update(modeloData)
                .eq('cod_modelo_ridec', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar modelo RIDEC:', error);
            throw error;
        }
    }

    // Buscar tipo de modelo por nome
    async getTipoModeloByNome(nomeTipo) {
        try {
            console.log(`🔍 Buscando tipo de modelo: ${nomeTipo}`);
            
            const { data, error } = await this.supabase
                .from('tipo_modelo')
                .select('cod_tipo_modelo, nome_tipo_modelo')
                .eq('nome_tipo_modelo', nomeTipo)
                .single();

            if (error) {
                console.error('Erro na consulta ao buscar tipo de modelo:', error);
                throw error;
            }
            
            console.log(`✅ Tipo de modelo encontrado:`, data);
            return data?.cod_tipo_modelo;
        } catch (error) {
            console.error('Erro ao buscar tipo de modelo:', error);
            
            // Se a tabela não existir, tentar criar os dados padrão
            if (error.code === 'PGRST116' || error.message?.includes('relation "tipo_modelo" does not exist')) {
                console.log('⚠️ Tabela tipo_modelo não existe. Execute o script SQL setup-tipo-modelo-complete.sql');
            }
            
            return null;
        }
    }

    // Criar etapas do modelo RIDEC na tabela modelo_etapa_ridec
    async criarEtapasModeloRidec(codModeloRidec, ridecData, codUoms) {
        try {
            console.log('📝 Criando etapas do modelo RIDEC...');
            console.log('📊 Dados recebidos:', { codModeloRidec, ridecData, codUoms });
            
            // Verificar se o modelo é do tipo "Simples" (controle simples)
            const isSimpleMode = ridecData.timeControlMode === 'simple';
            console.log('🔍 Modo de controle:', isSimpleMode ? 'Simples' : 'Detalhado');
            
            if (isSimpleMode) {
                // ==============================================
                // MODO SIMPLES: CRIAR APENAS UMA ETAPA COM cod_tipo_etapa = 6
                // ==============================================
                console.log('🔵 MODO SIMPLES: Criando etapa única com cod_tipo_etapa = 6...');
                
                // Usar o tempo total do RIDEC para a etapa simples
                const tempoTotal = ridecData.maxTime || 0;
                const unidadeTempo = ridecData.timeUnit || 'hours';
                
                // Mapear unidade de tempo para código UOM
                const uomMapping = {
                    'seconds': 'Segundos',
                    'minutes': 'Minutos', 
                    'hours': 'Horas',
                    'days': 'Dias',
                    'weeks': 'Semanas'
                };
                
                const codUomTotal = await this.getUomByDescription(uomMapping[unidadeTempo] || 'Horas');
                
                const etapaSimplesData = {
                    cod_modelo_ridec: codModeloRidec,
                    cod_tipo_etapa: 6, // 6 = Controle Simples
                    desc_etapa_modelo: ridecData.description || 'Processo RIDEC Completo',
                    cod_uom: codUomTotal || 1,
                    valor_uom: tempoTotal,
                    path_arquivo: '',
                    cod_m_etapa_anterior: 0 // Etapa simples não tem etapa anterior
                };
                
                console.log('📋 Dados da etapa simples:', etapaSimplesData);
                
                const etapaSimples = await this.criarEtapaModeloRidec(etapaSimplesData);
                
                console.log('✅ Etapa simples criada com sucesso!');
                console.log('📊 Resumo da etapa:');
                console.log('  Etapa Simples: ID =', etapaSimples.cod_modelo_etapa, ', cod_tipo_etapa =', etapaSimples.cod_tipo_etapa);
                
                return {
                    SIMPLES: etapaSimples
                };
                
            } else {
                // ==============================================
                // MODO DETALHADO: CRIAR ETAPAS RI, D, E, C
                // ==============================================
                console.log('🔵 MODO DETALHADO: Criando etapas RI, D, E, C...');
                
                const etapas = [];
                let x = 0; // Variável x para armazenar o cod_modelo_etapa da etapa anterior

                // ==============================================
                // ETAPA 1: GRAVAR ETAPA RI
                // ==============================================
                console.log('🔵 ETAPA 1: Gravando etapa RI...');
                const etapaRIData = {
                    cod_modelo_ridec: codModeloRidec,
                    cod_tipo_etapa: 1, // 1 = RI
                    desc_etapa_modelo: ridecData.stageDescriptions.RI || 'Requisitos e Início',
                    cod_uom: codUoms.codUomRI,
                    valor_uom: ridecData.deadlines.RI || 0,
                    path_arquivo: ridecData.pathRI || '',
                    cod_m_etapa_anterior: 0 // Apenas RI tem cod_m_etapa_anterior = 0
                };
                console.log('📋 Dados da etapa RI:', etapaRIData);
                
                const etapaRI = await this.criarEtapaModeloRidec(etapaRIData);
                etapas.push(etapaRI);
                
                // OBTÉM O VALOR DE x = cod_modelo_etapa DA LINHA GRAVADA
                x = etapaRI.cod_modelo_etapa;
                console.log('✅ Etapa RI gravada. x =', x);

                // ==============================================
                // ETAPA 2: GRAVAR ETAPA D
                // ==============================================
                console.log('🔵 ETAPA 2: Gravando etapa D...');
                const etapaDData = {
                    cod_modelo_ridec: codModeloRidec,
                    cod_tipo_etapa: 2, // 2 = D
                    desc_etapa_modelo: ridecData.stageDescriptions.D || 'Desenvolvimento',
                    cod_uom: codUoms.codUomD,
                    valor_uom: ridecData.deadlines.D || 0,
                    path_arquivo: ridecData.pathD || '',
                    cod_m_etapa_anterior: x // UTILIZA x PARA O VALOR DE cod_m_etapa_anterior
                };
                console.log('📋 Dados da etapa D:', etapaDData);
                console.log('🔗 Usando x (cod_m_etapa_anterior) =', x);
                
                const etapaD = await this.criarEtapaModeloRidec(etapaDData);
                etapas.push(etapaD);
                
                // OBTÉM O VALOR DE x = cod_modelo_etapa DA LINHA GRAVADA
                x = etapaD.cod_modelo_etapa;
                console.log('✅ Etapa D gravada. x =', x);

                // ==============================================
                // ETAPA 3: GRAVAR ETAPA E
                // ==============================================
                console.log('🔵 ETAPA 3: Gravando etapa E...');
                const etapaEData = {
                    cod_modelo_ridec: codModeloRidec,
                    cod_tipo_etapa: 3, // 3 = E
                    desc_etapa_modelo: ridecData.stageDescriptions.E || 'Execução e Testes',
                    cod_uom: codUoms.codUomE,
                    valor_uom: ridecData.deadlines.E || 0,
                    path_arquivo: ridecData.pathE || '',
                    cod_m_etapa_anterior: x // UTILIZA x PARA O VALOR DE cod_m_etapa_anterior
                };
                console.log('📋 Dados da etapa E:', etapaEData);
                console.log('🔗 Usando x (cod_m_etapa_anterior) =', x);
                
                const etapaE = await this.criarEtapaModeloRidec(etapaEData);
                etapas.push(etapaE);
                
                // OBTÉM O VALOR DE x = cod_modelo_etapa DA LINHA GRAVADA
                x = etapaE.cod_modelo_etapa;
                console.log('✅ Etapa E gravada. x =', x);

                // ==============================================
                // ETAPA 4: GRAVAR ETAPA C
                // ==============================================
                console.log('🔵 ETAPA 4: Gravando etapa C...');
                const etapaCData = {
                    cod_modelo_ridec: codModeloRidec,
                    cod_tipo_etapa: 4, // 4 = C
                    desc_etapa_modelo: ridecData.stageDescriptions.C || 'Conclusão',
                    cod_uom: codUoms.codUomC,
                    valor_uom: ridecData.deadlines.C || 0,
                    path_arquivo: ridecData.pathC || '',
                    cod_m_etapa_anterior: x // UTILIZA x PARA O VALOR DE cod_m_etapa_anterior
                };
                console.log('📋 Dados da etapa C:', etapaCData);
                console.log('🔗 Usando x (cod_m_etapa_anterior) =', x);
                
                const etapaC = await this.criarEtapaModeloRidec(etapaCData);
                etapas.push(etapaC);
                
                // OBTÉM O VALOR DE x = cod_modelo_etapa DA LINHA GRAVADA
                x = etapaC.cod_modelo_etapa;
                console.log('✅ Etapa C gravada. x =', x);

                console.log('🎉 TODAS AS ETAPAS DETALHADAS CRIADAS COM SUCESSO!');
                console.log('📊 Resumo das etapas:');
                console.log('  RI: ID =', etapaRI.cod_modelo_etapa, ', cod_m_etapa_anterior =', etapaRI.cod_m_etapa_anterior);
                console.log('  D:  ID =', etapaD.cod_modelo_etapa, ', cod_m_etapa_anterior =', etapaD.cod_m_etapa_anterior);
                console.log('  E:  ID =', etapaE.cod_modelo_etapa, ', cod_m_etapa_anterior =', etapaE.cod_m_etapa_anterior);
                console.log('  C:  ID =', etapaC.cod_modelo_etapa, ', cod_m_etapa_anterior =', etapaC.cod_m_etapa_anterior);

                return {
                    RI: etapaRI,
                    D: etapaD,
                    E: etapaE,
                    C: etapaC
                };
            }

        } catch (error) {
            console.error('❌ Erro ao criar etapas do modelo RIDEC:', error);
            throw error;
        }
    }

    // Criar uma etapa individual do modelo RIDEC
    async criarEtapaModeloRidec(etapaData) {
        try {
            console.log('🔧 Inserindo etapa na tabela modelo_etapa_ridec:');
            console.log('📋 Dados completos:', JSON.stringify(etapaData, null, 2));
            console.log('🔍 Campo cod_m_etapa_anterior:', etapaData.cod_m_etapa_anterior);
            console.log('🔍 Tipo do campo cod_m_etapa_anterior:', typeof etapaData.cod_m_etapa_anterior);
            
            const { data, error } = await this.supabase
                .from('modelo_etapa_ridec')
                .insert([etapaData]) // Adicionar array para insert
                .select()
                .single();

            if (error) {
                console.error('❌ Erro ao inserir etapa:', error);
                console.error('📋 Dados que causaram erro:', etapaData);
                console.error('📋 Detalhes do erro:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }
            
            console.log('✅ Etapa criada com sucesso:');
            console.log('📋 Dados retornados:', JSON.stringify(data, null, 2));
            console.log('🔍 cod_m_etapa_anterior gravado:', data.cod_m_etapa_anterior);
            return data;
        } catch (error) {
            console.error('❌ Erro ao criar etapa do modelo RIDEC:', error);
            console.error('📋 Dados que causaram erro:', etapaData);
            throw error;
        }
    }

    async deleteModeloRidec(id) {
        try {
            console.log('🔍 Iniciando soft delete para ID:', id);
            console.log('🔍 Tipo do ID:', typeof id);
            
            // Verificar se o ID é válido
            if (!id || id === 'undefined' || id === 'null') {
                throw new Error('ID do modelo RIDEC inválido');
            }
            
            // Primeiro, verificar se o registro existe
            console.log('🔍 Verificando se o modelo existe...');
            const { data: existingModel, error: checkError } = await this.supabase
                .from('modelo_ridec')
                .select('cod_modelo_ridec, nome_modelo')
                .eq('cod_modelo_ridec', id)
                .single();
                
            if (checkError) {
                console.error('❌ Erro ao verificar modelo existente:', checkError);
                throw new Error(`Modelo não encontrado: ${checkError.message}`);
            }
            
            console.log('✅ Modelo encontrado:', existingModel);
            
            // Obter ID do usuário atual
            const userId = await this.getCurrentUserId();
            console.log('👤 ID do usuário obtido:', userId);
            
            // Tentar soft delete primeiro (se as colunas existirem)
            try {
                console.log('📝 Tentando soft delete...');
                const { data, error } = await this.supabase
                    .from('modelo_ridec')
                    .update({ 
                        ies_ativo: 'N',
                        data_exclusao: new Date().toISOString(),
                        usuario_exclusao: userId
                    })
                    .eq('cod_modelo_ridec', id)
                    .select();

                if (error) {
                    console.warn('⚠️ Soft delete falhou, tentando exclusão física:', error);
                    // Fallback para exclusão física se soft delete falhar
                    const { data: deleteData, error: deleteError } = await this.supabase
                        .from('modelo_ridec')
                        .delete()
                        .eq('cod_modelo_ridec', id)
                        .select();
                        
                    if (deleteError) {
                        throw deleteError;
                    }
                    
                    console.log('✅ Modelo RIDEC excluído fisicamente:', deleteData);
                    return deleteData;
                }
                
                console.log('✅ Modelo RIDEC marcado como inativo:', data);
                return data;
                
            } catch (softDeleteError) {
                console.warn('⚠️ Soft delete não disponível, usando exclusão física:', softDeleteError);
                
                // Fallback para exclusão física
                const { data, error } = await this.supabase
                    .from('modelo_ridec')
                    .delete()
                    .eq('cod_modelo_ridec', id)
                    .select();
                    
                if (error) {
                    console.error('❌ Erro detalhado do Supabase:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                    throw error;
                }
                
                console.log('✅ Modelo RIDEC excluído fisicamente:', data);
                return data;
            }
            
        } catch (error) {
            console.error('Erro ao excluir modelo RIDEC:', error);
            throw error;
        }
    }

    // Obter ID do usuário atual
    async getCurrentUserId() {
        try {
            // Tentar obter da sessão do Supabase (assíncrono)
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (!error && user) {
                return user.id;
            }
            
            // Fallback: tentar obter do localStorage
            const sessionData = localStorage.getItem('supabase.auth.token');
            if (sessionData) {
                try {
                    const parsed = JSON.parse(sessionData);
                    return parsed.user?.id || 'unknown';
                } catch (parseError) {
                    console.warn('Erro ao fazer parse do localStorage:', parseError);
                }
            }
            
            // Fallback adicional: tentar obter da sessão atual
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session?.user?.id) {
                return session.user.id;
            }
            
            return 'unknown';
        } catch (error) {
            console.warn('Não foi possível obter ID do usuário:', error);
            return 'unknown';
        }
    }

    // Reativar modelo RIDEC (soft delete reverso)
    async reativarModeloRidec(id) {
        try {
            // Obter ID do usuário atual
            const userId = await this.getCurrentUserId();
            
            const { data, error } = await this.supabase
                .from('modelo_ridec')
                .update({ 
                    ies_ativo: 'S',
                    data_reativacao: new Date().toISOString(),
                    usuario_reativacao: userId
                })
                .eq('cod_modelo_ridec', id)
                .select();

            if (error) throw error;
            
            console.log('✅ Modelo RIDEC reativado:', data);
            return data;
        } catch (error) {
            console.error('Erro ao reativar modelo RIDEC:', error);
            throw error;
        }
    }

    // Buscar modelos RIDEC excluídos (para administradores)
    async getModelosRidecExcluidos() {
        try {
            const { data, error } = await this.supabase
                .from('modelo_ridec')
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa)
                `)
                .eq('ies_ativo', 'N') // Apenas registros inativos
                .order('data_exclusao', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar modelos RIDEC excluídos:', error);
            throw error;
        }
    }

    // Testar se as tabelas de etapas existem
    async testarTabelasEtapas() {
        const tabelas = ['m_etapa_ri', 'm_etapa_d', 'm_etapa_e', 'm_etapa_c', 'uom'];
        const resultados = {};
        
        for (const tabela of tabelas) {
            try {
                console.log(`🔍 Testando tabela: ${tabela}`);
                const { data, error } = await this.supabase
                    .from(tabela)
                    .select('*')
                    .limit(1);
                
                resultados[tabela] = !error;
                console.log(`${tabela}: ${!error ? '✅ Existe' : '❌ Erro'}`);
                if (error) console.log(`Erro:`, error);
                if (data && data.length > 0) {
                    console.log(`📊 Exemplo de dados ${tabela}:`, data[0]);
                }
            } catch (error) {
                resultados[tabela] = false;
                console.log(`${tabela}: ❌ Erro -`, error);
            }
        }
        
        return resultados;
    }

    // Testar busca de UOM específica
    async testarUOM(codUom) {
        try {
            console.log(`🔍 Testando busca de UOM com código: ${codUom}`);
            const { data, error } = await this.supabase
                .from('uom')
                .select('cod_uom, desc_uom')
                .eq('cod_uom', codUom)
                .single();
            
            if (error) {
                console.warn('⚠️ Erro ao buscar UOM:', error);
                return null;
            }
            
            console.log('✅ UOM encontrada:', data);
            return data;
        } catch (error) {
            console.warn('⚠️ Erro ao testar UOM:', error);
            return null;
        }
    }

    // Testar estrutura da tabela UOM
    async testarEstruturaUOM() {
        try {
            console.log('🔍 Testando estrutura da tabela UOM...');
            
            // Primeiro, tentar buscar todas as UOMs para ver a estrutura
            const { data: todasUOMs, error: errorTodas } = await this.supabase
                .from('uom')
                .select('*')
                .limit(5);
            
            if (errorTodas) {
                console.warn('⚠️ Erro ao buscar todas as UOMs:', errorTodas);
                return false;
            }
            
            console.log('📊 Estrutura da tabela UOM:', todasUOMs);
            
            // Testar busca específica
            if (todasUOMs && todasUOMs.length > 0) {
                const primeiraUOM = todasUOMs[0];
                console.log('🧪 Testando busca da primeira UOM:', primeiraUOM.cod_uom);
                return await this.testarUOM(primeiraUOM.cod_uom);
            }
            
            return true;
        } catch (error) {
            console.warn('⚠️ Erro ao testar estrutura UOM:', error);
            return false;
        }
    }

    // Buscar modelo RIDEC com informações completas das etapas
    async getModeloRidecCompleto(codModeloRidec) {
        try {
            console.log('🔍 Buscando modelo RIDEC completo:', codModeloRidec, 'tipo:', typeof codModeloRidec);
            
            // Validar se o código do modelo é válido
            if (!codModeloRidec || isNaN(codModeloRidec) || codModeloRidec <= 0) {
                console.error('❌ Código do modelo inválido:', codModeloRidec);
                throw new Error(`Código do modelo inválido: ${codModeloRidec}`);
            }
            
            // Primeiro testar se as tabelas existem
            const tabelasExistem = await this.testarTabelasEtapas();
            console.log('📊 Status das tabelas:', tabelasExistem);
            
            // Buscar o modelo principal (apenas se ativo)
            const { data: modelo, error: modeloError } = await this.supabase
                .from('modelo_ridec')
                .select('*')
                .eq('cod_modelo_ridec', codModeloRidec)
                .eq('ies_ativo', 'S') // Apenas modelos ativos
                .single();

            if (modeloError) {
                console.error('❌ Erro ao buscar modelo:', modeloError);
                throw modeloError;
            }
            if (!modelo) {
                console.warn('⚠️ Modelo não encontrado');
                return null;
            }

            console.log('✅ Modelo encontrado:', modelo);

            // Buscar etapas da tabela modelo_etapa_ridec
            const etapasInfo = {
                ri: null,
                d: null,
                e: null,
                c: null
            };

            try {
                console.log('🔍 Buscando etapas da tabela modelo_etapa_ridec...');
                const { data: etapas, error: etapasError } = await this.supabase
                    .from('modelo_etapa_ridec')
                    .select(`
                        *,
                        uom:cod_uom(desc_uom),
                        tipo_etapa:cod_tipo_etapa(nome_tipo_etapa)
                    `)
                    .eq('cod_modelo_ridec', codModeloRidec)
                    .order('cod_tipo_etapa');

                if (etapasError) {
                    console.warn('⚠️ Erro ao buscar etapas da modelo_etapa_ridec:', etapasError);
                } else if (etapas && etapas.length > 0) {
                    console.log('✅ Etapas encontradas na modelo_etapa_ridec:', etapas.length);
                    
                    // Mapear etapas por tipo
                    etapas.forEach(etapa => {
                        console.log(`🔍 Processando etapa tipo ${etapa.cod_tipo_etapa}:`, etapa);
                        
                        // Mapear códigos de tipo para nomes das etapas
                        const tipoMapping = {
                            1: 'ri', // RI
                            2: 'd',  // D
                            3: 'e',  // E
                            4: 'c',  // C
                            5: 'a',  // A
                            6: 'simples' // SIMPLES
                        };
                        
                        const tipoEtapa = tipoMapping[etapa.cod_tipo_etapa];
                        if (tipoEtapa) {
                            // Estruturar dados da etapa para compatibilidade com o código existente
                            etapasInfo[tipoEtapa] = {
                                [`nome_etapa_${tipoEtapa}`]: etapa.desc_etapa_modelo || `Etapa ${tipoEtapa.toUpperCase()}`,
                                valor_uom: etapa.valor_uom,
                                uom: etapa.uom ? {
                                    desc_uom: etapa.uom.desc_uom,
                                    cod_uom: etapa.uom.cod_uom
                                } : null,
                                tipo_etapa: etapa.tipo_etapa ? {
                                    nome_tipo_etapa: etapa.tipo_etapa.nome_tipo_etapa,
                                    cod_tipo_etapa: etapa.cod_tipo_etapa
                                } : null,
                                cod_modelo_etapa: etapa.cod_modelo_etapa,
                                cod_tipo_etapa: etapa.cod_tipo_etapa,
                                path_arquivo: etapa.path_arquivo
                            };
                            
                            console.log(`✅ Etapa ${tipoEtapa.toUpperCase()} configurada:`, etapasInfo[tipoEtapa]);
                        } else {
                            console.warn(`⚠️ Tipo de etapa desconhecido: ${etapa.cod_tipo_etapa}`);
                        }
                    });
                } else {
                    console.log('ℹ️ Nenhuma etapa encontrada na modelo_etapa_ridec');
                }
            } catch (error) {
                console.warn('⚠️ Erro ao buscar etapas da modelo_etapa_ridec:', error);
            }

            return {
                modelo,
                etapas: etapasInfo
            };

        } catch (error) {
            console.error('❌ Erro ao buscar modelo RIDEC completo:', error);
            throw error;
        }
    }

    // ==============================================
    // OPERAÇÕES DE CARD RIDEC (OCORRÊNCIAS)
    // ==============================================

    async getCardsRidec() {
        try {
            const { data, error } = await this.supabase
                .from('card_ridec')
                .select(`
                    *,
                    modelo_ridec:cod_modelo_ridec(nome_modelo, descricao_modelo),
                    empresa:cod_empresa(nome_empresa),
                    usuario:cod_usuario(nome_usuario)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar cards RIDEC:', error);
            throw error;
        }
    }

    async createCardRidec(cardData) {
        try {
            const { data, error } = await this.supabase
                .from('card_ridec')
                .insert([cardData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar card RIDEC:', error);
            throw error;
        }
    }

    async updateCardRidec(id, cardData) {
        try {
            const { data, error } = await this.supabase
                .from('card_ridec')
                .update(cardData)
                .eq('cod_card_ridec', id)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar card RIDEC:', error);
            throw error;
        }
    }

    async deleteCardRidec(id) {
        try {
            const { error } = await this.supabase
                .from('card_ridec')
                .delete()
                .eq('cod_card_ridec', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar card RIDEC:', error);
            throw error;
        }
    }

    // ==============================================
    // OPERAÇÕES DE ETAPAS DE MODELO RIDEC
    // ==============================================

    // Criar etapa RI
    async createEtapaRI(etapaData) {
        try {
            console.log('📝 Criando etapa RI com dados:', etapaData);
            const { data, error } = await this.supabase
                .from('m_etapa_ri')
                .insert([etapaData])
                .select();

            if (error) {
                console.error('❌ Erro ao criar etapa RI:', error);
                throw error;
            }
            console.log('✅ Etapa RI criada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Erro ao criar etapa RI:', error);
            throw error;
        }
    }

    // Criar etapa D
    async createEtapaD(etapaData) {
        try {
            console.log('📝 Criando etapa D com dados:', etapaData);
            const { data, error } = await this.supabase
                .from('m_etapa_d')
                .insert([etapaData])
                .select();

            if (error) {
                console.error('❌ Erro ao criar etapa D:', error);
                throw error;
            }
            console.log('✅ Etapa D criada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Erro ao criar etapa D:', error);
            throw error;
        }
    }

    // Criar etapa E
    async createEtapaE(etapaData) {
        try {
            console.log('📝 Criando etapa E com dados:', etapaData);
            const { data, error } = await this.supabase
                .from('m_etapa_e')
                .insert([etapaData])
                .select();

            if (error) {
                console.error('❌ Erro ao criar etapa E:', error);
                throw error;
            }
            console.log('✅ Etapa E criada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Erro ao criar etapa E:', error);
            throw error;
        }
    }

    // Criar etapa C
    async createEtapaC(etapaData) {
        try {
            console.log('📝 Criando etapa C com dados:', etapaData);
            const { data, error } = await this.supabase
                .from('m_etapa_c')
                .insert([etapaData])
                .select();

            if (error) {
                console.error('❌ Erro ao criar etapa C:', error);
                throw error;
            }
            console.log('✅ Etapa C criada:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Erro ao criar etapa C:', error);
            throw error;
        }
    }

    // Buscar UOM por descrição
    async getUomByDescription(descricao) {
        try {
            console.log(`🔍 Buscando UOM para: "${descricao}"`);
            
            const { data, error } = await this.supabase
                .from('uom')
                .select('cod_uom, desc_uom')
                .ilike('desc_uom', `%${descricao}%`)
                .limit(1);

            if (error) {
                console.error('Erro na consulta UOM:', error);
                throw error;
            }
            
            const result = data && data.length > 0 ? data[0].cod_uom : null;
            console.log(`✅ UOM encontrado: ${result} para "${descricao}"`);
            return result;
        } catch (error) {
            console.error('Erro ao buscar UOM:', error);
            return null;
        }
    }

    // Buscar área por nome
    async getAreaByName(nomeArea, codEmpresa) {
        try {
            console.log(`🏢 Buscando área: "${nomeArea}" para empresa ${codEmpresa}`);
            
            const { data, error } = await this.supabase
                .from('area')
                .select('cod_area, nome_area')
                .eq('nome_area', nomeArea)
                .eq('cod_empresa', codEmpresa)
                .limit(1);

            if (error) {
                console.error('Erro na consulta área:', error);
                throw error;
            }
            
            const result = data && data.length > 0 ? data[0].cod_area : null;
            console.log(`✅ Área encontrada: ${result} para "${nomeArea}"`);
            return result;
        } catch (error) {
            console.error('Erro ao buscar área:', error);
            return null;
        }
    }

    // ==============================================
    // OPERAÇÕES DE USUÁRIO
    // ==============================================
    
    // Obter usuário atual
    getCurrentUser() {
        try {
            // PRIORIDADE 1: Obter usuário do sistema de autenticação (AuthChecker)
            if (window.authChecker && window.authChecker.getCurrentUser) {
                const user = window.authChecker.getCurrentUser();
                if (user) {
                    console.log('👤 Usuário via AuthChecker:', user);
                    return user;
                }
            }
            
            // PRIORIDADE 2: Fallback - obter dados diretamente da sessão
            const sessionData = this.getSessionDataDirectly();
            if (sessionData && sessionData.user) {
                console.log('👤 Usuário via sessão:', sessionData.user);
                return sessionData.user;
            }
            
            console.log('❌ Nenhum usuário encontrado');
            return null;
        } catch (error) {
            console.error('❌ Erro ao obter usuário atual:', error);
            return null;
        }
    }
    
    // Obter dados de sessão diretamente
    getSessionDataDirectly() {
        try {
            let sessionData = localStorage.getItem('ridec_session');
            if (!sessionData) {
                sessionData = sessionStorage.getItem('ridec_session');
            }
            
            if (sessionData) {
                return JSON.parse(sessionData);
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erro ao obter dados de sessão:', error);
            return null;
        }
    }

    // ==============================================
    // OPERAÇÕES DE UOM (UNIDADE DE MEDIDA)
    // ==============================================

    async getUoms() {
        try {
            const { data, error } = await this.supabase
                .from('uom')
                .select(`
                    *,
                    empresa:cod_empresa(nome_empresa)
                `)
                .order('desc_uom');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar UOMs:', error);
            throw error;
        }
    }

    async createUom(uomData) {
        try {
            const { data, error } = await this.supabase
                .from('uom')
                .insert([uomData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar UOM:', error);
            throw error;
        }
    }

    // ==============================================
    // FUNÇÕES AUXILIARES
    // ==============================================

    // Verificar se está conectado
    isConnected() {
        return this.initialized && this.supabase !== null;
    }

    // Obter cliente Supabase
    getClient() {
        return this.supabase;
    }

    // Executar query customizada
    async executeQuery(query) {
        try {
            const { data, error } = await this.supabase.rpc(query);
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao executar query:', error);
            throw error;
        }
    }
}

// Criar instância global
const supabaseDB = new SupabaseDatabase();

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM carregado, iniciando Supabase...');
    console.log('🔍 Verificando configuração do Supabase...');
    
    // Verificar se a configuração está disponível
    if (typeof window.SUPABASE_CONFIG === 'undefined') {
        console.error('❌ SUPABASE_CONFIG não encontrado');
        window.dispatchEvent(new CustomEvent('supabaseReady', { detail: { success: false, error: 'Configuração não encontrada' } }));
        return;
    }
    
    console.log('✅ Configuração do Supabase encontrada:', window.SUPABASE_CONFIG.url);
    
    try {
        const success = await supabaseDB.init();
        if (success) {
            console.log('✅ Supabase inicializado com sucesso!');
            // Disparar evento customizado para notificar outros scripts
            window.dispatchEvent(new CustomEvent('supabaseReady', { detail: { success: true } }));
        } else {
            console.error('❌ Falha na inicialização do Supabase');
            window.dispatchEvent(new CustomEvent('supabaseReady', { detail: { success: false } }));
        }
    } catch (error) {
        console.error('❌ Erro na inicialização do Supabase:', error);
        window.dispatchEvent(new CustomEvent('supabaseReady', { detail: { success: false, error } }));
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.supabaseDB = supabaseDB;
}


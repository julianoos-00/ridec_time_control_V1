// Gerenciador de operações do banco de dados Supabase
// Este arquivo contém todas as funções para interagir com o banco

class SupabaseDatabase {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    // Inicializar conexão com Supabase
    async init() {
        try {
            console.log('🚀 Iniciando conexão com Supabase...');
            
            // Validar configuração
            if (typeof validateConfig === 'function') {
                const configValid = validateConfig();
                if (!configValid) {
                    throw new Error('Configuração do Supabase inválida');
                }
            }
            
            if (typeof supabase === 'undefined') {
                throw new Error('Biblioteca do Supabase não carregada');
            }

            console.log('📡 Criando cliente Supabase...');
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.anonKey
            );

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
                    *,
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
                    empresa:cod_empresa(nome_empresa)
                `)
                .order('nome_modelo');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar modelos RIDEC:', error);
            throw error;
        }
    }

    async createModeloRidec(modeloData) {
        try {
            const { data, error } = await this.supabase
                .from('modelo_ridec')
                .insert([modeloData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar modelo RIDEC:', error);
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

    async deleteModeloRidec(id) {
        try {
            const { error } = await this.supabase
                .from('modelo_ridec')
                .delete()
                .eq('cod_modelo_ridec', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar modelo RIDEC:', error);
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
    await supabaseDB.init();
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.supabaseDB = supabaseDB;
}


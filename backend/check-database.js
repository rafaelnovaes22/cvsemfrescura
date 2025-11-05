const { Sequelize } = require('sequelize');

// Configuração do banco
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// Modelo AnalysisResults
const AnalysisResults = sequelize.define('AnalysisResults', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    resumeFileName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    result: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    timestamps: true
});

async function checkDatabase() {
    try {
        console.log('🔄 Conectando ao banco de dados...');

        // Verificar total de análises
        const count = await AnalysisResults.count();
        console.log(`📊 Total de análises na base: ${count}`);

        if (count === 0) {
            console.log('❌ Não há análises na base de dados!');
            return;
        }

        // Buscar as últimas 3 análises
        const analyses = await AnalysisResults.findAll({
            limit: 3,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'userId', 'resumeFileName', 'createdAt', 'result']
        });

        console.log('\n🔍 Últimas análises encontradas:');
        analyses.forEach((analysis, index) => {
            console.log(`\n--- Análise ${index + 1} ---`);
            console.log(`ID: ${analysis.id}`);
            console.log(`User ID: ${analysis.userId}`);
            console.log(`Arquivo: ${analysis.resumeFileName}`);
            console.log(`Data: ${analysis.createdAt}`);

            // Verificar estrutura do result
            try {
                const result = JSON.parse(analysis.result);
                console.log(`📋 Campos no result:`, Object.keys(result));

                // Verificar campos específicos
                console.log(`✅ Tem conclusão: ${!!result.conclusion}`);
                console.log(`✅ Tem resumo: ${!!result.resumo}`);
                console.log(`✅ Tem experiência: ${!!result.experiencia_profissional}`);
                console.log(`✅ Tem jobs: ${!!result.jobs && result.jobs.length > 0 ? result.jobs.length + ' vagas' : 'não'}`);

                if (result.conclusion) {
                    console.log(`📝 Conclusão (primeiros 100 chars): "${result.conclusion.substring(0, 100)}..."`);
                }

            } catch (e) {
                console.log(`❌ Erro ao fazer parse do result: ${e.message}`);
                console.log(`📄 Result raw (primeiros 200 chars): ${analysis.result.substring(0, 200)}...`);
            }
        });

        // Verificar análise específica do usuário 1
        console.log('\n🔍 Verificando análises do usuário 1 (Rafael):');
        const userAnalyses = await AnalysisResults.findAll({
            where: { userId: 1 },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        console.log(`📊 Total de análises do usuário 1: ${userAnalyses.length}`);
        userAnalyses.forEach((analysis, index) => {
            console.log(`${index + 1}. ID: ${analysis.id}, Arquivo: ${analysis.resumeFileName}, Data: ${analysis.createdAt}`);
        });

    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error);
    } finally {
        await sequelize.close();
        console.log('\n✅ Verificação concluída');
    }
}

checkDatabase();


require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_NAME = process.env.DB_NAME || 'marcador_truco';
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

let partidasCollection;

// Rota inicial: verificar se a API está funcionando
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API do Marcador de Truco funcionando!',
  });
});

// Consultar o histórico de partidas
app.get('/api/partidas', async (req, res) => {
  try {
    const partidas = await partidasCollection
      .find({})
      .sort({ criadaEm: -1 })
      .toArray();

    res.json(partidas);
  } catch (erro) {
    console.error('Erro ao consultar partidas:', erro.message);
    res.status(500).json({
      erro: 'Erro ao consultar partidas.',
    });
  }
});

// Salvar uma partida finalizada
app.post('/api/partidas', async (req, res) => {
  try {
    const {
      nomeNos,
      nomeEles,
      placarNos,
      placarEles,
      vencedor,
    } = req.body;

    if (
      typeof nomeNos !== 'string' ||
      typeof nomeEles !== 'string' ||
      typeof vencedor !== 'string' ||
      !Number.isInteger(placarNos) ||
      !Number.isInteger(placarEles) ||
      placarNos < 0 ||
      placarEles < 0 ||
      placarNos > 12 ||
      placarEles > 12 ||
      Math.max(placarNos, placarEles) !== 12
    ) {
      return res.status(400).json({
        erro: 'Dados inválidos. A partida precisa ter um vencedor com 12 pontos.',
      });
    }

    const partida = {
      nomeNos: nomeNos.trim().slice(0, 30),
      nomeEles: nomeEles.trim().slice(0, 30),
      placarNos,
      placarEles,
      vencedor: vencedor.trim().slice(0, 30),
      criadaEm: new Date(),
    };

    const resultado = await partidasCollection.insertOne(partida);

    res.status(201).json({
      mensagem: 'Partida salva com sucesso!',
      id: resultado.insertedId,
      partida,
    });
  } catch (erro) {
    console.error('Erro ao salvar partida:', erro.message);
    res.status(500).json({
      erro: 'Erro ao salvar partida.',
    });
  }
});

// Conectar ao MongoDB e iniciar a API
async function iniciarServidor() {
  if (!MONGODB_URI) {
    console.error(
      'Configure MONGODB_URI no arquivo .env.'
    );
    process.exit(1);
  }

  const cliente = new MongoClient(MONGODB_URI);

  try {
    await cliente.connect();

    const banco = cliente.db(DB_NAME);
    partidasCollection = banco.collection('partidas');

    await partidasCollection.createIndex({
      criadaEm: -1,
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API disponível na porta ${PORT}.`);
      console.log(`Banco conectado: ${DB_NAME}`);
    });
  } catch (erro) {
    console.error(
      'Não foi possível iniciar a API:',
      erro.message
    );

    await cliente.close().catch(() => {});
    process.exit(1);
  }
}

iniciarServidor();


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

// Salvar uma partida finalizada sem duplicar registros
app.post('/api/partidas', async (req, res) => {
  try {
    const {
      partidaId,
      nomeNos,
      nomeEles,
      placarNos,
      placarEles,
      vencedor,
    } = req.body;

    // Validar o identificador e os dados da partida
    if (
      typeof partidaId !== 'string' ||
      partidaId.trim().length === 0 ||
      partidaId.trim().length > 100 ||
      typeof nomeNos !== 'string' ||
      nomeNos.trim().length === 0 ||
      typeof nomeEles !== 'string' ||
      nomeEles.trim().length === 0 ||
      typeof vencedor !== 'string' ||
      vencedor.trim().length === 0 ||
      !Number.isInteger(placarNos) ||
      !Number.isInteger(placarEles) ||
      placarNos < 0 ||
      placarEles < 0 ||
      placarNos > 12 ||
      placarEles > 12 ||
      Math.max(placarNos, placarEles) !== 12
    ) {
      return res.status(400).json({
        erro: 'Dados inválidos. Informe um identificador e uma partida finalizada com 12 pontos.',
      });
    }

    const id = partidaId.trim();

    const partida = {
      partidaId: id,
      nomeNos: nomeNos.trim().slice(0, 30),
      nomeEles: nomeEles.trim().slice(0, 30),
      placarNos,
      placarEles,
      vencedor: vencedor.trim().slice(0, 30),
      criadaEm: new Date(),
    };

    // Se a partida já existir, devolver o registro existente
    const existente = await partidasCollection.findOne({
      partidaId: id,
    });

    if (existente) {
      return res.status(200).json({
        mensagem: 'Esta partida já estava salva.',
        duplicada: true,
        partida: existente,
      });
    }

    const resultado = await partidasCollection.insertOne(partida);

    return res.status(201).json({
      mensagem: 'Partida salva com sucesso!',
      duplicada: false,
      id: resultado.insertedId,
      partida,
    });
  } catch (erro) {
    // Proteção adicional para duas requisições simultâneas
    if (erro.code === 11000 && req.body?.partidaId) {
      try {
        const existente = await partidasCollection.findOne({
          partidaId: req.body.partidaId.trim(),
        });

        if (existente) {
          return res.status(200).json({
            mensagem: 'Esta partida já estava salva.',
            duplicada: true,
            partida: existente,
          });
        }
      } catch (erroConsulta) {
        console.error(
          'Erro ao consultar partida existente:',
          erroConsulta.message
        );
      }
    }

    console.error('Erro ao salvar partida:', erro.message);

    return res.status(500).json({
      erro: 'Erro ao salvar partida.',
    });
  }
});

// Conectar ao MongoDB e iniciar a API
async function iniciarServidor() {
  if (!MONGODB_URI) {
    console.error('Configure MONGODB_URI no arquivo .env.');
    process.exit(1);
  }

  const cliente = new MongoClient(MONGODB_URI);

  try {
    await cliente.connect();

    const banco = cliente.db(DB_NAME);
    partidasCollection = banco.collection('partidas');

    // Índice do histórico
    await partidasCollection.createIndex({
      criadaEm: -1,
    });

    // Índice único para novas partidas identificadas.
    // Registros antigos sem partidaId são preservados.
    await partidasCollection.createIndex(
      { partidaId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          partidaId: { $type: 'string' },
        },
      }
    );

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

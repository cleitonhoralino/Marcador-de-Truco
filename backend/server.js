
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

app.get('/', (req, res) => {
  res.json({ mensagem: 'API do Marcador de Truco funcionando!' });
});

app.get('/api/partidas', async (req, res) => {
  try {
    const partidas = await partidasCollection
      .find({})
      .sort({ criadaEm: -1, _id: -1 })
      .toArray();

    res.json(partidas);
  } catch (erro) {
    console.error('Erro ao consultar partidas:', erro.message);
    res.status(500).json({ erro: 'Erro ao consultar partidas.' });
  }
});

app.post('/api/partidas', async (req, res) => {
  try {
    const {
      partidaId,
      numeroPartida,
      nomeNos,
      nomeEles,
      placarNos,
      placarEles,
      vencedor,
    } = req.body;

    if (
      typeof partidaId !== 'string' ||
      !partidaId.trim() ||
      typeof nomeNos !== 'string' ||
      !nomeNos.trim() ||
      typeof nomeEles !== 'string' ||
      !nomeEles.trim() ||
      typeof vencedor !== 'string' ||
      !vencedor.trim() ||
      !Number.isInteger(placarNos) ||
      !Number.isInteger(placarEles) ||
      placarNos < 0 ||
      placarNos > 12 ||
      placarEles < 0 ||
      placarEles > 12 ||
      Math.max(placarNos, placarEles) !== 12
    ) {
      return res.status(400).json({
        erro: 'Dados inválidos para salvar a partida.',
      });
    }

    const id = partidaId.trim();
    const existente = await partidasCollection.findOne({ partidaId: id });

    if (existente) {
      return res.status(200).json({
        mensagem: 'Esta partida já estava salva.',
        duplicada: true,
        partida: existente,
      });
    }

    let numero =
      Number.isInteger(numeroPartida) && numeroPartida > 0
        ? numeroPartida
        : null;

    if (numero !== null) {
      const numeroExistente = await partidasCollection.findOne({
        numeroPartida: numero,
      });

      if (numeroExistente) {
        numero = null;
      }
    }

    if (numero === null) {
      const maiorNumero = await partidasCollection
        .find({ numeroPartida: { $type: 'number' } })
        .sort({ numeroPartida: -1 })
        .limit(1)
        .next();

      numero = (maiorNumero?.numeroPartida || 0) + 1;
    }

    const agora = new Date();

    const partida = {
      partidaId: id,
      numeroPartida: numero,
      nomeNos: nomeNos.trim().slice(0, 30),
      nomeEles: nomeEles.trim().slice(0, 30),
      placarNos,
      placarEles,
      vencedor: vencedor.trim().slice(0, 30),
      data: agora.toLocaleString('pt-BR'),
      criadaEm: agora,
    };

    const resultado = await partidasCollection.insertOne(partida);

    return res.status(201).json({
      mensagem: 'Partida salva com sucesso!',
      duplicada: false,
      id: resultado.insertedId,
      partida,
    });
  } catch (erro) {
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
    return res.status(500).json({ erro: 'Erro ao salvar partida.' });
  }
});

// Numera registros antigos sem apagar ou recriar nenhuma partida.
async function migrarNumeracaoAntiga() {
  const partidasSemNumero = await partidasCollection
    .find({
      $or: [
        { numeroPartida: { $exists: false } },
        { numeroPartida: { $not: { $type: 'number' } } },
      ],
    })
    .sort({ criadaEm: 1, _id: 1 })
    .toArray();

  if (partidasSemNumero.length === 0) {
    console.log('Numeração do histórico já está atualizada.');
    return;
  }

  const maiorNumero = await partidasCollection
    .find({ numeroPartida: { $type: 'number' } })
    .sort({ numeroPartida: -1 })
    .limit(1)
    .next();

  let proximoNumero = maiorNumero?.numeroPartida || 0;

  for (const partida of partidasSemNumero) {
    proximoNumero += 1;

    await partidasCollection.updateOne(
      { _id: partida._id },
      { $set: { numeroPartida: proximoNumero } }
    );
  }

  console.log(
    `${partidasSemNumero.length} partida(s) antiga(s) numerada(s).`
  );
}

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

    await migrarNumeracaoAntiga();

    await partidasCollection.createIndex(
      { partidaId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          partidaId: { $type: 'string' },
        },
      }
    );

    await partidasCollection.createIndex(
      { numeroPartida: 1 },
      {
        unique: true,
        partialFilterExpression: {
          numeroPartida: { $type: 'number' },
        },
      }
    );

    await partidasCollection.createIndex({ criadaEm: -1 });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API disponível na porta ${PORT}.`);
      console.log(`Banco conectado: ${DB_NAME}`);
    });
  } catch (erro) {
    console.error('Não foi possível iniciar a API:', erro.message);
    await cliente.close().catch(() => {});
    process.exit(1);
  }
}

iniciarServidor();

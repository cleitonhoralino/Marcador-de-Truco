
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();
const STORAGE_KEY = '@marcador_truco_dados_v2';
const VALORES_TRUCO = [3, 6, 9, 12];
const PONTOS_PARA_VENCER = 12;

function estadoInicial(partidas = []) {
  return {
    nomeNos: 'NÓS',
    nomeEles: 'ELES',
    placar: [0, 0],
    valorMao: 1,
    equipeSolicitante: 0,
    pedido: null,
    aguardandoVencedor: false,
    partidaEncerrada: false,
    partidas,
    desfazerStack: [],
    mensagem: 'Boa partida!',
    partidaId: Date.now(),
  };
}

function criarSnapshot(dados) {
  return {
    ...dados,
    placar: [...dados.placar],
    partidas: [...dados.partidas],
    desfazerStack: [],
  };
}

function criarHistorico(estado, placar, partidasAtuais) {
  const equipeVencedora = placar.findIndex(
    (pontos) => pontos >= PONTOS_PARA_VENCER
  );

  if (equipeVencedora === -1) return partidasAtuais;

  if (
    partidasAtuais.some(
      (partida) => partida.partidaId === estado.partidaId
    )
  ) {
    return partidasAtuais;
  }

  return [
    {
      partidaId: estado.partidaId,
      nomeNos: estado.nomeNos,
      nomeEles: estado.nomeEles,
      placarNos: placar[0],
      placarEles: placar[1],
      vencedor:
        equipeVencedora === 0 ? estado.nomeNos : estado.nomeEles,
      data: new Date().toLocaleString('pt-BR'),
    },
    ...partidasAtuais,
  ];
}

function registrarPontos(estado, equipe, pontos, mensagem) {
  const novoPlacar = [...estado.placar];

  // A pontuação nunca ultrapassa 12.
  novoPlacar[equipe] = Math.min(
    PONTOS_PARA_VENCER,
    novoPlacar[equipe] + pontos
  );

  const venceu = novoPlacar[equipe] >= PONTOS_PARA_VENCER;

  const partidas = venceu
    ? criarHistorico(estado, novoPlacar, estado.partidas)
    : estado.partidas;

  return {
    ...estado,
    placar: novoPlacar,
    partidas,
    valorMao: 1,
    pedido: null,
    aguardandoVencedor: false,
    partidaEncerrada: venceu,
    equipeSolicitante: equipe,
    mensagem: venceu
      ? `${equipe === 0 ? estado.nomeNos : estado.nomeEles} venceu a partida!`
      : mensagem,
  };
}

export default function App() {
  const [dados, setDados] = useState(estadoInicial());
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const salvo = await AsyncStorage.getItem(STORAGE_KEY);

        if (salvo) {
          const dadosSalvos = JSON.parse(salvo);

          setDados({
            ...estadoInicial(dadosSalvos.partidas || []),
            ...dadosSalvos,
            partidas: dadosSalvos.partidas || [],
            desfazerStack: [],
          });
        }
      } catch (erro) {
        console.log('Erro ao carregar os dados:', erro);
      } finally {
        setCarregado(true);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!carregado) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dados)).catch(
      (erro) => console.log('Erro ao salvar os dados:', erro)
    );
  }, [dados, carregado]);

  function novaPartida() {
    setDados((anterior) => estadoInicial(anterior.partidas));
  }

  function alterarEquipeSolicitante(equipe) {
    if (
      dados.pedido ||
      dados.aguardandoVencedor ||
      dados.partidaEncerrada
    ) {
      return;
    }

    setDados((anterior) => ({
      ...anterior,
      equipeSolicitante: equipe,
      mensagem: `Vez de ${equipe === 0 ? anterior.nomeNos : anterior.nomeEles}.`,
    }));
  }

  function alterarNome(equipe, nome) {
    setDados((anterior) => ({
      ...anterior,
      [equipe === 0 ? 'nomeNos' : 'nomeEles']: nome,
    }));
  }

  function pedirTruco(valor) {
    if (
      dados.pedido ||
      dados.aguardandoVencedor ||
      dados.partidaEncerrada
    ) {
      return;
    }

    const proximoValor = VALORES_TRUCO.find(
      (item) => item > dados.valorMao
    );

    if (valor !== proximoValor) return;

    setDados((anterior) => {
      const nome =
        anterior.equipeSolicitante === 0
          ? anterior.nomeNos
          : anterior.nomeEles;

      return {
        ...anterior,
        desfazerStack: [
          ...anterior.desfazerStack,
          criarSnapshot(anterior),
        ].slice(-50),
        pedido: {
          valorSolicitado: valor,
          valorAnterior: anterior.valorMao,
          equipe: anterior.equipeSolicitante,
        },
        mensagem: `${nome} pediu ${valor === 3 ? 'TRUCO' : `TRUCO DE ${valor}`}!`,
      };
    });
  }

  function aumentarTruco() {
    if (!dados.pedido || dados.partidaEncerrada) return;

    const pedidoAtual = dados.pedido;
    const proximoValor = VALORES_TRUCO.find(
      (valor) => valor > pedidoAtual.valorSolicitado
    );

    if (!proximoValor) return;

    const equipeQueAumentou = 1 - pedidoAtual.equipe;

    setDados((anterior) => {
      const nome =
        equipeQueAumentou === 0
          ? anterior.nomeNos
          : anterior.nomeEles;

      return {
        ...anterior,
        desfazerStack: [
          ...anterior.desfazerStack,
          criarSnapshot(anterior),
        ].slice(-50),
        equipeSolicitante: equipeQueAumentou,
        pedido: {
          valorSolicitado: proximoValor,
          valorAnterior: pedidoAtual.valorSolicitado,
          equipe: equipeQueAumentou,
        },
        mensagem: `${nome} aumentou para ${proximoValor}!`,
      };
    });
  }

  function aceitarTruco() {
    if (!dados.pedido || dados.partidaEncerrada) return;

    setDados((anterior) => ({
      ...anterior,
      desfazerStack: [
        ...anterior.desfazerStack,
        criarSnapshot(anterior),
      ].slice(-50),
      valorMao: anterior.pedido.valorSolicitado,
      pedido: null,
      aguardandoVencedor: true,
      mensagem: `Pedido de ${anterior.pedido.valorSolicitado} aceito. Quem venceu a mão?`,
    }));
  }

  function correr() {
    if (!dados.pedido || dados.partidaEncerrada) return;

    setDados((anterior) => {
      const pedido = anterior.pedido;
      const nome =
        pedido.equipe === 0 ? anterior.nomeNos : anterior.nomeEles;

      const estadoComHistorico = {
        ...anterior,
        desfazerStack: [
          ...anterior.desfazerStack,
          criarSnapshot(anterior),
        ].slice(-50),
      };

      return registrarPontos(
        estadoComHistorico,
        pedido.equipe,
        pedido.valorAnterior,
        `${nome} ganhou ${pedido.valorAnterior} ponto(s) porque a outra equipe correu.`
      );
    });
  }

  function finalizarMao(equipeVencedora) {
    if (!dados.aguardandoVencedor || dados.partidaEncerrada) return;

    setDados((anterior) => {
      const nome =
        equipeVencedora === 0 ? anterior.nomeNos : anterior.nomeEles;

      const estadoComHistorico = {
        ...anterior,
        desfazerStack: [
          ...anterior.desfazerStack,
          criarSnapshot(anterior),
        ].slice(-50),
      };

      return registrarPontos(
        estadoComHistorico,
        equipeVencedora,
        anterior.valorMao,
        `${nome} ganhou a mão e recebeu ${anterior.valorMao} ponto(s).`
      );
    });
  }

  function adicionarPonto(equipe, quantidade = 1) {
    if (
      dados.pedido ||
      dados.aguardandoVencedor ||
      dados.partidaEncerrada
    ) {
      return;
    }

    if (quantidade < 0 && dados.placar[equipe] <= 0) return;

    setDados((anterior) => {
      const novoPlacar = [...anterior.placar];

      // Permite diminuir, mas nunca ficar abaixo de zero ou acima de 12.
      novoPlacar[equipe] = Math.max(
        0,
        Math.min(
          PONTOS_PARA_VENCER,
          novoPlacar[equipe] + quantidade
        )
      );

      const venceu = novoPlacar[equipe] >= PONTOS_PARA_VENCER;
      const nome =
        equipe === 0 ? anterior.nomeNos : anterior.nomeEles;

      const partidas = venceu
        ? criarHistorico(anterior, novoPlacar, anterior.partidas)
        : anterior.partidas;

      return {
        ...anterior,
        placar: novoPlacar,
        partidas,
        partidaEncerrada: venceu,
        desfazerStack: [
          ...anterior.desfazerStack,
          criarSnapshot(anterior),
        ].slice(-50),
        mensagem: venceu
          ? `${nome} venceu a partida!`
          : quantidade > 0
            ? `${nome} ganhou 1 ponto.`
            : `Ponto removido de ${nome}.`,
      };
    });
  }

  function desfazer() {
    setDados((anterior) => {
      if (anterior.desfazerStack.length === 0) {
        return {
          ...anterior,
          mensagem: 'Não há ações para desfazer.',
        };
      }

      const pilha = anterior.desfazerStack;
      const ultimoEstado = pilha[pilha.length - 1];

      return {
        ...ultimoEstado,
        desfazerStack: pilha.slice(0, -1),
      };
    });
  }

  function zerarPlacar() {
    setDados((anterior) => ({
      ...estadoInicial(anterior.partidas),
      nomeNos: anterior.nomeNos,
      nomeEles: anterior.nomeEles,
    }));
  }

  if (!carregado) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.carregando}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.textoCarregando}>
            Carregando marcador...
          </Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Inicio"
          screenOptions={{
            headerStyle: { backgroundColor: '#111827' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#F3F4F6' },
          }}
        >
          <Stack.Screen
            name="Inicio"
            options={{ title: 'Marcador de Truco' }}
          >
            {(props) => (
              <InicioScreen {...props} novaPartida={novaPartida} />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Partida"
            options={{ title: 'Partida em andamento' }}
          >
            {(props) => (
              <PartidaScreen
                {...props}
                dados={dados}
                alterarNome={alterarNome}
                alterarEquipeSolicitante={alterarEquipeSolicitante}
                pedirTruco={pedirTruco}
                aumentarTruco={aumentarTruco}
                aceitarTruco={aceitarTruco}
                correr={correr}
                finalizarMao={finalizarMao}
                adicionarPonto={adicionarPonto}
                desfazer={desfazer}
                zerarPlacar={zerarPlacar}
                novaPartida={novaPartida}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Historico"
            options={{ title: 'Histórico de partidas' }}
          >
            {(props) => (
              <HistoricoScreen {...props} partidas={dados.partidas} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function InicioScreen({ navigation, novaPartida }) {
  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.inicioConteudo}>
        <Text style={styles.iconeCartas}>♠ ♥ ♣ ♦</Text>
        <Text style={styles.tituloInicio}>Marcador de Truco</Text>
        <Text style={styles.subtituloInicio}>
          Acompanhe a pontuação da sua partida.
        </Text>

        <TouchableOpacity
          style={styles.botaoPrincipal}
          onPress={() => {
            novaPartida();
            navigation.navigate('Partida');
          }}
        >
          <Text style={styles.textoBotaoBranco}>Nova partida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => navigation.navigate('Historico')}
        >
          <Text style={styles.textoBotaoEscuro}>
            Histórico de partidas
          </Text>
        </TouchableOpacity>

        <Text style={styles.rodapeInicio}>Boa partida e bom truco!</Text>
      </View>
    </SafeAreaView>
  );
}

function PartidaScreen({
  navigation,
  dados,
  alterarNome,
  alterarEquipeSolicitante,
  pedirTruco,
  aumentarTruco,
  aceitarTruco,
  correr,
  finalizarMao,
  adicionarPonto,
  desfazer,
  zerarPlacar,
  novaPartida,
}) {
  const proximoValor = VALORES_TRUCO.find(
    (valor) => valor > dados.valorMao
  );

  const proximoAumento = dados.pedido
    ? VALORES_TRUCO.find(
        (valor) => valor > dados.pedido.valorSolicitado
      )
    : null;

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudoPartida}>
        <Text style={styles.mensagem}>{dados.mensagem}</Text>

        <View style={styles.placarContainer}>
          {[0, 1].map((equipe) => {
            const nome = equipe === 0 ? dados.nomeNos : dados.nomeEles;
            const pontos = dados.placar[equipe];

            return (
              <React.Fragment key={equipe}>
                {equipe === 1 && (
                  <View style={styles.separadorPlacar}>
                    <Text style={styles.textoVs}>VS</Text>
                  </View>
                )}

                <View style={styles.equipe}>
                  <TextInput
                    style={styles.nomeEquipe}
                    value={nome}
                    onChangeText={(texto) => alterarNome(equipe, texto)}
                    maxLength={18}
                    editable={!dados.partidaEncerrada}
                    placeholder="Nome da equipe"
                    placeholderTextColor="#9CA3AF"
                  />

                  <Text style={styles.pontos}>{pontos}</Text>
                  <Text style={styles.rotuloPontos}>PONTOS</Text>

                  <TouchableOpacity
                    style={styles.botaoPonto}
                    onPress={() => adicionarPonto(equipe, 1)}
                    disabled={
                      dados.partidaEncerrada ||
                      !!dados.pedido ||
                      dados.aguardandoVencedor
                    }
                  >
                    <Text style={styles.textoBotaoBranco}>+1 ponto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.botaoDiminuir,
                      pontos <= 0 && styles.botaoDesabilitado,
                    ]}
                    onPress={() => adicionarPonto(equipe, -1)}
                    disabled={
                      pontos <= 0 ||
                      dados.partidaEncerrada ||
                      !!dados.pedido ||
                      dados.aguardandoVencedor
                    }
                  >
                    <Text style={styles.textoDiminuir}>−1 ponto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.botaoSelecionar,
                      dados.equipeSolicitante === equipe &&
                        styles.equipeSelecionada,
                    ]}
                    onPress={() => alterarEquipeSolicitante(equipe)}
                    disabled={
                      dados.partidaEncerrada ||
                      !!dados.pedido ||
                      dados.aguardandoVencedor
                    }
                  >
                    <Text style={styles.textoBotaoEscuro}>
                      {dados.equipeSolicitante === equipe
                        ? 'Equipe da vez'
                        : 'Selecionar equipe'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {!dados.pedido &&
          !dados.aguardandoVencedor &&
          !dados.partidaEncerrada && (
            <View style={styles.cartao}>
              <Text style={styles.tituloSecao}>Valor da mão</Text>
              <Text style={styles.valorMao}>
                {dados.valorMao}{' '}
                {dados.valorMao === 1 ? 'ponto' : 'pontos'}
              </Text>

              {proximoValor ? (
                <TouchableOpacity
                  style={styles.botaoTruco}
                  onPress={() => pedirTruco(proximoValor)}
                >
                  <Text style={styles.textoBotaoBranco}>
                    {proximoValor === 3
                      ? 'Pedir TRUCO'
                      : `Pedir ${proximoValor}`}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.textoAjuda}>
                  Esta mão já está no valor máximo.
                </Text>
              )}

              <Text style={styles.textoAjuda}>
                Selecione a equipe da vez antes de pedir truco.
              </Text>
            </View>
          )}

        {dados.pedido && (
          <View style={styles.cartao}>
            <Text style={styles.tituloSecao}>Pedido de truco</Text>

            <Text style={styles.textoPedido}>
              {dados.pedido.equipe === 0 ? dados.nomeNos : dados.nomeEles}{' '}
              pediu {dados.pedido.valorSolicitado} pontos!
            </Text>

            <Text style={styles.textoAjuda}>
              A outra equipe pode aceitar, correr ou aumentar a aposta.
            </Text>

            <View style={styles.linhaBotoes}>
              <TouchableOpacity
                style={[styles.botaoResposta, styles.botaoAceitar]}
                onPress={aceitarTruco}
              >
                <Text style={styles.textoBotaoBranco}>Aceitar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoResposta, styles.botaoCorrer]}
                onPress={correr}
              >
                <Text style={styles.textoBotaoBranco}>Correr</Text>
              </TouchableOpacity>
            </View>

            {proximoAumento && (
              <TouchableOpacity
                style={styles.botaoAumentar}
                onPress={aumentarTruco}
              >
                <Text style={styles.textoBotaoAumentar}>
                  Aumentar para {proximoAumento}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {dados.aguardandoVencedor && (
          <View style={styles.cartao}>
            <Text style={styles.tituloSecao}>Quem ganhou a mão?</Text>

            <Text style={styles.textoAjuda}>
              A mão vale {dados.valorMao}{' '}
              {dados.valorMao === 1 ? 'ponto' : 'pontos'}.
            </Text>

            <TouchableOpacity
              style={[styles.botaoResposta, styles.botaoAceitar]}
              onPress={() => finalizarMao(0)}
            >
              <Text style={styles.textoBotaoBranco}>
                {dados.nomeNos} venceu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botaoResposta,
                styles.botaoAceitar,
                styles.espacoTopo,
              ]}
              onPress={() => finalizarMao(1)}
            >
              <Text style={styles.textoBotaoBranco}>
                {dados.nomeEles} venceu
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {dados.partidaEncerrada && (
          <View style={styles.cartaoVitoria}>
            <Text style={styles.tituloVitoria}>Fim de partida!</Text>

            <Text style={styles.textoVitoria}>
              {dados.placar[0] >= 12 ? dados.nomeNos : dados.nomeEles} venceu!
            </Text>

            <TouchableOpacity
              style={styles.botaoPrincipal}
              onPress={() => {
                novaPartida();
                navigation.replace('Partida');
              }}
            >
              <Text style={styles.textoBotaoBranco}>Nova partida</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => navigation.navigate('Historico')}
            >
              <Text style={styles.textoBotaoEscuro}>Ver histórico</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.linhaAcoes}>
          <TouchableOpacity style={styles.botaoAcao} onPress={desfazer}>
            <Text style={styles.textoBotaoEscuro}>Desfazer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoAcao} onPress={zerarPlacar}>
            <Text style={styles.textoBotaoEscuro}>Zerar placar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkHistorico}
          onPress={() => navigation.navigate('Historico')}
        >
          <Text style={styles.textoLink}>Consultar histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkHistorico}
          onPress={() => navigation.navigate('Inicio')}
        >
          <Text style={styles.textoLink}>Voltar ao início</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoricoScreen({ partidas }) {
  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudoHistorico}>
        <Text style={styles.tituloHistorico}>Partidas anteriores</Text>

        {partidas.length === 0 ? (
          <View style={styles.cartao}>
            <Text style={styles.textoVazio}>
              Nenhuma partida finalizada ainda.
            </Text>
            <Text style={styles.textoAjuda}>
              Quando uma equipe atingir 12 pontos, o resultado aparecerá aqui.
            </Text>
          </View>
        ) : (
          partidas.map((partida) => (
            <View
              key={String(partida.partidaId)}
              style={styles.cartaoHistorico}
            >
              <Text style={styles.vencedorHistorico}>
                Vencedor: {partida.vencedor}
              </Text>

              <Text style={styles.placarHistorico}>
                {partida.nomeNos} {partida.placarNos} x {partida.placarEles}{' '}
                {partida.nomeEles}
              </Text>

              <Text style={styles.dataHistorico}>{partida.data}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCarregando: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  tela: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  inicioConteudo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconeCartas: {
    color: '#15803D',
    fontSize: 30,
    marginBottom: 16,
    letterSpacing: 4,
  },
  tituloInicio: {
    color: '#111827',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtituloInicio: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 32,
  },
  botaoPrincipal: {
    backgroundColor: '#15803D',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  textoBotaoBranco: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botaoSecundario: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  textoBotaoEscuro: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rodapeInicio: {
    color: '#9CA3AF',
    marginTop: 36,
    fontSize: 14,
  },
  conteudoPartida: {
    padding: 16,
    paddingBottom: 32,
  },
  mensagem: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 15,
    marginBottom: 16,
    fontWeight: '600',
  },
  placarContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    elevation: 2,
  },
  equipe: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    padding: 4,
  },
  nomeEquipe: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    width: '100%',
    paddingVertical: 8,
  },
  pontos: {
    color: '#15803D',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 12,
  },
  rotuloPontos: {
    color: '#6B7280',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 14,
  },
  botaoPonto: {
    backgroundColor: '#15803D',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botaoDiminuir: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  textoDiminuir: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  botaoDesabilitado: {
    opacity: 0.4,
  },
  equipeSelecionada: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  botaoSelecionar: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginTop: 8,
  },
  separadorPlacar: {
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  textoVs: {
    color: '#9CA3AF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
    elevation: 1,
  },
  tituloSecao: {
    fontSize: 20,
    color: '#111827',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  valorMao: {
    color: '#15803D',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  botaoTruco: {
    backgroundColor: '#B91C1C',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoAjuda: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  textoPedido: {
    color: '#111827',
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  botaoResposta: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAceitar: {
    backgroundColor: '#15803D',
  },
  botaoCorrer: {
    backgroundColor: '#B91C1C',
  },
  botaoAumentar: {
    backgroundColor: '#FACC15',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotaoAumentar: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 'bold',
  },
  espacoTopo: {
    marginTop: 10,
  },
  cartaoVitoria: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  tituloVitoria: {
    color: '#166534',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textoVitoria: {
    color: '#166534',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 12,
  },
  linhaAcoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  botaoAcao: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  linkHistorico: {
    padding: 12,
    alignItems: 'center',
  },
  textoLink: {
    color: '#15803D',
    fontWeight: '600',
    fontSize: 14,
  },
  conteudoHistorico: {
    padding: 16,
    paddingBottom: 32,
  },
  tituloHistorico: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  cartaoHistorico: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#15803D',
    elevation: 1,
  },
  vencedorHistorico: {
    color: '#15803D',
    fontSize: 17,
    fontWeight: 'bold',
  },
  placarHistorico: {
    color: '#111827',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  dataHistorico: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  textoVazio: {
    color: '#111827',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

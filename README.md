# Marcador de Truco

Aplicativo mobile desenvolvido em React Native com Expo para registrar e acompanhar a pontuação de partidas de truco.

## Objetivo

O projeto tem como objetivo disponibilizar uma interface simples para iniciar partidas, acompanhar a pontuação das equipes e consultar o histórico de partidas realizadas.

## Funcionalidades implementadas

- Tela inicial com acesso ao histórico e à criação de partidas.
- Início de uma nova partida.
- Exibição da pontuação das equipes NÓS e ELES.
- Controle dos valores de truco: 3, 6, 9 e 12 pontos.
- Ações para aceitar, aumentar e subtrair pontos.
- Identificação do vencedor da partida.
- Histórico de partidas realizadas.
- Persistência local dos dados utilizando AsyncStorage.

## Tecnologias utilizadas

- React Native
- Expo
- JavaScript
- React Navigation
- AsyncStorage

## Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- Node.js, preferencialmente uma versão LTS compatível com o projeto.
- npm.
- Git.
- Android Studio com um emulador Android configurado ou um dispositivo Android com Expo Go compatível com a versão do SDK utilizada.

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/cleitonhoralino/Marcador-de-Truco.git
```

### 2. Acessar a pasta

```bash
cd Marcador-de-Truco
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Iniciar o Expo

```bash
npx expo start
```

### 5. Executar no Android

Com o emulador Android iniciado, utilize a opção de abrir o projeto pelo Expo Go, conforme as opções apresentadas pelo Expo no terminal.

Caso necessário, consulte os comandos exibidos no terminal para selecionar o modo de execução adequado.

## Persistência dos dados

O aplicativo utiliza AsyncStorage para armazenar localmente os dados das partidas e permitir a consulta ao histórico.

A persistência é local ao aplicativo. A sincronização remota entre dispositivos e a autenticação de usuários não fazem parte do escopo desta etapa.

## Escopo desta entrega

Esta etapa contempla a implementação das telas, a navegação entre elas e a persistência local dos dados. As regras completas de negócio do truco, a persistência remota e a autenticação de usuários não são requisitos desta entrega.

## Autor

Cleiton Horalino

Projeto acadêmico desenvolvido para a disciplina de Desenvolvimento de Aplicativos Móveis.

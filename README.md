# Marcador de Truco

Aplicativo mobile desenvolvido com React Native e Expo para registrar a pontuação de partidas de truco, acompanhar os resultados e consultar o histórico de partidas realizadas.

## Objetivo

O projeto tem como objetivo disponibilizar uma interface simples e intuitiva para iniciar partidas, acompanhar a pontuação das equipes e consultar partidas anteriores, utilizando armazenamento local e integração com um banco de dados MongoDB.

## Funcionalidades implementadas

- Tela inicial com acesso ao histórico e à criação de novas partidas.
- Início e reinicialização de partidas.
- Exibição da pontuação das equipes NÓS e ELES.
- Controle dos valores de truco: 3, 6, 9 e 12 pontos.
- Ações para adicionar e subtrair pontos.
- Ações para aceitar e aumentar o valor do truco.
- Identificação do vencedor da partida.
- Histórico das partidas realizadas.
- Persistência local dos dados utilizando AsyncStorage.
- Backend para consulta e registro de partidas.
- Integração com MongoDB para armazenamento remoto dos resultados.
- Sincronização das partidas com o banco de dados e indicação do status da sincronização.

## Tecnologias utilizadas

### Aplicativo mobile

- React Native
- Expo
- JavaScript
- React Navigation
- AsyncStorage

### Backend e banco de dados

- Node.js
- Express
- MongoDB
- MongoDB Atlas
- dotenv
- CORS

## Pré-requisitos

Antes de executar o projeto, é necessário ter:

- Node.js em uma versão compatível com as dependências do projeto.
- npm.
- Git.
- Android Studio com um emulador Android configurado ou dispositivo Android compatível com Expo Go.
- Uma instância MongoDB acessível, local ou hospedada no MongoDB Atlas.
- Credenciais válidas para conexão com o banco de dados.

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/cleitonhoralino/Marcador-de-Truco.git
```

### 2. Acessar a pasta do projeto

```bash
cd Marcador-de-Truco
```

### 3. Instalar as dependências do aplicativo

```bash
npm install
```

### 4. Configurar o backend

Acessar a pasta do backend:

```bash
cd backend
```

Instalar as dependências:

```bash
npm install
```

Criar um arquivo chamado `.env` dentro da pasta `backend`, com as configurações necessárias para a conexão ao MongoDB:

```env
PORT=3001
DB_NAME=marcador_truco
MONGODB_URI=sua_string_de_conexao_mongodb
```

Substituir `sua_string_de_conexao_mongodb` pela string de conexão válida do banco de dados.

**Importante:** o arquivo `.env` contém informações de configuração e credenciais. Ele não deve ser enviado ao GitHub.

### 5. Iniciar o backend

Ainda dentro da pasta `backend`, executar:

```bash
node server.js
```

O terminal deverá informar que a API está disponível na porta 3001 e que a conexão com o banco de dados foi estabelecida.

Manter esse terminal aberto durante a utilização do aplicativo.

### 6. Iniciar o aplicativo Expo

Abrir outro terminal na pasta raiz do projeto:

```bash
npx expo start
```

### 7. Executar no emulador Android

Iniciar o emulador pelo Android Studio. Com o Expo em execução, pressionar `a` no terminal para abrir o aplicativo no ambiente Android, quando essa opção estiver disponível.

O aplicativo utiliza o endereço `http://10.0.2.2:3001` para acessar a API a partir do emulador padrão do Android Studio.

Em um dispositivo físico, o endereço da API deve ser ajustado para um endereço acessível pela rede do dispositivo, com o backend configurado para aceitar a conexão.

## Persistência dos dados

O aplicativo utiliza o AsyncStorage para manter dados localmente no dispositivo e disponibiliza integração com um backend desenvolvido em Node.js e Express.

O backend permite registrar partidas finalizadas no MongoDB e consultar o histórico armazenado no banco de dados. O aplicativo realiza a sincronização dos registros e apresenta o status correspondente.

A disponibilidade da sincronização remota depende de o backend estar em execução, de a conexão com o MongoDB estar configurada corretamente e de o dispositivo conseguir acessar a API.

## Estrutura do projeto

```text
Marcador-de-Truco/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── App.js
├── package.json
├── package-lock.json
├── app.json
├── .gitignore
└── README.md
```

O arquivo `.env` é criado localmente e não deve ser versionado no GitHub.

## Escopo do projeto

O projeto contempla a implementação das telas, a navegação entre elas, o controle da pontuação, o histórico das partidas, a persistência local e a integração com um backend e banco de dados MongoDB.

A aplicação foi desenvolvida no contexto acadêmico da disciplina de Desenvolvimento de Aplicativos Móveis.

## Autor

Cleiton Horalino

Projeto acadêmico desenvolvido para a disciplina de Desenvolvimento de Aplicativos Móveis.

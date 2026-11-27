# ⚽ Champions API: Node.js + Express + TypeScript

[![ci](https://github.com/raabesmps/champions-api-node/actions/workflows/ci.yml/badge.svg)](https://github.com/raabesmps/champions-api-node/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)

Desafio de projeto da **Formação Node.js da [DIO](https://www.dio.me/)**: uma **API REST da Champions League** organizada em camadas, que gerencia jogadores e clubes.

Código de referência da aula: [digitalinnovationone/formacao-nodejs › projeto-champions](https://github.com/digitalinnovationone/formacao-nodejs/tree/main/projeto-champions).

## 🚀 Como rodar

Requisito: **Node.js 22.9 ou superior**.

```bash
git clone https://github.com/raabesmps/champions-api-node.git
cd champions-api-node
npm install
npm run start:dev        # http://localhost:3333/api
```

| Script | O que faz |
|---|---|
| `npm run start:dev` | roda o TypeScript direto com `tsx` |
| `npm run start:watch` | o mesmo, reiniciando a cada alteração |
| `npm run typecheck` | confere os tipos com `tsc` |
| `npm test` | roda os testes |
| `npm run start:dist` | gera o build com `tsup` e roda o JavaScript final |

A porta vem do `.env` (`PORT`, padrão `3333`). Para mudar, copie o `.env.example` para `.env`.

## 🧱 As camadas

Cada requisição atravessa as camadas sempre na mesma ordem, e cada uma tem uma única responsabilidade:

```
requisição → routes.ts → controller → service → repository → arquivo JSON
                           ↑ HTTP       ↑ regras    ↑ dados
```

| Camada | Arquivo(s) | Responsabilidade |
|---|---|---|
| **server** | `src/server.ts` | lê a porta do `.env` e sobe o servidor |
| **app** | `src/app.ts` | configura o Express: CORS, JSON, rotas, 404 e tratamento de erros |
| **routes** | `src/routes.ts` | liga cada método + caminho ao seu controller |
| **controllers** | `src/controllers/` | leem a requisição (id, query, corpo), chamam o service e escrevem a resposta |
| **services** | `src/services/` | regras de negócio: validação, duplicidade, duelo e **escolha do status HTTP** |
| **repositories** | `src/repositories/` | os únicos que sabem onde os dados estão: leem e gravam os arquivos JSON |
| **models** | `src/models/` | tipos TypeScript de jogador, clube, estatísticas e resposta HTTP |

O service nunca mexe em `req` ou `res`, e o controller nunca sabe que os dados estão num arquivo. Trocar o JSON por um banco de dados mudaria só os repositórios.

## 📡 Endpoints

Todas as rotas usam o prefixo **`/api`**.

| Método | Rota | O que faz | Sucesso | Erros |
|---|---|---|---|---|
| `GET` | `/players` | lista jogadores (filtros `club`, `position`, `nationality`) | 200 | 400 |
| `GET` | `/players/:id` | busca um jogador | 200 | 400, 404 |
| `POST` | `/players` | cadastra um jogador | 201 | 400, 409 |
| `PATCH` | `/players/:id` | atualiza estatísticas | 200 | 400, 404 |
| `DELETE` | `/players/:id` | remove um jogador | 204 | 400, 404 |
| `GET` | `/players/compare?ids=1,7` | **duelo** entre 2 a 5 jogadores | 200 | 400, 404 |
| `GET` | `/clubs` | lista clubes (filtro `country`) | 200 | |
| `GET` | `/clubs/:id` | busca um clube com seus jogadores | 200 | 400, 404 |
| `POST` | `/clubs` | cadastra um clube | 201 | 400, 409 |
| `DELETE` | `/clubs/:id` | remove um clube sem jogadores | 204 | 400, 404, 409 |
| `GET` | `/health` | status do servidor | 200 | |

### `GET /api/players`

```bash
curl "http://localhost:3333/api/players?nationality=brasil&position=zagueiro"
```

```json
[
  {
    "id": 12,
    "name": "Gabriel Magalhães",
    "clubId": 7,
    "nationality": "Brasil",
    "position": "Zagueiro",
    "statistics": { "overall": 86, "pace": 72, "shooting": 48, "passing": 64, "dribbling": 64, "defending": 88, "physical": 87 },
    "club": "Arsenal"
  },
  {
    "id": 16,
    "name": "Marquinhos",
    "clubId": 20,
    "nationality": "Brasil",
    "position": "Zagueiro",
    "statistics": { "overall": 86, "pace": 75, "shooting": 52, "passing": 74, "dribbling": 70, "defending": 88, "physical": 79 },
    "club": "Paris Saint-Germain"
  }
]
```

Os filtros ignoram acentos e maiúsculas. `club` aceita o id (`?club=6`) ou o nome (`?club=liverpool`). As posições válidas são `Goleiro`, `Zagueiro`, `Lateral`, `Meio-campista` e `Atacante`.

### `GET /api/players/:id`

```bash
curl http://localhost:3333/api/players/4
```

```json
{
  "id": 4,
  "name": "Lamine Yamal",
  "clubId": 2,
  "nationality": "Espanha",
  "position": "Atacante",
  "statistics": { "overall": 88, "pace": 88, "shooting": 80, "passing": 84, "dribbling": 91, "defending": 30, "physical": 60 },
  "club": "Barcelona"
}
```

`/api/players/999` → `404 { "message": "Jogador 999 não encontrado." }`. `/api/players/abc` → `400`.

### `POST /api/players`

O `id` é gerado pela API. Todos os outros campos são obrigatórios, e as estatísticas vão de 1 a 99.

```bash
curl -X POST http://localhost:3333/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rodrygo",
    "clubId": 1,
    "nationality": "Brasil",
    "position": "Atacante",
    "statistics": { "overall": 85, "pace": 89, "shooting": 82, "passing": 80, "dribbling": 87, "defending": 35, "physical": 66 }
  }'
```

Resposta **`201 Created`**, com o cabeçalho `Location: /api/players/19` e o jogador criado no corpo.

Quando falta algo, a resposta é **`400`** e diz exatamente o quê:

```json
{
  "message": "Dados do jogador inválidos.",
  "details": [
    "\"nationality\" é obrigatório: o país com pelo menos 2 letras.",
    "\"position\" deve ser uma destas: Goleiro, Zagueiro, Lateral, Meio-campista, Atacante.",
    "\"statistics.pace\" deve ser um número inteiro de 1 a 99."
  ]
}
```

Outros casos:
- jogador com o mesmo nome no mesmo clube → **`409`**;
- `clubId` que não existe → **`400`**.

### `PATCH /api/players/:id`

Envie **só as estatísticas que mudam**. As outras são mantidas.

```bash
curl -X PATCH http://localhost:3333/api/players/7 \
  -H "Content-Type: application/json" \
  -d '{ "pace": 88 }'
```

```json
{
  "id": 7,
  "name": "Erling Haaland",
  "clubId": 8,
  "nationality": "Noruega",
  "position": "Atacante",
  "statistics": { "overall": 90, "pace": 88, "shooting": 93, "passing": 70, "dribbling": 79, "defending": 45, "physical": 88 },
  "club": "Manchester City"
}
```

Também aceita `{ "statistics": { "pace": 88 } }`.

### `DELETE /api/players/:id`

```bash
curl -i -X DELETE http://localhost:3333/api/players/18
```

**`204 No Content`**, sem corpo. Repetir a chamada → `404`.

### `GET /api/players/compare` (duelo)

```bash
curl "http://localhost:3333/api/players/compare?ids=1,7"
```

```json
{
  "players": [
    { "id": 1, "name": "Kylian Mbappé", "club": "Real Madrid", "position": "Atacante" },
    { "id": 7, "name": "Erling Haaland", "club": "Manchester City", "position": "Atacante" }
  ],
  "attributes": [
    { "attribute": "overall", "label": "Geral", "values": { "1": 91, "7": 90 }, "winner": 1 },
    { "attribute": "pace", "label": "Velocidade", "values": { "1": 97, "7": 87 }, "winner": 1 },
    { "attribute": "shooting", "label": "Finalização", "values": { "1": 92, "7": 93 }, "winner": 7 },
    { "attribute": "passing", "label": "Passe", "values": { "1": 80, "7": 70 }, "winner": 1 },
    { "attribute": "dribbling", "label": "Drible", "values": { "1": 92, "7": 79 }, "winner": 1 },
    { "attribute": "defending", "label": "Defesa", "values": { "1": 36, "7": 45 }, "winner": 7 },
    { "attribute": "physical", "label": "Físico", "values": { "1": 78, "7": 88 }, "winner": 7 }
  ],
  "score": [
    { "id": 1, "name": "Kylian Mbappé", "wins": 4 },
    { "id": 7, "name": "Erling Haaland", "wins": 3 }
  ],
  "verdict": "Kylian Mbappé vence o duelo com 4 de 7 atributos."
}
```

### `GET /api/clubs`

Os clubes são lidos de um arquivo JSON.

```bash
curl "http://localhost:3333/api/clubs?country=portugal"
```

```json
[
  { "id": 23, "name": "Benfica", "country": "Portugal" },
  { "id": 24, "name": "Sporting", "country": "Portugal" }
]
```

### `GET /api/clubs/:id`

```bash
curl http://localhost:3333/api/clubs/20
```

```json
{
  "id": 20,
  "name": "Paris Saint-Germain",
  "country": "França",
  "players": [
    { "id": 15, "name": "Ousmane Dembélé", "position": "Atacante" },
    { "id": 16, "name": "Marquinhos", "position": "Zagueiro" },
    { "id": 17, "name": "Achraf Hakimi", "position": "Lateral" }
  ]
}
```

### `POST /api/clubs`

```bash
curl -X POST http://localhost:3333/api/clubs \
  -H "Content-Type: application/json" \
  -d '{ "name": "Flamengo", "country": "Brasil" }'
```

**`201`** → `{ "id": 37, "name": "Flamengo", "country": "Brasil" }`. Um nome repetido → `409`.

### `DELETE /api/clubs/:id`

```bash
curl -i -X DELETE http://localhost:3333/api/clubs/37
```

**`204`**. Um clube que ainda tem jogadores não pode ser removido:

```json
{ "message": "O clube 20 tem 3 jogadores. Remova ou transfira antes de apagar o clube." }
```

### `GET /api/health`

```bash
curl http://localhost:3333/api/health
```

```json
{ "status": "ok", "uptimeSeconds": 12 }
```

## 🔧 O que mudei em relação ao código da aula

**Correções**

| No código da aula | Aqui |
|---|---|
| 🐛 `app.use(cors())` vinha **depois** das rotas, então as respostas da `/api` **não tinham cabeçalho de CORS**. As `corsOptions` nem eram usadas, e ainda tinham um método `"UPDATE"`, que não existe | `cors()` registrado antes das rotas, com teste garantindo o cabeçalho |
| 🐛 `PATCH` num jogador inexistente fazia `Object.keys(undefined)`, e a requisição **quebrava sem resposta** | `404` com mensagem |
| 🐛 `PATCH` **substituía o objeto inteiro** de estatísticas, apagando as que não foram enviadas | Atualização parcial |
| 🐛 Jogador não encontrado respondia **`204`**, e `DELETE` de um inexistente respondia **`400`** | `404` nos dois casos |
| 🐛 `POST` aceitava qualquer objeto não vazio, inclusive o `id` vindo do cliente, o que permitia **ids repetidos** | Validação campo a campo, id gerado pela API, `409` para duplicados |
| 🐛 `parseInt("abc")` virava `NaN` e seguia adiante | `400`: "use um número inteiro positivo" |
| 🐛 `DELETE` respondia `200 { "message": "deleted" }` | `204` sem corpo |
| 🐛 `clubs.json` era lido de `./src/data`, um caminho que quebra no build. O `start:dist` apontava para um arquivo inexistente | Dados em `data/`, resolvidos pela configuração. O `start:dist` funciona |
| `201 { "message": "successful" }` | `201` com o recurso criado e o cabeçalho `Location` |
| JSON malformado no corpo virava erro genérico | `400`: "O corpo da requisição não é um JSON válido." |
| Jogadores guardados só em memória: tudo se perdia ao reiniciar | **Gravação em JSON**, com fila e escrita atômica |
| Jogador com `club` em texto solto, sem ligação com `/clubs` | `clubId` ligado ao clube, conferido no cadastro |

**Acréscimos** (das "Ideias para evoluir" do desafio)

- ✅ **Validação** do cadastro com mensagem clara para cada campo
- ✅ **Filtros** de jogadores por clube, posição e nacionalidade, e de clubes por país
- ✅ **Cadastro e remoção de clubes**, sem remover clube que tem jogadores
- ✅ **Gravação em arquivo JSON**: os dados sobrevivem ao reinício do servidor
- ✅ **Testes automatizados** dos services e das rotas
- ✅ **README** com todos os endpoints e exemplos de requisição e resposta
- ✨ **Novidade: duelo entre jogadores** (`/players/compare`)

## 💾 Onde ficam os dados

```
data/
├── seed/
│   ├── clubs.json     # 36 clubes da fase de liga da Champions 2025/26
│   └── players.json   # 18 jogadores
├── clubs.json         # criado na 1ª execução a partir da semente (fora do git)
└── players.json       # idem: aqui ficam os seus cadastros
```

Na primeira execução, a API copia `data/seed/` para `data/`. Daí em diante, tudo o que você cadastrar, alterar ou remover é gravado em `data/clubs.json` e `data/players.json`, e continua lá depois de reiniciar o servidor. Para **voltar ao estado inicial**, apague esses dois arquivos.

As gravações entram numa **fila**, uma por vez, e são **atômicas**: o arquivo é escrito num temporário e depois renomeado. Assim, dois cadastros ao mesmo tempo não se atropelam, e uma queda no meio da gravação não corrompe o arquivo.

> As estatísticas dos jogadores são **ilustrativas**, criadas para o exercício, como no projeto da aula. Elas não vêm de nenhuma fonte oficial nem de jogo.

## 🧪 Testes

```bash
npm test
```

São 33 testes com o test runner nativo do Node, cada arquivo usando uma pasta de dados temporária (os dados em `data/` nunca são tocados):

- `test/services.test.ts`: validação, filtros, cadastro (gravando no arquivo), duplicados, atualização parcial, remoção, **cadastros simultâneos com ids diferentes**, clubes e duelo;
- `test/api.test.ts`: as rotas de ponta a ponta, com status, `Location`, `204` sem corpo, JSON malformado, CORS e 404.

O GitHub Actions roda typecheck, testes, `npm audit`, build e um teste de fumaça do servidor de produção em Node 22 e 24 a cada push.

## 🗂️ Estrutura

```
src/
├── server.ts
├── app.ts
├── routes.ts
├── controllers/
│   ├── players-controller.ts
│   ├── clubs-controller.ts
│   └── send.ts                 # escreve a resposta e lê o :id
├── services/
│   ├── players-service.ts
│   ├── clubs-service.ts
│   ├── compare-service.ts      # o duelo
│   └── player-validator.ts
├── repositories/
│   ├── players-repository.ts
│   ├── clubs-repository.ts
│   └── json-store.ts           # leitura e gravação em JSON
├── models/
│   ├── player-model.ts
│   ├── club-model.ts
│   ├── statistics-model.ts
│   └── http-response-model.ts
└── utils/
    ├── http-helper.ts          # ok, created, noContent, badRequest, notFound, conflict
    └── text.ts
test/
├── helpers.ts
├── services.test.ts
└── api.test.ts
```

## 📄 Licença

[MIT](LICENSE)

# NexusLocal

Um sistema de armazenamento em nuvem pessoal, self-hosted — uma versão simplificada e sob controle próprio de algo como o Google Drive, rodando na sua própria infraestrutura.

## Por que esse projeto existe

Este é um projeto pessoal e de aprendizado. O objetivo principal não é competir com serviços de nuvem prontos, e sim entender na prática como funciona uma API REST com autenticação, como modelar um banco de dados relacional do zero, e ter controle total sobre onde os próprios arquivos ficam guardados.

> Este repositório é público principalmente para fins de documentação e portfólio do processo de desenvolvimento. O uso deste código é destinado a uso pessoal.

## Status atual

O projeto está em desenvolvimento ativo. Hoje já funciona:

- [x] Login com autenticação via JWT
- [x] Senhas armazenadas com hash bcrypt (nunca em texto puro)
- [x] Upload de arquivos (hoje isolado por usuário como atalho temporário — veja a nota sobre o modelo de pastas logo abaixo)
- [x] Listagem dos arquivos do usuário logado
- [x] Download de arquivos, com proteção contra path traversal
- [x] Front-end (HTML/CSS/JS puro) servido via Nginx, com tema visual próprio (variáveis CSS + tipografia customizada)
- [x] Ambiente containerizado com Docker Compose

Ainda não implementado (veja o Roadmap):

- [ ] Exclusão de arquivos (o botão já existe na interface, falta o endpoint na API)
- [ ] Integração com o banco MySQL (hoje o usuário/senha vêm de variável de ambiente como placeholder temporário, não de um banco de verdade)
- [ ] Navegação por pastas
- [ ] Favoritos
- [ ] Tela de uso/armazenamento com gráficos (hoje/7 dias/1 mês)
- [ ] Tela de administração de usuários e permissões por pasta
- [ ] Troca obrigatória de senha no primeiro login

## Stack

**Back-end**
- Python + FastAPI
- Autenticação: JWT (`python-jose`) + hash de senha (`passlib` / `bcrypt`)
- MySQL (planejado — schema já modelado, a integração é o próximo passo)

**Front-end**
- HTML, CSS e JavaScript puros, sem framework
- Servido como arquivos estáticos via Nginx

**Infraestrutura**
- Docker + Docker Compose (um serviço para a API, um para o Nginx servindo o front-end)

## Estrutura do projeto

```
site do clowd/
├── docker-compose.yaml      # orquestra os dois serviços: api + web (nginx)
├── api/
│   ├── app/
│   │   └── main.py          # toda a lógica da API (FastAPI)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example         # modelo de variáveis de ambiente (sem segredos reais)
│   └── logs/                # logs de acesso (gerado em runtime, fora do Git)
└── site/
    ├── index.html           # tela de login
    ├── areaArquivos.html    # navegador de arquivos
    ├── theme.css            # variáveis de cor/fonte compartilhadas (design tokens)
    ├── cssLoguin.css
    ├── cssArq.css
    ├── Js/
    │   ├── loguin.js
    │   └── fileManager.js
    └── nginx.conf
```

## API

Toda rota, exceto `/login` e `/`, exige um token JWT no header `Authorization: Bearer <token>`, obtido no login.

| Método | Rota              | Autenticado? | Descrição                                          |
|--------|-------------------|:---:|-------------------------------------------------------------|
| POST   | `/login`          | ❌  | Recebe usuário/senha, retorna um access token JWT           |
| GET    | `/`               | ❌  | Healthcheck simples                                          |
| POST   | `/upload`         | ✅  | Envia um arquivo, salvo na pasta pessoal do usuário          |
| GET    | `/loadFiles`      | ✅  | Lista os arquivos do usuário logado                          |
| GET    | `/getFile/{nome}` | ✅  | Baixa um arquivo específico do usuário logado                |

## Banco de dados (planejado)

O schema já foi modelado (6 tabelas), mas a API ainda não está conectada ao MySQL.

| Tabela         | Papel                                                                     |
|----------------|-----------------------------------------------------------------------------|
| `Usuario`      | Usuários do sistema (login, senha em hash, se é admin)                      |
| `Pasta`        | Pastas do sistema de arquivos                                                |
| `UsuarioPasta` | Junção N:N — define quem pode ler/escrever em cada pasta                     |
| `Arquivo`      | Metadados dos arquivos (nome, tamanho em KB, pasta, data de modificação)     |
| `LogAcesso`    | Um registro por ação (leitura/escrita) — permite filtrar uso por período     |
| `MetaDados`    | Configuração global da nuvem (ex: espaço máximo permitido)                   |

> **Sobre o modelo de pastas:** a ideia não é cada usuário ter uma pasta pessoal isolada e privada. O sistema é pensado como um **único espaço de armazenamento compartilhado**, onde as pastas existem de forma independente dos usuários — e cada usuário recebe (ou não) permissão de leitura/escrita em cada pasta específica, através da tabela `UsuarioPasta`. A implementação atual, que separa os arquivos numa pasta por usuário dentro de `storage/`, é apenas um atalho temporário de enquanto a API ainda não conversa com o banco — não reflete o modelo final.

## Rodando localmente

1. Clone o repositório.
2. Copie o modelo de variáveis de ambiente e preencha com valores reais:
   ```bash
   cd api
   cp .env.example .env
   ```
   É preciso gerar uma `SECRET_KEY` (qualquer string aleatória longa e única) e um hash bcrypt da senha que quiser usar — os comentários dentro do `.env.example` explicam como gerar os dois.
3. Suba os containers a partir da raiz do projeto:
   ```bash
   docker compose up --build
   ```
4. Acesse `http://localhost:8080` no navegador.

> **Nota:** os caminhos de volume no `docker-compose.yaml` (pasta de armazenamento e de logs) hoje apontam para diretórios específicos da máquina do autor no Windows. Se for rodar em outra máquina, ajuste esses caminhos antes do `docker compose up`.

## Licença

Projeto pessoal, sem licença de uso comercial. O código está público como documentação do processo de desenvolvimento.

# NexusLocal

## Sobre o projeto

NexusLocal é um sistema de armazenamento em nuvem pessoal, self-hosted (conceitualmente parecido com um mini Google Drive / NAS). O projeto é, antes de tudo, um **exercício de aprendizado** — o objetivo do Juliano é entender o raciocínio por trás das decisões técnicas, não só receber código pronto.

**Regra fixa para qualquer assistente/IA trabalhando neste projeto:** ao criar código ou tirar dúvidas, especialmente sobre a API, sempre explicar o raciocínio e o que cada parte faz.

## Stack

- **Backend:** Python + FastAPI
- **Banco de dados:** MySQL
- **Frontend:** inclui gráficos de atividade filtrados por tempo (hoje / 7 dias / 1 mês)

## Estado atual

- Backend FastAPI já funcional para: upload de arquivos, listagem de arquivos, login (via código).
- Backend **ainda não está conectado ao banco de dados**.
- Schema do MySQL **totalmente desenhado** e ERD gerado (ver abaixo).

## Schema do banco de dados (6 tabelas)

### Usuario
| Campo | Tipo | Observação |
|---|---|---|
| id | INT | PK |
| usuario | VARCHAR | |
| senha | VARCHAR | |
| isADM | BOOLEAN | flag de administrador |

### Pasta
| Campo | Tipo | Observação |
|---|---|---|
| id | INT | PK |
| nome | VARCHAR | |

### UsuarioPasta (tabela de ligação N:N)
| Campo | Tipo | Observação |
|---|---|---|
| id | INT | PK |
| Usuario_id | INT | FK → Usuario |
| Pasta_id | INT | FK → Pasta |
| pode_ler | BOOLEAN | |
| pode_escrever | BOOLEAN | |

Permite que cada usuário tenha permissões de leitura/escrita diferentes **por pasta** (ex: pode escrever em "Videos" mas não em "Editados").

### Arquivo
| Campo | Tipo | Observação |
|---|---|---|
| id | INT | PK |
| nome | VARCHAR | |
| tamanho_kb | INT | tamanho guardado em KB; conversão para MB/GB é feita na camada da API, não no banco |
| Pasta_id | INT | FK → Pasta |
| data_modificacao | DATETIME | |

### LogAcesso
| Campo | Tipo | Observação |
|---|---|---|
| id | INT | PK |
| Usuario_id | INT | FK → Usuario |
| Arquivo_id | INT | FK → Arquivo |
| tipo_acao | ENUM('leitura','escrita') | |
| data_hora | DATETIME | |

Guarda **uma linha por ação individual** (não agregado). É essa granularidade que permite os filtros de "hoje / 7 dias / 1 mês" no gráfico do frontend, via `WHERE data_hora >= X`. O espaço/volume de dados usado em cada acesso não é duplicado aqui — quando necessário, a API faz JOIN com `Arquivo` para pegar o `tamanho_kb`.

### MetaDados
| Campo | Tipo | Observação |
|---|---|---|
| id | INT | PK |
| espacoMaximoNuvem_kb | INT | limite máximo de armazenamento da nuvem |
| descricao | VARCHAR | |

Tabela de configuração global, sem FK — não guarda nada específico de usuário ou arquivo.

## Decisões de modelagem (com o porquê)

- **Tamanho de arquivo fica em `Arquivo`, não em `LogAcesso` ou `MetaDados`:** o tamanho é uma propriedade do arquivo em si; duplicar isso no log seria redundante. Para saber quantos MB foram lidos num período, a API cruza `LogAcesso` com `Arquivo`.
- **Log individual por ação (não contador agregado):** um contador agregado (ex: "total de leituras do usuário X") perde a granularidade de tempo necessária para os filtros hoje/7 dias/1 mês. Uma tabela de log com uma linha por ação, bem indexada, resolve isso sem ficar pesada para o MySQL em um projeto desse porte.
- **Conversão de unidades (KB → MB/GB) é responsabilidade da API, não do banco** — separação de camadas: o banco guarda o dado bruto, a lógica de apresentação fica na aplicação.
- **Permissões por pasta usam dois booleanos independentes** (`pode_ler`, `pode_escrever`) em vez de um único nível — porque o requisito é granularidade por pasta, com leitura e escrita configuráveis separadamente.

## Diagrama ER

Gerado no estilo MySQL Workbench (arquivo `erd_nexuslocal.png` já entregue), mostrando todas as tabelas acima com PK/FK e cardinalidades.

## Próximos passos

1. Gerar o script SQL (`CREATE TABLE`) para as 6 tabelas.
2. Conectar o backend FastAPI existente ao MySQL.

## Como o Juliano gosta de trabalhar

- Aprende entendendo o raciocínio, não só recebendo a solução pronta.
- Decisões de design são feitas de forma iterativa, com perguntas e discussão antes de fechar o modelo.
- Valoriza separação de responsabilidades (ex: conversão de unidade na API, não no banco).
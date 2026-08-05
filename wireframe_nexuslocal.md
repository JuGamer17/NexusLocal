# NexusLocal — Especificação de Wireframe (UI/UX)

> Convertido do esqueleto visual (Excalidraw) do projeto para uso como contexto por IA. Complementa o `CLAUDE.md` (schema de banco de dados) já existente no projeto.

## 1. Login

- Campos: `Usuario:`, `Senha:`
- Botão: `Entrar`
- Variante: "Login comum" (login padrão, usuário já configurado)

## 2. Primeiro acesso do admin

Fluxo especial que só ocorre no primeiro login do usuário admin (antes de qualquer outro usuário existir).

- Mensagem: "existirá uma base para acessar a primeira vez, que será trocada logo do primeiro acesso, e os demais [logins] que o admin criar"
- Tela: "primeiro login pelo admin" → "altere sua senha de admin:"
- Campos: `senha:`, `Confirmar senha:`
- Botão: `Salvar e Entrar`
- Também nesse fluxo: `Email para recuperação:` (configurado no primeiro acesso, usado depois para recuperar senha)

## 3. Recuperação de senha

- Gatilho: "caso o admin erre a senha, aparecerá um botão para trocar a senha"
- O e-mail (configurado no passo 2) envia um código
- Tela: `Código de recuperação:` → campo `código aqui:` → botão `Confirmar`
- Após confirmar: `Salvar e Entrar`

## 4. Painel de Configurações (overlay/modal, acesso só admin)

Abas: **Info** | **Usuários** | **Especificações**
Botão comum a todas: `Salvar e fechar config.` (salva e volta para Home)

### 4.1 Aba Info

- Gráfico mostrando espaço livre na nuvem + configuração de quanto espaço está disponível/usado
- Estatísticas de **leitura** e **escrita** por usuário, filtráveis por período: `hoje` / `7 dias` / `1 mês`
  - Visível apenas para admin e usuários autorizados
  - Exemplo de dados: usuario1/usuario2/usuario3 com valores tipo `15Gb`, `32Gb`, `532Mb` por coluna Leitura/Escrita
- Log dos itens enviados: lista com tamanho e data

> Nota de implementação: esses dados vêm da tabela `LogAcesso` (join com `Arquivo` para o tamanho), filtrando por `data_hora` conforme o período selecionado — ver `CLAUDE.md`.

### 4.2 Aba Usuários

- Lista de usuários cadastrados (usuario1, usuario2, usuario3...)
- Botão `+ Adicionar` (novo usuário) — ao criar, o novo usuário começa **sem nenhuma permissão** em nenhuma pasta (permissão precisa ser dada manualmente depois)
- Botão `x` / `remover` ao lado de cada usuário
- Checkboxes de **leitura** e **escrita**, um por pasta, por usuário — ex: pastas `Home`, `Edição`, `A editar`, `A revisar`, `Vídeos prontos`
  - "Os checkbox selecionam o que o usuário selecionado poderá acessar" (por pasta, leitura e escrita independentes)
- Ao clicar em um usuário específico: abre edição de permissões + campos `Senha` / `Confirmar senha` / `Confirmar` (permite trocar a senha do usuário)

> Nota de implementação: mapeia direto para a tabela de ligação `UsuarioPasta` (`pode_ler`, `pode_escrever`) — ver `CLAUDE.md`.

### 4.3 Aba Especificações

Campos (somente leitura, informativos) + botão `Aplicar`:

- `Tamanho máximo do disco onde instalado:` (ex: `123,8Gb`)
- `Espaço ocupado por itens não-nuvem:` (ex: `250,5Gb`)
- `Espaço ocupado por itens da nuvem:` (ex: `500Gb`)
- `Espaço máximo de uso da NexusLocal:` (ex: `932,6Gb`, configurável)

> Nota de implementação: o último campo mapeia para `MetaDados.espacoMaximoNuvem_kb`; os demais são calculados (soma de `Arquivo.tamanho_kb` e espaço em disco do SO).

## 5. Home (navegador de arquivos — tela principal)

- Cabeçalho: `"Logo" + NexusLocal`
- Breadcrumb de navegação: ex. `Home:/arquivos/fotos` — mostra a pasta atual e as anteriores; clicar no "Home" do breadcrumb leva direto à raiz da NexusLocal (não navega passo a passo pelas pastas intermediárias)
- Pastas favoritas: selecionadas/marcadas pelo usuário, adicionadas automaticamente à barra lateral/atalhos conforme a necessidade
- Lista de arquivos, colunas: `Nome`, `Tamanho`, `Última edição` (+ ícone do tipo de arquivo)
- Botão `+ Adicionar Item`: ao clicar, abre a interface nativa do navegador para escolher um arquivo (upload)
- Botão `Configurações`: **só aparece para usuários admin** — usuário não-admin nem vê o botão
- Botão `Sair`: desloga e volta para a área de login

## 6. Popup de detalhes do arquivo (ao clicar em um item da lista)

- Abre como popup/modal; clicar fora da área fecha
- Imagem de preview: se o arquivo for imagem, mostra a própria imagem em miniatura; senão, mostra um ícone genérico referente à extensão do arquivo (`IMAGEM REFERENTE AO ARQUIVO`)
- Campos exibidos: `Nome`, `Tamanho`, `Última edição`
- Botão `Baixar`: sempre visível, baixa o item (arquivo ou pasta)
- Botão `Excluir`: **só aparece se o usuário tiver permissão de escrita** na pasta atual — se não tiver, esse botão nem é renderizado

> Nota de implementação: a visibilidade do botão Excluir depende de `UsuarioPasta.pode_escrever` para a pasta do arquivo em questão.

## Regras de negócio transversais (aparecem em várias telas)

- Toda ação de exclusão/escrita é condicionada à permissão `pode_escrever` da pasta específica, não é uma permissão global do usuário.
- Todo elemento de administração (Configurações, estatísticas de leitura/escrita de outros usuários) é condicionado a `Usuario.isADM = true`.
- Novo usuário criado começa sem nenhuma pasta liberada — acesso é opt-in, não opt-out.

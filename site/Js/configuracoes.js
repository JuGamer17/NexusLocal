const tabInfo = document.getElementById('tabInfo');
const tabUsuarios = document.getElementById('tabUsuarios');
const tabEspecificacoes = document.getElementById('tabEspecificacoes');


function mostrarInfo() {
    tabInfo.style.display = '';
    tabUsuarios.style.display = 'none';
    tabEspecificacoes.style.display = 'none';
}

function mostrarUsuarios() {
    tabInfo.style.display = 'none';
    tabUsuarios.style.display = '';
    tabEspecificacoes.style.display = 'none';
}

function mostrarEspecificações() {
    tabInfo.style.display = 'none';
    tabUsuarios.style.display = 'none';
    tabEspecificacoes.style.display = '';
}

function salvar_e_sair(){
    //Aqui manda os dados novos para a Nuvem na API
    const espaco = document.getElementById('inputEspacoMaximo');
    const kb = converterParaKb(espaco.value);
    //mandar com fecth kb para novo tamanho da nuvem se houver, 
    //e novos usuarios com suas permições se houver, atuais MOCK_USUARIOS_DB e MOCK_ACESSOS_PASTA.
    //nada vai ser realmente salvo de verdade pois é apenas simulação essa função.
    window.location.href = 'areaArquivos.html';
}


// ======================================================================
// "API" simulada da aba Info
//
// A ideia: as funções apiBuscarX() abaixo têm a MESMA forma que uma
// chamada real via fetch() vai ter no futuro — elas retornam uma Promise,
// então quem usa essas funções (as renderX() logo abaixo) já escreve o
// código como se os dados viessem da rede, mesmo eles vindo de arrays
// locais por enquanto.
//
// Quando o FastAPI estiver pronto, a troca é só isso, por exemplo:
//
//   function apiBuscarUsuarios() {
//       return fetch('/api/usuarios').then(r => r.json());
//   }
//
// Nenhuma função de render precisa mudar, porque elas já fazem
// `await apiBuscarUsuarios()` e tratam o retorno como uma lista comum.
// ======================================================================

// Simula a tabela Usuario (id, usuario, isADM) + o acesso "rápido" dele à pasta Home
// (editado direto na tabela da aba Usuários). É a MESMA base usada pela aba Info e
// pela aba Usuários — centralizar aqui evita ter duas listas de usuário que podem
// ficar dessincronizadas (ex: apagar um usuário aqui e ele continuar aparecendo lá).
let MOCK_USUARIOS_DB = [
    { id: 1, usuario: 'usuario1', isADM: true,  homeLeitura: true,  homeEscrita: true  },
    { id: 2, usuario: 'usuario2', isADM: false, homeLeitura: false, homeEscrita: true  },
    { id: 3, usuario: 'usuario3', isADM: false, homeLeitura: true,  homeEscrita: false },
];

// GET /usuarios (futuro) provavelmente devolveria só os nomes pra quem só precisa
// disso (como a aba Info) — essa função já isola essa parte.
function listaNomesUsuarios() {
    return MOCK_USUARIOS_DB.map(u => u.usuario);
}

// Paleta fixa pro gráfico de pizza: cada usuário pega uma cor pelo índice dele em
// listaNomesUsuarios() (usuario1 sempre azul, usuario2 sempre laranja, etc.), e essa MESMA
// cor é usada tanto na fatia da pizza quanto na bolinha ao lado do nome no resumo.
// Se um dia tiver mais usuários que cores, o `% CORES_GRAFICO.length` faz a lista repetir.
const CORES_GRAFICO = ['#6fa8dc', '#f6b26b', '#93c47d', '#c27ba0', '#ffd966', '#e06666'];

// Gera uma data ISO relativa a "agora" — assim os filtros de período (hoje/7 dias/1 mês)
// continuam fazendo sentido não importa em que dia você estiver testando.
function diasAtras(dias, horas = 12) {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    data.setHours(horas, 0, 0, 0);
    return data.toISOString();
}

// Simula um SELECT em LogAcesso já com JOIN em Usuario e Arquivo
// (é basicamente o formato que a rota GET /log-acesso deve devolver no futuro)
const MOCK_LOG_ACESSO = [
    { usuario: 'usuario1', arquivo: 'video_aula_01.mp4',   tipo_acao: 'escrita', tamanho_kb: 15_500_000, data_hora: diasAtras(0) },
    { usuario: 'usuario1', arquivo: 'thumbnail.png',       tipo_acao: 'leitura', tamanho_kb: 2_048,      data_hora: diasAtras(0, 9) },
    { usuario: 'usuario1', arquivo: 'roteiro_v2.docx',     tipo_acao: 'leitura', tamanho_kb: 480,        data_hora: diasAtras(4) },

    { usuario: 'usuario2', arquivo: 'projeto_final.zip',   tipo_acao: 'escrita', tamanho_kb: 33_500_000, data_hora: diasAtras(2) },
    { usuario: 'usuario2', arquivo: 'planilha_custos.xlsx', tipo_acao: 'escrita', tamanho_kb: 340,       data_hora: diasAtras(6) },
    { usuario: 'usuario2', arquivo: 'briefing.pdf',        tipo_acao: 'leitura', tamanho_kb: 1_200,      data_hora: diasAtras(20) },

    { usuario: 'usuario3', arquivo: 'legenda_pt.srt',      tipo_acao: 'escrita', tamanho_kb: 545_000,    data_hora: diasAtras(1) },
    { usuario: 'usuario3', arquivo: 'audio_bruto.wav',     tipo_acao: 'leitura', tamanho_kb: 128_000,    data_hora: diasAtras(28) },
];

// GET /usuarios  (futuro)
function apiBuscarUsuarios() {
    return Promise.resolve(listaNomesUsuarios());
}

// GET /log-acesso/resumo?tipo_acao=escrita&periodo=hoje  (futuro)
// Retorna o total de KB por usuário, filtrado por tipo de ação e período.
function apiBuscarResumoUso(tipo, periodo) {
    const totais = {};
    listaNomesUsuarios().forEach(usuario => totais[usuario] = 0); // garante que todo mundo aparece, mesmo com 0

    MOCK_LOG_ACESSO
        .filter(linha => linha.tipo_acao === tipo && dentroDoPeriodo(linha.data_hora, periodo))
        .forEach(linha => {
            totais[linha.usuario] = (totais[linha.usuario] || 0) + linha.tamanho_kb;
        });

    return Promise.resolve(totais);
}

// GET /log-acesso?usuario=usuario1&periodo=7dias  (futuro)
function apiBuscarLogsUsuario(usuario, periodo) {
    const logs = MOCK_LOG_ACESSO
        .filter(linha => linha.usuario === usuario && dentroDoPeriodo(linha.data_hora, periodo))
        .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)); // mais recente primeiro

    return Promise.resolve(logs);
}


// ---- Helpers de filtro/formatação (esses continuam existindo mesmo com API real) ----

function dentroDoPeriodo(dataHoraISO, periodo) {
    const agora = new Date();
    const data = new Date(dataHoraISO);
    const diffDias = (agora - data) / (1000 * 60 * 60 * 24);

    if (periodo === 'hoje') return data.toDateString() === agora.toDateString();
    if (periodo === '7dias') return diffDias <= 7;
    if (periodo === '1mes') return diffDias <= 30;
    return true;
}

function formatarTamanho(kb) {
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(1).replace('.', ',') + 'Gb';
    if (kb >= 1024) return Math.round(kb / 1024) + 'Mb';
    return kb + 'Kb';
}

function formatarData(dataHoraISO) {
    const data = new Date(dataHoraISO);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataFormatada} ${horaFormatada}`;
}


// ---- Estado atual da aba Info (o que está selecionado agora na tela) ----

const estadoInfo = {
    tipoGrafico: 'escrita',
    periodo: 'hoje',
    usuarioSelecionado: null,
};


// ---- Funções de render: pegam o resultado da "API" e escrevem no DOM ----

async function renderResumoUso() {
    const totais = await apiBuscarResumoUso(estadoInfo.tipoGrafico, estadoInfo.periodo);
    const nomes = listaNomesUsuarios();

    const container = document.getElementById('resumoUsuarios');
    container.innerHTML = '';

    nomes.forEach((usuario, i) => {
        const cor = CORES_GRAFICO[i % CORES_GRAFICO.length];
        const p = document.createElement('p');
        p.innerHTML = `<span class="pontoCorUsuario" style="background-color:${cor};"></span>` +
                      `<span class="nomeUsuarioResumo">${usuario}:</span> ` +
                      `<span class="valorUsoResumo">${formatarTamanho(totais[usuario])}</span>`;
        container.appendChild(p);
    });

    // Reaproveita os mesmos `totais` que acabamos de buscar — não faz sentido
    // chamar a "API" de novo só pra desenhar o gráfico com os mesmos números.
    renderGraficoPizza(totais, nomes);
}

// Pinta o #graficoCirculo com um conic-gradient: uma "fatia" de cor por usuário,
// do tamanho proporcional ao que ele representa do total. O conic-gradient entende
// as paradas em porcentagem (0% a 100% = 0° a 360°), então só precisamos ir
// acumulando a porcentagem de cada fatia conforme passamos pelos usuários.
function renderGraficoPizza(totais, nomes) {
    const circulo = document.getElementById('graficoCirculo');
    const miolo = document.getElementById('graficoCirculoMiolo');

    const totalGeral = nomes.reduce((soma, usuario) => soma + totais[usuario], 0);

    if (totalGeral === 0) {
        circulo.style.background = 'var(--color-surface-1)';
        miolo.textContent = 'Sem dados';
        return;
    }

    let acumulado = 0;
    const fatias = nomes.map((usuario, i) => {
        const cor = CORES_GRAFICO[i % CORES_GRAFICO.length];
        const inicio = acumulado;
        acumulado += (totais[usuario] / totalGeral) * 100;
        return `${cor} ${inicio}% ${acumulado}%`;
    });

    circulo.style.background = `conic-gradient(${fatias.join(', ')})`;
    miolo.textContent = formatarTamanho(totalGeral);
}

async function renderListaUsuarios() {
    const usuarios = await apiBuscarUsuarios();
    const container = document.getElementById('colunaUsuariosLog');
    container.innerHTML = '';

    usuarios.forEach(usuario => {
        const item = document.createElement('div');
        item.className = 'usuarioLogItem';
        item.dataset.user = usuario;
        item.textContent = usuario + ':';
        item.onclick = () => selecionarUsuarioLog(item, usuario);
        container.appendChild(item);
    });

    // Seleciona o primeiro usuário da lista automaticamente ao carregar a aba
    if (usuarios.length > 0) {
        selecionarUsuarioLog(container.firstElementChild, usuarios[0]);
    }
}

async function renderLogsUsuario() {
    const usuario = estadoInfo.usuarioSelecionado;
    const container = document.getElementById('tabelaLogBody');
    const titulo = document.getElementById('tituloLogUsuario');

    if (!usuario) {
        titulo.textContent = 'Selecione um usuário para ver os itens enviados.';
        container.innerHTML = '';
        return;
    }

    titulo.textContent = `Itens enviados por ${usuario}`;

    const logs = await apiBuscarLogsUsuario(usuario, estadoInfo.periodo);
    container.innerHTML = '';

    if (logs.length === 0) {
        const vazio = document.createElement('p');
        vazio.style.opacity = '0.7';
        vazio.style.textAlign = 'center';
        vazio.textContent = 'Nenhum item enviado nesse período.';
        container.appendChild(vazio);
        return;
    }

    logs.forEach(log => {
        const p = document.createElement('p');
        p.textContent = `${log.arquivo} — ${formatarTamanho(log.tamanho_kb)} — ${formatarData(log.data_hora)}`;
        container.appendChild(p);
    });
}


// ---- Handlers dos cliques (chamados pelo onclick no HTML) ----

function alternarTipoGrafico(botao, tipo) {
    document.querySelectorAll('#toggleLeituraEscrita .chipBtn').forEach(b => b.classList.remove('active'));
    botao.classList.add('active');

    estadoInfo.tipoGrafico = tipo;
    renderResumoUso();
}

function filtrarPeriodo(botao, periodo) {
    document.querySelectorAll('#filtroPeriodo .chipBtn').forEach(b => b.classList.remove('active'));
    botao.classList.add('active');

    estadoInfo.periodo = periodo;
    renderResumoUso();
    renderLogsUsuario();
}

function selecionarUsuarioLog(item, usuario) {
    document.querySelectorAll('.usuarioLogItem').forEach(u => u.classList.remove('active'));
    item.classList.add('active');

    estadoInfo.usuarioSelecionado = usuario;
    renderLogsUsuario();
}


// ---- Inicialização ----

function inicializarAbaInfo() {
    renderResumoUso();
    renderListaUsuarios(); // essa função já dispara a seleção do primeiro usuário e o render do log dele
}


// ======================================================================
// ABA USUÁRIOS
// Mesma lógica da aba Info: dados mockados + funções "apiX" que devolvem
// Promise, só pra manter o mesmo formato que uma chamada real terá depois.
// ======================================================================

// Simula a tabela Pasta, já organizada em árvore (cada pasta sabe quem são os filhos).
// No banco real isso é uma tabela plana com Pasta_id apontando pro pai — aqui já
// deixamos aninhado porque é mais fácil de desenhar a árvore a partir disso.
const MOCK_PASTAS = [
    {
        id: 1, nome: 'Home',
        filhos: [
            {
                id: 2, nome: 'Edição',
                filhos: [
                    { id: 3, nome: 'A editar', filhos: [] },
                    { id: 4, nome: 'A revisar', filhos: [] },
                ],
            },
            { id: 5, nome: 'Vídeos prontos', filhos: [] },
        ],
    },
];

// Simula a tabela UsuarioPasta, simplificada por enquanto pra um único booleano
// "tem acesso" por pasta (o real tem pode_ler/pode_escrever separados — fica de
// TODO pra quando ligar na API de verdade). Chave = nome do usuário, valor = { pastaId: bool }.
const MOCK_ACESSOS_PASTA = {
    usuario1: { 1: true, 2: true, 3: true, 4: true, 5: true },
    usuario2: { 1: true, 2: true, 3: false, 4: true, 5: false },
    usuario3: { 1: true, 2: false, 3: false, 4: false, 5: true },
};

const estadoUsuarios = {
    usuarioSelecionado: null,
};

let proximoIdUsuario = MOCK_USUARIOS_DB.length + 1;


// ---- Render: tabela de usuários ----

function renderTabelaUsuarios() {
    const corpo = document.getElementById('tabelaUsuariosBody');
    corpo.innerHTML = '';

    MOCK_USUARIOS_DB.forEach(usuario => {
        const linha = document.createElement('tr');
        linha.className = 'linhaUsuario' + (usuario.usuario === estadoUsuarios.usuarioSelecionado ? ' active' : '');
        linha.onclick = () => selecionarUsuario(usuario.usuario);

        const tdNome = document.createElement('td');
        tdNome.textContent = usuario.usuario + ':';
        linha.appendChild(tdNome);

        linha.appendChild(criarCelulaCheckboxUsuario(usuario, 'homeLeitura'));
        linha.appendChild(criarCelulaCheckboxUsuario(usuario, 'homeEscrita'));
        linha.appendChild(criarCelulaCheckboxUsuario(usuario, 'isADM'));

        const tdRemover = document.createElement('td');
        const btnRemover = document.createElement('button');
        btnRemover.type = 'button';
        btnRemover.className = 'btnRemoverUsuario';
        btnRemover.textContent = 'x';
        btnRemover.onclick = (evento) => {
            evento.stopPropagation(); // senão o clique também "seleciona" a linha que acabamos de apagar
            removerUsuario(usuario.usuario);
        };
        tdRemover.appendChild(btnRemover);
        linha.appendChild(tdRemover);

        corpo.appendChild(linha);
    });
}

// Cria uma <td> com checkbox pra um campo booleano do usuário (homeLeitura, homeEscrita ou isADM)
function criarCelulaCheckboxUsuario(usuario, campo) {
    const td = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = usuario[campo];
    checkbox.onclick = (evento) => evento.stopPropagation(); // clicar no checkbox não deve "selecionar a linha" também
    checkbox.onchange = () => alternarPermissaoUsuario(usuario, campo);
    td.appendChild(checkbox);
    return td;
}

function alternarPermissaoUsuario(usuario, campo) {
    usuario[campo] = !usuario[campo];
    // TODO: PATCH /usuarios/{id} no futuro — atualiza Usuario.isADM ou a linha da
    // pasta Home em UsuarioPasta, dependendo do campo
}


// ---- Render: árvore de pastas do usuário selecionado ----

function renderArvorePastas() {
    const container = document.getElementById('arvorePastas');
    container.innerHTML = '';

    const usuario = estadoUsuarios.usuarioSelecionado;
    if (!usuario) {
        container.innerHTML = '<p style="opacity:0.7; text-align:center;">Selecione um usuário na tabela ao lado.</p>';
        return;
    }

    if (!MOCK_ACESSOS_PASTA[usuario]) MOCK_ACESSOS_PASTA[usuario] = {};
    const acessos = MOCK_ACESSOS_PASTA[usuario];

    // Percorre a árvore recursivamente: desenha a pasta atual, depois cada filho
    // (um nível mais indentado), depois os filhos dos filhos, etc.
    function montarItem(pasta, profundidade) {
        const linha = document.createElement('div');
        linha.className = 'itemPasta';
        linha.style.paddingLeft = (profundidade * 18) + 'px';

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!acessos[pasta.id];
        checkbox.onchange = () => alternarAcessoPasta(usuario, pasta.id, checkbox.checked);

        label.appendChild(checkbox);
        label.append(' ' + pasta.nome);
        linha.appendChild(label);
        container.appendChild(linha);

        pasta.filhos.forEach(filho => montarItem(filho, profundidade + 1));
    }

    MOCK_PASTAS.forEach(pasta => montarItem(pasta, 0));
}

function alternarAcessoPasta(usuario, pastaId, temAcesso) {
    MOCK_ACESSOS_PASTA[usuario][pastaId] = temAcesso;
    // TODO: POST/DELETE em /usuarios/{id}/pastas/{pastaId} no futuro (linha em UsuarioPasta)
}


// ---- Seleção de usuário, adicionar, remover, senha ----

function selecionarUsuario(usuario) {
    estadoUsuarios.usuarioSelecionado = usuario;
    document.getElementById('senhaUsuario').value = '';
    document.getElementById('confirmarSenha').value = '';
    renderTabelaUsuarios(); // só pra marcar a linha ativa
    renderArvorePastas();
}

function adicionarUsuario() {
    const novoId = proximoIdUsuario++;
    const novoNome = `usuario${novoId}`; // por enquanto um nome automático; um formulário de nome real fica pro futuro

    MOCK_USUARIOS_DB.push({ id: novoId, usuario: novoNome, isADM: false, homeLeitura: false, homeEscrita: false });
    MOCK_ACESSOS_PASTA[novoNome] = {}; // nenhuma pasta marcada ainda

    selecionarUsuario(novoNome); // já seleciona o usuário novo pra você preencher os dados dele

    // A aba Info também depende da lista de usuários (listaNomesUsuarios()), então
    // atualiza ela também — esse é o benefício de ter uma única base de dados mockada.
    renderResumoUso();
    renderListaUsuarios();

    // TODO: POST /usuarios no futuro
}

function removerUsuario(usuario) {
    const confirmado = confirm(`Remover ${usuario}? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    MOCK_USUARIOS_DB = MOCK_USUARIOS_DB.filter(u => u.usuario !== usuario);
    delete MOCK_ACESSOS_PASTA[usuario];

    if (estadoUsuarios.usuarioSelecionado === usuario) {
        estadoUsuarios.usuarioSelecionado = null;
    }

    renderTabelaUsuarios();
    renderArvorePastas();
    renderResumoUso();
    renderListaUsuarios();

    // TODO: DELETE /usuarios/{id} no futuro
}

function salvarSenhaUsuario() {
    const usuario = estadoUsuarios.usuarioSelecionado;
    if (!usuario) {
        alert('Selecione um usuário primeiro.');
        return;
    }

    const senha = document.getElementById('senhaUsuario').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (!senha || senha !== confirmarSenha) {
        alert('As senhas estão vazias ou não coincidem.');
        return;
    }

    // TODO: PATCH /usuarios/{id} no futuro, mandando a senha pro backend fazer o hash com bcrypt
    alert(`Senha de ${usuario} atualizada (simulado — nada foi salvo de verdade ainda).`);
    document.getElementById('senhaUsuario').value = '';
    document.getElementById('confirmarSenha').value = '';
}

function inicializarAbaUsuarios() {
    renderTabelaUsuarios();
    if (MOCK_USUARIOS_DB.length > 0) {
        selecionarUsuario(MOCK_USUARIOS_DB[0].usuario);
    }
}


// ======================================================================
// ABA ESPECIFICAÇÕES
// Simula a tabela MetaDados (config global de espaço máximo da nuvem)
// ======================================================================

let MOCK_ESPACO_MAXIMO_KB = 500 * 1024 * 1024; // 500Gb, na mesma unidade (KB) que o resto do sistema usa

function aplicarEspacoMaximo() {
    const input = document.getElementById('inputEspacoMaximo');
    const kb = converterParaKb(input.value);

    if (kb === null) {
        alert('Digite um valor válido, no formato "500Gb" ou "800Mb".');
        return;
    }

    MOCK_ESPACO_MAXIMO_KB = kb;
    input.value = formatarTamanho(kb); // reescreve já formatado, confirmando visualmente o que foi entendido
    // TODO: PATCH /metadados no futuro (tabela MetaDados.espacoMaximoNuvem_kb)
    alert(`Espaço máximo atualizado para ${formatarTamanho(kb)} (simulado — nada foi salvo de verdade ainda).`);
}

// Entende textos tipo "500Gb", "800 Mb", "1.5gb" e devolve o valor em KB
// (mesma unidade que tamanho_kb usa em Arquivo e MetaDados no banco real).
// Reaproveita formatarTamanho() (definida lá em cima, na aba Info) pro caminho inverso.
function converterParaKb(texto) {
    const match = texto.trim().match(/^([\d.,]+)\s*(kb|mb|gb)$/i);
    if (!match) return null;

    const numero = parseFloat(match[1].replace(',', '.'));
    if (isNaN(numero)) return null;

    const unidade = match[2].toLowerCase();
    if (unidade === 'gb') return Math.round(numero * 1024 * 1024);
    if (unidade === 'mb') return Math.round(numero * 1024);
    return Math.round(numero);
}


mostrarInfo();
inicializarAbaInfo();
inicializarAbaUsuarios();

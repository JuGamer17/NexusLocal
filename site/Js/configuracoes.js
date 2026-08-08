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
    window.close();
    window.location.href = 'index.html';
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

// Simula a tabela Usuario (só o campo "usuario", que é o que a UI precisa aqui)
const MOCK_USUARIOS = ['usuario1', 'usuario2', 'usuario3'];

// Paleta fixa pro gráfico de pizza: cada usuário pega uma cor pelo índice dele em
// MOCK_USUARIOS (usuario1 sempre azul, usuario2 sempre laranja, etc.), e essa MESMA
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
    return Promise.resolve(MOCK_USUARIOS);
}

// GET /log-acesso/resumo?tipo_acao=escrita&periodo=hoje  (futuro)
// Retorna o total de KB por usuário, filtrado por tipo de ação e período.
function apiBuscarResumoUso(tipo, periodo) {
    const totais = {};
    MOCK_USUARIOS.forEach(usuario => totais[usuario] = 0); // garante que todo mundo aparece, mesmo com 0

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

    const container = document.getElementById('resumoUsuarios');
    container.innerHTML = '';

    MOCK_USUARIOS.forEach((usuario, i) => {
        const cor = CORES_GRAFICO[i % CORES_GRAFICO.length];
        const p = document.createElement('p');
        p.innerHTML = `<span class="pontoCorUsuario" style="background-color:${cor};"></span>` +
                      `<span class="nomeUsuarioResumo">${usuario}:</span> ` +
                      `<span class="valorUsoResumo">${formatarTamanho(totais[usuario])}</span>`;
        container.appendChild(p);
    });

    // Reaproveita os mesmos `totais` que acabamos de buscar — não faz sentido
    // chamar a "API" de novo só pra desenhar o gráfico com os mesmos números.
    renderGraficoPizza(totais);
}

// Pinta o #graficoCirculo com um conic-gradient: uma "fatia" de cor por usuário,
// do tamanho proporcional ao que ele representa do total. O conic-gradient entende
// as paradas em porcentagem (0% a 100% = 0° a 360°), então só precisamos ir
// acumulando a porcentagem de cada fatia conforme passamos pelos usuários.
function renderGraficoPizza(totais) {
    const circulo = document.getElementById('graficoCirculo');
    const miolo = document.getElementById('graficoCirculoMiolo');

    const totalGeral = MOCK_USUARIOS.reduce((soma, usuario) => soma + totais[usuario], 0);

    if (totalGeral === 0) {
        circulo.style.background = 'var(--color-surface-1)';
        miolo.textContent = 'Sem dados';
        return;
    }

    let acumulado = 0;
    const fatias = MOCK_USUARIOS.map((usuario, i) => {
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

mostrarInfo();
inicializarAbaInfo();

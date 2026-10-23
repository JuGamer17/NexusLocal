//apos atualizar aqui usar o CNTR + SHIFT + R pra recarregar o cache, ou so muda algo no HTML
//algo assim <script src="script.js?v=<?=time()?>"></script>
const modal = document.getElementById("modal");
const bntExcluir = document.getElementById("excluir");

const areaArquivos = document.getElementById("contentArea");
const template = document.getElementById("template_arquivo");
const inputItem = document.getElementById("inputArquivo");
const caminho = document.querySelector("#caminhoo p i");
const token = localStorage.getItem("token");

let pastaAtual = null;        // null = lista de pastas
let arquivoModalAtual = null; // {id, name} do modal aberto


// ---- Sessão e requisições ----

function voltarParaLoguin() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

// fetch com token; 401 volta pro loguin
async function apiFetch(url, opcoes = {}) {
    const resposta = await fetch(url, {
        ...opcoes,
        headers: { ...opcoes.headers, "Authorization": "Bearer " + token }
    });

    if (resposta.status === 401) {
        voltarParaLoguin();
        throw new Error("Sessão expirada");
    }
    return resposta;
}


// ---- Controle de acesso ao botão "configurações" ----

// Lê o payload do JWT (sem verificar assinatura, só leitura)
function decodificarPayloadToken(tokenJwt) {
    try {
        const partePayload = tokenJwt.split('.')[1];
        const jsonPayload = atob(partePayload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(jsonPayload);
    } catch (erro) {
        return null;
    }
}

// Precisa da claim "isADM" no token (API)
function usuarioEhAdmin() {
    const payload = decodificarPayloadToken(token);
    return !!(payload && payload.isADM);
}

function irParaConfiguracoes() {
    window.location.href = 'configuracoes.html';
}

if (!usuarioEhAdmin()) {
    document.getElementById('btnConfiguracoes').style.display = 'none';
}

// Só interface: a proteção de verdade é TODO no backend


// ---- Grade de itens ----

function formatarTamanho(sizeKb) {
    if (sizeKb > 943719) return `${(sizeKb/1024/1024).toFixed(2)}Gb`;
    if (sizeKb > 922) return `${(sizeKb/1024).toFixed(2)}Mb`;
    return `${sizeKb}Kb`;
}

function iconeDoTipo(fileType) {
    if (fileType.includes("rar") || fileType.includes("zip")) return "Images/zip.png";
    if (fileType.includes("text")) return "Images/txt.png";
    if (fileType.includes("video")) return "Images/video.png";
    return "Images/NotFound.png";
}

// Cria um item na grade; aoClicar recebe o src atual da imagem
function criarItem(nome, tamanho, imagem, aoClicar) {
    const clone = template.content.cloneNode(true);
    const div = clone.querySelector(".arquivos");
    const img = clone.querySelector(".imagemTenplate");

    clone.querySelector(".nomeTemplate").textContent = nome;
    clone.querySelector(".tamanhoTemplate").textContent = tamanho;
    img.src = imagem;

    div.addEventListener("click", () => aoClicar(img.src));

    areaArquivos.append(clone);
    return img;
}

async function loadImg(img, url) {
    try {
        const response = await apiFetch(url);
        if (!response.ok) return;

        const blob = await response.blob(); // dados em binario
        img.src = URL.createObjectURL(blob); // link local da imagem (sem revoke: o modal reusa)
    } catch (erro) {
        console.log("Erro ao carregar imagem:", erro);
    }
}


// ---- Telas: pastas e arquivos ----

async function mostrarPastas() {
    pastaAtual = null;
    caminho.textContent = "home";
    areaArquivos.innerHTML = "";

    try {
        const response = await apiFetch("/api/pastas");
        if (!response.ok) {
            alert("Não foi possível carregar as pastas.");
            return;
        }

        const dados = await response.json();

        dados.pastas.forEach(pasta => {
            criarItem(pasta.nome, "", "Images/pasta.svg", () => abrirPasta(pasta));
        });
    } catch (erro) {
        console.log("Erro ao carregar pastas:", erro);
    }
}

async function abrirPasta(pasta) {
    pastaAtual = pasta;
    caminho.textContent = "home/" + pasta.nome;
    areaArquivos.innerHTML = "";

    try {
        const response = await apiFetch(`/api/pastas/${pasta.id}/arquivos`);
        if (!response.ok) {
            alert("Não foi possível abrir a pasta.");
            mostrarPastas();
            return;
        }

        const dados = await response.json();

        dados.files.forEach(arquivo => {
            const tamanho = formatarTamanho(arquivo.size_kb);
            const ehImagem = arquivo.fileType.includes("image");
            const imagem = ehImagem ? "Images/NotFound.png" : iconeDoTipo(arquivo.fileType);

            const img = criarItem(arquivo.name, tamanho, imagem, (src) => {
                abrirModalArquivo(arquivo, tamanho, src);
            });

            if (ehImagem) {
                loadImg(img, `/api/arquivos/${arquivo.id}`);
            }
        });

        // Só quem pode escrever na pasta vê o "+"
        if (pasta.pode_escrever) {
            criarItem("Adicionar Item", "", "Images/mais.png", () => inputItem.click());
        }
    } catch (erro) {
        console.log("Erro ao abrir pasta:", erro);
    }
}

// Volta pra tela atual (pasta aberta ou lista de pastas)
function recarregar() {
    if (pastaAtual) {
        abrirPasta(pastaAtual);
    } else {
        mostrarPastas();
    }
}


// ---- Modal ----

function abrirModalArquivo(arquivo, tamanho, imagemSrc) {
    arquivoModalAtual = arquivo;

    document.getElementById("nomeArquivo").textContent = arquivo.name;
    document.getElementById("tamanhoArquivo").textContent = tamanho;
    document.getElementById("modalImage").src = imagemSrc;
    modal.showModal();
}

// Clique no backdrop: o alvo é o próprio <dialog>
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.close();
    }
});

async function baixarArquivoAtual() {
    if (!arquivoModalAtual) return;

    try {
        const response = await apiFetch(`/api/arquivos/${arquivoModalAtual.id}/download`);
        if (!response.ok) {
            alert("Não foi possível baixar o arquivo.");
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = arquivoModalAtual.name;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (erro) {
        console.log("Erro no download:", erro);
    }
}

bntExcluir.addEventListener("click", async () => {
    if (!arquivoModalAtual) {
        modal.close();
        return;
    }

    const confirmado = confirm(`Excluir "${arquivoModalAtual.name}"? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    // TODO: DELETE /arquivos/{id} ainda não existe na API
    try {
        const response = await apiFetch(`/api/arquivos/${arquivoModalAtual.id}`, {
            method: "DELETE"
        });

        if (response.ok) {
            modal.close();
            recarregar();
        } else {
            alert("Não foi possível excluir o arquivo.");
        }
    } catch (erro) {
        alert("Erro ao excluir o arquivo.");
    }
});


// ---- Upload ----

inputItem.addEventListener("change", async () => {
    if (inputItem.files.length === 0 || !pastaAtual) return;
    const file = inputItem.files[0];

    // Sem Content-Type: o navegador monta o multipart
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await apiFetch(`/api/pastas/${pastaAtual.id}/arquivos`, {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            recarregar();
        } else {
            alert("Não foi possível enviar o arquivo.");
            console.log(response);
        }
    } catch (erro) {
        console.log("Erro ao enviar:", erro);
    }

    inputItem.value = "";
});


function sair(){
    voltarParaLoguin();
}


// ---- Início ----

if (token) {
    mostrarPastas();
} else {
    voltarParaLoguin();
}

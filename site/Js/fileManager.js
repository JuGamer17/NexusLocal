//apos atualizar aqui usar o CNTR + SHIFT + R pra recarregar o cache, ou so muda algo no HTML
//algo assim <script src="script.js?v=<?=time()?>"></script>
const modal = document.getElementById("modal");
const bntExcluir = document.getElementById("excluir");

const areaArquivos = document.getElementById("contentArea");
const template = document.getElementById("template_arquivo");
const clone = template.content.cloneNode(true);
const token = localStorage.getItem("token");
const inputItem = document.getElementById("inputArquivo");

let arquivoModalAtual = null; // nome do arquivo aberto no modal agora — usado pelo Excluir/Baixar

// Preenche e abre o modal a partir da div clicada na grade de arquivos. Ficou numa
// função só porque loadFiles() e testMode() faziam exatamente a mesma coisa aqui,
// só que copiada e colada duas vezes.
function abrirModalArquivo(divClick) {
    arquivoModalAtual = divClick.querySelector(".nomeTemplate").textContent;

    document.getElementById("nomeArquivo").textContent = arquivoModalAtual;
    document.getElementById("tamanhoArquivo").textContent = divClick.querySelector(".tamanhoTemplate").textContent;
    document.getElementById("modalImage").src = divClick.querySelector(".imagemTenplate").src;
    modal.showModal();
}


// ---- Controle de acesso ao botão "configurações" ----

// Decodifica só a "carga" (payload) de um JWT (a parte do meio, entre os dois pontos),
// sem verificar assinatura — isso não é uma verificação de segurança, é só uma leitura
// dos dados que o próprio token já carrega (ex: o nome do usuário).
function decodificarPayloadToken(tokenJwt) {
    try {
        const partePayload = tokenJwt.split('.')[1];
        const jsonPayload = atob(partePayload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(jsonPayload);
    } catch (erro) {
        return null;
    }
}

function usuarioEhAdmin() {
    if (token === "testMode") return true; // o usuário de demonstração (ADMIN, no loguin.js) é sempre admin

    // TODO: o backend ainda não coloca "isADM" no token (hoje só tem "sub" e "exp" —
    // ver create_access_token em api/app/main.py). Quando o login passar a incluir
    // essa claim, essa função já funciona sem precisar mudar mais nada aqui.
    const payload = decodificarPayloadToken(token);
    return !!(payload && payload.isADM);
}

function irParaConfiguracoes() {
    window.location.href = 'configuracoes.html';
}

if (!usuarioEhAdmin()) {
    document.getElementById('btnConfiguracoes').style.display = 'none';
}

// IMPORTANTE: isso é só interface — esconde o botão pra quem não é admin, mas não
// impede ninguém de digitar "configuracoes.html" direto na barra de endereço.
// A proteção de verdade (checar admin no backend antes de deixar entrar) ainda é TODO.



async function loadFiles() {
    

    

    const recived = await fetch("/api/loadFiles", {
        headers: {
            "Authorization": "Bearer " + token  
        }
    });

    const filess = await recived.json();
    
    
    

    areaArquivos.innerHTML = "";

    filess.files.forEach(async arquivo => {

        const clone = template.content.cloneNode(true);

        

        clone.querySelector(".nomeTemplate").textContent = arquivo.name;
        if (arquivo.size_kb > 943719){
            clone.querySelector(".tamanhoTemplate").textContent = `${(arquivo.size_kb/1024/1024).toFixed(2)}Gb`;
        }
        else if(arquivo.size_kb > 922){
            clone.querySelector(".tamanhoTemplate").textContent = `${(arquivo.size_kb/1024).toFixed(2)}Mb`;
        }
        else{
            clone.querySelector(".tamanhoTemplate").textContent = `${arquivo.size_kb}Kb`;
        }
        const img = clone.querySelector(".imagemTenplate");
        console.log(img);

        if(arquivo.fileType.includes("rar") ||
            arquivo.fileType.includes("zip")){
                img.src = `Images/zip.png`;
        }
        else if(arquivo.fileType.includes("image")){
            const url = `/api/getFile/${arquivo.name}`;
            loadImg(img, url);

            

        }
        else if(arquivo.fileType.includes("text")){
            img.src = `Images/txt.png`;
        }
        else if(arquivo.fileType.includes("video")){
            img.src = `Images/video.png`;
        }
        else{
            img.src = `Images/NotFound.png`;
        }

        const div = clone.querySelector(".arquivos");

        div.addEventListener("click", (e) =>{
            abrirModalArquivo(e.currentTarget);
        });
        

        areaArquivos.append(clone);


    });

    const clone = template.content.cloneNode(true);
    const div = clone.querySelector(".arquivos");
    clone.querySelector(".nomeTemplate").textContent = `Adicionar Item`;
    const img = clone.querySelector(".imagemTenplate");
    img.src = `Images/mais.png`;

    div.addEventListener("click", (e) =>{
        const divClick = e.currentTarget;
        inputItem.click();
        
    });


    
    
    areaArquivos.append(clone);



}


 async function loadImg(img, url) {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        const imgs = await response.blob();//dados em binario

        const imgUrl = URL.createObjectURL(imgs);//aparentemente cria um link pra acessar a imagem independente 
            
        img.src = imgUrl;

        //img.onload = () =>{
            //isso limpa a imagem da URL pra não ficar na memoria depois de carregada
            //URL.revokeObjectURL(imgUrl);
            //mas como vou usar no modal retirei isso, mas e util 
        //}
 }

// Arquivos fictícios usados só quando token === "testMode" (login sem API) — no mesmo
// formato que a API real devolveria em /api/loadFiles (name, size_kb, fileType), só que
// sem nenhum arquivo de verdade por trás. Fica em `let` (não `const`) porque em modo
// teste dá pra "enviar" um arquivo novo — ele só é adicionado aqui, na lista local.
let ARQUIVOS_TESTE = [
    { name: "video_aula_01.mp4",     size_kb: 15_500_000, fileType: "video/mp4" },
    { name: "projeto_final.zip",     size_kb: 33_500_000, fileType: "application/zip" },
    { name: "planilha_custos.xlsx",  size_kb: 340,        fileType: "application/vnd.openxmlformats" },
    { name: "roteiro_v2.txt",        size_kb: 12,         fileType: "text/plain" },
    { name: "audio_bruto.wav",       size_kb: 128_000,    fileType: "audio/wav" },
];

function testMode(){
    areaArquivos.innerHTML = "";

    ARQUIVOS_TESTE.forEach(arquivo => {
        const clone = template.content.cloneNode(true);

        clone.querySelector(".nomeTemplate").textContent = arquivo.name;

        if (arquivo.size_kb > 943719){
            clone.querySelector(".tamanhoTemplate").textContent = `${(arquivo.size_kb/1024/1024).toFixed(2)}Gb`;
        }
        else if(arquivo.size_kb > 922){
            clone.querySelector(".tamanhoTemplate").textContent = `${(arquivo.size_kb/1024).toFixed(2)}Mb`;
        }
        else{
            clone.querySelector(".tamanhoTemplate").textContent = `${arquivo.size_kb}Kb`;
        }

        const img = clone.querySelector(".imagemTenplate");

        // Se o arquivo já tem uma prévia gerada localmente (foi escolhido de verdade no
        // "Adicionar Item" em modo teste), usa ela direto — o navegador já tem o arquivo
        // em mãos, não precisa de nenhuma API pra isso.
        if (arquivo.previewUrl) {
            img.src = arquivo.previewUrl;
        }
        else if(arquivo.fileType.includes("rar") || arquivo.fileType.includes("zip")){
            img.src = `Images/zip.png`;
        }
        else if(arquivo.fileType.includes("text")){
            img.src = `Images/txt.png`;
        }
        else if(arquivo.fileType.includes("video") || arquivo.fileType.includes("audio")){
            img.src = `Images/video.png`;
        }
        else{
            img.src = `Images/NotFound.png`;
        }

        const div = clone.querySelector(".arquivos");

        div.addEventListener("click", (e) =>{
            abrirModalArquivo(e.currentTarget);
        });

        areaArquivos.append(clone);
    });

    const clone = template.content.cloneNode(true);
    const div = clone.querySelector(".arquivos");
    clone.querySelector(".nomeTemplate").textContent = `Adicionar Item`;
    const img = clone.querySelector(".imagemTenplate");
    img.src = `Images/mais.png`;

    div.addEventListener("click", (e) =>{
        const divClick = e.currentTarget;
        inputItem.click();
        
    });


    
    
    areaArquivos.append(clone);
}

// Adiciona um arquivo escolhido de verdade (pelo <input type="file">) na lista local de
// teste, sem mandar nada pra API — só "finge" que o upload deu certo.
function adicionarArquivoTeste(file) {
    const novoArquivo = {
        name: file.name,
        size_kb: Math.round(file.size / 1024),
        fileType: file.type || "application/octet-stream",
    };

    if (novoArquivo.fileType.includes("image")) {
        novoArquivo.previewUrl = URL.createObjectURL(file); // miniatura direto do arquivo, sem precisar de rede
    }

    ARQUIVOS_TESTE.push(novoArquivo);
    testMode(); // reconstrói a lista com o arquivo novo já incluído
}

if(token == "testMode"){
    testMode();
}else{
    loadFiles();
}







inputItem.addEventListener("change", async () => {
    if (inputItem.files.length === 0) return;
    const file = inputItem.files[0];

    if (token === "testMode") {
        adicionarArquivoTeste(file);
        inputItem.value = "";
        return; // não chega no fetch lá embaixo — modo teste não fala com nenhuma API
    }

    const formData = new FormData();
    formData.append("file", file);
    try{

        const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
            
        });
        if(response.ok){
            loadFiles();
        }else{
            console.log("erro ao enviar");
            console.log(response);
        }

    }catch(e){
        console.log("deu erro ó: ", e);
    }
    inputItem.value = "";

});


bntExcluir.addEventListener("click", async () => {
    if (!arquivoModalAtual) {
        modal.close();
        return;
    }

    const confirmado = confirm(`Excluir "${arquivoModalAtual}"? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    if (token === "testMode") {
        // Modo teste: remove só do array local e redesenha a lista, sem tentar API
        ARQUIVOS_TESTE = ARQUIVOS_TESTE.filter(arquivo => arquivo.name !== arquivoModalAtual);
        modal.close();
        testMode();
        return;
    }

    // TODO: o backend ainda não tem nenhuma rota de exclusão (só existem /login,
    // /upload, /loadFiles e /getFile em api/app/main.py). Quando existir algo
    // tipo DELETE /deleteFile/{filename}, essa chamada já deve funcionar, já
    // que a URL/método abaixo seguem o mesmo padrão das outras rotas.
    try {
        const response = await fetch(`/api/deleteFile/${arquivoModalAtual}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.ok) {
            modal.close();
            loadFiles();
        } else {
            alert("Não foi possível excluir o arquivo.");
        }
    } catch (erro) {
        alert("Essa ação ainda depende de uma rota de exclusão que o backend ainda não tem.");
    }
});

// Fecha o modal clicando fora dele (no backdrop escuro). Clicar no backdrop de um
// <dialog> nativo dispara um click cujo target é o próprio elemento <dialog> —
// diferente de clicar em algo DENTRO dele (o alvo aí seria o filho clicado, tipo
// #backgrowndModal ou um botão). Por isso o `e.target === modal` funciona: só
// é verdadeiro quando o clique foi na área vazia ao redor do conteúdo.
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.close();
    }
});

function sair(){
    localStorage.setItem("token", "");
    window.location.href = "index.html";
}



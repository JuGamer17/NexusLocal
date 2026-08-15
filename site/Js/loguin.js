//apos atualizar aqui usar o CNTR + SHIFT + R pra recarregar o cache, ou so muda algo no HTML
//algo assim <script src="script.js?v=<?=time()?>"></script>
//aqui tera um usuario padrão para casos de testes locais sem a API.

const ADMIN_USER_PADRAO = "ADMIN";
const ADMIN_SENHA_PADRAO = "SENHA123321";


// ---- Referências e troca entre as 3 telas (mesma técnica do configuracoes.js) ----

const telaLogin = document.getElementById("telaLogin");
const telaCodigoRecuperacao = document.getElementById("telaCodigoRecuperacao");
const telaAlterarSenhaAdmin = document.getElementById("telaAlterarSenhaAdmin");

function mostrarTelaLogin() {
    telaLogin.style.display = '';
    telaCodigoRecuperacao.style.display = 'none';
    telaAlterarSenhaAdmin.style.display = 'none';
}

function mostrarTelaCodigoRecuperacao() {
    telaLogin.style.display = 'none';
    telaCodigoRecuperacao.style.display = '';
    telaAlterarSenhaAdmin.style.display = 'none';

    enviarCodigoRecuperacao(); // "manda" o código assim que a tela abre
}

function mostrarTelaAlterarSenhaAdmin() {
    telaLogin.style.display = 'none';
    telaCodigoRecuperacao.style.display = 'none';
    telaAlterarSenhaAdmin.style.display = '';
}


// ---- Login normal ----

const button  = document.getElementById("logar");

button.addEventListener('click', async function(){
    const sndUser = document.getElementById("Usuario").value;
    const sndPassword = document.getElementById("Senha").value;

    // Todo o fluxo do usuário ADMIN (o de bootstrap/teste) é resolvido AQUI, só no
    // navegador — certo ou errado, nunca chega a tentar a API de verdade, porque
    // esse usuário não existe lá (é um atalho local, não um usuário do banco).
    if (sndUser === ADMIN_USER_PADRAO) {
        // Se já existir uma senha salva (porque o admin trocou ela antes), usa
        // essa; senão, cai na senha padrão de fábrica.
        const senhaAtualAdmin = localStorage.getItem('senhaAdmin') || ADMIN_SENHA_PADRAO;

        if (sndPassword === senhaAtualAdmin) {
            if (!localStorage.getItem('primeiroAcessoAdminConcluido')) {
                // Primeiro login do admin: obriga a trocar a senha antes de liberar o acesso
                mostrarTelaAlterarSenhaAdmin();
                return;
            }

            localStorage.setItem("token", "testMode");
            window.location.href = "areaArquivos.html";
            return;
        }

        // Senha errada especificamente pro admin: mostra o erro e já revela o
        // link de recuperação, sem tentar nenhum fetch (não tem API pra tentar).
        alert("usuario ou senha incorreta");
        document.getElementById('linkEsqueciSenha').style.display = '';
        return;
    }


    // Daqui pra baixo é um usuário "de verdade" (não o ADMIN local) — aí sim
    // faz sentido tentar a API.
    const formData = new FormData();
    formData.append("username", sndUser);
    formData.append("password", sndPassword);

    let response;
    try {
        response = await fetch("/api/login", {
            method: "POST",
            body: formData
        });
    } catch (erro) {
        alert("Não foi possível conectar à API.");
        return;
    }

    if (!response.ok) {
        alert("usuario ou senha incorreta");
        return;
    }

    const data = await response.json();

    console.log(data.access_token)
    localStorage.setItem("token", data.access_token);
    window.location.href = "areaArquivos.html";
});


// ---- Recuperação de senha do admin (único usuário com esse fluxo, por enquanto) ----

let CODIGO_RECUPERACAO_GERADO = null;

// Simula o backend gerando um código de 6 dígitos e mandando por e-mail.
// TODO: trocar por um POST /admin/recuperacao/enviar de verdade — o código tem
// que nascer e ficar guardado no servidor, nunca só aqui no navegador como agora
// (e o alert() é só pra testar sem precisar de um servidor de e-mail de verdade).
function enviarCodigoRecuperacao() {
    CODIGO_RECUPERACAO_GERADO = String(Math.floor(100000 + Math.random() * 900000));
    alert(`[SIMULADO] Um e-mail com o código ${CODIGO_RECUPERACAO_GERADO} seria enviado agora.`);
}

function confirmarCodigoRecuperacao() {
    const codigoDigitado = document.getElementById('codigoRecuperacao').value.trim();

    // TODO: trocar por um POST /admin/recuperacao/confirmar de verdade — quem
    // valida o código tem que ser o servidor, não o navegador de quem está tentando entrar
    if (codigoDigitado !== CODIGO_RECUPERACAO_GERADO) {
        alert('Código incorreto.');
        return;
    }

    mostrarTelaAlterarSenhaAdmin();
}


// ---- Definir nova senha do admin (1º login OU depois de confirmar o código) ----

function salvarNovaSenhaAdmin() {
    const novaSenha = document.getElementById('novaSenhaAdmin').value;
    const confirmarSenha = document.getElementById('confirmarNovaSenhaAdmin').value;
    const email = document.getElementById('emailRecuperacaoAdmin').value;

    if (!novaSenha || novaSenha !== confirmarSenha) {
        alert('As senhas estão vazias ou não coincidem.');
        return;
    }

    if (!email || !email.includes('@')) {
        alert('Digite um e-mail válido para recuperação.');
        return;
    }

    // TODO: PATCH /admin/senha no futuro — manda novaSenha (o backend faz o hash
    // com bcrypt) e o email de recuperação, gravando na tabela Usuario do admin.
    //
    // IMPORTANTE: guardar senha em texto puro no localStorage é só pra essa fase
    // de testes sem backend — NUNCA faça isso em produção. Quando a API existir,
    // ela guarda a senha com hash (bcrypt) no banco, e o navegador nunca mais
    // precisa saber/guardar a senha depois de enviar ela uma vez no cadastro/troca.
    localStorage.setItem('senhaAdmin', novaSenha);
    localStorage.setItem('emailRecuperacaoAdmin', email);
    localStorage.setItem('primeiroAcessoAdminConcluido', 'true');
    localStorage.setItem("token", "testMode");
    window.location.href = "areaArquivos.html";
}


mostrarTelaLogin();

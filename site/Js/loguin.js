//apos atualizar aqui usar o CNTR + SHIFT + R pra recarregar o cache, ou so muda algo no HTML
//algo assim <script src="script.js?v=<?=time()?>"></script>

// Só pra decidir quando mostrar "Esqueci minha senha"
const ADMIN_USER_PADRAO = "ADMIN";

// Limpa sobras dos testes sem API
localStorage.removeItem('senhaAdmin');
localStorage.removeItem('emailRecuperacaoAdmin');
localStorage.removeItem('primeiroAcessoAdminConcluido');
if (localStorage.getItem('token') === 'testMode') {
    localStorage.removeItem('token');
}


// ---- Troca entre as 3 telas ----

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

    enviarCodigoRecuperacao(); // "manda" o código ao abrir a tela
}

function mostrarTelaAlterarSenhaAdmin() {
    telaLogin.style.display = 'none';
    telaCodigoRecuperacao.style.display = 'none';
    telaAlterarSenhaAdmin.style.display = '';
}


// ---- Login ----

const button  = document.getElementById("logar");

button.addEventListener('click', async function(){
    const sndUser = document.getElementById("Usuario").value;
    const sndPassword = document.getElementById("Senha").value;

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
        if (response.status === 401) {
            alert("usuario ou senha incorreta");
        } else {
            alert(`Erro no servidor (${response.status}).`);
        }

        // Admin errou a senha: libera a recuperação
        if (response.status === 401 && sndUser.trim().toLowerCase() === ADMIN_USER_PADRAO.toLowerCase()) {
            document.getElementById('linkEsqueciSenha').style.display = '';
        }
        return;
    }

    const data = await response.json();

    localStorage.setItem("token", data.access_token);
    window.location.href = "areaArquivos.html";
});


// ---- Recuperação de senha do admin (simulada) ----

let CODIGO_RECUPERACAO_GERADO = null;

// TODO: POST /admin/recuperacao/enviar — o código tem que ficar no servidor
function enviarCodigoRecuperacao() {
    CODIGO_RECUPERACAO_GERADO = String(Math.floor(100000 + Math.random() * 900000));
    alert(`[SIMULADO] Um e-mail com o código ${CODIGO_RECUPERACAO_GERADO} seria enviado agora.`);
}

// TODO: POST /admin/recuperacao/confirmar — quem valida é o servidor
function confirmarCodigoRecuperacao() {
    const codigoDigitado = document.getElementById('codigoRecuperacao').value.trim();

    if (codigoDigitado !== CODIGO_RECUPERACAO_GERADO) {
        alert('Código incorreto.');
        return;
    }

    mostrarTelaAlterarSenhaAdmin();
}


// ---- Nova senha do admin (simulada) ----

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

    // TODO: PATCH /admin/senha (a API faz o hash e grava no banco)
    alert('[SIMULADO] Senha não alterada: a rota ainda não existe.');
    mostrarTelaLogin();
}


mostrarTelaLogin();

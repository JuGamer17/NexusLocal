//apos atualizar aqui usar o CNTR + SHIFT + R pra recarregar o cache, ou so muda algo no HTML
//algo assim <script src="script.js?v=<?=time()?>"></script>

const button  = document.getElementById("logar");

button.addEventListener('click', async function(){
    const sndUser = document.getElementById("Usuario").value;
    const sndPassword = document.getElementById("Senha").value;


    const formData = new FormData();
    formData.append("username", sndUser);
    formData.append("password", sndPassword);

    const response = await fetch("/api/login", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        alert("usuario ou senha incorreta");
        return;
    }

    
    const data = await response.json();

    
    
    console.log(data.access_token)
    localStorage.setItem("token", data.access_token);
    window.location.href = "areaArquivos.html";

    

});
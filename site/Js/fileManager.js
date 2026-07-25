//apos atualizar aqui usar o CNTR + SHIFT + R pra recarregar o cache, ou so muda algo no HTML
//algo assim <script src="script.js?v=<?=time()?>"></script>
const modal = document.getElementById("modal");
const bntExcluir = document.getElementById("excluir");

const areaArquivos = document.getElementById("contentArea");
const template = document.getElementById("template_arquivo");
const clone = template.content.cloneNode(true);
const token = localStorage.getItem("token");
const inputItem = document.getElementById("inputArquivo");

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
            const divClick = e.currentTarget;
            document.getElementById("nomeArquivo").textContent = divClick.querySelector(".nomeTemplate").textContent;
            document.getElementById("tamanhoArquivo").textContent = divClick.querySelector(".tamanhoTemplate").textContent;
            document.getElementById("modalImage").src = divClick.querySelector(".imagemTenplate").src;
            modal.showModal();
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

loadFiles();





inputItem.addEventListener("change", async () => {
    if (inputItem.files.length === 0) return;
    const file = inputItem.files[0];

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


bntExcluir.addEventListener("click", () =>{
    modal.close();
});



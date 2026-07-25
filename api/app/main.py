from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer

from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime, timedelta
from jose import JWTError, jwt  
from passlib.context import CryptContext  
from dotenv import load_dotenv

import os
import shutil
import logging
import mimetypes

#VERIFICAR SOBRE EXPIRAR O TOKEN E JOGAR DE VOLTA PRA TELA DE LOGUIN QUANDO OCORRER
#E TAMBEM EXIGIR O HASH NOS OUTROS METODOS

# Carrega as variáveis do arquivo .env (que fica fora do Git) para dentro de os.environ
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY não definida. Copie api/.env.example para api/.env e preencha os valores.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") 
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")



def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)



def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    return username




UPLOAD_DIR = Path("storage").resolve()
UPLOAD_DIR.mkdir(exist_ok=True)

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

logger = logging.getLogger("nuvem")
logger.setLevel(logging.INFO)

handler = RotatingFileHandler(
    "logs/app.log",
    maxBytes=5_000_000,  # 5MB
    backupCount=5
)

formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s"
)

handler.setFormatter(formatter)
logger.addHandler(handler)




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.18.12:8080",
        "http://localhost:8080"
    ],  # restringe ques sites podem ascessar a API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Usuário e senha (já em HASH bcrypt) vêm do .env — nunca em texto puro no código.
# Isso é temporário: o próximo passo é buscar essa informação na tabela Usuario do MySQL.
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
usuarios = {
    ADMIN_USERNAME: {
        "username": ADMIN_USERNAME,
        "hashed_password": os.getenv("ADMIN_PASSWORD_HASH")
    }
}
#=====================================================================
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):

    user = usuarios.get(username)

    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos"
        )

    access_token = create_access_token(
        data={"sub": user["username"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    name = user["username"]

    logger.warning(f"o usuario {name} foi acessado")
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/")
async def teste():
    return {"status": "Online"}

#==================================================

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    
    Personal_Path = (UPLOAD_DIR / current_user).resolve()
    Personal_Path.mkdir(exist_ok=True)

    file_path = Personal_Path / file.filename


    if not file_path.is_relative_to(Personal_Path):
        logger.warning(f"erro no caminho: {file.filename}")
        raise HTTPException(status_code=403)
    

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    logger.info(f"{file.filename}, foi adicionado ao banco do usuario: {current_user}")
    
    return {"Uploaded": "ok"}

#=======================================================
@app.get("/loadFiles")
async def loadFiles(current_user: str = Depends(get_current_user)):
    files = []
    for file in ((UPLOAD_DIR / current_user).resolve()).iterdir():
        if file.is_file():

            fileStat = file.stat()
            mime_type, _ = mimetypes.guess_type(file.name)
            
            files.append({
                "name":file.name,
                "size_kb": round(fileStat.st_size / 1024, 2),
                "fileType": mime_type or "application/octet-stream"
            })

    return{"files": files}

#=============================================================
@app.get("/getFile/{filename}")
async def getFile(filename: str, current_user: str = Depends(get_current_user)):

    Personal_Path = (UPLOAD_DIR / current_user).resolve()
    file_path = (Personal_Path / filename).resolve()

    if not file_path.is_relative_to(Personal_Path):
        logger.warning(f"tentativa de path traversal: {filename}, usuario {current_user}")
        raise HTTPException(status_code=403)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="arquivo não encontrado")

    logger.info(f"{filename}, foi baixado pelo usuario {current_user}")
    return FileResponse(file_path)

-- ============================================================
-- NexusLocal - Script inicial do banco de dados (MySQL)
-- 6 tabelas: Usuario, Pasta, MetaDados, UsuarioPasta, Arquivo, LogAcesso
--
-- A ORDEM de criacao importa: uma tabela com FOREIGN KEY so pode ser
-- criada depois da tabela que ela referencia. Por isso primeiro vem
-- as tabelas "pai" (sem FK) e depois as "filhas".
-- ============================================================


-- ------------------------------------------------------------
-- TABELAS PAI (nao dependem de nenhuma outra)
-- ------------------------------------------------------------

-- Usuarios do sistema.
-- 'senha' guarda o HASH bcrypt (nunca a senha em texto puro).
-- UNIQUE em 'usuario': o banco impede dois logins com o mesmo nome.
-- precisa_trocar_senha: 1 = o proximo acesso exige nova senha.
CREATE TABLE Usuario (
    id      INT          NOT NULL AUTO_INCREMENT,
    usuario VARCHAR(50)  NOT NULL,
    senha   VARCHAR(255) NOT NULL,
    isADM   BOOLEAN      NOT NULL,
    precisa_trocar_senha BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuario_usuario (usuario)
) ENGINE=InnoDB;

-- Pastas do espaco de armazenamento compartilhado.
-- Existem independentes dos usuarios; quem acessa o que e definido
-- na tabela de ligacao UsuarioPasta.
CREATE TABLE Pasta (
    id   INT          NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Configuracao global da nuvem (ex: espaco maximo). Sem FK.
CREATE TABLE MetaDados (
    id                   INT          NOT NULL AUTO_INCREMENT,
    espacoMaximoNuvem_kb INT          NOT NULL,
    descricao            VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;


-- ------------------------------------------------------------
-- TABELAS FILHAS (dependem das tabelas acima)
-- ------------------------------------------------------------

-- Tabela de ligacao N:N entre Usuario e Pasta.
-- Cada linha diz: "este usuario, nesta pasta, pode ler? pode escrever?"
-- ON DELETE CASCADE: apagar o usuario ou a pasta apaga as permissoes
-- ligadas a ele (uma permissao sem usuario/pasta nao faz sentido).
CREATE TABLE UsuarioPasta (
    id            INT     NOT NULL AUTO_INCREMENT,
    Usuario_id    INT     NOT NULL,
    Pasta_id      INT     NOT NULL,
    pode_ler      BOOLEAN NOT NULL,
    pode_escrever BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_usuariopasta_usuario
        FOREIGN KEY (Usuario_id) REFERENCES Usuario (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_usuariopasta_pasta
        FOREIGN KEY (Pasta_id) REFERENCES Pasta (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Metadados dos arquivos (o arquivo em si fica no disco, nao no banco).
-- tamanho_kb: guardado em KB; a conversao para MB/GB e feita na API.
-- UNIQUE (Pasta_id, nome): nao pode haver dois arquivos com o mesmo
-- nome dentro da mesma pasta (mas pastas diferentes podem repetir nomes).
-- ON DELETE CASCADE: apagar a pasta apaga os registros dos arquivos dela.
CREATE TABLE Arquivo (
    id               INT          NOT NULL AUTO_INCREMENT,
    nome             VARCHAR(255) NOT NULL,
    tamanho_kb       INT          NOT NULL,
    Pasta_id         INT          NOT NULL,
    data_modificacao DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_arquivo_pasta_nome (Pasta_id, nome),
    CONSTRAINT fk_arquivo_pasta
        FOREIGN KEY (Pasta_id) REFERENCES Pasta (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Log de acessos: UMA linha por acao individual (leitura ou escrita).
-- Essa granularidade permite os filtros "hoje / 7 dias / 1 mes" com
-- WHERE data_hora >= X. O volume de dados de cada acesso NAO e
-- duplicado aqui: a API faz JOIN com Arquivo para pegar tamanho_kb.
-- INDEX em data_hora: acelera exatamente esses filtros por periodo.
-- ON DELETE CASCADE: apagar usuario ou arquivo apaga os logs dele.
CREATE TABLE LogAcesso (
    id         INT                       NOT NULL AUTO_INCREMENT,
    Usuario_id INT                       NOT NULL,
    Arquivo_id INT                       NOT NULL,
    tipo_acao  ENUM('leitura','escrita') NOT NULL,
    data_hora  DATETIME                  NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_logacesso_data_hora (data_hora),
    CONSTRAINT fk_logacesso_usuario
        FOREIGN KEY (Usuario_id) REFERENCES Usuario (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_logacesso_arquivo
        FOREIGN KEY (Arquivo_id) REFERENCES Arquivo (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;




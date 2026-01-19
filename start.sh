#!/bin/bash

# 1. Escreve o conteúdo da variável de ambiente DB_SSL_CA no arquivo temporário.
# O Render passa o conteúdo do certificado como uma string.
# O Node.js/mysql2 precisa de um caminho de arquivo para o CA.
echo "$DB_SSL_CA" > /tmp/ca.pem

# 2. Inicia o servidor Node.js, passando o caminho do arquivo CA como uma nova variável de ambiente.
# O servidor usará esta nova variável para se conectar ao banco de dados.
DB_SSL_CA_PATH="/tmp/ca.pem" node server/dist/index.js
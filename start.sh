#!/bin/bash
echo "$DB_SSL_CA" > /tmp/ca.pem
DB_SSL_CA_PATH="/tmp/ca.pem" node server/dist/index.js
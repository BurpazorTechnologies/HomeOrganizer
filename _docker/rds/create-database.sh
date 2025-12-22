#!/usr/bin/env bash

/usr/bin/mariadb --user=root --password="yqQ6yI6QvTO5" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS homeorganizerdb;
    GRANT ALL PRIVILEGES ON \`homeorganizerdb%\`.* TO 'homeorganizerdb_user'@'%';
EOSQL

/usr/bin/mariadb --user=root --password="yqQ6yI6QvTO5" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS homeorganizerdb_testing;
    GRANT ALL PRIVILEGES ON \`homeorganizerdb_testing%\`.* TO 'homeorganizerdb_user'@'%';
EOSQL
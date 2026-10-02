-- Local compose credentials only. Production provisions distinct secrets out of band.
CREATE ROLE learning_app LOGIN PASSWORD 'development-app' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE learning_auth LOGIN PASSWORD 'development-auth' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE learning_worker LOGIN PASSWORD 'development-worker' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

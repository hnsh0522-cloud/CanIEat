FROM postgres:16

COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY necessaryAllergies.sql /docker-entrypoint-initdb.d/02-necessary-allergies.sql
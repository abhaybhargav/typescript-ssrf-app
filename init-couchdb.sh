#!/bin/bash
set -e

curl -X PUT http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@couchdb:5984/sensitive_data

curl -X PUT http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@couchdb:5984/sensitive_data/1 \
     -H "Content-Type: application/json" \
     -d '{"type": "user_credentials", "username": "admin", "password": "supersecret"}'

curl -X PUT http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@couchdb:5984/sensitive_data/2 \
     -H "Content-Type: application/json" \
     -d '{"type": "api_key", "service": "payment_gateway", "key": "pk_live_abcdefghijklmnop"}'

curl -X PUT http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@couchdb:5984/sensitive_data/3 \
     -H "Content-Type: application/json" \
     -d '{"type": "customer_data", "name": "John Doe", "email": "john@example.com", "ssn": "123-45-6789"}'
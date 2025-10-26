#!/bin/bash

kubectl port-forward svc/auth-service -n paas-platform 5000:80 &
kubectl port-forward svc/deployment-service -n paas-platform 8080:80 &
kubectl port-forward svc/frontend-service -n paas-platform 3000:80 &
kubectl port-forward svc/mongodb-service -n core-services 27017:27017 &
kubectl port-forward svc/postgres-service -n core-services 5432:5432 &
wait

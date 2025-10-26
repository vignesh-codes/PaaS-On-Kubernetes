# PaaS Platform Kubernetes Manifests

This directory contains all the Kubernetes manifests required to deploy the PaaS Platform on your local Kubernetes cluster.

## Architecture Overview

The platform consists of three main services:

1. **Auth Service** (Node.js/TypeScript) - User authentication and authorization
2. **Deployment Service** (Go) - Core deployment management functionality
3. **Frontend Service** (React/Vite) - Web UI for the platform

## Prerequisites

- Kubernetes cluster (minikube, kind, or any other local cluster)
- kubectl configured to access your cluster
- Docker images built and available (see deployment notes below)

## Quick Start

### 1. Deploy all resources

```bash
# Apply all manifests
kubectl apply -f k8s-manifests/

# Or using kustomize
kubectl apply -k k8s-manifests/
```

### 2. Check deployment status

```bash
# Check pods
kubectl get pods -A

# Check services
kubectl get svc -A

# Check ingress
kubectl get ingress -A
```

### 3. Access the application

If using minikube:
```bash
# Get the frontend URL
minikube service frontend-service -n paas-platform --url

# Get the auth service URL
minikube service auth-service -n paas-platform --url

# Get the deployment service URL
minikube service deployment-service -n core-services --url
```

## Components

### Namespaces
- `paas-platform`: Main application namespace
- `core-services`: Core services and databases

### Services

#### Auth Service
- **Image**: `vickydeploys/user-service-v1:latest`
- **Port**: 5000
- **Namespace**: `paas-platform`
- **Dependencies**: MongoDB (external)

#### Deployment Service
- **Image**: `dubemezeagwu/deployment-service:v0.0.9`
- **Port**: 8080
- **Namespace**: `core-services`
- **Dependencies**: PostgreSQL, Redis, MongoDB (external)
- **RBAC**: Full Kubernetes API access for deployment management

#### Frontend Service
- **Image**: `dubemezeagwu/frontend-service:v0.0.1`
- **Port**: 5173
- **Namespace**: `paas-platform`
- **Dependencies**: Auth Service, Deployment Service

### Databases

#### PostgreSQL
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Storage**: 10Gi PVC
- **Namespace**: `core-services`

#### Redis
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Storage**: 5Gi PVC
- **Namespace**: `core-services`

### Configuration

All configuration is managed through ConfigMaps and Secrets:

- **ConfigMaps**: Non-sensitive configuration
- **Secrets**: Sensitive data (passwords, JWT secrets, database URLs)

## Environment Variables

### Auth Service
- `NODE_ENV`: production
- `PORT`: 5000
- `JWT_SECRET`: JWT signing secret
- `MONGOURL`: MongoDB connection string

### Deployment Service
- `ENVIRONMENT`: dev
- `PORT`: :8080
- `REGION`: us-west-2
- `REDIS_SERVER`: redis-service:6379
- `POSTGRESDB_HOST`: postgres-service
- `POSTGRESDB_DB`: paas_db
- `POSTGRESDB_PORT`: 5432
- `POSTGRESDB_USER`: paas_user
- `POSTGRESDB_PWD`: paas_password
- `MONGODB_USER`: user1
- `MONGODB_PWD`: dbUser1PassWord
- `MONGODB_NAME`: Cluster0
- `JWT_SECRET`: JWT signing secret

### Frontend Service
- `NODE_ENV`: production
- `VITE_API_URL`: http://deployment-service.core-services.svc.cluster.local
- `VITE_AUTH_URL`: http://auth-service.paas-platform.svc.cluster.local

## Networking

### Services
- All services are exposed as ClusterIP services
- Ingress is configured for external access
- Service-to-service communication uses internal DNS

### Ingress
- **Frontend**: `localhost/`
- **Auth API**: `localhost/api/auth`
- **Deployment API**: `localhost/api/deployments`

## Storage

### Persistent Volumes
- **PostgreSQL**: 10Gi PVC for database data
- **Redis**: 5Gi PVC for cache persistence

## Security

### RBAC
- ServiceAccount: `deployment-service-sa`
- ClusterRole: `deployment-service-role`
- Permissions: Full access to pods, services, deployments, ingresses

### Secrets Management
- All sensitive data stored in Kubernetes Secrets
- JWT secrets, database passwords, connection strings

## Monitoring and Health Checks

### Health Probes
- **Readiness**: HTTP GET on `/health` endpoint
- **Liveness**: HTTP GET on `/health` endpoint
- **Initial Delay**: 10-30 seconds
- **Period**: 5-10 seconds

### Resource Limits
- **Auth Service**: 512Mi memory, 500m CPU
- **Deployment Service**: 1Gi memory, 1000m CPU
- **Frontend Service**: 512Mi memory, 500m CPU
- **PostgreSQL**: 512Mi memory, 500m CPU
- **Redis**: 256Mi memory, 200m CPU

## Troubleshooting

### Common Issues

1. **Pods not starting**: Check image availability and resource limits
2. **Service connectivity**: Verify service names and ports
3. **Database connection**: Check PostgreSQL and Redis pods
4. **RBAC issues**: Verify ServiceAccount and ClusterRoleBinding

### Useful Commands

```bash
# Check pod logs
kubectl logs -f deployment/auth-service -n paas-platform
kubectl logs -f deployment/deployment-service -n core-services
kubectl logs -f deployment/frontend-service -n paas-platform

# Check service endpoints
kubectl get endpoints -A

# Check ingress status
kubectl describe ingress paas-platform-ingress -n paas-platform

# Port forward for testing
kubectl port-forward svc/frontend-service 3000:80 -n paas-platform
kubectl port-forward svc/auth-service 5000:80 -n paas-platform
kubectl port-forward svc/deployment-service 8080:80 -n core-services
```

## Customization

### Image Tags
Update the image tags in `kustomization.yaml` or directly in the deployment files.

### Resource Limits
Modify the `resources` section in each deployment to adjust CPU and memory limits.

### Environment Variables
Add or modify environment variables in the respective ConfigMaps and Secrets.

### Scaling
Adjust the `replicas` field in deployments to scale services horizontally.

## Cleanup

To remove all resources:

```bash
kubectl delete -f k8s-manifests/
# or
kubectl delete -k k8s-manifests/
```

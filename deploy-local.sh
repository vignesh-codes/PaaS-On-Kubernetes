#!/bin/bash

# Deploy PaaS Platform to local Kubernetes
set -e

echo "🚀 Deploying PaaS Platform to local Kubernetes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to Kubernetes
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    print_warning "Make sure your Kubernetes cluster is running and kubectl is configured"
    exit 1
fi

print_status "Deploying all Kubernetes manifests..."

# Apply all manifests
kubectl apply -f k8s-manifests/

if [ $? -eq 0 ]; then
    print_status "✅ All manifests applied successfully"
else
    print_error "❌ Failed to apply manifests"
    exit 1
fi

print_status "Waiting for deployments to be ready..."

# Wait for deployments to be ready
kubectl wait --for=condition=available --timeout=300s deployment/auth-service -n paas-platform
kubectl wait --for=condition=available --timeout=300s deployment/deployment-service -n core-services
kubectl wait --for=condition=available --timeout=300s deployment/frontend-service -n paas-platform

print_status "🎉 Deployment completed successfully!"
echo ""
echo "Services deployed:"
echo "  - Auth Service: paas-platform namespace"
echo "  - Deployment Service: core-services namespace"
echo "  - Frontend Service: paas-platform namespace"
echo "  - MongoDB: core-services namespace"
echo "  - PostgreSQL: core-services namespace"
echo "  - Redis: core-services namespace"
echo ""
echo "To check status:"
echo "  kubectl get pods -A"
echo "  kubectl get svc -A"
echo ""
echo "To access services:"
echo "  kubectl port-forward svc/frontend-service 3000:80 -n paas-platform"
echo "  kubectl port-forward svc/auth-service 5000:80 -n paas-platform"
echo "  kubectl port-forward svc/deployment-service 8080:80 -n core-services"










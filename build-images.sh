#!/bin/bash

# Build script for all PaaS Platform services
set -e

echo "🚀 Building PaaS Platform Docker Images..."

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

# Build Auth Service
print_status "Building Auth Service..."
cd auth-service-main
docker build -t paas-platform/auth-service:latest .
if [ $? -eq 0 ]; then
    print_status "✅ Auth Service built successfully"
else
    print_error "❌ Failed to build Auth Service"
    exit 1
fi
cd ..

# Build Deployment Service
print_status "Building Deployment Service..."
cd deployment-service-main
docker build -f dockerfile -t paas-platform/deployment-service:latest .
if [ $? -eq 0 ]; then
    print_status "✅ Deployment Service built successfully"
else
    print_error "❌ Failed to build Deployment Service"
    exit 1
fi
cd ..

# Build Frontend Service
print_status "Building Frontend Service..."
cd frontend-service-main
docker build -t paas-platform/frontend-service:latest .
if [ $? -eq 0 ]; then
    print_status "✅ Frontend Service built successfully"
else
    print_error "❌ Failed to build Frontend Service"
    exit 1
fi
cd ..

print_status "🎉 All images built successfully!"
echo ""
echo "Built images:"
echo "  - paas-platform/auth-service:latest"
echo "  - paas-platform/deployment-service:latest"
echo "  - paas-platform/frontend-service:latest"
echo ""
echo "To push to registry (optional):"
echo "  docker push paas-platform/auth-service:latest"
echo "  docker push paas-platform/deployment-service:latest"
echo "  docker push paas-platform/frontend-service:latest"









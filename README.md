## PaaS on Kubernetes with AI Analysis on Infrastructure using OpenTelemetry

## High Level Arch Diagram
![image](https://github.com/vignesh-codes/PaaS-On-Kubernetes/blob/feat/v2/images/K8s-AI-Insights-HighLevel-Diagram.png)

## Claude AI In Action

### Published Reports:

Metrics Insights: https://claude.ai/public/artifacts/03086237-54fc-4a3e-abfa-fb56f399fdfc \
Logs Insights: https://claude.ai/public/artifacts/236f2d4a-3e72-4cda-8eb9-0e7033d01ed2

Screenshots: \
![claude-logs-insights](https://github.com/vignesh-codes/PaaS-On-Kubernetes/blob/feat/v2/images/Logs-Insights.png)

![claude-metrics-insights](https://github.com/vignesh-codes/PaaS-On-Kubernetes/blob/feat/v2/images/Metrics-Insights-image.png)

## What this project does

This repository implements a Platform-as-a-Service (PaaS) on Kubernetes with multi-tenant isolation and an OpenTelemetry-based observability pipeline. It enables users to:

- Create per-tenant Kubernetes namespaces (multi-tenancy via namespaces)
- Deploy, list, scale, and delete app deployments within their own namespace
- Access endpoints for their apps via standard Kubernetes Services
- Stream logs and metrics into Postgres via an OTEL pipeline for AI-driven insights

### Multi-tenancy model
- Each user operates in a dedicated Kubernetes namespace derived from their identity (e.g., email local-part sanitized to a valid RFC1123 name).
- All runtime resources (Deployments, Services) for a tenant are created in that tenant namespace.

## OpenTelemetry pipeline (end-to-end)

- otel-agent (DaemonSet, Helm):
  - Collects container logs from `/var/log/containers` (filelog)
  - Collects node/host metrics and kubelet metrics (hostmetrics, kubeletstats)
  - Forwards logs and metrics via OTLP gRPC to the OTEL gateway

- otel-gateway (Deployment, Helm):
  - Receives OTLP (logs, metrics)
  - Forwards to a custom OTLP receiver service

- Custom OTLP receiver (Deployment in `otel-gateway`):
  - Minimal Python gRPC server implementing OTLP logs/metrics ingest
  - Writes enriched rows into Postgres tables `logs` and `metrics`, including resource attributes (namespace, pod, container) and timestamps


## Walkthrough

Login Page
![login](./images/login-page.png)

Dashboard
![dashboard](images/dashboard.png)

Repo Scout
![repo-scout](images/repo-scout.png)

Create Deployments
![create-deployments](images/create-deployment.png)

Deployments
![deployments](images/deployments-page.png)

Deployment Details
![deployment-details](images/deployments-details.png)

Update Replicas
![update-replicas](images/update-replicas.png)




## AI insights (Claude Anthropic MCP server)

- An MCP (Model Context Protocol) server powered by Claude Anthropic is configured to query Postgres directly and generate insights about the platform state.
- Typical use cases:
  - Summarize error hot-spots and failing pods from `logs`
  - Surface noisy components and frequent warnings by namespace/pod
  - Provide short-term SLO/SLA style metrics by aggregating `metrics`
- Output can be exported as structured text or dashboards and attached to reports (examples linked above).

## Build & Deploy (quick start)

1) Build images
```bash
docker build -t paas-platform/auth-service:latest -f auth-service-main/Dockerfile auth-service-main
docker build -t paas-platform/deployment-service:latest -f deployment-service-main/dockerfile deployment-service-main
docker build -t paas-platform/frontend-service:latest -f frontend-service-main/Dockerfile frontend-service-main
```

2) Create namespaces
```bash
kubectl create ns core-services || true
kubectl create ns paas-platform || true
kubectl create ns otel-gateway || true
kubectl create ns otelagent || true
```

3) Install OpenTelemetry (Helm)
```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update

helm upgrade --install otel-agent open-telemetry/opentelemetry-collector \
  -n otelagent --create-namespace \
  --version 0.138.0 \
  -f helm/otel-agent-values.yaml

helm upgrade --install otel-gateway open-telemetry/opentelemetry-collector \
  -n otel-gateway --create-namespace \
  --version 0.138.0 \
  -f helm/otel-gateway-values.yaml
```

4) Databases (manifests)
```bash
kubectl apply -f k8s-manifests/postgres-deployment.yaml
kubectl apply -f k8s-manifests/mongodb-deployment.yaml
kubectl rollout status deploy/postgres-deployment -n core-services
kubectl rollout status deploy/mongodb-deployment -n core-services
```

5) Install PaaS chart (apps + custom OTLP receiver)
```bash
helm upgrade --install paas ./charts/paas \
  --namespace paas-platform -f charts/paas/values.yaml \
  --set namespaces.create=false
```

6) Optional port-forwards
```bash
kubectl -n core-services port-forward svc/deployment-service 8080:80
kubectl -n paas-platform port-forward svc/auth-service 5000:80
kubectl -n paas-platform port-forward svc/frontend-service 3000:80
```

7) Sanity test: generate logs and verify inserts
```bash
# Create a simple log generator
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: log-generator
  namespace: core-services
  labels:
    app: log-generator
spec:
  restartPolicy: Always
  containers:
    - name: logger
      image: busybox:1.36
      command: ["/bin/sh","-c"]
      args:
        - |
          i=0; while true; do echo "$(date -u +%FT%TZ) log-generator tick $i"; i=$((i+1)); sleep 2; done
      resources:
        requests: { cpu: 10m, memory: 16Mi }
        limits:   { cpu: 50m,  memory: 32Mi }
EOF

kubectl wait --for=condition=Ready pod/log-generator -n core-services --timeout=90s

# Receiver should print inserts
kubectl logs -n otel-gateway deploy/otlp-to-postgres --tail=100 | egrep 'Received logs|Inserted .* logs|Received metrics|Inserted .* metrics'

# Check Postgres
psql -U paas_user -d paas_db -h postgres-service.core-services.svc.cluster.local -c "SELECT count(*) FROM logs;"
psql -U paas_user -d paas_db -h postgres-service.core-services.svc.cluster.local -c "SELECT ts, namespace, pod, left(body,120) FROM logs ORDER BY ts DESC LIMIT 10;"
```

### Notes
- Tenants are isolated by Kubernetes namespaces (sanitized from usernames/emails).
- OTEL agent (DaemonSet) -> OTEL gateway (Deployment) -> Python OTLP receiver -> Postgres.
- Claude Anthropic MCP reads from Postgres to generate infra insights (logs and metrics).

## Deploy only the OTLP-to-Postgres component

If you want to render just the custom OTLP receiver (and nothing else from the chart):

1) Ensure values enable only the OTLP receiver
   - `charts/paas/values.yaml` already disables other templates and sets:
     - `enableNamespaces: false`
     - `enableAuthService: false`
     - `enableDeploymentService: false`
     - `enableFrontendService: false`
     - `otlpToPostgres.enabled: true`

2) Install/upgrade only OTLP-to-Postgres
```bash
helm upgrade --install paas ./charts/paas \
  -n paas-platform -f charts/paas/values.yaml \
  --set namespaces.create=false

# Verify it lands in the otel-gateway namespace
kubectl get deploy,svc -n otel-gateway | grep otlp-to-postgres
```

3) Uninstall
```bash
helm uninstall paas -n paas-platform --wait
```

Uninstall OTEL components
```bash
helm uninstall otel-agent -n otelagent --wait || true
helm uninstall otel-gateway -n otel-gateway --wait || true
```

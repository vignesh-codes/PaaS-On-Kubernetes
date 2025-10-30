## PaaS on Kubernetes with AI Analysis on Infrastructure using OpenTelemetry

## High Level Arch Diagram
![image](https://github.com/vignesh-codes/PaaS-On-Kubernetes/blob/feat/v2/images/K8s-AI-Insights-HighLevel-Diagram.png)

## Claude AI In Action

### Published Reports:

Intrumentation score on metrics: https://claude.ai/public/artifacts/af7f5dcf-378e-41c5-a24b-d32c0945070e \
Metrics and Logs Insights: https://claude.ai/public/artifacts/b49cdf3c-0da0-46c4-a6fb-d2f3cd78e767

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
  --namespace otelagent --create-namespace \
  --version 0.138.0 \
  --set mode=daemonset \
  --set image.repository=otel/opentelemetry-collector-contrib \
  --set image.tag=0.103.0 \
  --set command.name=otelcol-contrib \
  --set command.extraArgs[0]=--set=service.telemetry.metrics.address=:8889 \
  --set presets.logsCollection.enabled=true

helm upgrade --install otel-gateway open-telemetry/opentelemetry-collector \
  --namespace otel-gateway --create-namespace \
  --version 0.138.0 \
  --set mode=deployment \
  --set image.repository=otel/opentelemetry-collector-contrib \
  --set image.tag=0.103.0 \
  --set command.name=otelcol-contrib \
  --set command.extraArgs[0]=--set=service.telemetry.metrics.address=:8889 \
  --set config.receivers.otlp.protocols.grpc.endpoint=0.0.0.0:4317 \
  --set config.exporters.otlp.endpoint=otlp-to-postgres.otel-gateway.svc.cluster.local:4317 \
  --set config.exporters.otlp.tls.insecure=true \
  --set config.service.pipelines.logs.receivers[0]=otlp \
  --set config.service.pipelines.logs.processors[0]=batch \
  --set config.service.pipelines.logs.exporters[0]=otlp \
  --set config.service.pipelines.metrics.receivers[0]=otlp \
  --set config.service.pipelines.metrics.processors[0]=batch \
  --set config.service.pipelines.metrics.exporters[0]=otlp
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

### Notes
- Tenants are isolated by Kubernetes namespaces (sanitized from usernames/emails).
- OTEL agent (DaemonSet) -> OTEL gateway (Deployment) -> Python OTLP receiver -> Postgres.
- Claude Anthropic MCP reads from Postgres to generate infra insights (logs and metrics).

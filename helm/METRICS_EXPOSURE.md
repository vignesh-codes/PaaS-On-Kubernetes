# Exposing OpenTelemetry Collector Metrics

This document explains how metrics endpoints are exposed for the OpAMP API server to scrape.

## Changes Made

### 1. Helm Values Updated

Both `otel-agent-values.yaml` and `otel-gateway-values.yaml` now include:

```yaml
service:
  ports:
    metrics:
      enabled: true
      port: 8889
      targetPort: 8889
      protocol: TCP
```

This exposes the metrics port (8889) via Kubernetes Services.

### 2. Service Naming

The open-telemetry Helm chart creates services with the pattern:
- `otel-agent-opentelemetry-collector` (in namespace `otelagent`)
- `otel-gateway-opentelemetry-collector` (in namespace `otel-gateway`)

The API server now constructs service DNS names using this pattern.

## Deployment

After updating the Helm values, redeploy:

```bash
cd helm
helmfile apply
```

Or if using helm directly:

```bash
helm upgrade otel-agent open-telemetry/opentelemetry-collector \
  -f otel-agent-values.yaml \
  -n otelagent

helm upgrade otel-gateway open-telemetry/opentelemetry-collector \
  -f otel-gateway-values.yaml \
  -n otel-gateway
```

## Verification

Verify the services expose the metrics port:

```bash
# Check otel-agent service
kubectl get svc -n otelagent otel-agent-opentelemetry-collector -o yaml

# Check otel-gateway service
kubectl get svc -n otel-gateway otel-gateway-opentelemetry-collector -o yaml
```

You should see port 8889 in the service spec.

## Testing Metrics Access

From within the cluster (or via port-forward):

```bash
# Test otel-agent metrics
curl http://otel-agent-opentelemetry-collector.otelagent.svc.cluster.local:8889/metrics

# Test otel-gateway metrics
curl http://otel-gateway-opentelemetry-collector.otel-gateway.svc.cluster.local:8889/metrics
```

## API Server

The OpAMP API server will automatically:
1. Extract metrics endpoint from collector config (`0.0.0.0:8889`)
2. Detect pod/namespace from agent description
3. Construct service DNS: `{release-name}-opentelemetry-collector.{namespace}.svc.cluster.local:8889/metrics`
4. Scrape Prometheus metrics and parse component resource usage

## Troubleshooting

If metrics aren't showing:

1. **Check service exists:**
   ```bash
   kubectl get svc -n otelagent | grep opentelemetry
   kubectl get svc -n otel-gateway | grep opentelemetry
   ```

2. **Check metrics port is exposed:**
   ```bash
   kubectl describe svc otel-agent-opentelemetry-collector -n otelagent | grep 8889
   ```

3. **Check API server logs:**
   Look for log messages like:
   ```
   Attempting to use service DNS: otel-agent-opentelemetry-collector.otelagent.svc.cluster.local:8889/metrics
   ```

4. **Test direct access:**
   ```bash
   # Port-forward to a collector pod
   kubectl port-forward -n otelagent pod/<pod-name> 8889:8889
   curl http://localhost:8889/metrics
   ```

## Note on DaemonSet with hostNetwork

For `otel-agent` which uses `hostNetwork: true`, the metrics are accessible on the node IP. However, the Service still provides a stable DNS endpoint that routes to the pods.



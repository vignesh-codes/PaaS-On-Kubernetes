# Metrics Server Helm Usage

This folder contains `values.yaml` for deploying the official Kubernetes Metrics Server Helm chart.

- Chart: `oci://registry.k8s.io/metrics-server/metrics-server`
- Namespace: `kube-system`
- Release name: `metrics-server`

## Install via Helm

```bash
helm upgrade --install metrics-server \
  oci://registry.k8s.io/metrics-server/metrics-server \
  --namespace kube-system \
  --create-namespace \
  -f helm/metrics-server/values.yaml
```

Verify:

```bash
kubectl -n kube-system rollout status deploy/metrics-server
kubectl get apiservices | grep metrics
kubectl top nodes
kubectl top pods -A
```

## Alternative: Install via script

A convenience script is provided:

```bash
scripts/install-metrics-server.sh
```

It will prefer Helm if available, or fall back to applying the upstream manifest and patching args for common dev clusters.



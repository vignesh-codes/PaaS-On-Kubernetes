package adapter

import (
	"context"
	"fmt"
	"sort"
	"time"

    dutils "deployment-service/utils"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/utils/ptr"
)

// NewKubernetes initializes the Kubernetes adapter
func NewKubernetes(client *kubernetes.Clientset) *Kubernetes {
	return &Kubernetes{connection: client}
}

// ListDeployments fetches deployments in the specified namespace
func (k *Kubernetes) ListDeployments(namespace string) ([]appsv1.Deployment, error) {
	deploymentsClient := k.connection.AppsV1().Deployments(namespace)
	deployments, err := deploymentsClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list deployments: %w", err)
	}
	return deployments.Items, nil
}

// ListServices fetches services in the specified namespace
func (k *Kubernetes) ListServices(namespace string) ([]corev1.Service, error) {
	servicesClient := k.connection.CoreV1().Services(namespace)
	services, err := servicesClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list services: %w", err)
	}
	return services.Items, nil
}

// ListNamespaces fetches all namespaces in the cluster
func (k *Kubernetes) ListNamespaces() ([]corev1.Namespace, error) {
	namespacesClient := k.connection.CoreV1().Namespaces()
	namespaces, err := namespacesClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list namespaces: %w", err)
	}
	return namespaces.Items, nil
}

// ListPods fetches all pods in the specified namespace
func (k *Kubernetes) ListPods(namespace string) ([]corev1.Pod, error) {
	podsClient := k.connection.CoreV1().Pods(namespace)
	pods, err := podsClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}
	return pods.Items, nil
}

// ListNodes fetches all nodes in the cluster
func (k *Kubernetes) ListNodes() ([]corev1.Node, error) {
	nodesClient := k.connection.CoreV1().Nodes()
	nodes, err := nodesClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list nodes: %w", err)
	}
	return nodes.Items, nil
}

// GetKubernetesVersion fetches the Kubernetes server version
func (k *Kubernetes) GetKubernetesVersion() (string, error) {
	versionInfo, err := k.connection.Discovery().ServerVersion()
	if err != nil {
		return "", fmt.Errorf("failed to get Kubernetes version: %w", err)
	}
	return versionInfo.GitVersion, nil
}

// UpdateDeploymentByNameReplicas updates the number of replicas for a specified deployment
func (k *Kubernetes) UpdateDeploymentByNameReplicas(namespace, deploymentName string, replicas int32) error {
	deploymentsClient := k.connection.AppsV1().Deployments(namespace)
	deployment, err := deploymentsClient.Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}

	deployment.Spec.Replicas = &replicas
	_, err = deploymentsClient.Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update replicas for deployment %s: %w", deploymentName, err)
	}

	fmt.Printf("Successfully updated replicas for deployment %s to %d\n", deploymentName, replicas)
	return nil
}

// UpdateDeploymentByNameImageVersion updates the image version for a specified deployment
func (k *Kubernetes) UpdateDeploymentByNameImageVersion(namespace, deploymentName, containerName, newImageVersion string) error {
	deploymentsClient := k.connection.AppsV1().Deployments(namespace)
	deployment, err := deploymentsClient.Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}

	// Update the image for the specified container in the deployment
	updated := false
	for i, container := range deployment.Spec.Template.Spec.Containers {
		if container.Name == containerName {
			deployment.Spec.Template.Spec.Containers[i].Image = newImageVersion
			updated = true
			break
		}
	}

	if !updated {
		return fmt.Errorf("container %s not found in deployment %s", containerName, deploymentName)
	}

	_, err = deploymentsClient.Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update image version for deployment %s: %w", deploymentName, err)
	}

	fmt.Printf("Successfully updated image for container %s in deployment %s to %s\n", containerName, deploymentName, newImageVersion)
	return nil
}

// DeleteDeploymentByName deletes a specified deployment from a namespace
func (k *Kubernetes) DeleteDeploymentByName(namespace, deploymentName string) error {
	deploymentsClient := k.connection.AppsV1().Deployments(namespace)
	err := deploymentsClient.Delete(context.TODO(), deploymentName, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete deployment %s: %w", deploymentName, err)
	}

	fmt.Printf("Successfully deleted deployment %s from namespace %s\n", deploymentName, namespace)
	return nil
}

// Define KubernetesManifest struct
type KubernetesManifest struct {
	DesiredReplicas   int32                  `json:"desired_replicas"`
	CurrentReplicas   int32                  `json:"current_replicas"`
	AvailableReplicas int32                  `json:"current_replicas"`
	Status            string                 `json:"status"`
	Age               string                 `json:"age,omitempty"`
	Image             string                 `json:"image,omitempty"`
	Spec              map[string]interface{} `json:"spec,omitempty"`
}

func (k *Kubernetes) GetDeploymentByName(namespace, deploymentName string) (*KubernetesManifest, error) {
	deploymentsClient := k.connection.AppsV1().Deployments(namespace)
	deployment, err := deploymentsClient.Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get deployment %s: %w", deploymentName, err)
	}

	// Default status
	status := "Unknown"

	// Set desired, current, and available replicas
	desiredReplicas := int32(0)
	if deployment.Spec.Replicas != nil {
		desiredReplicas = *deployment.Spec.Replicas
	}
	currentReplicas := deployment.Status.Replicas
	availableReplicas := deployment.Status.AvailableReplicas

	image := deployment.Spec.Template.Spec.Containers[0].Image

	// Determine the status based on available replicas
	if availableReplicas == 0 {
		// No available replicas, deployment is unavailable
		status = "Unavailable"
	} else if availableReplicas < desiredReplicas {
		// Some replicas are up, but the deployment is still being updated
		status = "Progressing"
	} else {
		// All replicas are up and available
		status = "Available"
	}

	// Print the status for debugging
	fmt.Println("Latest Deployment Status:", status)

	// Calculate the age of the deployment without seconds
	creationTime := deployment.ObjectMeta.CreationTimestamp.Time
	duration := time.Since(creationTime)
	// Format the age in a human-readable way (days or minutes)
	var age string
	if duration.Hours() > 24 {
		// More than 24 hours, display in days
		age = fmt.Sprintf("%d days ago", int(duration.Hours()/24))
	} else if duration.Minutes() > 0 {
		// Less than 24 hours, display in minutes
		age = fmt.Sprintf("%d minutes ago", int(duration.Minutes()))
	} else {
		// Less than a minute, display as "just now"
		age = "Just now"
	}

	// Map the relevant fields to KubernetesManifest struct
	kubernetesManifest := &KubernetesManifest{
		DesiredReplicas:   desiredReplicas,
		CurrentReplicas:   currentReplicas,
		AvailableReplicas: availableReplicas,
		Status:            status,
		Age:               age,
		Image:             image,
		Spec:              map[string]interface{}{"replicas": desiredReplicas},
	}

	return kubernetesManifest, nil
}

// Create namespace
func (k *Kubernetes) CreateNamespaceIfNotExists(namespace string) error {
    namespace = dutils.SanitizeNamespace(namespace)
	// check if namespace is already created
	_, err := k.connection.CoreV1().Namespaces().Get(context.TODO(), namespace, metav1.GetOptions{})
	if err == nil {
		fmt.Printf("Namespace %s already exists\n", namespace)
		return nil
	}
	_, err = k.connection.CoreV1().Namespaces().Create(context.TODO(), &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespace,
		},
	}, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create namespace %s: %w", namespace, err)
	}
	fmt.Printf("Successfully created namespace %s\n", namespace)
	return nil
}

func (k *Kubernetes) CreateDeployment(namespace, deploymentName, image string,
	replicas int32, containerPort int32, req_cpu, req_memory string) error {
	// Check if deployment already exists
	_, err := k.connection.AppsV1().Deployments(namespace).Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err == nil {
		fmt.Printf("Deployment %s already exists in namespace %s\n", deploymentName, namespace)
		return errors.NewAlreadyExists(schema.GroupResource{Group: "apps", Resource: "deployments"}, deploymentName)
	}

	// Define the deployment spec
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deploymentName,
			Namespace: namespace,
			Labels: map[string]string{
				"app": deploymentName,
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas, // Set the number of replicas here
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": deploymentName,
				},
			},
			Strategy: appsv1.DeploymentStrategy{
				Type: appsv1.RollingUpdateDeploymentStrategyType,
				RollingUpdate: &appsv1.RollingUpdateDeployment{
					MaxSurge:       &intstr.IntOrString{Type: intstr.Int, IntVal: 1},
					MaxUnavailable: &intstr.IntOrString{Type: intstr.Int, IntVal: 1},
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": deploymentName,
					},
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: "tmpfs-storage",
							VolumeSource: corev1.VolumeSource{
								EmptyDir: &corev1.EmptyDirVolumeSource{
									Medium: "Memory",
								},
							},
						},
					},
					Containers: []corev1.Container{
						{
							Name:  deploymentName,
							Image: image,
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: containerPort,
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse(req_cpu),
									corev1.ResourceMemory: resource.MustParse(req_memory),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("0.5"),
									corev1.ResourceMemory: resource.MustParse("0.5Gi"),
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "tmpfs-storage",
									MountPath: "/tmp", // Mount tmpfs volume at /tmp
								},
							},
							SecurityContext: &corev1.SecurityContext{
								ReadOnlyRootFilesystem: ptr.To(false), // Allow writes to filesystem if needed
							},
						},
					},
				},
			},
		},
	}

	// Create the deployment
	_, err = k.connection.AppsV1().Deployments(namespace).Create(context.TODO(), deployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create deployment %s in namespace %s: %w", deploymentName, namespace, err)
	}

	fmt.Printf("Successfully created deployment %s in namespace %s\n", deploymentName, namespace)

	return nil
}

// Helper function to create a pointer for int32 values
func int32Ptr(i int32) *int32 { return &i }

// CreateService creates a Kubernetes Service for a specified Deployment.
func (k *Kubernetes) CreateService(namespace, serviceName, deploymentName string, servicePort, containerPort int32) error {
	// Check if the Service already exists
	_, err := k.connection.CoreV1().Services(namespace).Get(context.TODO(), serviceName, metav1.GetOptions{})
	if err == nil {
		fmt.Printf("Service %s already exists in namespace %s\n", serviceName, namespace)
		return nil
	}

	// Define the Service
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      serviceName,
			Namespace: namespace,
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app": deploymentName,
			},
			Ports: []corev1.ServicePort{
				{
					Port:       servicePort,
					TargetPort: intstr.FromInt(int(containerPort)),
					Protocol:   corev1.ProtocolTCP,
				},
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}

	// Create the Service in the specified namespace
	_, err = k.connection.CoreV1().Services(namespace).Create(context.TODO(), service, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create service %s in namespace %s: %w", serviceName, namespace, err)
	}

	fmt.Printf("Successfully created service %s in namespace %s\n", serviceName, namespace)
	return nil
}

// DeleteDeployment deletes a Kubernetes deployment in the specified namespace.
func (k *Kubernetes) DeleteDeployment(namespace, deploymentName string) error {
	// Check if the Deployment exists
	_, err := k.connection.AppsV1().Deployments(namespace).Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			fmt.Printf("Deployment %s does not exist in namespace %s\n", deploymentName, namespace)
			return nil
		}
		return fmt.Errorf("error checking if deployment %s exists in namespace %s: %w", deploymentName, namespace, err)
	}

	// Delete the Deployment
	err = k.connection.AppsV1().Deployments(namespace).Delete(context.TODO(), deploymentName, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete deployment %s in namespace %s: %w", deploymentName, namespace, err)
	}

	fmt.Printf("Successfully deleted deployment %s in namespace %s\n", deploymentName, namespace)
	return nil
}

// DeleteService deletes a Kubernetes Service in the specified namespace.
func (k *Kubernetes) DeleteService(namespace, serviceName string) error {
	// Check if the Service exists
	_, err := k.connection.CoreV1().Services(namespace).Get(context.TODO(), serviceName, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			fmt.Printf("Service %s does not exist in namespace %s\n", serviceName, namespace)
			return nil
		}
		return fmt.Errorf("error checking if service %s exists in namespace %s: %w", serviceName, namespace, err)
	}

	// Delete the Service
	err = k.connection.CoreV1().Services(namespace).Delete(context.TODO(), serviceName, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete service %s in namespace %s: %w", serviceName, namespace, err)
	}

	fmt.Printf("Successfully deleted service %s in namespace %s\n", serviceName, namespace)
	return nil
}

// GetServiceInfo retrieves information about a Kubernetes Service, including its external IP.
func (k *Kubernetes) GetServiceInfo(namespace, serviceName string) (string, error) {
	// Retrieve the Service object
	service, err := k.connection.CoreV1().Services(namespace).Get(context.TODO(), serviceName, metav1.GetOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to get service %s in namespace %s: %w", serviceName, namespace, err)
	}

	// Check for the external IP in the Service's status
	var externalIP string
	if len(service.Status.LoadBalancer.Ingress) > 0 {
		// External IP is available
		externalIP = service.Status.LoadBalancer.Ingress[0].IP
		if externalIP == "" {
			// Sometimes external IP may be set as a hostname
			externalIP = service.Status.LoadBalancer.Ingress[0].Hostname
		}
	} else {
		// No external IP assigned (might still be pending or the Service type may not support it)
		return "", fmt.Errorf("no external IP available for service %s in namespace %s", serviceName, namespace)
	}

	// Retrieve the port the Service exposes
	servicePort := service.Spec.Ports[0].Port

	// Construct the endpoint URL
	endpoint := fmt.Sprintf("http://%s:%d", externalIP, servicePort)
	fmt.Printf("Service %s in namespace %s is accessible at %s\n", serviceName, namespace, endpoint)
	return endpoint, nil
}

// GetLatestEvents retrieves the latest 10 events from a Kubernetes namespace
func (k *Kubernetes) GetLatestEvents(namespace string, topK int) ([]string, error) {
	// Retrieve the list of events in the given namespace
	eventsList, err := k.connection.CoreV1().Events(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get events in namespace %s: %w", namespace, err)
	}

	// Sort events by timestamp (from most recent to least recent)
	sort.SliceStable(eventsList.Items, func(i, j int) bool {
		return eventsList.Items[i].LastTimestamp.After(eventsList.Items[j].LastTimestamp.Time)
	})

	// Extract the event descriptions
	var events []string
	for i, event := range eventsList.Items {
		if i >= topK {
			break
		}

		eventMsg := fmt.Sprintf("Event: %s | Reason: %s | Message: %s | Time: %s",
			event.Name, event.Reason, event.Message, event.LastTimestamp.Time)
		events = append(events, eventMsg)
	}

	// Return the latest 10 events
	return events, nil
}

// UpdateDeploymentReplicas updates the number of replicas for a given deployment by name in a namespace.
func (k *Kubernetes) UpdateDeploymentReplicasAndImage(namespace, deploymentName string, replicas int32, image string) error {
	// Retrieve the current deployment object
	deployment, err := k.connection.AppsV1().Deployments(namespace).Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment %s in namespace %s: %w", deploymentName, namespace, err)
	}
	// Update the number of replicas in the deployment spec
	deployment.Spec.Replicas = &replicas
	deployment.Spec.Template.Spec.Containers[0].Image = image

	// Update the deployment with the new number of replicas
	_, err = k.connection.AppsV1().Deployments(namespace).Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update replicas for deployment %s in namespace %s: %w", deploymentName, namespace, err)
	}

	fmt.Printf("Successfully updated replicas for deployment %s to %d\n", deploymentName, replicas)
	return nil
}

// UpdateDeploymentReplicas updates the number of replicas for a given deployment by name in a namespace.
func (k *Kubernetes) UpdateDeploymentImage(namespace, deploymentName string, image string) error {
	// Retrieve the current deployment object
	deployment, err := k.connection.AppsV1().Deployments(namespace).Get(context.TODO(), deploymentName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment %s in namespace %s: %w", deploymentName, namespace, err)
	}

	// Update the number of replicas in the deployment spec
	deployment.Spec.Template.Spec.Containers[0].Image = image

	// Update the deployment with the new number of replicas
	_, err = k.connection.AppsV1().Deployments(namespace).Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update replicas for deployment %s in namespace %s: %w", deploymentName, namespace, err)
	}

	fmt.Printf("Successfully updated image for deployment %s to %d\n", deploymentName, image)
	return nil
}

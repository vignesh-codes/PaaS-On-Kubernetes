/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Dashboard.tsx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ScoutDialog from "./ScoutDialog";
// import Modal from "react-modal";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Send,
  Plus,
  LogOut,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeployDialog from "./DeployDialog";
import UpdateDialog from "./UpdateDialog";
import Tooltip from "@mui/material/Tooltip";
import { API_ENDPOINTS, API_CONFIG } from "@/config/api";

interface ClusterInfo {
  kubernetes_version: string;
  no_of_pods: number;
  no_of_deployments: number;
  no_of_services: number;
  tenant_username: string;
}

interface KubernetesSpec {
  replicas: number;
}

interface OtherInfo {
  endpoint: string;
  kuberenetes_spec: KubernetesSpec;
}

interface DeploymentInfo {
  deployment_name: string;
  age: string;
  status: string;
  desired_replicas: number;
  current_replicas: number;
  image: string;
  available_replicas: number;
  other_info: OtherInfo;
  out_of_sync: boolean;
}

interface Deployment {
  deployment_info: DeploymentInfo;
}

interface Release {
  html_url: string;
  tag_name: string;
  created_at: string;
  published_at: string;
}

interface ReleaseInfo {
  repo_url: string;
  releases: Release;
}

interface RepoInfo {
  deployments: Deployment[];
  latest_image_url: string;
  release_info: ReleaseInfo;
  repo_name: string;
  repo_scout_id: string;
}

const Dashboard = () => {
  const router = useNavigate();
  const [isScoutDialogOpen, setIsScoutDialogOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo[] | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const token = localStorage.getItem("token");

  // const services = {
  //   deployments: [
  //     {
  //       deployment_info: {
  //         deployment_name: "deployment-service-new2",
  //         age: "0 minutes ago",
  //         status: "Available",
  //         desired_replicas: 4,
  //         current_replicas: 4,
  //         image: "dubemezeagwu/deployment-service:v0.0.8",
  //         available_replicas: 2,
  //         other_info: {
  //           endpoint: "UNDEFINED",
  //           kuberenetes_spec: {
  //             replicas: 1,
  //           },
  //         },
  //         out_of_sync: true,
  //       },
  //     },
  //   ],
  //   latest_image_url: "dubemezeagwu/deployment-service:v0.0.8",
  //   release_info: {
  //     repo_url: "https://github.com/vignesh-codes/deployment-service",
  //     releases: [
  //       {
  //         html_url:
  //           "https://github.com/vignesh-codes/deployment-service/releases/tag/v0.0.8",
  //         tag_name: "v0.0.6",
  //         created_at: "2024-11-17T01:55:26Z",
  //         published_at: "2024-11-20T00:22:07Z",
  //       },
  //     ],
  //   },
  //   repo_name: "vignesh-codes/test-service",
  //   repo_scout_id: "6733ef6ce131df206b1c199lp",
  // };

  useEffect(() => {
    const fetchClusterInfo = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(
          API_ENDPOINTS.DEPLOYMENTS.TENANT,
          {
            method: "GET",
            headers: {
              username: token || "",
              ...API_CONFIG.HEADERS,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch cluster information");
        }
        const data = await response.json();
        console.log(`data: ${JSON.stringify(data)}`);
        setClusterInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchClusterInfo();
  }, []);

  useEffect(() => {
    const fetchRepoInfo = async () => {
      try {
        // Replace with your actual API endpoint
        console.log(`token: ${token}`);
        const response = await fetch(API_ENDPOINTS.BUILD.SCOUT, {
          method: "GET",
          headers: {
            username: token || "",
            ...API_CONFIG.HEADERS,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch repo information");
        }
        const data = await response.json();
        const combinedData = [...data];
        console.log(`data: ${JSON.stringify(data[0])}`);
        setRepoInfo(combinedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    fetchRepoInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!clusterInfo) {
    return null;
  }

  // const handleRefresh = (deploymentId: number) => {
  //   console.log(`Refreshing deployment ${deploymentId}`);
  // };

  const deleteDeployment = async (deploymentName: string) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.DEPLOYMENTS.BY_NAME(deploymentName),
        {
          method: "DELETE",
          headers: {
            username: token || "",
            ...API_CONFIG.HEADERS,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete deployment");
      }

      const result = await response.json();
      console.log(`Deployment ${deploymentName} deleted successfully:`, result);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeploy = async (formData: any) => {
    console.log("form data ", formData, "token is ", token)
    try {
      const response = await fetch(API_ENDPOINTS.DEPLOYMENTS.BASE, {
        method: "POST",
        headers: {
          username: token || "",
          ...API_CONFIG.HEADERS,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Deployment created successfully:", result);
      window.location.reload();
    } catch (err) {
      console.error("Error creating deployment:", err);
    }
  };

  const handleScoutRepo = async (formData: any) => {
    try {
      const response = await fetch(API_ENDPOINTS.BUILD.SCOUT, {
        method: "POST",
        headers: {
          username: token || "",
          ...API_CONFIG.HEADERS,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Repo scouted successfully:", result);
      window.location.reload();
    } catch (err) {
      console.error("Error scouting repo:", err);
    }
  };

  const handleUpdateReplica = async (formData: any) => {
    try {
      const response = await fetch(API_ENDPOINTS.DEPLOYMENTS.BASE, {
        method: "PUT",
        headers: {
          username: token || "",
          ...API_CONFIG.HEADERS,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Repo updated successfully:", result);
      window.location.reload();
    } catch (err) {
      console.error("Error updating repo:", err);
    }
  };

  const handleOpenDeployDialog = (repo: RepoInfo) => {
    console.log(`selected_repo: ${JSON.stringify(repo)}`);
    setSelectedRepo(repo);
    setIsDeployDialogOpen(true);
  };

  const handleOpenUpdateDialog = (repo: RepoInfo) => {
    setSelectedRepo(repo);
    setIsUpdateDialogOpen(true);
  };

  const navigateToTenants = () => {
    router("/tenants-deployments");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router("/");
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Infrastructure Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Users className="w-4 h-4 mr-2" /> {token}
          </Button>
          <ScoutDialog
            isOpen={isScoutDialogOpen}
            onClose={() => setIsScoutDialogOpen(false)}
            headerTitle="Add a Repository"
            onSubmit={(formData) => {
              console.log("Scouting repository:", formData);
              handleScoutRepo(formData);
              setIsScoutDialogOpen(false);
            }}
          />
          <Button variant="outline" onClick={navigateToTenants}>
            <Send className="w-4 h-4 mr-2" /> Tenant Deployments
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Cluster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Kubernetes Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {clusterInfo.kubernetes_version}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Pods</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clusterInfo.no_of_pods}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {clusterInfo.no_of_deployments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clusterInfo.no_of_services}</p>
          </CardContent>
        </Card>
      </div>

      {/* Deployments Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Current Scouted Repositories</CardTitle>
            <Button
              onClick={() => setIsScoutDialogOpen(true)}
              className="bg-green-300 hover:bg-green-400"
            >
              <Plus className="w-4 h-4 mr-2" /> Scout Repository
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Repository Name</th>
                  <th className="text-left p-4">Release Tag</th>
                  <th className="text-left p-4">Pods</th>
                  <th className="text-left p-4">Last Updated</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {repoInfo?.map((data) => (
                  <tr key={data.repo_scout_id} className="border-b">
                    <td className="p-4">
                      {data.deployments.length > 0 ? (
                        data.deployments[0].deployment_info.out_of_sync ? (
                          <Tooltip title="Out of Sync">
                            <AlertCircle
                              className="text-yellow-500"
                              size={16}
                              data-tooltip="Out of Sync"
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="In Sync">
                            <CheckCircle
                              className="text-green-500"
                              size={16}
                              data-tooltip="In Sync"
                            />
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip title="Unavailable">
                          <XCircle
                            className="text-red-500"
                            size={16}
                            data-tool-tip="Unavailable"
                          />
                        </Tooltip>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        {data.repo_name || "N/A"}
                        {data.release_info.repo_url && (
                          <a
                            href={data.release_info.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <a
                        href={data.release_info.releases.html_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {data.release_info.releases.tag_name || "N/A"}
                      </a>
                    </td>
                    <td className="p-4">
                      {data.deployments.length > 0 ? (
                        <>
                          {
                            data.deployments[0].deployment_info
                              .available_replicas
                          }
                          /
                          {data.deployments[0].deployment_info.desired_replicas}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="p-4">
                      {data.release_info.releases
                        ? new Date(
                          data.release_info.releases.published_at
                        ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {data.deployments.length === 0 ? (
                          <Button
                            variant={"outline"}
                            onClick={() => handleOpenDeployDialog(data)}
                            className="p-2 hover:bg-green-100 rounded-full text-green-500"
                          >
                            Create Deployment

                          </Button>
                        ) : data.deployments[0].deployment_info.out_of_sync ? (
                          <Button
                            variant={"outline"}
                            onClick={() => handleOpenUpdateDialog(data)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            Sync
                          </Button>
                        ) : <Button
                        variant={"outline"}
                        onClick={() => handleOpenUpdateDialog(data)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        Update Replicas
                      </Button>}

                        {data.deployments.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              deleteDeployment(
                                data.deployments[0].deployment_info
                                  .deployment_name
                              )
                            }
                            className="p-2 hover:bg-red-100 rounded-full text-red-500"
                          >
                            Delete Deployment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {selectedRepo && (
        <>
          <DeployDialog
            isOpen={isDeployDialogOpen}
            onClose={() => setIsDeployDialogOpen(false)}
            repo_scout_id={selectedRepo.repo_scout_id}
            image={selectedRepo.latest_image_url || "N/A"}
            name={""}
            onSubmit={(formData) => {
              console.log("Deploying with form data:", formData);
              handleDeploy(formData);
              setIsDeployDialogOpen(false);
            }}
          />
          {selectedRepo.deployments && selectedRepo.deployments.length > 0 && (
            <UpdateDialog
              isOpen={isUpdateDialogOpen}
              onClose={() => setIsUpdateDialogOpen(false)}
              name={
                selectedRepo.deployments[0]?.deployment_info?.deployment_name ||
                ""
              }
              image={selectedRepo.latest_image_url || ""}
              onSubmit={(formData) => {
                console.log("Updating with form data:", formData);
                handleUpdateReplica(formData);
                setIsUpdateDialogOpen(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;

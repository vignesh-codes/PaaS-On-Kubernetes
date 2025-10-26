import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import { API_ENDPOINTS, API_CONFIG } from "@/config/api";

const TenantDeployments = () => {
  const router = useNavigate();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<Tenant | null>(
    null
  );
  const [jsonResponse, setJsonResponse] = React.useState<string>("");
  const token = localStorage.getItem("token");
  const [formData, setFormData] = React.useState({
    name: "",
    replicas: 0,
    image: "",
  });

  interface Tenant {
    id: string;
    name: string;
    replicas: number;
    image: string;
    manifest: string;
    status: string;
    age: string;
  }

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ENDPOINTS.DEPLOYMENTS.BASE, {
          headers: { 
            username: token || "default",
            ...API_CONFIG.HEADERS,
          },
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedData = Object.values(data).map((item: any) => ({
          id: item.deployment_info.id,
          name: item.deployment_info.name,
          replicas: item.kubernetes_resp.available_replicas,
          manifest: item.kubernetes_resp.other_info.endpoint,
          image: item.deployment_info.image,
          status:
            item.kubernetes_resp.status === "Available"
              ? "healthy"
              : "degraded",
          age: item.kubernetes_resp.age,
        }));

        setTenants(transformedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteDeployment = async (deploymentName: string) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.DEPLOYMENTS.BY_NAME(deploymentName),
        {
          method: "DELETE",
          headers: {
            ...API_CONFIG.HEADERS,
            username: token || "default",
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

  const handleOpenEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      replicas: tenant.replicas,
      image: tenant.image,
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleOpenDetailsDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setJsonResponse(JSON.stringify(tenant, null, 2)); // Prettify JSON response
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedTenant) return;
    console.log(formData);
    try {
      const response = await fetch(API_ENDPOINTS.DEPLOYMENTS.BASE, {
        method: "PUT",
        headers: {
          ...API_CONFIG.HEADERS,
          username: token || "default",
        },
        body: JSON.stringify({
          name: formData.name,
          replicas: Number(formData.replicas),
          image: formData.image,
        }),
      });

      console.log(response);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const updatedTenant = await response.json();
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === selectedTenant.id
            ? { ...tenant, ...updatedTenant }
            : tenant
        )
      );

      handleCloseEditDialog();
      window.location.reload();
    } catch (err) {
      console.error("Error updating deployment:", err);
    }
  };

  if (loading) {
    return <p className="p-6">Loading deployments...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Tenant Deployments</h1>
        </div>
        <Button
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Users className="w-4 h-4 mr-2" /> {token}
        </Button>
      </div>

      {tenants.length === 0 ? (
        <div className="flex items-center justify-center h-full">
        <p className="text-xl">No deployments</p>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {tenant.name}
                <Tooltip title={tenant.status}>
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    tenant.status === "healthy" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Replicas</p>
                    <p className="text-lg font-semibold">{tenant.replicas}</p>
                  </div>
                  <Edit
                    className="cursor-pointer text-blue-500"
                    onClick={() => handleOpenEditDialog(tenant)}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">URL</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a
                      href={tenant.manifest}
                      target="_blank"
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      rel="noopener noreferrer"
                    >
                      {tenant.manifest}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold">{tenant.age}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => deleteDeployment(tenant.name)}
                  className="w-full mb-2 bg-red-500 text-white hover:bg-red-600"
                >
                  Delete Deployment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenDetailsDialog(tenant)}
                  className="w-full"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {isEditDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Update Deployment</h2>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Deployment Name"
                className="w-full p-2 border rounded"
                readOnly
              />
              <input
                type="number"
                name="replicas"
                value={formData.replicas}
                onChange={handleInputChange}
                placeholder="Replicas"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="Image URL"
                className="w-full p-2 border rounded"
                readOnly
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={handleCloseEditDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Update</Button>
            </div>
          </div>
        </div>
      )}

      {isDetailsDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg">
            <h2 className="text-xl font-bold mb-4">Tenant Details</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
              {jsonResponse}
            </pre>
            <div className="flex justify-end mt-4">
              <Button onClick={handleCloseDetailsDialog}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDeployments;

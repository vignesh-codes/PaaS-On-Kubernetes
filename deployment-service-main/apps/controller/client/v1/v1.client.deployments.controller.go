package v1

import (
	v1Client "deployment-service/apps/dao/client/v1"
	"deployment-service/apps/repository/adapter"
	model_deployment "deployment-service/models/model.deployment"
	"deployment-service/utils"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

type DeploymentController struct {
	v1DeploymentsDao v1Client.IDeploymentsDao
}

type IDeploymentController interface {
	GetDeploymentsByNamespace(ctx *gin.Context)
	GetTenantKubernetesInfo(ctx *gin.Context)
	GetDeploymentByName(ctx *gin.Context)
	CreateNamespace(ctx *gin.Context)
	CreateDeployment(ctx *gin.Context)
	DeleteDeployment(ctx *gin.Context)
	GetLatestEvents(ctx *gin.Context)
	UpdateDeploymentByName(ctx *gin.Context)
}

func NewDeploymentController(repository *adapter.Repository) IDeploymentController {
	return &DeploymentController{
		v1DeploymentsDao: v1Client.NewDeploymentsDao(repository),
	}
}

func (ctrl DeploymentController) GetDeploymentsByNamespace(ctx *gin.Context) {
	fmt.Println("getting deployments")
    namespace := utils.SanitizeNamespace(ctx.GetString("username"))
	ctrl.v1DeploymentsDao.GetDeployments(ctx, namespace)
}

func (ctrl DeploymentController) GetTenantKubernetesInfo(ctx *gin.Context) {
	fmt.Println("getting deployments")
    namespace := utils.SanitizeNamespace(ctx.GetString("username"))
	ctrl.v1DeploymentsDao.GetTenantKubernetesInfo(ctx, namespace)
}

func (ctrl DeploymentController) GetDeploymentByName(ctx *gin.Context) {
	fmt.Println("getting deployment by name")
    namespace := utils.SanitizeNamespace(ctx.GetString("username"))
	ctrl.v1DeploymentsDao.GetDeploymentByName(ctx, namespace)
}

func (ctrl DeploymentController) CreateNamespace(ctx *gin.Context) {
	fmt.Println("getting deployment by name")
    namespace := utils.SanitizeNamespace(ctx.GetString("username"))
	ctrl.v1DeploymentsDao.CreateNamespace(ctx, namespace)
}

func (ctrl DeploymentController) CreateDeployment(ctx *gin.Context) {
	fmt.Println("getting deployment by name")
	var request *model_deployment.CreateDeploymentRequest
	if ok := utils.BindJSON(ctx, &request); !ok {
		ctx.Abort()
		return
	}
	if request.Name == "" || request.Image == "" || request.ContainerPort == 0 || request.RepoScoutId == "" {
		ctx.JSON(400, gin.H{
			"error": "Invalid request body. Please provide all required fields.",
		})
		ctx.Abort()
	}
    request.Namespace = utils.SanitizeNamespace(ctx.GetString("username"))
	request.CreatedAt = time.Now()
	request.UpdatedAt = time.Now()
	ctrl.v1DeploymentsDao.CreateDeployment(ctx, request)
}

func (ctrl DeploymentController) DeleteDeployment(ctx *gin.Context) {
	fmt.Println("deleting deployment by name")
    ctrl.v1DeploymentsDao.DeleteDeployment(ctx, utils.SanitizeNamespace(ctx.GetString("username")), ctx.Param("deployment_name"))
}

func (ctrl DeploymentController) GetLatestEvents(ctx *gin.Context) {
    ctrl.v1DeploymentsDao.GetLatestEvents(ctx, utils.SanitizeNamespace(ctx.GetString("username")), 10)
}

func (ctrl DeploymentController) UpdateDeploymentByName(ctx *gin.Context) {
	fmt.Println("updatging ", ctx.Request.Body)
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered from panic:", r)
			ctx.JSON(500, gin.H{"error": "Internal server error"})
		}
	}()
	var request = &model_deployment.UpdateDeploymentReq{
		Replicas: -1,
		Image:    "",
	}

	if ok := utils.BindJSON(ctx, &request); !ok {
		ctx.JSON(400, gin.H{
			"error": "Invalid request body. Please provide all required fields.",
		})
		ctx.Abort()
		return
	}
	if request.Name == "" {
		ctx.JSON(400, gin.H{
			"error": "Invalid request body. Please provide all required fields.",
		})
		ctx.Abort()
		return
	}
	fmt.Println("ctrrl update deployment by name")
    ctrl.v1DeploymentsDao.UpdateDeploymentByName(ctx, utils.SanitizeNamespace(ctx.GetString("username")), request)
}

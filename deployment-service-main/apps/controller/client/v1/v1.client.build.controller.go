package v1

import (
	v1Client "deployment-service/apps/dao/client/v1"
	"deployment-service/apps/repository/adapter"
	model_build "deployment-service/models/model.build"
	"deployment-service/utils"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

type BuildController struct {
	v1BuildDao v1Client.IBuildDao
}

type IBuildController interface {
	CreateNewRepoScout(ctx *gin.Context)
	GetAllRepoScouts(ctx *gin.Context)
}

func NewBuildController(repository *adapter.Repository) IBuildController {
	return &BuildController{
		v1BuildDao: v1Client.NewBuildDao(repository),
	}
}

func (ctrl BuildController) CreateNewRepoScout(ctx *gin.Context) {
	fmt.Println("creating scout")
	var request *model_build.RepoScout
	if ok := utils.BindJSON(ctx, &request); !ok {
		ctx.Abort()
		return
	}
    request.Namespace = utils.SanitizeNamespace(ctx.GetString("username"))
	request.RepoName, _ = utils.GetRepoNameFromURL(request.RepoURL)
	request.Deployments = []string{}
	request.CreatedAt = time.Now()
	request.UpdatedAt = time.Now()
	ctrl.v1BuildDao.CreateNewRepoScout(ctx, request)
}

func (ctrl BuildController) GetAllRepoScouts(ctx *gin.Context) {
	fmt.Println("getting all scouts")
    namespace := utils.SanitizeNamespace(ctx.GetString("username"))
	ctrl.v1BuildDao.GetAllRepoScouts(ctx, &model_build.RepoScout{Namespace: namespace})
}

package controllers

import (
	"net/http"

	"gifts-api/models"
	"gifts-api/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthController struct {
	authService services.AuthService
}

func NewAuthController(authService services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

type RegisterRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (c *AuthController) Register(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := c.authService.RegisterWithPhone(ctx.Request.Context(), req.Phone, req.Password, "New User")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully, please verify OTP",
	})
}

func (c *AuthController) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	identifier := req.Phone
	if identifier == "" {
		identifier = req.Email
	}

	accessToken, refreshToken, err := c.authService.Login(
		ctx.Request.Context(),
		identifier,
		req.Password,
		ctx.ClientIP(),
		ctx.GetHeader("User-Agent"),
	)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (c *AuthController) Refresh(ctx *gin.Context) {
	var req RefreshRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, newRefreshToken, err := c.authService.Refresh(ctx.Request.Context(), req.RefreshToken)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

func (c *AuthController) Logout(ctx *gin.Context) {
	var req RefreshRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = c.authService.Logout(ctx.Request.Context(), req.RefreshToken)
	ctx.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func (c *AuthController) SendOTP(ctx *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.authService.SendPhoneOTP(ctx.Request.Context(), req.Phone); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "OTP sent"})
}

func (c *AuthController) VerifyOTP(ctx *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
		Code  string `json:"code" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.authService.VerifyPhoneOTP(ctx.Request.Context(), req.Phone, req.Code); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "phone verified"})
}

func (c *AuthController) GetProfile(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	user, err := c.authService.GetUserProfile(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": user})
}

func (c *AuthController) UpdateProfile(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var profile models.UserProfile
	if err := ctx.ShouldBindJSON(&profile); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.authService.UpdateProfile(ctx.Request.Context(), userID, &profile); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func (c *AuthController) GetAddresses(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	addresses, err := c.authService.GetAddresses(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": addresses})
}

func (c *AuthController) AddAddress(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var address models.UserAddress
	if err := ctx.ShouldBindJSON(&address); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	address.UserID = userID

	if err := c.authService.AddAddress(ctx.Request.Context(), &address); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "address added", "data": address})
}

func (c *AuthController) SetDefaultAddress(ctx *gin.Context) {
	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	addressID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address ID"})
		return
	}

	if err := c.authService.SetDefaultAddress(ctx.Request.Context(), userID, addressID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "default address set"})
}

func (c *AuthController) DeleteAddress(ctx *gin.Context) {
	addressID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address ID"})
		return
	}

	if err := c.authService.DeleteAddress(ctx.Request.Context(), addressID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "address deleted"})
}

func (c *AuthController) UpdateAddress(ctx *gin.Context) {
	addressID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	userIDStr, _ := ctx.Get("user_id")
	userID, _ := uuid.Parse(userIDStr.(string))

	var req models.UserAddress
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = addressID
	req.UserID = userID

	if err := c.authService.UpdateAddress(ctx.Request.Context(), userID, addressID, &req); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "address updated", "data": req})
}

func (c *AuthController) RequestPasswordReset(ctx *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = c.authService.RequestPasswordReset(ctx.Request.Context(), req.Email)
	// Always return success to not leak user existence
	ctx.JSON(http.StatusOK, gin.H{"message": "if the email exists, a reset link has been sent"})
}

func (c *AuthController) ConfirmPasswordReset(ctx *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.authService.ConfirmPasswordReset(ctx.Request.Context(), req.Token, req.NewPassword); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "password reset successfully"})
}

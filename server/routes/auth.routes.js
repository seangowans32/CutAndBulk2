import express from "express";
import { 
  register, 
  login, 
  logout, 
  requireSignin,
  updateBodyData,
  addFavoriteFood,
  removeFavoriteFood,
  updateFavoriteFoodQuantity,
  updateDailyCalories,
  getUserData
} from "../controllers/auth.controller.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Protected routes (require authentication)
router.get("/user", requireSignin, getUserData);
router.put("/body-data", requireSignin, updateBodyData);
router.post("/favorite-foods", requireSignin, addFavoriteFood);
router.delete("/favorite-foods", requireSignin, removeFavoriteFood);
router.put("/favorite-foods/quantity", requireSignin, updateFavoriteFoodQuantity);
router.put("/daily-calories", requireSignin, updateDailyCalories);

// Example protected route
router.get("/secret", requireSignin, (req, res) => {
  res.json({ message: "Access granted! You reached a protected route." });
});

export default router;
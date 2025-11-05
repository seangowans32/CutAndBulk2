import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../../config/config.js";

// REGISTER new user
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Don't send password back
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      created: user.created
    };
    
    res.status(201).json({ message: "Registration successful!", user: userResponse });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    res.status(400).json({ error: err.message });
  }
};

// LOGIN existing user
export const login = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Compare password (synchronous method)
    const isPasswordValid = user.comparePassword(req.body.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign({ _id: user._id }, config.jwtSecret, { expiresIn: "1h" });

    // Set cookie with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour in milliseconds
    };
    
    res.cookie("t", token, cookieOptions);
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        username: user.username, 
        email: user.email,
        bodyData: user.bodyData,
        favoriteFoods: user.favoriteFoods,
        dailyCalories: user.dailyCalories
      } 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ error: err.message || "Could not sign in" });
  }
};

// LOGOUT
export const logout = (req, res) => {
  // Clear cookie with same options used when setting it
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.clearCookie("t", cookieOptions);
  res.json({ message: "Signed out successfully" });
};

// UPDATE user body data and calorie goals
export const updateBodyData = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { weight, height, age, gender, activityLevel, calories } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          bodyData: { weight, height, age, gender, activityLevel, calories },
          updated: new Date()
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ 
      message: "Body data updated successfully", 
      bodyData: user.bodyData 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ADD favorite food
export const addFavoriteFood = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { name, calories, quantity = 0 } = req.body;
    
    if (!name || !calories) {
      return res.status(400).json({ error: "Name and calories are required" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if food already exists
    const existingFood = user.favoriteFoods.find(food => 
      food.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingFood) {
      return res.status(400).json({ error: "This food is already in your favorites" });
    }
    
    user.favoriteFoods.push({ name, calories, quantity });
    await user.save();
    
    res.json({ 
      message: "Food added to favorites", 
      favoriteFoods: user.favoriteFoods 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE favorite food quantity
export const updateFavoriteFoodQuantity = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { name, quantity } = req.body;
    
    if (!name || quantity === undefined) {
      return res.status(400).json({ error: "Name and quantity are required" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Find and update the food's quantity
    const food = user.favoriteFoods.find(food => 
      food.name.toLowerCase() === name.toLowerCase()
    );
    
    if (!food) {
      return res.status(404).json({ error: "Food not found in favorites" });
    }
    
    food.quantity = quantity;
    await user.save();
    
    res.json({ 
      message: "Food quantity updated", 
      favoriteFoods: user.favoriteFoods 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE favorite food
export const removeFavoriteFood = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Food name is required" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove food from favorites array
    user.favoriteFoods = user.favoriteFoods.filter(food => 
      food.name.toLowerCase() !== name.toLowerCase()
    );
    
    await user.save();
    
    res.json({ 
      message: "Food removed from favorites", 
      favoriteFoods: user.favoriteFoods 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE daily calories
export const updateDailyCalories = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { dailyCalories } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          dailyCalories: dailyCalories,
          updated: new Date()
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ 
      message: "Daily calories updated", 
      dailyCalories: user.dailyCalories 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET user data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// MIDDLEWARE: verify JWT for protected routes
export const requireSignin = (req, res, next) => {
  try {
    // Try to get token from Authorization header first
    let token = req.headers.authorization?.split(" ")[1];
    
    // If no token in header, try to get from cookie
    if (!token) {
      token = req.cookies.t;
    }
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.auth = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
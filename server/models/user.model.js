import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: { type: String, trim: true, required: "Username is required", unique: "Username already exists" },
  email: { type: String, trim: true, unique: "Email already exists", required: "Email is required" },
  password: { type: String, required: "Password is required" },
  
  // User's body data and calorie goals
  bodyData: {
    weight: { type: Number },
    height: { type: Number },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female'] },
    activityLevel: { type: String },
    calories: {
      cut: { type: Number },
      maintain: { type: Number },
      bulk: { type: Number }
    }
  },
  
  // User's favorite foods
  favoriteFoods: [{
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Daily calorie tracking
  dailyCalories: { type: Number, default: 0 },
  
  // User's timezone (IANA timezone identifier, e.g., "America/Toronto", "America/New_York")
  timezone: { type: String, default: "America/Toronto" },
  
  created: { type: Date, default: Date.now },
  updated: Date
});

// Hash password before saving
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

// Compare passwords during login
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

export default mongoose.model("User", userSchema);
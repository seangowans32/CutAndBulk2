import cron from 'node-cron';
import User from '../models/user.model.js';

/**
 * Daily reset scheduler
 * Runs at midnight (00:00) every day to reset:
 * - dailyCalories to 0
 * - favoriteFoods[].quantity to 0
 * 
 * Does NOT reset:
 * - bodyData (calorie calculator values)
 * - favoriteFoods items themselves (name, calories)
 */
export const startDailyResetScheduler = () => {
  // Schedule task to run at midnight every day (00:00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Starting daily reset at midnight...');
      
      // Reset dailyCalories for all users
      const result = await User.updateMany(
        {}, // Update all users
        {
          $set: {
            dailyCalories: 0,
            updated: new Date()
          }
        }
      );
      
      // Reset favoriteFoods quantities for all users
      const users = await User.find({});
      let foodQuantityReset = 0;
      
      for (const user of users) {
        let updated = false;
        for (let i = 0; i < user.favoriteFoods.length; i++) {
          if (user.favoriteFoods[i].quantity !== 0) {
            user.favoriteFoods[i].quantity = 0;
            updated = true;
          }
        }
        if (updated) {
          await user.save();
          foodQuantityReset++;
        }
      }
      
      console.log(`Daily reset completed. Updated ${result.modifiedCount} users' dailyCalories.`);
      console.log(`Reset favoriteFood quantities for ${foodQuantityReset} users.`);
      console.log(`Reset dailyCalories to 0 and all favoriteFood quantities to 0.`);
      
    } catch (error) {
      console.error('Error during daily reset:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Toronto" // Adjust to your timezone
  });
  
  console.log('Daily reset scheduler started. Will reset at midnight every day.');
};
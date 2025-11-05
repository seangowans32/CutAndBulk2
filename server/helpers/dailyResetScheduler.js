import cron from 'node-cron';
import User from '../models/user.model.js';

/**
 * Daily reset scheduler
 * Runs every hour to check and reset users at their local midnight (00:00)
 * Resets:
 * - dailyCalories to 0
 * - favoriteFoods[].quantity to 0
 * 
 * Does NOT reset:
 * - bodyData (calorie calculator values)
 * - favoriteFoods items themselves (name, calories)
 */
export const startDailyResetScheduler = () => {
  // Schedule task to run every hour (at minute 0)
  // This allows us to check each user's timezone and reset at their local midnight
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const users = await User.find({});
      let usersReset = 0;
      let foodQuantityReset = 0;
      
      for (const user of users) {
        // Get the current time in the user's timezone
        const userTimezone = user.timezone || 'America/Toronto';
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false
        });
        
        const userTimeString = formatter.format(now);
        const [userHour, userMinute] = userTimeString.split(':').map(Number);
        
        // Check if it's midnight (00:00) in the user's timezone
        if (userHour === 0 && userMinute === 0) {
          // Reset dailyCalories
          user.dailyCalories = 0;
          
          // Reset favoriteFoods quantities
          let updated = false;
          for (let i = 0; i < user.favoriteFoods.length; i++) {
            if (user.favoriteFoods[i].quantity !== 0) {
              user.favoriteFoods[i].quantity = 0;
              updated = true;
            }
          }
          
          user.updated = new Date();
          await user.save();
          usersReset++;
          
          if (updated) {
            foodQuantityReset++;
          }
          
          console.log(`Reset daily data for user ${user.username} (timezone: ${userTimezone})`);
        }
      }
      
      if (usersReset > 0) {
        console.log(`Daily reset completed. Reset ${usersReset} users' dailyCalories.`);
        console.log(`Reset favoriteFood quantities for ${foodQuantityReset} users.`);
      }
      
    } catch (error) {
      console.error('Error during daily reset:', error);
    }
  }, {
    scheduled: true
  });
  
  console.log('Daily reset scheduler started. Will check and reset users at their local midnight every hour.');
};
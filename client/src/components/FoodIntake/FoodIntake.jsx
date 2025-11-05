import React, { useState, useEffect } from 'react';
import './FoodIntake.css';
import { UserAPI, AuthAPI } from '../../api.js';

function FoodIntake({ onCaloriesUpdate }) {
    const [food, setFood] = useState('');
    const [calories, setCalories] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [dailyCalories, setDailyCalories] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check if user is logged in
    const checkAuthStatus = () => {
        const savedUser = localStorage.getItem('user');
        return !!savedUser;
    };

    // Load favorites from localStorage (for unauthenticated users)
    const loadLocalFavorites = () => {
        try {
            const localFavorites = localStorage.getItem('localFavoriteFoods');
            const localCalories = localStorage.getItem('localDailyCalories');
            
            if (localFavorites) {
                const parsed = JSON.parse(localFavorites);
                setFavorites(parsed);
            }
            
            if (localCalories) {
                const parsed = parseInt(localCalories) || 0;
                setDailyCalories(parsed);
                onCaloriesUpdate(parsed);
            }
        } catch (error) {
            console.error('Error loading local favorites:', error);
        }
    };

    // Save favorites to localStorage (for unauthenticated users)
    const saveLocalFavorites = (favoritesToSave, caloriesToSave) => {
        try {
            localStorage.setItem('localFavoriteFoods', JSON.stringify(favoritesToSave));
            localStorage.setItem('localDailyCalories', caloriesToSave.toString());
        } catch (error) {
            console.error('Error saving local favorites:', error);
        }
    };

    // Sync local favorites to database when user logs in
    const syncLocalFavoritesToDatabase = async () => {
        try {
            const localFavorites = localStorage.getItem('localFavoriteFoods');
            if (!localFavorites) return;

            const parsed = JSON.parse(localFavorites);
            
            // Add each favorite food to the database
            for (const fav of parsed) {
                try {
                    await UserAPI.addFavoriteFood({
                        name: fav.name,
                        calories: fav.calories
                    });
                    
                    // Update quantity if it's greater than 0
                    if (fav.quantity > 0) {
                        await UserAPI.updateFavoriteFoodQuantity({
                            name: fav.name,
                            quantity: fav.quantity
                        });
                    }
                } catch (error) {
                    // Food might already exist, that's okay
                    console.log(`Food ${fav.name} might already exist or error occurred:`, error.message);
                }
            }

            // Sync daily calories
            const localCalories = localStorage.getItem('localDailyCalories');
            if (localCalories) {
                const calories = parseInt(localCalories) || 0;
                if (calories > 0) {
                    await UserAPI.updateDailyCalories(calories);
                }
            }

            // Clear local storage after successful sync
            localStorage.removeItem('localFavoriteFoods');
            localStorage.removeItem('localDailyCalories');
        } catch (error) {
            console.error('Error syncing local favorites:', error);
        }
    };

    // Load saved favorites and daily calories on mount
    useEffect(() => {
        if (dataLoaded) return;

        const loadSavedData = async () => {
            const savedUser = localStorage.getItem('user');
            const loggedIn = !!savedUser;
            setIsLoggedIn(loggedIn);

            if (!loggedIn) {
                // Load from localStorage for unauthenticated users
                loadLocalFavorites();
                setIsLoading(false);
                setDataLoaded(true);
                return;
            }

            try {
                const response = await AuthAPI.getUser();
                if (response.user) {
                    // Load favorite foods
                    if (response.user.favoriteFoods && response.user.favoriteFoods.length > 0) {
                        const loadedFavorites = response.user.favoriteFoods.map((fav, index) => ({
                            id: index, // Use index as ID since backend doesn't store IDs
                            name: fav.name,
                            calories: fav.calories,
                            quantity: fav.quantity || 0 // Load saved quantity
                        }));
                        setFavorites(loadedFavorites);
                    }

                    // Load daily calories
                    if (response.user.dailyCalories !== undefined) {
                        setDailyCalories(response.user.dailyCalories);
                        onCaloriesUpdate(response.user.dailyCalories);
                    }

                    // Sync any local favorites that might exist
                    await syncLocalFavoritesToDatabase();
                }
            } catch (error) {
                // Handle error silently
                console.error('Error loading saved data:', error.message);
            } finally {
                setIsLoading(false);
                setDataLoaded(true);
            }
        };

        loadSavedData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for auth changes (login/logout)
    useEffect(() => {
        const handleAuthChange = async () => {
            const loggedIn = checkAuthStatus();
            setIsLoggedIn(loggedIn);

            if (loggedIn) {
                // User just logged in, reload data from server
                try {
                    const response = await AuthAPI.getUser();
                    if (response.user) {
                        if (response.user.favoriteFoods && response.user.favoriteFoods.length > 0) {
                            const loadedFavorites = response.user.favoriteFoods.map((fav, index) => ({
                                id: index,
                                name: fav.name,
                                calories: fav.calories,
                                quantity: fav.quantity || 0
                            }));
                            setFavorites(loadedFavorites);
                        }

                        if (response.user.dailyCalories !== undefined) {
                            setDailyCalories(response.user.dailyCalories);
                            onCaloriesUpdate(response.user.dailyCalories);
                        }

                        // Sync local favorites to database
                        await syncLocalFavoritesToDatabase();
                    }
                } catch (error) {
                    console.error('Error loading user data after login:', error);
                }
            } else {
                // User logged out, load from localStorage
                loadLocalFavorites();
            }
        };

        window.addEventListener('authChange', handleAuthChange);
        return () => window.removeEventListener('authChange', handleAuthChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addFood = async (e) => {
        e.preventDefault();

        const foodName = food.trim().toLowerCase();
        const existingFood = favorites.find(fav => fav.name.toLowerCase() === foodName);

        if (existingFood) {
            alert('This food is already in your favorites!');
            return;
        }

        const newFood = {
            id: favorites.length, // Use length as ID
            name: food.trim(),
            calories: parseInt(calories),
            quantity: 0
        };

        // Add to local state immediately
        const updatedFavorites = [...favorites, newFood];
        setFavorites(updatedFavorites);
        setFood('');
        setCalories('');

        // Save to backend if logged in, otherwise save to localStorage
        if (isLoggedIn) {
            try {
                await UserAPI.addFavoriteFood({
                    name: newFood.name,
                    calories: newFood.calories
                });
            } catch (error) {
                alert(error.message || 'Failed to add food. Please try again.');
                // Remove from local state if backend save failed
                setFavorites(favorites);
            }
        } else {
            // Save to localStorage for unauthenticated users
            saveLocalFavorites(updatedFavorites, dailyCalories);
        }
    };

    const addCalories = async (foodItem) => {
        const newQuantity = foodItem.quantity + 1;
        const newDailyCalories = dailyCalories + foodItem.calories;

        const updatedFavorites = favorites.map(fav => {
            if (fav.id === foodItem.id) {
                return { ...fav, quantity: newQuantity };
            }
            return fav;
        });

        setDailyCalories(newDailyCalories);
        onCaloriesUpdate(newDailyCalories);
        setFavorites(updatedFavorites);

        // Save to backend if logged in, otherwise save to localStorage
        if (isLoggedIn) {
            // Save daily calories to backend
            UserAPI.updateDailyCalories(newDailyCalories).catch(err => {
                console.error('Failed to update daily calories:', err);
            });

            // Save quantity to backend
            UserAPI.updateFavoriteFoodQuantity({
                name: foodItem.name,
                quantity: newQuantity
            }).catch(err => {
                console.error('Failed to update food quantity:', err);
            });
        } else {
            // Save to localStorage for unauthenticated users
            saveLocalFavorites(updatedFavorites, newDailyCalories);
        }
    };

    const subtractCalories = async (foodItem) => {
        if (foodItem.quantity <= 0) return;

        const newQuantity = foodItem.quantity - 1;
        const newDailyCalories = Math.max(0, dailyCalories - foodItem.calories);

        const updatedFavorites = favorites.map(fav => {
            if (fav.id === foodItem.id) {
                return { ...fav, quantity: newQuantity };
            }
            return fav;
        });

        setDailyCalories(newDailyCalories);
        onCaloriesUpdate(newDailyCalories);
        setFavorites(updatedFavorites);

        // Save to backend if logged in, otherwise save to localStorage
        if (isLoggedIn) {
            // Save daily calories to backend
            UserAPI.updateDailyCalories(newDailyCalories).catch(err => {
                console.error('Failed to update daily calories:', err);
            });

            // Save quantity to backend
            UserAPI.updateFavoriteFoodQuantity({
                name: foodItem.name,
                quantity: newQuantity
            }).catch(err => {
                console.error('Failed to update food quantity:', err);
            });
        } else {
            // Save to localStorage for unauthenticated users
            saveLocalFavorites(updatedFavorites, newDailyCalories);
        }
    };

    const removeFavorite = async (foodItem) => {
        try {
            // Calculate calories to subtract (calories per serving * quantity consumed)
            const caloriesToSubtract = foodItem.calories * foodItem.quantity;
            const newDailyCalories = Math.max(0, dailyCalories - caloriesToSubtract);

            // Update daily calories if there were any consumed
            if (caloriesToSubtract > 0) {
                setDailyCalories(newDailyCalories);
                onCaloriesUpdate(newDailyCalories);
            }

            // Remove from backend if logged in, otherwise just remove from localStorage
            if (isLoggedIn) {
                // Save daily calories to backend
                if (caloriesToSubtract > 0) {
                    UserAPI.updateDailyCalories(newDailyCalories).catch(err => {
                        console.error('Failed to update daily calories:', err);
                    });
                }

                // Remove from backend
                await UserAPI.removeFavoriteFood({
                    name: foodItem.name
                });
            } else {
                // Save to localStorage for unauthenticated users
                const updatedFavorites = favorites.filter(fav => fav.id !== foodItem.id);
                saveLocalFavorites(updatedFavorites, newDailyCalories);
            }

            // Remove from local state
            setFavorites(favorites.filter(fav => fav.id !== foodItem.id));
        } catch (error) {
            alert(error.message || 'Failed to remove food. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="food-intake-container">
                <p>Loading favorites...</p>
            </div>
        );
    }

    return (
        <div className="food-intake-container">
            <h3>Add Food</h3>
            <form onSubmit={addFood}>
                <div className='form-group flex gap-20'>
                    <input
                        type="text"
                        value={food}
                        onChange={(e) => setFood(e.target.value)}
                        placeholder="Food name"
                        required
                    />

                    <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        placeholder="Calories"
                        required
                    />
                </div>

                <button className='frontend-button' type="submit">Add Food</button>
            </form>

            <div className='food-favorites'>
                <h3>Favorite Foods</h3>
                <p>Daily Calories: {dailyCalories} kcal</p>
                
                {!isLoggedIn && (
                    <p style={{ 
                        padding: '10px', 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffc107', 
                        borderRadius: '4px',
                        marginBottom: '10px',
                        fontSize: '14px'
                    }}>
                        ⚠️ You're not logged in. Your favorite foods are saved locally. 
                        <a href="/login" style={{ marginLeft: '5px', color: '#007bff' }}>Login</a> or 
                        <a href="/register" style={{ marginLeft: '5px', color: '#007bff' }}>Register</a> to save them permanently.
                    </p>
                )}

                {favorites.length === 0 ? (
                  <p>No favorite foods yet. Add some foods above!</p>
                ) : (
                  favorites.map((foodItem) => (
                    <div key={foodItem.id} className='food-intake-item'>
                        <div className="food-info">
                            <span className="food-name text-small">{foodItem.name}</span>
                            <span className="food-calories text-small">{foodItem.calories} cal</span>
                        </div>

                        <div className="food-actions">
                            <button className="add-calories-btn" onClick={() => addCalories(foodItem)} title="Add to daily calories">+</button>
                            <button className="subtract-calories-btn" onClick={() => subtractCalories(foodItem)} title="Subtract from daily calories">-</button>
                            <span className="food-quantity">{foodItem.quantity}</span>
                            <button className="remove-from-favorites-btn" onClick={() => removeFavorite(foodItem)} title="Remove from favorites">x</button>
                        </div>
                    </div>
                  ))
                )}
            </div>
        </div>
    );
}

export default FoodIntake;
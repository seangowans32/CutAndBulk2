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

    // Load saved favorites and daily calories on mount
    useEffect(() => {
        if (dataLoaded) return;

        const loadSavedData = async () => {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
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

    const addFood = async (e) => {
        e.preventDefault();

        const foodName = food.trim().toLowerCase();
        const existingFood = favorites.find(fav => fav.name.toLowerCase() === foodName);

        if (existingFood) {
            alert('This food is already in your favorites!');
            return;
        }

        try {
            // Save to backend
            const response = await UserAPI.addFavoriteFood({
                name: food.trim(),
                calories: parseInt(calories)
            });

            // Add to local state with quantity 0
            const newFood = {
                id: favorites.length, // Use length as ID
                name: food.trim(),
                calories: parseInt(calories),
                quantity: 0
            };

            // Note: quantity is saved as 0 when adding, backend will store it

            setFavorites([...favorites, newFood]);
            setFood('');
            setCalories('');
        } catch (error) {
            alert(error.message || 'Failed to add food. Please try again.');
        }
    };

    const addCalories = async (foodItem) => {
        const updatedFavorites = favorites.map(fav => {
            if (fav.id === foodItem.id) {
                const newQuantity = fav.quantity + 1;
                const newDailyCalories = dailyCalories + fav.calories;

                setDailyCalories(newDailyCalories);
                onCaloriesUpdate(newDailyCalories);

                // Save daily calories to backend
                UserAPI.updateDailyCalories(newDailyCalories).catch(err => {
                    console.error('Failed to update daily calories:', err);
                });

                // Save quantity to backend
                UserAPI.updateFavoriteFoodQuantity({
                    name: fav.name,
                    quantity: newQuantity
                }).catch(err => {
                    console.error('Failed to update food quantity:', err);
                });

                return { ...fav, quantity: newQuantity };
            }
            return fav;
        });

        setFavorites(updatedFavorites);
    };

    const subtractCalories = async (foodItem) => {
        const updatedFavorites = favorites.map(fav => {
            if (fav.id === foodItem.id && fav.quantity > 0) {
                const newQuantity = fav.quantity - 1;
                const newDailyCalories = Math.max(0, dailyCalories - fav.calories);

                setDailyCalories(newDailyCalories);
                onCaloriesUpdate(newDailyCalories);

                // Save daily calories to backend
                UserAPI.updateDailyCalories(newDailyCalories).catch(err => {
                    console.error('Failed to update daily calories:', err);
                });

                // Save quantity to backend
                UserAPI.updateFavoriteFoodQuantity({
                    name: fav.name,
                    quantity: newQuantity
                }).catch(err => {
                    console.error('Failed to update food quantity:', err);
                });

                return { ...fav, quantity: newQuantity };
            }
            return fav;
        });

        setFavorites(updatedFavorites);
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

                // Save daily calories to backend
                UserAPI.updateDailyCalories(newDailyCalories).catch(err => {
                    console.error('Failed to update daily calories:', err);
                });
            }

            // Remove from backend
            await UserAPI.removeFavoriteFood({
                name: foodItem.name
            });

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
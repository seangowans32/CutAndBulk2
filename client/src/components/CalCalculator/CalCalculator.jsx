import React, { useState, useEffect } from 'react';
import { UserAPI, AuthAPI } from '../../api.js';

const CalCalculator = ({ onCaloriesCalculated, onFieldFocus }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState(1.2);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load saved data when component mounts (only once)
  useEffect(() => {
    // Only load if we haven't loaded data yet
    if (dataLoaded) return;

    const loadSavedData = async () => {
      // Check if user is logged in first (check localStorage)
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        setIsLoading(false);
        setDataLoaded(true);
        return; // User not logged in, skip API call
      }

      try {
        const response = await AuthAPI.getUser();
        if (response.user && response.user.bodyData) {
          const bodyData = response.user.bodyData;
          
          // Mark that we have existing data
          setHasExistingData(true);
          
          // Load saved data (only on first mount, dataLoaded flag prevents reloading)
          if (bodyData.weight) setWeight(String(bodyData.weight));
          if (bodyData.height) setHeight(String(bodyData.height));
          if (bodyData.gender) setGender(bodyData.gender);
          if (bodyData.activityLevel) setActivityLevel(bodyData.activityLevel);
          if (bodyData.age) setAge(String(bodyData.age));
          
          // If calories are saved, update parent component
          if (bodyData.calories && bodyData.calories.cut) {
            onCaloriesCalculated(bodyData.calories);
          }
        }
      } catch (error) {
        // User might not be logged in or session expired - handle silently
        // Don't log to console, just proceed without saved data
        if (error.message && !error.message.includes('Unauthorized')) {
          console.error('Error loading saved data:', error.message);
        }
      } finally {
        setIsLoading(false);
        setDataLoaded(true);
      }
    };

    loadSavedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const calculateBMR = () => {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const calculateTDEE = (bmr) => {
    return bmr * activityLevel;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const bmr = calculateBMR();
      const tdee = calculateTDEE(bmr);
      const calculatedCalories = {
        cut: Math.round(tdee - 500),
        maintain: Math.round(tdee),
        bulk: Math.round(tdee + 500)
      };
      
      // Save to backend
      await UserAPI.updateBodyData({
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: age ? parseFloat(age) : undefined,
        gender,
        activityLevel: parseFloat(activityLevel),
        calories: calculatedCalories
      });
      
      // Update parent component
      onCaloriesCalculated(calculatedCalories);
      
      // Show appropriate message based on whether we're updating or creating new
      const message = hasExistingData 
        ? 'Data updated successfully!' 
        : 'Data saved successfully!';
      setSaveMessage(message);
      
      // Mark that we now have existing data
      setHasExistingData(true);
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage(error.message || 'Failed to save data. Please try again.');
      // Still calculate and show results even if save fails
      const bmr = calculateBMR();
      const tdee = calculateTDEE(bmr);
      onCaloriesCalculated({
        cut: Math.round(tdee - 500),
        maintain: Math.round(tdee),
        bulk: Math.round(tdee + 500)
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="calorie-calculator">
        <p>Loading saved data...</p>
      </div>
    );
  }

  return (
    <div className="calorie-calculator">
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label>Weight (kg):</label>
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            onFocus={() => onFieldFocus('weight')} 
            required 
          />
        </div>
        <div className='form-group'>
          <label>Height (cm):</label>
          <input 
            type="number" 
            value={height} 
            onChange={(e) => setHeight(e.target.value)} 
            onFocus={() => onFieldFocus('height')} 
            required 
          />
        </div>
        <div className='form-group'>
          <label>Age (years):</label>
          <input 
            type="number" 
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
            onFocus={() => onFieldFocus('age')} 
            required 
          />
        </div>
        <div className='form-group'>
          <label>Gender:</label>
          <select 
            value={gender} 
            onChange={(e) => setGender(e.target.value)} 
            onFocus={() => onFieldFocus('gender')}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className='form-group'>
          <label>Activity Level:</label>
          <select 
            value={activityLevel} 
            onChange={(e) => setActivityLevel(Number(e.target.value))} 
            onFocus={() => onFieldFocus('activityLevel')}
          >
            <option value={1.2}>Sedentary (little or no exercise)</option>
            <option value={1.375}>Lightly active (light exercise/sports 1-3 days/week)</option>
            <option value={1.55}>Moderately active (moderate exercise/sports 3-5 days/week)</option>
            <option value={1.725}>Very active (hard exercise/sports 6-7 days a week)</option>
            <option value={1.9}>Extra active (very hard exercise, physical job, or training twice a day)</option>
          </select>
        </div>
        <button className='frontend-button' type="submit" disabled={isSaving}>
          {isSaving ? (hasExistingData ? 'Updating...' : 'Saving...') : (hasExistingData ? 'Update & Recalculate' : 'Calculate & Save')}
        </button>
        {saveMessage && (
          <p className={`info-box ${saveMessage.includes('successfully') ? '' : 'error'}`} style={{ marginTop: '10px' }}>
            {saveMessage}
          </p>
        )}
      </form>
    </div>
  );
};

export default CalCalculator;
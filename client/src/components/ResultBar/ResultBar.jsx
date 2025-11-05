import React from 'react';
import './ResultBar.css';

const ResultBar = ({ calories, dailyCalories }) => {

  const getCalorieBarWidth = () => {
    if(!calories || dailyCalories === 0) return '0%';
    const calMaintain = calories.maintain;
    const percentage = ((dailyCalories * 100) / calMaintain) / 2;

    return `${Math.min(Math.max(percentage, 0), 100)}%`;
  };

  function cut() {
    if(!calories) return;

    const percentage = (((calories.maintain - 500) * 100) / calories.maintain) / 2;
    return `${percentage}%`;
  };

  function bulk() {
    if(!calories) return;

    const percentage = (((calories.maintain + 500) * 100) / calories.maintain) / 2;
    return `${percentage}%`;
  };

  const getProgressTitle = () => {
    if (!calories) return "Complete your body calculator to see your progress";
    
    const { cut, maintain, bulk } = calories;
    
    if (dailyCalories < cut) {
      return "You can eat more - Keep going!";
    } else if (dailyCalories >= cut && dailyCalories < maintain) {
      return "You're in the Cut zone - Great progress!";
    } else if (dailyCalories >= maintain && dailyCalories < bulk) {
      return "You're in the Bulk zone - Perfect!";
    } else {
      return "You have exceeded the recommended bulk intake - No more food will benefit you";
    }
  };

  return (
    <div className="results-container">
      <h3 className="progress-title">{getProgressTitle()}</h3>
      
      <div className="results flex">
        <div className="calorie-labels">
          <span className="text-small">Cut: {calories ? calories.cut : '-'}</span>
          <span className="text-small">Maintain: {calories ? calories.maintain : '-'}</span>
          <span className="text-small">Bulk: {calories ? calories.bulk : '-'}</span>
        </div>

        <div className="calorie-bar-container">
          <div className="calorie-bar" style={{ width: getCalorieBarWidth() }}></div>
          <div className="maintain-line"></div>
          <div className="cut-line" style={{left: cut()}}></div>
          <div className="bulk-line" style={{left: bulk()}}></div>
        </div>

        <p className="daily-calories">Daily Calories: {dailyCalories} kcal</p>
      </div>
    </div>
  );
};

export default ResultBar;
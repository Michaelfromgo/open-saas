import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestMealPlan, generateMealPlan } from 'wasp/client/operations';
import { useQuery } from 'wasp/client/operations';
import { getUserMealPreferences } from 'wasp/client/operations';
import { MealPlanData, Day, Meal } from './operations';
import { cn } from '../client/cn';

export default function MealPlanPage() {
  const navigate = useNavigate();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Get the latest meal plan
  const { 
    data: mealPlan, 
    isLoading: isPlanLoading,
    error: planError 
  } = useQuery(getLatestMealPlan);
  
  // Get user's meal preferences
  const { 
    data: preferences,
    isLoading: preferencesLoading 
  } = useQuery(getUserMealPreferences);
  
  // Parse the meal plan data
  const mealPlanData: MealPlanData | null = mealPlan ? (mealPlan.planData as MealPlanData) : null;
  
  const handleRegenerate = async () => {
    if (!preferences) return;
    
    setIsRegenerating(true);
    setError('');
    
    try {
      await generateMealPlan({
        calorieTarget: preferences.calorieTarget,
        mealsPerDay: preferences.mealsPerDay,
        dietType: preferences.dietType,
        allergies: preferences.allergies,
        cuisines: preferences.cuisines,
        prepTime: preferences.prepTime,
      });
      // Reload the page to show the new plan
      window.location.reload();
    } catch (error: any) {
      console.error('Error regenerating meal plan:', error);
      if (error.message.includes('402')) {
        setError('You need more credits to generate a new meal plan. Please visit the pricing page.');
      } else {
        setError('Failed to regenerate meal plan. Please try again.');
      }
    } finally {
      setIsRegenerating(false);
    }
  };
  
  if (isPlanLoading || preferencesLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Loading your meal plan...</h1>
      </div>
    );
  }
  
  // If no meal plan exists, redirect to the onboarding page
  if (!mealPlan || !mealPlanData) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">No Meal Plan Found</h1>
        <p className="mb-4">You haven't generated a meal plan yet. Create your first meal plan to get started.</p>
        <button
          onClick={() => navigate('/meal-plan/onboarding')}
          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Meal Plan
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your 7-Day Meal Plan</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/meal-plan/onboarding')}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Preferences
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={cn(
              "inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              isRegenerating && "opacity-75 cursor-not-allowed"
            )}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
          {error.includes('credits') && (
            <a href="/pricing" className="underline font-medium">Go to Pricing</a>
          )}
        </div>
      )}
      
      {/* User preferences summary */}
      {preferences && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-2">Your Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Daily Calories:</span> {preferences.calorieTarget} kcal
            </div>
            <div>
              <span className="font-medium">Meals Per Day:</span> {preferences.mealsPerDay}
            </div>
            <div>
              <span className="font-medium">Diet Type:</span> {preferences.dietType.join(', ') || 'No restrictions'}
            </div>
          </div>
        </div>
      )}
      
      {/* Meal Plan Grid */}
      <div className="space-y-8">
        {mealPlanData.days.map((day, dayIndex) => (
          <div key={dayIndex} className="bg-white shadow overflow-hidden rounded-lg">
            <div className="bg-gray-100 px-4 py-3 border-b">
              <h2 className="text-lg font-medium">{day.day}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {day.meals.map((meal, mealIndex) => (
                <MealCard key={mealIndex} meal={meal} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for displaying a single meal
function MealCard({ meal }: { meal: Meal }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="px-4 py-4">
      <div 
        className="flex justify-between items-start cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-md font-medium">{meal.title}</h3>
        <div className="text-sm text-gray-500">
          {meal.macros.calories} kcal
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1">Ingredients:</h4>
            <ul className="list-disc pl-5 text-sm">
              {meal.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1">Instructions:</h4>
            <p className="text-sm">{meal.instructions}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Macros:</h4>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div><span className="font-medium">Calories:</span> {meal.macros.calories}</div>
              <div><span className="font-medium">Protein:</span> {meal.macros.protein}g</div>
              <div><span className="font-medium">Carbs:</span> {meal.macros.carbs}g</div>
              <div><span className="font-medium">Fat:</span> {meal.macros.fat}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
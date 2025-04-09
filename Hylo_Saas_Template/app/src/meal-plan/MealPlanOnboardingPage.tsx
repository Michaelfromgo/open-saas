import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateMealPlan, getUserMealPreferences } from 'wasp/client/operations';
import { useQuery } from 'wasp/client/operations';
import { cn } from '../client/cn';

export default function MealPlanOnboardingPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default values
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [dietType, setDietType] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState('30 min');

  // Get user's existing preferences
  const { data: userPreferences, isLoading } = useQuery(getUserMealPreferences);

  // Populate form with existing preferences if available
  useEffect(() => {
    if (userPreferences) {
      setCalorieTarget(userPreferences.calorieTarget);
      setMealsPerDay(userPreferences.mealsPerDay);
      setDietType(userPreferences.dietType);
      setAllergies(userPreferences.allergies);
      setCuisines(userPreferences.cuisines);
      setPrepTime(userPreferences.prepTime);
    }
  }, [userPreferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await generateMealPlan({
        calorieTarget,
        mealsPerDay,
        dietType,
        allergies,
        cuisines,
        prepTime,
      });
      
      // Navigate to meal plan page on success
      navigate('/meal-plan');
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      if (error.message.includes('402')) {
        setError('You need more credits to generate a meal plan. Please visit the pricing page.');
      } else {
        setError('Failed to generate meal plan. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDietTypeChange = (diet: string) => {
    if (dietType.includes(diet)) {
      setDietType(dietType.filter(item => item !== diet));
    } else {
      setDietType([...dietType, diet]);
    }
  };

  const handleAllergyChange = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(item => item !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleCuisineChange = (cuisine: string) => {
    if (cuisines.includes(cuisine)) {
      setCuisines(cuisines.filter(item => item !== cuisine));
    } else {
      setCuisines([...cuisines, cuisine]);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Customize Your Meal Plan</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
          {error.includes('credits') && (
            <a href="/pricing" className="underline font-medium">Go to Pricing</a>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Calorie Target */}
        <div>
          <label htmlFor="calorieTarget" className="block text-sm font-medium mb-1">
            Daily Calorie Target (kcal)
          </label>
          <input
            type="number"
            id="calorieTarget"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(parseInt(e.target.value))}
            min="1000"
            max="5000"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* Meals Per Day */}
        <div>
          <label htmlFor="mealsPerDay" className="block text-sm font-medium mb-1">
            Meals Per Day
          </label>
          <select
            id="mealsPerDay"
            value={mealsPerDay}
            onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {[2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        
        {/* Diet Type */}
        <div>
          <span className="block text-sm font-medium mb-2">Diet Type</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['No restriction', 'Vegan', 'Vegetarian', 'Keto', 'Paleo'].map((diet) => (
              <label key={diet} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  checked={dietType.includes(diet)}
                  onChange={() => handleDietTypeChange(diet)}
                />
                <span className="ml-2">{diet}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Allergies */}
        <div>
          <span className="block text-sm font-medium mb-2">Allergies (Optional)</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish'].map((allergy) => (
              <label key={allergy} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  checked={allergies.includes(allergy)}
                  onChange={() => handleAllergyChange(allergy)}
                />
                <span className="ml-2">{allergy}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Cuisines */}
        <div>
          <span className="block text-sm font-medium mb-2">Preferred Cuisines (Optional)</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Mediterranean', 'Asian', 'Mexican', 'American', 'Italian', 'Indian'].map((cuisine) => (
              <label key={cuisine} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  checked={cuisines.includes(cuisine)}
                  onChange={() => handleCuisineChange(cuisine)}
                />
                <span className="ml-2">{cuisine}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Prep Time */}
        <div>
          <label htmlFor="prepTime" className="block text-sm font-medium mb-1">
            Maximum Preparation Time
          </label>
          <select
            id="prepTime"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="15 min">15 minutes</option>
            <option value="30 min">30 minutes</option>
            <option value="45 min">45 minutes</option>
            <option value="60 min">1 hour</option>
            <option value="90 min">1.5 hours</option>
          </select>
        </div>
        
        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
              isSubmitting && "opacity-75 cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Generating Meal Plan...' : 'Generate Meal Plan'}
          </button>
        </div>
      </form>
    </div>
  );
} 
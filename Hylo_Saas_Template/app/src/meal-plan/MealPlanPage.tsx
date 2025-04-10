import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestMealPlan, generateMealPlan } from 'wasp/client/operations';
import { useQuery } from 'wasp/client/operations';
import { getUserMealPreferences } from 'wasp/client/operations';
import { MealPlanData, Day, Meal } from './operations';
import { cn } from '../client/cn';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function MealPlanPage() {
  const navigate = useNavigate();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [groceryList, setGroceryList] = useState<string[]>([]);
  const [mealPlanState, setMealPlanState] = useState<MealPlanData | null>(null);
  
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
  
  // Initialize local state with the fetched meal plan data
  React.useEffect(() => {
    if (mealPlanData && !mealPlanState) {
      setMealPlanState({...mealPlanData});
    }
  }, [mealPlanData]);

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
        useLeftovers: preferences.useLeftovers,
        repeatBreakfast: preferences.repeatBreakfast,
        breakfastOptions: preferences.breakfastOptions,
        measurementSystem: preferences.measurementSystem,
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

  // Handle drag and drop reordering
  const onDragEnd = (result: any) => {
    if (!result.destination || !mealPlanState) return;
    
    const { source, destination } = result;
    const dayIndex = parseInt(source.droppableId.split('-')[1]);
    
    // Copy the current state
    const updatedMealPlan = {...mealPlanState};
    const day = {...updatedMealPlan.days[dayIndex]};
    const meals = [...day.meals];
    
    // Reorder the meals
    const [reorderedMeal] = meals.splice(source.index, 1);
    meals.splice(destination.index, 0, reorderedMeal);
    
    // Update the day's meals
    day.meals = meals;
    updatedMealPlan.days[dayIndex] = day;
    
    // Update state
    setMealPlanState(updatedMealPlan);
  };

  // Generate grocery list from meal plan
  const generateGroceryList = () => {
    if (!mealPlanState) return;
    
    // Extract all ingredients from all meals
    const allIngredients: string[] = [];
    
    mealPlanState.days.forEach(day => {
      day.meals.forEach(meal => {
        // Skip ingredients for meals that use leftovers as they're already counted
        if (!meal.isLeftoverFrom) {
          meal.ingredients.forEach(ingredient => {
            allIngredients.push(ingredient);
          });
        }
      });
    });
    
    // Consolidate similar ingredients with quantities
    const ingredientMap = new Map<string, { count: number, text: string }>();
    
    allIngredients.forEach(ingredient => {
      // Normalize the ingredient string to prevent parsing errors
      const normalizedIngredient = ingredient.trim();
      let processed = false;
      
      try {
        // Try to extract quantity and ingredient name using safer regex
        const quantityMatch = normalizedIngredient.match(/^([\d\/\.\s]+)\s+(.+)$/);
        
        if (quantityMatch) {
          const [_, quantityStr, restOfText] = quantityMatch;
          let quantity = 0;
          
          // Try to parse the quantity as a number or fraction
          if (quantityStr.includes('/')) {
            try {
              const parts = quantityStr.split('/');
              if (parts.length === 2) {
                const numerator = parseFloat(parts[0].trim());
                const denominator = parseFloat(parts[1].trim());
                if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                  quantity = numerator / denominator;
                }
              }
            } catch (e) {
              // If fraction parsing fails, just use 1 as the count
              quantity = 1;
            }
          } else {
            const parsedQuantity = parseFloat(quantityStr.trim());
            if (!isNaN(parsedQuantity)) {
              quantity = parsedQuantity;
            }
          }
          
          // If we have a valid quantity
          if (quantity > 0) {
            // Create a key for this ingredient
            // Try to extract unit if present
            let key = restOfText.toLowerCase();
            let displayText = restOfText;
            
            // Check for common units
            const commonUnits = ['cup', 'cups', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 
              'g', 'gram', 'grams', 'kg', 'ml', 'l', 'liter', 'liters', 'tbsp', 'tsp', 
              'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons'];
            
            // Try to find unit in the text
            for (const unit of commonUnits) {
              const unitRegex = new RegExp(`^(${unit})s?\\s+(?:of\\s+)?(.+)$`, 'i');
              const unitMatch = restOfText.match(unitRegex);
              
              if (unitMatch) {
                const [_, matchedUnit, ingredientName] = unitMatch;
                key = `${ingredientName.trim().toLowerCase()}:${matchedUnit.toLowerCase()}`;
                displayText = `${ingredientName.trim()} (${matchedUnit})`;
                break;
              }
            }
            
            // Store or update in map
            if (ingredientMap.has(key)) {
              ingredientMap.get(key)!.count += quantity;
            } else {
              ingredientMap.set(key, { count: quantity, text: displayText });
            }
            processed = true;
          }
        }
      } catch (e) {
        console.error("Error parsing ingredient:", e);
      }
      
      // If parsing fails or no quantity found, just add as is with count 1
      if (!processed) {
        const key = normalizedIngredient.toLowerCase();
        if (ingredientMap.has(key)) {
          ingredientMap.get(key)!.count += 1;
        } else {
          ingredientMap.set(key, { count: 1, text: normalizedIngredient });
        }
      }
    });
    
    // Convert map values to array and format with quantities
    const consolidatedIngredients = Array.from(ingredientMap.entries()).map(([key, item]) => {
      if (item.count === 1) {
        return item.text; // Return text for single items
      } else if (key.includes(':')) {
        // For items with units
        const [name, unit] = key.split(':');
        return `${item.count} ${unit} of ${name}`;
      } else {
        return `${item.count} ${item.text}`;
      }
    }).sort();
    
    setGroceryList(consolidatedIngredients);
    setShowGroceryList(true);
  };
  
  // Function to copy grocery list to clipboard
  const copyToClipboard = () => {
    const text = groceryList.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Grocery list copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  // Function to export grocery list as a text file
  const exportGroceryList = () => {
    const text = groceryList.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Your 7-Day Meal Plan</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateGroceryList}
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
          >
            Generate Grocery List
          </button>
          <button
            onClick={() => navigate('/meal-plan/onboarding')}
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
          >
            Edit Preferences
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={cn(
              "inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900",
              isRegenerating && "opacity-75 cursor-not-allowed"
            )}
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}
          </button>
        </div>
      </div>
      
      {/* Error Alert - Add dark mode colors */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
          {error.includes('credits') && (
            <a href="/pricing" className="underline font-medium dark:text-red-300">Go to Pricing</a>
          )}
        </div>
      )}
      
      {/* User preferences summary */}
      {preferences && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-2 dark:text-white">Your Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="dark:text-gray-200">
              <span className="font-medium">Daily Calories:</span> {preferences.calorieTarget} kcal
            </div>
            <div className="dark:text-gray-200">
              <span className="font-medium">Meals Per Day:</span> {preferences.mealsPerDay}
            </div>
            <div className="dark:text-gray-200">
              <span className="font-medium">Diet Type:</span> {preferences.dietType.join(', ') || 'No restrictions'}
            </div>
          </div>
        </div>
      )}
      
      {/* Grocery List Modal - Fix dark mode colors */}
      {showGroceryList && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-black dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium dark:text-white">Weekly Grocery List</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                >
                  Copy
                </button>
                <button
                  onClick={exportGroceryList}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
                >
                  Export
                </button>
                <button
                  onClick={() => setShowGroceryList(false)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)] dark:text-gray-200">
              <ul className="space-y-1">
                {groceryList.map((item, index) => (
                  <li key={index} className="py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex">
                    <input 
                      type="checkbox" 
                      defaultChecked={true}
                      className="mr-2 mt-1 h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-700 dark:checked:bg-indigo-600"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Meal Plan Grid with Drag and Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-8">
          {mealPlanState?.days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600">
                <h2 className="text-lg font-medium dark:text-white">{day.day}</h2>
              </div>
              
              <Droppable droppableId={`day-${dayIndex}`}>
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    {day.meals.map((meal, mealIndex) => (
                      <Draggable 
                        key={`${meal.title}-${mealIndex}`} 
                        draggableId={`meal-${dayIndex}-${mealIndex}`} 
                        index={mealIndex}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}
                          >
                            <MealCard meal={meal} dragHandleProps={provided.dragHandleProps} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

// Component for displaying a single meal
function MealCard({ meal, dragHandleProps }: { meal: Meal, dragHandleProps: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [adjustServings, setAdjustServings] = useState(false);
  const [servingsMultiplier, setServingsMultiplier] = useState(1); // Default to 1 serving
  
  return (
    <div className="px-4 py-4 dark:text-gray-300">
      <div 
        className="flex justify-between items-start cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start">
          <div 
            {...dragHandleProps} 
            className="mr-2 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
          <div>
            <h3 className="text-md font-medium dark:text-white">{meal.title}</h3>
            {meal.leftoverFor && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Makes leftovers for: {meal.leftoverFor}
              </span>
            )}
            {meal.isLeftoverFrom && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Uses leftovers from: {meal.isLeftoverFrom}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {meal.macros.calories} kcal
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1 dark:text-white">Ingredients:</h4>
            <ul className="list-disc pl-5 text-sm dark:text-gray-300">
              {meal.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1 dark:text-white">Instructions:</h4>
            <p className="text-sm dark:text-gray-300">{meal.instructions}</p>
          </div>
          
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-1 dark:text-white">Macros:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm dark:text-gray-300">
              <div><span className="font-medium">Calories:</span> {meal.macros.calories}</div>
              <div><span className="font-medium">Protein:</span> {meal.macros.protein}g</div>
              <div><span className="font-medium">Carbs:</span> {meal.macros.carbs}g</div>
              <div><span className="font-medium">Fat:</span> {meal.macros.fat}g</div>
            </div>
          </div>
          
          {/* Serving Adjustment section - Fix checkbox and select styling */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`adjust-servings-${meal.title}`}
                checked={adjustServings}
                onChange={() => setAdjustServings(!adjustServings)}
                className="h-4 w-4 text-indigo-600 dark:text-indigo-500 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-700 dark:checked:bg-indigo-600"
                onClick={(e) => e.stopPropagation()}
              />
              <label htmlFor={`adjust-servings-${meal.title}`} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Adjust servings
              </label>
            </div>
            
            {adjustServings && (
              <div className="ml-6 mt-2">
                <div className="flex items-center">
                  <label htmlFor={`servings-${meal.title}`} className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    Number of servings:
                  </label>
                  <select
                    id={`servings-${meal.title}`}
                    value={servingsMultiplier}
                    onChange={(e) => setServingsMultiplier(parseFloat(e.target.value))}
                    className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="0.25">1/4</option>
                    <option value="0.5">1/2</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                </div>
                
                <div className="mt-3 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md text-sm">
                  <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Adjusted Ingredient List</h5>
                  <ul className="list-disc pl-5 text-blue-700 dark:text-blue-300">
                    {meal.ingredients.map((ingredient, index) => {
                      // Try to extract quantity and ingredient
                      const quantityMatch = ingredient.match(/^([\d\/\.\s]+)\s+(.+)$/);
                      
                      if (quantityMatch) {
                        const [_, quantityStr, restOfText] = quantityMatch;
                        let quantity = 0;
                        
                        // Parse the quantity
                        if (quantityStr.includes('/')) {
                          const [numerator, denominator] = quantityStr.split('/').map(n => parseFloat(n.trim()));
                          if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                            quantity = (numerator / denominator) * servingsMultiplier;
                          }
                        } else {
                          quantity = parseFloat(quantityStr.trim()) * servingsMultiplier;
                        }
                        
                        // Format the multiplied quantity with special handling for fractions
                        let formattedQuantity = "";
                        if (quantity === 0.25) {
                          formattedQuantity = "1/4";
                        } else if (quantity === 0.5) {
                          formattedQuantity = "1/2";
                        } else if (quantity === 0.75) {
                          formattedQuantity = "3/4";
                        } else if (quantity === 1.25) {
                          formattedQuantity = "1 1/4";
                        } else if (quantity === 1.5) {
                          formattedQuantity = "1 1/2";
                        } else if (quantity === 1.75) {
                          formattedQuantity = "1 3/4";
                        } else if (quantity === 2.25) {
                          formattedQuantity = "2 1/4";
                        } else if (quantity === 2.5) {
                          formattedQuantity = "2 1/2";
                        } else if (quantity === 2.75) {
                          formattedQuantity = "2 3/4";
                        } else if (quantity % 1 === 0) {
                          formattedQuantity = quantity.toString();
                        } else {
                          formattedQuantity = quantity.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
                        }
                        
                        return <li key={index}>{formattedQuantity} {restOfText}</li>;
                      }
                      
                      // If we can't parse the quantity, just show the ingredient with a multiplier
                      if (servingsMultiplier === 1) {
                        return <li key={index}>{ingredient}</li>;
                      } else {
                        return <li key={index}>{servingsMultiplier}x {ingredient}</li>;
                      }
                    })}
                  </ul>
                  
                  {/* Adjusted Macros */}
                  <h5 className="font-medium text-blue-800 dark:text-blue-300 mt-3 mb-1">Adjusted Macros:</h5>
                  <div className="grid grid-cols-2 gap-2 text-blue-700 dark:text-blue-300">
                    <div><span className="font-medium">Calories:</span> {Math.round(meal.macros.calories * servingsMultiplier)}</div>
                    <div><span className="font-medium">Protein:</span> {(meal.macros.protein * servingsMultiplier).toFixed(1)}g</div>
                    <div><span className="font-medium">Carbs:</span> {(meal.macros.carbs * servingsMultiplier).toFixed(1)}g</div>
                    <div><span className="font-medium">Fat:</span> {(meal.macros.fat * servingsMultiplier).toFixed(1)}g</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
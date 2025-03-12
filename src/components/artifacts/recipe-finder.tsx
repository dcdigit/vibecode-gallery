import React, { useState, useEffect } from 'react';

const RecipeFinder = () => {
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  // Sample recipe database
  const recipeDatabase = [
    {
      id: 1,
      name: 'Pasta Carbonara',
      ingredients: ['pasta', 'eggs', 'bacon', 'parmesan cheese', 'black pepper', 'salt']
    },
    {
      id: 2,
      name: 'Chicken Stir Fry',
      ingredients: ['chicken', 'bell pepper', 'onion', 'broccoli', 'soy sauce', 'garlic', 'ginger', 'vegetable oil']
    },
    {
      id: 3,
      name: 'Vegetable Soup',
      ingredients: ['carrot', 'celery', 'onion', 'potato', 'tomato', 'vegetable broth', 'garlic', 'herbs']
    },
    {
      id: 4,
      name: 'Greek Salad',
      ingredients: ['cucumber', 'tomato', 'red onion', 'feta cheese', 'olives', 'olive oil', 'lemon juice', 'oregano']
    },
    {
      id: 5,
      name: 'Banana Smoothie',
      ingredients: ['banana', 'milk', 'yogurt', 'honey', 'cinnamon', 'ice']
    }
  ];
  
  // Add a new ingredient to the pantry
  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim().toLowerCase())) {
      setIngredients([...ingredients, newIngredient.trim().toLowerCase()]);
      setNewIngredient('');
    }
  };
  
  // Remove an ingredient from the pantry
  const removeIngredient = (ingredientToRemove) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToRemove));
  };
  
  // Find matching recipes based on ingredients in stock
  const findRecipes = () => {
    const matchedRecipes = recipeDatabase.map(recipe => {
      const missingIngredients = recipe.ingredients.filter(
        ingredient => !ingredients.includes(ingredient)
      );
      
      const matchPercentage = ((recipe.ingredients.length - missingIngredients.length) / recipe.ingredients.length) * 100;
      
      return {
        ...recipe,
        missingIngredients,
        matchPercentage: Math.round(matchPercentage)
      };
    });
    
    // Sort recipes by match percentage (highest first)
    return matchedRecipes.sort((a, b) => b.matchPercentage - a.matchPercentage);
  };
  
  // Update recipes whenever ingredients change
  useEffect(() => {
    setRecipes(findRecipes());
    setSelectedRecipe(null);
  }, [ingredients]);
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Recipe Finder</h1>
      
      {/* Pantry Section */}
      <div className="mb-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">My Pantry</h2>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
            placeholder="Add ingredient..."
            className="flex-grow p-2 border rounded-l"
          />
          <button
            onClick={addIngredient}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {ingredients.length > 0 ? (
            ingredients.map((ingredient, index) => (
              <div key={index} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
                <span>{ingredient}</span>
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="ml-2 text-red-500 font-bold"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No ingredients added yet. Add some ingredients to your pantry!</p>
          )}
        </div>
      </div>
      
      {/* Recipe Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipe List */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Matching Recipes</h2>
          
          {recipes.length > 0 ? (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-3 rounded cursor-pointer ${
                    selectedRecipe?.id === recipe.id ? 'bg-blue-200' : 'bg-white hover:bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{recipe.name}</h3>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        recipe.matchPercentage >= 80 ? 'bg-green-100 text-green-800' :
                        recipe.matchPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {recipe.matchPercentage}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No recipes found. Try adding more ingredients!</p>
          )}
        </div>
        
        {/* Recipe Details */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Recipe Details</h2>
          
          {selectedRecipe ? (
            <div>
              <h3 className="text-lg font-medium mb-2">{selectedRecipe.name}</h3>
              
              <div className="mb-4">
                <h4 className="font-medium">Ingredients:</h4>
                <ul className="list-disc pl-5">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className={ingredients.includes(ingredient) ? 'text-green-600' : 'text-red-600'}>
                      {ingredient}
                      {ingredients.includes(ingredient) ? ' (in stock)' : ' (need to buy)'}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Shopping List:</h4>
                {selectedRecipe.missingIngredients.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedRecipe.missingIngredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600">You have all ingredients for this recipe!</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Select a recipe to see details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeFinder;

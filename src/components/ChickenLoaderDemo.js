import React from 'react';
import { useChickenLoader } from '../hooks/useChickenLoader';

/**
 * Example component showing how to use the ChickenChaseLoader
 * You can integrate this pattern into any of your existing components
 */
export function ChickenLoaderDemo() {
  const { isLoading, withChickenLoader } = useChickenLoader();

  const simulateApiCall = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Data loaded successfully!");
      }, 3000); // 3 second fake loading
    });
  };

  const handleLoadData = async () => {
    try {
      await withChickenLoader(simulateApiCall, "Fetching delicious data...");
      console.log("Data loaded!");
    } catch (error) {
      console.error("Loading failed:", error);
    }
  };

  const handleLoadEvents = async () => {
    try {
      await withChickenLoader(
        () => new Promise(resolve => setTimeout(resolve, 2000)),
        "Loading upcoming events..."
      );
      console.log("Events loaded!");
    } catch (error) {
      console.error("Loading failed:", error);
    }
  };

  const handleSaveEvent = async () => {
    try {
      await withChickenLoader(
        () => new Promise(resolve => setTimeout(resolve, 1500)),
        "Saving your event..."
      );
      console.log("Event saved!");
    } catch (error) {
      console.error("Saving failed:", error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🐔 Chicken Chase Loader Demo</h2>
      <p className="text-gray-600 mb-6">
        Click any button below to see our hilarious chicken vs chef loading animation!
      </p>

      <div className="space-y-4">
        <button
          onClick={handleLoadData}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🍽️ Load Restaurant Data
        </button>

        <button
          onClick={handleLoadEvents}
          disabled={isLoading}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          📅 Load Events
        </button>

        <button
          onClick={handleSaveEvent}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💾 Save Event
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">💡 How to use in your components:</h3>
        <pre className="text-sm text-gray-600 overflow-x-auto">
{`// 1. Import the hook
import { useChickenLoader } from '../hooks/useChickenLoader';

// 2. Use in your component
const { isLoading, withChickenLoader } = useChickenLoader();

// 3. Wrap async operations
const handleSave = async () => {
  await withChickenLoader(saveToDatabase, "Saving...");
};

// 4. The main App.js will show the animation automatically!`}
        </pre>
      </div>
    </div>
  );
}

export default ChickenLoaderDemo;

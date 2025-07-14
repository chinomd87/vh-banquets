import React, { useState } from 'react';
import { ChickenChaseLoader } from './ChickenChaseLoader';

export function SimpleLoaderTest() {
  const [showLoader, setShowLoader] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chicken Loader Test</h1>
      
      <button 
        onClick={() => setShowLoader(!showLoader)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {showLoader ? 'Hide' : 'Show'} Chicken Loader
      </button>

      <div className="mt-4">
        <p>Loader visible: {showLoader ? 'YES' : 'NO'}</p>
      </div>

      {/* Basic animation test with Tailwind's built-in animations */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-2">Basic Animation Test</h2>
        <div className="relative w-64 h-16 bg-gray-100 border rounded">
          <div className="absolute top-4 w-8 h-8 bg-red-500 rounded-full animate-bounce"></div>
          <div className="absolute top-4 left-12 w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute top-4 left-24 w-8 h-8 bg-green-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Testing Tailwind built-in animations: bounce, pulse, spin
        </p>
      </div>

      {/* Test our custom CSS */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-2">Custom CSS Test</h2>
        <div className="relative w-96 h-20 bg-blue-50 border-2 border-blue-200 rounded overflow-hidden">
          <div className="absolute bottom-2 w-6 h-6 bg-orange-400 rounded-full chicken-runner"></div>
          <div className="absolute bottom-2 w-5 h-7 bg-gray-600 chef-chaser"></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Testing our custom chicken-runner and chef-chaser animations
        </p>
      </div>

      {/* Always render but control visibility */}
      <ChickenChaseLoader 
        isVisible={showLoader} 
        message="Testing the chicken chase animation!" 
      />
    </div>
  );
}

export default SimpleLoaderTest;

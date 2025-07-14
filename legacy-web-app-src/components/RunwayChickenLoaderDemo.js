import React, { useState } from 'react';
import { Upload, Play, Square, RotateCcw } from 'lucide-react';
import RunwayChickenLoader from './RunwayChickenLoader';
import SampleImages from './SampleImages';

/**
 * Demo component to showcase the Runway-powered chicken chase loader
 * Allows users to upload chef/chicken images and see the AI-generated loader
 */
export function RunwayChickenLoaderDemo() {
  const [chefImage, setChefImage] = useState(null);
  const [chickenImage, setChickenImage] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [chefImageUrl, setChefImageUrl] = useState(null);
  const [chickenImageUrl, setChickenImageUrl] = useState(null);

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const url = URL.createObjectURL(file);
      
      if (type === 'chef') {
        setChefImage(file);
        setChefImageUrl(url);
      } else {
        setChickenImage(file);
        setChickenImageUrl(url);
      }
    }
  };

  const startLoader = () => {
    if (!chefImageUrl && !chickenImageUrl) {
      alert('Please upload at least one image (chef or chicken) to generate the loader animation');
      return;
    }
    setShowLoader(true);
  };

  const stopLoader = () => {
    setShowLoader(false);
  };

  const resetImages = () => {
    setChefImage(null);
    setChickenImage(null);
    if (chefImageUrl) URL.revokeObjectURL(chefImageUrl);
    if (chickenImageUrl) URL.revokeObjectURL(chickenImageUrl);
    setChefImageUrl(null);
    setChickenImageUrl(null);
    setShowLoader(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🐔 Runway Chicken Chase Loader Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload images of a chef and/or chicken to create an AI-powered chase animation loader 
          using Runway ML's Gen-4 Turbo model. The loader will automatically generate a dynamic 
          video animation from your static images.
        </p>
      </div>

      {/* Image Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Chef Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">👨‍🍳 Chef Image</h3>
          
          {chefImageUrl ? (
            <div className="mb-4">
              <img 
                src={chefImageUrl} 
                alt="Chef" 
                className="w-full h-32 object-cover rounded-lg border border-gray-300"
              />
              <p className="text-sm text-gray-600 mt-2">{chefImage?.name}</p>
            </div>
          ) : (
            <div className="mb-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Upload a chef image</p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'chef')}
            className="hidden"
            id="chef-upload"
          />
          <label
            htmlFor="chef-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            {chefImageUrl ? 'Change Chef' : 'Upload Chef'}
          </label>
        </div>

        {/* Chicken Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">🐔 Chicken Image</h3>
          
          {chickenImageUrl ? (
            <div className="mb-4">
              <img 
                src={chickenImageUrl} 
                alt="Chicken" 
                className="w-full h-32 object-cover rounded-lg border border-gray-300"
              />
              <p className="text-sm text-gray-600 mt-2">{chickenImage?.name}</p>
            </div>
          ) : (
            <div className="mb-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Upload a chicken image</p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'chicken')}
            className="hidden"
            id="chicken-upload"
          />
          <label
            htmlFor="chicken-upload"
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            {chickenImageUrl ? 'Change Chicken' : 'Upload Chicken'}
          </label>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={startLoader}
          disabled={!chefImageUrl && !chickenImageUrl}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-5 h-5 mr-2" />
          Start AI Loader
        </button>

        <button
          onClick={stopLoader}
          disabled={!showLoader}
          className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop Loader
        </button>

        <button
          onClick={resetImages}
          className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset All
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">How It Works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Upload an image of a chef and/or chicken using the upload buttons above</li>
          <li>Click "Start AI Loader" to begin generating the chase animation</li>
          <li>Runway ML will create a dynamic video from your static image(s)</li>
          <li>The loader will show the AI-generated chase animation</li>
          <li>If video generation fails, it falls back to the CSS-based animation</li>
        </ol>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">💡 Tips for Best Results:</h3>
        <ul className="list-disc list-inside space-y-2 text-yellow-700">
          <li>Use clear, high-quality images with good lighting</li>
          <li>Images with subjects in motion or action poses work better</li>
          <li>Chef images should show the chef in a kitchen or cooking environment</li>
          <li>Chicken images work best when the chicken is clearly visible and in focus</li>
          <li>The AI will interpret the image and create appropriate chase movement</li>
        </ul>
      </div>

      {/* Sample Images Download */}
      <SampleImages />

      {/* Runway Chicken Loader */}
      <RunwayChickenLoader
        isVisible={showLoader}
        message="Generating your custom chase animation..."
        chefImageUrl={chefImageUrl}
        chickenImageUrl={chickenImageUrl}
        fallbackToCSS={true}
      />
    </div>
  );
}

export default RunwayChickenLoaderDemo;

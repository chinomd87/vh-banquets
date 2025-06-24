import React, { useState } from 'react';
import { Wand2, Play, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import useRunwayVideo from '../hooks/useRunwayVideo';
import toast from 'react-hot-toast';

/**
 * Simple Runway integration component that can be embedded anywhere
 * Ideal for adding AI video generation to existing workflows
 */
export function RunwayIntegration({ 
  onVideoGenerated, 
  className = '',
  preset = 'food',
  showPresets = true 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(preset);
  
  const { 
    generateVideo, 
    isGenerating, 
    generationProgress,
    isConfigured 
  } = useRunwayVideo();

  // Ensure isConfigured is a boolean value, not a Promise
  const configuredStatus = Boolean(isConfigured);

  const presets = {
    food: {
      name: 'Food Presentation',
      prompt: 'Professional food photography with steam rising and subtle movement. High-end restaurant quality.',
      duration: 5,
      ratio: '1280:720'
    },
    banquet: {
      name: 'Banquet Scene',
      prompt: 'Elegant banquet hall with soft lighting and gentle movement. Luxurious atmosphere.',
      duration: 5,
      ratio: '1280:720'
    },
    dessert: {
      name: 'Dessert Showcase',
      prompt: 'Beautiful dessert with sparkling effects and gentle rotation. Cinematic presentation.',
      duration: 4,
      ratio: '1280:720'
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    if (!configuredStatus) {
      toast.error('Runway API not configured');
      return;
    }

    try {
      const presetConfig = presets[selectedPreset];
      const videoBlob = await generateVideo(selectedFile, {
        textPrompt: presetConfig.prompt,
        duration: presetConfig.duration,
        ratio: presetConfig.ratio
      });

      const videoUrl = URL.createObjectURL(videoBlob);
      
      // Call parent callback with video data
      if (onVideoGenerated) {
        onVideoGenerated({
          blob: videoBlob,
          url: videoUrl,
          sourceImage: selectedFile,
          preset: selectedPreset
        });
      }

      toast.success('Video generated successfully!');
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(`Failed to generate video: ${error.message}`);
    }
  };

  const isProcessing = isGenerating;
  const progress = generationProgress;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Wand2 className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-medium text-gray-900">AI Video Generator</h3>
      </div>

      {!configuredStatus && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              Runway API not configured. Set REACT_APP_RUNWAY_API_TOKEN environment variable.
            </span>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-4">
        <div>
          <label htmlFor="runway-file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image
          </label>
          <div className="flex items-center space-x-4">
            <input
              id="runway-file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="mt-4">
            <img
              src={previewUrl}
              alt="Selected content for animation"
              className="max-w-full h-32 object-cover rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Preset Selection */}
        {showPresets && selectedFile && (
          <div>
            <label htmlFor="runway-preset-select" className="block text-sm font-medium text-gray-700 mb-2">
              Animation Style
            </label>
            <select
              id="runway-preset-select"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              disabled={isProcessing}
            >
              {Object.entries(presets).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedFile || !configuredStatus || isProcessing}
          className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Video
            </>
          )}
        </button>

        {/* Progress */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Generating</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

RunwayIntegration.propTypes = {
  onVideoGenerated: PropTypes.func,
  className: PropTypes.string,
  preset: PropTypes.oneOf(['food', 'banquet', 'dessert']),
  showPresets: PropTypes.bool
};

export default RunwayIntegration;

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Download, Wand2, Settings, AlertCircle } from 'lucide-react';
import runwayService from '../services/runwayService';
import toast from 'react-hot-toast';

export function RunwayVideoGenerator() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('food');
  const [presets, setPresets] = useState({});
  const [isConfigured, setIsConfigured] = useState(false);
  const [customOptions, setCustomOptions] = useState({
    textPrompt: '',
    duration: 5,
    ratio: '1280:720'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Load presets on component mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const loadedPresets = await runwayService.getAnimationPresets();
        setPresets(loadedPresets);
      } catch (error) {
        console.error('Failed to load presets:', error);
        // Use local presets as fallback
        setPresets(runwayService.getLocalAnimationPresets());
      }
    };
    loadPresets();
  }, []);

  // Check configuration status on component mount
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const configured = await runwayService.isConfigured();
        setIsConfigured(configured);
      } catch (error) {
        console.error('Error checking Runway configuration:', error);
        setIsConfigured(false);
      }
    };
    checkConfiguration();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clear previous video
      setGeneratedVideo(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    const configured = await runwayService.isConfigured();
    if (!configured) {
      toast.error('Runway backend not configured. Please check your backend server.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Prepare options for gen4_turbo model
      const preset = presets[selectedPreset];
      const options = {
        textPrompt: customOptions.textPrompt || preset?.textPrompt || 'Professional food presentation with subtle movement',
        duration: customOptions.duration || preset?.duration || 5,
        ratio: customOptions.ratio || preset?.ratio || '1280:720'
      };

      toast.loading('Generating video... This may take a few minutes.', { id: 'video-gen' });

      // Generate video
      const videoBlob = await runwayService.createVideoFromImage(selectedFile, options);
      
      // Create video URL
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideo({ blob: videoBlob, url: videoUrl });
      
      toast.success('Video generated successfully!', { id: 'video-gen' });
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(`Failed to generate video: ${error.message}`, { id: 'video-gen' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedVideo) {
      const link = document.createElement('a');
      link.href = generatedVideo.url;
      link.download = `runway-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Video downloaded!');
    }
  };

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    const preset = presets[presetKey];
    setCustomOptions(prev => ({
      ...prev,
      textPrompt: preset.textPrompt
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Wand2 className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Video Generator</h1>
        </div>
        <p className="text-gray-600">
          Transform your food and banquet images into stunning animated videos using Runway AI
        </p>
      </div>

      {/* Configuration Notice */}
      {!isConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">API Configuration Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                To use this feature, you need to set up your Runway API token. 
                Add <code className="bg-yellow-100 px-1 rounded">REACT_APP_RUNWAY_API_TOKEN</code> to your environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center space-y-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Upload Image</h3>
            <p className="text-gray-500">Select a food or banquet image to animate</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            disabled={isGenerating}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload image file"
          />
          <p className="text-xs text-gray-400">
            Supports JPG, PNG, WebP (max 10MB)
          </p>
        </div>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Source Image</h3>
          <div className="flex justify-center">
            <img
              src={previewUrl}
              alt="Food or banquet scene selected for animation"
              className="max-w-full max-h-64 rounded-lg shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Animation Presets */}
      {selectedFile && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Animation Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key)}
                className={`p-3 text-left rounded-lg border-2 transition-colors ${
                  selectedPreset === key
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {preset.textPrompt.split('.')[0]}...
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {selectedFile && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 mb-4"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Options</span>
          </button>
          
          {showAdvanced && (
            <div className="space-y-4">
              <div>
                <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Text Prompt
                </label>
                <textarea
                  id="custom-prompt"
                  value={customOptions.textPrompt}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, textPrompt: e.target.value }))}
                  placeholder="Describe how you want the image to be animated..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (seconds)
                  </label>
                  <select
                    id="duration-select"
                    value={customOptions.duration}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value={4}>4 seconds</option>
                    <option value={5}>5 seconds</option>
                    <option value={6}>6 seconds</option>
                    <option value={8}>8 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="ratio-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Video Ratio
                  </label>
                  <select
                    id="ratio-select"
                    value={customOptions.ratio}
                    onChange={(e) => setCustomOptions(prev => ({ ...prev, ratio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="1280:720">16:9 (Landscape)</option>
                    <option value="1920:1080">Full HD (1920x1080)</option>
                    <option value="720:1280">9:16 (Portrait)</option>
                    <option value="1024:1024">1:1 (Square)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      {selectedFile && (
        <div className="text-center">
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating || !isConfigured}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Generating Video...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Video */}
      {generatedVideo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Generated Video</h3>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
          <div className="flex justify-center">
            <video
              ref={videoRef}
              src={generatedVideo.url}
              controls
              className="max-w-full max-h-96 rounded-lg shadow-sm"
              autoPlay
              loop
              aria-label="Generated animated video from uploaded image"
            >
              <track kind="captions" srcLang="en" label="English captions" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunwayVideoGenerator;

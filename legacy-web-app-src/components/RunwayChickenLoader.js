import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import runwayService from '../services/runwayService';
import { ChickenChaseLoader } from './ChickenChaseLoader';

/**
 * Enhanced Chicken Chase Loader powered by Runway ML
 * Uses real chef and chicken images to create AI-generated chase animation
 */
export function RunwayChickenLoader({ 
  isVisible = true, 
  message = "Loading...",
  chefImageUrl = null,
  chickenImageUrl = null,
  fallbackToCSS = true 
}) {
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [useVideoLoader, setUseVideoLoader] = useState(false);
  const [isRunwayConfigured, setIsRunwayConfigured] = useState(false);
  const videoRef = useRef(null);
  const hasTriedGeneration = useRef(false);

  // Check Runway configuration on mount
  useEffect(() => {
    const checkConfiguration = async () => {
      const configured = await runwayService.isConfigured();
      setIsRunwayConfigured(configured);
    };
    checkConfiguration();
  }, []);

  // Generate chase animation when component mounts and images are available
  const generateChaseAnimation = useCallback(async () => {
    const configured = await runwayService.isConfigured();
    if (!configured) {
      console.warn('Runway not configured, falling back to CSS animation');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      // Use the primary image (chef or chicken, whichever is available)
      const primaryImageUrl = chefImageUrl || chickenImageUrl;
      
      // Create a file from the image URL
      const response = await fetch(primaryImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'chase-image.jpg', { type: blob.type });

      // Generate video with chase-specific prompt
      const videoBlob = await runwayService.createVideoFromImage(file, {
        textPrompt: chefImageUrl 
          ? "Professional chef running and chasing in a kitchen environment with dynamic movement and energy. Cartoon-style animation with motion blur and speed lines."
          : "Cartoon chicken running fast with wings flapping, comedic chase scene with motion blur and speed effects. Animated style.",
        duration: 5,
        ratio: '1280:720'
      });

      // Create video URL
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideo(videoUrl);
      setUseVideoLoader(true);

    } catch (error) {
      console.error('Failed to generate chase animation:', error);
      setVideoError(error.message);
      // Fall back to CSS animation
      setUseVideoLoader(false);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [chefImageUrl, chickenImageUrl]);

  useEffect(() => {
    if (isVisible && (chefImageUrl || chickenImageUrl) && !hasTriedGeneration.current && isRunwayConfigured) {
      hasTriedGeneration.current = true;
      generateChaseAnimation();
    }
  }, [isVisible, chefImageUrl, chickenImageUrl, generateChaseAnimation, isRunwayConfigured]);

  // Cleanup video URL when component unmounts
  useEffect(() => {
    return () => {
      if (generatedVideo) {
        URL.revokeObjectURL(generatedVideo);
      }
    };
  }, [generatedVideo]);

  if (!isVisible) return null;

  // Show CSS fallback loader during video generation or if video failed
  if (!useVideoLoader || isGeneratingVideo || videoError) {
    return (
      <ChickenChaseLoader 
        isVisible={isVisible} 
        message={isGeneratingVideo ? "Generating chase animation..." : message} 
      />
    );
  }

  // Show Runway-generated video loader
  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50">
      {/* Loading Message */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-600">
          {chefImageUrl ? "Our chef is chasing down the perfect ingredients!" : "AI-powered chase in progress!"}
        </p>
      </div>

      {/* AI-Generated Video Container */}
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {generatedVideo && (
          <video
            ref={videoRef}
            src={generatedVideo}
            autoPlay
            loop
            muted
            className="w-full h-auto max-h-96 object-cover"
            onError={(e) => {
              console.error('Video playback error:', e);
              setUseVideoLoader(false);
            }}
            style={{ aspectRatio: '16/9' }}
          />
        )}
        
        {/* Video overlay with branding */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          AI-Powered by Runway ML ✨
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-6 flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
        <span className="text-sm">Processing with AI...</span>
      </div>
    </div>
  );
}

RunwayChickenLoader.propTypes = {
  isVisible: PropTypes.bool,
  message: PropTypes.string,
  chefImageUrl: PropTypes.string,
  chickenImageUrl: PropTypes.string,
  fallbackToCSS: PropTypes.bool
};

export default RunwayChickenLoader;

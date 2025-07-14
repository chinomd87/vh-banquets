import { useState, useCallback, useEffect } from 'react';
import runwayService from '../services/runwayService';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing Runway video generation
 */
export function useRunwayVideo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check configuration status on mount
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

  const generateVideo = useCallback(async (imageFile, options = {}) => {
    const configured = await runwayService.isConfigured();
    if (!configured) {
      throw new Error('Runway backend not configured');
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      // Simulate progress during generation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 1000);

      // Generate video using the new streamlined API
      const videoBlob = await runwayService.createVideoFromImage(imageFile, options);

      // Complete progress
      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Clean up states
      setIsGenerating(false);
      setGenerationProgress(0);
      
      return videoBlob;
    } catch (error) {
      setIsGenerating(false);
      setCurrentTask(null);
      setGenerationProgress(0);
      throw error;
    }
  }, []);

  const cancelGeneration = useCallback(async () => {
    if (currentTask) {
      try {
        // Note: Runway SDK might not support cancellation
        // This is a placeholder for future implementation
        console.log('Attempting to cancel task:', currentTask.id);
        toast.info('Generation cancellation requested');
      } catch (error) {
        console.error('Error cancelling task:', error);
      }
    }
    
    setIsGenerating(false);
    setCurrentTask(null);
    setGenerationProgress(0);
  }, [currentTask]);

  return {
    generateVideo,
    cancelGeneration,
    isGenerating,
    generationProgress,
    currentTask,
    isConfigured
  };
}

export default useRunwayVideo;

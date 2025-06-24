import { useState } from 'react';

/**
 * Custom hook for managing the chicken chase loader
 * @param {number} minimumDuration - Minimum time to show loader (in ms)
 * @returns {Object} - Loading state and control functions
 */
export function useChickenLoader(minimumDuration = 1000) {
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const startLoading = (message = "Loading...") => {
    setIsLoading(true);
    setStartTime(Date.now());
    return message;
  };

  const stopLoading = () => {
    if (!startTime) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minimumDuration - elapsed);

    setTimeout(() => {
      setIsLoading(false);
      setStartTime(null);
    }, remaining);
  };

  const withChickenLoader = async (asyncFunction, loadingMessage = "Loading...") => {
    try {
      startLoading(loadingMessage);
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    withChickenLoader
  };
}

export default useChickenLoader;

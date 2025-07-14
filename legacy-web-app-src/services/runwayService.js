// Runway API service for VH Banquets
// cSpell:ignore runwayml
// Uses backend API to securely interact with Runway ML

class RunwayService {
  constructor() {
    // Backend API base URL
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.isInitialized = true; // Always true since we use backend
  }

  /**
   * Check if Runway backend is properly configured
   */
  async isConfigured() {
    try {
      const response = await fetch(`${this.apiUrl}/api/health`);
      const data = await response.json();
      return data.status === 'ok' && data.runway === true;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Upload an image file and convert to data URI
   * @param {File} file - The image file to upload
   * @returns {Promise<string>} - The data URI string
   */
  async uploadImage(file) {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('Runway backend not configured. Please check your backend server.');
    }

    try {
      const imageBuffer = await this.fileToBuffer(file);
      const base64String = this.arrayBufferToBase64(imageBuffer);
      const mimeType = file.type || 'image/png';
      const dataUri = `data:${mimeType};base64,${base64String}`;
      return dataUri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Generate video from image using Runway's imageToVideo API via backend
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - The generation result
   */
  async generateVideoFromImage(options) {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('Runway backend not configured');
    }

    const {
      sourceImageDataUri,
      textPrompt = 'Professional food presentation with subtle movement',
      duration = 5,
      ratio = '1280:720'
    } = options;

    try {
      console.log('Starting video generation via backend...');
      
      const response = await fetch(`${this.apiUrl}/api/runway/generate-video-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: sourceImageDataUri,
          textPrompt,
          duration,
          ratio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Video generation completed successfully');
      
      return {
        output: {
          url: result.videoUrl
        },
        id: result.taskId,
        status: result.status,
        success: result.success
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  /**
   * Generate video from image file using file upload endpoint (more efficient for large images)
   * @param {File} imageFile - The image file
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - The generation result
   */
  async generateVideoFromImageFile(imageFile, options = {}) {
    const configured = await this.isConfigured();
    if (!configured) {
      throw new Error('Runway backend not configured');
    }

    const {
      textPrompt = 'Professional food presentation with subtle movement',
      duration = 5,
      ratio = '1280:720'
    } = options;

    try {
      console.log('Starting video generation via backend (file upload)...');
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('textPrompt', textPrompt);
      formData.append('duration', duration.toString());
      formData.append('ratio', ratio);

      const response = await fetch(`${this.apiUrl}/api/runway/generate-video`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Video generation completed successfully');
      
      return {
        output: {
          url: result.videoUrl
        },
        id: result.taskId,
        status: result.status,
        success: result.success
      };
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  /**
   * Download the generated video from the task result
   * @param {Object} result - The completed task result
   * @returns {Promise<Blob>} - The video blob
   */
  async downloadVideo(result) {
    try {
      if (!result.output?.url) {
        throw new Error('No video URL found in result');
      }

      const response = await fetch(result.output.url);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const videoBlob = await response.blob();
      return videoBlob;
    } catch (error) {
      console.error('Error downloading video:', error);
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * Complete workflow: Process image and generate video using backend API
   * @param {File} imageFile - The source image file
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - The generated video blob
   */
  async createVideoFromImage(imageFile, options = {}) {
    try {
      console.log('Starting complete video creation workflow...');

      // Generate video using file upload (more efficient than base64 for large images)
      console.log('Generating video...');
      const result = await this.generateVideoFromImageFile(imageFile, options);

      // Download video
      console.log('Downloading video...');
      const videoBlob = await this.downloadVideo(result);

      return videoBlob;
    } catch (error) {
      console.error('Error in complete video creation workflow:', error);
      throw error;
    }
  }

  /**
   * Convert File to Buffer (for browser environment)
   * @param {File} file - The file to convert
   * @returns {Promise<ArrayBuffer>} - The file buffer
   */
  async fileToBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Convert ArrayBuffer to base64 string
   * @param {ArrayBuffer} buffer - The buffer to convert
   * @returns {string} - The base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get predefined animation presets from backend API
   * Falls back to local presets if backend is unavailable
   */
  async getAnimationPresets() {
    try {
      const response = await fetch(`${this.apiUrl}/api/runway/presets`);
      if (response.ok) {
        const presets = await response.json();
        return presets;
      }
    } catch (error) {
      console.warn('Failed to fetch presets from backend, using local presets:', error);
    }

    // Fallback to local presets
    return this.getLocalAnimationPresets();
  }

  /**
   * Get predefined animation presets for different types of food/banquet content
   * Updated for gen4_turbo model
   */
  getLocalAnimationPresets() {
    return {
      food: {
        name: 'Food Presentation',
        textPrompt: 'Professional food photography with steam rising and subtle ingredient movement. High-end restaurant quality with cinematic lighting.',
        duration: 5,
        ratio: '1280:720'
      },
      banquet: {
        name: 'Banquet Hall',
        textPrompt: 'Elegant banquet hall with soft lighting changes and gentle fabric movement. Luxurious atmosphere with warm ambient lighting.',
        duration: 5,
        ratio: '1280:720'
      },
      dessert: {
        name: 'Dessert Showcase',
        textPrompt: 'Beautiful dessert with sparkling effects and gentle rotation. Cinematic food photography with dramatic lighting.',
        duration: 5,
        ratio: '1280:720'
      },
      chef: {
        name: 'Chef at Work',
        textPrompt: 'Professional chef in action with natural movement and kitchen atmosphere. Dynamic cooking scene with professional lighting.',
        duration: 5,
        ratio: '1280:720'
      },
      table: {
        name: 'Table Setting',
        textPrompt: 'Elegant table setting with soft candlelight flickering and gentle fabric movement. Sophisticated dining atmosphere.',
        duration: 5,
        ratio: '1280:720'
      },
      widescreen: {
        name: 'Widescreen Cinematic',
        textPrompt: 'Cinematic food presentation with dramatic lighting and subtle movement. Professional restaurant photography.',
        duration: 5,
        ratio: '1920:1080'
      },
      portrait: {
        name: 'Portrait Style',
        textPrompt: 'Portrait-oriented food photography with elegant presentation and subtle animation.',
        duration: 5,
        ratio: '720:1280'
      }
    };
  }
}

// Create and export a singleton instance
const runwayService = new RunwayService();
export default runwayService;

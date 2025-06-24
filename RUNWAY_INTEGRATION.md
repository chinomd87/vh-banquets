# Runway AI Integration Guide

This guide explains how to set up and use the Runway AI video generation features in VH Banquets.

## 🚀 Latest Update: Backend API Integration

**New in this version:**

- **Secure Backend**: Runway ML SDK now runs on a secure backend server to protect API credentials
- **File Upload Support**: Efficient image processing through direct file uploads or base64 encoding
- **Gen-4 Turbo Model**: Using Runway's latest and fastest image-to-video model
- **Improved Security**: API tokens are never exposed to the browser
- **CORS Support**: Proper cross-origin resource sharing for frontend-backend communication
- **Error Handling**: Comprehensive error handling and logging

## Architecture

The Runway integration now uses a two-tier architecture:

1. **Frontend (React)**: User interface for image upload and video display
2. **Backend (Express.js)**: Secure API server that communicates with Runway ML

This ensures your Runway API credentials remain secure and are never exposed to the browser.

## Setup

### 1. Get Runway API Access

1. Visit [Runway ML](https://runwayml.com/)
2. Create an account or sign in
3. Go to your account settings
4. Navigate to API Keys section
5. Generate a new API token

### 2. Configure Backend Environment

1. Navigate to the `api` directory
2. Create a `.env` file with your Runway API token:

   ```bash
   # api/.env
   RUNWAY_API_TOKEN=your_actual_runway_api_token_here
   PORT=3001
   NODE_ENV=development
   ```

### 3. Configure Frontend Environment

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Add your backend API URL:

   ```bash
   # .env.local
   REACT_APP_API_URL=http://localhost:3001
   ```

### 4. Start the Servers

1. **Start the backend server** (from the `api` directory):

   ```bash
   cd api
   npm install
   npm start
   ```

   The backend will run on `http://localhost:3001`

2. **Start the frontend server** (from the root directory):

   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

   ```bash
   npm start
   ```

## Usage

### Full Video Generator

Navigate to "AI Video" in the main navigation to access the full-featured video generator:

1. **Upload Image**: Select a high-quality image (JPG, PNG, WebP up to 10MB)
2. **Choose Style**: Select from predefined animation presets:
   - **Food Presentation**: Steam rising, subtle ingredient movement
   - **Banquet Scene**: Soft lighting changes, gentle fabric movement
   - **Dessert Showcase**: Sparkling effects, gentle rotation
   - **Chef at Work**: Natural movement, kitchen atmosphere
   - **Table Setting**: Candlelight flickering, fabric movement

3. **Advanced Options** (optional):
   - Custom text prompts
   - Motion strength (0-1)
   - Duration (2-8 seconds)

4. **Generate**: Click to start the AI video generation process
5. **Download**: Save the generated MP4 video

### Embedded Integration

You can also embed the `RunwayIntegration` component anywhere in your app:

```jsx
import RunwayIntegration from './components/RunwayIntegration';

function MyComponent() {
  const handleVideoGenerated = (videoData) => {
    console.log('Video generated:', videoData);
    // Handle the generated video
  };

  return (
    <RunwayIntegration
      onVideoGenerated={handleVideoGenerated}
      preset="food"
      showPresets={true}
    />
  );
}
```

## API Reference

### Backend API Endpoints

The backend provides secure API endpoints for Runway ML integration:

#### Health Check

```http
GET /api/health
```

Returns server status and Runway API configuration.

#### Generate Video from File Upload

```http
POST /api/runway/generate-video
Content-Type: multipart/form-data

Body:
- image: File (image file)
- textPrompt: String (optional, animation prompt)
- duration: Number (optional, 2-10 seconds, default: 5)
- ratio: String (optional, '1280:720', '1920:1080', etc.)
```

#### Generate Video from Base64

```http
POST /api/runway/generate-video-base64
Content-Type: application/json

Body:
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "textPrompt": "Professional food animation",
  "duration": 5,
  "ratio": "1280:720"
}
```

#### Get Animation Presets

```http
GET /api/runway/presets
```

Returns available animation presets.

### Frontend RunwayService

The main service class for interacting with the backend API:

```javascript
import runwayService from './services/runwayService';

// Check if backend is configured
const isReady = await runwayService.isConfigured();

// Upload image and get data URI
const dataUri = await runwayService.uploadImage(imageFile);

// Generate video from image file (recommended)
const result = await runwayService.generateVideoFromImageFile(imageFile, {
  textPrompt: 'Professional food animation',
  duration: 5,
  ratio: '1280:720'
});

// Generate video from data URI
const result = await runwayService.generateVideoFromImage({
  sourceImageDataUri: dataUri,
  textPrompt: 'Your animation description',
  duration: 5,
  ratio: '1280:720'
});

// Complete workflow: upload, generate, and download
const videoBlob = await runwayService.createVideoFromImage(imageFile, options);

// Get animation presets
const presets = await runwayService.getAnimationPresets();
```

### useRunwayVideo Hook

React hook for managing video generation state:

```javascript
import useRunwayVideo from './hooks/useRunwayVideo';

function MyComponent() {
  const {
    generateVideo,
    isUploading,
    isGenerating,
    uploadProgress,
    generationProgress,
    isConfigured
  } = useRunwayVideo();

  const handleGenerate = async () => {
    const videoBlob = await generateVideo(imageFile, options);
    // Handle generated video
  };
}
```

## Animation Presets

### Food Presentation

- **Best for**: Individual dishes, ingredients, plated food
- **Motion**: Steam effects, subtle movement, ingredient highlights
- **Strength**: 0.3 (subtle)
- **Camera**: Slow zoom in

### Banquet Scene

- **Best for**: Event halls, table setups, venue shots
- **Motion**: Lighting changes, fabric movement, atmospheric effects
- **Strength**: 0.4 (moderate)
- **Camera**: Gentle pan right

### Dessert Showcase

- **Best for**: Cakes, pastries, sweet presentations
- **Motion**: Sparkling effects, gentle rotation, elegant movement
- **Strength**: 0.5 (moderate-high)
- **Camera**: Subtle orbit

### Chef at Work

- **Best for**: Kitchen scenes, chef portraits, cooking action
- **Motion**: Natural human movement, kitchen atmosphere
- **Strength**: 0.6 (high)
- **Camera**: None (focus on subject movement)

### Table Setting

- **Best for**: Place settings, dining arrangements, elegant setups
- **Motion**: Candlelight flicker, soft fabric movement
- **Strength**: 0.2 (very subtle)
- **Camera**: Gentle pan left

## Best Practices

### Image Quality

- Use high-resolution images (1920x1080 or higher)
- Ensure good lighting and contrast
- Avoid overly busy or cluttered compositions
- Focus on key elements you want animated

### Text Prompts

- Be specific about the type of movement you want
- Include lighting and atmosphere descriptions
- Mention camera movement if desired
- Keep prompts under 200 characters for best results

### Motion Strength

- **0.1-0.3**: Very subtle, professional, elegant
- **0.4-0.6**: Moderate movement, noticeable but not distracting
- **0.7-1.0**: High movement, dramatic effects

### Duration

- **2-4 seconds**: Perfect for social media, web use
- **4-6 seconds**: Good for presentations, longer viewing
- **6-10 seconds**: Detailed animations, showcase pieces

## Troubleshooting

### "Runway API not configured" Error

- Check that `REACT_APP_RUNWAY_API_TOKEN` is set in your `.env.local` file
- Verify the token is valid and has sufficient credits
- Restart your development server after setting environment variables

### "Failed to upload image" Error

- Check image file size (must be under 10MB)
- Verify image format (JPG, PNG, WebP supported)
- Ensure stable internet connection

### "Generation failed" Error

- Check your Runway account credits/billing
- Try reducing motion strength or duration
- Simplify your text prompt
- Try a different image

### Slow Generation Times

- Runway processing typically takes 1-3 minutes
- Complex prompts may take longer
- High motion strength increases processing time
- Peak usage times may be slower

## Integration Examples

### Event Form Integration

Add video generation to event planning:

```jsx
<RunwayIntegration
  preset="banquet"
  onVideoGenerated={(video) => {
    // Add to event media gallery
    addEventMedia(video);
  }}
/>
```

### Client Portal Integration

Let clients generate videos of their events:

```jsx
<RunwayIntegration
  preset="food"
  showPresets={false}
  onVideoGenerated={(video) => {
    // Save to client's media library
    saveClientVideo(video);
  }}
/>
```

### Marketing Dashboard

Bulk generate marketing content:

```jsx
{images.map(image => (
  <RunwayIntegration
    key={image.id}
    preset="food"
    onVideoGenerated={(video) => {
      updateMarketingAssets(image.id, video);
    }}
  />
))}
```

## Pricing Considerations

- Runway charges per second of generated video
- Monitor usage through your Runway dashboard
- Consider implementing usage limits for users
- Cache generated videos to avoid regeneration costs

## Next Steps

1. Set up your Runway API token
2. Test with sample images
3. Integrate into your existing workflows
4. Train your team on best practices
5. Monitor usage and costs

For more advanced features and customization, refer to the [Runway ML documentation](https://docs.runwayml.com/).

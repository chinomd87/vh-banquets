const fetch = require('node-fetch');
const FormData = require('form-data');

// Create a simple test image
const { createCanvas } = require('canvas');

async function testImageProcessing() {
  console.log('Testing image processing...');
  
  try {
    // Create a simple test image
    const canvas = createCanvas(400, 300);
    const ctx = canvas.getContext('2d');
    
    // Draw a simple test image
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 300);
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(100, 100, 200, 100);
    
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText('Test Image', 150, 160);
    
    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');
    console.log('Created test image, size:', buffer.length, 'bytes');
    
    // Test the API
    const formData = new FormData();
    formData.append('image', buffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('textPrompt', 'Test animation with movement');
    formData.append('duration', '5');
    
    console.log('Sending request to API...');
    const response = await fetch('http://localhost:3001/api/runway/generate-video', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, error);
      return;
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testImageProcessing();

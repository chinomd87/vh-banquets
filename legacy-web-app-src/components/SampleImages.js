import React from 'react';

/**
 * Sample images component that provides downloadable test images
 * for the Runway Chicken Loader Demo
 */
export function SampleImages() {
  const downloadSampleImage = (type) => {
    // Create a canvas to generate sample images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 300;

    if (type === 'chef') {
      // Draw a simple chef representation
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 300);
      
      // Background (kitchen)
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 400, 200);
      
      // Chef hat
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 50, 100, 60);
      ctx.fillRect(140, 100, 120, 20);
      
      // Chef face
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(200, 140, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // Chef body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(170, 160, 60, 80);
      
      // Arms
      ctx.fillRect(130, 180, 40, 15);
      ctx.fillRect(230, 180, 40, 15);
      
      // Add text
      ctx.fillStyle = '#000000';
      ctx.font = '20px Arial';
      ctx.fillText('Sample Chef', 130, 280);
      
    } else if (type === 'chicken') {
      // Draw a simple chicken representation
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, 400, 300);
      
      // Chicken body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(200, 180, 50, 40, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Chicken head
      ctx.beginPath();
      ctx.arc(200, 120, 25, 0, 2 * Math.PI);
      ctx.fill();
      
      // Beak
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.moveTo(220, 120);
      ctx.lineTo(235, 120);
      ctx.lineTo(227, 125);
      ctx.closePath();
      ctx.fill();
      
      // Eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(210, 115, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Legs
      ctx.fillStyle = '#ffa500';
      ctx.fillRect(185, 220, 8, 30);
      ctx.fillRect(207, 220, 8, 30);
      
      // Wings
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.ellipse(175, 170, 20, 15, -0.3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add text
      ctx.fillStyle = '#000000';
      ctx.font = '20px Arial';
      ctx.fillText('Sample Chicken', 120, 280);
    }

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sample-${type}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📥 Download Sample Images</h3>
      <p className="text-gray-600 mb-4">
        Don't have chef or chicken images? Download these sample images to test the AI loader:
      </p>
      
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => downloadSampleImage('chef')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          👨‍🍳 Download Sample Chef
        </button>
        
        <button
          onClick={() => downloadSampleImage('chicken')}
          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          🐔 Download Sample Chicken
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mt-3">
        💡 Tip: For best results, use real photos of chefs in action or chickens in motion!
      </p>
    </div>
  );
}

export default SampleImages;

import React, { useState } from 'react';
import { Wand2, Download } from 'lucide-react';
import RunwayIntegration from './RunwayIntegration';

/**
 * Demo page showcasing Runway AI video generation capabilities
 */
export function RunwayDemo() {
  const [generatedVideos, setGeneratedVideos] = useState([]);

  const handleVideoGenerated = (videoData) => {
    const newVideo = {
      id: Date.now(),
      ...videoData,
      timestamp: new Date().toLocaleString()
    };
    setGeneratedVideos(prev => [newVideo, ...prev]);
  };

  const handleDownload = (video) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `runway-video-${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Wand2 className="w-10 h-10 text-purple-600" />
          <h1 className="text-4xl font-bold text-gray-900">Runway AI Demo</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transform your banquet and food images into stunning animated videos using advanced AI technology
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Food Animation</h3>
          <p className="text-purple-700">Add steam, sparkles, and gentle movement to food photography</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Banquet Scenes</h3>
          <p className="text-blue-700">Bring event spaces to life with atmospheric lighting and movement</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Professional Quality</h3>
          <p className="text-green-700">Cinema-quality animations perfect for marketing and presentations</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Generator */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Generate Video</h2>
          <RunwayIntegration
            onVideoGenerated={handleVideoGenerated}
            showPresets={true}
            className="shadow-lg"
          />
        </div>

        {/* Generated Videos Gallery */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Generated Videos ({generatedVideos.length})
          </h2>
          
          {generatedVideos.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No videos generated yet</h3>
              <p className="text-gray-500">Upload an image and generate your first AI video!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {generatedVideos.map((video) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <video
                      src={video.url}
                      className="w-24 h-24 object-cover rounded-lg"
                      muted
                      loop
                      autoPlay
                    >
                      <track kind="captions" srcLang="en" label="English captions" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          Video {video.id}
                        </h4>
                        <button
                          onClick={() => handleDownload(video)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Style: {video.preset} • {video.timestamp}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Source: {video.sourceImage?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">💡 Pro Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
          <div>
            <strong>Best Image Types:</strong>
            <ul className="mt-1 space-y-1 text-purple-700">
              <li>• High-resolution food photography</li>
              <li>• Well-lit banquet hall scenes</li>
              <li>• Clean, uncluttered compositions</li>
            </ul>
          </div>
          <div>
            <strong>Animation Styles:</strong>
            <ul className="mt-1 space-y-1 text-purple-700">
              <li>• Food: Steam and ingredient movement</li>
              <li>• Banquet: Atmospheric lighting effects</li>
              <li>• Dessert: Sparkling and rotation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      {generatedVideos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{generatedVideos.length}</div>
              <div className="text-sm text-gray-500">Videos Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(generatedVideos.map(v => v.preset)).size}
              </div>
              <div className="text-sm text-gray-500">Styles Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {generatedVideos.filter(v => v.preset === 'food').length}
              </div>
              <div className="text-sm text-gray-500">Food Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {generatedVideos.filter(v => v.preset === 'banquet').length}
              </div>
              <div className="text-sm text-gray-500">Banquet Videos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunwayDemo;

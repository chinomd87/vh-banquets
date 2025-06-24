import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Brain, X, FileText, AlertCircle, CheckCircle, Users, Calendar } from 'lucide-react';
import { extractTextFromPDF, parseMessageForManagement, convertToEventFormData } from '../utils/pdfParser';

export function PDFAnalysisPanel({ file, onExtractedData, onClose }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzePDF = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Extract text from PDF
      const textContent = await extractTextFromPDF(file);
      
      // Parse the content
      const parsed = parseMessageForManagement(textContent);
      
      setAnalysisResult(parsed);
      
      // If this looks like a new event inquiry, offer to create event
      if (parsed.messageType === 'new_event_inquiry' && onExtractedData) {
        const eventFormData = convertToEventFormData(parsed);
        if (eventFormData) {
          onExtractedData(eventFormData);
        }
      }
      
    } catch (err) {
      console.error('PDF analysis error:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'new_event_inquiry':
        return <Calendar className="h-5 w-5 text-green-600" aria-hidden="true" />;
      case 'existing_event_update':
        return <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />;
      case 'general_contact':
        return <Users className="h-5 w-5 text-purple-600" aria-hidden="true" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" aria-hidden="true" />;
    }
  };

  const getMessageTypeLabel = (type) => {
    switch (type) {
      case 'new_event_inquiry':
        return 'New Event Inquiry';
      case 'existing_event_update':
        return 'Existing Event Update';
      case 'general_contact':
        return 'General Contact';
      default:
        return 'Unknown Message Type';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <dialog 
      open
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 border-0 p-0 max-w-none max-h-none w-full h-full"
      aria-labelledby="pdf-analysis-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4 p-0 border-0">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              <h2 id="pdf-analysis-title" className="text-xl font-semibold text-gray-800">PDF Analysis</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close PDF analysis panel"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* File Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Analyzing File:</h3>
            <p className="text-sm text-gray-600">{file.name}</p>
            <p className="text-xs text-gray-500">Size: {(file.size / 1024).toFixed(1)} KB</p>
          </div>

          {/* Analysis Button */}
          {!analysisResult && !isAnalyzing && (
            <div className="text-center">
              <button
                onClick={analyzePDF}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                <Brain className="h-5 w-5 inline mr-2" aria-hidden="true" />
                Analyze PDF Content
              </button>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <output className="text-center py-8 block" aria-live="polite" aria-describedby="analysis-status">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p id="analysis-status" className="text-gray-600">Analyzing PDF content...</p>
            </output>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                <h3 className="font-medium text-red-800">Analysis Error</h3>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Message Type & Confidence */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getMessageTypeIcon(analysisResult.messageType)}
                    <h3 className="font-medium text-gray-800">
                      {getMessageTypeLabel(analysisResult.messageType)}
                    </h3>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(analysisResult.confidence)}`}
                    aria-label={`Confidence level: ${analysisResult.confidence}`}
                  >
                    {analysisResult.confidence} confidence
                  </span>
                </div>
              </div>

              {/* Extracted Information */}
              {analysisResult.extractedData && Object.keys(analysisResult.extractedData).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                    Extracted Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analysisResult.extractedData).map(([key, value]) => (
                      value && (
                        <div key={key} className="space-y-1">
                          <dt className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </dt>
                          <dd className="text-sm text-gray-800">{value}</dd>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Text Preview */}
              {analysisResult.rawText && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">
                    Raw Text Preview
                  </summary>
                  <pre className="mt-3 text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {analysisResult.rawText.substring(0, 500)}
                    {analysisResult.rawText.length > 500 && '...'}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Close
                </button>
                {analysisResult.messageType === 'new_event_inquiry' && onExtractedData && (
                  <button
                    onClick={() => {
                      const eventFormData = convertToEventFormData(analysisResult);
                      if (eventFormData) {
                        onExtractedData(eventFormData);
                        onClose();
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Create Event from PDF
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

PDFAnalysisPanel.propTypes = {
  file: PropTypes.object.isRequired,
  onExtractedData: PropTypes.func,
  onClose: PropTypes.func.isRequired
};

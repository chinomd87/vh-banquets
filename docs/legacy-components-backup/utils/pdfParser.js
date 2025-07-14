import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Extracts text content from a PDF file
 * @param {File} pdfFile - The PDF file to parse
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(pdfFile) {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Parses a "Message for Management" PDF and extracts structured information
 * @param {string} textContent - Raw text extracted from PDF
 * @returns {Object} - Parsed information object
 */
export function parseMessageForManagement(textContent) {
  const parsed = {
    messageType: 'unknown',
    extractedData: {},
    confidence: 'low',
    suggestions: [],
    rawText: textContent
  };

  // Convert to lowercase for easier matching
  const lowerText = textContent.toLowerCase();

  // Detect message type
  if (lowerText.includes('new event') || lowerText.includes('event inquiry') || lowerText.includes('potential event')) {
    parsed.messageType = 'new_event_inquiry';
    parsed.extractedData = parseNewEventInquiry(textContent);
    parsed.confidence = 'high';
  } else if (lowerText.includes('existing event') || lowerText.includes('event update') || lowerText.includes('change request')) {
    parsed.messageType = 'existing_event_update';
    parsed.extractedData = parseExistingEventUpdate(textContent);
    parsed.confidence = 'high';
  } else if (lowerText.includes('contact') || lowerText.includes('message') || lowerText.includes('inquiry')) {
    parsed.messageType = 'general_contact';
    parsed.extractedData = parseGeneralContact(textContent);
    parsed.confidence = 'medium';
  }

  // Generate suggestions based on extracted data
  parsed.suggestions = generateSuggestions(parsed);

  return parsed;
}

/**
 * Parses new event inquiry information
 */
function parseNewEventInquiry(text) {
  const data = {};
  
  // Extract client information
  data.clientName = extractPattern(text, [
    /client\s*name\s*:?\s*([^\n\r]+)/i,
    /name\s*:?\s*([^\n\r]+)/i,
    /contact\s*person\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.clientEmail = extractPattern(text, [
    /email\s*:?\s*([^\s]+@[^\s]+)/i,
    /e-mail\s*:?\s*([^\s]+@[^\s]+)/i
  ]);
  
  data.clientPhone = extractPattern(text, [
    /phone\s*:?\s*([0-9\-()s.+]+)/i,
    /telephone\s*:?\s*([0-9\-()s.+]+)/i,
    /mobile\s*:?\s*([0-9\-()s.+]+)/i
  ]);
  
  // Extract event information
  data.eventName = extractPattern(text, [
    /event\s*name\s*:?\s*([^\n\r]+)/i,
    /event\s*title\s*:?\s*([^\n\r]+)/i,
    /occasion\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.eventType = extractPattern(text, [
    /event\s*type\s*:?\s*([^\n\r]+)/i,
    /type\s*of\s*event\s*:?\s*([^\n\r]+)/i,
    /celebration\s*type\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.eventDate = extractPattern(text, [
    /event\s*date\s*:?\s*([^\n\r]+)/i,
    /date\s*:?\s*([^\n\r]+)/i,
    /preferred\s*date\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.guestCount = extractPattern(text, [
    /guest\s*count\s*:?\s*(\d+)/i,
    /number\s*of\s*guests\s*:?\s*(\d+)/i,
    /attendees\s*:?\s*(\d+)/i,
    /people\s*:?\s*(\d+)/i
  ]);
  
  data.venue = extractPattern(text, [
    /venue\s*:?\s*([^\n\r]+)/i,
    /location\s*:?\s*([^\n\r]+)/i,
    /preferred\s*venue\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.budget = extractPattern(text, [
    /budget\s*:?\s*\$?([0-9,.]+)/i,
    /price\s*range\s*:?\s*\$?([0-9,.]+)/i,
    /estimated\s*cost\s*:?\s*\$?([0-9,.]+)/i
  ]);
  
  // Extract special requests or notes
  data.specialRequests = extractPattern(text, [
    /special\s*requests?\s*:?\s*([^\n\r]+)/i,
    /additional\s*notes?\s*:?\s*([^\n\r]+)/i,
    /comments?\s*:?\s*([^\n\r]+)/i
  ]);
  
  return data;
}

/**
 * Parses existing event update information
 */
function parseExistingEventUpdate(text) {
  const data = {};
  
  data.eventId = extractPattern(text, [
    /event\s*id\s*:?\s*([^\n\r]+)/i,
    /reference\s*number\s*:?\s*([^\n\r]+)/i,
    /event\s*reference\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.updateType = extractPattern(text, [
    /update\s*type\s*:?\s*([^\n\r]+)/i,
    /change\s*request\s*:?\s*([^\n\r]+)/i,
    /modification\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.changes = extractPattern(text, [
    /changes?\s*:?\s*([^\n\r]+)/i,
    /modifications?\s*:?\s*([^\n\r]+)/i,
    /updates?\s*:?\s*([^\n\r]+)/i
  ]);
  
  // Also extract client info in case it's provided
  data.clientName = extractPattern(text, [
    /client\s*name\s*:?\s*([^\n\r]+)/i,
    /name\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.contactInfo = extractPattern(text, [
    /contact\s*:?\s*([^\n\r]+)/i,
    /phone\s*:?\s*([^\n\r]+)/i,
    /email\s*:?\s*([^\n\r]+)/i
  ]);
  
  return data;
}

/**
 * Parses general contact information
 */
function parseGeneralContact(text) {
  const data = {};
  
  data.subject = extractPattern(text, [
    /subject\s*:?\s*([^\n\r]+)/i,
    /regarding\s*:?\s*([^\n\r]+)/i,
    /topic\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.contactName = extractPattern(text, [
    /name\s*:?\s*([^\n\r]+)/i,
    /from\s*:?\s*([^\n\r]+)/i,
    /sender\s*:?\s*([^\n\r]+)/i
  ]);
  
  data.contactEmail = extractPattern(text, [
    /email\s*:?\s*([^\s]+@[^\s]+)/i
  ]);
  
  data.contactPhone = extractPattern(text, [
    /phone\s*:?\s*([0-9\-()s.+]+)/i
  ]);
  
  data.message = extractPattern(text, [
    /message\s*:?\s*([^\n\r]+(?:\n[^\n\r]+)*)/i,
    /inquiry\s*:?\s*([^\n\r]+(?:\n[^\n\r]+)*)/i,
    /question\s*:?\s*([^\n\r]+(?:\n[^\n\r]+)*)/i
  ]);
  
  return data;
}

/**
 * Extracts text using multiple regex patterns
 */
function extractPattern(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Generates actionable suggestions based on parsed data
 */
function generateSuggestions(parsed) {
  const suggestions = [];
  
  if (parsed.messageType === 'new_event_inquiry') {
    const data = parsed.extractedData;
    
    if (data.clientName && data.clientEmail) {
      suggestions.push({
        type: 'create_client',
        title: 'Create New Client Record',
        description: `Create a client record for ${data.clientName}`,
        action: 'create_client',
        data: {
          name: data.clientName,
          email: data.clientEmail,
          phone: data.clientPhone
        }
      });
    }
    
    if (data.eventName && data.eventDate) {
      suggestions.push({
        type: 'create_event',
        title: 'Create New Event',
        description: `Create event "${data.eventName}" for ${data.eventDate}`,
        action: 'create_event',
        data: {
          eventName: data.eventName,
          eventDate: data.eventDate,
          eventType: data.eventType,
          guestCount: data.guestCount,
          venue: data.venue
        }
      });
    }
    
    if (data.clientEmail) {
      suggestions.push({
        type: 'send_response',
        title: 'Send Response Email',
        description: `Send initial response to ${data.clientEmail}`,
        action: 'compose_email',
        data: {
          to: data.clientEmail,
          subject: `Re: ${data.eventName || 'Event Inquiry'}`,
          type: 'initial_response'
        }
      });
    }
  }
  
  if (parsed.messageType === 'existing_event_update') {
    const data = parsed.extractedData;
    
    if (data.eventId) {
      suggestions.push({
        type: 'find_event',
        title: 'Locate Existing Event',
        description: `Find and update event: ${data.eventId}`,
        action: 'search_event',
        data: {
          searchQuery: data.eventId
        }
      });
    }
    
    if (data.changes) {
      suggestions.push({
        type: 'update_event',
        title: 'Update Event Details',
        description: `Apply changes: ${data.changes}`,
        action: 'update_event',
        data: {
          changes: data.changes
        }
      });
    }
  }
  
  return suggestions;
}

/**
 * Converts extracted data to EventForm-compatible format
 */
export function convertToEventFormData(parsedData) {
  if (parsedData.messageType !== 'new_event_inquiry') {
    return null;
  }
  
  const data = parsedData.extractedData;
  
  return {
    eventName: data.eventName || '',
    eventType: data.eventType || 'Other',
    eventDate: formatDateForInput(data.eventDate) || '',
    guestCount: parseInt(data.guestCount) || 50,
    venue: data.venue || '',
    clientInfo: {
      name: data.clientName || '',
      email: data.clientEmail || '',
      phone: data.clientPhone || '',
      company: ''
    },
    specialRequests: data.specialRequests || '',
    notes: `Automatically imported from PDF message.\n\nOriginal request: ${parsedData.rawText.substring(0, 500)}...`
  };
}

/**
 * Attempts to format date string for HTML date input
 */
function formatDateForInput(dateString) {
  if (!dateString) return '';
  
  try {
    // Try to parse various date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Failed to format date string:', dateString, error);
    return '';
  }
}

/**
 * Checks if a PDF file might be a "Message for Management"
 */
export function isMessageForManagementPDF(filename, textContent = '') {
  const filename_lower = filename.toLowerCase();
  const content_lower = textContent.toLowerCase();
  
  // Check filename patterns
  const filenamePatterns = [
    'message',
    'management',
    'inquiry',
    'request',
    'contact',
    'event_request',
    'new_event'
  ];
  
  const hasFilenameMatch = filenamePatterns.some(pattern => 
    filename_lower.includes(pattern)
  );
  
  // Check content patterns
  const contentPatterns = [
    'message for management',
    'event inquiry',
    'new event request',
    'contact form',
    'event information'
  ];
  
  const hasContentMatch = contentPatterns.some(pattern => 
    content_lower.includes(pattern)
  );
  
  return hasFilenameMatch || hasContentMatch;
}

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Calendar, Users, Clock, DollarSign, FileText, AlertCircle, CreditCard } from 'lucide-react';
import { useDb, useAuth } from '../contexts/AppContext';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import FileUploadArea from './FileUploadArea';
import { getEventFiles, updateEventIdForFiles } from '../utils/fileUpload';
import Shift4PaymentComponent from './Shift4PaymentComponent';
import PropTypes from 'prop-types';

// Event status options
const EVENT_STATUSES = [
  { value: 'inquiry', label: 'Inquiry', color: 'bg-gray-100 text-gray-800' },
  { value: 'quoted', label: 'Quoted', color: 'bg-blue-100 text-blue-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-800' }
];

// Event types
const EVENT_TYPES = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Anniversary',
  'Graduation',
  'Holiday Party',
  'Fundraiser',
  'Conference',
  'Other'
];

// Meal service types
const SERVICE_TYPES = [
  'Buffet',
  'Plated Service',
  'Family Style',
  'Cocktail Reception',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Brunch'
];

export function EventForm({ event, onBack, onSave }) {
  const db = useDb();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'Wedding',
    eventDate: '',
    eventTime: '',
    guestCount: 50,
    venue: '',
    serviceType: 'Plated Service',
    status: 'inquiry',
    
    // Client information
    clientInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
      company: ''
    },
    
    // Event details
    duration: 4,
    setupTime: '',
    specialRequests: '',
    dietaryRestrictions: '',
    
    // Pricing
    financials: {
      basePrice: 0,
      gratuity: 0,
      tax: 0,
      total: 0,
      deposit: 0,
      balance: 0,
      payments: []
    },
    
    // Menu will be handled separately
    menu: {},
    
    // Additional fields
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [eventFiles, setEventFiles] = useState([]);
  const [tempEventId] = useState(() => 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11));
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Initialize form data if editing existing event
  useEffect(() => {
    if (event) {
      setFormData(prevData => ({
        ...prevData,
        ...event,
        eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
        eventTime: event.eventTime || '',
        clientInfo: {
          name: '',
          email: '',
          phone: '',
          address: '',
          company: '',
          ...event.clientInfo
        },
        financials: {
          basePrice: 0,
          gratuity: 0,
          tax: 0,
          total: 0,
          deposit: 0,
          balance: 0,
          payments: [],
          ...event.financials
        }
      }));
    }
  }, [event]);

  // Handle PDF analysis results
  const handlePDFAnalyzed = (extractedData) => {
    if (extractedData) {
      // Merge extracted data with current form data
      setFormData(prevData => ({
        ...prevData,
        ...extractedData,
        clientInfo: {
          ...prevData.clientInfo,
          ...extractedData.clientInfo
        }
      }));
      
      toast.success('PDF information extracted and applied to form!');
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentData) => {
    // Add payment to the event's financials
    const updatedFinancials = {
      ...formData.financials,
      payments: [...formData.financials.payments, paymentData],
      balance: formData.financials.total - formData.financials.deposit - paymentData.amount
    };

    setFormData(prevData => ({
      ...prevData,
      financials: updatedFinancials
    }));

    setShowPaymentModal(false);
    toast.success('Payment processed successfully!');
  };

  // Handle payment error
  const handlePaymentError = (errorMessage) => {
    toast.error(`Payment failed: ${errorMessage}`);
  };

  // Load event files if editing existing event
  useEffect(() => {
    if (event?.id && db) {
      getEventFiles(event.id, db)
        .then(files => setEventFiles(files))
        .catch(error => console.error('Error loading event files:', error));
    }
  }, [event, db]);

  // Form validation - extracted to reduce complexity
  const validateForm = () => {
    const newErrors = {};

    // Basic event validation
    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    // Date validation
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    } else {
      const eventDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        newErrors.eventDate = 'Event date cannot be in the past';
      }
    }

    // Guest count validation
    if (!formData.guestCount || formData.guestCount < 1) {
      newErrors.guestCount = 'Guest count must be at least 1';
    }

    // Client validation
    validateClientInfo(newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Client validation helper - extracted to reduce complexity
  const validateClientInfo = (newErrors) => {
    if (!formData.clientInfo.name.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.clientInfo.email.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.clientInfo.email)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }

    if (!formData.clientInfo.phone.trim()) {
      newErrors.clientPhone = 'Client phone is required';
    }
  };

  // Handle form input changes - extracted to reduce complexity
  const handleInputChange = (field, value) => {
    if (field.startsWith('clientInfo.')) {
      handleClientInfoChange(field, value);
    } else if (field.startsWith('financials.')) {
      handleFinancialsChange(field, value);
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  // Client info change handler - extracted to reduce complexity
  const handleClientInfoChange = (field, value) => {
    const clientField = field.replace('clientInfo.', '');
    setFormData({
      ...formData,
      clientInfo: {
        ...formData.clientInfo,
        [clientField]: value
      }
    });
  };

  // Financials change handler - extracted to reduce complexity
  const handleFinancialsChange = (field, value) => {
    const financialField = field.replace('financials.', '');
    const updatedFinancials = {
      ...formData.financials,
      [financialField]: value
    };
    
    // Recalculate totals when base price changes
    if (financialField === 'basePrice') {
      updatedFinancials.total = value + updatedFinancials.gratuity + updatedFinancials.tax;
      updatedFinancials.balance = updatedFinancials.total - updatedFinancials.deposit;
    }
    
    setFormData({
      ...formData,
      financials: updatedFinancials
    });
  };

  // Handle form submission - extracted to reduce complexity
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!db || !user) {
      toast.error('Unable to save - please check your connection');
      return;
    }

    setIsSubmitting(true);

    try {
      await saveEventData();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save event data helper - extracted to reduce complexity
  const saveEventData = async () => {
    const appId = process.env.REACT_APP_VH_BANQUETS_APP_ID || "vh-banquets-app";
    const eventsCollection = collection(db, `artifacts/${appId}/users/${user.uid}/events`);
    
    const eventData = {
      ...formData,
      updatedAt: new Date().toISOString(),
      eventDate: formData.eventDate + 'T' + (formData.eventTime || '18:00'),
    };

    let eventId;

    if (event) {
      // Update existing event
      eventId = event.id;
      const eventDoc = doc(db, `artifacts/${appId}/users/${user.uid}/events`, event.id);
      await updateDoc(eventDoc, eventData);
      toast.success('Event updated successfully!');
    } else {
      // Create new event
      eventData.createdAt = new Date().toISOString();
      const docRef = await addDoc(eventsCollection, eventData);
      eventId = docRef.id;
      toast.success('Event created successfully!');
    }

    // Update files with the correct event ID if this was a new event
    await updateEventFiles(eventId);

    // Handle completion
    if (onSave) {
      onSave({ ...eventData, id: eventId });
    } else {
      onBack();
    }
  };

  // Update event files helper - extracted to reduce complexity
  const updateEventFiles = async (eventId) => {
    if (!event && eventFiles.length > 0 && eventId) {
      try {
        await updateEventIdForFiles(tempEventId, eventId, db);
      } catch (error) {
        console.error('Error updating file event IDs:', error);
        // Don't fail the entire operation if file update fails
      }
    }
  };

  // Calculate estimated pricing based on guest count
  const estimatedPricing = {
    perPerson: 35, // Base price per person
    total: formData.guestCount * 35,
    gratuity: (formData.guestCount * 35) * 0.18,
    tax: (formData.guestCount * 35) * 0.08,
  };
  estimatedPricing.grandTotal = estimatedPricing.total + estimatedPricing.gratuity + estimatedPricing.tax;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <EventFormHeader event={event} onBack={onBack} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Information Card */}
        <EventInformationSection 
          formData={formData} 
          errors={errors} 
          handleInputChange={handleInputChange} 
        />

        {/* Client Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Client Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                id="clientName"
                type="text"
                value={formData.clientInfo.name}
                onChange={(e) => handleInputChange('clientInfo.name', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.clientName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Full name"
                aria-required="true"
                aria-invalid={errors.clientName ? 'true' : 'false'}
                aria-describedby={errors.clientName ? 'clientName-error' : undefined}
              />
              {errors.clientName && (
                <p id="clientName-error" className="text-red-600 text-sm mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  {errors.clientName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                id="clientEmail"
                type="email"
                value={formData.clientInfo.email}
                onChange={(e) => handleInputChange('clientInfo.email', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.clientEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
                aria-required="true"
                aria-invalid={errors.clientEmail ? 'true' : 'false'}
                aria-describedby={errors.clientEmail ? 'clientEmail-error' : undefined}
              />
              {errors.clientEmail && (
                <p id="clientEmail-error" className="text-red-600 text-sm mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  {errors.clientEmail}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                id="clientPhone"
                type="tel"
                value={formData.clientInfo.phone}
                onChange={(e) => handleInputChange('clientInfo.phone', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.clientPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
                aria-required="true"
                aria-invalid={errors.clientPhone ? 'true' : 'false'}
                aria-describedby={errors.clientPhone ? 'clientPhone-error' : undefined}
              />
              {errors.clientPhone && (
                <p id="clientPhone-error" className="text-red-600 text-sm mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  {errors.clientPhone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="clientCompany" className="block text-sm font-medium text-gray-700 mb-1">
                Company (Optional)
              </label>
              <input
                id="clientCompany"
                type="text"
                value={formData.clientInfo.company}
                onChange={(e) => handleInputChange('clientInfo.company', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Company name"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="clientAddress"
                value={formData.clientInfo.address}
                onChange={(e) => handleInputChange('clientInfo.address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="2"
                placeholder="Street address, city, state, zip"
              />
            </div>
          </div>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Event Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0.5"
                max="12"
                step="0.5"
              />
            </div>

            <div>
              <label htmlFor="setupTime" className="block text-sm font-medium text-gray-700 mb-1">
                Setup Time
              </label>
              <input
                id="setupTime"
                type="time"
                value={formData.setupTime}
                onChange={(e) => handleInputChange('setupTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                placeholder="Any special requirements, decorations, music, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Restrictions
              </label>
              <textarea
                id="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="2"
                placeholder="Allergies, vegetarian, vegan, kosher, etc."
              />
            </div>
          </div>
        </div>

        {/* Files & Documents Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Files & Documents</h2>
          </div>
          
          <FileUploadArea
            eventId={event?.id || tempEventId}
            files={eventFiles}
            onFilesChange={setEventFiles}
            onPDFAnalyzed={handlePDFAnalyzed}
            disabled={isSubmitting}
          />
        </div>

        {/* Pricing Estimate Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Pricing Estimate</h2>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">Estimated Pricing</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Base Price</p>
                <p className="font-semibold">${estimatedPricing.total.toLocaleString()}</p>
                <p className="text-xs text-blue-500">${estimatedPricing.perPerson}/person</p>
              </div>
              <div>
                <p className="text-blue-600">Gratuity (18%)</p>
                <p className="font-semibold">${estimatedPricing.gratuity.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-600">Tax (8%)</p>
                <p className="font-semibold">${estimatedPricing.tax.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-600">Total</p>
                <p className="font-semibold text-lg">${estimatedPricing.grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Base Price
              </label>
              <input
                id="basePrice"
                type="number"
                value={formData.financials.basePrice}
                onChange={(e) => handleInputChange('financials.basePrice', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Amount
              </label>
              <input
                id="depositAmount"
                type="number"
                value={formData.financials.deposit}
                onChange={(e) => handleInputChange('financials.deposit', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="balanceDue" className="block text-sm font-medium text-gray-700 mb-1">
                Balance Due
              </label>
              <input
                id="balanceDue"
                type="number"
                value={formData.financials.balance}
                onChange={(e) => handleInputChange('financials.balance', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Payment Processing Card */}
        {event?.id && formData.financials.total > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="text-indigo-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">Payment Processing</h2>
            </div>
            
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Total Amount</p>
                    <p className="font-semibold">${formData.financials.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Paid Deposit</p>
                    <p className="font-semibold">${formData.financials.deposit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Balance Due</p>
                    <p className="font-semibold text-lg">${formData.financials.balance.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      disabled={formData.financials.balance <= 0}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <CreditCard size={16} />
                      Process Payment
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <PaymentHistorySection payments={formData.financials.payments} />
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal 
          showPaymentModal={showPaymentModal} 
          setShowPaymentModal={setShowPaymentModal} 
          formData={formData} 
          event={event} 
          tempEventId={tempEventId} 
          handlePaymentSuccess={handlePaymentSuccess} 
          handlePaymentError={handlePaymentError} 
        />

        {/* Additional Notes Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Additional Notes</h2>
          </div>
          
          <label htmlFor="notes" className="sr-only">Additional Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="4"
            placeholder="Internal notes, follow-up items, special considerations..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            <Save size={16} />
            {event ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

EventForm.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string,
    eventDate: PropTypes.string,
    eventTime: PropTypes.string,
    clientInfo: PropTypes.object,
    financials: PropTypes.object
  }),
  onBack: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

// Extracted form sections to reduce main component complexity
const EventInformationSection = ({ formData, errors, handleInputChange }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center gap-2 mb-4">
      <Calendar className="text-indigo-600" size={20} />
      <h2 className="text-lg font-semibold text-gray-800">Event Information</h2>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
          Event Name *
        </label>
        <input
          id="eventName"
          type="text"
          value={formData.eventName}
          onChange={(e) => handleInputChange('eventName', e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.eventName ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Smith Wedding Reception"
          aria-required="true"
          aria-invalid={errors.eventName ? 'true' : 'false'}
          aria-describedby={errors.eventName ? 'eventName-error' : undefined}
        />
        {errors.eventName && (
          <p id="eventName-error" className="text-red-600 text-sm mt-1 flex items-center gap-1" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errors.eventName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
          Event Type
        </label>
        <select
          id="eventType"
          value={formData.eventType}
          onChange={(e) => handleInputChange('eventType', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
          Event Date *
        </label>
        <input
          id="eventDate"
          type="date"
          value={formData.eventDate}
          onChange={(e) => handleInputChange('eventDate', e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.eventDate ? 'border-red-300' : 'border-gray-300'
          }`}
          min={new Date().toISOString().split('T')[0]}
          aria-required="true"
          aria-invalid={errors.eventDate ? 'true' : 'false'}
          aria-describedby={errors.eventDate ? 'eventDate-error' : undefined}
        />
        {errors.eventDate && (
          <p id="eventDate-error" className="text-red-600 text-sm mt-1 flex items-center gap-1" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errors.eventDate}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 mb-1">
          Event Time
        </label>
        <input
          id="eventTime"
          type="time"
          value={formData.eventTime}
          onChange={(e) => handleInputChange('eventTime', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700 mb-1">
          Guest Count *
        </label>
        <input
          id="guestCount"
          type="number"
          inputMode="numeric"
          value={formData.guestCount}
          onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value) || 0)}
          className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.guestCount ? 'border-red-300' : 'border-gray-300'
          }`}
          min="1"
          aria-required="true"
          aria-invalid={errors.guestCount ? 'true' : 'false'}
          aria-describedby={errors.guestCount ? 'guestCount-error' : undefined}
          max="500"
        />
        {errors.guestCount && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.guestCount}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
          Venue/Location
        </label>
        <input
          id="venue"
          type="text"
          value={formData.venue}
          onChange={(e) => handleInputChange('venue', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Garden Pavilion, Main Ballroom"
        />
      </div>

      <div>
        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
          Service Type
        </label>
        <select
          id="serviceType"
          value={formData.serviceType}
          onChange={(e) => handleInputChange('serviceType', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="eventStatus" className="block text-sm font-medium text-gray-700 mb-1">
          Event Status
        </label>
        <select
          id="eventStatus"
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {EVENT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

EventInformationSection.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired
};

// Helper components to reduce cognitive complexity
const EventFormHeader = ({ event, onBack }) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">
        {event ? 'Edit Event' : 'Create New Event'}
      </h1>
      <p className="text-gray-600">
        {event ? 'Update event details and client information' : 'Enter event details and client information'}
      </p>
    </div>
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-3 py-2"
      aria-label="Go back to previous page"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back
    </button>
  </div>
);

EventFormHeader.propTypes = {
  event: PropTypes.object,
  onBack: PropTypes.func.isRequired
};

const PaymentHistorySection = ({ payments }) => {
  if (!payments || payments.length === 0) return null;
  
  return (
    <div className="border-t pt-4">
      <h3 className="font-medium text-gray-800 mb-2">Payment History</h3>
      <div className="space-y-2">
        {payments.map((payment) => (
          <div key={payment.id || payment.chargeId || payment.date} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div>
              <p className="font-medium">${payment.amount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{payment.method}</p>
              <p className="text-sm text-green-600">{payment.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

PaymentHistorySection.propTypes = {
  payments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    chargeId: PropTypes.string,
    date: PropTypes.string,
    amount: PropTypes.number,
    method: PropTypes.string,
    status: PropTypes.string
  }))
};

const PaymentModal = ({ 
  showPaymentModal, 
  setShowPaymentModal, 
  formData, 
  event, 
  tempEventId, 
  handlePaymentSuccess, 
  handlePaymentError 
}) => {
  if (!showPaymentModal) return null;
  
  return (
    <dialog 
      open
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 w-full h-full border-0 p-0"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 id="payment-modal-title" className="text-lg font-semibold">Process Payment</h3>
          <button
            onClick={() => setShowPaymentModal(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close payment modal"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        
        <Shift4PaymentComponent
          amount={formData.financials.balance}
          eventId={event?.id || tempEventId}
          eventName={formData.eventName}
          clientEmail={formData.clientInfo.email}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          isTestMode={true}
        />
      </div>
    </dialog>
  );
};

PaymentModal.propTypes = {
  showPaymentModal: PropTypes.bool.isRequired,
  setShowPaymentModal: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    eventName: PropTypes.string,
    financials: PropTypes.shape({
      balance: PropTypes.number
    }),
    clientInfo: PropTypes.shape({
      email: PropTypes.string
    })
  }).isRequired,
  event: PropTypes.object,
  tempEventId: PropTypes.string.isRequired,
  handlePaymentSuccess: PropTypes.func.isRequired,
  handlePaymentError: PropTypes.func.isRequired
};

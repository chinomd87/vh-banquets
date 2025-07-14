import React from 'react';
import PropTypes from 'prop-types';
import { useData } from '../contexts/AppContext';
import { calculateFinancials } from '../utils/financials';

export const EventDetail = ({ event, onBack, navigateTo, onUpdate }) => {
  const { deleteEvent } = useData();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEvent(event.id);
        onBack();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate financials for display
  const financials = calculateFinancials({
    guestCount: event.guestCount || 0,
    venuePackage: event.venuePackage,
    menuSelections: event.menuSelections || {},
    additionalServices: event.additionalServices || []
  });

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Event not found</p>
        <button onClick={onBack} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{event.title || 'Untitled Event'}</h1>
          <p className="text-gray-600 mt-1">{formatDate(event.date)}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigateTo('editEvent', event)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Edit Event
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-600">Date</div>
                <p className="text-gray-800">{formatDate(event.date)}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-600">Time</div>
                <p className="text-gray-800">
                  {event.startTime && event.endTime 
                    ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                    : 'Time not set'
                  }
                </p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-600">Guest Count</div>
                <p className="text-gray-800">{event.guestCount || 0} guests</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-600">Event Type</div>
                <p className="text-gray-800">{event.eventType || 'Not specified'}</p>
              </div>
            </div>
            {event.notes && (
              <div className="mt-4">
                <div className="block text-sm font-medium text-gray-600">Notes</div>
                <p className="text-gray-800 mt-1">{event.notes}</p>
              </div>
            )}
          </div>

          {/* Client Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="block text-sm font-medium text-gray-600">Name</div>
                <p className="text-gray-800">{event.clientName || 'Not provided'}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-600">Email</div>
                <p className="text-gray-800">{event.clientEmail || 'Not provided'}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-600">Phone</div>
                <p className="text-gray-800">{event.clientPhone || 'Not provided'}</p>
              </div>
              <div>
                <div className="block text-sm font-medium text-gray-600">Company</div>
                <p className="text-gray-800">{event.clientCompany || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Menu & Services */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Menu & Services</h2>
            
            {event.venuePackage && (
              <div className="mb-4">
                <div className="block text-sm font-medium text-gray-600">Venue Package</div>
                <p className="text-gray-800">{event.venuePackage}</p>
              </div>
            )}

            {event.menuSelections && Object.keys(event.menuSelections).length > 0 && (
              <div className="mb-4">
                <div className="block text-sm font-medium text-gray-600">Menu Selections</div>
                <div className="mt-2 space-y-2">
                  {Object.entries(event.menuSelections).map(([category, items]) => (
                    items.length > 0 && (
                      <div key={category}>
                        <span className="font-medium text-gray-700">
                          {category.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-gray-600 ml-2">{items.length} items selected</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {event.additionalServices && event.additionalServices.length > 0 && (
              <div>
                <div className="block text-sm font-medium text-gray-600">Additional Services</div>
                <ul className="mt-2 space-y-1">
                  {event.additionalServices.map((service, index) => (
                    <li key={`service-${index}-${service.substring(0, 10)}`} className="text-gray-800">{service}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Files */}
          {event.files && event.files.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Files</h2>
              <div className="space-y-2">
                {event.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-gray-800">{file.name}</span>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Venue Package</span>
                <span className="text-gray-800">{formatCurrency(financials.venuePackageCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Menu Items</span>
                <span className="text-gray-800">{formatCurrency(financials.menuItemsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Additional Services</span>
                <span className="text-gray-800">{formatCurrency(financials.additionalServicesCost)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">{formatCurrency(financials.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({(financials.taxRate * 100).toFixed(1)}%)</span>
                  <span className="text-gray-800">{formatCurrency(financials.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-800">Total</span>
                  <span className="text-gray-800">{formatCurrency(financials.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Status</h2>
            <div className="space-y-3">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {event.status || 'Pending'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Created: {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
              {event.updatedAt && (
                <div className="text-sm text-gray-600">
                  Last Updated: {new Date(event.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigateTo('editEvent', event)}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit Event
              </button>
              <button
                onClick={() => navigateTo('clientPortal')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Client Portal
              </button>
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EventDetail.propTypes = {
  event: PropTypes.object,
  onBack: PropTypes.func.isRequired,
  navigateTo: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};

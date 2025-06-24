import React, { useMemo } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, PieChart, DollarSign, Calendar, Users, Star, Download } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, isValid } from 'date-fns';
import { useData } from '../contexts/AppContext';
import { formatCurrency } from '../utils/financials';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function AnalyticsDashboard({ navigateTo }) {
  const { events, isLoading } = useData();

  // Helper function for status colors
  const getStatusColor = (status) => {
    if (status === 'confirmed') return 'bg-green-100 text-green-800';
    if (status === 'paid') return 'bg-blue-100 text-blue-800';
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  // Calculate analytics data from events
  const analyticsData = useMemo(() => {
    if (!events.length) return null;

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    
    // Filter events with valid dates and financial data
    const validEvents = events.filter(event => {
      const eventDate = event.eventDate ? parseISO(event.eventDate) : null;
      return eventDate && isValid(eventDate) && event.financials?.total;
    });

    // Key metrics
    const currentMonth = startOfMonth(now);
    const currentMonthEvents = validEvents.filter(event => {
      const eventDate = parseISO(event.eventDate);
      return eventDate >= currentMonth;
    });

    const totalRevenue = validEvents.reduce((sum, event) => sum + (event.financials?.total || 0), 0);
    const monthlyRevenue = currentMonthEvents.reduce((sum, event) => sum + (event.financials?.total || 0), 0);
    const avgEventValue = totalRevenue / validEvents.length || 0;
    const totalGuests = validEvents.reduce((sum, event) => sum + (event.guestCount || 0), 0);

    // Monthly revenue trend (last 6 months)
    const monthsRange = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
    const revenueByMonth = monthsRange.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthEvents = validEvents.filter(event => {
        const eventDate = parseISO(event.eventDate);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });
      
      return {
        month: format(month, 'MMM yyyy'),
        revenue: monthEvents.reduce((sum, event) => sum + (event.financials?.total || 0), 0),
        events: monthEvents.length
      };
    });

    // Menu popularity
    const menuCount = {};
    validEvents.forEach(event => {
      if (event.menu && Array.isArray(event.menu)) {
        event.menu.forEach(item => {
          const name = item.name || 'Unknown Item';
          menuCount[name] = (menuCount[name] || 0) + 1;
        });
      }
    });
    
    const popularMenuItems = Object.entries(menuCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        count,
        color: COLORS[index % COLORS.length]
      }));

    // Event status distribution
    const statusCount = {};
    validEvents.forEach(event => {
      const status = event.status || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const eventStatusData = Object.entries(statusCount).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: COLORS[index % COLORS.length]
    }));

    // Recent activity (last 10 events)
    const recentEvents = [...validEvents]
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
      .slice(0, 10);

    return {
      totalRevenue,
      monthlyRevenue,
      avgEventValue,
      totalEvents: validEvents.length,
      totalGuests,
      currentMonthEvents: currentMonthEvents.length,
      revenueByMonth,
      popularMenuItems,
      eventStatusData,
      recentEvents
    };
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600">Business intelligence and reporting for VH Banquets</p>
          </div>
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <BarChart3 size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Event Data Available</h3>
          <p className="text-yellow-700">Add some events with financial information to see analytics.</p>
        </div>
      </div>
    );
  }

  const {
    totalRevenue,
    monthlyRevenue,
    avgEventValue,
    totalEvents,
    totalGuests,
    currentMonthEvents,
    revenueByMonth,
    popularMenuItems,
    eventStatusData,
    recentEvents
  } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600">Business intelligence and reporting for VH Banquets</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} />
            Export Report
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">This month: {formatCurrency(monthlyRevenue)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-blue-600">{totalEvents}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-blue-600">{currentMonthEvents} this month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Event Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(avgEventValue)}</p>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-purple-600">Per event</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Guests</p>
              <p className="text-2xl font-bold text-indigo-600">{totalGuests.toLocaleString()}</p>
            </div>
            <Users className="text-indigo-500" size={32} />
          </div>
          <div className="mt-2">
            <span className="text-sm text-indigo-600">Across all events</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend (Last 6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Tooltip />
                <RechartsPieChart data={eventStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {eventStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </RechartsPieChart>
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Menu Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Menu Items</h3>
          {popularMenuItems.length > 0 ? (
            <div className="space-y-3">
              {popularMenuItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: item.color,
                          width: `${(item.count / popularMenuItems[0].count) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <PieChart size={48} className="mx-auto mb-2" />
              <p>No menu data available</p>
            </div>
          )}
        </div>

        {/* Monthly Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Event Count</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Events</h3>
        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div key={event.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium">{event.eventName || 'Unnamed Event'}</p>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(event.eventDate), 'MMM dd, yyyy')} • {event.guestCount || 0} guests • {formatCurrency(event.financials?.total || 0)}
                  </p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(event.status)}`}>
                  {event.status?.charAt(0).toUpperCase() + (event.status?.slice(1) || 'Pending')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Calendar size={48} className="mx-auto mb-2" />
            <p>No recent events</p>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <Star className="text-blue-600" size={20} />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>Peak Season:</strong> {revenueByMonth.length > 0 ? 
                revenueByMonth.reduce((max, month) => month.revenue > max.revenue ? month : max).month : 'N/A'}
            </p>
            <p className="text-blue-700">
              <strong>Average Guest Count:</strong> {totalEvents > 0 ? Math.round(totalGuests / totalEvents) : 0} per event
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>Most Popular Menu:</strong> {popularMenuItems[0]?.name || 'N/A'}
            </p>
            <p className="text-blue-700">
              <strong>Booking Rate:</strong> {eventStatusData.find(s => s.name === 'Confirmed')?.value || 0} confirmed events
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

AnalyticsDashboard.propTypes = {
  navigateTo: function() {} // eslint-disable-line
};

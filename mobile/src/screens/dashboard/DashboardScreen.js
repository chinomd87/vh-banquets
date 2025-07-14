import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button } from '../../components/ui';
import { api } from '../../store';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Get data from RTK Query hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = 
    api.useGetDashboardStatsQuery();
  
  const { data: recentEvents, isLoading: eventsLoading, refetch: refetchEvents } = 
    api.useGetRecentEventsQuery({ limit: 5 });
  
  const { data: upcomingEvents, isLoading: upcomingLoading, refetch: refetchUpcoming } = 
    api.useGetUpcomingEventsQuery({ limit: 3 });

  const isRefreshing = statsLoading || eventsLoading || upcomingLoading;

  const onRefresh = () => {
    refetchStats();
    refetchEvents();
    refetchUpcoming();
  };

  const StatCard = ({ title, value, subtitle, onPress }) => (
    <Card style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value || '0'}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const QuickActionCard = ({ title, description, buttonText, onPress, icon }) => (
    <Card style={styles.actionCard}>
      <View style={styles.actionCardContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
        <Button
          title={buttonText}
          onPress={onPress}
          size="small"
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back, {user?.firstName || 'User'}!
        </Text>
        <Text style={styles.subGreeting}>
          Here's what's happening today
        </Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Events"
            value={stats?.totalEvents}
            subtitle="This month"
            onPress={() => navigation.navigate('Events')}
          />
          <StatCard
            title="Active Clients"
            value={stats?.activeClients}
            subtitle="Current"
            onPress={() => navigation.navigate('Clients')}
          />
          <StatCard
            title="Revenue"
            value={stats?.monthlyRevenue ? `$${stats.monthlyRevenue.toLocaleString()}` : '$0'}
            subtitle="This month"
          />
          <StatCard
            title="Staff"
            value={stats?.totalStaff}
            subtitle="Active"
            onPress={() => navigation.navigate('Staff')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickActionCard
          title="New Event"
          description="Create a new event for a client"
          buttonText="Create Event"
          onPress={() => navigation.navigate('Events', { screen: 'CreateEvent' })}
        />
        <QuickActionCard
          title="Add Client"
          description="Register a new client"
          buttonText="Add Client"
          onPress={() => navigation.navigate('Clients', { screen: 'CreateClient' })}
        />
      </View>

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Button
              title="View All"
              variant="secondary"
              size="small"
              onPress={() => navigation.navigate('Events')}
            />
          </View>
          {upcomingEvents.map((event) => (
            <Card
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('Events', {
                screen: 'EventDetail',
                params: { eventId: event.id }
              })}
            >
              <View style={styles.eventCardContent}>
                <Text style={styles.eventTitle}>{event.name}</Text>
                <Text style={styles.eventClient}>{event.client?.name}</Text>
                <Text style={styles.eventDate}>
                  {new Date(event.eventDate).toLocaleDateString()}
                </Text>
                <Text style={styles.eventGuests}>
                  {event.guestCount} guests
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Recent Activity */}
      {recentEvents && recentEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentEvents.map((event) => (
            <Card
              key={event.id}
              style={styles.activityCard}
              onPress={() => navigation.navigate('Events', {
                screen: 'EventDetail',
                params: { eventId: event.id }
              })}
            >
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{event.name}</Text>
                <Text style={styles.activitySubtitle}>
                  {event.status} • {new Date(event.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    marginHorizontal: 8,
    marginVertical: 6,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },
  actionCard: {
    marginVertical: 6,
  },
  actionCardContent: {
    padding: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  eventCard: {
    marginVertical: 4,
  },
  eventCardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventClient: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  eventGuests: {
    fontSize: 14,
    color: '#8E8E93',
  },
  activityCard: {
    marginVertical: 4,
  },
  activityContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default DashboardScreen;

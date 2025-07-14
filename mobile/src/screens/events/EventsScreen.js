import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge, Button, Input } from '../../components/ui';
import { api } from '../../store';

const EventsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { 
    data: events, 
    isLoading, 
    error, 
    refetch 
  } = api.useGetEventsQuery({
    search: searchQuery,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const EventCard = ({ event }) => (
    <Card
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <Text style={styles.eventClient}>{event.client?.name}</Text>
        </View>
        <StatusBadge status={event.status} />
      </View>
      
      <View style={styles.eventDetails}>
        <View style={styles.eventDetail}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.eventDetailText}>
            {new Date(event.eventDate).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.eventDetail}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.eventDetailText}>
            {new Date(event.eventDate).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        <View style={styles.eventDetail}>
          <Ionicons name="people-outline" size={16} color="#8E8E93" />
          <Text style={styles.eventDetailText}>
            {event.guestCount} guests
          </Text>
        </View>
        
        <View style={styles.eventDetail}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.eventDetailText}>
            {event.venue || 'TBD'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const StatusFilter = () => {
    const statuses = [
      { key: 'all', label: 'All' },
      { key: 'draft', label: 'Draft' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'in_progress', label: 'In Progress' },
      { key: 'completed', label: 'Completed' },
      { key: 'cancelled', label: 'Cancelled' },
    ];

    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Events Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? 'Try adjusting your search or filters'
          : 'Get started by creating your first event'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Create Event"
          onPress={() => navigation.navigate('CreateEvent')}
          style={styles.emptyStateButton}
        />
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorText}>Failed to load events</Text>
        <Button title="Retry" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <StatusFilter />
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventCard event={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    marginTop: 12,
  },
  filterList: {
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  eventCard: {
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  eventClient: {
    fontSize: 14,
    color: '#007AFF',
  },
  eventDetails: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateButton: {
    marginTop: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default EventsScreen;

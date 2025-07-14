import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, StatusBadge, Button } from '../../components/ui';
import { api } from '../../store';

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  
  const { 
    data: event, 
    isLoading, 
    error 
  } = api.useGetEventQuery(eventId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading event details...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load event details</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const DetailRow = ({ icon, label, value, onPress }) => (
    <TouchableOpacity 
      style={styles.detailRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.detailRowLeft}>
        <Ionicons name={icon} size={20} color="#007AFF" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View style={styles.detailRowRight}>
        <Text style={styles.detailValue}>{value}</Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.eventTitle}>{event.name}</Text>
            <StatusBadge status={event.status} />
          </View>
          <Text style={styles.eventDescription}>
            {event.description || 'No description provided'}
          </Text>
        </View>
      </Card>

      {/* Event Details */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        
        <DetailRow
          icon="calendar-outline"
          label="Date"
          value={new Date(event.eventDate).toLocaleDateString()}
        />
        
        <DetailRow
          icon="time-outline"
          label="Time"
          value={new Date(event.eventDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        />
        
        <DetailRow
          icon="people-outline"
          label="Guest Count"
          value={`${event.guestCount} guests`}
        />
        
        <DetailRow
          icon="location-outline"
          label="Venue"
          value={event.venue || 'TBD'}
        />
        
        <DetailRow
          icon="cash-outline"
          label="Budget"
          value={event.budget ? `$${event.budget.toLocaleString()}` : 'Not set'}
        />
      </Card>

      {/* Client Information */}
      {event.client && (
        <Card style={styles.clientCard}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          
          <DetailRow
            icon="person-outline"
            label="Name"
            value={event.client.name}
            onPress={() => navigation.navigate('ClientDetail', { 
              clientId: event.client.id 
            })}
          />
          
          <DetailRow
            icon="call-outline"
            label="Phone"
            value={event.client.phone || 'Not provided'}
          />
          
          <DetailRow
            icon="mail-outline"
            label="Email"
            value={event.client.email || 'Not provided'}
          />
        </Card>
      )}

      {/* Menu Information */}
      {event.menu && (
        <Card style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Menu</Text>
          
          <DetailRow
            icon="restaurant-outline"
            label="Menu Type"
            value={event.menu.name || 'Custom Menu'}
          />
          
          <DetailRow
            icon="cash-outline"
            label="Price per Person"
            value={event.menu.pricePerPerson ? 
              `$${event.menu.pricePerPerson}` : 'TBD'}
          />
        </Card>
      )}

      {/* Notes */}
      {event.notes && (
        <Card style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{event.notes}</Text>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Edit Event"
          onPress={() => navigation.navigate('EditEvent', { eventId })}
          style={styles.actionButton}
        />
        
        <Button
          title="View Timeline"
          variant="secondary"
          onPress={() => navigation.navigate('EventTimeline', { eventId })}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  eventDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  detailsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  clientCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  menuCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  notesCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default EventDetailScreen;

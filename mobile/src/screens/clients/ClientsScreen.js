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
import { Card, Button, Input } from '../../components/ui';
import { api } from '../../store';

const ClientsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: clients, 
    isLoading, 
    error, 
    refetch 
  } = api.useGetClientsQuery({
    search: searchQuery,
  });

  const ClientCard = ({ client }) => (
    <Card
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.company && (
            <Text style={styles.clientCompany}>{client.company}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </View>
      
      <View style={styles.clientDetails}>
        {client.email && (
          <View style={styles.clientDetail}>
            <Ionicons name="mail-outline" size={16} color="#8E8E93" />
            <Text style={styles.clientDetailText}>{client.email}</Text>
          </View>
        )}
        
        {client.phone && (
          <View style={styles.clientDetail}>
            <Ionicons name="call-outline" size={16} color="#8E8E93" />
            <Text style={styles.clientDetailText}>{client.phone}</Text>
          </View>
        )}
        
        <View style={styles.clientDetail}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.clientDetailText}>
            {client.eventsCount || 0} events
          </Text>
        </View>
      </View>
    </Card>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Clients Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? 'Try adjusting your search'
          : 'Get started by adding your first client'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Add Client"
          onPress={() => navigation.navigate('CreateClient')}
          style={styles.emptyStateButton}
        />
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorText}>Failed to load clients</Text>
        <Button title="Retry" onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Clients List */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ClientCard client={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateClient')}
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
    paddingVertical: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  clientCard: {
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 14,
    color: '#007AFF',
  },
  clientDetails: {
    gap: 8,
  },
  clientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientDetailText: {
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

export default ClientsScreen;

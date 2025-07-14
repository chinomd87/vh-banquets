import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Card = ({ 
  children, 
  style, 
  onPress, 
  title, 
  subtitle, 
  rightAction,
  shadow = true 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        shadow && styles.shadow,
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle || rightAction) && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {rightAction && (
            <View style={styles.rightAction}>
              {rightAction}
            </View>
          )}
        </View>
      )}
      
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </CardComponent>
  );
};

const StatusBadge = ({ status, style }) => {
  const getBadgeStyle = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'confirmed':
      case 'completed':
        return styles.badge_success;
      case 'pending':
      case 'in_progress':
        return styles.badge_warning;
      case 'cancelled':
      case 'declined':
        return styles.badge_danger;
      case 'draft':
        return styles.badge_info;
      default:
        return styles.badge_default;
    }
  };

  const getBadgeTextStyle = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'confirmed':
      case 'completed':
        return styles.badgeText_success;
      case 'pending':
      case 'in_progress':
        return styles.badgeText_warning;
      case 'cancelled':
      case 'declined':
        return styles.badgeText_danger;
      case 'draft':
        return styles.badgeText_info;
      default:
        return styles.badgeText_default;
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle(), style]}>
      <Text style={[styles.badgeText, getBadgeTextStyle()]}>
        {status?.toUpperCase()}
      </Text>
    </View>
  );
};

const ListItem = ({ 
  title, 
  subtitle, 
  leftIcon, 
  rightIcon = 'chevron-forward', 
  onPress, 
  badge,
  style 
}) => {
  return (
    <TouchableOpacity style={[styles.listItem, style]} onPress={onPress}>
      {leftIcon && (
        <View style={styles.leftIcon}>
          <Ionicons name={leftIcon} size={24} color="#007AFF" />
        </View>
      )}
      
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      
      {badge && (
        <View style={styles.listItemBadge}>
          <StatusBadge status={badge} />
        </View>
      )}
      
      {rightIcon && (
        <View style={styles.rightIcon}>
          <Ionicons name={rightIcon} size={20} color="#C7C7CC" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  rightAction: {
    marginLeft: 12,
  },
  content: {
    padding: 16,
  },
  
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badge_success: {
    backgroundColor: '#E6F7E6',
  },
  badge_warning: {
    backgroundColor: '#FFF3CD',
  },
  badge_danger: {
    backgroundColor: '#F8D7DA',
  },
  badge_info: {
    backgroundColor: '#D1ECF1',
  },
  badge_default: {
    backgroundColor: '#F2F2F7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeText_success: {
    color: '#28A745',
  },
  badgeText_warning: {
    color: '#FFC107',
  },
  badgeText_danger: {
    color: '#DC3545',
  },
  badgeText_info: {
    color: '#17A2B8',
  },
  badgeText_default: {
    color: '#6C757D',
  },
  
  // List item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  leftIcon: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listItemBadge: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export { Card, StatusBadge, ListItem };

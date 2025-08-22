import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationBadge = ({ 
  count = 0, 
  onPress, 
  size = 'medium',
  showZero = false,
  maxCount = 99,
  style,
  iconColor = '#6B7280',
  badgeColor = '#EF4444',
  textColor = '#FFFFFF',
  animated = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const shouldShowBadge = count > 0 || showZero;

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 32;
      default: return 24;
    }
  };

  const getBadgeSize = () => {
    const baseSize = count > 9 ? 22 : 18;
    switch (size) {
      case 'small': return { minWidth: baseSize - 4, height: baseSize - 4, borderRadius: (baseSize - 4) / 2 };
      case 'large': return { minWidth: baseSize + 4, height: baseSize + 4, borderRadius: (baseSize + 4) / 2 };
      default: return { minWidth: baseSize, height: baseSize, borderRadius: baseSize / 2 };
    }
  };

  const getBadgePosition = () => {
    switch (size) {
      case 'small': return { top: -6, right: -6 };
      case 'large': return { top: -8, right: -8 };
      default: return { top: -7, right: -7 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'large': return 12;
      default: return 11;
    }
  };

  useEffect(() => {
    if (animated && count > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      setTimeout(() => {
        pulse.stop();
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 3000);
    } else if (count === 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [count, animated]);

  const handlePress = () => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPress && onPress();
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Ionicons 
          name={count > 0 ? "notifications" : "notifications-outline"} 
          size={getIconSize()} 
          color={count > 0 ? "#3B82F6" : iconColor} 
        />
        
        {shouldShowBadge && (
          <Animated.View
            style={[
              styles.badge,
              getBadgeSize(),
              getBadgePosition(),
              { backgroundColor: badgeColor },
              animated && {
                transform: [
                  { scale: pulseAnim },
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            <Text 
              style={[
                styles.badgeText, 
                { 
                  color: textColor, 
                  fontSize: getTextSize(),
                }
              ]}
            >
              {displayCount}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBadge;

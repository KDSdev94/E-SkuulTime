import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanGestureHandler,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const TOAST_HEIGHT = 80;
const TOAST_MARGIN = 10;

const ToastNotification = ({
  visible,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info', 'schedule'
  duration = 4000,
  onPress,
  onDismiss,
  showProgress = true,
  senderName,
  autoHide = true,
}) => {
  const slideAnim = useRef(new Animated.Value(-TOAST_HEIGHT - TOAST_MARGIN - (StatusBar.currentHeight || 0))).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isVisible, setIsVisible] = useState(false);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'checkmark-circle',
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'close-circle',
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'warning',
          iconColor: '#FFFFFF',
        };
      case 'schedule':
        return {
          backgroundColor: '#3B82F6',
          icon: 'calendar',
          iconColor: '#FFFFFF',
        };
      default: // info
        return {
          backgroundColor: '#6B7280',
          icon: 'information-circle',
          iconColor: '#FFFFFF',
        };
    }
  };

  const config = getToastConfig();

  const showToast = () => {
    setIsVisible(true);
    
    // Reset animations
    slideAnim.setValue(-TOAST_HEIGHT - TOAST_MARGIN - (StatusBar.currentHeight || 0));
    progressAnim.setValue(1);
    scaleAnim.setValue(1);

    // Slide in animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: StatusBar.currentHeight || 0 + TOAST_MARGIN,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Progress bar animation
    if (showProgress && autoHide) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }

    // Auto hide
    if (autoHide) {
      setTimeout(() => {
        hideToast();
      }, duration);
    }
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -TOAST_HEIGHT - TOAST_MARGIN - (StatusBar.currentHeight || 0),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss && onDismiss();
    });
  };

  const handlePress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
      hideToast();
    }
  };

  const handleSwipeUp = () => {
    hideToast();
  };

  useEffect(() => {
    if (visible && message) {
      showToast();
    } else if (!visible && isVisible) {
      hideToast();
    }
  }, [visible, message]);

  if (!isVisible && !visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: config.backgroundColor,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon}
            size={24}
            color={config.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText} numberOfLines={2}>
            {message}
          </Text>
          {senderName && (
            <Text style={styles.senderText} numberOfLines={1}>
              dari {senderName}
            </Text>
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Progress bar */}
      {showProgress && autoHide && (
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeIndicator}>
        <View style={styles.swipeLine} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: TOAST_MARGIN,
    right: TOAST_MARGIN,
    zIndex: 9999,
    borderRadius: 12,
    minHeight: TOAST_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: TOAST_HEIGHT - 8,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  senderText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    fontStyle: 'italic',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  swipeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -12,
    alignItems: 'center',
  },
  swipeLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
  },
});

export default ToastNotification;

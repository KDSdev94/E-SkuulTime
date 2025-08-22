import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export const StatusBarUtils = {
  
  setStatusBarStyle: (style = 'auto', animated = true) => {
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      StatusBar.setStatusBarStyle(style, animated);
    } catch (error) {
      
    }
  },

  setStatusBarHidden: (hidden = false, animation = 'fade') => {
    if (Platform.OS === 'web') {
      return;
    }
    
    try {
      StatusBar.setStatusBarHidden(hidden, animation);
    } catch (error) {
      
    }
  },

  setStatusBarBackgroundColor: (backgroundColor = '#000000', animated = true) => {
    if (Platform.OS !== 'android') {
      return;
    }
    
    try {
      StatusBar.setStatusBarBackgroundColor(backgroundColor, animated);
    } catch (error) {
      
    }
  },

  setStatusBarTranslucent: (translucent = true) => {
    if (Platform.OS !== 'android') {
      return;
    }
    
    try {
      StatusBar.setStatusBarTranslucent(translucent);
    } catch (error) {
      
    }
  },

  setNetworkActivityIndicatorVisible: (visible = false) => {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      StatusBar.setStatusBarNetworkActivityIndicatorVisible(visible);
    } catch (error) {
      
    }
  },

  getStyleForTheme: (theme) => {
    if (!theme) return 'auto';
    
    if (theme.statusBarStyle) {
      return theme.statusBarStyle;
    }
    
    if (theme.headerBackground) {
      const darkColors = ['#1e3a8a', '#2563eb', '#3b82f6', '#000000', '#1f2937'];
      const isDark = darkColors.some(color => 
        theme.headerBackground.toLowerCase().includes(color.toLowerCase())
      );
      return isDark ? 'light' : 'dark';
    }
    
    return 'auto';
  }
};

export const SafeStatusBar = ({ 
  style = 'auto', 
  hidden = false, 
  animated = true,
  translucent = true,
  networkActivityIndicatorVisible = false,
  hideTransitionAnimation = 'fade',
  ...otherProps 
}) => {
  const safeProps = {
    style,
    hidden,
    animated,
    hideTransitionAnimation: Platform.OS === 'ios' ? hideTransitionAnimation : undefined,
    networkActivityIndicatorVisible: Platform.OS === 'ios' ? networkActivityIndicatorVisible : undefined,
    translucent: Platform.OS === 'android' ? translucent : undefined,
  };

  Object.keys(safeProps).forEach(key => {
    if (safeProps[key] === undefined) {
      delete safeProps[key];
    }
  });

  return <StatusBar {...safeProps} />;
};

export default StatusBarUtils;


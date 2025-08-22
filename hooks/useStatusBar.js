import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBarUtils } from '../utils/statusBarUtils';

export const useStatusBar = (options = {}) => {
  const {
    style = 'auto',
    hidden = false,
    backgroundColor = null,
    translucent = true,
    networkActivityIndicatorVisible = false,
    animated = true
  } = options;

  useEffect(() => {
    StatusBarUtils.setStatusBarStyle(style, animated);
    
    StatusBarUtils.setStatusBarHidden(hidden, animated ? 'fade' : 'none');
    
    if (backgroundColor && Platform.OS === 'android') {
      StatusBarUtils.setStatusBarBackgroundColor(backgroundColor, animated);
    }
    
    if (Platform.OS === 'android') {
      StatusBarUtils.setStatusBarTranslucent(translucent);
    }
    
    if (Platform.OS === 'ios') {
      StatusBarUtils.setNetworkActivityIndicatorVisible(networkActivityIndicatorVisible);
    }
  }, [style, hidden, backgroundColor, translucent, networkActivityIndicatorVisible, animated]);

  return {
    setStyle: (newStyle, isAnimated = true) => {
      StatusBarUtils.setStatusBarStyle(newStyle, isAnimated);
    },
    setHidden: (isHidden, animation = 'fade') => {
      StatusBarUtils.setStatusBarHidden(isHidden, animation);
    },
    setBackgroundColor: (color, isAnimated = true) => {
      StatusBarUtils.setStatusBarBackgroundColor(color, isAnimated);
    },
    setTranslucent: (isTranslucent) => {
      StatusBarUtils.setStatusBarTranslucent(isTranslucent);
    },
    setNetworkActivityIndicator: (isVisible) => {
      StatusBarUtils.setNetworkActivityIndicatorVisible(isVisible);
    }
  };
};

export default useStatusBar;


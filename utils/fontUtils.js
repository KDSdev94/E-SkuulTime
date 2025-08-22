import { Platform } from 'react-native';

export const getFontFamily = (fontName) => {
  if (Platform.OS === 'ios') {
    return fontName;
  } else {
    switch (fontName) {
      case 'Nunito_400Regular':
        return 'Nunito-Regular';
      case 'Nunito_500Medium':
        return 'Nunito-Medium';
      case 'Nunito_600SemiBold':
        return 'Nunito-SemiBold';
      case 'Nunito_700Bold':
        return 'Nunito-Bold';
      default:
        return 'System';
    }
  }
};

export const getSafeFont = (fontName = 'Nunito_400Regular') => {
  if (Platform.OS === 'ios') {
    return fontName;
  } else {
    const customFont = getFontFamily(fontName);
    return customFont === 'System' ? undefined : customFont;
  }
};

export const createTextStyle = (fontSize, fontFamily = 'Nunito_400Regular', color = '#000') => ({
  fontSize,
  fontFamily: getSafeFont(fontFamily),
  color,
  includeFontPadding: false,
});

export default getFontFamily;


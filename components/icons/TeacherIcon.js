import React from 'react';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';

const TeacherIcon = ({ 
  size = 60, 
  color = '#FF6B6B',
  backgroundColor = 'rgba(255, 107, 107, 0.1)',
  showBackground = true 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Background Circle */}
      {showBackground && (
        <Circle
          cx="60"
          cy="60"
          r="58"
          fill={backgroundColor}
          stroke={color}
          strokeWidth="2"
        />
      )}
      
      {/* Teacher Figure - Simplified */}
      <G transform="translate(60, 60)">
        {/* Head */}
        <Circle cx="0" cy="-20" r="12" fill="#FFE4C4" />
        
        {/* Hair */}
        <Path 
          d="M-12 -30 C-12 -35 -8 -37 0 -37 C8 -37 12 -35 12 -30 C12 -27 10 -25 8 -24 C4 -23 -4 -23 -8 -24 C-10 -25 -12 -27 -12 -30 Z" 
          fill="#8B4513" 
        />
        
        {/* Eyes */}
        <Circle cx="-4" cy="-22" r="1.5" fill="#333" />
        <Circle cx="4" cy="-22" r="1.5" fill="#333" />
        
        {/* Smile */}
        <Path 
          d="M-3 -17 Q0 -15 3 -17" 
          stroke="#333" 
          strokeWidth="1" 
          fill="none" 
          strokeLinecap="round"
        />
        
        {/* Graduation Cap */}
        <Rect x="-10" y="-35" width="20" height="2" rx="1" fill="#000" />
        <Path d="M0 -37 L-4 -35 L4 -35 Z" fill="#000" />
        
        {/* Body (Shirt) */}
        <Rect x="-10" y="-8" width="20" height="20" rx="2" fill={color} />
        
        {/* Tie */}
        <Path d="M-2 -8 L2 -8 L3 5 L-3 5 Z" fill="#DC143C" />
        
        {/* Arms */}
        <Rect x="-15" y="-3" width="5" height="15" rx="2.5" fill="#FFE4C4" />
        <Rect x="10" y="-3" width="5" height="15" rx="2.5" fill="#FFE4C4" />
        
        {/* Book */}
        <Rect x="-20" y="5" width="6" height="8" rx="1" fill="#228B22" />
        
        {/* Legs */}
        <Rect x="-6" y="12" width="5" height="15" rx="2.5" fill="#2F4F4F" />
        <Rect x="1" y="12" width="5" height="15" rx="2.5" fill="#2F4F4F" />
      </G>
    </Svg>
  );
};

export default TeacherIcon;

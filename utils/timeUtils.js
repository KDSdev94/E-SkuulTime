
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    
    return `${formattedHour}:${formattedMinute}`;
  } catch (error) {
    
    return timeString;
  }
};

export const getCurrentTimeInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  } catch (error) {
    
    return 0;
  }
};

export const isCurrentTimeInRange = (startTime, endTime) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

export const getDayName = (dayIndex) => {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return dayNames[dayIndex] || '';
};

export const getCurrentDayName = () => {
  const today = new Date();
  return getDayName(today.getDay());
};

export const formatDuration = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  
  if (durationMinutes < 60) {
    return `${durationMinutes} menit`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} jam`;
  }
  
  return `${hours} jam ${minutes} menit`;
};


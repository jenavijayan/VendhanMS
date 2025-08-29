// utils/dateUtils.ts

export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  try {
    return new Date(dateString).toLocaleDateString(undefined, options || defaultOptions);
  } catch (e) {
    return "Invalid Date";
  }
};
  
export const calculateLeaveDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Ensure dates are treated as UTC to avoid timezone issues with date-only strings
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffTime = Math.abs(utcEnd - utcStart);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  return diffDays > 0 ? diffDays : 1; 
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return "Invalid Time";
  }
};

export const calculateDuration = (startTimeISO: string, endTimeISO?: string): string => {
  if (!startTimeISO) return '0h 0m';
  const start = new Date(startTimeISO).getTime();
  const end = endTimeISO ? new Date(endTimeISO).getTime() : new Date().getTime(); // Use current time if endTime is not provided

  if (isNaN(start) || (endTimeISO && isNaN(end))) return 'Invalid dates';
  if (end < start) return '0h 0m'; // Or handle as error

  let durationMillis = end - start;
  
  const hours = Math.floor(durationMillis / (1000 * 60 * 60));
  durationMillis -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(durationMillis / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

export const calculateDecimalHours = (startTimeISO: string, endTimeISO: string): number => {
  if (!startTimeISO || !endTimeISO) return 0;
  const start = new Date(startTimeISO).getTime();
  const end = new Date(endTimeISO).getTime();

  if (isNaN(start) || isNaN(end)) return 0;
  if (end < start) return 0;

  const durationMillis = end - start;
  return parseFloat((durationMillis / (1000 * 60 * 60)).toFixed(2));
};

export const getCurrentDateTime = (): { date: string, time: string } => {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return { date, time };
};
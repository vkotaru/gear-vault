import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize } = format;

// Define custom format for logs
const logFormat = printf(({ level, message, timestamp, ...rest }) => {
  let logMessage = `${timestamp} ${level}: ${message}`;
  
  // Add any additional metadata if present
  if (Object.keys(rest).length > 0) {
    logMessage += ` ${JSON.stringify(rest)}`;
  }
  
  return logMessage;
});

// Create the Winston logger
export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat
  ),
  transports: [
    // Write to console
    new transports.Console()
  ],
});

export default logger;
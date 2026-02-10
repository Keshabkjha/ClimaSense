
export enum MessageRole {
  USER = 'user',
  BOT = 'bot'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  rainChance: string;
  icon: 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'wind' | 'cloud-sun';
}

export interface ChartPoint {
  time: string;
  temp: number;
}

export interface WeatherMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  sources?: GroundingSource[];
  isThinking?: boolean;
  isAlert?: boolean;
  alertType?: 'warning' | 'danger';
  forecast?: ForecastDay[];
  chartData?: ChartPoint[];
  feedback?: 'up' | 'down' | null;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    day: string;
    temp: number;
    icon: string;
  }>;
}

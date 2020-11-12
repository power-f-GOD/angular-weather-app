export interface StateModel extends Partial<WeatherResponseProps & CitiesResponse> {
  tomorrow?: WeatherResponseProps['current'];
  other?: WeatherResponseProps['current'];
  latitude?: number;
  longitude?: number;
  location?: { name?: string; err?: boolean; statusText?: string | null };
  activeTabLinkIndex?: number;
  nightMode?: boolean;
  lastSynced?: number;
  isOnline?: boolean;
  hourliesMounted?: boolean;
}

export type WeatherImageClassName =
  | 'cloud-storm'
  | 'clouds-sun-rain'
  | 'cloudy'
  | 'cloudy-sun'
  | 'rainbow-cloud'
  | 'rainy-cloud'
  | 'snowy-cloud'
  | 'sunny'
  | 'thunder-cloud'
  | 'thunder-storm'
  | 'atmosphere';

export type WeatherResponseMain =
  | 'Clouds'
  | 'Thunderstorm'
  | 'Clear'
  | 'Drizzle'
  | 'Rainy'
  | 'Rain'
  | 'Snow'
  | 'Tornado'
  | 'Fog';

export interface CardDataProps
  extends Partial<WeatherInfoProps & WeatherResponseProps> {
  type: 'A' | 'B' | 'C';
  description?: string;
  main?: WeatherResponseMain;
  tomorrow?: WeatherInfoProps;
  other?: WeatherInfoProps;
  index?: number;
  hour?: number | string;
}

export interface CitiesResponse {
  latt: string;
  longt: string;
  match: { latt: string; longt: string; matchtype: string; location: string }[];
  matches: string;
  error: any;
  success: boolean;
  city: string;
  country: string;
  timezone: string;
  prov: string;
  region: string;
  standard: {
    city: string;
    prov: string;
    countryname: string;
  };
}

export interface WeatherResponseProps {
  current: WeatherInfoProps;
  daily: WeatherInfoProps[];
  hourly: WeatherInfoProps[];
  minutely: WeatherInfoProps[];
  lat: number;
  lon: number;
}

export interface WeatherInfoProps {
  clouds: number;
  dew_point: number;
  dt: number;
  feels_like: number | FeelsLikeDaily;
  humidity: number;
  pressure: number;
  sunrise: number;
  sunset: number;
  temp: number | TempDaily;
  uvi: number;
  visibility: number;
  weather: { description: string; main: WeatherResponseMain }[];
  wind_deg: number;
  wind_speed: number;
  date_string: string;
  main?: WeatherResponseMain;
  description?: string;
}

export interface TempDaily {
  day: number;
  eve: number;
  max: number;
  min: number;
  morn: number;
  night: number;
}

export interface FeelsLikeDaily {
  day: number;
  eve: number;
  morn: number;
  night: number;
}

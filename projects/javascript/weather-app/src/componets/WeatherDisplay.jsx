function WeatherDisplay({ weatherData }) {
  if (!weatherData) return null

  const { name, main, weather, wind, sys } = weatherData
  const weatherInfo = weather[0]

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  return (
    <div className="weather-display">
      <h2>
        Погода в {name}{sys?.country ? `, ${sys.country}` : ''}
      </h2>
      
      <div className="weather-card">
        <div className="weather-main">
          <img 
            src={getWeatherIcon(weatherInfo.icon)} 
            alt={weatherInfo.description}
            onError={(e) => {
              e.target.src = 'https://openweathermap.org/img/wn/01d@2x.png'
            }}
          />
          <div className="temperature">
            {Math.round(main.temp)}°C
          </div>
          <div className="weather-description">
            {weatherInfo.description}
          </div>
        </div>
        
        <div className="weather-details">
          <div className="detail-item">
            <span className="detail-label">Ощущается как:</span>
            <span className="detail-value">{Math.round(main.feels_like)}°C</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Влажность:</span>
            <span className="detail-value">{main.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Давление:</span>
            <span className="detail-value">{main.pressure} hPa</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Ветер:</span>
            <span className="detail-value">{wind.speed} м/с</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Мин. температура:</span>
            <span className="detail-value">{Math.round(main.temp_min)}°C</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Макс. температура:</span>
            <span className="detail-value">{Math.round(main.temp_max)}°C</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherDisplay
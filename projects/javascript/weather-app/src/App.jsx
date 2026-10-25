import { useState, useEffect, useCallback } from 'react'
import './App.css'
import WeatherDisplay from './components/WeatherDisplay'
import CitySelector from './components/CitySelector'

const CITIES = [
  { name: "Москва" },
  { name: "Санкт-Петербург" },
  { name: "Новосибирск" },
  { name: "Екатеринбург" },
  { name: "Казань" },
  { name: "Сочи" },
  { name: "Сызрань" },
  { name: "Севастополь"},
  { name: "Вагаршапат"},
  { name: "Ереван"},
  { name: "Гюмри"}
  ]

function App() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const API_KEY = 'REPLACE_ME'

  const fetchMockWeather = useCallback(async (city) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const seasons = {
        winter: { min: -15, max: 0 },
        spring: { min: 5, max: 15 },
        summer: { min: 15, max: 25 },
        autumn: { min: 0, max: 10 }
      };
      
      const currentMonth = new Date().getMonth();
      let season;
      if (currentMonth >= 11 || currentMonth <= 1) season = 'winter';
      else if (currentMonth >= 2 && currentMonth <= 4) season = 'spring';
      else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
      else season = 'autumn';
      
      const tempRange = seasons[season];
      const temp = Math.round(Math.random() * (tempRange.max - tempRange.min) + tempRange.min);
      
      const mockData = {
        name: city.name,
        main: {
          temp: temp,
          feels_like: temp - Math.round(Math.random() * 5),
          humidity: Math.round(Math.random() * 40 + 40),
          pressure: 1013 + Math.round(Math.random() * 20 - 10),
          temp_min: temp - Math.round(Math.random() * 3),
          temp_max: temp + Math.round(Math.random() * 3)
        },
        weather: [
          {
            description: ["ясно", "облачно", "пасмурно", "небольшой дождь", "снег"][Math.floor(Math.random() * 5)],
            icon: "//cdn.weatherapi.com/weather/64x64/day/113.png"
          }
        ],
        wind: {
          speed: (Math.random() * 8 + 2).toFixed(1)
        },
        sys: {
          country: "RU"
        }
      }
      
      setWeatherData(mockData)
    } catch (mockErr) {
    console.error('Ошибка в демо-данных:', mockErr)
    setError('Не удалось загрузить данные')
  }
}, [])

  const fetchWeather = useCallback(async (city) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city.name}&lang=ru`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      const convertedData = {
        name: data.location.name,
        main: {
          temp: data.current.temp_c,
          feels_like: data.current.feelslike_c,
          humidity: data.current.humidity,
          pressure: data.current.pressure_mb,
          temp_min: data.current.temp_c - 2,
          temp_max: data.current.temp_c + 2
        },
        weather: [
          {
            description: data.current.condition.text,
            icon: data.current.condition.icon
          }
        ],
        wind: {
          speed: (data.current.wind_kph / 3.6).toFixed(1)
        },
        sys: {
          country: data.location.country
        }
      }
      
      setWeatherData(convertedData)
    } catch (err) {
      setError(err.message)
      console.error('Ошибка получения погоды:', err)
      
      await fetchMockWeather(city)
    } finally {
      setLoading(false)
    }
  }, [API_KEY, fetchMockWeather])

  useEffect(() => {
    if (selectedCity) {
      fetchWeather(selectedCity)
    }
  }, [selectedCity, fetchWeather])

  const handleRetry = () => {
    fetchWeather(selectedCity)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Прогноз погоды</h1>
        <p>React приложение с использованием WeatherAPI</p>
        <div className="api-status">
          🌤️ Работает через WeatherAPI.com
        </div>
      </header>

      <main className="app-main">
        <CitySelector 
          cities={CITIES}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Загрузка данных о погоде...
          </div>
        )}

        {error && (
          <div className="error">
            <p>Ошибка: {error}</p>
            <button onClick={handleRetry} className="retry-button">
              Попробовать снова
            </button>
            <div className="fallback-notice">
              Если ошибка повторяется, будут показаны демо-данные
            </div>
          </div>
        )}

        {weatherData && !loading && (
          <>
            <WeatherDisplay weatherData={weatherData} />
            <div className="data-source">
              <small>
                Данные предоставлены WeatherAPI.com • 
                Последнее обновление: {new Date().toLocaleTimeString()}
              </small>
            </div>
          </>
        )}

      </main>
    </div>
  )
}

export default App
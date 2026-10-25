function CitySelector({ cities, selectedCity, onCityChange }) {
  return (
    <div className="city-selector">
      <h2>Выберите город:</h2>
      <div className="city-buttons">
        {cities.map((city, index) => (
          <button
            key={index}
            className={`city-button ${selectedCity.name === city.name ? 'active' : ''}`}
            onClick={() => onCityChange(city)}
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CitySelector
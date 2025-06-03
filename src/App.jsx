import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [city, setCity] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  const RAPIDAPI_KEY = 'e74f8ee797msh19e5d70d033f4e5p1af591jsn5ab4a61e0dfd';

  const fetchCity = async () => {
    try {
      setLoading(true);

      let params = {
        limit: 10,
        offset: Math.floor(Math.random() * 1000),
      };

      if (difficulty === 'medium') {
        params.minPopulation = 500000;
        params.sort = '-population';
      } else if (difficulty === 'hard') {
        params.limit = 1;
        params.offset = Math.floor(Math.random() * 10000);
      }

      const res = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
        params,
      });

      let cities = res.data.data;

      if (cities.length === 0) {
        fetchCity();
        return;
      }

      const chosenCity = cities[Math.floor(Math.random() * cities.length)];

      setCity(chosenCity);
      setResult('');
      setGuess('');
      setShowForm(false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching city:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCity();
  }, [difficulty]);

  const handleGuess = () => {
    if (!guess) return;

    const correctAnswer = city.country;
    const isCorrect = guess.trim().toLowerCase() === correctAnswer.toLowerCase();

    setResult(isCorrect ? '✅ Correct!' : `❌ Wrong! Correct answer: ${correctAnswer}`);
    setShowForm(true);
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Guess the Country!</h1>

      <div className="mb-3 w-auto">
        <label className="form-label">Difficulty:</label>
        <select
          className="form-select"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={loading}
        >
          <option value="medium">Medium - Big cities</option>
          <option value="hard">Hard - All cities</option>
        </select>
      </div>

      {city && (
        <div className="card p-3 shadow-sm">
          <h3>{city.name}</h3>
          <p>
            <strong>Population:</strong> {city.population ? city.population.toLocaleString() : 'Unknown'}
          </p>

          <MapContainer
            center={[city.latitude, city.longitude]}
            zoom={6}
            style={{ height: '300px', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[city.latitude, city.longitude]}>
              <Popup>{city.name}</Popup>
            </Marker>
          </MapContainer>

          <div className="mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Type the country"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={showForm}
            />
            <button
              className="btn btn-success mt-2"
              onClick={handleGuess}
              disabled={showForm || !guess}
            >
              Guess
            </button>
          </div>

          <p className="mt-3 fs-5">{result}</p>

          {showForm && (
            <div className="mt-4">
              <button
                className="btn btn-outline-primary fw-bold"
                onClick={fetchCity}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#cce5ff')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
              >
                Next city <span style={{ fontSize: '1.2em' }}>►</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

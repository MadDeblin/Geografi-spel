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
  const [difficulty, setDifficulty] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0); // Håller koll på rätt gissningar
  const [questionCount, setQuestionCount] = useState(0); // Håller koll på antal frågor
  const [gameStarted, setGameStarted] = useState(false); // Styr om startsida visas


  const RAPIDAPI_KEY = 'e74f8ee797msh19e5d70d033f4e5p1af591jsn5ab4a61e0dfd';

  const fetchCity = async () => {
    try {
      setLoading(true);

      let params = {
        limit: 10,
        offset: Math.floor(Math.random() * 1000),
      };

      if (difficulty === 'easy') {
        // Easy = Big cities
        params.minPopulation = 500000;
        params.sort = '-population';
      } else if (difficulty === 'medium') {
        // Medium = All cities
        params.limit = 1;
        params.offset = Math.floor(Math.random() * 10000);
      } else if (difficulty === 'hard') {
        // Hard = All cities (flag only)
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

  if (!gameStarted) {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-4">🌍 Geografi-spelet</h1>
      <p className="lead mt-3 mb-4">
        Testa dina geografikunskaper – gissa land, se flaggor, kartor och samla poäng!
      </p>
      <button
        className="btn btn-primary btn-lg px-5 py-3"
        onClick={() => {
          setGameStarted(true);
          fetchCity(); 
        }}
      >
        Starta spelet
      </button>
    </div>
  );
}

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
          <option value="easy">Easy - Big cities</option>
          <option value="medium">Medium - All cities</option>
          <option value="hard">Hard - All cities (flag only)</option>
        </select>
      </div>

      
 
      {city && (
        <div className="card p-3 shadow-sm">
          <h3>{city.name}</h3>
          <p>
            <strong>Population:</strong> {city.population ? city.population.toLocaleString() : 'Unknown'}
          </p>

          {/* Visa flagga */}
          {city.countryCode && (
            <img
              src={`https://flagcdn.com/w160/${city.countryCode.toLowerCase()}.png`}
              alt={`Flag of ${city.country}`}
              style={{ width: '160px', height: 'auto', marginBottom: '1rem', borderRadius: '6px', boxShadow: '0 0 8px rgba(0,0,0,0.2)' }}
            />
          )}

          {/* Visa karta endast om difficulty är inte hard */}
          {difficulty !== 'hard' && (
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
          )}

          <div className="mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Type the country name"
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
              <h5>Personal question</h5>
              <p>Would you like to live in {city.name}?</p>
              <button
                className="btn btn-primary fw-bold d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
                onClick={fetchCity}
                style={{
                  borderRadius: '30px',
                  fontSize: '1.1rem',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Next city
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  className="bi bi-arrow-right-circle"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0-1A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"
                  />
                  <path
                    fillRule="evenodd"
                    d="M8.5 11a.5.5 0 0 1 0-1H10V7.5a.5.5 0 0 1 1 0v3a.5.5 0 0 1-.5.5H8.5z"
                  />
                  <path
                    fillRule="evenodd"
                    d="M10.354 7.646a.5.5 0 0 0-.708.708L11.293 9.5H7.5a.5.5 0 0 0 0 1h3.793l-1.647 1.646a.5.5 0 0 0 .708.708l2.5-2.5a.5.5 0 0 0 0-.708l-2.5-2.5z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

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
  const [gameStarted, setGameStarted] = useState(false); // Styr om stsartsida visas
  const [countryInfo, setCountryInfo] = useState(null); // Fakta om landet
  const [clue, setClue] = useState(null); // Håller ledtråd till spelaren
  const [usedClue, setUsedClue] = useState(false); // Om ledtråd används på aktuell fråga
  const [gameOver, setGameOver] = useState(false); // Om alla frågor är klara
  




  const RAPIDAPI_KEY = 'e74f8ee797msh19e5d70d033f4e5p1af591jsn5ab4a61e0dfd';

const [usedCountries, setUsedCountries] = useState([]); // För att hålla koll på använda länder

const fetchCountryInfo = async (countryCode) => {
  try {
    const res = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    setCountryInfo(res.data[0]);
  } catch (error) {
    console.error('Error fetching country info:', error);
    setCountryInfo(null);
  }
};

const fetchCity = async () => {
  try {
    setLoading(true);

    let attempts = 0;
    let maxAttempts = 10;
    let chosenCity = null;

    while (attempts < maxAttempts) {
      let params = {
        limit: 1,
      };

      if (difficulty === 'easy') {
        params.minPopulation = 500000;
        params.offset = Math.floor(Math.random() * 5000);
        params.sort = 'name';
      } else if (difficulty === 'medium' || difficulty === 'hard') {
        params.offset = Math.floor(Math.random() * 20000);
        params.sort = 'name';
      }

      const res = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
        params,
      });

      const cityCandidate = res.data.data[0];

      // Om vi inte redan använt detta land
      if (cityCandidate && !usedCountries.includes(cityCandidate.countryCode)) {
        chosenCity = cityCandidate;
        break;
      }

      attempts++;
    }

    if (!chosenCity) {
      console.warn("Kunde inte hitta unikt land efter flera försök.");
      setLoading(false);
      return;
    }

    setCity(chosenCity);
    fetchCountryInfo(chosenCity.countryCode);
    setResult('');
    setGuess('');
    setShowForm(false);
    setClue(null);
    setUsedClue(false);
    setLoading(false);

    // Lägg till landet i listan över använda
    setUsedCountries(prev => [...prev, chosenCity.countryCode]);
  } catch (error) {
    console.error('Error fetching city:', error);
    setLoading(false);
  }
};


const handleGuess = () => {
  if (!guess || !countryInfo) return;

  const normalizedGuess = guess.trim().toLowerCase();

  // Skapa en lista av möjliga namn att jämföra med
  const countryNames = [
    countryInfo.name.common?.toLowerCase(),
    countryInfo.name.official?.toLowerCase(),
    ...(countryInfo.altSpellings || []).map(s => s.toLowerCase())
  ];

  const isCorrect = countryNames.some(name => name === normalizedGuess);

  setResult(isCorrect ? '✅ Correct!' : `❌ Wrong! Correct answer: ${countryInfo.name.common}`);
  setShowForm(true);

  const pointsEarned = isCorrect ? (usedClue ? 1 : 2) : 0;
  setScore((prev) => prev + pointsEarned);
  setQuestionCount((prev) => prev + 1);

  if (questionCount + 1 >= 10) {
    setGameOver(true);
    saveScore(difficulty, score + pointsEarned);
  }
};


const saveScore = (level, finalScore) => {
  const existingScores = JSON.parse(localStorage.getItem('geoScores')) || {};
  existingScores[level] = finalScore;
  localStorage.setItem('geoScores', JSON.stringify(existingScores));
};

  const handleClue = () => {
  if (!countryInfo) return;

  // ger clues till splaren
  const clueText = `Första bokstaven i landets namn: ${countryInfo.name.common.charAt(0)}`;
  setClue(clueText);
  setUsedClue(true); 
};


  if (!gameStarted) {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-4">🌍 Geografi-spelet</h1>
      {localStorage.getItem('geoScores') && (
  <div className="alert alert-info mt-2">
    <h5>Dina tidigare resultat:</h5>
    <ul className="mb-0 text-start">
      {Object.entries(JSON.parse(localStorage.getItem('geoScores'))).map(([level, points]) => (
        <li key={level}>
          {level.charAt(0).toUpperCase() + level.slice(1)}: {points} poäng
        </li>
      ))}
    </ul>
  </div>
)}

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

if (gameOver) {
  return (
    <div className="container py-5 text-center">
      <h1>🎉 Spelet är slut!</h1>
      <p className="lead">Du fick <strong>{score}</strong> poäng av 20 möjliga på <strong>{difficulty}</strong>-nivån.</p>

      {/* Visa gamla resultat */}
      {localStorage.getItem('geoScores') && (
        <div className="alert alert-info mt-3">
          <h5>Dina tidigare resultat:</h5>
          <ul className="mb-0 text-start d-inline-block text-start">
            {Object.entries(JSON.parse(localStorage.getItem('geoScores'))).map(([level, points]) => (
              <li key={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}: {points} poäng
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spela igen */}
      <button
        className="btn btn-success mt-4 me-2"
        onClick={() => {
          setGameStarted(false);
          setScore(0);
          setQuestionCount(0);
          setGameOver(false);
          setUsedClue(false);
          setCity(null);
          setResult('');
          setClue(null);
        }}
      >
        🔁 Till startsidan
      </button>
    </div>
  );
}


  return (
    <div className="container py-4">
      <h1 className="mb-4">Guess the Country!</h1>
      <p className="text-muted mb-3">
  Fråga {questionCount + 1} av 10 | Poäng: {score}
</p>

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
{countryInfo && (
  <div className="mt-3">
    <h5>Country info:</h5>
    <ul>
      <li><strong>Region:</strong> {countryInfo.region}</li>
      <li><strong>Subregion:</strong> {countryInfo.subregion}</li>

      {(difficulty === 'easy' || difficulty === 'medium') && (
        <>
          <li><strong>Capital:</strong> {countryInfo.capital?.[0]}</li>
          <li><strong>Languagge:</strong> {Object.values(countryInfo.languages || {}).join(', ')}</li>
        </>
      )}

      {difficulty === 'easy' && (
        <li><strong>Currency:</strong> {Object.values(countryInfo.currencies || {}).map(c => c.name).join(', ')}</li>
      )}
    </ul>
  </div>
)}

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


<div className="d-flex gap-2 mt-2">
  <button className="btn btn-warning" onClick={handleClue} disabled={showForm}>
    Get clue
  </button>
  <button className="btn btn-danger" onClick={fetchCity}>
    Skip question
  </button>
</div>


          <p className="mt-3 fs-5">{result}</p>
          {clue && <p className="mt-2 text-info">{clue}</p>}


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

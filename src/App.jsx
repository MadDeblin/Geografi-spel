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
  const [countryInfo, setCountryInfo] = useState(null); // Fakta om landet
  const [clue, setClue] = useState(null); // Håller ledtråd till spelaren
  const [visitPreferences, setVisitPreferences] = useState([]); // Sparar svar på "vill du besöka?"
  const [gameOver, setGameOver] = useState(false);
  const [usedClue, setUsedClue] = useState(false);







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

      const fetchCountryInfo = async (countryCode) => {
  try {
    const res = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    setCountryInfo(res.data[0]);
  } catch (error) {
    console.error('Error fetching country info:', error);
    setCountryInfo(null);
  }
};
      let cities = res.data.data;

      const chosenCity = cities[Math.floor(Math.random() * cities.length)];
      const blockedCountries = ['CN', 'IN'];
      if (blockedCountries.includes(chosenCity.countryCode)) {
      // Hämta ny stad om det är Kina eller Indien. De vissas för ofta och det förstör spelet
      fetchCity();
      return;
    }


      setCity(chosenCity);
      fetchCountryInfo(chosenCity.countryCode);
      setClue(null);
      setUsedClue(false); 
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
  if (!guess || !countryInfo) return;

  const normalizedGuess = guess.trim().toLowerCase();

  // Vi kollar flera namn på landet: officiellt, vanligt, alternativa stavningar
  const countryNames = [
    countryInfo.name.common?.toLowerCase(),
    countryInfo.name.official?.toLowerCase(),
    ...(countryInfo.altSpellings || []).map(s => s.toLowerCase())
  ];

  const isCorrect = countryNames.some(name => name === normalizedGuess);

  setResult(isCorrect ? '✅ Correct!' : `❌ Wrong! Correct answer: ${countryInfo.name.common}`);
  setShowForm(true);

  // Poängberäkning: 2p utan ledtråd, 1p med
  const pointsEarned = isCorrect ? (usedClue ? 1 : 2) : 0;
  setScore((prev) => prev + pointsEarned);
  setQuestionCount((prev) => prev + 1);

  // ✅ LÄGG IN DETTA EXAKT HÄR:
  if (questionCount + 1 >= 10) {
    setGameOver(true); // spelet slutar → slutskärm visas
    saveScore(difficulty, score + pointsEarned); // spara slutresultatet
  }
};
const handleClue = () => {
  if (!countryInfo) return;

  const clueText = `Första bokstaven i landets namn: ${countryInfo.name.common.charAt(0)}`;
  setClue(clueText);
  setUsedClue(true); // ← viktigt för poängsystemet
};


const handleVisitAnswer = (answer) => {
  setVisitPreferences(prev => [
    ...prev,
    { city: city.name, country: city.country, answer }
  ]);
  fetchCity(); // direkt till nästa fråga efter svar
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

if (gameOver) {
  return (
    <div className="container py-5 text-center">
      <h1>🎉 Spelet är klart!</h1>
      <p className="lead">Du fick <strong>{score}</strong> poäng av 20 möjliga på <strong>{difficulty}</strong>-nivån.</p>

      {visitPreferences.length > 0 && (
        <>
          <h5 className="mt-4">Dina svar på: Would you like to visit...?</h5>
          <ul className="list-unstyled d-inline-block text-start">
            {visitPreferences.map((pref, index) => (
              <li key={index}>
                {pref.city}, {pref.country}: <strong>{pref.answer === 'yes' ? '✅ Ja' : '❌ Nej'}</strong>
              </li>
            ))}
          </ul>
        </>
      )}

      <button
        className="btn btn-success mt-4"
        onClick={() => {
          setGameStarted(false);
          setScore(0);
          setQuestionCount(0);
          setGameOver(false);
          setCity(null);
          setResult('');
          setGuess('');
          setShowForm(false);
          setUsedClue(false);
          setClue(null);
          setVisitPreferences([]);
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
      <p className="text-muted mb-3">Fråga {questionCount + 1} av 10 | Poäng: {score}</p>


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
            <form
  onSubmit={(e) => {
    e.preventDefault(); // förhindrar sida från att laddas om
    handleGuess();      // anropa gissningsfunktionen
  }}
>
  <input
    type="text"
    className="form-control"
    placeholder="Type the country name"
    value={guess}
    onChange={(e) => setGuess(e.target.value)}
    disabled={showForm}
  />
  <button
    type="submit"
    className="btn btn-success mt-2"
    disabled={showForm || !guess}
  >
    Guess
  </button>
</form>

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
    <p className="fw-semibold">Would you like to visit {city.name}?</p>
    <div className="d-flex gap-3 justify-content-center">
      <button className="btn btn-outline-success px-4" onClick={() => handleVisitAnswer('yes')}>
        Yes
      </button>
      <button className="btn btn-outline-danger px-4" onClick={() => handleVisitAnswer('no')}>
        No
      </button>
    </div>
  </div>
)}

        </div>
      )}
    </div>
  );
};

export default App;

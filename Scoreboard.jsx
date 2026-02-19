import React, { useState, useEffect } from 'react';

const VERSION = '0.2';

export default function Scoreboard() {
  const [players, setPlayers] = useState([]);
  const [factor, setFactor] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showSaveGame, setShowSaveGame] = useState(false);
  const [showLoadGame, setShowLoadGame] = useState(false);
  const [showSchockPopup, setShowSchockPopup] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [saveGameName, setSaveGameName] = useState('');
  const [schockData, setSchockData] = useState({ durchPlayer: '', verlorenPlayer: '', handaus: false, durchmarsch: false, phase: '1. Hälfte' });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('schocken_game') || '{}');
    setPlayers(data.players || []);
    setFactor(data.factor || 1);
  }, []);

  useEffect(() => {
    localStorage.setItem('schocken_game', JSON.stringify({ players, factor }));
  }, [players, factor]);

  const addPlayer = (name) => {
    if (!name.trim()) return;
    setPlayers(prev => [...prev, { name: name.trim(), verloren: 0, durchmarsch: 0 }]);
  };

  const saveGameByName = (name) => {
    if (!name.trim()) return;
    const saved = JSON.parse(localStorage.getItem('schocken_saved_games') || '[]');
    saved.push({ id: Date.now(), name, players, factor, date: new Date().toLocaleString() });
    localStorage.setItem('schocken_saved_games', JSON.stringify(saved));
    setShowSaveGame(false);
  };

  const loadGameById = (id) => {
    const saved = JSON.parse(localStorage.getItem('schocken_saved_games') || '[]');
    const g = saved.find(x => x.id === id);
    if (g) {
      setPlayers(g.players);
      setFactor(g.factor);
      setShowLoadGame(false);
    }
  };
  const exportCSV = () => {
    const rows = [['Name','Verloren','Durchmarsch','Gesamt']];
    players.forEach(p => {
      rows.push([p.name, p.verloren, p.durchmarsch, calculateTotal(p)]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `schocken_scoreboard_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const removePlayer = (idx) => {
    setPlayers(prev => prev.filter((_, i) => i !== idx));
  };

  const calculateTotal = (player) => {
    return ((player.verloren + player.durchmarsch) * factor).toFixed(2);
  };

  const resetGame = () => {
    if (window.confirm('Neue Runde starten? Alle Daten werden zurückgesetzt!')) {
      setPlayers([]);
      setFactor(1);
      localStorage.removeItem('schocken_game');
    }
  };

  const handleSchockSubmit = () => {
    setPlayers(prev => {
      const updated = [...prev];
      if (schockData.verlorenPlayer) {
        const p = updated[parseInt(schockData.verlorenPlayer)];
        if (schockData.phase === 'Finale' || schockData.durchmarsch) {
          p.verloren += 1;
        }
        if (schockData.durchmarsch) p.durchmarsch += 1;
      }
      return updated;
    });
    setShowSchockPopup(false);
    setSchockData({ durchPlayer: '', verlorenPlayer: '', handaus: false, durchmarsch: false, phase: '1. Hälfte' });
  };

  const togglePhase = (phase) => {
    if (schockData.durchmarsch) return;
    setSchockData(prev => ({ ...prev, phase }));
  };

  const toggleSwitch = (field) => {
    if (field === 'durchmarsch') {
      setSchockData(prev => ({ ...prev, durchmarsch: !prev.durchmarsch, phase: !prev.durchmarsch ? '2. Hälfte' : prev.phase }));
    } else {
      setSchockData(prev => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const appStyle = { padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: '0 auto', backgroundColor: darkMode ? '#121212' : '#fff', color: darkMode ? '#eee' : '#000', minHeight: '100vh' };
  const headerStyle = { textAlign: 'center', marginBottom: 20 };
  const buttonStyles = {
    green: { backgroundColor: '#4CAF50', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' },
    blue: { backgroundColor: '#1976d2', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' },
    black: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' },
    red: { backgroundColor: '#f44336', color: '#fff', border: 'none', padding: '18px 36px', borderRadius: 6, cursor: 'pointer', fontSize: '1.5em' },
    destructive: { backgroundColor: '#f44336', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }
  };
  const savedGames = JSON.parse(localStorage.getItem('schocken_saved_games') || '[]');

  return (
    <div style={appStyle}>
      <h1 style={headerStyle}>🎲🎲🎲 Schocken heißt das Spiel!</h1>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 15, alignItems: 'center' }}>
        <label>Einsatz:</label>
        <input type="number" value={factor} step="0.1" min="0.0" onChange={e => setFactor(parseFloat(e.target.value))} />
        <button onClick={resetGame} style={buttonStyles.green}>Neue Runde</button>
        <button onClick={() => setShowAddPlayer(true)} style={buttonStyles.blue}>Spieler hinzufügen</button>
        <button onClick={() => setShowLoadGame(true)} style={buttonStyles.black}>Spiel laden</button>
        <button onClick={() => setShowSaveGame(true)} style={buttonStyles.black}>Spiel speichern</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
        <button onClick={() => setShowSchockPopup(true)} style={buttonStyles.red}>Schock-Aus!</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', marginTop: 15 }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: darkMode ? '#333' : '#ddd' }}>Spieler</th>
              <th>Verloren</th>
              <th>Durchmarsch</th>
              <th>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <tr key={idx} style={{ textAlign: 'center', borderBottom: '1px solid #ccc' }}>
                <td style={{ backgroundColor: darkMode ? '#333' : '#eee' }}>{p.name}</td>
                <td>{p.verloren}</td>
                <td>{p.durchmarsch}</td>
                <td>{calculateTotal(p)}</td>
                <td><button onClick={() => removePlayer(idx)} style={buttonStyles.destructive}>X</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spieler hinzufügen Popup */}
      {showAddPlayer && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
          <div style={{ backgroundColor:'#fff', padding:20, borderRadius:8, minWidth:300 }}>
            <h3>Spieler hinzufügen</h3>
            <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Name eingeben" />
            <div style={{ marginTop:10, display:'flex', gap:10 }}>
              <button onClick={() => { addPlayer(newPlayerName); setNewPlayerName(''); setShowAddPlayer(false); }} style={buttonStyles.blue}>Hinzufügen</button>
              <button onClick={() => setShowAddPlayer(false)} style={buttonStyles.destructive}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Spiel speichern Popup */}
      {showSaveGame && (
        <div style={{ position:'fixed', top:0,left:0,width:'100%',height:'100%',backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
          <div style={{ backgroundColor:'#fff', padding:20, borderRadius:8, minWidth:300 }}>
            <h3>Spiel speichern</h3>
            <input value={saveGameName} onChange={e => setSaveGameName(e.target.value)} placeholder="Spielname" />
            <div style={{ marginTop:10, display:'flex', gap:10 }}>
              <button onClick={() => saveGameByName(saveGameName)} style={buttonStyles.black}>Speichern</button>
              <button onClick={() => setShowSaveGame(false)} style={buttonStyles.destructive}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Spiel laden Popup */}
      {showLoadGame && (
        <div style={{ position:'fixed', top:0,left:0,width:'100%',height:'100%',backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
          <div style={{ backgroundColor:'#fff', padding:20, borderRadius:8, minWidth:300 }}>
            <h3>Spiel laden</h3>
            {savedGames.map(g => (
              <div key={g.id} style={{ display:'flex', gap:10, marginTop:5 }}>
                <span style={{ flex:1 }}>{g.name} ({g.date})</span>
                <button onClick={() => loadGameById(g.id)} style={buttonStyles.black}>Laden</button>
              </div>
            ))}
            <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setShowLoadGame(false)} style={buttonStyles.destructive}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Schock-Aus Popup */}
      {showSchockPopup && (
        <div style={{ position:'fixed', top:0,left:0,width:'100%',height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
          <div style={{ backgroundColor:'#fff', padding:20, borderRadius:8, minWidth:350 }}>
            <h3>Schock-Aus!</h3>
            <div style={{ marginBottom:10 }}>
              <label>Durch Spieler:</label>
              <select value={schockData.durchPlayer} onChange={e => setSchockData(prev => ({ ...prev, durchPlayer: e.target.value }))}>
                <option value="">---</option>
                {players.map((p, idx) => <option key={idx} value={idx}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label>Handaus:</label>
              <input type="checkbox" checked={schockData.handaus} onChange={() => toggleSwitch('handaus')} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label>Verloren Spieler:</label>
              <select value={schockData.verlorenPlayer} onChange={e => setSchockData(prev => ({ ...prev, verlorenPlayer: e.target.value }))}>
                <option value="">---</option>
                {players.map((p, idx) => <option key={idx} value={idx}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label>Durchmarsch:</label>
              <input type="checkbox" checked={schockData.durchmarsch} onChange={() => toggleSwitch('durchmarsch')} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label>Phase:</label>
              <div>
                {['1. Hälfte','2. Hälfte','Finale'].map(phase => (
                  <label key={phase} style={{ marginRight:10 }}>
                    <input type="radio" checked={schockData.phase===phase} onChange={() => togglePhase(phase)} disabled={schockData.durchmarsch} /> {phase}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={handleSchockSubmit} style={buttonStyles.red}>OK</button>
              <button onClick={() => setShowSchockPopup(false)} style={buttonStyles.destructive}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}


      <footer style={{ marginTop:20, textAlign:'center', fontSize:12, color:'#666' }}>
        Scoreboard Version {VERSION} | <button onClick={() => setDarkMode(!darkMode)} style={{ ...buttonStyles.blue, padding:'2px 6px' }}>{darkMode ? 'Light Mode':'Dark Mode'}</button>
      </footer>
    </div>
  );
}

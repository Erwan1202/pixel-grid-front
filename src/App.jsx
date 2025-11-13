import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client'; 
import './App.css';

const API_URL = 'http://localhost:3000';
const GRID_SIZE = 50;

const socket = io(API_URL);

function App() {
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentColor, setCurrentColor] = useState('#FF0000');

  const fetchGrid = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/grid`);
      const validPixels = response.data.filter(p => 
        p.x_coord >= 1 && p.x_coord <= GRID_SIZE &&
        p.y_coord >= 1 && p.y_coord <= GRID_SIZE
      );
      setPixels(validPixels);
    } catch (error) {
      console.error("Erreur fetchGrid:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid();

    socket.on('connect', () => {
      console.log('🔌 Connecté au serveur WebSocket (front-end)');
    });

    socket.on('new_pixel', (newPixel) => {
      setPixels(prevPixels => [
        ...prevPixels.filter(p => !(p.x_coord === newPixel.x && p.y_coord === newPixel.y)),
        { x_coord: newPixel.x, y_coord: newPixel.y, color: newPixel.color }
      ]);
    });

    return () => {
      socket.off('connect');
      socket.off('new_pixel');
    };
  }, []); 

  const handlePlacePixel = async (x, y) => {
    const pixelData = { x, y, color: currentColor };

    try {

      await axios.post(`${API_URL}/api/grid/pixel`, pixelData);


    } catch (error) {
      if (error.response && error.response.status === 429) {
        alert(error.response.data.message); 
      } else {
        console.error("Erreur placePixel:", error);
        alert("Erreur lors du placement du pixel.");
      }
    }
  };


  
  const renderGridCells = () => {
    const cells = [];
    for (let y = 1; y <= GRID_SIZE; y++) {
      for (let x = 1; x <= GRID_SIZE; x++) {
        cells.push(
          <div 
            key={`${x}-${y}`}
            className="grid-cell"
            style={{ '--x': x, '--y': y }}
            onClick={() => handlePlacePixel(x, y)} 
          ></div>
        );
      }
    }
    return cells;
  };

  if (loading) {
    return <div>Chargement de la grille...</div>;
  }

  return (
    <div className="App">
      <h1>PixelGrid (Front-End)</h1>
      <div className="color-picker">
        <label>Couleur :</label>
        <input 
          type="color" 
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
        />
      </div>
      
      <div className="pixel-grid-container">
        {renderGridCells()}
        {pixels.map((pixel, index) => (
          <div 
            key={index}
            className="pixel"
            style={{
              '--x': pixel.x_coord,
              '--y': pixel.y_coord,
              '--color': pixel.color
            }}
          >
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
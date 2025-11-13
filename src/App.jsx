// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3000'; // On met l'URL de base
const GRID_SIZE = 50;

function App() {
  const [pixels, setPixels] = useState([]); // Pixels de l'API
  const [loading, setLoading] = useState(true);
  const [currentColor, setCurrentColor] = useState('#FF0000'); // Couleur sélectionnée

  // Fonction pour charger la grille (ne change pas)
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

  // Chargement initial
  useEffect(() => {
    fetchGrid();
  }, []);

  /*
   * (US-5): Fonction pour PLACER un pixel
   */
  const handlePlacePixel = async (x, y) => {
    // 1. (Auth) Pour l'instant, on ignore l'authentification
    // const token = "votre-jwt-token"; 
    // const config = { headers: { Authorization: `Bearer ${token}` } };
    
    const pixelData = {
      x: x,
      y: y,
      color: currentColor
    };

    try {
      // 2. Appel API POST (on envoie x, y, color)
      await axios.post(`${API_URL}/api/grid/pixel`, pixelData /*, config */);

      // 3. Mise à jour "Optimiste" de l'état
      // On ajoute le nouveau pixel à notre 'state' React
      // sans devoir recharger toute la grille.
      setPixels(prevPixels => [
        ...prevPixels.filter(p => !(p.x_coord === x && p.y_coord === y)), // Enlève l'ancien à (x,y)
        { x_coord: x, y_coord: y, color: currentColor } // Ajoute le nouveau
      ]);

    } catch (error) {
      // Si on reçoit une erreur 429 (Rate Limit), on l'affiche
      if (error.response && error.response.status === 429) {
        alert(error.response.data.message); // Affiche le message de votre API
      } else {
        console.error("Erreur placePixel:", error);
        alert("Erreur lors du placement du pixel.");
      }
    }
  };

  // Fonction pour générer les cases vides (cliquables)
  const renderGridCells = () => {
    const cells = [];
    for (let y = 1; y <= GRID_SIZE; y++) {
      for (let x = 1; x <= GRID_SIZE; x++) {
        cells.push(
          <div 
            key={`${x}-${y}`}
            className="grid-cell"
            style={{ '--x': x, '--y': y }}
            // Au clic, on appelle l'API
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

      {/* Le sélecteur de couleur */}
      <div className="color-picker">
        <label>Couleur :</label>
        <input 
          type="color" 
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
        />
      </div>
      
      <div className="pixel-grid-container">
        
        {/* Grille de fond (pour les clics) */}
        {renderGridCells()}

        {/* Pixels placés (venus de l'API) */}
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
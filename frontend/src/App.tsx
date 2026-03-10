import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import { UiProvider } from './contexts/UiContext';
import { PaletizadoraProvider } from './contexts/PaletizadoraContext';
import Palletizadora from './pages/paletizadora/paletizadora';
import Productos from './pages/productos/Productos';

function App() {
  return (
    <UiProvider>
      <PaletizadoraProvider>
        <nav className="app-nav" aria-label="Navegación principal">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'app-nav-link active' : 'app-nav-link'
            }
          >
            Paletizadora
          </NavLink>
          <NavLink
            to="/productos"
            className={({ isActive }) =>
              isActive ? 'app-nav-link active' : 'app-nav-link'
            }
          >
            Productos
          </NavLink>
        </nav>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Palletizadora />} />
            <Route path="/productos" element={<Productos />} />
          </Routes>
        </main>
      </PaletizadoraProvider>
    </UiProvider>
  );
}

export default App;

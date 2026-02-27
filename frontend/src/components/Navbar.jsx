import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { HiMenu, HiX, HiUpload, HiSearch, HiUser, HiLogout } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700" onClick={() => setOpen(false)}>
            <span>UniDocs</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-blue-700 transition">Accueil</Link>
            <Link to="/search" className="hover:text-blue-700 transition flex items-center gap-1">
              <HiSearch className="text-lg" /> Rechercher
            </Link>
            {user && (
              <Link to="/upload" className="hover:text-blue-700 transition flex items-center gap-1">
                <HiUpload className="text-lg" /> Partager
              </Link>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <HiUser className="inline mr-1" />
                  {user.prenom}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded text-sm text-white transition"
                >
                  <HiLogout className="inline mr-1" /> Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="bg-blue-700 hover:bg-blue-600 px-4 py-1.5 rounded text-sm text-white transition">
                  Connexion
                </Link>
                <Link to="/register" className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-4 py-1.5 rounded text-sm font-medium transition">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button className="md:hidden p-2 text-blue-700" onClick={() => setOpen(!open)}>
            {open ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-blue-200 px-4 pb-4 shadow">
          <Link to="/" className="block py-2 hover:text-blue-700" onClick={() => setOpen(false)}>
            Accueil
          </Link>
          <Link to="/search" className="block py-2 hover:text-blue-700 flex items-center gap-1" onClick={() => setOpen(false)}>
            <HiSearch className="inline mr-1" /> Rechercher
          </Link>
          {user && (
            <Link to="/upload" className="block py-2 hover:text-blue-700 flex items-center gap-1" onClick={() => setOpen(false)}>
              <HiUpload className="inline mr-1" /> Partager un document
            </Link>
          )}
          <hr className="border-blue-200 my-2" />
          {user ? (
            <>
              <p className="py-2 text-gray-600 text-sm flex items-center gap-1">
                <HiUser className="inline mr-1" /> {user.prenom} {user.nom}
              </p>
              <button onClick={handleLogout} className="block py-2 text-red-500 hover:text-red-700">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2" onClick={() => setOpen(false)}>Connexion</Link>
              <Link to="/register" className="block py-2 text-amber-500" onClick={() => setOpen(false)}>Inscription</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

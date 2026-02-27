import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiUpload, HiUser, HiSearch, HiStar, HiDownload } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { universitesAPI, documentsAPI, matieresAPI } from '../api/client';

export default function HomePage() {
  const { user } = useAuth();
  const [universite, setUniversite] = useState(null);
  const [filiere, setFiliere] = useState(null);
  const [plusTelecharges, setPlusTelecharges] = useState([]);
  const [recents, setRecents] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) {
      universitesAPI.getById(user.universite_id).then(res => setUniversite(res.data));

      // Récupérer tous les documents et trier côté front
      documentsAPI.getAll({ universite_id: user.universite_id, filiere: user.filiere, niveau: user.niveau })
        .then(res => {
          const docs = res.data || [];
          // Plus téléchargés
          const sortedByDownloads = [...docs].sort((a, b) => (b.telechargements || 0) - (a.telechargements || 0));
          setPlusTelecharges(sortedByDownloads.slice(0, 5));
          // Récents
          const sortedByDate = [...docs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setRecents(sortedByDate.slice(0, 5));
        });

      matieresAPI.getAll({ universite_id: user.universite_id, filiere: user.filiere, niveau: user.niveau })
        .then(res => setMatieres(res.data || []));
    } else {
      // Non connecté : juste les plus téléchargés
      documentsAPI.getAll().then(res => {
        const docs = res.data || [];
        const sorted = [...docs].sort((a, b) => (b.telechargements || 0) - (a.telechargements || 0));
        setPlusTelecharges(sorted.slice(0, 5));
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFiliere({ nom: user.filiere, niveau: user.niveau });
    } else {
      setFiliere(null);
    }
  }, [user]);

  // Version non connectée
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800">La bibliothèque numérique des étudiants</h1>
          <p className="text-gray-600">Trouvez anciens sujets, TD et cours de votre filière.</p>
          <div className="flex justify-center gap-4 mt-6">
            <Link to="/login" className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold">Se connecter</Link>
            <Link to="/register" className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-6 py-2 rounded-lg font-semibold">Créer un compte</Link>
          </div>
        </section>
        {/* Documents populaires */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Les plus téléchargés</h2>
          <div className="space-y-3">
            {plusTelecharges.map(doc => (
              <div key={doc.id} className="bg-white rounded shadow flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-gray-900">{doc.titre}</div>
                  <div className="text-xs text-gray-500">{doc.matiere} — {doc.annee}</div>
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <HiDownload /> <span className="font-bold">{doc.telechargements}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Version connectée
  return (
    <div className="max-w-3xl mx-auto px-2 py-6 space-y-8">
      {/* Header minimal */}
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-2xl text-blue-800">UniDocs</span>
          {universite && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">{universite.sigle}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/upload" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 text-sm font-medium">
            <HiUpload /> Déposer
          </Link>
          <Link to="/profile" className="flex items-center gap-1 text-gray-700 hover:text-blue-700 font-medium">
            <HiUser /> {user.prenom}
          </Link>
        </div>
      </header>

      {/* Message personnalisé */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Bonjour {user.prenom} 👋
        </h2>
        {filiere && (
          <p className="text-gray-600">
            Documents pour <span className="font-bold">{filiere.nom} – {filiere.niveau}</span>
          </p>
        )}
      </section>

      {/* Barre de recherche */}
      <section>
        <form
          className="flex items-center gap-2 bg-white rounded-lg shadow px-3 py-2"
          onSubmit={e => { e.preventDefault(); window.location.href = `/search?q=${encodeURIComponent(search)}`; }}
        >
          <HiSearch className="text-xl text-blue-700" />
          <input
            type="text"
            className="flex-1 outline-none bg-transparent text-base"
            placeholder="Rechercher une matière, un sujet, un cours..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg font-semibold text-sm">
            Rechercher
          </button>
        </form>
      </section>

      {/* Les plus téléchargés */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Les plus téléchargés</h3>
        <div className="space-y-3">
          {plusTelecharges.map(doc => (
            <div key={doc.id} className="bg-white rounded shadow flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-gray-900">{doc.titre}</div>
                <div className="text-xs text-gray-500">{doc.matiere} — {doc.annee}</div>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <HiStar /> <span className="font-bold">{doc.note || '4.5'}</span>
                <HiDownload /> <span className="font-bold">{doc.telechargements}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-right mt-2">
          <Link to="/search?sort=top" className="text-blue-700 hover:underline text-sm font-medium">Voir tout</Link>
        </div>
      </section>

      {/* Récemment ajoutés */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Récemment ajoutés</h3>
        <div className="space-y-3">
          {recents.map(doc => (
            <div key={doc.id} className="bg-white rounded shadow flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-gray-900">{doc.titre}</div>
                <div className="text-xs text-gray-500">{doc.matiere} — {doc.annee}</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div className="text-right mt-2">
          <Link to="/search?sort=recent" className="text-blue-700 hover:underline text-sm font-medium">Voir tout</Link>
        </div>
      </section>

      {/* Parcourir par matière */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Parcourir par matière</h3>
        <div className="flex flex-wrap gap-2">
          {matieres.map(m => (
            <Link
              key={m.id}
              to={`/matieres/${m.id}`}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition"
            >
              {m.nom}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

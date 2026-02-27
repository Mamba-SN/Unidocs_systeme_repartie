import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { universitesAPI, filieresAPI } from '../api/client';
import { NIVEAUX } from '../utils/constants';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    universite_id: '',
    filiere_id: '',
    niveau: '',
  });
  const [universites, setUniversites] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Charger les universités au montage
  useEffect(() => {
    universitesAPI.getAll().then((res) => setUniversites(res.data)).catch(console.error);
  }, []);

  // Charger les filières quand l'université change
  useEffect(() => {
    if (form.universite_id) {
      filieresAPI
        .getAll({ universite_id: form.universite_id })
        .then((res) => setFilieres(res.data))
        .catch(console.error);
    } else {
      setFilieres([]);
    }
  }, [form.universite_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Réinitialiser la filière si on change d'université
      if (name === 'universite_id') next.filiere_id = '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        universite_id: form.universite_id ? Number(form.universite_id) : null,
        filiere_id: form.filiere_id ? Number(form.filiere_id) : null,
        niveau: form.niveau || null,
      };
      await register(payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Créer un compte
          </h1>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom / Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  required
                  value={form.prenom}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  id="nom"
                  name="nom"
                  required
                  value={form.nom}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="votre@email.com"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="mot_de_passe"
                name="mot_de_passe"
                type="password"
                required
                minLength={6}
                value={form.mot_de_passe}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="6 caractères minimum"
              />
            </div>

            {/* Université */}
            <div>
              <label htmlFor="universite_id" className="block text-sm font-medium text-gray-700 mb-1">
                Université <span className="text-gray-400">(optionnel)</span>
              </label>
              <select
                id="universite_id"
                name="universite_id"
                value={form.universite_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="">— Choisir —</option>
                {universites.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.sigle} — {u.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Filière + Niveau (conditionnels) */}
            {form.universite_id && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="filiere_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Filière
                  </label>
                  <select
                    id="filiere_id"
                    name="filiere_id"
                    value={form.filiere_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">— Choisir —</option>
                    {filieres.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="niveau" className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau
                  </label>
                  <select
                    id="niveau"
                    name="niveau"
                    value={form.niveau}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">— Choisir —</option>
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {submitting ? 'Inscription…' : "S'inscrire"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-700 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUpload } from 'react-icons/hi';
import { universitesAPI, filieresAPI, matieresAPI, documentsAPI } from '../api/client';
import { DOCUMENT_TYPES, NIVEAUX, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '../utils/constants';
import { formatFileSize } from '../utils/helpers';

export default function UploadPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titre: '',
    description: '',
    type: '',
    annee_academique: '',
    universite_id: '',
    filiere_id: '',
    niveau: '',
    matiere_id: '',
  });
  const [fichier, setFichier] = useState(null);

  const [universites, setUniversites] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [matieres, setMatieres] = useState([]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Charger les universités
  useEffect(() => {
    universitesAPI.getAll().then((res) => setUniversites(res.data)).catch(console.error);
  }, []);

  // Charger les filières
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

  // Charger les matières
  useEffect(() => {
    if (form.filiere_id) {
      const params = { filiere_id: form.filiere_id };
      if (form.niveau) params.niveau = form.niveau;
      matieresAPI
        .getAll(params)
        .then((res) => setMatieres(res.data))
        .catch(console.error);
    } else {
      setMatieres([]);
    }
  }, [form.filiere_id, form.niveau]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'universite_id') {
        next.filiere_id = '';
        next.matiere_id = '';
      }
      if (name === 'filiere_id' || name === 'niveau') {
        next.matiere_id = '';
      }
      return next;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Format non autorisé. Formats acceptés : ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux. Taille max : ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setError('');
    setFichier(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fichier) {
      setError('Veuillez sélectionner un fichier');
      return;
    }
    if (!form.matiere_id) {
      setError('Veuillez sélectionner une matière');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('fichier', fichier);
      formData.append('titre', form.titre);
      formData.append('description', form.description);
      formData.append('type', form.type);
      formData.append('matiere_id', form.matiere_id);
      formData.append('annee_academique', form.annee_academique);

      const res = await documentsAPI.upload(formData);
      navigate(`/documents/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'upload");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Partager un document</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titre */}
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">
              Titre du document *
            </label>
            <input
              id="titre"
              name="titre"
              required
              value={form.titre}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Ex: Cours d'Algorithmique — Chapitre 3"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type de document *
            </label>
            <select
              id="type"
              name="type"
              required
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">— Choisir —</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Université → Filière → Niveau → Matière */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="universite_id" className="block text-sm font-medium text-gray-700 mb-1">
                Université *
              </label>
              <select
                id="universite_id"
                name="universite_id"
                required
                value={form.universite_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="">— Choisir —</option>
                {universites.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.sigle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filiere_id" className="block text-sm font-medium text-gray-700 mb-1">
                Filière *
              </label>
              <select
                id="filiere_id"
                name="filiere_id"
                required
                value={form.filiere_id}
                onChange={handleChange}
                disabled={!form.universite_id}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:bg-gray-100"
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
                <option value="">— Tous —</option>
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="matiere_id" className="block text-sm font-medium text-gray-700 mb-1">
                Matière *
              </label>
              <select
                id="matiere_id"
                name="matiere_id"
                required
                value={form.matiere_id}
                onChange={handleChange}
                disabled={!form.filiere_id}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:bg-gray-100"
              >
                <option value="">— Choisir —</option>
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} ({m.niveau})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Année académique */}
          <div>
            <label htmlFor="annee_academique" className="block text-sm font-medium text-gray-700 mb-1">
              Année académique
            </label>
            <input
              id="annee_academique"
              name="annee_academique"
              value={form.annee_academique}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Ex: 2025-2026"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              placeholder="Ajoutez une description pour aider les autres étudiants…"
            />
          </div>

          {/* Fichier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier * <span className="text-gray-400">(max {formatFileSize(MAX_FILE_SIZE)})</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              <HiUpload className="mx-auto text-3xl text-gray-400 mb-2" />
              <input
                type="file"
                onChange={handleFileChange}
                accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {fichier && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {fichier.name} ({formatFileSize(fichier.size)})
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-lg"
          >
            {submitting ? 'Envoi en cours…' : 'Partager le document'}
          </button>
        </form>
      </div>
    </div>
  );
}

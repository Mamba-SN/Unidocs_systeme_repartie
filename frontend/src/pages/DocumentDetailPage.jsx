import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiDownload, HiStar, HiUser, HiCalendar, HiDocument } from 'react-icons/hi';
import { documentsAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { DOCUMENT_TYPES } from '../utils/constants';
import { formatFileSize, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteNote, setVoteNote] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    documentsAPI
      .getOne(id)
      .then((res) => setDoc(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (note) => {
    if (!user) return;
    setVoteLoading(true);
    try {
      const res = await documentsAPI.vote(id, note);
      setVoteNote(note);
      setDoc((prev) => ({ ...prev, note_moyenne: res.data.note_moyenne }));
    } catch (err) {
      console.error(err);
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Document introuvable</p>
        <Link to="/search" className="text-blue-700 hover:underline mt-4 inline-block">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  const typeLabel =
    DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label || doc.type;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            {typeLabel}
          </span>
          <span className="text-xs text-gray-400 uppercase font-mono">
            {doc.format}
          </span>
          {doc.annee_academique && (
            <span className="text-xs text-gray-400">{doc.annee_academique}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{doc.titre}</h1>

        {doc.description && (
          <p className="text-gray-600 mb-4">{doc.description}</p>
        )}

        {/* Métadonnées */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1.5">
            <HiUser className="text-blue-500" />
            <span>{doc.auteur || 'Anonyme'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiCalendar className="text-blue-500" />
            <span>{formatDate(doc.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiDocument className="text-blue-500" />
            <span>{formatFileSize(doc.taille)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiDownload className="text-blue-500" />
            <span>{doc.nb_telechargements} téléchargement{doc.nb_telechargements !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Matière */}
        {doc.matiere && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium text-gray-700">Matière :</span> {doc.matiere}
          </p>
        )}

        {/* Bouton télécharger */}
        <a
          href={documentsAPI.downloadUrl(doc.id)}
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          download
        >
          <HiDownload className="text-xl" />
          Télécharger ({formatFileSize(doc.taille)})
        </a>
      </div>

      {/* Notation */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Noter ce document</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleVote(n)}
                  disabled={voteLoading}
                  className={`text-2xl transition ${
                    n <= voteNote
                      ? 'text-amber-400'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                  aria-label={`Note ${n}`}
                >
                  <HiStar />
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              Moyenne : <strong>{doc.note_moyenne || '—'}</strong>/5
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

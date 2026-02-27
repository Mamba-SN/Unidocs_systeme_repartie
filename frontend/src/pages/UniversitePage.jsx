import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { universitesAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UniversitePage() {
  const { id } = useParams();
  const [universite, setUniversite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    universitesAPI
      .getOne(id)
      .then((res) => setUniversite(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  if (!universite) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Université introuvable</p>
        <Link to="/" className="text-blue-700 hover:underline mt-4 inline-block">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-xl p-6 sm:p-8">
        <span className="bg-white/20 text-sm font-bold px-3 py-1 rounded-full">
          {universite.sigle}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-3">{universite.nom}</h1>
        <p className="text-blue-100 mt-1">📍 {universite.ville}</p>
      </div>

      {/* Filières */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Filières ({universite.filieres?.length || 0})
        </h2>

        {universite.filieres?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universite.filieres.map((f) => (
              <Link
                key={f.id}
                to={`/search?universite_id=${universite.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition p-4 group"
              >
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition">
                  {f.nom}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Aucune filière enregistrée pour cette université.</p>
        )}
      </section>
    </div>
  );
}

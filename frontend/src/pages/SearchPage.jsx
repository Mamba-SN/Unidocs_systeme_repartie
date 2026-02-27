import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiSearch } from 'react-icons/hi';
import { searchAPI, documentsAPI, universitesAPI } from '../api/client';
import { DOCUMENT_TYPES, NIVEAUX } from '../utils/constants';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [universiteId, setUniversiteId] = useState(searchParams.get('universite_id') || '');
  const [niveau, setNiveau] = useState(searchParams.get('niveau') || '');

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [universites, setUniversites] = useState([]);

  // Charger les universités pour le filtre
  useEffect(() => {
    universitesAPI.getAll().then((res) => setUniversites(res.data)).catch(console.error);
  }, []);

  const doSearch = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        let res;
        if (query.trim()) {
          res = await searchAPI.search({
            q: query.trim(),
            type: type || undefined,
            page: pageNum,
          });
        } else {
          res = await documentsAPI.getAll({
            type: type || undefined,
            universite_id: universiteId || undefined,
            niveau: niveau || undefined,
            page: pageNum,
          });
        }
        const data = res.data;
        setResults(data.documents);
        setTotal(data.total);
        setPage(data.page);
        setPages(data.pages);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query, type, universiteId, niveau]
  );

  // Rechercher au montage et au changement de filtres
  useEffect(() => {
    doSearch(1);
  }, [doSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (query) params.q = query;
    if (type) params.type = type;
    if (universiteId) params.universite_id = universiteId;
    if (niveau) params.niveau = niveau;
    setSearchParams(params);
    doSearch(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rechercher des documents</h1>

      {/* Barre de recherche + filtres */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Champ texte */}
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="Rechercher par titre, matière, description…"
          />
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tous les types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={universiteId}
            onChange={(e) => setUniversiteId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Toutes les universités</option>
            {universites.map((u) => (
              <option key={u.id} value={u.id}>
                {u.sigle}
              </option>
            ))}
          </select>

          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tous les niveaux</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-700 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition"
        >
          Rechercher
        </button>
      </form>

      {/* Résultats */}
      {loading ? (
        <LoadingSpinner className="min-h-[30vh]" />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {total} document{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
          </p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Aucun document trouvé</p>
              <p className="text-sm mt-1">Essayez avec d&apos;autres termes ou filtres</p>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => doSearch(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                    p === page
                      ? 'bg-blue-700 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

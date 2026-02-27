import { Link } from 'react-router-dom';
import { HiDownload, HiStar, HiEye } from 'react-icons/hi';
import { formatFileSize, formatDate, truncateText } from '../utils/helpers';
import { DOCUMENT_TYPES } from '../utils/constants';

const TYPE_COLORS = {
  cours: 'bg-blue-100 text-blue-800',
  examen: 'bg-red-100 text-red-800',
  td: 'bg-green-100 text-green-800',
  tp: 'bg-purple-100 text-purple-800',
  expose: 'bg-amber-100 text-amber-800',
};

export default function DocumentCard({ document }) {
  const typeLabel =
    DOCUMENT_TYPES.find((t) => t.value === document.type)?.label || document.type;
  const colorClass = TYPE_COLORS[document.type] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition p-4 flex flex-col justify-between">
      <div>
        {/* En-tête : type + format */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
            {typeLabel}
          </span>
          <span className="text-xs text-gray-400 uppercase font-mono">
            {document.format}
          </span>
        </div>

        {/* Titre */}
        <h3 className="font-semibold text-gray-900 mb-1 leading-tight">
          <Link to={`/documents/${document.id}`} className="hover:text-blue-700 transition">
            {truncateText(document.titre, 80)}
          </Link>
        </h3>

        {/* Matière */}
        {document.matiere && (
          <p className="text-sm text-gray-500 mb-1">{document.matiere}</p>
        )}

        {/* Description */}
        {document.description && (
          <p className="text-sm text-gray-400 mb-3">
            {truncateText(document.description, 120)}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {/* Note */}
          <span className="flex items-center gap-0.5" title="Note moyenne">
            <HiStar className="text-amber-400" />
            {document.note_moyenne > 0 ? document.note_moyenne : '—'}
          </span>

          {/* Téléchargements */}
          <span className="flex items-center gap-0.5" title="Téléchargements">
            <HiDownload />
            {document.nb_telechargements}
          </span>

          {/* Taille */}
          <span>{formatFileSize(document.taille)}</span>
        </div>

        <span>{formatDate(document.created_at)}</span>
      </div>
    </div>
  );
}

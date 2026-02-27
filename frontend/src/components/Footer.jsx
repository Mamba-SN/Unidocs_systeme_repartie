export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          {/* Marque */}
          <div>
            <h4 className="text-white font-semibold mb-2 text-lg">UniDocs</h4>
            <p>
              Plateforme de partage de documents universitaires au Sénégal.<br />
              Cours, examens, TD et TP centralisés et accessibles.
            </p>
          </div>

          {/* Universités */}
          <div>
            <h4 className="text-white font-semibold mb-2 text-lg">Universités</h4>
            <ul className="space-y-1">
              <li>UCAD — Dakar</li>
              <li>UGB — Saint-Louis</li>
              <li>UADB — Bambey</li>
              <li>UASZ — Ziguinchor</li>
              <li>UT — Thiès</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-2 text-lg">À propos</h4>
            <p>Développé par <span className="text-blue-400 font-semibold">Serigne Mbacke Ndiaye</span></p>
            <p className="mt-1">Fait avec ❤️ au Sénégal</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-xs">
          © {new Date().getFullYear()} UniDocs. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaImages,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/ConsultaDocumentos.css";

export default function ConsultaDocumentos() {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(
    () => new Date().toISOString().slice(0, 10) // default hoje, igual PHP
  );
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros adicionais (somente no front)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  const [onlyComplete, setOnlyComplete] = useState(false);

  // Modal de preview
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState("conferencia");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const navigate = useNavigate();

  // Carrega documentos da API sempre que nota ou data mudarem
  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          // Se tiver nota, ignora data (igual PHP)
          params.append("nota", search.trim());
        } else if (filterDate) {
          params.append("data", filterDate);
        }

        const queryString = params.toString();
        const url = `http://localhost:5000/api/documentos${
          queryString ? `?${queryString}` : ""
        }`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Erro na resposta da API");
        }
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar documentos.");
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [search, filterDate]);

  // Fecha modal com ESC e navega com setas
  useEffect(() => {
    if (!previewDoc) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setPreviewDoc(null);
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDoc, activePreviewTab, activeImageIndex]);

  const toggleFilters = () => {
    setFiltersOpen((prev) => !prev);
  };

  const openPreview = (doc) => {
    setPreviewDoc(doc);
    setActivePreviewTab("conferencia");
    setActiveImageIndex(0);
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setActiveImageIndex(0);
  };

  const hasAnyImage = (doc) => {
    const imgs = doc.imagens || {};
    return (
      (imgs.conferencia && imgs.conferencia.length > 0) ||
      (imgs.carga && imgs.carga.length > 0) ||
      (imgs.canhoto && imgs.canhoto.length > 0)
    );
  };

  const isDocComplete = (doc) => {
    const imgs = doc.imagens || {};
    return (
      imgs.conferencia?.length > 0 &&
      imgs.carga?.length > 0 &&
      imgs.canhoto?.length > 0
    );
  };

  const getActiveImageList = (doc, tab) => {
    if (!doc) return [];
    const imagens = doc.imagens || {};
    if (tab === "conferencia") return imagens.conferencia || [];
    if (tab === "carga") return imagens.carga || [];
    return imagens.canhoto || [];
  };

  const handlePrevImage = () => {
    if (!previewDoc) return;
    const list = getActiveImageList(previewDoc, activePreviewTab);
    if (!list.length) return;

    setActiveImageIndex((prev) =>
      prev <= 0 ? list.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!previewDoc) return;
    const list = getActiveImageList(previewDoc, activePreviewTab);
    if (!list.length) return;

    setActiveImageIndex((prev) =>
      prev >= list.length - 1 ? 0 : prev + 1
    );
  };

  // Filtros que continuam no front (ordenar + NF completas)
  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (onlyComplete) {
      result = result.filter((doc) => isDocComplete(doc));
    }

    // Ordenação por data
    result.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      if (sortOrder === "asc") return dateA - dateB;
      return dateB - dateA;
    });

    return result;
  }, [documents, onlyComplete, sortOrder]);

  const renderImagesPreview = () => {
    if (!previewDoc) return null;

    const list = getActiveImageList(previewDoc, activePreviewTab);

    if (!list.length) {
      return (
        <div className="preview-empty">
          Nenhuma imagem encontrada para essa categoria.
        </div>
      );
    }

    const currentIndex =
      activeImageIndex >= list.length ? 0 : activeImageIndex;
    const currentSrc = list[currentIndex];

    return (
      <>
        <div className="preview-main">
          <button
            type="button"
            className="preview-nav-btn"
            onClick={handlePrevImage}
            disabled={list.length <= 1}
          >
            <FaChevronLeft />
          </button>

          <div className="preview-main-image">
            <img
              src={currentSrc}
              alt={`${activePreviewTab} ${currentIndex + 1}`}
            />
          </div>

          <button
            type="button"
            className="preview-nav-btn"
            onClick={handleNextImage}
            disabled={list.length <= 1}
          >
            <FaChevronRight />
          </button>
        </div>

        <div className="preview-counter">
          {list.length > 1
            ? `${currentIndex + 1} de ${list.length}`
            : "1 de 1"}
        </div>

        {list.length > 1 && (
          <div className="preview-thumbs">
            {list.map((src, idx) => (
              <button
                key={idx}
                type="button"
                className={`preview-thumb ${
                  idx === currentIndex ? "active" : ""
                }`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <img
                  src={src}
                  alt={`${activePreviewTab} thumb ${idx + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="consulta-page">
      <Header />

      <main className="consulta-container">
        <h1>Consulta de Documentos</h1>

        {/* Barra de busca (nota) */}
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por número da NF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Linha dos filtros */}
        <div className="filters-row">
          <button
            type="button"
            className={`filter-toggle ${filtersOpen ? "active" : ""}`}
            onClick={toggleFilters}
          >
            <FaFilter className="filter-icon" />
            <span>Filtros</span>
          </button>
          <span className="filters-summary">
            {sortOrder === "desc"
              ? "Mais recentes primeiro"
              : "Mais antigos primeiro"}
            {search.trim()
              ? " · Filtrando por NF"
              : filterDate
              ? ` · Data ${new Date(filterDate).toLocaleDateString("pt-BR")}`
              : ""}
            {onlyComplete ? " · Somente NF completas" : ""}
          </span>
        </div>

        {/* Painel de filtros */}
        {filtersOpen && (
          <section className="filters-panel">
            <div className="filter-group">
              <span className="filter-label">Data</span>
              <div className="filter-dates">
                <label>
                  Selecionar
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    disabled={search.trim() !== ""}
                  />
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Ordenar por</span>
              <div className="filter-order">
                <label>
                  <input
                    type="radio"
                    name="sortOrder"
                    value="desc"
                    checked={sortOrder === "desc"}
                    onChange={() => setSortOrder("desc")}
                  />
                  Data (mais recentes primeiro)
                </label>
                <label>
                  <input
                    type="radio"
                    name="sortOrder"
                    value="asc"
                    checked={sortOrder === "asc"}
                    onChange={() => setSortOrder("asc")}
                  />
                  Data (mais antigos primeiro)
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Integridade</span>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={onlyComplete}
                  onChange={(e) => setOnlyComplete(e.target.checked)}
                />
                Mostrar apenas NF com Conferência, Carga e Canhoto
              </label>
            </div>
          </section>
        )}

        {/* Estado de carregamento / erro */}
        {loading && (
          <div className="info-state">Carregando documentos...</div>
        )}
        {error && <div className="info-state error">{error}</div>}

        {/* Tabela */}
        {!loading && !error && (
          <div className="table-wrapper">
            <table className="consulta-table">
              <thead>
                <tr>
                  <th>N° NF</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Imagens</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc, idx) => (
                    <tr key={idx}>
                      <td>{doc.nf}</td>
                      <td>
                        {new Date(doc.data).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>{doc.cliente}</td>
                      <td>
                        {hasAnyImage(doc) ? (
                          <button
                            type="button"
                            className="images-btn"
                            onClick={() => openPreview(doc)}
                            aria-label={`Ver imagens da NF ${doc.nf}`}
                          >
                            <FaImages />
                            <span>Ver</span>
                          </button>
                        ) : (
                          <span className="images-empty">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-results">
                      Nenhum documento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="voltar-btn"
          onClick={() => navigate("/upload")}
          type="button"
        >
          <FaArrowLeft /> Voltar para Despachar
        </button>
      </main>

      {/* Modal de preview de imagens */}
      {previewDoc && (
        <div className="preview-modal-backdrop" onClick={closePreview}>
          <div
            className="preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="preview-header">
              <div>
                <h2>NF {previewDoc.nf}</h2>
                <p>{previewDoc.cliente}</p>
              </div>
              <button
                type="button"
                className="preview-close"
                onClick={closePreview}
                aria-label="Fechar preview"
              >
                <FaTimes />
              </button>
            </header>

            <nav className="preview-tabs">
              <button
                type="button"
                className={`preview-tab ${
                  activePreviewTab === "conferencia" ? "active" : ""
                }`}
                onClick={() => {
                  setActivePreviewTab("conferencia");
                  setActiveImageIndex(0);
                }}
              >
                Conferência
              </button>
              <button
                type="button"
                className={`preview-tab ${
                  activePreviewTab === "carga" ? "active" : ""
                }`}
                onClick={() => {
                  setActivePreviewTab("carga");
                  setActiveImageIndex(0);
                }}
              >
                Carga
              </button>
              <button
                type="button"
                className={`preview-tab ${
                  activePreviewTab === "canhoto" ? "active" : ""
                }`}
                onClick={() => {
                  setActivePreviewTab("canhoto");
                  setActiveImageIndex(0);
                }}
              >
                Canhoto
              </button>
            </nav>

            <section className="preview-content">
              {renderImagesPreview()}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

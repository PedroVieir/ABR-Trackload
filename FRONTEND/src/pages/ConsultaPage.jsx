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
import formatDate, { parseToDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/ConsultaDocumentos.css";

export default function ConsultaDocumentos() {
  // cache + data
  const [documentsCache, setDocumentsCache] = useState([]); // full cached set
  const [documents, setDocuments] = useState([]); // visible set (after filters)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros: use pending inputs and apply to cached data on demand
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingFilterDate, setPendingFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pendingSortOrder, setPendingSortOrder] = useState("desc");
  const [pendingOnlyComplete, setPendingOnlyComplete] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({ search: "", searchType: "ambos", data: "", sortOrder: "desc", onlyComplete: false });

  // Modal de preview
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState("conferencia");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  // zoom state for modal
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
  const resetZoom = () => setZoom(1);
  // fullscreen preview when clicking image
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const navigate = useNavigate();

  // On first mount: try to load cache from localStorage; if missing, fetch once and cache
  useEffect(() => {
    const CACHE_KEY = "documentos_cache_v1";
    const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

    async function fetchAndCache() {
      setLoading(true);
      setError("");
      try {
        // try limit param to avoid fetching huge datasets (backend may ignore it)
        const url = `http://localhost:5000/api/documentos?limit=1000`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Erro na resposta da API");
        const data = await res.json();

        // normalize: ensure array
        const arr = Array.isArray(data) ? data : [];

        // store cache with timestamp
        const payload = { ts: Date.now(), data: arr };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch (e) { /* ignore storage errors */ }

  setDocumentsCache(arr);
  // apply default appliedFilters (none) to set documents visible
  setAppliedFilters({ search: "", searchType: "ambos", data: "", sortOrder: "desc", onlyComplete: false });
  setDocuments(arr);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar documentos.");
      } finally {
        setLoading(false);
      }
    }

    try {
      const raw = localStorage.getItem("documentos_cache_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && (Date.now() - parsed.ts) < CACHE_TTL_MS && Array.isArray(parsed.data)) {
          setDocumentsCache(parsed.data);
          setDocuments(parsed.data);
          setLoading(false);
          return; // use cache
        }
      }
    } catch (e) {
      // proceed to fetch
    }

    fetchAndCache();
  }, []);

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

  // close fullscreen with ESC
  useEffect(() => {
    function handleFsKey(e) {
      if (e.key === 'Escape') setFullscreenImage(null);
    }
    window.addEventListener('keydown', handleFsKey);
    return () => window.removeEventListener('keydown', handleFsKey);
  }, []);

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

  // heurística para identificar se o termo digitado é uma NF (número) ou nome de cliente
  const detectSearchType = (q) => {
    if (!q) return 'ambos';
    const hasLetter = /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(q);
    const hasDigit = /\d/.test(q);
    if (hasDigit && !hasLetter) return 'nota';
    if (!hasDigit && hasLetter) return 'cliente';
    const digitsCount = (q.match(/\d/g) || []).length;
    const lettersCount = (q.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []).length;
    return digitsCount >= lettersCount ? 'nota' : 'cliente';
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

  // Apply filters client-side from cached data (only when user clicks Aplicar)
  const filteredDocs = useMemo(() => {
    let result = [...documentsCache];

    // Search (by NF, Cliente or Ambos)
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      const type = (appliedFilters.searchType || 'ambos');
      result = result.filter((d) => {
        const nf = String(d.nf || '').toLowerCase();
        const cliente = String(d.cliente || '').toLowerCase();
        if (type === 'nota') return nf.includes(q);
        if (type === 'cliente') return cliente.includes(q);
        // ambos
        return nf.includes(q) || cliente.includes(q);
      });
    }

    // Data filter (if provided)
    if (appliedFilters.data) {
      result = result.filter((d) => d.data && d.data.startsWith(appliedFilters.data));
    }

    // onlyComplete
    if (appliedFilters.onlyComplete) {
      result = result.filter((doc) => isDocComplete(doc));
    }

    // Sort by date
    result.sort((a, b) => {
      const da = parseToDate(a.data);
      const db = parseToDate(b.data);
      if (appliedFilters.sortOrder === "asc") return da - db;
      return db - da;
    });

    return result;
  }, [documentsCache, appliedFilters]);

  // Pagination state: default 20 rows
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const pagedDocs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, page, pageSize]);

  // helper to build page number list with ellipses
  const getPageList = (current, total, maxButtons = 7) => {
    const pages = [];
    if (total <= maxButtons) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    const side = Math.floor((maxButtons - 3) / 2); // space for first,last and one ellipsis each
    let start = Math.max(2, current - side);
    let end = Math.min(total - 1, current + side);

    if (current - 1 <= side) {
      start = 2;
      end = maxButtons - 2;
    }
    if (total - current <= side) {
      start = total - (maxButtons - 3);
      end = total - 1;
    }

    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("...");
    pages.push(total);

    return pages;
  };

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
        <div className="preview-main" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="preview-nav-btn" onClick={handlePrevImage} disabled={list.length <= 1} aria-label="Anterior">
            <FaChevronLeft />
          </button>

          <div
            className="preview-image-wrap"
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: zoom > 1 ? 'auto' : 'hidden',
            }}
          >
            <img
              src={currentSrc}
              alt={`${activePreviewTab} ${currentIndex + 1}`}
              className={`preview-image ${zoom > 1 ? 'zoomed' : ''}`}
              style={{ transform: `scale(${zoom})`, transition: 'transform 150ms ease', cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
              onDoubleClick={() => (zoom === 1 ? zoomIn() : resetZoom())}
              onClick={() => setFullscreenImage(currentSrc)}
              draggable={false}
            />
          </div>

          <button type="button" className="preview-nav-btn" onClick={handleNextImage} disabled={list.length <= 1} aria-label="Próxima">
            <FaChevronRight />
          </button>
        </div>

        <div className="preview-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div className="preview-counter">{list.length > 1 ? `${currentIndex + 1} de ${list.length}` : '1 de 1'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="images-btn" onClick={zoomOut} aria-label="Diminuir">-</button>
            <button type="button" className="images-btn" onClick={resetZoom} aria-label="Resetar">Reset</button>
            <button type="button" className="images-btn" onClick={zoomIn} aria-label="Aumentar">+</button>
          </div>
        </div>

        {list.length > 1 && (
          <div className="preview-thumbs" style={{ marginTop: 10 }}>
            {list.map((src, idx) => (
              <button key={idx} type="button" className={`preview-thumb ${idx === currentIndex ? 'active' : ''}`} onClick={() => setActiveImageIndex(idx)}>
                <img src={src} alt={`thumb ${idx + 1}`} style={{ width: 90, height: 56, objectFit: 'cover' }} />
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
            placeholder="Buscar por NF ou cliente..."
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = (e.target.value || '').trim();
                const type = detectSearchType(q);
                setAppliedFilters({ search: q, searchType: type, data: q ? '' : pendingFilterDate, sortOrder: pendingSortOrder, onlyComplete: pendingOnlyComplete });
                setPage(1);
              }
            }}
          />
          <button type="button" className="search-btn" title="Buscar" onClick={() => {
            const q = pendingSearch.trim();
            const type = detectSearchType(q);
            setAppliedFilters({ search: q, searchType: type, data: q ? '' : pendingFilterDate, sortOrder: pendingSortOrder, onlyComplete: pendingOnlyComplete });
            setPage(1);
          }}>
            <FaSearch />
          </button>
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
            {appliedFilters.sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
            {appliedFilters.search ? ` · Buscando por "${appliedFilters.search}" (${appliedFilters.searchType === 'nota' ? 'NF' : appliedFilters.searchType === 'cliente' ? 'Cliente' : 'NF ou Cliente'})` : appliedFilters.data ? ` · Data ${formatDate(appliedFilters.data)}` : ''}
            {appliedFilters.onlyComplete ? ' · Somente NF completas' : ''}
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
                  <input type="date" value={pendingFilterDate} onChange={(e) => setPendingFilterDate(e.target.value)} disabled={pendingSearch.trim() !== ''} />
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Ordenar por</span>
              <div className="filter-order">
                <label>
                  <input type="radio" name="sortOrder" value="desc" checked={pendingSortOrder === 'desc'} onChange={() => setPendingSortOrder('desc')} /> Data (mais recentes primeiro)
                </label>
                <label>
                  <input type="radio" name="sortOrder" value="asc" checked={pendingSortOrder === 'asc'} onChange={() => setPendingSortOrder('asc')} /> Data (mais antigos primeiro)
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Integridade</span>
              <label className="filter-checkbox">
                <input type="checkbox" checked={pendingOnlyComplete} onChange={(e) => setPendingOnlyComplete(e.target.checked)} />
                Mostrar apenas NF com Conferência, Carga e Canhoto
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="button" className="images-btn" onClick={() => {
                  // apply filters -> close panel and set appliedFilters (client-side only)
                  const q = pendingSearch.trim();
                  const type = detectSearchType(q);
                  setAppliedFilters({ search: q, searchType: type, data: q ? '' : pendingFilterDate, sortOrder: pendingSortOrder, onlyComplete: pendingOnlyComplete });
                  setFiltersOpen(false);
                  setPage(1);
                }}>Aplicar</button>
                <button type="button" className="images-btn" onClick={() => {
                  setPendingSearch(''); setPendingFilterDate(new Date().toISOString().slice(0, 10)); setPendingOnlyComplete(false); setPendingSortOrder('desc');
                }} style={{ background: '#fff' }}>Limpar</button>
                <button type="button" className="images-btn" onClick={() => {
                  // refresh cache from server
                  localStorage.removeItem('documentos_cache_v1');
                  window.location.reload();
                }}>Atualizar</button>
              </div>
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
                  pagedDocs.map((doc, idx) => (
                    <tr key={idx}>
                      <td>{doc.nf}</td>
                      <td>
                        {formatDate(doc.data, {
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
            {/* pagination controls - professional/responsive */}
            <div className="pagination-wrapper">

              {/* Linha 1: Controles de Navegação (Centralizados) */}
              <div className="pagination-controls-center">
                <button className="page-btn-control" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primeira página">
                  «
                </button>
                <button className="page-btn-control" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Página anterior">
                  ‹
                </button>

                {/* Informação da Página Atual (no centro dos controles) */}
                <span className="page-current-indicator">
                  Página **{page}** de **{totalPages}**
                </span>

                <button className="page-btn-control" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Próxima página">
                  ›
                </button>
                <button className="page-btn-control" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Última página">
                  »
                </button>
              </div>

              {/* Linha 2 (opcional, só aparece se houver pouco espaço) */}
              <div className="pagination-details">
                {/* Informações de contagem */}
                <div className="pagination-info">
                  Mostrando {pagedDocs.length} de {filteredDocs.length} registros
                </div>

                {/* Seletor de Tamanho da Página */}
                <div className="page-size-controls">
                  <label htmlFor="page-size-select" className="page-size-label">Linhas:</label>
                  <select
                    id="page-size-select"
                    className="page-size-select"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de preview de imagens */}
      {previewDoc && (
        <div className="preview-modal-backdrop-imagens" onClick={closePreview}>
          <div
            className="preview-modal-imagens"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="preview-header-imagens">
              <div>
                <h2>NF {previewDoc.nf}</h2>
                <p>{previewDoc.cliente}</p>
              </div>
              <button
                type="button"
                className="preview-close-imagens"
                onClick={closePreview}
                aria-label="Fechar preview"
              >
                <FaTimes />
              </button>
            </header>

            <nav className="preview-tabs-imagens">
              <button
                type="button"
                className={`preview-tab-imagens ${activePreviewTab === "conferencia" ? "active" : ""
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
                className={`preview-tab-imagens ${activePreviewTab === "carga" ? "active" : ""
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
                className={`preview-tab-imagens ${activePreviewTab === "canhoto" ? "active" : ""
                  }`}
                onClick={() => {
                  setActivePreviewTab("canhoto");
                  setActiveImageIndex(0);
                }}
              >
                Canhoto
              </button>
            </nav>

            <section className="preview-content-imagens">
              {renderImagesPreview()}
            </section>
          </div>
        </div>
      )}

      {/* Fullscreen expanded image (click to expand) */}
      {fullscreenImage && (
        <div className="fs-backdrop-imagens" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt="Expandida" className="fs-image" onClick={() => setFullscreenImage(null)} />
        </div>
      )}
    </div>
  );
}

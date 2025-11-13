import { useEffect, useState } from "react";
import { FaArrowLeft, FaSearch, FaFileInvoice, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../styles/ConsultaDocumentos.css";

export default function ConsultaDocumentos() {
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const navigate = useNavigate();

  // Simulação de dados (futuramente virá da API)
  useEffect(() => {
    const mockData = [
      { nf: "12-456789", status: "Enviado", data: "2025-11-10", usuario: "Pedro", tipo: "Carga" },
      { nf: "45-987654", status: "Pendente", data: "2025-11-08", usuario: "Carla", tipo: "Conferência" },
      { nf: "99-123456", status: "Erro", data: "2025-11-07", usuario: "Marcos", tipo: "Canhoto" },
    ];
    setDocuments(mockData);
    setFilteredDocs(mockData);
  }, []);

  // Filtro de busca
  useEffect(() => {
    const filtered = documents.filter((doc) =>
      doc.nf.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDocs(filtered);
  }, [search, documents]);

  const renderStatusIcon = (status) => {
    switch (status) {
      case "Enviado":
        return <FaCheckCircle className="status-icon success" />;
      case "Pendente":
        return <FaClock className="status-icon pending" />;
      case "Erro":
        return <FaTimesCircle className="status-icon error" />;
      default:
        return <FaFileInvoice className="status-icon" />;
    }
  };

  return (
    <div className="consulta-page">
      <Header /> 

      <main className="consulta-container">
        <h1>Consulta de Documentos</h1>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por número da NF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table className="consulta-table">
            <thead>
              <tr>
                <th>NF</th>
                <th>Status</th>
                <th>Data</th>
                <th>Usuário</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, idx) => (
                  <tr key={idx}>
                    <td>{doc.nf}</td>
                    <td>
                      <div className="status-cell">
                        {renderStatusIcon(doc.status)}
                        <span>{doc.status}</span>
                      </div>
                    </td>
                    <td>{doc.data}</td>
                    <td>{doc.usuario}</td>
                    <td>{doc.tipo}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-results">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button className="voltar-btn" onClick={() => navigate("/upload")}>
          <FaArrowLeft /> Voltar para Despachar
        </button>
      </main>
    </div>
  );
}

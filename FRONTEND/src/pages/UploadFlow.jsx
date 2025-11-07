import { useEffect, useState } from "react";
import StepConferencia from "./StepConferencia";
import StepCarga from "./StepCarga";
import StepCanhoto from "./StepCanhoto";
import StepHeader from "../components/StepHeader";
import Logo from "../assets/LogoAbr.png";
import "../styles/UploadPage.css";
import { FaCheckCircle, FaRedoAlt, FaEdit } from "react-icons/fa";

export default function UploadFlow() {
  const [step, setStep] = useState(() => Number(localStorage.getItem("step")) || 1);
  const [documentNumber, setDocumentNumber] = useState(localStorage.getItem("documentNumber") || "");
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem("formData");
      const parsed = saved ? JSON.parse(saved) : { conferencia: null, carga: {}, canhoto: null };
      return {
        conferencia: parsed?.conferencia || null,
        carga: parsed?.carga || {},
        canhoto: parsed?.canhoto || null,
      };
    } catch {
      console.warn("⚠️ Dados corrompidos no localStorage — resetando.");
      localStorage.clear();
      return { conferencia: null, carga: {}, canhoto: null };
    }
  });

  const [previewModal, setPreviewModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Persistência segura no localStorage
  useEffect(() => {
    const safeData = {
      conferencia: !!formData.conferencia,
      carga: {
        placa: !!formData.carga?.placa,
        carga1: !!formData.carga?.carga1,
        carga2: !!formData.carga?.carga2,
      },
      canhoto: !!formData.canhoto,
    };
    localStorage.setItem("step", step);
    localStorage.setItem("documentNumber", documentNumber);
    localStorage.setItem("formData", JSON.stringify(safeData));
  }, [step, documentNumber, formData]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleClear = (section, field = null) => {
    setFormData((prev) => {
      const updated = { ...prev };
      if (field) updated[section][field] = null;
      else updated[section] = null;
      return updated;
    });
  };

  const handleReset = () => {
    if (!window.confirm("Tem certeza que deseja reiniciar todo o processo?")) return;
    localStorage.clear();
    setFormData({ conferencia: null, carga: {}, canhoto: null });
    setDocumentNumber("");
    setStep(1);
    setFeedback(null);
  };

  // =========================
  // 🔹 Envio real ao backend
  // =========================
  const handleConfirmUpload = async () => {
    try {
      setUploading(true);
      setFeedback({ type: "warning", text: "Enviando arquivos..." });

      const data = new FormData();
      data.append("documentNumber", documentNumber);
      if (formData.conferencia instanceof File || formData.conferencia instanceof Blob)
        data.append("conferencia", formData.conferencia);
      if (formData.carga.placa instanceof File || formData.carga.placa instanceof Blob)
        data.append("placa", formData.carga.placa);
      if (formData.carga.carga1 instanceof File || formData.carga.carga1 instanceof Blob)
        data.append("carga1", formData.carga.carga1);
      if (formData.carga.carga2 instanceof File || formData.carga.carga2 instanceof Blob)
        data.append("carga2", formData.carga.carga2);
      if (formData.canhoto instanceof File || formData.canhoto instanceof Blob)
        data.append("canhoto", formData.canhoto);

      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Erro no upload");

      // ✅ Mostra o toast de sucesso
      setToastVisible(true);
      setFeedback({ type: "success", text: "Upload concluído com sucesso!" });

      // Após 3 segundos: reset e retorno para etapa 1
      setTimeout(() => {
        setToastVisible(false);
        localStorage.clear();
        setFormData({ conferencia: null, carga: {}, canhoto: null });
        setDocumentNumber("");
        setStep(1);
        setFeedback(null);
      }, 3000);
    } catch (err) {
      console.error("Erro no envio:", err);
      setFeedback({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // 🔹 Renderização segura das prévias
  // =========================
  const renderPreview = (file, label, stepTarget) => {
    if (!file) return null;
    if (!(file instanceof File || file instanceof Blob)) {
      console.warn(`Ignorando prévia inválida (${label})`, file);
      return null;
    }

    let url;
    try {
      url = URL.createObjectURL(file);
    } catch (err) {
      console.error(`Erro ao criar URL para ${label}:`, err);
      return null;
    }

    return (
      <div key={label} className="preview-card">
        <img
          src={url}
          alt={label}
          onClick={() => setPreviewModal(url)}
          loading="lazy"
        />
        <div className="preview-info">
          <span>{label}</span>
          <button
            className="edit-btn"
            onClick={() => setStep(stepTarget)}
            title={`Editar ${label}`}
          >
            <FaEdit />
          </button>
        </div>
      </div>
    );
  };

  // =========================
  // 🔹 Tela final de confirmação
  // =========================
  const renderSummary = () => (
    <div className="summary-container">
      <h1>Etapa 4 — Revisar e Confirmar Envio</h1>
      <p><strong>Documento:</strong> {documentNumber}</p>

      <div className="preview-grid">
        {renderPreview(formData.conferencia, "Conferência", 1)}
        {renderPreview(formData.carga.placa, "Placa", 2)}
        {renderPreview(formData.carga.carga1, "Carga 1", 2)}
        {renderPreview(formData.carga.carga2, "Carga 2", 2)}
        {renderPreview(formData.canhoto, "Canhoto", 3)}
      </div>

      <div className="button-row">
        <button className="secondary-btn" onClick={handleReset}>
          <FaRedoAlt /> Reiniciar Processo
        </button>
        <button
          className="primary-btn confirm-btn"
          onClick={handleConfirmUpload}
          disabled={uploading}
        >
          {uploading ? "Enviando..." : <>Confirmar Envio <FaCheckCircle /></>}
        </button>
      </div>

      {feedback && <p className={`feedback ${feedback.type}`}>{feedback.text}</p>}
    </div>
  );

  // =========================
  // 🔹 Layout principal
  // =========================
  return (
    <div className="upload-page">
      <header className="header-container">
        <img src={Logo} alt="Logo ABR" id="logo" />
      </header>

      <main className="main-container">
        <div className="container">
          <StepHeader step={step} />

          {step === 1 && (
            <StepConferencia
              documentNumber={documentNumber}
              setDocumentNumber={setDocumentNumber}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <StepCarga
              documentNumber={documentNumber}
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
              onClear={handleClear}
            />
          )}
          {step === 3 && (
            <StepCanhoto
              documentNumber={documentNumber}
              setFormData={setFormData}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}
          {step === 4 && renderSummary()}
        </div>
      </main>

      {/* Toast de sucesso */}
      {toastVisible && (
        <div className="upload-toast">
          <FaCheckCircle className="icon" />
          <span>Upload enviado com sucesso!</span>
        </div>
      )}

      {/* Modal de preview */}
      {previewModal && (
        <div className="preview-modal" onClick={() => setPreviewModal(null)}>
          <img src={previewModal} alt="Visualização" />
        </div>
      )}
    </div>
  );
}

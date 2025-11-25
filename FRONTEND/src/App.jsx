import { Routes, Route } from 'react-router-dom';
import UploadFlow from './pages/UploadFlow';
import Dashboard from './pages/Dashboard';
import ConsultaPage from './pages/ConsultaPage';
import StepCanhoto from './pages/StepCanhoto';
import StepCarga from './pages/StepCarga';
import StepConferencia from './pages/StepConferencia';
import { useEffect, useState, useCallback } from "react";
import { initOfflineSync } from "./utils/offlineSync";
import Toasts from "./components/Toasts";

export default function App() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((text, type = "success", opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, text, type, duration: opts.duration ?? 5000, className: opts.className };
    setToasts((s) => [...s, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // Inicializa sincronizador offline que reenviará itens pendentes ao reconectar
    initOfflineSync({
      onItemSent: (item) => {
        addToast(`Envio automático concluído para documento ${item.documentNumber}`, "success");
      },
    });

    // Escuta eventos quando um upload for enfileirado
    const handler = (e) => {
      const detail = e.detail || {};
      addToast(
        `Envio enfileirado para documento ${detail.documentNumber}. Será enviado automaticamente quando a internet voltar.`,
        "warning",
        { duration: 6000 }
      );
    };
    window.addEventListener("offline-upload-enqueued", handler);
    return () => {
      window.removeEventListener("offline-upload-enqueued", handler);
    };
  }, [addToast]);

  return (
    <>
      <Toasts toasts={toasts} removeToast={removeToast} />
      <Routes>
        <Route path="/upload/conferencia" element={<StepConferencia />} />
        <Route path="/upload/carga" element={<StepCarga />} />
        <Route path="/upload/canhoto" element={<StepCanhoto />} />
        <Route path="/upload" element={<UploadFlow />} />
        <Route path="/consulta" element={<ConsultaPage />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </>
  );
}
import { Routes, Route } from 'react-router-dom';
import UploadFlow from './pages/UploadFlow';
import Dashboard from './pages/Dashboard';
import ConsultaPage from './pages/ConsultaPage';
import StepCanhoto from './pages/StepCanhoto';
import StepCarga from './pages/StepCarga';
import StepConferencia from './pages/StepConferencia';
import { useEffect, useState, useCallback, useRef } from "react";
import { initOfflineSync } from "./utils/offlineSync";
import Toasts from "./components/Toasts";
import { registerSW } from 'virtual:pwa-register';

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

  const swUpdateRef = useRef(null);

  useEffect(() => {
    initOfflineSync({
      onItemSent: (item) => {
        addToast(`Envio automático concluído para documento ${item.documentNumber}`, "success");
      },
    });

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

  useEffect(() => {
    try {
      const update = registerSW({
        onNeedRefresh() {
          addToast('Nova versão disponível. Você pode atualizar para aplicar as mudanças.', 'info', { duration: 10000 });
          try {
            const want = window.confirm('Nova versão disponível. Deseja atualizar agora? (Se confirmar, a página será recarregada)');
            if (want) {
              if (typeof update === 'function') update();
            }
          } catch (e) { }
        },
        onOfflineReady() {
          addToast('Aplicação pronta para uso offline.', 'info', { duration: 5000 });
        }
      });
      swUpdateRef.current = update;
    } catch (e) { }
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

import { useEffect, useState } from 'react';
import StepConferencia from './StepConferencia';
import StepCarga from './StepCarga';
import StepCanhoto from './StepCanhoto';
import StepHeader from '../components/StepHeader';
import Logo from '../assets/LogoAbr.png';
import '../styles/UploadPage.css';

export default function UploadFlow() {
  const [step, setStep] = useState(() => Number(localStorage.getItem('step')) || 1);
  const [documentNumber, setDocumentNumber] = useState(localStorage.getItem('documentNumber') || '');
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('formData');
    return saved ? JSON.parse(saved) : { conferencia: null, carga: {}, canhoto: null };
  });

  useEffect(() => {
    localStorage.setItem('step', step);
    localStorage.setItem('documentNumber', documentNumber);
    localStorage.setItem('formData', JSON.stringify(formData));
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

  // 🔹 Envio final ao backend
  const handleFinish = async () => {
    try {
      const data = new FormData();
      data.append('documentNumber', documentNumber);

      if (formData.conferencia) data.append('conferencia', formData.conferencia);
      if (formData.carga.placa) data.append('placa', formData.carga.placa);
      if (formData.carga.carga1) data.append('carga1', formData.carga.carga1);
      if (formData.carga.carga2) data.append('carga2', formData.carga.carga2);
      if (formData.canhoto) data.append('canhoto', formData.canhoto);

      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Erro no upload');

      alert('Upload concluído com sucesso!');
      console.log('Backend:', result);
      localStorage.clear();
    } catch (err) {
      console.error('Erro no envio:', err);
      alert('Falha no upload: ' + err.message);
    }
  };

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
              onFinish={handleFinish}
            />
          )}
        </div>
      </main>
    </div>
  );
}

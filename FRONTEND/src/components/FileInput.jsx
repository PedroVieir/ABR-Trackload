// src/components/FileInput.jsx
import { useRef, useEffect } from "react";
import { FaImage, FaTrash } from "react-icons/fa";

export default function FileInput({
  label,
  fileType = "default",
  onChange,
  onClear,
  // when `resetKey` changes the input will be cleared (useful after uploads)
  resetKey,
}) {
  const inputRef = useRef(null);
  const isImage = fileType === "foto";

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  useEffect(() => {
    // clear underlying input when resetKey changes
    try {
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      /* ignore */
    }
  }, [resetKey]);

  const handleClear = () => {
    try {
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) { }
    if (typeof onClear === "function") onClear();
  };

  return (
    <div className="file-input">
      <label className="file-input-label">{label}</label>

      <button
        type="button"
        className="file-input-btn"
        onClick={handleClick}
      >
        <FaImage />
        <span>Escolher da galeria</span>
      </button>

      {onClear && (
        <button
          type="button"
          className="file-input-clear"
          onClick={handleClear}
        >
          <FaTrash /> Remover
        </button>
      )}

      {/* Input real, escondido, sem capture (não força câmera) */}
      <input
        ref={inputRef}
        type="file"
        accept={isImage ? "image/*" : undefined}
        // NÃO coloque "capture" aqui
        onChange={onChange}
        style={{ display: "none" }}
      />

      <p className="file-input-hint">
        Toque em “Escolher da galeria” para usar uma foto já existente.
      </p>
    </div>
  );
}

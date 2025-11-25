import { useEffect } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";
import FeedbackMessage from "./FeedbackMessage";

export default function Toasts({ toasts = [], removeToast }) {
    useEffect(() => {
        // auto-dismiss toasts after 5s
        const timers = toasts.map((t) => {
            if (t.duration === 0) return null;
            return setTimeout(() => removeToast(t.id), t.duration || 5000);
        });
        return () => timers.forEach((t) => t && clearTimeout(t));
    }, [toasts, removeToast]);

    const icons = {
        success: <FaCheckCircle className="icon" />,
        warning: <FaExclamationTriangle className="icon" />,
        error: <FaTimesCircle className="icon" />,
    };

    if (!toasts || toasts.length === 0) return null;

    return (
        <div aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className={`upload-toast ${t.className || ""}`}>
                    {icons[t.type]}
                    <span style={{ marginLeft: 8 }}>{t.text}</span>
                    <div style={{ marginLeft: 12 }}>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(t.id)}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

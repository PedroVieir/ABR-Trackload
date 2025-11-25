import { addItem, getAllItems, removeItem } from "./indexedDBQueue";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
}

export async function savePendingUpload({ documentNumber, dataUrl, files, meta = {} }) {
    // `dataUrl` for single-file items kept for backward compat.
    const item = {
        documentNumber,
        dataUrl: dataUrl || null,
        files: files || null,
        meta,
        createdAt: Date.now(),
    };
    const id = await addItem(item);
    // Notifica a aplicação que um upload foi enfileirado (para toasts/UX)
    try {
        window.dispatchEvent(new CustomEvent("offline-upload-enqueued", { detail: { id, ...item } }));
    } catch (e) {
        console.debug("Não foi possível disparar evento de enfileiramento", e);
    }
    return id;
}

async function sendItem(item) {
    try {
        const formData = new FormData();
        formData.append("documentNumber", item.documentNumber);

        if (item.files && typeof item.files === "object") {
            // multiple files map: { fieldName: dataUrl }
            for (const [field, dataUrl] of Object.entries(item.files)) {
                if (!dataUrl) continue;
                const blob = await dataUrlToBlob(dataUrl);
                formData.append(field, blob, `${field}.jpg`);
            }
        } else if (item.dataUrl) {
            const blob = await dataUrlToBlob(item.dataUrl);
            formData.append("conferencia", blob, `${item.documentNumber.replace(/[^0-9]/g, "") || 'file'}.jpg`);
        }

        const res = await fetch(BACKEND_URL + "/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json?.message || `HTTP ${res.status}`);
        }
        return true;
    } catch (err) {
        console.error("Erro ao reenviar item da fila:", err);
        return false;
    }
}

export async function flushQueue({ onItemSent } = {}) {
    const items = await getAllItems();
    for (const item of items) {
        const ok = await sendItem(item);
        if (ok) {
            await removeItem(item.id);
            try {
                if (typeof onItemSent === "function") onItemSent(item);
            } catch (e) {
                console.error(e);
            }
        }
    }
}

export function initOfflineSync({ onItemSent } = {}) {
    // Tenta reenviar assim que voltar online
    window.addEventListener("online", () => {
        console.info("Conexão restaurada: iniciando reenvio de itens pendentes.");
        flushQueue({ onItemSent });
    });

    // Também pode rodar ao iniciar a aplicação se já estiver online
    if (navigator.onLine) {
        flushQueue({ onItemSent });
    }
}

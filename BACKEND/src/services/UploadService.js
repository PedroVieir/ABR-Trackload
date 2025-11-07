const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
require("dotenv").config();

/**
 * Mapeia as pastas de destino com base na estrutura de rede e inclui a nova pasta.
 * Os caminhos UNC são suportados (ex: \\10.0.0.20\abr\publico\Documentos\...).
 */
const BASE_UPLOAD_PATH = "\\\\10.0.0.20\\abr\\publico\\Documentos\\Upload_Sistema";

const directories = {
  conferencia: path.join(BASE_UPLOAD_PATH, "conferencia"),
  carga: path.join(BASE_UPLOAD_PATH, "carga"),
  canhoto: path.join(BASE_UPLOAD_PATH, "canhoto"),
  nova: path.join(BASE_UPLOAD_PATH, "nova"),
};

/**
 * Garante que todas as pastas de destino existem.
 */
async function ensureDirectories() {
  for (const dir of Object.values(directories)) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error(`Erro ao criar diretório: ${dir}`, err);
    }
  }
}

/**
 * Faz o upload e processamento das imagens de forma paralela para máximo desempenho.
 * Usa Sharp para compressão e redimensionamento.
 */
async function handleUpload(files, body) {
  if (!files || files.length === 0) {
    throw new Error("Nenhum arquivo enviado");
  }

  await ensureDirectories();

  const processedFiles = await Promise.all(
    files.map(async (file) => {
      try {
        // Detecta a categoria no nome (ex: "carga_", "conferencia_", etc.)
        const lowerName = file.originalname.toLowerCase();

        let category = "nova"; // padrão se não identificar
        if (lowerName.includes("conferencia")) category = "conferencia";
        else if (lowerName.includes("carga")) category = "carga";
        else if (lowerName.includes("canhoto")) category = "canhoto";

        const targetDir = directories[category];
        const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
        const outputPath = path.join(targetDir, fileName);

        // Otimização e salvamento de imagem
        await sharp(file.buffer)
          .resize({ width: 1280, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        return {
          categoria: category,
          nomeOriginal: file.originalname,
          caminho: outputPath,
          status: "ok",
        };
      } catch (err) {
        console.error("Erro ao processar arquivo:", file.originalname, err);
        return { nomeOriginal: file.originalname, status: "erro", erro: err.message };
      }
    })
  );

  return processedFiles;
}

module.exports = { handleUpload };

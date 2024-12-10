import express from "express";
import multer from "multer";
import fs from "fs";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";

// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar OpenAI
const openai = new OpenAI();

// Configuración de Express
const app = express();
const PORT = 3000;

// Configuración de multer para la subida de archivos
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Carpeta donde se guardará el archivo
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      // Guardar el archivo con su nombre original
      cb(null, file.originalname);
    },
  }),
});
// Ruta para la página principal
app.use(express.static(path.join(__dirname, "public")));

// Ruta para subir un archivo de audio
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    const originalFilePath = `uploads/${req.file.originalname}`;
    const convertedFilePath = `uploads/${req.file.filename}.wav`;

    // Convertir el archivo a formato WAV
    // await convertirAudio(originalFilePath, convertedFilePath);

    // Transcribir el archivo
    const transcription = await transcribirAudio(originalFilePath);

    // Resumir la conversación
    const resumen = await resumirConversacion(transcription);

    // Generar preguntas no realizadas
    const preguntas = await generarPreguntas(transcription);

    // Responder preguntas
    const respuestas = await resolverPreguntas(preguntas);

    // Enviar resultados al cliente
    res.json({
      transcription,
      resumen,
      preguntas,
      respuestas,
    });

    // Limpiar archivos temporales
    fs.unlinkSync(originalFilePath);
    fs.unlinkSync(convertedFilePath);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// Función para transcribir el audio usando el nuevo método de OpenAI
const transcribirAudio = async (audioFilePath) => {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: "whisper-1",
  });
  return response.text;
};

// Función para resumir el texto transcrito
const resumirConversacion = async (texto) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Eres un asistente experto en resúmenes." },
      { role: "user", content: `Por favor, resume esta conversación: ${texto}` },
    ],
  });
  return response.choices[0].message.content;
};

// Función para generar preguntas no realizadas
const generarPreguntas = async (texto) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Eres un asistente que ayuda a detectar huecos en conversaciones." },
      { role: "user", content: `¿Qué preguntas no se hicieron en esta conversación?: ${texto}` },
    ],
  });
  return response.choices[0].message.content;
};

// Función para responder preguntas
const resolverPreguntas = async (preguntas) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Eres un asistente que ayuda a resolver preguntas." },
      { role: "user", content: `Por favor, responde estas preguntas: ${preguntas}` },
    ],
  });
  return response.choices[0].message.content;
};

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

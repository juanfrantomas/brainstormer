document.getElementById("upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const fileInput = document.getElementById("audio-file");
  if (!fileInput.files.length) {
      alert("Por favor, selecciona un archivo de audio.");
      return;
  }

  const formData = new FormData();
  formData.append("audio", fileInput.files[0]);

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Procesando archivo...</p>";

  try {
      const response = await fetch("/upload", {
          method: "POST",
          body: formData,
      });

      if (!response.ok) {
          throw new Error("Error al procesar el archivo.");
      }

      const data = await response.json();

      resultsDiv.innerHTML = `
          <h3>Resultados:</h3>
          <p><strong>Transcripción:</strong> ${data.transcription}</p>
          <p><strong>Resumen:</strong> ${data.resumen}</p>
          <p><strong>Preguntas:</strong> ${data.preguntas}</p>
          <p><strong>Respuestas:</strong> ${data.respuestas}</p>
      `;
  } catch (error) {
      console.error(error);
      resultsDiv.innerHTML = "<p>Error al procesar el archivo. Inténtalo de nuevo.</p>";
  }
});

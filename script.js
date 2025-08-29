
const API_KEY = "OLBXRaXK8m9MrmPa8O_d3QV2nH_oGJ0fBCZ3d-b5dwIZ";
const DEPLOYMENT_URL = "https://us-south.ml.cloud.ibm.com/ml/v4/deployments/a5c43d4f-8e9f-40a4-86fb-ee6694f42ccb/predictions?version=2021-05-01";

// Función para mostrar el spinner
function mostrarSpinner() {
  document.getElementById("loadingSpinner").style.display = "block";
}

// Función para ocultar el spinner
function ocultarSpinner() {
  document.getElementById("loadingSpinner").style.display = "none";
}

// Función para obtener el token
async function obtenerToken() {
  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `apikey=${API_KEY}&grant_type=urn:ibm:params:oauth:grant-type:apikey`,
  });
  const data = await response.json();
  return data.access_token;
}

// Función para hacer predicción
async function predecir(datos) {
  mostrarSpinner();
  const token = await obtenerToken();

  const payload = {
    input_data: [{
      fields: ["Animal_ID", "Día", "Alimento_Consumido_kg", "Pasos_por_día", "Horas_de_Reposo", "Temperatura_Corp_C", "Nivel_Actividad"],
      values: datos
    }]
  };

  const response = await fetch(DEPLOYMENT_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  ocultarSpinner();
  procesarResultados(datos, result);
}

// Mostrar los resultados en tabla y graficar
function procesarResultados(valores, resultado) {
  const tabla = document.querySelector("#tablaResultados tbody");
  const predicciones = resultado.predictions[0].values;
  tabla.innerHTML = "";

  const conteo = { Sano: 0, Observación: 0, Enfermo: 0 };

  for (let i = 0; i < valores.length; i++) {
    const fila = valores[i];
    const pred = predicciones[i][0];

    const clase = pred === "Sano" ? "status-sano" : pred === "Observación" ? "status-observacion" : "status-enfermo";
    conteo[pred]++;

    tabla.innerHTML += `
      <tr>
        <td>${fila[0]}</td>
        <td>${fila[1]}</td>
        <td>${fila[2]}</td>
        <td>${fila[3]}</td>
        <td>${fila[4]}</td>
        <td>${fila[5]}</td>
        <td>${fila[6]}</td>
        <td class="${clase}">${pred}</td>
      </tr>`;
  }

  graficar(conteo);
}

// Graficar resumen de predicciones
function graficar(conteo) {
  const ctx = document.getElementById("graficaDiagnosticos").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Sano", "Observación", "Enfermo"],
      datasets: [{
        label: "Cantidad",
        data: [conteo["Sano"], conteo["Observación"], conteo["Enfermo"]],
        backgroundColor: ["green", "orange", "red"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });
}

// CSV de ejemplo
const ejemplo = [
  ["VACA_001", 7, 20.06, 2557, 5.29, 38.37, "Alto"],
  ["VACA_002", 15, 22.35, 2596, 7.55, 38.16, "Moderado"],
  ["VACA_003", 22, 18.80, 2450, 8.12, 39.00, "Bajo"]
];

// Formulario manual
document.getElementById("formManual").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const data = [[
    form.Animal_ID.value,
    Number(form.Día.value),
    Number(form.Alimento_Consumido_kg.value),
    Number(form.Pasos_por_día.value),
    Number(form.Horas_de_Reposo.value),
    Number(form.Temperatura_Corp_C.value),
    form.Nivel_Actividad.value
  ]];
  predecir(data);
});

// Subida de CSV
document.getElementById("formCSV").addEventListener("submit", (e) => {
  e.preventDefault();
  const archivo = document.getElementById("csvFileInput").files[0];
  if (!archivo) return alert("Selecciona un archivo CSV");

  Papa.parse(archivo, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const datos = results.data.map(row => [
        row.Animal_ID,
        Number(row.Día),
        Number(row.Alimento_Consumido_kg),
        Number(row.Pasos_por_día),
        Number(row.Horas_de_Reposo),
        Number(row.Temperatura_Corp_C),
        row.Nivel_Actividad
      ]);
      predecir(datos);
    }
  });
});

// Botón: Descargar CSV de ejemplo
document.getElementById("btnEjemplo").addEventListener("click", () => {
  const encabezados = "Animal_ID,Día,Alimento_Consumido_kg,Pasos_por_día,Horas_de_Reposo,Temperatura_Corp_C,Nivel_Actividad\n";
  const filas = ejemplo.map(e => e.join(",")).join("\n");
  const blob = new Blob([encabezados + filas], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "ejemplo_vacas.csv";
  enlace.click();
  URL.revokeObjectURL(url);
});

// Botón: Probar CSV de ejemplo directo
document.getElementById("btnCargarEjemplo").addEventListener("click", () => {
  predecir(ejemplo);
});

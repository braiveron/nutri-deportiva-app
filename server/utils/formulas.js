// server/utils/formulas.js

function calcularMacros(datos) {
  const { peso, altura, edad, genero, nivel_actividad } = datos;

  // 1. Calcular TMB (Tasa Metabólica Basal) - Fórmula Mifflin-St Jeor
  let tmb = 10 * peso + 6.25 * altura - 5 * edad;

  if (genero === "masculino") {
    tmb += 5;
  } else {
    tmb -= 161;
  }

  // 2. Multiplicador de Actividad (Factor K)
  const factores = {
    sedentario: 1.2, // Poco o nada de ejercicio
    ligero: 1.375, // Ejercicio 1-3 días/semana
    moderado: 1.55, // Ejercicio 3-5 días/semana
    intenso: 1.725, // Ejercicio 6-7 días/semana (Tu caso probable)
    muy_intenso: 1.9, // Entrenamientos dobles/profesionales
  };

  const factor = factores[nivel_actividad] || 1.2; // Por defecto sedentario si falla
  const calorias_mantenimiento = Math.round(tmb * factor);

  // 3. Distribución de Macros para Acróbatas (Alto Rendimiento)
  // Proteína: 2.0g por kg de peso (fundamental para fuerza/potencia)
  // Grasas: 0.9g por kg de peso (salud hormonal)
  // Carbohidratos: El resto de las calorías (energía explosiva)

  const proteina_g = Math.round(peso * 2.0);
  const grasas_g = Math.round(peso * 0.9);

  // Cada gramo de proteina/carbo tiene 4 kcal, grasa tiene 9 kcal
  const cal_prot = proteina_g * 4;
  const cal_grasas = grasas_g * 9;

  // Los carbohidratos llenan el resto del tanque
  const cal_restantes = calorias_mantenimiento - (cal_prot + cal_grasas);
  const carbohidratos_g = Math.round(cal_restantes / 4);

  return {
    calorias_diarias: calorias_mantenimiento,
    macros: {
      proteinas: proteina_g,
      grasas: grasas_g,
      carbohidratos: carbohidratos_g,
    },
  };
}

module.exports = { calcularMacros };

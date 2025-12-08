/**
 * Valida un objeto de valores contra una lista de reglas de validación.
 * IMPORTANTE: Las validaciones se ejecutan en orden secuencial por campo.
 * Si una validación falla para un campo, las siguientes validaciones de ese campo NO se ejecutan.
 * Esto permite prioridad en mensajes (ej: primero "campo obligatorio", luego "longitud mínima").
 * 
 * @param {Array} validations - Un array de objetos de validación. Cada objeto debe tener: field, validator, message.
 * @param {Object} values - El objeto con los valores a validar (ej: el estado de un formulario).
 * @returns {Object} - Un objeto donde las claves son los campos con errores y los valores son los mensajes de error.
 */
export const validate = (validations, values) => {
  const errors = {};

  validations.forEach(validation => {
    const { field, validator, message } = validation;
    const value = values[field];

    // Si este campo YA tiene un error registrado, no validar más reglas para él
    if (errors[field]) {
      return; // Skip to next validation
    }

    // Si el validador devuelve false, significa que la validación falló.
    if (!validator(value, values)) {
      errors[field] = message;
    }
  });

  return errors;
};

/**
 * Verifica que el valor no sea nulo, indefinido o una cadena vacía (después de quitar espacios).
 * @param {*} value - El valor a verificar.
 * @returns {boolean}
 */
export const isNotEmpty = value => value != null && String(value).trim() !== '';

/**
 * Verifica que el valor sea un número finito.
 * @param {*} value - El valor a verificar.
 * @returns {boolean}
 */
export const isNumber = value => !isNaN(parseFloat(value)) && isFinite(value);

/**
 * Verifica que el valor sea un número positivo (> 0).
 * @param {*} value - El valor a verificar.
 * @returns {boolean}
 */
export const isPositive = value => isNumber(value) && parseFloat(value) > 0;

/**
 * Verifica que el valor sea un número entero.
 * @param {*} value - El valor a verificar.
 * @returns {boolean}
 */
export const isInteger = value => isNumber(value) && Number.isInteger(Number(value));

/**
 * Verifica que el valor no contenga caracteres especiales.
 * Permite letras (incluyendo acentos), números y espacios.
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const hasNoSpecialChars = value => {
  if (value == null || value === '') return true; // Un campo vacío no tiene caracteres especiales
  // Permite letras (incluyendo acentos), números, espacios, guiones y barras
  const pattern = /^[a-zA-Z0-9\u00C0-\u017F\s\-\/]+$/;
  return pattern.test(value);
};

// ============ VALIDACIONES DE LONGITUD ============

/**
 * Crea un validador que verifica la longitud mínima.
 * @param {number} length - Longitud mínima requerida.
 * @returns {function} Función validadora.
 */
export const minLength = (length) => (value) =>
  value != null && String(value).trim().length >= length;

/**
 * Crea un validador que verifica la longitud máxima.
 * @param {number} length - Longitud máxima permitida.
 * @returns {function} Función validadora.
 */
export const maxLength = (length) => (value) =>
  value != null && String(value).trim().length <= length;

// ============ VALIDACIONES DE TEXTO ============

/**
 * Verifica que el valor contenga solo letras y espacios (incluyendo acentos).
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const isAlpha = (value) => {
  if (value == null || value === '') return true;
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value);
};

/**
 * Verifica que el valor contenga solo letras, números y guiones bajos (sin espacios).
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const isAlphanumeric = (value) => {
  if (value == null || value === '') return true;
  return /^[a-zA-Z0-9_]+$/.test(value);
};

// ============ VALIDACIONES NUMÉRICAS ESPECÍFICAS ============

/**
 * Verifica que el valor sea una cédula venezolana válida.
 * Formato: Solo números, máximo 10 dígitos.
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const isCedula = (value) => {
  if (!value) return false;
  const cleaned = String(value).replace(/[^0-9]/g, '');
  return cleaned.length >= 1 && cleaned.length <= 10 && /^\d+$/.test(cleaned);
};

/**
 * Verifica que el valor sea un número de teléfono venezolano válido.
 * Formato esperado: +58-XXX-XXXXXXX (donde XXX es operadora: 412, 414, 416, 424, 426, 212, etc.)
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const isPhoneNumber = (value) => {
  if (!value) return false;
  // Formato: +58-XXX-XXXXXXX
  const pattern = /^\+58-(412|414|416|424|426|212|412|414|416|424|426|412|414|416|424|426)-\d{7}$/;
  return pattern.test(value);
};

/**
 * Verifica que el número de teléfono tenga una operadora válida venezolana.
 * @param {string} value - El valor a verificar (debe estar en formato +58-XXX-XXXXXXX).
 * @returns {boolean}
 */
export const hasValidOperator = (value) => {
  if (!value) return false;
  const validOperators = ['412', '414', '416', '424', '426', '212', '241', '243', '244', '245', '246', '247', '248', '249', '251', '252', '253', '254', '255', '256', '257', '258', '259', '261', '262', '263', '264', '265', '266', '267', '268', '269', '271', '272', '273', '274', '275', '276', '277', '278', '279', '281', '282', '283', '284', '285', '286', '287', '288', '289', '291', '292', '293', '294', '295'];
  const match = value.match(/^\+58-(\d{3})-\d{7}$/);
  return match && validOperators.includes(match[1]);
};

/**
 * Crea un validador que verifica que un número no tenga más decimales que los especificados.
 * @param {number} decimals - Número máximo de decimales permitidos.
 * @returns {function} Función validadora.
 */
export const maxDecimals = (decimals) => (value) => {
  if (!isNumber(value)) return false;
  const parts = String(value).split('.');
  return parts.length === 1 || parts[1].length <= decimals;
};

/**
 * Crea un validador que verifica que un número esté dentro de un rango.
 * @param {number} min - Valor mínimo permitido.
 * @param {number} max - Valor máximo permitido.
 * @returns {function} Función validadora.
 */
export const isInRange = (min, max) => (value) => {
  if (!isNumber(value)) return false;
  const num = parseFloat(value);
  return num >= min && num <= max;
};

// ============ VALIDACIONES DE CONTRASEÑAS ============

/**
 * Verifica que el valor contenga al menos una letra.
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const hasLetter = (value) =>
  value != null && /[a-zA-Z]/.test(value);

/**
 * Verifica que el valor contenga al menos una letra mayúscula.
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const hasUpperCase = (value) =>
  value != null && /[A-Z]/.test(value);

/**
 * Verifica que el valor contenga al menos un número.
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const hasNumber = (value) =>
  value != null && /\d/.test(value);

/**
 * Verifica que el valor contenga al menos un carácter especial.
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const hasSpecialChar = (value) =>
  value != null && /[!@#$%^&*(),.?":{}|<>]/.test(value);

/**
 * Crea un validador que verifica que el valor no contenga una subcadena específica.
 * @param {string} substring - La subcadena a buscar.
 * @returns {function} Función validadora.
 */
export const notContains = (substring) => (value) =>
  value == null || !String(value).toLowerCase().includes(substring.toLowerCase());

// ============ VALIDACIONES DE CÓDIGO DE BARRAS ============

/**
 * Verifica que el valor sea un código de barras válido (8-13 dígitos).
 * @param {string} value - El valor a verificar.
 * @returns {boolean}
 */
export const isValidBarcode = (value) => {
  if (!value) return false;
  const cleaned = value.replace(/[-\s]/g, '');
  return /^\d{8,13}$/.test(cleaned);
};

/**
 * Verifica que el valor sea un código EAN-13 válido con dígito verificador correcto.
 * @param {string} value - El valor a verificar (debe tener 13 dígitos).
 * @returns {boolean}
 */
export const isEAN13 = (value) => {
  if (!value || value.length !== 13) return false;
  if (!/^\d{13}$/.test(value)) return false;

  const digits = value.split('').map(Number);
  const checksum = digits.slice(0, 12).reduce((sum, digit, index) =>
    sum + digit * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (checksum % 10)) % 10;
  return checkDigit === digits[12];
};

// ============ VALIDACIONES DE ARCHIVOS ============

/**
 * Verifica que un archivo sea de tipo imagen válido (PNG, JPG, JPEG).
 * @param {File} file - El archivo a verificar.
 * @returns {boolean}
 */
export const isValidImageType = (file) => {
  if (!file) return true; // Opcional
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  return validTypes.includes(file.type);
};

/**
 * Crea un validador que verifica el tamaño máximo de un archivo.
 * @param {number} maxSizeMB - Tamaño máximo en megabytes.
 * @returns {function} Función validadora.
 */
export const isValidImageSize = (maxSizeMB = 5) => (file) => {
  if (!file) return true; // Opcional
  return file.size <= maxSizeMB * 1024 * 1024;
};

// ============ VALIDACIONES DE COMPARACIÓN ============

/**
 * Crea un validador que compara si el valor es mayor o igual a otro campo.
 * @param {string} compareField - Nombre del campo a comparar.
 * @returns {function} Función validadora.
 */
export const greaterThanOrEqual = (compareField) => (value, allValues) => {
  if (!isNumber(value) || !isNumber(allValues[compareField])) return true;
  return parseFloat(value) >= parseFloat(allValues[compareField]);
};

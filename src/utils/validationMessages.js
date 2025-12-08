/**
 * Mensajes de error centralizados para validaciones.
 * Mantiene consistencia en todos los formularios del sistema.
 */
export const errorMessages = {
    // ============ CAMPOS GENERALES ============
    required: 'Este campo es obligatorio.',

    // ============ NOMBRES ============
    nameRequired: 'El nombre es obligatorio.',
    nameMinLength: 'El nombre debe tener al menos 3 caracteres.',
    nameMaxLength: 'El nombre no puede exceder 100 caracteres.',
    nameOnlyLetters: 'El nombre solo puede contener letras y espacios.',

    // ============ USUARIO ============
    usernameRequired: 'El nombre de usuario es obligatorio.',
    usernameMinLength: 'El usuario debe tener al menos 3 caracteres.',
    usernameMaxLength: 'El usuario no puede exceder 30 caracteres.',
    usernameFormat: 'El usuario solo puede contener letras, números y guiones bajos.',
    usernameNoSpaces: 'El usuario no puede contener espacios.',
    usernameTaken: 'Este nombre de usuario ya está en uso.',

    // ============ CÉDULA ============
    cedulaRequired: 'La cédula es obligatoria.',
    cedulaFormat: 'La cédula debe contener solo números (máximo 10 dígitos).',
    cedulaTaken: 'Esta cédula ya está registrada.',

    // ============ TELÉFONO ============
    phoneRequired: 'El teléfono es obligatorio.',
    phoneFormat: 'Formato inválido. Use: +58-XXX-XXXXXXX (ej: +58-412-1234567)',
    phoneOperator: 'Operadora no válida. Use: 412, 414, 416, 424, 426, 212, etc.',

    // ============ CONTRASEÑAS ============
    passwordRequired: 'La contraseña es obligatoria.',
    passwordMinLength: 'La contraseña debe tener al menos 8 caracteres.',
    passwordHasLetter: 'La contraseña debe contener al menos una letra.',
    passwordHasUpperCase: 'La contraseña debe contener al menos una letra mayúscula.',
    passwordHasNumber: 'La contraseña debe contener al menos un número.',
    passwordHasSpecialChar: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*, etc.).',
    passwordNoUsername: 'La contraseña no puede contener el nombre de usuario.',
    passwordMismatch: 'Las contraseñas no coinciden.',
    passwordSameAsOld: 'La nueva contraseña debe ser diferente a la actual.',
    currentPasswordRequired: 'La contraseña actual es obligatoria.',

    // ============ PRECIOS ============
    priceRequired: 'El precio es obligatorio.',
    pricePositive: 'El precio debe ser mayor que 0.',
    priceDecimals: 'El precio no puede tener más de 2 decimales.',
    priceVentaMayor: 'El precio de venta debe ser mayor o igual al de costo.',
    priceTooHigh: 'El precio no puede exceder 999,999,999.99',

    // ============ CÓDIGO DE BARRAS ============
    barcodeRequired: 'El código de barras es obligatorio.',
    barcodeFormat: 'Código de barras inválido. Debe tener entre 8-13 dígitos.',
    barcodeEAN13: 'Código EAN-13 inválido. Verifique el dígito verificador.',
    barcodeTaken: 'Este código de barras ya está en uso.',

    // ============ IMÁGENES ============
    imageType: 'Solo se permiten imágenes PNG, JPG o JPEG.',
    imageSize: 'La imagen no puede exceder 5MB.',

    // ============ CATEGORÍA ============
    categoryRequired: 'La categoría es obligatoria.',
    categoryMinLength: 'La categoría debe tener al menos 2 caracteres.',
    categoryMaxLength: 'La categoría no puede exceder 100 caracteres.',

    // ============ ROL ============
    roleRequired: 'El rol es obligatorio.',
    roleMinLength: 'El rol debe tener al menos 2 caracteres.',
    roleMaxLength: 'El rol no puede exceder 50 caracteres.',

    // ============ PREGUNTAS DE SEGURIDAD ============
    questionsRequired: 'Debes seleccionar 3 preguntas de seguridad.',
    answersRequired: 'Todas las respuestas son obligatorias.',
    questionsDuplicate: 'No puedes seleccionar la misma pregunta más de una vez.',
    answerMinLength: 'La respuesta debe tener al menos 2 caracteres.',
    answerMaxLength: 'La respuesta no puede exceder 100 caracteres.',

    // ============ CANTIDAD ============
    quantityPositive: 'La cantidad debe ser mayor que 0.',
    quantityInteger: 'La cantidad debe ser un número entero.',
    quantityExceedsStock: 'La cantidad excede el stock disponible.',
    quantityTooHigh: 'La cantidad no puede exceder 9999 unidades.',

    // ============ DESCRIPCIÓN ============
    descriptionMaxLength: 'La descripción no puede exceder 150 caracteres.',

    // ============ PRODUCTOS ============
    productNameRequired: 'El nombre del producto es obligatorio.',
    productNameMinLength: 'El nombre debe tener al menos 2 caracteres.',
    productNameMaxLength: 'El nombre no puede exceder 100 caracteres.',
    productNoSpecialChars: 'El nombre no puede contener caracteres especiales.',

    // ============ VENTAS ============
    cartEmpty: 'El carrito está vacío. Agrega productos antes de procesar la venta.',
    barcodeNotFound: 'Producto no encontrado con ese código de barras.',
};

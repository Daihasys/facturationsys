import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "../../context/AuthContext";
import {
  validate,
  isNotEmpty,
  minLength,
  maxLength,
  isAlpha,
  isAlphanumeric,
  isCedula,
  isPhoneNumber,
  hasValidOperator,
  hasLetter,
  hasUpperCase,
  hasNumber,
  hasSpecialChar,
  notContains
} from "../../utils/validators";
import { errorMessages } from "../../utils/validationMessages";

const UserModal = ({ isOpen, onClose, onSave, user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    nombre_usuario: "",
    cedula: "",
    telefono: "",
    password: "",
    role: "Vendedor",
  });
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([
    { question_id: '', answer: '' },
    { question_id: '', answer: '' },
    { question_id: '', answer: '' }
  ]);
  const [roles, setRoles] = useState([]); // Estado para roles dinámicos

  const [errors, setErrors] = useState({});
  const { token } = useAuth();
  const isEditing = !!user;


  useEffect(() => {
    if (isOpen) {
      fetchRoles(); // Cargar roles al abrir el modal
      if (user) {
        setFormData({
          nombre_completo: user.nombre_completo || "",
          nombre_usuario: user.nombre_usuario || "",
          cedula: user.cedula || "",
          telefono: user.telefono || "",
          password: "",
          role: user.role || "Vendedor",
        });
        setStep(1); // Always start at step 1 for editing
      } else {
        // Reset for new user
        setStep(1);
        setFormData({
          nombre_completo: "",
          nombre_usuario: "",
          cedula: "",
          telefono: "",
          password: "",
          role: "Vendedor",
        });
        fetchSecurityQuestions();
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/roles', {
        headers: { 'x-auth-token': token }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchSecurityQuestions = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/security-questions",
        {
          headers: { "x-auth-token": token },
        },
      );
      const data = await response.json();
      setSecurityQuestions(data);
    } catch (error) {
      console.error("Error fetching security questions:", error);
    }
  };

  const handleQuestionChange = (index, questionId) => {
    const newAnswers = [...userAnswers];
    newAnswers[index].question_id = questionId;
    setUserAnswers(newAnswers);
  };

  const handleAnswerChange = (index, answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[index].answer = answer;
    setUserAnswers(newAnswers);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si es el campo de cédula, filtrar solo números y limitar a 10 dígitos
    if (name === 'cedula') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    const validations = [
      { field: 'nombre_completo', validator: isNotEmpty, message: errorMessages.nameRequired },
      { field: 'nombre_completo', validator: minLength(3), message: errorMessages.nameMinLength },
      { field: 'nombre_completo', validator: maxLength(100), message: errorMessages.nameMaxLength },
      { field: 'nombre_completo', validator: isAlpha, message: errorMessages.nameOnlyLetters },
      { field: 'nombre_usuario', validator: isNotEmpty, message: errorMessages.usernameRequired },
      { field: 'nombre_usuario', validator: minLength(3), message: errorMessages.usernameMinLength },
      { field: 'nombre_usuario', validator: maxLength(30), message: errorMessages.usernameMaxLength },
      { field: 'nombre_usuario', validator: isAlphanumeric, message: errorMessages.usernameFormat },
      { field: 'cedula', validator: isNotEmpty, message: errorMessages.cedulaRequired },
      { field: 'cedula', validator: isCedula, message: errorMessages.cedulaFormat },
      { field: 'telefono', validator: isNotEmpty, message: errorMessages.phoneRequired },
      { field: 'telefono', validator: isPhoneNumber, message: errorMessages.phoneFormat },
      { field: 'telefono', validator: hasValidOperator, message: errorMessages.phoneOperator },
      { field: 'role', validator: isNotEmpty, message: errorMessages.roleRequired },
    ];

    // Validaciones de contraseña (solo para nuevos usuarios o si se está cambiando)
    if (!isEditing || formData.password.trim()) {
      validations.push(
        { field: 'password', validator: isNotEmpty, message: errorMessages.passwordRequired },
        { field: 'password', validator: minLength(8), message: errorMessages.passwordMinLength },
        { field: 'password', validator: hasLetter, message: errorMessages.passwordHasLetter },
        { field: 'password', validator: hasUpperCase, message: errorMessages.passwordHasUpperCase },
        { field: 'password', validator: hasNumber, message: errorMessages.passwordHasNumber },
        { field: 'password', validator: hasSpecialChar, message: errorMessages.passwordHasSpecialChar },
        { field: 'password', validator: notContains(formData.nombre_usuario), message: errorMessages.passwordNoUsername }
      );
    }

    const validationErrors = validate(validations, formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    // Check if all questions are selected
    const hasEmptyQuestion = userAnswers.some(q => !q.question_id);
    if (hasEmptyQuestion) {
      newErrors.form = errorMessages.questionsRequired;
    }

    // Check if all answers are filled
    const hasEmptyAnswer = userAnswers.some(q => !q.answer.trim());
    if (hasEmptyAnswer) {
      newErrors.form = errorMessages.answersRequired;
    }

    // Check for duplicate questions
    const questionIds = userAnswers.map(q => q.question_id).filter(id => id);
    const uniqueIds = new Set(questionIds);
    if (uniqueIds.size !== questionIds.length && questionIds.length === 3) {
      newErrors.form = errorMessages.questionsDuplicate;
    }

    // Validate answer lengths
    const hasShortAnswer = userAnswers.some(q => q.answer.trim() && q.answer.trim().length < 2);
    if (hasShortAnswer) {
      newErrors.form = errorMessages.answerMinLength;
    }

    const hasLongAnswer = userAnswers.some(q => q.answer.trim().length > 100);
    if (hasLongAnswer) {
      newErrors.form = errorMessages.answerMaxLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault(); // Prevent form submission from reloading page

    const headers = {
      "Content-Type": "application/json",
      "x-auth-token": token,
    };

    // If we are editing, just validate and save step 1 data.
    if (isEditing) {
      if (validateStep1()) {
        try {
          const response = await fetch(
            `http://localhost:4000/api/users/${user.id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify(formData),
            },
          );
          const result = await response.json();
          if (response.ok) {
            onSave(result.message || "Usuario actualizado exitosamente.");
          } else {
            setErrors({
              form: result.error || "Error al actualizar el usuario.",
            });
          }
        } catch (error) {
          setErrors({ form: "No se pudo conectar con el servidor." });
        }
      }
      return;
    }

    // If we are creating a new user, handle the multi-step process.
    if (step === 1) {
      if (validateStep1()) {
        setStep(2); // Go to security questions
      }
    } else if (step === 2) {
      if (validateStep2()) {
        const finalData = {
          ...formData,
          answers: userAnswers,
        };
        try {
          const response = await fetch(`http://localhost:4000/api/users`, {
            method: "POST",
            headers,
            body: JSON.stringify(finalData),
          });
          const result = await response.json();
          if (response.ok) {
            onSave(result.message || "Usuario creado exitosamente.");
          } else {
            setErrors({ form: result.error || "Error al guardar el usuario." });
          }
        } catch (error) {
          setErrors({ form: "No se pudo conectar con el servidor." });
        }
      }
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleSave}>
      <div className="mb-4">
        <label
          htmlFor="nombre_completo"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre
        </label>
        <input
          type="text"
          name="nombre_completo"
          id="nombre_completo"
          value={formData.nombre_completo}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
        />
        {errors.nombre_completo && (
          <p className="text-red-500 text-xs mt-1">{errors.nombre_completo}</p>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="nombre_usuario"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre de Usuario
        </label>
        <input
          type="text"
          name="nombre_usuario"
          id="nombre_usuario"
          value={formData.nombre_usuario}
          onChange={handleChange}
          placeholder="Ej: jperez123"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
        />
        {errors.nombre_usuario && (
          <p className="text-red-500 text-xs mt-1">{errors.nombre_usuario}</p>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="cedula"
          className="block text-sm font-medium text-gray-700"
        >
          Cédula
        </label>
        <input
          type="text"
          name="cedula"
          id="cedula"
          value={formData.cedula}
          onChange={handleChange}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="10"
          placeholder="Solo números (Ej: 12345678)"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
        />
        {errors.cedula && (
          <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="telefono"
          className="block text-sm font-medium text-gray-700"
        >
          Teléfono
        </label>
        <input
          type="text"
          name="telefono"
          id="telefono"
          value={formData.telefono}
          onChange={handleChange}
          placeholder="Formato: +58-412-1234567"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
        />
        {errors.telefono && (
          <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Contraseña {isEditing && "(dejar en blanco para no cambiar)"}
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres (mayúscula, número, símbolo)"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
        />
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>
      <div className="mb-6">
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          Rol
        </label>
        <select
          name="role"
          id="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
        >
          {roles.length > 0 ? (
            roles.map((role) => (
              <option key={role.id} value={role.nombre}>
                {role.nombre}
              </option>
            ))
          ) : (
            <>
              <option value="Vendedor">Vendedor</option>
              <option value="Administrador">Administrador</option>
            </>
          )}
        </select>
        {errors.role && (
          <p className="text-red-500 text-xs mt-1">{errors.role}</p>
        )}
      </div>
      {errors.form && (
        <p className="text-red-500 text-sm mb-4">{errors.form}</p>
      )}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
        >
          Cancelar
        </button>
        {isEditing ? (
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-havelock-blue-400 text-white hover:bg-havelock-blue-500 transition-colors font-semibold"
          >
            Guardar Cambios
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-havelock-blue-400 text-white hover:bg-havelock-blue-500 transition-colors font-semibold"
          >
            Siguiente
          </button>
        )}
      </div>
    </form>
  );

  const getAvailableQuestions = (currentIndex) => {
    const selectedIds = userAnswers
      .map((q, idx) => idx !== currentIndex ? q.question_id : null)
      .filter(id => id);

    return securityQuestions.filter(q => !selectedIds.includes(q.id.toString()));
  };

  const renderStep2 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Configurar Preguntas de Seguridad
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Selecciona 3 preguntas de seguridad y proporciona las respuestas. Estas preguntas se usarán para recuperar tu cuenta si olvidas la contraseña.
      </p>
      <div className="space-y-4">
        {userAnswers.map((question, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pregunta {index + 1}
              </label>
              <select
                value={question.question_id}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
              >
                <option value="">Selecciona una pregunta</option>
                {getAvailableQuestions(index).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.pregunta}
                  </option>
                ))}
                {question.question_id && !getAvailableQuestions(index).find(q => q.id.toString() === question.question_id) && (
                  <option value={question.question_id}>
                    {securityQuestions.find(q => q.id.toString() === question.question_id)?.pregunta}
                  </option>
                )}
              </select>
            </div>

            {question.question_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respuesta
                </label>
                <input
                  type="text"
                  value={question.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm"
                  placeholder="Tu respuesta secreta"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {errors.form && (
        <p className="text-red-500 text-sm mt-4">{errors.form}</p>
      )}
      <div className="flex justify-end space-x-3 mt-8">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-havelock-blue-400 text-white hover:bg-havelock-blue-500 transition-colors font-semibold"
        >
          Guardar Usuario
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {isEditing ? "Editar Usuario" : "Añadir Nuevo Usuario"}
      </h2>
      {step === 1 ? renderStep1() : renderStep2()}
    </Modal>
  );
};

export default UserModal;

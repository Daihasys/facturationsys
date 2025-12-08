import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UserIcon from '../../assets/user.svg';
import BoxIcon from '../../assets/box.svg'; // Using for password and answers
import BgLogin from '../../assets/bg-login.svg';

const PasswordRecovery = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:4000/api/users/${username}/security-questions`);
      const data = await response.json();
      if (response.ok) {
        if (data.length > 0) {
          setSecurityQuestions(data);
          setUserAnswers(data.map(q => ({ questionId: q.id, answer: '' })));
          setStep(2);
        } else {
          setError('Este usuario no tiene preguntas de seguridad configuradas.');
        }
      } else {
        setError(data.error || 'Usuario no encontrado.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(currentAnswers =>
      currentAnswers.map(a =>
        a.questionId === questionId ? { ...a, answer } : a
      )
    );
  };

  const handleRecoverySubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    const answers = userAnswers.map(a => a.answer);

    try {
      const response = await fetch('http://localhost:4000/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword, answers }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('La contraseña ha sido restablecida exitosamente.');
        setStep(3);
      } else {
        setError(data.error || 'Las respuestas de seguridad no coinciden o son incorrectas.');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form className="space-y-6" onSubmit={handleUsernameSubmit}>
            <div className="relative">
              <label htmlFor="username" className="block text-sm font-medium text-gray-800">
                Usuario
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <img src={UserIcon} className="h-5 w-5 text-gray-400" aria-hidden="true" alt="User Icon" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 placeholder-gray-500 bg-white border border-havelock-blue-100 rounded-md focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm transition-all duration-200"
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="flex justify-center w-full px-4 py-3 text-lg font-medium text-white bg-havelock-blue-500 border border-transparent rounded-md shadow-lg hover:bg-havelock-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-havelock-blue-500 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Buscando..." : "Siguiente"}
              </button>
            </div>
          </form>
        );
      case 2:
        return (
          <form className="space-y-6" onSubmit={handleRecoverySubmit}>
            {securityQuestions.map((q, index) => (
              <div key={q.id} className="relative">
                <label htmlFor={`secretAnswer-${q.id}`} className="block text-sm font-medium text-gray-800">
                  {q.pregunta}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <img src={BoxIcon} className="h-5 w-5 text-gray-400" aria-hidden="true" alt="Answer Icon" />
                  </div>
                  <input
                    id={`secretAnswer-${q.id}`}
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 placeholder-gray-500 bg-white border border-havelock-blue-100 rounded-md focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm transition-all duration-200"
                    placeholder="Tu respuesta secreta"
                    value={userAnswers[index].answer}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
            <div className="relative">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-800">
                Nueva Contraseña
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <img src={BoxIcon} className="h-5 w-5 text-gray-400" aria-hidden="true" alt="Password Icon" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2 placeholder-gray-500 bg-white border border-havelock-blue-100 rounded-md focus:outline-none focus:ring-havelock-blue-400 focus:border-havelock-blue-400 sm:text-sm transition-all duration-200"
                  placeholder="Debe tener al menos 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="flex justify-center w-full px-4 py-3 text-lg font-medium text-white bg-havelock-blue-500 border border-transparent rounded-md shadow-lg hover:bg-havelock-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-havelock-blue-500 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Restableciendo..." : "Restablecer Contraseña"}
              </button>
            </div>
          </form>
        );
      case 3:
        return (
          <div className="text-center">
            <p className="text-green-700 text-center bg-green-100 border border-green-300 p-2 rounded-md">
              {message}
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="flex justify-center w-full px-4 py-3 text-lg font-medium text-white bg-havelock-blue-500 border border-transparent rounded-md shadow-lg hover:bg-havelock-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-havelock-blue-500 transition-all duration-200"
              >
                Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gradient-to-br from-havelock-blue-300 to-havelock-blue-500">
      <img src={BgLogin} className="absolute inset-0 w-full h-full object-cover z-0" aria-hidden="true" alt="Background" />
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl border border-havelock-blue-80 animate-in fade-in duration-1000 transition-all duration-300 hover:shadow-[0_0_30px_0_rgba(0,0,0,0.3)] hover:scale-105">
        <h2 className="text-4xl font-extrabold text-center text-havelock-blue-400">
          Recuperar Contraseña
        </h2>

        {error && (
          <p className="text-red-700 text-center bg-red-100 border border-red-300 p-2 rounded-md">
            {error}
          </p>
        )}

        {renderStepContent()}

        {step !== 3 && (
          <div className="text-sm text-center">
            <Link
              to="/login"
              className="font-medium text-havelock-blue-500 hover:text-havelock-blue-600 transition-all duration-200"
            >
              Volver
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordRecovery;

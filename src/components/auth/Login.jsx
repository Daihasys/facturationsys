import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from '../../context/AuthContext';
import { validate, isNotEmpty, minLength } from '../../utils/validators';
import { errorMessages } from '../../utils/validationMessages';
import UserIcon from '../../assets/user.svg';
import BoxIcon from '../../assets/box.svg';
import BgLogin from '../../assets/bg-login.svg';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setErrors({});

    // Validaciones del formulario
    const validations = [
      { field: 'username', validator: isNotEmpty, message: errorMessages.usernameRequired },
      { field: 'username', validator: minLength(3), message: errorMessages.usernameMinLength },
      { field: 'password', validator: isNotEmpty, message: errorMessages.passwordRequired },
    ];

    const validationErrors = validate(validations, { username, password });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data); // Call login from context
      } else {
        setError(data.error || `Error ${response.status}`);
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
      console.error(err);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center h-screen bg-gradient-to-br from-havelock-blue-300 to-havelock-blue-500"
    >
      <img src={BgLogin} className="absolute inset-0 w-full h-full object-cover z-0" aria-hidden="true" alt="Background" />
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl border border-havelock-blue-80 animate-in fade-in duration-1000 transition-all duration-300 hover:shadow-[0_0_30px_0_rgba(0,0,0,0.3)] hover:scale-105">
        <h2 className="text-4xl font-extrabold text-center text-havelock-blue-400">
          Bienvenido
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <p className="text-red-700 text-center bg-red-100 border border-red-300 p-2 rounded-md">
              {error}
            </p>
          )}
          <div className="relative">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-800"
            >
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
                className={`block w-full pl-10 pr-3 py-2 placeholder-gray-500 bg-white border rounded-md focus:outline-none sm:text-sm transition-all duration-200 ${errors.username ? 'border-red-500 ring-1 ring-red-500' : 'border-havelock-blue-100 focus:ring-havelock-blue-400 focus:border-havelock-blue-400'
                  }`}
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-800"
            >
              Contraseña
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <img src={BoxIcon} className="h-5 w-5 text-gray-400" aria-hidden="true" alt="Password Icon" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className={`block w-full pl-10 pr-10 py-2 placeholder-gray-500 bg-white border rounded-md focus:outline-none sm:text-sm transition-all duration-200 ${errors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-havelock-blue-100 focus:ring-havelock-blue-400 focus:border-havelock-blue-400'
                  }`}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/password-recovery"
                className="font-medium text-havelock-blue-500 hover:text-havelock-blue-600 transition-all duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="flex justify-center w-full px-4 py-3 text-lg font-medium text-white bg-havelock-blue-500 border border-transparent rounded-md shadow-lg hover:bg-havelock-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-havelock-blue-500 transition-all duration-200"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

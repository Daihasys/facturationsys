import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessages } from '../../utils/validationMessages';

function UpdateSecurityQuestionsModal({ onClose }) {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: verify password, 2: update questions
    const [currentPassword, setCurrentPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [allQuestions, setAllQuestions] = useState([]);
    const [currentUserQuestions, setCurrentUserQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([
        { question_id: '', answer: '' },
        { question_id: '', answer: '' },
        { question_id: '', answer: '' }
    ]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAllQuestions();
        fetchCurrentQuestions();
    }, []);

    const fetchAllQuestions = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/security-questions');
            const data = await response.json();
            setAllQuestions(data);
        } catch (err) {
            console.error('Error fetching questions:', err);
        }
    };

    const fetchCurrentQuestions = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/users/${user.userId}/security-questions`);
            const data = await response.json();
            setCurrentUserQuestions(data);
        } catch (err) {
            console.error('Error fetching user questions:', err);
        }
    };

    const handleVerifyPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!currentPassword) {
            setError('La contraseña es obligatoria.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:4000/api/users/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    currentPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setStep(2);
                setError('');
            } else {
                setError('Contraseña incorrecta.');
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuestionChange = (index, questionId) => {
        const newQuestions = [...selectedQuestions];
        newQuestions[index].question_id = questionId;
        setSelectedQuestions(newQuestions);
    };

    const handleAnswerChange = (index, answer) => {
        const newQuestions = [...selectedQuestions];
        newQuestions[index].answer = answer;
        setSelectedQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validations
        const hasEmptyQuestion = selectedQuestions.some(q => !q.question_id);
        const hasEmptyAnswer = selectedQuestions.some(q => !q.answer.trim());

        if (hasEmptyQuestion) {
            setError(errorMessages.questionsRequired);
            return;
        }

        if (hasEmptyAnswer) {
            setError(errorMessages.answersRequired);
            return;
        }

        // Check for duplicate questions
        const questionIds = selectedQuestions.map(q => q.question_id);
        const uniqueIds = new Set(questionIds);
        if (uniqueIds.size !== questionIds.length) {
            setError(errorMessages.questionsDuplicate);
            return;
        }

        // Validate answer lengths
        const hasShortAnswer = selectedQuestions.some(q => q.answer.trim() && q.answer.trim().length < 2);
        if (hasShortAnswer) {
            setError(errorMessages.answerMinLength);
            return;
        }

        const hasLongAnswer = selectedQuestions.some(q => q.answer.trim().length > 100);
        if (hasLongAnswer) {
            setError(errorMessages.answerMaxLength);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`http://localhost:4000/api/users/${user.userId}/security-questions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    questions: selectedQuestions
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Preguntas de seguridad actualizadas exitosamente.');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(data.error || 'Error al actualizar las preguntas.');
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getAvailableQuestions = (currentIndex) => {
        const selectedIds = selectedQuestions
            .map((q, idx) => idx !== currentIndex ? q.question_id : null)
            .filter(id => id);

        return allQuestions.filter(q => !selectedIds.includes(q.id.toString()));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Preguntas de Seguridad</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md mb-4">
                            {success}
                        </div>
                    )}

                    {step === 1 ? (
                        /* Step 1: Verify Password */
                        <form onSubmit={handleVerifyPassword} className="space-y-4">
                            <div className="bg-havelock-blue-50 border border-havelock-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start space-x-3">
                                    <ShieldCheck className="w-5 h-5 text-havelock-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-havelock-blue-900">Verificación de Seguridad</p>
                                        <p className="text-sm text-havelock-blue-700 mt-1">
                                            Por tu seguridad, primero debes ingresar tu contraseña actual para actualizar tus preguntas de seguridad.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {currentUserQuestions.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Tus preguntas actuales:</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {currentUserQuestions.map((q, idx) => (
                                            <li key={idx} className="text-sm text-gray-600">{q.pregunta}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña Actual
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent"
                                        placeholder="Ingresa tu contraseña actual"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isLoading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-havelock-blue-500 text-white rounded-lg hover:bg-havelock-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verificando...' : 'Continuar'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Step 2: Update Questions */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Selecciona 3 preguntas de seguridad y proporciona las respuestas. Estas preguntas te ayudarán a recuperar tu cuenta en caso de olvidar tu contraseña.
                            </p>

                            {selectedQuestions.map((question, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pregunta {index + 1}
                                        </label>
                                        <select
                                            value={question.question_id}
                                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent"
                                            disabled={isLoading}
                                        >
                                            <option value="">Selecciona una pregunta</option>
                                            {getAvailableQuestions(index).map((q) => (
                                                <option key={q.id} value={q.id}>
                                                    {q.pregunta}
                                                </option>
                                            ))}
                                            {question.question_id && !getAvailableQuestions(index).find(q => q.id.toString() === question.question_id) && (
                                                <option value={question.question_id}>
                                                    {allQuestions.find(q => q.id.toString() === question.question_id)?.pregunta}
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-havelock-blue-500 focus:border-transparent"
                                                placeholder="Tu respuesta secreta (máx. 100 caracteres)"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isLoading}
                                >
                                    Atrás
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-havelock-blue-500 text-white rounded-lg hover:bg-havelock-blue-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UpdateSecurityQuestionsModal;

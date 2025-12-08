import React, { useState } from 'react';
import './FlippableCard.css';

/**
 * FlippableCard Component
 * Tarjeta con animación de volteo 3D que alterna entre dos vistas
 * Si solo se proporciona un lado, se muestra sin animación
 */
function FlippableCard({ frontContent, backContent, className = '' }) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Si solo hay un lado, mostrarlo directamente sin flip
    const hasBackContent = backContent !== null && backContent !== undefined;

    const handleClick = () => {
        if (hasBackContent) {
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <div
            className={`flippable-card-container ${className}`}
            onClick={handleClick}
            style={{ cursor: hasBackContent ? 'pointer' : 'default' }}
        >
            <div className={`flippable-card ${isFlipped ? 'flipped' : ''}`}>
                {/* Lado frontal */}
                <div className="flippable-card-face flippable-card-front">
                    {frontContent}
                </div>

                {/* Lado trasero (solo si existe) */}
                {hasBackContent && (
                    <div className="flippable-card-face flippable-card-back">
                        {backContent}
                    </div>
                )}
            </div>

            {/* Indicador de flip (solo si hay dos lados) */}
            {hasBackContent && (
                <div className="flip-indicator">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="flip-icon"
                    >
                        <path d="M3 12h18M3 12l6-6M3 12l6 6" />
                        <path d="M21 12l-6-6M21 12l-6 6" />
                    </svg>
                </div>
            )}
        </div>
    );
}

export default FlippableCard;

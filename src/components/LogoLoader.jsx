import React from 'react';
import './LogoLoader.css';

/**
 * Premium Animated Logo Loader
 * Features:
 * - Liquid fill animation from bottom to top
 * - Smooth gradient wave effect
 * - Pulsing glow
 * - Responsive design
 */
const LogoLoader = ({ size = 'medium', message = 'Loading...' }) => {
    // Size variants
    const sizeClasses = {
        small: 'logo-loader-small',
        medium: 'logo-loader-medium',
        large: 'logo-loader-large',
    };

    return (
        <div className="logo-loader-container">
            <div className={`logo-loader-wrapper ${sizeClasses[size]}`}>
                {/* Logo container with mask */}
                <div className="logo-loader-mask">
                    {/* Background logo (grayscale/outline) */}
                    <img
                        src="/img/Logo/HomelyHopeIcon.png"
                        alt="Loading"
                        className="logo-loader-bg"
                    />

                    {/* Animated fill layer */}
                    <div className="logo-loader-fill">
                        {/* Colored logo that gets revealed */}
                        <img
                            src="/img/Logo/HomelyHopeIcon.png"
                            alt="Loading"
                            className="logo-loader-colored"
                        />

                        {/* Wave effect */}
                        <div className="logo-loader-wave">
                            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                                <path
                                    d="M0,0 C150,50 350,0 600,50 C850,100 1050,50 1200,50 L1200,120 L0,120 Z"
                                    className="wave-path"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Glow effect */}
                    <div className="logo-loader-glow"></div>
                </div>

                {/* Loading text */}
                {message && (
                    <div className="logo-loader-text">
                        <span className="loading-message">{message}</span>
                        <span className="loading-dots">
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogoLoader;

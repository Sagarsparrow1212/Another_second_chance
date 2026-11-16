import React from 'react';

/**
 * Clean & Modern Minimalist Spinner Loader
 */
const LogoLoader = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeMap = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-14 h-14 border-4',
  };

  const spinnerClass = sizeMap[size] || sizeMap.medium;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8">
      {/* Clean Circular Spinner */}
      <div
        className={`${spinnerClass} border-blue-600 border-t-transparent rounded-full animate-spin mb-4`}
      />

      {/* Clean Minimal Message */}
      {message && (
        <p className="text-gray-500 text-sm font-medium tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
};

export default LogoLoader;

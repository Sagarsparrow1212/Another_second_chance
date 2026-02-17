import React, { useState } from 'react';
import LogoLoader from '../components/LogoLoader';
import { Button, Card, CardBody, Typography } from '@material-tailwind/react';

/**
 * Logo Loader Demo Page
 * Test and preview different loader variants
 */
const LogoLoaderDemo = () => {
    const [showLoader, setShowLoader] = useState(false);
    const [size, setSize] = useState('medium');
    const [message, setMessage] = useState('Loading...');
    const [theme, setTheme] = useState('');

    const handleShowLoader = (loaderSize, loaderMessage, loaderTheme = '') => {
        setSize(loaderSize);
        setMessage(loaderMessage);
        setTheme(loaderTheme);
        setShowLoader(true);

        // Auto-hide after 5 seconds for demo
        setTimeout(() => {
            setShowLoader(false);
        }, 5000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8FBFF] via-[#EAEFF5] to-[#F8FBFF] py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <Typography variant="h2" className="text-gray-800 mb-2 font-bold">
                        Logo Loader Demo
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                        Test different loader sizes, messages, and themes
                    </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Size Variants */}
                    <Card>
                        <CardBody>
                            <Typography variant="h5" className="mb-4 font-semibold text-gray-800">
                                Size Variants
                            </Typography>
                            <div className="space-y-3">
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('small', 'Loading...')}
                                    className="normal-case"
                                    color="blue"
                                >
                                    Small Loader
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Loading...')}
                                    className="normal-case"
                                    color="blue"
                                >
                                    Medium Loader
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('large', 'Loading...')}
                                    className="normal-case"
                                    color="blue"
                                >
                                    Large Loader
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Message Variants */}
                    <Card>
                        <CardBody>
                            <Typography variant="h5" className="mb-4 font-semibold text-gray-800">
                                Message Variants
                            </Typography>
                            <div className="space-y-3">
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Loading...')}
                                    className="normal-case"
                                    color="indigo"
                                >
                                    Default Message
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Please wait')}
                                    className="normal-case"
                                    color="indigo"
                                >
                                    Custom Message
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Processing your request')}
                                    className="normal-case"
                                    color="indigo"
                                >
                                    Long Message
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', '')}
                                    className="normal-case"
                                    color="indigo"
                                >
                                    No Message
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Theme Variants */}
                    <Card>
                        <CardBody>
                            <Typography variant="h5" className="mb-4 font-semibold text-gray-800">
                                Theme Variants
                            </Typography>
                            <div className="space-y-3">
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Loading...', '')}
                                    className="normal-case bg-gradient-to-r from-purple-600 to-indigo-600"
                                >
                                    Default Theme
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Loading...', 'light-theme')}
                                    className="normal-case bg-gray-100 text-gray-800"
                                >
                                    Light Theme
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Loading...', 'dark-theme')}
                                    className="normal-case bg-gray-900"
                                >
                                    Dark Theme
                                </Button>
                                <Button
                                    fullWidth
                                    onClick={() => handleShowLoader('medium', 'Loading...', 'brand-theme')}
                                    className="normal-case bg-gradient-to-r from-blue-600 to-purple-600"
                                >
                                    Brand Theme
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Usage Instructions */}
                <Card className="mt-8">
                    <CardBody>
                        <Typography variant="h5" className="mb-4 font-semibold text-gray-800">
                            How to Use
                        </Typography>
                        <div className="space-y-4">
                            <div>
                                <Typography variant="h6" className="text-gray-700 mb-2">
                                    1. Import the component:
                                </Typography>
                                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                                    <code className="text-sm">
                                        {`import LogoLoader from '@/components/LogoLoader';`}
                                    </code>
                                </pre>
                            </div>

                            <div>
                                <Typography variant="h6" className="text-gray-700 mb-2">
                                    2. Use in your component:
                                </Typography>
                                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                                    <code className="text-sm">
                                        {`{loading && (
  <LogoLoader 
    size="medium" 
    message="Loading..." 
  />
)}`}
                                    </code>
                                </pre>
                            </div>

                            <div>
                                <Typography variant="h6" className="text-gray-700 mb-2">
                                    3. Props:
                                </Typography>
                                <ul className="list-disc list-inside space-y-2 text-gray-600">
                                    <li><strong>size:</strong> 'small' | 'medium' | 'large' (default: 'medium')</li>
                                    <li><strong>message:</strong> string (default: 'Loading...')</li>
                                    <li><strong>theme:</strong> Add className to container for themes</li>
                                </ul>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Show loader */}
            {showLoader && (
                <div className={theme}>
                    <LogoLoader size={size} message={message} />
                </div>
            )}
        </div>
    );
};

export default LogoLoaderDemo;

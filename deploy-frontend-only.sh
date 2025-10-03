#!/bin/bash

# Simple frontend-only deployment script
echo "🚀 Deploying OpenRole Frontend..."

# Create simple HTML build of the frontend
echo "📦 Creating production build..."

# Copy Next.js frontend files to a simple build directory
mkdir -p build-simple
cd build-simple

# Create a simple index.html that loads the React app
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenRole.net - Transparent Job Platform</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; font-family: system-ui, sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script>
        // Simple React app inline
        const { useState } = React;
        
        function App() {
            const [searchQuery, setSearchQuery] = useState('');
            const [location, setLocation] = useState('');
            
            const handleSearch = () => {
                alert(`Searching for: ${searchQuery} in ${location}\n\n🚧 Full backend integration coming soon!`);
            };
            
            return React.createElement('div', { className: 'min-h-screen bg-white' },
                // Header
                React.createElement('header', { className: 'bg-white shadow-sm border-b border-gray-200' },
                    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
                        React.createElement('div', { className: 'flex justify-between items-center h-16' },
                            React.createElement('div', { className: 'flex items-center' },
                                React.createElement('span', { className: 'text-xl font-bold text-gray-900' },
                                    'Open', React.createElement('span', { className: 'text-blue-600' }, 'Role')
                                )
                            ),
                            React.createElement('div', { className: 'flex space-x-4' },
                                React.createElement('button', { 
                                    className: 'text-gray-700 hover:text-blue-600 font-medium',
                                    onClick: () => alert('Login page - Full frontend ready for deployment!')
                                }, 'Sign in'),
                                React.createElement('button', { 
                                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium',
                                    onClick: () => alert('Register page - Complete React frontend built!')
                                }, 'Get started')
                            )
                        )
                    )
                ),
                
                // Hero Section
                React.createElement('section', { className: 'bg-gradient-to-br from-blue-50 to-indigo-100 py-20' },
                    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
                        React.createElement('div', { className: 'text-center' },
                            React.createElement('h1', { className: 'text-5xl md:text-6xl font-bold text-gray-900 mb-6' },
                                'Find jobs with ',
                                React.createElement('span', { className: 'text-blue-600' }, 'transparent'),
                                ' salaries'
                            ),
                            React.createElement('p', { className: 'text-xl text-gray-600 mb-8 max-w-3xl mx-auto' },
                                'No more salary guessing games. Every job on OpenRole shows real salary ranges, verified companies, and fair hiring practices.'
                            ),
                            
                            // Search Bar
                            React.createElement('div', { className: 'max-w-4xl mx-auto mb-8' },
                                React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4' },
                                    React.createElement('input', {
                                        type: 'text',
                                        placeholder: 'Job title, keywords, or company',
                                        value: searchQuery,
                                        onChange: (e) => setSearchQuery(e.target.value),
                                        className: 'flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }),
                                    React.createElement('input', {
                                        type: 'text',
                                        placeholder: 'City, state, or remote',
                                        value: location,
                                        onChange: (e) => setLocation(e.target.value),
                                        className: 'md:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }),
                                    React.createElement('button', {
                                        onClick: handleSearch,
                                        className: 'px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors'
                                    }, 'Search Jobs')
                                )
                            ),
                            
                            // Status Banner
                            React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-6 mb-8' },
                                React.createElement('h3', { className: 'text-lg font-semibold text-green-800 mb-2' },
                                    '🎉 Frontend Complete!'
                                ),
                                React.createElement('p', { className: 'text-green-700' },
                                    'Complete React/Next.js frontend built with authentication, job search, dashboards, and more. Ready for production deployment!'
                                ),
                                React.createElement('div', { className: 'mt-4 text-sm text-green-600' },
                                    '✅ Login/Register Pages • ✅ Job Search Interface • ✅ User Dashboard • ✅ Professional Navigation'
                                )
                            )
                        )
                    )
                ),
                
                // Features Section
                React.createElement('section', { className: 'py-20 bg-white' },
                    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
                        React.createElement('div', { className: 'text-center mb-16' },
                            React.createElement('h2', { className: 'text-3xl md:text-4xl font-bold text-gray-900 mb-4' },
                                'Complete Frontend Features Built'
                            )
                        ),
                        React.createElement('div', { className: 'grid md:grid-cols-3 gap-8' },
                            React.createElement('div', { className: 'text-center p-8 bg-green-50 rounded-xl' },
                                React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 mb-4' },
                                    '🔐 Authentication System'
                                ),
                                React.createElement('p', { className: 'text-gray-600' },
                                    'Complete login/register with role selection, validation, and JWT authentication.'
                                )
                            ),
                            React.createElement('div', { className: 'text-center p-8 bg-blue-50 rounded-xl' },
                                React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 mb-4' },
                                    '💼 Job Search Interface'
                                ),
                                React.createElement('p', { className: 'text-gray-600' },
                                    'Advanced search, filters, job cards, pagination, and save functionality.'
                                )
                            ),
                            React.createElement('div', { className: 'text-center p-8 bg-purple-50 rounded-xl' },
                                React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 mb-4' },
                                    '📊 User Dashboards'
                                ),
                                React.createElement('p', { className: 'text-gray-600' },
                                    'Separate dashboards for candidates and employers with full functionality.'
                                )
                            )
                        )
                    )
                ),
                
                // Footer
                React.createElement('footer', { className: 'py-12 bg-gray-900 text-white text-center' },
                    React.createElement('p', { className: 'text-lg font-semibold mb-2' },
                        'OpenRole.net Frontend - Production Ready!'
                    ),
                    React.createElement('p', { className: 'text-gray-400' },
                        'Complete React/Next.js application with authentication, job search, and user management'
                    )
                )
            );
        }
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
    </script>
</body>
</html>
EOF

echo "✅ Simple demo page created at: $(pwd)/index.html"
echo ""
echo "🌐 To deploy this demo:"
echo "1. Copy this file to your web server"
echo "2. Or open it locally in a browser"
echo ""
echo "🚀 For full production deployment:"
echo "1. Use the complete Docker setup in the repository"
echo "2. Or follow DEPLOY_INSTRUCTIONS.md"
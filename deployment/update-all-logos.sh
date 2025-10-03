#!/bin/bash

# Update all HTML files to have consistent logo

LOGO_HTML='<a href="/" class="flex items-center space-x-2">
                        <div class="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-xl">O</span>
                        </div>
                        <span class="text-2xl font-bold text-gray-900">OpenRole</span>
                    </a>'

# Files to update
FILES=(
    "career-advice.html"
    "cv-upload.html"
    "employer-login.html"
    "employers.html"
    "forgot-password.html"
    "login.html"
    "post-job.html"
    "privacy.html"
    "register.html"
    "terms.html"
    "404.html"
)

for file in "${FILES[@]}"; do
    echo "Updating $file..."
    
    # Create temporary file with updated logo
    ssh hyperdude@145.223.75.73 "docker exec openrole-static sed -i.bak 's|<a href=\"/\" class=\"text-2xl font-bold text-teal-600\">OpenRole</a>|<a href=\"/\" class=\"flex items-center space-x-2\"><div class=\"w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center\"><span class=\"text-white font-bold text-xl\">O</span></div><span class=\"text-2xl font-bold text-gray-900\">OpenRole</span></a>|g' /usr/share/nginx/html/$file"
done

echo "All files updated!"
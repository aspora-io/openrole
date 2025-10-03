#!/usr/bin/env python3
import os
import re

# Standard logo HTML
STANDARD_LOGO = '''<a href="/" class="flex items-center space-x-2">
                        <div class="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-xl">O</span>
                        </div>
                        <span class="text-2xl font-bold text-gray-900">OpenRole</span>
                    </a>'''

# Files to update
files_to_update = [
    'register.html',
    'cv-upload.html',
    'career-advice.html',
    'employers.html',
    'employer-login.html',
    'post-job.html',
    'forgot-password.html',
    'privacy.html',
    'terms.html',
    '404.html'
]

# Pattern to match various logo implementations
logo_patterns = [
    # Pattern 1: Simple text link
    r'<a href="/" class="text-2xl font-bold text-teal-600">OpenRole</a>',
    # Pattern 2: Logo with varying sizes
    r'<a href="/"[^>]*>\s*<div class="w-\d+ h-\d+ bg-teal-600[^"]*"[^>]*>\s*<span[^>]*>O</span>\s*</div>\s*<span[^>]*>OpenRole</span>\s*</a>',
    # Pattern 3: Just for catching any other variations
    r'<a href="/" class="flex items-center[^"]*">\s*<div[^>]*>\s*<span[^>]*>O</span>\s*</div>\s*<span[^>]*>OpenRole</span>\s*</a>'
]

def update_logo_in_file(filepath):
    """Update logo in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Try each pattern
        for pattern in logo_patterns:
            # Find logo within navigation/header context
            nav_pattern = r'(<nav[^>]*>.*?|<header[^>]*>.*?)(' + pattern + r')(.*?</nav>|.*?</header>)'
            matches = re.finditer(nav_pattern, content, re.DOTALL | re.IGNORECASE)
            
            for match in matches:
                full_match = match.group(0)
                logo_match = match.group(2)
                
                # Replace just the logo part
                new_section = full_match.replace(logo_match, STANDARD_LOGO)
                content = content.replace(full_match, new_section)
        
        # Also try simpler replacement if within obvious navigation
        if '<a href="/" class="text-2xl font-bold text-teal-600">OpenRole</a>' in content:
            content = content.replace(
                '<a href="/" class="text-2xl font-bold text-teal-600">OpenRole</a>',
                STANDARD_LOGO
            )
        
        # Check if any changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated {filepath}")
            return True
        else:
            print(f"⚠ No changes needed for {filepath}")
            return False
            
    except Exception as e:
        print(f"✗ Error updating {filepath}: {e}")
        return False

# Update all files
print("Updating logos across all pages...\n")
updated = 0
for filename in files_to_update:
    filepath = os.path.join('/home/alan/business/openrole/deployment', filename)
    if os.path.exists(filepath):
        if update_logo_in_file(filepath):
            updated += 1
    else:
        print(f"✗ File not found: {filepath}")

print(f"\nCompleted! Updated {updated} files.")
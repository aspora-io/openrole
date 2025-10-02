#!/bin/bash

# Update all internal links to use clean URLs without .html extension
for file in *.html; do
    echo "Updating links in $file"
    
    # Replace href="/something.html" with href="/something"
    sed -i 's|href="/\([^"]*\)\.html"|href="/\1"|g' "$file"
    
    # Replace href="something.html" with href="/something" (for relative links)
    sed -i 's|href="\([^/"#][^"]*\)\.html"|href="/\1"|g' "$file"
    
    # Keep index.html as just /
    sed -i 's|href="/index"|href="/"|g' "$file"
done

echo "Link updates complete!"
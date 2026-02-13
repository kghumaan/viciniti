#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Viciniti Project Setup Script
# This script automates the setup process for the Viciniti app

echo "============================================"
echo "Viciniti Project Setup"
echo "============================================"

# Check for Node.js and npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}Node.js and npm are required but not installed.${NC}"
    echo -e "Please install them from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}Installing dependencies...${NC}"
npm install

echo -e "${GREEN}Setting up environment...${NC}"

# Check for .env file and create if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    touch .env
    echo "WEB3AUTH_CLIENT_ID=BHtFwvHGmip9cPSWRblSoOV2wz9-LOXyERSeC9zJ57KnBKfqEZY0-KA8d7ir4x4vG2NHzs1bXZTXRFx_QmED8W4" >> .env
    echo "MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNrdjdsZGo0ZTlrbGszMWs2bnpndnlldjQifQ.XDaBKrhWFiLYxg_5OgGvDA" >> .env
    echo "MAPBOX_DOWNLOAD_TOKEN=sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg" >> .env
    echo -e "${GREEN}.env file created with default values${NC}"
else
    # Check if tokens are in .env
    if ! grep -q "MAPBOX_PUBLIC_TOKEN" ".env" || ! grep -q "MAPBOX_DOWNLOAD_TOKEN" ".env"; then
        echo -e "${YELLOW}Adding Mapbox tokens to .env file...${NC}"
        echo "MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNrdjdsZGo0ZTlrbGszMWs2bnpndnlldjQifQ.XDaBKrhWFiLYxg_5OgGvDA" >> .env
        echo "MAPBOX_DOWNLOAD_TOKEN=sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg" >> .env
    fi
fi

# Check Build Configuration Files
echo -e "${GREEN}Checking build configuration files...${NC}"

# Check app.json
if grep -q "YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE" "app.json"; then
    echo -e "${YELLOW}Updating Mapbox token in app.json...${NC}"
    # Use sed to replace the placeholder with the actual token
    sed -i '' 's/YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE/sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg/g' app.json
fi

# Check iOS Podfile
if grep -q "YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE" "ios/Podfile"; then
    echo -e "${YELLOW}Updating Mapbox token in ios/Podfile...${NC}"
    sed -i '' 's/YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE/sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg/g' ios/Podfile
fi

# Check Android gradle.properties
if grep -q "YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE" "android/gradle.properties"; then
    echo -e "${YELLOW}Updating Mapbox token in android/gradle.properties...${NC}"
    sed -i '' 's/YOUR_MAPBOX_DOWNLOAD_TOKEN_HERE/sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg/g' android/gradle.properties
fi

# For iOS only
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}Setting up iOS dependencies...${NC}"
    
    # Install iOS dependencies
    cd ios && pod install && cd ..
    
    echo -e "${GREEN}iOS setup complete!${NC}"
fi

echo -e "${GREEN}Setup complete! You're ready to go.${NC}"
echo -e "${YELLOW}To start the app in development mode, run:${NC}"
echo -e "${GREEN}npx expo start${NC}"

echo ""
echo "============================================"
echo "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Edit src/utils/mapbox.private.ts with your Mapbox tokens"
echo "2. Update app.json and ios/Podfile with your download token"
echo ""
echo "To run the app:"
echo "iOS:      npx expo run:ios"
echo "Android:  npx expo run:android"
echo "============================================" 
#!/bin/bash
npm install
npx cap add ios
npx cap add android
npx capacitor-assets generate
npx cap sync
echo "Klaar. Gebruik: npx cap open ios of npx cap open android"

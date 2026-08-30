@echo off
npm install
npx cap add android
npx capacitor-assets generate
npx cap sync
echo Klaar. Gebruik: npx cap open android
pause

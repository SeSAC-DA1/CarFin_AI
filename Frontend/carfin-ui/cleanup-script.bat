@echo off
echo 🧹 Starting CarFin AI codebase cleanup...

cd /d "C:\Users\MJ\Desktop\CarFin AI\CarFin_AI\Frontend\carfin-ui\src"

echo 📁 Creating archive directories...
mkdir archived-components\auth 2>nul
mkdir archived-components\vehicle 2>nul
mkdir archived-components\chat 2>nul
mkdir archived-components\analysis 2>nul
mkdir archived-components\car-finder 2>nul
mkdir archived-components\admin 2>nul
mkdir archived-components\dashboard 2>nul
mkdir archived-components\landing 2>nul
mkdir archived-components\onboarding 2>nul
mkdir archived-components\comparison 2>nul
mkdir archived-components\recommendation 2>nul
mkdir archived-components\results 2>nul

echo 🗃️ Archiving unused auth components...
move components\auth\SignupForm.tsx archived-components\auth\ 2>nul
move components\auth\ModernSignupForm.tsx archived-components\auth\ 2>nul

echo 🗃️ Archiving unused vehicle components...
move components\vehicle\AttractiveVehicleGrid.tsx archived-components\vehicle\ 2>nul
move components\vehicle\EnhancedVehicleGrid.tsx archived-components\vehicle\ 2>nul
move components\vehicle\ModernVehicleGrid.tsx archived-components\vehicle\ 2>nul
move components\vehicle\OptimizedVehicleGrid.tsx archived-components\vehicle\ 2>nul
move components\vehicle\VehicleGridSelection.tsx archived-components\vehicle\ 2>nul
move components\vehicle\VehicleSelectionGrid.tsx archived-components\vehicle\ 2>nul
move components\vehicle\RealVehicleCard.tsx archived-components\vehicle\ 2>nul

echo 🗃️ Archiving unused chat components...
move components\chat\CoreThreeAgentChat.tsx archived-components\chat\ 2>nul
move components\chat\MultiAgentChat.tsx archived-components\chat\ 2>nul
move components\chat\EnhancedMultiAgentChat.tsx archived-components\chat\ 2>nul
move components\chat\GeminiMultiAgentChat.tsx archived-components\chat\ 2>nul

echo 🗃️ Archiving unused analysis components...
move components\analysis\AnalysisDashboard.tsx archived-components\analysis\ 2>nul
move components\analysis\EnhancedAnalysisDashboard.tsx archived-components\analysis\ 2>nul
move components\analysis\PentagonChart.tsx archived-components\analysis\ 2>nul

echo 🗃️ Archiving unused car-finder components...
move components\car-finder\CarFinderHome.tsx archived-components\car-finder\ 2>nul
move components\car-finder\SearchingPhase.tsx archived-components\car-finder\ 2>nul
move components\car-finder\InteractiveResults.tsx archived-components\car-finder\ 2>nul
move components\car-finder\AdvancedComparison.tsx archived-components\car-finder\ 2>nul

echo 🗃️ Archiving other unused components...
move components\admin\FeedbackDashboard.tsx archived-components\admin\ 2>nul
move components\dashboard\MiniDashboard.tsx archived-components\dashboard\ 2>nul
move components\landing\ModernLandingPage.tsx archived-components\landing\ 2>nul
move components\onboarding\SpotifyStyleOnboarding.tsx archived-components\onboarding\ 2>nul
move components\comparison\VehicleComparison.tsx archived-components\comparison\ 2>nul
move components\recommendation\RecommendationVehicleGrid.tsx archived-components\recommendation\ 2>nul
move components\results\VehicleGrid.tsx archived-components\results\ 2>nul
move components\solution\CarRecommendationSolution.tsx archived-components\ 2>nul

echo ✅ Cleanup completed!
echo 📊 Active components remaining:
echo   - UltimateCarConsultant (main component)
echo   - UI components (button, card, etc.)
echo   - Netflix-style components in use
echo   - Finance consultation
echo   - Debug components
echo   - Feedback system
echo.
echo 🗂️ Archived components moved to archived-components/ directory
echo.
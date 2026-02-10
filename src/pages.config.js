/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddMeal from './pages/AddMeal';
import Badges from './pages/Badges';
import CameraScreen from './pages/CameraScreen';
import Chat from './pages/Chat';
import CreateStory from './pages/CreateStory';
import Feed from './pages/Feed';
import Friends from './pages/Friends';
import GoalsAssistant from './pages/GoalsAssistant';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Home from './pages/Home';
import HomeSafe from './pages/HomeSafe';
import InviteCollaborators from './pages/InviteCollaborators';
import LanguageSelector from './pages/LanguageSelector';
import MealResult from './pages/MealResult';
import NutritionHub from './pages/NutritionHub';
import Onboarding from './pages/Onboarding';
import OnboardingTransition from './pages/OnboardingTransition';
import Paywall from './pages/Paywall';
import Premium from './pages/Premium';
import PreviewScreen from './pages/PreviewScreen';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import Progress from './pages/Progress';
import ProgressTracker from './pages/ProgressTracker';
import Settings from './pages/Settings';
import Social from './pages/Social';
import TrainerDashboard from './pages/TrainerDashboard';
import UserManagement from './pages/UserManagement';
import WorkoutTracker from './pages/WorkoutTracker';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddMeal": AddMeal,
    "Badges": Badges,
    "CameraScreen": CameraScreen,
    "Chat": Chat,
    "CreateStory": CreateStory,
    "Feed": Feed,
    "Friends": Friends,
    "GoalsAssistant": GoalsAssistant,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "Home": Home,
    "HomeSafe": HomeSafe,
    "InviteCollaborators": InviteCollaborators,
    "LanguageSelector": LanguageSelector,
    "MealResult": MealResult,
    "NutritionHub": NutritionHub,
    "Onboarding": Onboarding,
    "OnboardingTransition": OnboardingTransition,
    "Paywall": Paywall,
    "Premium": Premium,
    "PreviewScreen": PreviewScreen,
    "Profile": Profile,
    "ProfileSetup": ProfileSetup,
    "Progress": Progress,
    "ProgressTracker": ProgressTracker,
    "Settings": Settings,
    "Social": Social,
    "TrainerDashboard": TrainerDashboard,
    "UserManagement": UserManagement,
    "WorkoutTracker": WorkoutTracker,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
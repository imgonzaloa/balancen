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
import { lazy } from 'react';
const AIDisclaimer = lazy(() => import('./pages/AIDisclaimer'));
const AddMeal = lazy(() => import('./pages/AddMeal'));
const Badges = lazy(() => import('./pages/Badges'));
const CameraScreen = lazy(() => import('./pages/CameraScreen'));
const CampusAdminHub = lazy(() => import('./pages/CampusAdminHub'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Chat = lazy(() => import('./pages/Chat'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const Feed = lazy(() => import('./pages/Feed'));
const Friends = lazy(() => import('./pages/Friends'));
const GoalsAssistant = lazy(() => import('./pages/GoalsAssistant'));
const GroupDashboard = lazy(() => import('./pages/GroupDashboard'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const Groups = lazy(() => import('./pages/Groups'));
const Home = lazy(() => import('./pages/Home'));
const HomeSafe = lazy(() => import('./pages/HomeSafe'));
const InviteCollaborators = lazy(() => import('./pages/InviteCollaborators'));
const LanguageSelector = lazy(() => import('./pages/LanguageSelector'));
const MealResult = lazy(() => import('./pages/MealResult'));
const NutritionHub = lazy(() => import('./pages/NutritionHub'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const OnboardingTransition = lazy(() => import('./pages/OnboardingTransition'));
const Paywall = lazy(() => import('./pages/Paywall'));
const Premium = lazy(() => import('./pages/Premium'));
const PreviewScreen = lazy(() => import('./pages/PreviewScreen'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const Progress = lazy(() => import('./pages/Progress'));
const ProgressTracker = lazy(() => import('./pages/ProgressTracker'));
const Settings = lazy(() => import('./pages/Settings'));
const Social = lazy(() => import('./pages/Social'));
const Splash = lazy(() => import('./pages/Splash'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const TrainerDashboard = lazy(() => import('./pages/TrainerDashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const WorkoutTracker = lazy(() => import('./pages/WorkoutTracker'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIDisclaimer": AIDisclaimer,
    "AddMeal": AddMeal,
    "Badges": Badges,
    "CameraScreen": CameraScreen,
    "CampusAdminHub": CampusAdminHub,
    "Challenges": Challenges,
    "Chat": Chat,
    "CreateStory": CreateStory,
    "Feed": Feed,
    "Friends": Friends,
    "GoalsAssistant": GoalsAssistant,
    "GroupDashboard": GroupDashboard,
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
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "ProfileSetup": ProfileSetup,
    "Progress": Progress,
    "ProgressTracker": ProgressTracker,
    "Settings": Settings,
    "Social": Social,
    "Splash": Splash,
    "TermsOfService": TermsOfService,
    "TrainerDashboard": TrainerDashboard,
    "UserManagement": UserManagement,
    "WorkoutTracker": WorkoutTracker,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
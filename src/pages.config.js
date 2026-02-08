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
import Badges from './pages/Badges';
import CameraScreen from './pages/CameraScreen';
import Friends from './pages/Friends';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Home from './pages/Home';
import InviteCollaborators from './pages/InviteCollaborators';
import LanguageSelector from './pages/LanguageSelector';
import MealResult from './pages/MealResult';
import Onboarding from './pages/Onboarding';
import OnboardingTransition from './pages/OnboardingTransition';
import Paywall from './pages/Paywall';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Social from './pages/Social';
import UserManagement from './pages/UserManagement';
import HomeSafe from './pages/HomeSafe';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Badges": Badges,
    "CameraScreen": CameraScreen,
    "Friends": Friends,
    "GroupDetail": GroupDetail,
    "Groups": Groups,
    "Home": Home,
    "InviteCollaborators": InviteCollaborators,
    "LanguageSelector": LanguageSelector,
    "MealResult": MealResult,
    "Onboarding": Onboarding,
    "OnboardingTransition": OnboardingTransition,
    "Paywall": Paywall,
    "Premium": Premium,
    "Profile": Profile,
    "ProfileSetup": ProfileSetup,
    "Progress": Progress,
    "Settings": Settings,
    "Social": Social,
    "UserManagement": UserManagement,
    "HomeSafe": HomeSafe,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
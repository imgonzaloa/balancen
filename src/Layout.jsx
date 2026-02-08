import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { MealProvider } from "@/components/MealContext";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppStateProvider } from "@/components/AppStateContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import VersionGate from "@/components/VersionGate";
import iOSOptimizer from "@/components/iOSOptimizer";
import { SafeModeProvider } from "@/components/SafeModeProvider";
import TabErrorBoundary from "@/components/TabErrorBoundary";
import { logger } from "@/components/logger";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { useBootSequence } from "@/components/BootSequence";
import BootSplash from "@/components/BootSplash";
import { SafeBootManager } from "@/components/SafeBootManager";

const navItemsBase = [
  { name: "Home", icon: Home, key: "home" },
  { name: "Social", icon: Users, key: "social" },
  { name: "Progress", icon: Award, key: "progress" },
  { name: "Profile", icon: User, key: "profile" },
];

const persistentPages = ["Home", "Social", "Progress", "Profile"];
const noNavPages = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector"];

export default function Layout({ children, currentPageName }) {
  return null;
}
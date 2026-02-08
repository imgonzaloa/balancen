import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { SocialSkeleton } from "@/components/ui/ScreenSkeleton";
import InviteSystemCard from "@/components/social/InviteSystemCard";
import { useTranslation } from "@/components/TranslationProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAppState } from "@/components/AppStateContext";
import PullToRefresh from "@/components/PullToRefresh";

export default function Social() {
  return null;
}
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Scale, Ruler, LogOut, Save, Settings, Crown, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import StreakFire from "@/components/ui/StreakFire";
import { useTranslation } from "@/components/TranslationProvider";
import SetStatusModal from "@/components/groups/SetStatusModal";
import ReferralProgress from "@/components/profile/ReferralProgress";
import { useAppState } from "@/components/AppStateContext";
import PhotoPickerModal from "@/components/profile/PhotoPickerModal";
import { uploadProfilePhoto } from "@/components/profile/PhotoUploadHandler";
import { logger } from "@/components/logger";

export default function Profile() {
  return null;
}
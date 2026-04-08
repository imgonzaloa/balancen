import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { ArrowLeft, Users, Trophy, Share2, Plus, Flame, Target, Crown, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { getLocalDateKey } from "@/lib/utils";

const txt = {
  title:         { es: 'Modo Equipo', en: 'Team Mode', nl: 'Teammodus' },
  subtitle:      { es: 'Entrenamos y comemos mejor juntos', en: 'We train and eat better together', nl: 'We trainen en eten beter samen' },
  create_team:   { es: 'Crear equipo', en: 'Create team', nl: 'Team aanmaken' },
  team_name_placeholder: { es: 'Nombre del equipo…', en: 'Team name…', nl: 'Teamnaam…' },
  leaderboard:   { es: 'Clasificación del equipo', en: 'Team leaderboard', nl: 'Teamranglijst' },
  consistency:   { es: 'Consistencia', en: 'Consistency', nl: 'Consistentie' },
  streak:        { es: 'Racha', en: 'Streak', nl: 'Reeks' },
  weekly_challenge: { es: 'Reto de la semana', en: 'Weekly challenge', nl: 'Weekuitdaging' },
  challenge_desc: { es: 'Todos registran 3 comidas/día durante 7 días', en: 'Everyone logs 3 meals/day for 7 days', nl: 'Iedereen logt 3 maaltijden/dag gedurende 7 dagen' },
  team_progress: { es: 'Progreso del equipo', en: 'Team progress', nl: 'Teamvoortgang' },
  invite:        { es: 'Invitar al equipo', en: 'Invite to team', nl: 'Team uitnodigen' },
  invite_msg:    { es: 'Únete a mi equipo en Balancen. Mejoramos juntos.', en: 'Join my team on Balancen. We improve together.', nl: 'Doe mee met mijn team op Balancen. We verbeteren samen.' },
  copied:        { es: '¡Copiado!', en: 'Copied!', nl: 'Gekopieerd!' },
  no_team:       { es: 'Aún no tienes equipo. ¡Creá uno!', en: "You don't have a team yet. Create one!", nl: 'Je hebt nog geen team. Maak er een aan!' },
  days:          { es: 'días', en: 'days', nl: 'dagen' },
  creating:      { es: 'Creando…', en: 'Creating…', nl: 'Aanmaken…' },
  rank:          { es: 'Pos.', en: 'Rank', nl: 'Pos.' },
  member:        { es: 'Miembro', en: 'Member', nl: 'Lid' },
};

const T = (key, lang) => txt[key]?.[lang] || txt[key]?.en || '';

export default function TeamMode() {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAppState();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load sports_team groups this user belongs to
  const { data: teamGroup = null } = useQuery({
    queryKey: ['sportsteam', user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ user_email: user?.email });
      const groupIds = members.map(m => m.group_id).filter(Boolean);
      if (!groupIds.length) return null;
      const groups = await Promise.all(groupIds.map(id => base44.entities.Group.filter({ id }).then(r => r[0]).catch(() => null)));
      return groups.find(g => g?.group_type === 'sports_team') || null;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  // Load team members with their profiles
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', teamGroup?.id],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ group_id: teamGroup.id });
      const profiles = await Promise.all(
        members.map(m => base44.entities.UserProfile.filter({ created_by: m.user_email }).then(r => r[0]).catch(() => null))
      );
      return members.map((m, i) => ({
        ...m,
        profile: profiles[i],
        streak: profiles[i]?.current_streak || 0,
      })).filter(m => m.profile);
    },
    enabled: !!teamGroup?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Load meal logs for the week for all team members to calculate consistency
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return getLocalDateKey(d);
  });

  const { data: teamMealLogs = [] } = useQuery({
    queryKey: ['teamMeals', teamGroup?.id, last7Days[0]],
    queryFn: async () => {
      const emails = teamMembers.map(m => m.user_email);
      const allLogs = await Promise.all(
        emails.map(email => base44.entities.MealLog.filter({ created_by: email }, '-date', 30).catch(() => []))
      );
      return allLogs.flat().filter(log => last7Days.includes(log.date));
    },
    enabled: teamMembers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Compute leaderboard: consistency = unique days logged / 7
  const leaderboard = useMemo(() => {
    return teamMembers.map(member => {
      const logs = teamMealLogs.filter(l => l.created_by === member.user_email);
      const uniqueDays = new Set(logs.map(l => l.date)).size;
      const consistency = Math.round((uniqueDays / 7) * 100);
      const caloriesGoal = member.profile?.calories_goal || 2000;
      const todayLogs = logs.filter(l => l.date === last7Days[0]);
      const todayCalories = todayLogs.reduce((s, l) => s + (l.estimated_calories || 0), 0);
      const caloriesAdherence = Math.min(Math.round((todayCalories / caloriesGoal) * 100), 100);
      return { ...member, consistency, caloriesAdherence, uniqueDays };
    }).sort((a, b) => b.consistency - a.consistency);
  }, [teamMembers, teamMealLogs]);

  // Team challenge: collective progress — how many member-days have 3+ meals
  const challengeProgress = useMemo(() => {
    if (!teamMembers.length) return 0;
    let successDays = 0;
    const total = teamMembers.length * 7;
    teamMembers.forEach(member => {
      last7Days.forEach(day => {
        const dayLogs = teamMealLogs.filter(l => l.created_by === member.user_email && l.date === day);
        if (dayLogs.length >= 3) successDays++;
      });
    });
    return total > 0 ? Math.round((successDays / total) * 100) : 0;
  }, [teamMembers, teamMealLogs]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error(lang === 'es' ? 'Ingresá un nombre' : lang === 'nl' ? 'Voer een naam in' : 'Enter a team name');
      return;
    }
    setCreating(true);
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const group = await base44.entities.Group.create({
      name: teamName.trim(),
      group_type: 'sports_team',
      invite_code: inviteCode,
      is_private: true,
      allow_join_by_code: true,
    });
    await base44.entities.GroupMember.create({
      group_id: group.id,
      user_email: user.email,
      display_name: profile?.display_name || '',
      avatar_url: profile?.avatar_url || '',
      role: 'admin',
    });
    queryClient.invalidateQueries({ queryKey: ['sportsteam'] });
    setCreating(false);
    setShowCreate(false);
    setTeamName('');
    toast.success(lang === 'es' ? '¡Equipo creado!' : lang === 'nl' ? 'Team aangemaakt!' : 'Team created!');
  };

  const handleCopyInvite = () => {
    const msg = T('invite_msg', lang);
    const link = `${window.location.origin}?join=${teamGroup?.invite_code || ''}`;
    const full = `${msg}\n${link}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      toast.success(T('copied', lang));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto px-5 pt-4 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">{T('title', lang)}</h1>
            <p className="text-white/50 text-sm">{T('subtitle', lang)}</p>
          </div>
        </div>

        {/* No team yet */}
        {!teamGroup && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-lg">
              <Users size={32} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg">{T('no_team', lang)}</p>

            {!showCreate ? (
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-2xl px-6 h-12 shadow-lg"
              >
                <Plus size={18} className="mr-2" />
                {T('create_team', lang)}
              </Button>
            ) : (
              <div className="space-y-3">
                <input
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder={T('team_name_placeholder', lang)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-400"
                />
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-white/20 text-white bg-white/10 rounded-xl h-11">
                    {lang === 'es' ? 'Cancelar' : lang === 'nl' ? 'Annuleren' : 'Cancel'}
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={creating} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl h-11 font-bold">
                    {creating ? T('creating', lang) : T('create_team', lang)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {teamGroup && (
          <>
            {/* Team name badge */}
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Crown size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg">{teamGroup.name}</p>
                <p className="text-indigo-200 text-xs">{leaderboard.length} {lang === 'es' ? 'miembros' : lang === 'nl' ? 'leden' : 'members'}</p>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <h2 className="text-white font-black text-sm uppercase tracking-wide">{T('leaderboard', lang)}</h2>
              </div>
              {leaderboard.length === 0 ? (
                <div className="px-4 py-6 text-center text-white/40 text-sm">
                  {lang === 'es' ? 'Sin datos aún' : lang === 'nl' ? 'Nog geen gegevens' : 'No data yet'}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {leaderboard.map((member, i) => (
                    <div key={member.user_email} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? 'bg-amber-500/10' : ''}`}>
                      <span className={`text-sm font-black w-5 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-white/30'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {member.profile?.display_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{member.profile?.display_name || member.user_email}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-teal-300 text-xs font-semibold">{member.consistency}% {T('consistency', lang)}</span>
                          <span className="flex items-center gap-0.5 text-orange-300 text-xs">
                            <Flame size={10} />{member.streak}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-white/50">{member.uniqueDays}/7 {T('days', lang)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly challenge */}
            <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-400/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-emerald-400" />
                <h2 className="text-white font-black text-sm uppercase tracking-wide">{T('weekly_challenge', lang)}</h2>
              </div>
              <p className="text-white/70 text-sm">{T('challenge_desc', lang)}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{T('team_progress', lang)}</span>
                  <span className="text-emerald-300 font-black">{challengeProgress}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                    style={{ width: `${challengeProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Invite */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-indigo-300" />
                <h2 className="text-white font-black text-sm uppercase tracking-wide">{T('invite', lang)}</h2>
              </div>
              <p className="text-white/60 text-sm italic">"{T('invite_msg', lang)}"</p>
              <Button
                onClick={handleCopyInvite}
                className={`w-full rounded-2xl h-12 font-bold flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'} text-white`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? T('copied', lang) : T('invite', lang)}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
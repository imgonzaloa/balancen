import React, { useMemo } from "react";
import { useTranslation } from "@/components/TranslationProvider";
import { TrendingUp, Activity, Target, Award, Zap, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const StatCard = ({ icon: Icon, label, value, unit, color, trend, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-5 border border-white/10 relative overflow-hidden`}
  >
    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className="text-white/60" />
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            <TrendingUp size={12} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-white/60 text-xs uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-black text-white">{value}</p>
        {unit && <p className="text-white/40 text-sm">{unit}</p>}
      </div>
    </div>
  </motion.div>
);

export default function AdvancedAnalytics({ profile, todayMeals, weekMeals }) {
  const { t } = useTranslation();

  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's data
    const todayCalories = todayMeals?.reduce((sum, m) => sum + (m.estimated_calories || 0), 0) || 0;
    const todayProtein = todayMeals?.reduce((sum, m) => sum + (m.estimated_protein || 0), 0) || 0;
    const todayCarbs = todayMeals?.reduce((sum, m) => sum + (m.estimated_carbs || 0), 0) || 0;
    const todayFats = todayMeals?.reduce((sum, m) => sum + (m.estimated_fats || 0), 0) || 0;

    // Week's data (last 7 days)
    const weekAvg = weekMeals?.length > 0 
      ? {
          calories: Math.round(weekMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0) / weekMeals.length),
          protein: Math.round(weekMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0) / weekMeals.length),
        }
      : { calories: 0, protein: 0 };

    // Goal adherence
    const caloriesGoal = profile?.calories_goal || 2000;
    const todayAdherence = Math.min((todayCalories / caloriesGoal) * 100, 100);
    const weekAdherence = Math.min((weekAvg.calories / caloriesGoal) * 100, 100);

    // Macro balance today
    const totalCals = todayCalories || 1;
    const proteinCals = todayProtein * 4;
    const carbsCals = todayCarbs * 4;
    const fatsCals = todayFats * 9;
    const macroBalance = {
      protein: Math.round((proteinCals / totalCals) * 100),
      carbs: Math.round((carbsCals / totalCals) * 100),
      fats: Math.round((fatsCals / totalCals) * 100),
    };

    // Consistency trend
    const weekConsistency = weekMeals?.length || 0;
    const consistencyTrend = weekMeals?.filter(m => m.estimated_calories > 0).length || 0;

    // Generate chart data (last 7 days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = weekMeals?.filter(m => m.date === dateStr) || [];
      const dayCalories = dayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: dayCalories,
        goal: caloriesGoal,
        adherence: Math.round((dayCalories / caloriesGoal) * 100)
      };
    });

    return {
      today: { calories: todayCalories, protein: todayProtein, carbs: todayCarbs, fats: todayFats },
      week: weekAvg,
      adherence: { today: todayAdherence, week: weekAdherence },
      macroBalance,
      consistency: { days: consistencyTrend, streak: weekConsistency },
      chartData,
      caloriesGoal
    };
  }, [todayMeals, weekMeals, profile?.calories_goal]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatCard
          index={0}
          icon={Activity}
          label="Today Calories"
          value={Math.round(analytics.today.calories)}
          unit="kcal"
          color="from-orange-500/20 to-amber-500/20"
          trend={Math.round(((analytics.today.calories / analytics.caloriesGoal) * 100) - 50)}
        />
        <StatCard
          index={1}
          icon={Award}
          label="Goal Adherence"
          value={Math.round(analytics.adherence.today)}
          unit="%"
          color="from-emerald-500/20 to-teal-500/20"
          trend={Math.round(analytics.adherence.week - analytics.adherence.today)}
        />
        <StatCard
          index={2}
          icon={Zap}
          label="Avg Weekly"
          value={analytics.week.calories}
          unit="kcal"
          color="from-blue-500/20 to-cyan-500/20"
        />
        <StatCard
          index={3}
          icon={Target}
          label="Consistency"
          value={analytics.consistency.days}
          unit="days"
          color="from-purple-500/20 to-pink-500/20"
        />
      </motion.div>

      {/* Macro Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 border border-white/10"
      >
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span className="text-lg">📊</span> Today's Macro Balance
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Protein', value: analytics.macroBalance.protein, color: 'from-blue-400 to-blue-600', icon: '🥛' },
            { label: 'Carbs', value: analytics.macroBalance.carbs, color: 'from-amber-400 to-amber-600', icon: '🍚' },
            { label: 'Fats', value: analytics.macroBalance.fats, color: 'from-pink-400 to-pink-600', icon: '🥑' },
          ].map((macro, idx) => (
            <motion.div
              key={macro.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{macro.icon}</span>
                  <span className="text-white/70 text-sm font-medium">{macro.label}</span>
                </div>
                <span className="text-white font-bold">{macro.value}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${macro.value}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={`h-full bg-gradient-to-r ${macro.color} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 7-Day Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 border border-white/10"
      >
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Calendar size={18} /> 7-Day Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analytics.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="goal"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* AI Insight Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-5 border border-cyan-400/30"
      >
        <div className="flex gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-cyan-300 font-bold text-sm mb-1">AI Insight</p>
            <p className="text-white/80 text-sm leading-relaxed">
              {analytics.adherence.week > 100
                ? "You're crushing your goals! Maintain this consistency to see faster results."
                : analytics.adherence.week > 70
                ? "Great progress this week! You're building strong habits. Keep the momentum going."
                : "You're on the right track. Focus on consistency—every meal counts toward your goals."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
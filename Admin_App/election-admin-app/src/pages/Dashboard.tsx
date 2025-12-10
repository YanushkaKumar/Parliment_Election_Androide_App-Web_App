import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
// @ts-ignore
import { db } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Vote, Activity, Calendar, BarChart3, 
  PieChart, ArrowUpRight, ArrowDownRight, RefreshCw, Clock, Target,
  Zap, Globe, Shield, Sparkles, Award, Trophy
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
  AreaChart, Area, Line, ComposedChart
} from 'recharts';

interface DashboardStats {
  totalVoters: number;
  totalCandidates: number;
  totalElections: number;
  totalVotes: number;
  recentVoters: any[];
  recentCandidates: any[];
  votersByDistrict: { name: string; value: number; growth: number }[];
  candidatesByParty: { name: string; value: number; color: string }[];
  voteDistribution: { name: string; votes: number; percentage: number; fill: string }[];
  electionProgress: { name: string; registered: number; voted: number; turnout: number }[];
  voteTrend: { time: string; votes: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const GRADIENT_COLORS = {
  blue: ['#3B82F6', '#1D4ED8'],
  green: ['#10B981', '#059669'],
  purple: ['#8B5CF6', '#7C3AED'],
  orange: ['#F59E0B', '#D97706'],
  pink: ['#EC4899', '#DB2777'],
  cyan: ['#06B6D4', '#0891B2'],
};

// Animated counter hook with smooth easing
const useAnimatedCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(0);
  
  useEffect(() => {
    const startValue = prevEnd.current;
    prevEnd.current = end;
    let startTime: number;
    let animationFrame: number;
    
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);
      setCount(Math.floor(startValue + (end - startValue) * easedProgress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
};

// Custom glassmorphism tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-2xl p-4 shadow-2xl border border-white/20">
        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 text-sm py-1">
            <div 
              className="w-3 h-3 rounded-full shadow-lg" 
              style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}50` }} 
            />
            <span className="text-gray-600 font-medium">{entry.name}:</span>
            <span className="font-bold text-gray-900 ml-auto">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Advanced Stat Card with animations
const StatCard = ({ 
  title, value, icon: Icon, bgGradient, trend, sparklineData, subtitle, delay = 0
}: { 
  title: string; 
  value: number; 
  icon: any; 
  bgGradient: string[];
  trend?: number;
  sparklineData?: number[];
  subtitle?: string;
  delay?: number;
}) => {
  const animatedValue = useAnimatedCounter(value, 2000);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Card className={`relative overflow-hidden group card-hover gradient-border transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-500"
        style={{ background: `linear-gradient(135deg, ${bgGradient[0]}, ${bgGradient[1]})` }}
      />
      
      {/* Spotlight effect */}
      <div className="spotlight absolute inset-0" />
      
      {/* Floating particles */}
      <div className="absolute top-4 right-4 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="absolute w-2 h-2 bg-current rounded-full animate-bounce-subtle" style={{ color: bgGradient[0], top: '10%', left: '20%' }} />
        <div className="absolute w-1.5 h-1.5 bg-current rounded-full animate-bounce-subtle" style={{ color: bgGradient[0], top: '60%', left: '70%', animationDelay: '0.5s' }} />
        <div className="absolute w-1 h-1 bg-current rounded-full animate-bounce-subtle" style={{ color: bgGradient[0], top: '30%', left: '80%', animationDelay: '1s' }} />
      </div>
      
      <CardContent className="pt-6 pb-4 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-gray-900 tabular-nums tracking-tight">
                {animatedValue.toLocaleString()}
              </p>
              {trend !== undefined && (
                <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                  trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
            style={{ 
              background: `linear-gradient(135deg, ${bgGradient[0]}, ${bgGradient[1]})`,
              boxShadow: `0 10px 30px ${bgGradient[0]}40`
            }}
          >
            <Icon className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-14 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.map((v, i) => ({ value: v, index: i }))}>
                <defs>
                  <linearGradient id={`sparkline-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={bgGradient[0]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={bgGradient[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={bgGradient[0]} 
                  strokeWidth={2.5}
                  fill={`url(#sparkline-${title.replace(/\s/g, '')})`}
                  dot={false}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Leaderboard Item Component
const LeaderboardItem = ({ candidate, index, maxVotes }: { candidate: any; index: number; maxVotes: number }) => {
  const percentage = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group">
      <div className="w-8 h-8 flex items-center justify-center">
        {index < 3 ? (
          <span className="text-2xl">{medals[index]}</span>
        ) : (
          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-900 truncate">{candidate.name}</span>
          <span className="text-sm font-bold text-gray-700">{candidate.votes.toLocaleString()}</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}99, ${COLORS[index % COLORS.length]})`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVoters: 0,
    totalCandidates: 0,
    totalElections: 0,
    totalVotes: 0,
    recentVoters: [],
    recentCandidates: [],
    votersByDistrict: [],
    candidatesByParty: [],
    voteDistribution: [],
    electionProgress: [],
    voteTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const votersSnapshot = await getDocs(collection(db, 'voters'));
      const voters = votersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
      const candidates = candidatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const electionsSnapshot = await getDocs(collection(db, 'elections'));
      const elections = electionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalVotes = candidates.reduce((sum: number, c: any) => sum + (c.votes || 0), 0);
      
      // Voters by district with growth
      const districtCounts: Record<string, number> = {};
      voters.forEach((v: any) => {
        const district = v.district || 'Unknown';
        districtCounts[district] = (districtCounts[district] || 0) + 1;
      });
      const votersByDistrict = Object.entries(districtCounts)
        .map(([name, value]) => ({ 
          name, 
          value, 
          growth: Math.floor(Math.random() * 30) - 10 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Candidates by party
      const partyCounts: Record<string, number> = {};
      candidates.forEach((c: any) => {
        const party = c.candidateParty || 'Independent';
        partyCounts[party] = (partyCounts[party] || 0) + 1;
      });
      const candidatesByParty = Object.entries(partyCounts)
        .map(([name, value], index) => ({ 
          name: name.length > 12 ? name.substring(0, 12) + '...' : name, 
          value, 
          color: COLORS[index % COLORS.length] 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Vote distribution for radial chart
      const voteDistribution = candidates
        .map((c: any, index: number) => ({
          name: c.candidateName?.substring(0, 10) || 'Unknown',
          votes: c.votes || 0,
          percentage: totalVotes > 0 ? Math.round(((c.votes || 0) / totalVotes) * 100) : 0,
          fill: COLORS[index % COLORS.length]
        }))
        .sort((a: any, b: any) => b.votes - a.votes)
        .slice(0, 6);

      // Election progress with turnout
      const electionProgress = elections.slice(0, 5).map((e: any, index: number) => {
        const registered = Math.floor(Math.random() * 800) + 200;
        const voted = Math.floor(Math.random() * registered * 0.8);
        return {
          name: e.name?.substring(0, 8) || `Elec ${index + 1}`,
          registered,
          voted,
          turnout: Math.round((voted / registered) * 100)
        };
      });

      // Vote trend (simulated hourly data)
      const voteTrend = Array.from({ length: 12 }, (_, i) => ({
        time: `${(i + 8).toString().padStart(2, '0')}:00`,
        votes: Math.floor(Math.random() * 500) + 100
      }));

      setStats({
        totalVoters: voters.length,
        totalCandidates: candidates.length,
        totalElections: elections.length,
        totalVotes,
        recentVoters: voters.slice(0, 5),
        recentCandidates: candidates.slice(0, 5),
        votersByDistrict,
        candidatesByParty,
        voteDistribution,
        electionProgress,
        voteTrend,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  // Generate sparkline data for stat cards
  const generateSparkline = (base: number) => 
    Array.from({ length: 10 }, () => Math.max(1, base + Math.floor(Math.random() * Math.max(base * 0.3, 5))));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <Activity className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Loading Dashboard</p>
          <p className="text-sm text-gray-500">Fetching real-time election data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with gradient text */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Real-time election monitoring and analytics
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100/80 backdrop-blur rounded-xl text-sm text-gray-600 border border-gray-200/50">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border-2 hover:border-blue-500 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
            </div>
            <span className="text-sm font-semibold text-green-700">Live</span>
          </div>
        </div>
      </div>

      {/* Stat Cards with staggered animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Voters" 
          value={stats.totalVoters} 
          icon={Users} 
          bgGradient={GRADIENT_COLORS.blue}
          trend={12}
          subtitle="Registered citizens"
          sparklineData={generateSparkline(stats.totalVoters)}
          delay={0}
        />
        <StatCard 
          title="Candidates" 
          value={stats.totalCandidates} 
          icon={Award} 
          bgGradient={GRADIENT_COLORS.purple}
          trend={8}
          subtitle="Running for office"
          sparklineData={generateSparkline(stats.totalCandidates)}
          delay={100}
        />
        <StatCard 
          title="Elections" 
          value={stats.totalElections} 
          icon={Calendar} 
          bgGradient={GRADIENT_COLORS.green}
          trend={-3}
          subtitle="Active campaigns"
          sparklineData={generateSparkline(stats.totalElections)}
          delay={200}
        />
        <StatCard 
          title="Total Votes" 
          value={stats.totalVotes} 
          icon={Vote} 
          bgGradient={GRADIENT_COLORS.orange}
          trend={25}
          subtitle="Votes cast"
          sparklineData={generateSparkline(stats.totalVotes)}
          delay={300}
        />
      </div>

      {/* Real-time Vote Activity */}
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">Real-time Vote Activity</span>
                <p className="text-sm font-normal text-white/80">Live voting trends throughout the day</p>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Live Stream
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={stats.voteTrend}>
              <defs>
                <linearGradient id="voteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="votes" 
                fill="url(#voteGradient)" 
                stroke="#3B82F6"
                strokeWidth={3}
                name="Votes"
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="votes" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 3, r: 5, stroke: '#fff' }}
                activeDot={{ r: 8, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 3, filter: 'url(#glow)' }}
                name="Trend"
                animationDuration={2000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voters by District */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Voters by District</span>
                <p className="text-sm font-normal text-white/80">Geographic distribution</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.votersByDistrict.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No voter data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.votersByDistrict} layout="vertical" barCategoryGap="20%">
                  <defs>
                    {stats.votersByDistrict.map((_, index) => (
                      <linearGradient key={index} id={`districtGrad${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={85} 
                    tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Voters" animationDuration={1500}>
                    {stats.votersByDistrict.map((_, index) => (
                      <Cell key={index} fill={`url(#districtGrad${index})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Party Distribution */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Party Distribution</span>
                <p className="text-sm font-normal text-white/80">Candidates per party</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.candidatesByParty.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No candidate data available</p>
              </div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={300}>
                  <RechartsPieChart>
                    <defs>
                      {stats.candidatesByParty.map((entry, index) => (
                        <linearGradient key={index} id={`partyGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={stats.candidatesByParty}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={1500}
                    >
                      {stats.candidatesByParty.map((_, index) => (
                        <Cell key={index} fill={`url(#partyGrad${index})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="w-2/5 space-y-3">
                  {stats.candidatesByParty.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm group cursor-pointer">
                      <div 
                        className="w-4 h-4 rounded-lg shadow-md group-hover:scale-110 transition-transform" 
                        style={{ backgroundColor: entry.color, boxShadow: `0 4px 12px ${entry.color}40` }}
                      />
                      <span className="text-gray-600 truncate flex-1 group-hover:text-gray-900 transition-colors">{entry.name}</span>
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Turnout Analysis & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Election Turnout */}
        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Election Turnout Analysis</span>
                <p className="text-sm font-normal text-white/80">Registration vs participation</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.electionProgress.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No election data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={stats.electionProgress}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="voteGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} unit="%" axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Bar yAxisId="left" dataKey="registered" fill="url(#regGrad)" name="Registered" radius={[6, 6, 0, 0]} animationDuration={1500} />
                  <Bar yAxisId="left" dataKey="voted" fill="url(#voteGrad)" name="Voted" radius={[6, 6, 0, 0]} animationDuration={1500} />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="turnout" 
                    stroke="#F59E0B" 
                    strokeWidth={4}
                    dot={{ fill: '#F59E0B', r: 6, stroke: '#fff', strokeWidth: 3 }}
                    name="Turnout %"
                    animationDuration={2000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Candidate Leaderboard */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Leaderboard</span>
                <p className="text-sm font-normal text-white/80">Top performers</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.voteDistribution.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No vote data available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.voteDistribution.slice(0, 5).map((candidate, index) => (
                  <LeaderboardItem 
                    key={index} 
                    candidate={candidate} 
                    index={index} 
                    maxVotes={Math.max(...stats.voteDistribution.map(c => c.votes))}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Recent Voters</span>
                <p className="text-sm font-normal text-white/80">Latest registrations</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentVoters.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No voters registered yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.recentVoters.map((voter: any, index: number) => (
                  <li key={index} className="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <span className="text-base font-bold text-white">
                          {voter.name?.charAt(0) || 'V'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{voter.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Globe className="w-3 h-3" />
                          {voter.district || 'No district'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                          {voter.nic?.slice(-4) || '****'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Recent Candidates</span>
                <p className="text-sm font-normal text-white/80">Latest nominations</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentCandidates.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No candidates registered yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.recentCandidates.map((candidate: any, index: number) => (
                  <li key={index} className="px-6 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <span className="text-base font-bold text-white">
                          {candidate.candidateName?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{candidate.candidateName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Shield className="w-3 h-3" />
                          {candidate.candidateParty || 'Independent'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-purple-600">{candidate.votes || 0}</span>
                        <p className="text-xs text-gray-400">votes</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold">Quick Actions</span>
              <p className="text-sm font-normal text-white/80">Common tasks and shortcuts</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-br from-slate-50 to-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/elections', icon: Calendar, label: 'Add Election', gradient: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
              { href: '/candidates-old', icon: Award, label: 'Add Candidate', gradient: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/30' },
              { href: '/voters', icon: Users, label: 'Add Voter', gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
              { href: '/results', icon: BarChart3, label: 'View Results', gradient: 'from-orange-500 to-amber-600', glow: 'shadow-orange-500/30' },
            ].map((action, index) => (
              <a 
                key={index}
                href={action.href} 
                className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gray-100 hover:border-transparent hover:shadow-2xl ${action.glow} transition-all duration-300 group bg-white`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900 group-hover:text-gray-700">{action.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

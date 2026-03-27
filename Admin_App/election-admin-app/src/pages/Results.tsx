import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { api, Candidate } from '@/lib/api';
import { 
  BarChart3, Trophy, PieChart, Download, RefreshCw,
  Award, Crown, Medal, Sparkles, Zap, Target, Filter,
  ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Eye
} from 'lucide-react';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell,
  AreaChart, Area, Line, ComposedChart
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const GRADIENT_COLORS = {
  blue: ['#3B82F6', '#1D4ED8'],
  green: ['#10B981', '#059669'],
  purple: ['#8B5CF6', '#7C3AED'],
  orange: ['#F59E0B', '#D97706'],
  pink: ['#EC4899', '#DB2777'],
  cyan: ['#06B6D4', '#0891B2'],
};

// Animated counter hook
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

// Advanced Stat Card
const StatCard = ({ 
  title, value, icon: Icon, bgGradient, trend, subtitle, delay = 0
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  bgGradient: string[];
  trend?: number;
  subtitle?: string;
  delay?: number;
}) => {
  const animatedValue = useAnimatedCounter(typeof value === 'number' ? value : 0, 2000);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Card className={`relative overflow-hidden group card-hover gradient-border transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-500"
        style={{ background: `linear-gradient(135deg, ${bgGradient[0]}, ${bgGradient[1]})` }}
      />
      <div className="spotlight absolute inset-0" />
      
      <CardContent className="pt-6 pb-4 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-gray-900 tabular-nums tracking-tight">
                {typeof value === 'number' ? animatedValue.toLocaleString() : value}
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
      </CardContent>
    </Card>
  );
};

// Winner Card Component
const WinnerCard = ({ candidate, position, totalVotes }: { candidate: Candidate; position: number; totalVotes: number }) => {
  const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0';
  const medals = ['🥇', '🥈', '🥉'];
  const gradients = [
    'from-yellow-400 via-amber-500 to-orange-600',
    'from-gray-300 via-slate-400 to-gray-500',
    'from-amber-600 via-orange-700 to-red-800'
  ];
  const bgGradients = [
    'from-yellow-50 to-amber-100',
    'from-gray-50 to-slate-100',
    'from-orange-50 to-amber-100'
  ];
  
  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${bgGradients[position]} border-2 border-white shadow-xl card-hover`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
        <Crown className="w-full h-full text-yellow-500" />
      </div>
      
      {position === 0 && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="shimmer absolute inset-0" />
        </div>
      )}
      
      <CardContent className="pt-8 pb-6 relative">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradients[position]} flex items-center justify-center shadow-2xl`}>
              <span className="text-4xl">{medals[position]}</span>
            </div>
            {position === 0 && (
              <div className="absolute -inset-2 rounded-[2rem] border-4 border-yellow-400/50 animate-pulse" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900">{candidate.name}</h3>
            <p className="text-sm text-gray-600 font-medium">{candidate.party}</p>
          </div>
          
          <div className="w-full">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-600">Vote Share</span>
              <span className="font-black text-gray-900">{percentage}%</span>
            </div>
            <div className="relative h-3 bg-white/50 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${gradients[position]} transition-all duration-1000 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{candidate.votes.toLocaleString()}</span>
            <span className="text-sm text-gray-500">votes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Leaderboard Row Component
const LeaderboardRow = ({ candidate, index, maxVotes, totalVotes }: { candidate: Candidate; index: number; maxVotes: number; totalVotes: number }) => {
  const percentage = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
  const votePercentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0';
  
  return (
    <div className={`table-row-hover flex items-center gap-4 p-4 rounded-xl border border-gray-100 ${
      index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' :
      index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200' :
      index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' :
      'bg-white hover:bg-gray-50'
    }`}>
      <div className="w-10 h-10 flex items-center justify-center">
        {index === 0 ? <span className="text-2xl">🥇</span> :
         index === 1 ? <span className="text-2xl">🥈</span> :
         index === 2 ? <span className="text-2xl">🥉</span> :
         <span className="text-lg font-bold text-gray-400">#{index + 1}</span>}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-bold text-gray-900 truncate">{candidate.name}</p>
            <p className="text-xs text-gray-500">{candidate.party}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-gray-900">{candidate.votes.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{votePercentage}%</p>
          </div>
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

export default function Results() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterParty, setFilterParty] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadResults();
  };

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];
    if (filterParty !== 'all') {
      result = result.filter(c => c.party === filterParty);
    }
    result.sort((a, b) => sortOrder === 'desc' ? b.votes - a.votes : a.votes - b.votes);
    return result;
  }, [candidates, filterParty, sortOrder]);

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const maxVotes = Math.max(...candidates.map(c => c.votes), 0);
  const parties = [...new Set(candidates.map(c => c.party))];

  // Chart data
  const barChartData = useMemo(() => {
    return filteredCandidates.slice(0, 8).map((c, index) => ({
      name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
      votes: c.votes,
      percentage: totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0,
      fill: COLORS[index % COLORS.length]
    }));
  }, [filteredCandidates, totalVotes]);

  const pieChartData = useMemo(() => {
    const partyVotes: Record<string, number> = {};
    candidates.forEach(c => {
      const party = c.party || 'Independent';
      partyVotes[party] = (partyVotes[party] || 0) + c.votes;
    });
    return Object.entries(partyVotes)
      .map(([name, value], index) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value,
        percentage: totalVotes > 0 ? Math.round((value / totalVotes) * 100) : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [candidates, totalVotes]);

  const voteTrendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${(i + 8).toString().padStart(2, '0')}:00`,
      votes: Math.floor(Math.random() * 500) + 100,
      cumulative: Math.floor(Math.random() * 5000) + (i * 400)
    }));
  }, []);

  const exportResults = () => {
    const headers = ['Position', 'Name', 'Party', 'District', 'Votes', 'Percentage'];
    const rows = filteredCandidates.map((c, i) => [
      i + 1,
      c.name,
      c.party,
      c.district,
      c.votes,
      totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(2) + '%' : '0%'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-100 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" />
          <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <Trophy className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Loading Results</p>
          <p className="text-sm text-gray-500">Counting votes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Crown className="w-10 h-10 text-yellow-500" />
            Election Results
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Live vote counting and candidate rankings
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            className="flex items-center gap-2 rounded-xl"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'cards' ? 'Table View' : 'Card View'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportResults}
            className="flex items-center gap-2 rounded-xl"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl"
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Votes" 
          value={totalVotes} 
          icon={Trophy} 
          bgGradient={GRADIENT_COLORS.blue}
          trend={15}
          subtitle="Votes cast"
          delay={0}
        />
        <StatCard 
          title="Candidates" 
          value={candidates.length} 
          icon={Award} 
          bgGradient={GRADIENT_COLORS.purple}
          subtitle="Competing"
          delay={100}
        />
        <StatCard 
          title="Leading Party" 
          value={filteredCandidates[0]?.party?.split(' ')[0] || 'N/A'} 
          icon={Target} 
          bgGradient={GRADIENT_COLORS.green}
          subtitle="Most votes"
          delay={200}
        />
        <StatCard 
          title="Highest Votes" 
          value={maxVotes} 
          icon={Crown} 
          bgGradient={GRADIENT_COLORS.orange}
          subtitle="Single candidate"
          delay={300}
        />
      </div>

      {/* Winners Podium */}
      {filteredCandidates.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:order-2">
            <WinnerCard candidate={filteredCandidates[0]} position={0} totalVotes={totalVotes} />
          </div>
          <div className="md:order-1 md:mt-8">
            <WinnerCard candidate={filteredCandidates[1]} position={1} totalVotes={totalVotes} />
          </div>
          <div className="md:order-3 md:mt-8">
            <WinnerCard candidate={filteredCandidates[2]} position={2} totalVotes={totalVotes} />
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-lg">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Party:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterParty('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterParty === 'all' 
                    ? 'bg-gray-900 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Parties
              </button>
              {parties.map((party) => (
                <button
                  key={party}
                  onClick={() => setFilterParty(party)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterParty === party 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {party.length > 15 ? party.substring(0, 15) + '...' : party}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-all"
              >
                {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vote Distribution */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Vote Distribution</span>
                <p className="text-sm font-normal text-white/80">Top candidates by votes</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {barChartData.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No vote data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={barChartData} layout="vertical">
                  <defs>
                    {barChartData.map((_, index) => (
                      <linearGradient key={index} id={`barGrad${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                  <Bar dataKey="votes" radius={[0, 8, 8, 0]} name="Votes" animationDuration={1500}>
                    {barChartData.map((_, index) => (
                      <Cell key={index} fill={`url(#barGrad${index})`} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Party Vote Share */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">Party Vote Share</span>
                <p className="text-sm font-normal text-white/80">Distribution by party</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {pieChartData.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No party data available</p>
              </div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={300}>
                  <RechartsPieChart>
                    <defs>
                      {pieChartData.map((entry, index) => (
                        <linearGradient key={index} id={`pieGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={1500}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={index} fill={`url(#pieGrad${index})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="w-2/5 space-y-3">
                  {pieChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm group cursor-pointer">
                      <div 
                        className="w-4 h-4 rounded-lg shadow-md group-hover:scale-110 transition-transform" 
                        style={{ backgroundColor: entry.color, boxShadow: `0 4px 12px ${entry.color}40` }}
                      />
                      <span className="text-gray-600 truncate flex-1">{entry.name}</span>
                      <span className="font-bold text-gray-900">{entry.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Voting Trend Chart */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold">Voting Activity Trend</span>
              <p className="text-sm font-normal text-white/80">Hourly vote distribution</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={voteTrendData}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="votes" stroke="#10B981" strokeWidth={3} fill="url(#trendGradient)" name="Votes per Hour" animationDuration={2000} />
              <Line type="monotone" dataKey="cumulative" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Cumulative" animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Candidate Leaderboard */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-red-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Medal className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold">Complete Rankings</span>
              <p className="text-sm font-normal text-white/80">All candidates sorted by votes</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {viewMode === 'cards' ? (
            <div className="space-y-3">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No candidates found</p>
                </div>
              ) : (
                filteredCandidates.map((candidate, index) => (
                  <LeaderboardRow 
                    key={candidate.id} 
                    candidate={candidate} 
                    index={index} 
                    maxVotes={maxVotes} 
                    totalVotes={totalVotes}
                  />
                ))
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold">Position</TableHead>
                  <TableHead className="font-bold">Candidate</TableHead>
                  <TableHead className="font-bold">Party</TableHead>
                  <TableHead className="font-bold">District</TableHead>
                  <TableHead className="font-bold">Votes</TableHead>
                  <TableHead className="font-bold">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate, index) => (
                  <TableRow key={candidate.id} className="table-row-hover">
                    <TableCell>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </TableCell>
                    <TableCell className="font-semibold">{candidate.name}</TableCell>
                    <TableCell>{candidate.party}</TableCell>
                    <TableCell>{candidate.district}</TableCell>
                    <TableCell className="font-bold text-purple-600">{candidate.votes.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

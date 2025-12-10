import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { api, District } from '@/lib/api';
import { 
  MapPin, Plus, Trash2, Edit, Search, Download, RefreshCw,
  Globe, Users, Vote, ArrowUpRight, ArrowDownRight, 
  Sparkles, Eye, ChevronDown, ChevronUp, Target, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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

// Custom Tooltip
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
  title, value, icon: Icon, bgGradient, trend, subtitle, delay = 0, suffix = ''
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  bgGradient: string[];
  trend?: number;
  subtitle?: string;
  delay?: number;
  suffix?: string;
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
                {typeof value === 'number' ? animatedValue.toLocaleString() : value}{suffix}
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

// District Card Component
const DistrictCard = ({ district, index, maxVoters, onEdit, onDelete }: { 
  district: District; 
  index: number;
  maxVoters: number;
  onEdit: () => void; 
  onDelete: () => void;
}) => {
  const turnout = district.registeredVoters > 0 
    ? (district.totalVotes / district.registeredVoters) * 100 
    : 0;
  const voterPercentage = maxVoters > 0 ? (district.registeredVoters / maxVoters) * 100 : 0;
  const gradient = `from-${['blue', 'purple', 'emerald', 'orange', 'rose', 'cyan'][index % 6]}-500 to-${['indigo', 'pink', 'teal', 'amber', 'red', 'blue'][index % 6]}-600`;
  
  return (
    <Card className="group card-hover overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
      <div className={`bg-gradient-to-r ${gradient} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-20 h-20 opacity-20 transform translate-x-4 -translate-y-4">
          <Globe className="w-full h-full text-white" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{district.name}</h3>
              <p className="text-sm text-white/80">District #{index + 1}</p>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-4 pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 relative overflow-hidden">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-blue-500/10"
              style={{ height: `${voterPercentage}%` }}
            />
            <p className="text-xs text-gray-500 font-medium mb-1 relative">Registered</p>
            <p className="text-lg font-bold text-gray-900 relative">{district.registeredVoters.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Voted</p>
            <p className="text-lg font-bold text-gray-900">{district.totalVotes.toLocaleString()}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-600">Turnout</span>
            <span className={`text-lg font-black ${
              turnout >= 70 ? 'text-green-600' : turnout >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>{turnout.toFixed(1)}%</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${
                turnout >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                turnout >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
              style={{ width: `${turnout}%` }}
            />
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-xl border-2 hover:bg-gray-50 transition-all"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="flex-1 rounded-xl shadow-lg hover:shadow-red-500/25 transition-all"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Districts() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'voters' | 'turnout'>('voters');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      const data = await api.getDistricts();
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this district?')) {
      try {
        await api.deleteDistrict(id);
        setDistricts(districts.filter(d => d.id !== id));
      } catch (error) {
        console.error('Error deleting district:', error);
        alert('Failed to delete district');
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDistricts();
  };

  const calculateTurnout = (district: District): number => {
    if (district.registeredVoters === 0) return 0;
    return (district.totalVotes / district.registeredVoters) * 100;
  };

  // Filter and sort
  const filteredDistricts = useMemo(() => {
    let result = [...districts];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(query));
    }
    
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
      if (sortBy === 'voters') {
        return sortOrder === 'desc' ? b.registeredVoters - a.registeredVoters : a.registeredVoters - b.registeredVoters;
      }
      return sortOrder === 'desc' ? calculateTurnout(b) - calculateTurnout(a) : calculateTurnout(a) - calculateTurnout(b);
    });
    
    return result;
  }, [districts, searchQuery, sortBy, sortOrder]);

  const totalVoters = districts.reduce((sum, d) => sum + d.registeredVoters, 0);
  const totalVotes = districts.reduce((sum, d) => sum + d.totalVotes, 0);
  const avgTurnout = districts.length > 0 
    ? districts.reduce((sum, d) => sum + calculateTurnout(d), 0) / districts.length 
    : 0;
  const maxVoters = Math.max(...districts.map(d => d.registeredVoters), 0);

  // Chart data
  const chartData = useMemo(() => {
    return filteredDistricts.slice(0, 8).map((d, i) => ({
      name: d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name,
      voters: d.registeredVoters,
      votes: d.totalVotes,
      turnout: calculateTurnout(d),
      fill: COLORS[i % COLORS.length]
    }));
  }, [filteredDistricts]);

  const exportData = () => {
    const headers = ['District', 'Registered Voters', 'Total Votes', 'Turnout'];
    const rows = filteredDistricts.map(d => [
      d.name,
      d.registeredVoters,
      d.totalVotes,
      calculateTurnout(d).toFixed(2) + '%'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `districts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <Globe className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Loading Districts</p>
          <p className="text-sm text-gray-500">Fetching geographic data...</p>
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
            <Globe className="w-10 h-10 text-blue-500" />
            Districts
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Manage electoral districts and voter turnout
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="flex items-center gap-2 rounded-xl"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportData}
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
            Refresh
          </Button>
          <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-blue-500/25 transition-all">
            <Plus className="w-4 h-4" />
            Add District
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Districts" 
          value={districts.length} 
          icon={Globe} 
          bgGradient={GRADIENT_COLORS.blue}
          trend={5}
          subtitle="Electoral regions"
          delay={0}
        />
        <StatCard 
          title="Registered Voters" 
          value={totalVoters} 
          icon={Users} 
          bgGradient={GRADIENT_COLORS.green}
          trend={12}
          subtitle="Total citizens"
          delay={100}
        />
        <StatCard 
          title="Total Votes" 
          value={totalVotes} 
          icon={Vote} 
          bgGradient={GRADIENT_COLORS.purple}
          trend={18}
          subtitle="Votes cast"
          delay={200}
        />
        <StatCard 
          title="Avg Turnout" 
          value={Math.round(avgTurnout)} 
          icon={Target} 
          bgGradient={GRADIENT_COLORS.orange}
          suffix="%"
          subtitle="Voter participation"
          delay={300}
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold">District Overview</span>
                <p className="text-sm font-normal text-white/80">Voter registration by district</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <defs>
                  {chartData.map((_, index) => (
                    <linearGradient key={index} id={`distGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="voters" name="Registered" radius={[8, 8, 0, 0]} animationDuration={1500}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={`url(#distGrad${index})`} />
                  ))}
                </Bar>
                <Bar dataKey="votes" name="Voted" radius={[8, 8, 0, 0]} animationDuration={1500} fill="#10B981" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-lg">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search districts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'voters' | 'turnout')}
              title="Sort by"
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium"
            >
              <option value="voters">Sort by Voters</option>
              <option value="turnout">Sort by Turnout</option>
              <option value="name">Sort by Name</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Showing {filteredDistricts.length} of {districts.length} districts</span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Clear search
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Districts Grid/Table */}
      {filteredDistricts.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 shadow-lg">
          <CardContent className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No districts found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery ? 'Try adjusting your search query' : 'Add your first district to get started'}
            </p>
            <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add District
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDistricts.map((district, index) => (
            <DistrictCard
              key={district.id}
              district={district}
              index={index}
              maxVoters={maxVoters}
              onEdit={() => {}}
              onDelete={() => handleDelete(district.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              All Districts ({filteredDistricts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold">District</TableHead>
                  <TableHead className="font-bold">Registered</TableHead>
                  <TableHead className="font-bold">Voted</TableHead>
                  <TableHead className="font-bold">Turnout</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistricts.map((district, index) => {
                  const turnout = calculateTurnout(district);
                  return (
                    <TableRow key={district.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${['blue', 'purple', 'emerald', 'orange'][index % 4]}-500 to-${['indigo', 'pink', 'teal', 'amber'][index % 4]}-600 flex items-center justify-center`}>
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold">{district.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{district.registeredVoters.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{district.totalVotes.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                turnout >= 70 ? 'bg-green-500' : turnout >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${turnout}%` }}
                            />
                          </div>
                          <span className={`font-bold text-sm ${
                            turnout >= 70 ? 'text-green-600' : turnout >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>{turnout.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="rounded-lg"
                          onClick={() => handleDelete(district.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

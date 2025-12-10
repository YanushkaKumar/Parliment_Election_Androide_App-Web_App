import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, Candidate } from '@/lib/api';
import { 
  Users, Plus, Trash2, Edit, Search, Download, RefreshCw,
  Award, Trophy, Vote, ArrowUpRight, ArrowDownRight, Sparkles, Target, Eye,
  ChevronDown, ChevronUp
} from 'lucide-react';

const GRADIENT_COLORS = {
  blue: ['#3B82F6', '#1D4ED8'],
  green: ['#10B981', '#059669'],
  purple: ['#8B5CF6', '#7C3AED'],
  orange: ['#F59E0B', '#D97706'],
  pink: ['#EC4899', '#DB2777'],
  cyan: ['#06B6D4', '#0891B2'],
};

const CARD_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
];

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

// Advanced Candidate Card
const CandidateCard = ({ 
  candidate, 
  rank, 
  maxVotes, 
  totalVotes,
  onEdit, 
  onDelete 
}: { 
  candidate: Candidate; 
  rank: number;
  maxVotes: number;
  totalVotes: number;
  onEdit: () => void; 
  onDelete: () => void;
}) => {
  const percentage = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
  const voteShare = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : '0';
  const gradient = CARD_GRADIENTS[rank % CARD_GRADIENTS.length];
  
  return (
    <Card className="group card-hover overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${gradient} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-20 h-20 opacity-20 transform translate-x-4 -translate-y-4">
          <Award className="w-full h-full text-white" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate max-w-[150px]">{candidate.name}</h3>
              <p className="text-sm text-white/80 truncate max-w-[150px]">{candidate.party}</p>
            </div>
          </div>
          
          {rank < 3 && (
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-xl">
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">District</p>
            <p className="text-sm font-bold text-gray-900 truncate">{candidate.district}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Vote Share</p>
            <p className="text-sm font-bold text-gray-900">{voteShare}%</p>
          </div>
        </div>
        
        {/* Vote Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-600">Votes</span>
            <span className="text-lg font-black text-gray-900">{candidate.votes.toLocaleString()}</span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
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

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParty, setFilterParty] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await api.deleteCandidate(id);
        setCandidates(candidates.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting candidate:', error);
        alert('Failed to delete candidate');
      }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCandidates();
  };

  // Filter and sort
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.party.toLowerCase().includes(query) ||
        c.district.toLowerCase().includes(query)
      );
    }
    
    if (filterParty !== 'all') {
      result = result.filter(c => c.party === filterParty);
    }
    
    if (filterDistrict !== 'all') {
      result = result.filter(c => c.district === filterDistrict);
    }
    
    result.sort((a, b) => {
      if (sortBy === 'votes') {
        return sortOrder === 'desc' ? b.votes - a.votes : a.votes - b.votes;
      }
      return sortOrder === 'desc' 
        ? b.name.localeCompare(a.name) 
        : a.name.localeCompare(b.name);
    });
    
    return result;
  }, [candidates, searchQuery, filterParty, filterDistrict, sortBy, sortOrder]);

  const parties = [...new Set(candidates.map(c => c.party))];
  const districts = [...new Set(candidates.map(c => c.district))];
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const maxVotes = Math.max(...candidates.map(c => c.votes), 0);
  const leader = candidates.sort((a, b) => b.votes - a.votes)[0];

  const exportData = () => {
    const headers = ['Name', 'Party', 'District', 'Votes', 'Vote Share'];
    const rows = filteredCandidates.map(c => [
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
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-100 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" />
          <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <Award className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Loading Candidates</p>
          <p className="text-sm text-gray-500">Fetching candidate data...</p>
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
            <Award className="w-10 h-10 text-purple-500" />
            Candidates
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Manage election candidates and track performance
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2 rounded-xl"
          >
            <Eye className="w-4 h-4" />
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
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
          <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25 transition-all">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Candidates" 
          value={candidates.length} 
          icon={Users} 
          bgGradient={GRADIENT_COLORS.blue}
          trend={8}
          subtitle="Registered"
          delay={0}
        />
        <StatCard 
          title="Total Votes" 
          value={totalVotes} 
          icon={Vote} 
          bgGradient={GRADIENT_COLORS.green}
          trend={15}
          subtitle="Votes cast"
          delay={100}
        />
        <StatCard 
          title="Political Parties" 
          value={parties.length} 
          icon={Target} 
          bgGradient={GRADIENT_COLORS.purple}
          subtitle="Represented"
          delay={200}
        />
        <StatCard 
          title="Leading" 
          value={leader?.name?.split(' ')[0] || 'N/A'} 
          icon={Trophy} 
          bgGradient={GRADIENT_COLORS.orange}
          subtitle={leader ? `${leader.votes.toLocaleString()} votes` : ''}
          delay={300}
        />
      </div>

      {/* Filters */}
      <Card className="shadow-lg">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none"
              />
            </div>
            
            {/* Party Filter */}
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              aria-label="Filter by party"
              title="Filter by party"
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none font-medium"
            >
              <option value="all">All Parties</option>
              {parties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            {/* District Filter */}
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              aria-label="Filter by district"
              title="Filter by district"
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none font-medium"
            >
              <option value="all">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'votes' | 'name')}
                aria-label="Sort candidates"
                title="Sort candidates"
                className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none font-medium"
              >
                <option value="votes">Sort by Votes</option>
                <option value="name">Sort by Name</option>
              </select>
              
                <option value="votes">Sort by Votes</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-3 rounded-xl border-2 border-gray-200 hover:border-purple-500 transition-all"
              >
                {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          
          
          {/* Results count */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Showing {filteredCandidates.length} of {candidates.length} candidates</span>
            {(searchQuery || filterParty !== 'all' || filterDistrict !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setFilterParty('all'); setFilterDistrict('all'); }}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidates Grid/List */}
      {filteredCandidates.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 shadow-lg">
          <CardContent className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery || filterParty !== 'all' || filterDistrict !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Add your first candidate to get started'}
            </p>
            <Button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredCandidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              rank={index}
              maxVotes={maxVotes}
              totalVotes={totalVotes}
              onEdit={() => {}}
              onDelete={() => handleDelete(candidate.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

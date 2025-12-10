import { useState, useEffect, useMemo } from 'react';
import { addDoc, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
// @ts-ignore: firebase.js is a plain JS module without declaration file
import { db } from '../firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Plus, Trash2, Search, Clock, Edit, X, RefreshCw, Download,
  CalendarDays, CalendarCheck, CalendarClock, CheckCircle2,
  Sparkles, Timer, Zap, Eye, BarChart3, Settings, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface Election {
  id: string;
  name: string;
  date: string;
  description?: string;
  type?: string;
  status?: string;
}

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(end * easeOutExpo));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
};

// Stat card component
const StatCard = ({ icon: Icon, label, value, gradient, subtext, delay = 0 }: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
  subtext?: string;
  delay?: number;
}) => {
  const animatedValue = useAnimatedCounter(value);
  
  return (
    <div 
      className="card-hover relative group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <div className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{animatedValue}</p>
          {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
        </div>
      </div>
    </div>
  );
};

// Election card component
const ElectionCard = ({ election, onEdit, onDelete, index }: {
  election: Election;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) => {
  
  const getElectionStatus = (date: string) => {
    const electionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    electionDate.setHours(0, 0, 0, 0);
    
    if (electionDate.getTime() === today.getTime()) {
      return { label: 'Live Today', color: 'from-green-500 to-emerald-600', icon: Zap, textColor: 'text-green-600' };
    } else if (electionDate > today) {
      return { label: 'Upcoming', color: 'from-blue-500 to-indigo-600', icon: CalendarClock, textColor: 'text-blue-600' };
    } else {
      return { label: 'Completed', color: 'from-gray-400 to-gray-500', icon: CheckCircle2, textColor: 'text-gray-600' };
    }
  };

  const getDaysRemaining = (date: string) => {
    const electionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    electionDate.setHours(0, 0, 0, 0);
    
    const diff = Math.ceil((electionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return { text: 'Today', isLive: true };
    if (diff === 1) return { text: '1 day left', isLive: false };
    if (diff > 1) return { text: `${diff} days left`, isLive: false };
    if (diff === -1) return { text: '1 day ago', isLive: false };
    return { text: `${Math.abs(diff)} days ago`, isLive: false };
  };

  const status = getElectionStatus(election.date);
  const timeInfo = getDaysRemaining(election.date);
  const StatusIcon = status.icon;

  const gradients = [
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-orange-500 via-red-500 to-rose-500',
    'from-emerald-500 via-green-500 to-lime-500',
    'from-violet-500 via-purple-500 to-fuchsia-500',
    'from-amber-500 via-orange-500 to-red-500'
  ];
  
  return (
    <div 
      className="card-hover group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-xl"
      style={{ animationDelay: `${index * 100}ms` }}

    >
      {/* Gradient Header */}
      <div className={`relative bg-gradient-to-r ${gradients[index % gradients.length]} p-6 overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        
        {/* Live indicator for today's elections */}
        {timeInfo.isLive && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
          </div>
        )}
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur text-white flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white line-clamp-2">{election.name}</h3>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Date info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {new Date(election.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className={`text-sm font-semibold ${status.textColor}`}>
                {timeInfo.text}
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress indicator for upcoming elections */}
        {new Date(election.date) > new Date() && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Preparation Progress</span>
              <span>75%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${status.color} transition-all duration-1000`}
                style={{ width: '75%' }}
              />
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-xl border-2 hover:bg-gray-50"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 rounded-xl border-2 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Details
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="rounded-xl shadow-lg"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
};

// Timeline component
const ElectionTimeline = ({ elections }: { elections: Election[] }) => {
  const sortedElections = [...elections].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ).slice(0, 5);
  
  return (
    <div className="space-y-4">
      {sortedElections.map((election, index) => {
        const isUpcoming = new Date(election.date) >= new Date();
        const isToday = new Date(election.date).toDateString() === new Date().toDateString();
        
        return (
          <div key={election.id} className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${
                isToday ? 'bg-green-500 animate-pulse' :
                isUpcoming ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
              {index < sortedElections.length - 1 && (
                <div className={`w-0.5 h-16 ${
                  isUpcoming ? 'bg-blue-200' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className={`font-semibold ${
                isToday ? 'text-green-600' :
                isUpcoming ? 'text-gray-900' : 'text-gray-500'
              }`}>{election.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(election.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {isToday && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <Zap className="w-3 h-3" />
                  Happening Now
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Elections() {
  const [electionData, setElectionData] = useState({
    name: '',
    date: '',
    description: '',
    type: 'general',
  });
  const [elections, setElections] = useState<Election[]>([]);
  const [filteredElections, setFilteredElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    filterElections();
  }, [elections, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = elections.filter(e => new Date(e.date) > today).length;
    const completed = elections.filter(e => new Date(e.date) < today).length;
    const todayCount = elections.filter(e => {
      const electionDate = new Date(e.date);
      electionDate.setHours(0, 0, 0, 0);
      return electionDate.getTime() === today.getTime();
    }).length;
    
    // Chart data - elections by month
    const monthData: { [key: string]: number } = {};
    elections.forEach(e => {
      const month = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthData[month] = (monthData[month] || 0) + 1;
    });
    
    const chartData = Object.entries(monthData).map(([name, count]) => ({ name, elections: count }));
    
    return { total: elections.length, upcoming, completed, today: todayCount, chartData };
  }, [elections]);

  const filterElections = () => {
    let filtered = [...elections];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(term)
      );
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterStatus === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.date) >= today);
    } else if (filterStatus === 'past') {
      filtered = filtered.filter(e => new Date(e.date) < today);
    } else if (filterStatus === 'today') {
      filtered = filtered.filter(e => {
        const electionDate = new Date(e.date);
        electionDate.setHours(0, 0, 0, 0);
        return electionDate.getTime() === today.getTime();
      });
    }
    
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredElections(filtered);
  };

  const fetchElections = async () => {
    setPageLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'elections'));
      const electionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Election[];
      setElections(electionsList);
    } catch (error) {
      console.error('Error fetching elections: ', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleElectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingElection) {
        await updateDoc(doc(db, 'elections', editingElection.id), { ...electionData });
      } else {
        await addDoc(collection(db, 'elections'), electionData);
      }
      fetchElections();
      resetForm();
    } catch (error) {
      console.error('Error saving election: ', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setElectionData({ name: '', date: '', description: '', type: 'general' });
    setEditingElection(null);
    setShowForm(false);
  };

  const handleEdit = (election: Election) => {
    setEditingElection(election);
    setElectionData({
      name: election.name,
      date: election.date,
      description: election.description || '',
      type: election.type || 'general',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this election?')) {
      try {
        await deleteDoc(doc(db, 'elections', id));
        setElections(elections.filter((e) => e.id !== id));
      } catch (error) {
        console.error('Error deleting election:', error);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Date', 'Status'];
    const today = new Date();
    const csvContent = [
      headers.join(','),
      ...filteredElections.map(e => {
        const status = new Date(e.date) >= today ? 'Upcoming' : 'Completed';
        return [e.name, e.date, status].map(field => `"${field}"`).join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elections_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-200 rounded-full animate-pulse" />
            <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-4 w-12 h-12 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-gray-600 font-medium">Loading elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
                  <CalendarDays className="w-8 h-8 text-white" />
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full">
                  <span className="text-sm text-white font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Election Hub
                  </span>
                </div>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">
                Election Management
              </h1>
              <p className="text-indigo-100 text-lg">
                Schedule, track and manage all elections
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                onClick={() => fetchElections()} 
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => { setShowForm(true); setEditingElection(null); }}
                className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Election
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={CalendarDays}
          label="Total Elections"
          value={stats.total}
          gradient="from-blue-500 to-indigo-600"
          delay={0}
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming"
          value={stats.upcoming}
          gradient="from-emerald-500 to-teal-600"
          subtext="Scheduled"
          delay={100}
        />
        <StatCard
          icon={CalendarCheck}
          label="Completed"
          value={stats.completed}
          gradient="from-purple-500 to-pink-600"
          subtext="Finished"
          delay={200}
        />
        <StatCard
          icon={Zap}
          label="Live Today"
          value={stats.today}
          gradient="from-orange-500 to-red-600"
          subtext="Active now"
          delay={300}
        />
      </div>

      {/* Charts and Timeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 card-hover overflow-hidden border-0 shadow-xl rounded-2xl">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Election Distribution
            </h3>
          </div>
          <CardContent className="p-6">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorElections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="elections" stroke="#6366F1" fillOpacity={1} fill="url(#colorElections)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No election data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="card-hover overflow-hidden border-0 shadow-xl rounded-2xl">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Timer className="w-5 h-5 text-white" />
              </div>
              Timeline
            </h3>
          </div>
          <CardContent className="p-6">
            {elections.length > 0 ? (
              <ElectionTimeline elections={elections} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No elections scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-3xl border-0 shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    {editingElection ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingElection ? 'Edit Election' : 'Create New Election'}
                    </h2>
                    <p className="text-indigo-100 text-sm">Fill in the election details</p>
                  </div>
                </div>
                <button 
                  onClick={resetForm}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleElectionSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Election Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    value={electionData.name}
                    onChange={(e) => setElectionData({ ...electionData, name: e.target.value })}
                    placeholder="e.g., Presidential Election 2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    Election Date
                  </label>
                  <input
                    type="date"
                    title="Select election date"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    value={electionData.date}
                    onChange={(e) => setElectionData({ ...electionData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Election Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    value={electionData.type}
                    onChange={(e) => setElectionData({ ...electionData, type: e.target.value })}
                    title="Select election type"
                  >
                    <option value="general">General Election</option>
                    <option value="presidential">Presidential Election</option>
                    <option value="parliamentary">Parliamentary Election</option>
                    <option value="local">Local Council Election</option>
                    <option value="referendum">Referendum</option>
                  </select>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-6">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="rounded-xl px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : editingElection ? (
                      <Edit className="w-5 h-5 mr-2" />
                    ) : (
                      <Plus className="w-5 h-5 mr-2" />
                    )}
                    {editingElection ? 'Update Election' : 'Create Election'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search elections..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex bg-gray-100 rounded-xl p-1.5">
            {(['all', 'upcoming', 'today', 'past'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredElections.length} elections</span>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Elections Grid/List */}
      {filteredElections.length === 0 ? (
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No elections found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try a different search term' : 'Create your first election to get started'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Election
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredElections.map((election, index) => (
            <ElectionCard
              key={election.id}
              election={election}
              index={index}
              onEdit={() => handleEdit(election)}
              onDelete={() => handleDelete(election.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

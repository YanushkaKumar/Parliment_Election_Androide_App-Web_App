import { useState, useEffect, useMemo } from 'react';
import { addDoc, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
// @ts-ignore: No declaration file for ../firebase (firebase initialized in JS)
import { db } from '../firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, Plus, Trash2, Edit, X, Users, Search, Download, 
  RefreshCw, Filter, Mail, MapPin, Building2, CreditCard, User,
  ChevronDown, ChevronUp, CheckCircle2, Sparkles,
  ArrowUpDown, Eye, Shield, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface VoterData {
  nic: string;
  name: string;
  email: string;
  address: string;
  district: string;
  constituency: string;
}

interface StoredVoter extends VoterData {
  id: string;
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
const StatCard = ({ icon: Icon, label, value, gradient, trend, delay = 0 }: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}) => {
  const animatedValue = useAnimatedCounter(value);
  
  return (
    <div 
      className="card-hover relative group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Floating particles */}
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-60 blur-sm transition-opacity float" />
      <div className="absolute bottom-4 right-8 w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-40 blur-sm transition-opacity float" style={{ animationDelay: '0.5s' }} />
      
      <div className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend.isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {trend.value}%
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">
            {animatedValue.toLocaleString()}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
            style={{ width: `${Math.min((value / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Voter card component
const VoterCard = ({ voter, onEdit, onDelete, index }: {
  voter: StoredVoter;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600'
  ];
  const gradient = gradients[index % gradients.length];
  
  return (
    <div 
      className="card-hover group bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`bg-gradient-to-r ${gradient} p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {voter.name?.charAt(0)?.toUpperCase() || 'V'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate">{voter.name}</h3>
            <p className="text-sm text-white/80 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              {voter.nic}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              title="Toggle details"
              aria-label="Toggle voter details"
            >
              <Eye className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{voter.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{voter.district}</span>
          <span className="text-gray-300">|</span>
          <span>{voter.constituency}</span>
        </div>
        
        {showDetails && (
          <div className="pt-3 border-t border-gray-100 space-y-2 animate-fadeIn">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span>{voter.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600 font-medium">Verified Voter</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 rounded-xl"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            className="flex-1 rounded-xl"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Voters() {
  const [voterData, setVoterData] = useState<VoterData>({
    nic: '',
    name: '',
    email: '',
    address: '',
    district: '',
    constituency: '',
  });

  const [voters, setVoters] = useState<StoredVoter[]>([]);
  const [filteredVoters, setFilteredVoters] = useState<StoredVoter[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'name' | 'district' | 'nic'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);

  const districts = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Jaffna', 'Matale', 'Kurunegala', 'Ratnapura', 'Badulla', 'Trincomalee'];
  
  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#6366F1'];

  useEffect(() => {
    fetchVoters();
  }, []);

  useEffect(() => {
    let filtered = [...voters];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.name?.toLowerCase().includes(term) ||
        v.nic?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.address?.toLowerCase().includes(term)
      );
    }
    
    if (filterDistrict) {
      filtered = filtered.filter(v => v.district === filterDistrict);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'district') {
        comparison = (a.district || '').localeCompare(b.district || '');
      } else if (sortBy === 'nic') {
        comparison = (a.nic || '').localeCompare(b.nic || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredVoters(filtered);
  }, [voters, searchTerm, filterDistrict, sortBy, sortOrder]);

  // Stats calculations
  const stats = useMemo(() => {
    const districtCounts: Record<string, number> = {};
    voters.forEach(v => {
      if (v.district) {
        districtCounts[v.district] = (districtCounts[v.district] || 0) + 1;
      }
    });
    
    const districtData = Object.entries(districtCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      total: voters.length,
      districtsCount: Object.keys(districtCounts).length,
      avgPerDistrict: Object.keys(districtCounts).length > 0 
        ? Math.round(voters.length / Object.keys(districtCounts).length) 
        : 0,
      districtData
    };
  }, [voters]);

  const exportToCSV = () => {
    const headers = ['NIC', 'Name', 'Email', 'District', 'Constituency', 'Address'];
    const csvContent = [
      headers.join(','),
      ...filteredVoters.map(v => 
        [v.nic, v.name, v.email, v.district, v.constituency, v.address].map(field => `"${field || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voters_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const fetchVoters = async () => {
    setPageLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'voters'));
      const votersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StoredVoter[];
      setVoters(votersList);
    } catch (error) {
      console.error('Error fetching voters: ', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && editId) {
        const voterRef = doc(db, 'voters', editId);
        await updateDoc(voterRef, { ...voterData });
      } else {
        await addDoc(collection(db, 'voters'), voterData);
      }

      resetForm();
      fetchVoters();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} voter: `, error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVoterData({
      nic: '',
      name: '',
      email: '',
      address: '',
      district: '',
      constituency: '',
    });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
  };

  const handleEditVoter = (voter: StoredVoter) => {
    setIsEditing(true);
    setEditId(voter.id);
    setShowForm(true);
    setVoterData({
      nic: voter.nic || '',
      name: voter.name || '',
      email: voter.email || '',
      address: voter.address || '',
      district: voter.district || '',
      constituency: voter.constituency || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVoter = async (voterId: string) => {
    if (!window.confirm('Are you sure you want to delete this voter? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'voters', voterId));
      setVoters(voters.filter((voter) => voter.id !== voterId));
      if (editId === voterId) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting voter: ', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field: 'name' | 'district' | 'nic') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 w-20 h-20 border-4 border-emerald-200 rounded-full animate-pulse" />
            <div className="absolute inset-2 w-16 h-16 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
            <div className="absolute inset-4 w-12 h-12 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-gray-600 font-medium">Loading voter data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full">
                  <span className="text-sm text-white font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Voter Registry
                  </span>
                </div>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">
                Voter Management
              </h1>
              <p className="text-emerald-100 text-lg">
                Register, manage and track voter information
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                onClick={() => fetchVoters()} 
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
                Export CSV
              </Button>
              <Button 
                onClick={() => { setShowForm(true); setIsEditing(false); }}
                className="bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Voter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Voters"
          value={stats.total}
          gradient="from-blue-500 to-indigo-600"
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <StatCard
          icon={Building2}
          label="Districts"
          value={stats.districtsCount}
          gradient="from-purple-500 to-pink-600"
          delay={100}
        />
        <StatCard
          icon={User}
          label="Avg per District"
          value={stats.avgPerDistrict}
          gradient="from-emerald-500 to-teal-600"
          delay={200}
        />
        <StatCard
          icon={Shield}
          label="Verified"
          value={stats.total}
          gradient="from-orange-500 to-red-600"
          trend={{ value: 100, isPositive: true }}
          delay={300}
        />
      </div>

      {/* Charts Section */}
      {stats.districtData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-hover overflow-hidden border-0 shadow-xl rounded-2xl">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-white" />
                </div>
                Voters by District
              </h3>
            </div>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.districtData.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" width={80} stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {stats.districtData.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-hover overflow-hidden border-0 shadow-xl rounded-2xl">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                Distribution Overview
              </h3>
            </div>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.districtData.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.districtData.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl border-0 shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    {isEditing ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isEditing ? 'Update Voter' : 'Register New Voter'}
                    </h2>
                    <p className="text-emerald-100 text-sm">Fill in the voter details below</p>
                  </div>
                </div>
                <button 
                  onClick={resetForm}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Close form"
                  title="Close form"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleVoterSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      NIC Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                      value={voterData.nic}
                      onChange={(e) => setVoterData({ ...voterData, nic: e.target.value })}
                      placeholder="199912345678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                      value={voterData.name}
                      onChange={(e) => setVoterData({ ...voterData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                      value={voterData.email}
                      onChange={(e) => setVoterData({ ...voterData, email: e.target.value })}
                      placeholder="voter@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="voter-district" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      District
                    </label>
                    <select
                      id="voter-district"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                      value={voterData.district}
                      onChange={(e) => setVoterData({ ...voterData, district: e.target.value })}
                      required
                    >
                      <option value="">Select district</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Constituency
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                      value={voterData.constituency}
                      onChange={(e) => setVoterData({ ...voterData, constituency: e.target.value })}
                      placeholder="Borella"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Full Address
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
                      rows={3}
                      value={voterData.address}
                      onChange={(e) => setVoterData({ ...voterData, address: e.target.value })}
                      placeholder="123 Main Street, Colombo"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-6">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="rounded-xl px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : isEditing ? (
                      <Edit className="w-5 h-5 mr-2" />
                    ) : (
                      <Plus className="w-5 h-5 mr-2" />
                    )}
                    {isEditing ? 'Update Voter' : 'Register Voter'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search, Filter, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search voters..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              title="Filter districts"
              aria-label="Filter by district"
              className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all appearance-none bg-white min-w-[180px]"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredVoters.length} voters</span>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Voters Display */}
      {filteredVoters.length === 0 ? (
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No voters found</h3>
            <p className="text-gray-500 mb-6">
              {voters.length === 0 
                ? 'Register your first voter to get started.' 
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {voters.length === 0 && (
              <Button 
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Voter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVoters.map((voter, index) => (
            <VoterCard
              key={voter.id}
              voter={voter}
              index={index}
              onEdit={() => handleEditVoter(voter)}
              onDelete={() => handleDeleteVoter(voter.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">
                  <button 
                    onClick={() => toggleSort('nic')}
                    className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                  >
                    NIC
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">
                  <button 
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                  >
                    Name
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">
                  <button 
                    onClick={() => toggleSort('district')}
                    className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                  >
                    District
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">Constituency</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVoters.map((voter) => (
                <TableRow key={voter.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-sm">{voter.nic}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {voter.name?.charAt(0)?.toUpperCase() || 'V'}
                      </div>
                      <span className="font-medium">{voter.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{voter.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                      {voter.district}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">{voter.constituency}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVoter(voter)}
                        className="rounded-lg"
                        aria-label="Edit voter"
                        title="Edit voter"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteVoter(voter.id)}
                        className="rounded-lg"
                        aria-label="Delete voter"
                        title="Delete voter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

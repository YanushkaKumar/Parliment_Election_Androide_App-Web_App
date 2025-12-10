import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
// @ts-ignore: no declaration file for '../firebase'
import { auth } from '../firebase';
import { 
  Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, Landmark, Shield, ChevronRight
} from 'lucide-react';

interface LoginProps {
  onLogin: (user: unknown) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left Panel - Clean Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-slate-900 relative overflow-hidden">
        {/* Subtle gradient accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className={`flex items-center gap-3 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-white font-semibold text-lg">ElectAdmin</span>
          </div>
          
          {/* Main Content */}
          <div className={`max-w-md transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Election Management
              <br />
              <span className="text-slate-400">Made Simple</span>
            </h1>
            <p className="text-slate-400 mt-6 text-lg leading-relaxed">
              Secure, efficient, and transparent electoral administration 
              for the Election Commission of Sri Lanka.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-800">
              <div>
                <div className="text-2xl font-bold text-white">2.8M+</div>
                <div className="text-slate-500 text-sm mt-1">Registered Voters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">25</div>
                <div className="text-slate-500 text-sm mt-1">Districts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-slate-500 text-sm mt-1">Uptime</div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className={`text-slate-600 text-sm transition-all duration-700 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            © 2025 Election Commission of Sri Lanka
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8">
        <div className={`w-full max-w-md transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <span className="text-slate-900 font-semibold text-xl">ElectAdmin</span>
          </div>
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your admin account</p>
          </div>
          
          {/* Login Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focusedField === 'email' 
                  ? 'border-indigo-500 ring-4 ring-indigo-500/10' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'email' ? 'text-indigo-500' : 'text-slate-400'
                }`} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@election.gov.lk"
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent rounded-xl outline-none text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 ${
                focusedField === 'password' 
                  ? 'border-indigo-500 ring-4 ring-indigo-500/10' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                  focusedField === 'password' ? 'text-indigo-500' : 'text-slate-400'
                }`} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-transparent rounded-xl outline-none text-slate-900 placeholder-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Options Row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Forgot password?
              </button>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">Secure Access</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          
          {/* Security Info */}
          <div className="flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs">256-bit SSL</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">SOC 2 Certified</span>
            </div>
          </div>
          
          {/* Help Link */}
          <div className="mt-8 text-center">
            <a href="#" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Need help signing in?
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

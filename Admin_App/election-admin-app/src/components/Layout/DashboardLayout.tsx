import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, Vote, UserCheck, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
// @ts-ignore: module '@/firebase' has no declaration file
import { auth } from '@/firebase';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Elections', href: '/elections', icon: Vote },
  { name: 'Candidates', href: '/candidates-old', icon: Users },
  { name: 'Voters', href: '/voters', icon: UserCheck },
  { name: 'Results', href: '/results', icon: BarChart3 },
];

interface DashboardLayoutProps {
  user?: any;
}

export function DashboardLayout({ user }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-6 lg:px-10">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Vote className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Election System</h1>
                  <p className="text-xs text-gray-500">Administration Portal</p>
                </div>
              </div>
              
              <nav className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-6 lg:px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}

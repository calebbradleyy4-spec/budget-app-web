import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatDate } from '../utils/date';

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        {user?.created_at && (
          <p className="text-xs text-gray-400">Member since {formatDate(user.created_at.slice(0, 10))}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out of your account on this device.</p>
        <Button variant="danger" onClick={handleLogout}>Logout</Button>
      </Card>
    </div>
  );
}

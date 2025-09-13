'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  Plus,
  Eye,
  Edit,
  CheckCircle
} from 'lucide-react';

interface Wish {
  id: string;
  title: string;
  description: string;
  city: string;
  amountCents: number;
  status: string;
  tags: string[];
  createdAt: string;
  fulfillments: Array<{
    id: string;
    amountCents: number;
    status: string;
    createdAt: string;
  }>;
}

interface CharityStats {
  totalRaised: number;
  wishesCreated: number;
  wishesFulfilled: number;
  activeWishes: number;
}

function CharityDashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [stats, setStats] = useState<CharityStats>({
    totalRaised: 0,
    wishesCreated: 0,
    wishesFulfilled: 0,
    activeWishes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCharityData();
  }, []);

  const fetchCharityData = async () => {
    try {
      // Fetch charity's wishes and stats
      const [wishesResponse, statsResponse] = await Promise.all([
        fetch('/api/wishes?role=charity'),
        fetch('/api/analytics?type=charity')
      ]);

      if (wishesResponse.ok) {
        const wishesData = await wishesResponse.json();
        setWishes(wishesData.wishes || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching charity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ELIGIBLE': return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'FULFILLED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || 'Charity'}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your wishes and track your fundraising progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalRaised / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                All time fundraising
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishes Created</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wishesCreated}</div>
              <p className="text-xs text-muted-foreground">
                Total wishes posted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishes Fulfilled</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wishesFulfilled}</div>
              <p className="text-xs text-muted-foreground">
                Successfully funded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Wishes</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWishes}</div>
              <p className="text-xs text-muted-foreground">
                Currently seeking funding
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your charity's wishes and fundraising
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => router.push('/wishes/create')} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Wish
                </Button>
                <Button variant="outline" onClick={() => router.push('/wishes?filter=my-wishes')} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View My Wishes
                </Button>
                <Button variant="outline" onClick={() => router.push('/analytics')} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" onClick={() => router.push('/profile')} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Wishes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Wishes</CardTitle>
              <CardDescription>
                Your latest wish requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wishes.length > 0 ? (
                <div className="space-y-4">
                  {wishes.slice(0, 3).map((wish) => (
                    <div key={wish.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{wish.title}</h4>
                        <Badge className={getStatusColor(wish.status)}>
                          {wish.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {wish.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {wish.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${(wish.amountCents / 100).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(wish.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No wishes created yet</p>
                  <p className="text-sm">Start by creating your first wish</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Fulfillments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Fulfillments</CardTitle>
              <CardDescription>
                Recent donations to your wishes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wishes.some(wish => wish.fulfillments.length > 0) ? (
                <div className="space-y-4">
                  {wishes
                    .filter(wish => wish.fulfillments.length > 0)
                    .slice(0, 3)
                    .map((wish) => 
                      wish.fulfillments.slice(0, 1).map((fulfillment) => (
                        <div key={fulfillment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{wish.title}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(fulfillment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">${(fulfillment.amountCents / 100).toFixed(2)}</p>
                            <Badge className={fulfillment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {fulfillment.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No fulfillments yet</p>
                  <p className="text-sm">Donations will appear here once received</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CharityDashboard() {
  return (
    <RoleGuard allowedRoles={['charity']}>
      <CharityDashboardContent />
    </RoleGuard>
  );
}

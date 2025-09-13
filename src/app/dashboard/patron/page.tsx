'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  Search,
  Filter,
  Plus
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
  charity: {
    displayName: string;
  };
}

interface PatronStats {
  totalDonated: number;
  wishesFulfilled: number;
  charitiesSupported: number;
  thisMonthDonated: number;
}

function PatronDashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [stats, setStats] = useState<PatronStats>({
    totalDonated: 0,
    wishesFulfilled: 0,
    charitiesSupported: 0,
    thisMonthDonated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatronData();
  }, []);

  const fetchPatronData = async () => {
    try {
      // Fetch patron's wishes and stats
      const [wishesResponse, statsResponse] = await Promise.all([
        fetch('/api/wishes?role=patron'),
        fetch('/api/analytics?type=patron')
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
      console.error('Error fetching patron data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || 'Patron'}! 👋
          </h1>
          <p className="text-gray-600">
            Continue making a difference with tax-deductible donations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalDonated / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                All time donations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishes Fulfilled</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.wishesFulfilled}</div>
              <p className="text-xs text-muted-foreground">
                Lives impacted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Charities Supported</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.charitiesSupported}</div>
              <p className="text-xs text-muted-foreground">
                Organizations helped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.thisMonthDonated / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Current month donations
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
                Find and support tax-deductible wishes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => router.push('/wishes')} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Browse Wishes
                </Button>
                <Button variant="outline" onClick={() => router.push('/wishes?filter=medical')} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Medical Wishes
                </Button>
                <Button variant="outline" onClick={() => router.push('/wishes?filter=education')} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Education Wishes
                </Button>
                <Button variant="outline" onClick={() => router.push('/analytics')} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Fulfillments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Fulfillments</CardTitle>
              <CardDescription>
                Your recent donations and their impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wishes.length > 0 ? (
                <div className="space-y-4">
                  {wishes.slice(0, 3).map((wish) => (
                    <div key={wish.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{wish.title}</h4>
                        <p className="text-xs text-gray-500">{wish.charity.displayName}</p>
                        <div className="flex gap-1 mt-1">
                          {wish.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">${(wish.amountCents / 100).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(wish.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No fulfillments yet</p>
                  <p className="text-sm">Start by browsing available wishes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Benefits</CardTitle>
              <CardDescription>
                Your donation receipts and tax information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-sm">Tax Deductible</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    All donations through GiftFlow are tax-deductible
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Download Tax Receipts
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Tax Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PatronDashboard() {
  return (
    <RoleGuard allowedRoles={['patron']}>
      <PatronDashboardContent />
    </RoleGuard>
  );
}

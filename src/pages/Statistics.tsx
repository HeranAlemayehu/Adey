import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Activity, Heart, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Statistics = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalKicks: 0, avgHeartbeat: 0 });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days of data
      const sevenDaysAgo = subDays(new Date(), 7);

      const { data: readings } = await supabase
        .from('device_readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', sevenDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      if (!readings || readings.length === 0) return;

      // Group by date
      const groupedByDate = readings.reduce((acc: any, reading: any) => {
        const date = format(new Date(reading.recorded_at), 'MM/dd');
        if (!acc[date]) {
          acc[date] = { date, kicks: [], heartbeats: [] };
        }
        if (reading.kick_count) acc[date].kicks.push(reading.kick_count);
        if (reading.heartbeat) acc[date].heartbeats.push(reading.heartbeat);
        return acc;
      }, {});

      const chartData = Object.values(groupedByDate).map((day: any) => ({
        date: day.date,
        kickCount: day.kicks.reduce((a: number, b: number) => a + b, 0),
        heartbeat: day.heartbeats.length > 0
          ? Math.round(day.heartbeats.reduce((a: number, b: number) => a + b, 0) / day.heartbeats.length)
          : 0,
      }));

      setChartData(chartData);

      // Calculate overall stats
      const allHeartbeats = readings.filter(r => r.heartbeat).map(r => r.heartbeat);
      const totalKicks = readings.reduce((sum, r) => sum + (r.kick_count || 0), 0);

      setStats({
        totalKicks,
        avgHeartbeat: allHeartbeats.length > 0
          ? allHeartbeats.reduce((a, b) => a + b, 0) / allHeartbeats.length
          : 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Statistics</h1>
          <p className="text-muted-foreground">Track your pregnancy journey</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5 rounded-3xl border-2 bg-gradient-to-br from-card to-accent/10 shadow-card">
            <Activity className="w-6 h-6 text-accent mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Total Kicks (7d)</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalKicks}</p>
          </Card>

          <Card className="p-5 rounded-3xl border-2 bg-gradient-to-br from-card to-secondary/10 shadow-card">
            <Heart className="w-6 h-6 text-secondary mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Avg Heartbeat</p>
            <p className="text-2xl font-bold text-foreground">{stats.avgHeartbeat.toFixed(0)} bpm</p>
          </Card>
        </div>

        {/* Charts */}
        <Card className="p-6 rounded-3xl border-2 bg-card shadow-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">7-Day Trends</h2>
          </div>

          <Tabs defaultValue="kicks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="kicks" className="rounded-xl">Kicks</TabsTrigger>
              <TabsTrigger value="heartbeat" className="rounded-xl">Heartbeat</TabsTrigger>
            </TabsList>

            <TabsContent value="kicks">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--border))',
                      borderRadius: '1rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="kickCount" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="heartbeat">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '2px solid hsl(var(--border))',
                      borderRadius: '1rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartbeat" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--secondary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default Statistics;

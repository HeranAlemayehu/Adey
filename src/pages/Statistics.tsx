import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, differenceInWeeks } from 'date-fns';
import { Activity, TrendingUp, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Statistics = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalKicks: 0, avgKicksPerWeek: 0 });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 7 days of data for weekly chart
      const sevenDaysAgo = subDays(new Date(), 7);

      const { data: weeklyReadings } = await supabase
        .from('device_readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', sevenDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      // Get all data for monthly chart
      const { data: allReadings } = await supabase
        .from('device_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true });

      if (weeklyReadings && weeklyReadings.length > 0) {
        // Group by date for 7-day chart
        const groupedByDate = weeklyReadings.reduce((acc: any, reading: any) => {
          const date = format(new Date(reading.recorded_at), 'MM/dd');
          if (!acc[date]) {
            acc[date] = { date, kicks: [] };
          }
          if (reading.kick_count) acc[date].kicks.push(reading.kick_count);
          return acc;
        }, {});

        const chartData = Object.values(groupedByDate).map((day: any) => ({
          date: day.date,
          kickCount: day.kicks.reduce((a: number, b: number) => a + b, 0),
        }));

        setChartData(chartData);

        // Calculate overall stats
        const totalKicks = weeklyReadings.reduce((sum, r) => sum + (r.kick_count || 0), 0);
        
        // Calculate average kicks per week
        const oldestReading = weeklyReadings[0];
        const weeksInRange = oldestReading 
          ? Math.max(1, differenceInWeeks(new Date(), new Date(oldestReading.recorded_at)))
          : 1;
        const avgKicksPerWeek = totalKicks / weeksInRange;

        setStats({
          totalKicks,
          avgKicksPerWeek,
        });
      }

      if (allReadings && allReadings.length > 0) {
        // Group by month for monthly chart
        const groupedByMonth = allReadings.reduce((acc: any, reading: any) => {
          const month = format(new Date(reading.recorded_at), 'MMM yyyy');
          if (!acc[month]) {
            acc[month] = { month, kicks: [] };
          }
          if (reading.kick_count) acc[month].kicks.push(reading.kick_count);
          return acc;
        }, {});

        const monthlyData = Object.values(groupedByMonth).map((month: any) => ({
          month: month.month,
          kickCount: month.kicks.reduce((a: number, b: number) => a + b, 0),
        }));

        setMonthlyChartData(monthlyData);
      }
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

          <Card className="p-5 rounded-3xl border-2 bg-gradient-to-br from-card to-primary/10 shadow-card">
            <Calendar className="w-6 h-6 text-primary mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Avg Per Week</p>
            <p className="text-2xl font-bold text-foreground">{stats.avgKicksPerWeek.toFixed(0)}</p>
          </Card>
        </div>

        {/* Charts */}
        <Card className="p-6 rounded-3xl border-2 bg-card shadow-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">7-Day Trends</h2>
          </div>

          <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="weekly" className="rounded-xl">7-Day Trend</TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-xl">Monthly Trend</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
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

            <TabsContent value="monthly">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
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
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))' }}
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

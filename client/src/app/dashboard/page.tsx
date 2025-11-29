'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Star
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { authManager } from '@/lib/auth';
import { api, User } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

type RatingItem = { stars: number; calls: number };

type EndCallReason = { reason: string; calls: number };

type AnalyticsItem = { name: string; calls: number };

type SentimentItem = { name: string; value: number; color: string };

type PieChartEntry = {
  name: string;
  value?: number;
  color?: string;
};

type PieChartProps = {
  data: PieChartEntry[];
  title: string;
  valueKey?: string;
  showCenter?: boolean;
  centerValue?: string | number;
};

type CallVolumeItem = {
  date: string;
  inbound: number;
  outbound: number;
};

type CallerTypes = {
  total: number;
  repeat: number;
  unique: number;
};

/* -------------------------------------------------------------------------- */
/*                                   DATA                                      */
/* -------------------------------------------------------------------------- */

const mockData: {
  phoneNumbers: AnalyticsItem[];
  aiAgents: (AnalyticsItem & { icon: string })[];
  widgets: AnalyticsItem[];
  ratings: RatingItem[];
  endCallReasons: EndCallReason[];
  actions: AnalyticsItem[];
  sentiments: SentimentItem[];
  callStatus: SentimentItem[];
  taskStatus: SentimentItem[];
  callsVolume: CallVolumeItem[];
  callerTypes: CallerTypes;
} = {
  phoneNumbers: [
    { name: 'Customer Support', calls: 451 },
    { name: 'Sales', calls: 400 },
    { name: 'Marketing', calls: 89 },
    { name: 'Legal', calls: 23 },
    { name: "Founder's Office", calls: 10 }
  ],
  aiAgents: [
    { name: 'Restaurant AI', calls: 544, icon: '🍽️' },
    { name: 'Real Estate AI', calls: 321, icon: '🏠' },
    { name: 'Dental AI', calls: 240, icon: '🦷' },
    { name: 'Business Coach AI', calls: 87, icon: '💼' }
  ],
  widgets: [
    { name: 'Main Website', calls: 432 },
    { name: 'New Landing Page', calls: 66 },
    { name: 'Offer LTD', calls: 23 },
    { name: 'Support', calls: 5 }
  ],
  ratings: [
    { stars: 5, calls: 0 },
    { stars: 4, calls: 0 },
    { stars: 3, calls: 0 },
    { stars: 2, calls: 0 },
    { stars: 1, calls: 0 },
    { stars: 0, calls: 0 }
  ],
  endCallReasons: [
    { reason: 'Call ended by the caller.', calls: 4 },
    { reason: 'AI Agent transferred call to', calls: 1 },
    { reason: 'Call ended by the AI Agent.', calls: 3 },
    { reason: 'Call not Connected.', calls: 3 }
  ],
  actions: [
    { name: 'Send Sms', calls: 2 },
    { name: 'Send Webhook', calls: 3 },
    { name: 'Send Email', calls: 2 },
    { name: 'Transfer Call', calls: 2 },
    { name: 'End Call', calls: 3 }
  ],
  sentiments: [
    { name: 'Positive', value: 70, color: '#10B981' },
    { name: 'Neutral', value: 20, color: '#6B7280' },
    { name: 'Negative', value: 10, color: '#EF4444' }
  ],
  callStatus: [
    { name: 'Connected', value: 85, color: '#10B981' },
    { name: 'Not connected', value: 15, color: '#EF4444' }
  ],
  taskStatus: [
    { name: 'Complete', value: 60, color: '#10B981' },
    { name: 'Partial', value: 25, color: '#F59E0B' },
    { name: 'Incomplete', value: 15, color: '#EF4444' }
  ],
  callsVolume: [
    { date: 'Feb 1', inbound: 120, outbound: 80 },
    { date: 'Feb 2', inbound: 150, outbound: 100 },
    { date: 'Feb 3', inbound: 90, outbound: 70 },
    { date: 'Feb 4', inbound: 180, outbound: 120 },
    { date: 'Feb 5', inbound: 200, outbound: 140 },
    { date: 'Feb 6', inbound: 220, outbound: 160 }
  ],
  callerTypes: {
    total: 38,
    repeat: 10,
    unique: 28
  }
};

const COLORS = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0'];

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function DashboardOverview() {
  const [user, setUser] = useState<User | null>(null);
  const [timeFilter, setTimeFilter] = useState('Last 7 days');

  useEffect(() => {
    const fetchUser = async () => {
      const token = authManager.getToken();

      if (!token) return setUser(null);

      try {
        const response = await api.getProfile(token);
        if (response.success && response.data) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  /* ---------------------------- RENDER STARS UI ---------------------------- */
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-green-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  /* ---------------------------- CUSTOM PIE CHART --------------------------- */
  const CustomPieChart = ({
    data,
    title,
    valueKey = 'value',
    showCenter = false,
    centerValue = ''
  }: PieChartProps) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={showCenter ? 60 : 0}
              outerRadius={80}
              paddingAngle={2}
              dataKey={valueKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {showCenter && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {centerValue}
              </div>
              <div className="text-sm text-gray-600">Total calls</div>
            </div>
          </div>
        )}
      </div>

      {/* Legends */}
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: entry.color || COLORS[index % COLORS.length]
                }}
              />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {entry[valueKey as keyof PieChartEntry]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="space-y-6">

        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-600">Welcome </span>
            {user?.firstName ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-400">
                {user.firstName}!
              </span>
            ) : (
              <span className="text-gray-600">User</span>
            )}
          </h1>
          <p className="text-gray-700">Here's your dashboard overview and analytics</p>
        </div>

        {/* Analytics Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-700">Analytics</h2>

            <select
              className="bg-white border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 shadow-sm"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>

          {/* Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Total calls', 'Average Talk Time', 'Usage', 'Average usage'].map(
              (title, i) => (
                <Card key={i} className="bg-white shadow-lg">
                  <CardContent className="p-6">
                    <p className="text-black text-xl font-medium">{title}</p>
                    <div className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                      {i === 0 ? '53' : i === 1 ? '3.02 min' : i === 2 ? '112 min' : '4 min'}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Calls Volume Chart */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800">Calls Success</h3>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockData.callsVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="inbound" stroke="#00ff55ff" fill="#7700ffb0" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="outbound" stroke="#6B7280" fill="#6B7280" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Caller Types */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800">Caller Types</h3>

                <div className="relative">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Total', value: mockData.callerTypes.total, color: '#7700ffff' },
                          { name: 'Repeat', value: mockData.callerTypes.repeat, color: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell fill="#7700ffff" />
                        <Cell fill="#6B7280" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{mockData.callerTypes.total}</div>
                      <div className="text-sm text-gray-600">Overall</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 text-center mt-4">
                  <div>
                    <div className="text-xl font-bold">{mockData.callerTypes.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-600">{mockData.callerTypes.repeat}</div>
                    <div className="text-sm text-gray-600">Web Call</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{mockData.callerTypes.unique}</div>
                    <div className="text-sm text-gray-600">Phone Call</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
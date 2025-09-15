// 'use client';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { 
//   User, 
//   Zap,
//   ChevronRight,
//   TrendingUp
// } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { authManager } from '@/lib/auth';
// import { User as UserType } from '@/lib/api';

// export default function DashboardOverview() {
//   const [user, setUser] = useState<UserType | null>(null);

//   useEffect(() => {
//     const authState = authManager.getAuthState();
//     setUser(authState.user);
//   }, []);

//   return (
//     <div className="p-6">
//       <div className="space-y-6">
//         {/* Welcome Header */}  
//         <div className="space-y-2">
//           <h1 className="text-3xl font-bold text-gray-900">Welcome {user?.firstName}</h1>
//         </div>

//         {/* Assistant Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <Card className="bg-white/80 border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer group shadow-lg">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
//                     <User className="w-6 h-6 text-white" />
//                   </div>  
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900">Single-prompt Assistant</h3>
//                     <p className="text-gray-600 text-sm">Most useful for freeform conversations</p>
//                   </div>
//                 </div>
//                 <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="bg-white/80 border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer group shadow-lg">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
//                     <Zap className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900">Multi-prompt Workflow</h3>
//                     <p className="text-gray-600 text-sm">Fitting for structured complex conversation flows</p>
//                     <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-full mt-1">New</span>
//                   </div>
//                 </div>
//                 <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Metrics Section */}
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-semibold text-gray-900">Metrics</h2>
//             <div className="flex items-center space-x-4">
//               <select className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm">
//                 <option>All Assistants</option>
//               </select>
//               <select className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm">
//                 <option>Last Month</option>
//               </select>
//             </div>
//           </div>

//           {/* Metrics Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//               <CardContent className="p-6">
//                 <div className="space-y-2">
//                   <p className="text-gray-600 text-sm">Number of Calls</p>
//                   <div className="flex items-baseline space-x-2">
//                     <span className="text-3xl font-bold text-gray-900">2</span>
//                     <span className="text-green-600 text-sm flex items-center">
//                       <TrendingUp className="w-3 h-3 mr-1" />
//                       +100.0%
//                     </span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//               <CardContent className="p-6">
//                 <div className="space-y-2">
//                   <p className="text-gray-600 text-sm">Avg Duration</p>
//                   <div className="flex items-baseline space-x-2">
//                     <span className="text-3xl font-bold text-gray-900">0:00</span>
//                     <span className="text-gray-500 text-sm">— 0.0%</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//               <CardContent className="p-6">
//                 <div className="space-y-2">
//                   <p className="text-gray-600 text-sm">Total Cost</p>
//                   <div className="flex items-baseline space-x-2">
//                     <span className="text-3xl font-bold text-gray-900">0</span>
//                     <span className="text-gray-600 text-sm">credits</span>
//                     <span className="text-gray-500 text-sm">— 0.0%</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//               <CardContent className="p-6">
//                 <div className="space-y-2">
//                   <p className="text-gray-600 text-sm">Avg Cost</p>
//                   <div className="flex items-baseline space-x-2">
//                     <span className="text-3xl font-bold text-gray-900">0</span>
//                     <span className="text-gray-600 text-sm">¢/call</span>
//                     <span className="text-gray-500 text-sm">— 0.0%</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Call Success */}
//           <Card className="bg-white/80 border-gray-200/50 shadow-lg">
//             <CardContent className="p-6">
//               <div className="space-y-4">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">Call Success</h3>
//                   <div className="flex items-baseline space-x-2 mt-2">
//                     <span className="text-4xl font-bold text-gray-900">100%</span>
//                     <span className="text-green-600 text-sm">+100.0% Compared to previous period</span>
//                   </div>
//                 </div>
                
//                 {/* Placeholder for chart */}
//                 <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
//                   <p className="text-gray-500">Chart visualization would go here</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }






'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Zap,
  ChevronRight,
  TrendingUp,
  Phone,
  MessageSquare,
  Mail,
  PhoneCall,
  Star,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { authManager } from '@/lib/auth';
import { User as UserType } from '@/lib/api';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock data - replace with real API calls later
const mockData = {
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

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function DashboardOverview() {
  const [user, setUser] = useState<UserType | null>(null);
  const [timeFilter, setTimeFilter] = useState('Last 7 days');
  const [assistantFilter, setAssistantFilter] = useState('All Assistants');

  useEffect(() => {
    const authState = authManager.getAuthState();
    setUser(authState.user);
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const CustomPieChart = ({ data, title, valueKey = 'value', showCenter = false, centerValue = '' }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {showCenter && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{centerValue}</div>
              <div className="text-sm text-gray-600">Total calls</div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{entry[valueKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome {user?.firstName || 'User'}</h1>
          <p className="text-gray-600">Here's your dashboard overview and analytics</p>
        </div>

        
        {/* Analytics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <div className="flex items-center space-x-4">

              <select 
                className="bg-white border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2 shadow-sm"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Total calls</p>
                  <div className="text-3xl font-bold text-gray-900">53</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Average Talk Time</p>
                  <div className="text-3xl font-bold text-gray-900">3.02 min</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Usage</p>
                  <div className="text-3xl font-bold text-gray-900">112 min</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Average usage</p>
                  <div className="text-3xl font-bold text-gray-900">4 min</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* First Row - Calls Volume and Caller Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calls Volume */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Calls Success</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Inbound</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span>Outbound</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockData.callsVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="inbound"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="outbound"
                        stackId="1"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Caller Types */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Caller types</h3>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Total', value: mockData.callerTypes.total, color: '#3B82F6' },
                            { name: 'Repeat', value: mockData.callerTypes.repeat, color: '#8B5CF6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#8B5CF6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">38 </div>
                        <div className="text-sm text-gray-600">Overall</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-gray-900">{mockData.callerTypes.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">{mockData.callerTypes.repeat}</div>
                      <div className="text-sm text-gray-600">Web Call</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{mockData.callerTypes.unique}</div>
                      <div className="text-sm text-gray-600">phone call</div>
                    </div>
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
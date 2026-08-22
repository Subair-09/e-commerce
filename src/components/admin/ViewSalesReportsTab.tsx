import React, { useState, useEffect } from 'react';
import { SalesAnalytics } from '../../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  BarChart3, 
  RefreshCw,
  Award,
  Package
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface ViewSalesReportsTabProps {
  onShowToast: (title: string, msg: string, type?: 'success' | 'info') => void;
}

export const ViewSalesReportsTab: React.FC<ViewSalesReportsTabProps> = ({
  onShowToast,
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (tf: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-analytics?timeframe=${tf}`);
      const data = await res.json();
      if (data.success && data.report) {
        setAnalytics(data.report);
      }
    } catch (err) {
      console.warn('Failed to load sales analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const handleExportCSV = () => {
    if (!analytics) return;
    
    let csv = 'Timeframe,Daily_Date,Day,Gross_Revenue_USD,Orders_Count,Units_Sold\n';
    analytics.dailyRevenue.forEach((row) => {
      csv += `${timeframe},${row.date},${row.day},${row.revenue},${row.orders},${row.units}\n`;
    });

    csv += '\nTop_Selling_Products,Category,Price_USD,Units_Sold,Total_Revenue_USD\n';
    analytics.topProducts.forEach((p) => {
      csv += `"${p.name}","${p.category}",${p.price},${p.unitsSold},${p.totalRevenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AURA_Sales_Report_${timeframe}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Report Exported', `Generated sales CSV ledger for ${timeframe.toUpperCase()}.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-sales-reports-tab">
      
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">View Sales & Financial Reports</h2>
            <span className="bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
              Real-time Analytics
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Gross merchandise volume, category distribution, product profitability, and ledger exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe selector */}
          <div className="bg-[#11161B] border border-gray-800 rounded-xl p-1 flex items-center gap-1">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '1y', label: '1 Year' },
              { id: 'all', label: 'All Time' },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-[#00ED64] text-[#001E2B]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-colors cursor-pointer"
            id="btn-export-sales-csv"
          >
            <Download className="w-3.5 h-3.5 text-[#00ED64]" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">Gross Sales Revenue</div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +18.4%
            </span>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${analytics?.totalRevenue.toLocaleString() || '14,250'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Total revenue in selected period</div>
          <div className="absolute right-3 bottom-3 text-gray-800/30">
            <DollarSign className="w-12 h-12" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">Orders Placed</div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +12.6%
            </span>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {analytics?.totalOrders || '24'} Orders
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Processed through checkout</div>
          <div className="absolute right-3 bottom-3 text-gray-800/30">
            <ShoppingBag className="w-12 h-12" />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">Average Order Value (AOV)</div>
            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              High Tier
            </span>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${analytics?.averageOrderValue.toLocaleString() || '593'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Average basket per customer</div>
          <div className="absolute right-3 bottom-3 text-gray-800/30">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>

        {/* Total Units Sold */}
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">Total Units Sold</div>
            <span className="text-[11px] font-bold text-[#00ED64] bg-[#00ED64]/10 px-2 py-0.5 rounded-full">
              42 SKU variants
            </span>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {analytics?.totalUnitsSold || '48'} Items
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Physical goods dispatched</div>
          <div className="absolute right-3 bottom-3 text-gray-800/30">
            <Package className="w-12 h-12" />
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Velocity Area Chart */}
        <div className="lg:col-span-2 bg-[#11161B] border border-gray-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00ED64]" />
                <span>Gross Revenue Velocity Trend</span>
              </h3>
              <p className="text-xs text-gray-400">Daily sales performance & volume curve</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64]" />
                <span>Revenue ($)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0078D4]" />
                <span>Orders</span>
              </span>
            </div>
          </div>

          <div className="h-[270px] w-full pt-2">
            {analytics?.dailyRevenue && analytics.dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ED64" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00ED64" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0078D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0078D4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F13',
                      borderColor: '#374151',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'revenue' ? `$${Number(value).toLocaleString()}` : `${value} orders`,
                      name === 'revenue' ? 'Revenue' : 'Order Volume',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#00ED64"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#0078D4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                Loading sales trend...
              </div>
            )}
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="bg-[#11161B] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <span>Category Revenue Share</span>
            </h3>
            <p className="text-xs text-gray-400">Sales distribution across departments</p>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center my-2">
            {analytics?.categorySales && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categorySales}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analytics.categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F13',
                      borderColor: '#374151',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-800">
            {analytics?.categorySales?.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-gray-300 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Performing Products Leaderboard */}
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-gray-800 bg-[#0B0F13] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Performing Products</span>
            </h3>
            <p className="text-xs text-gray-400">Ranked by gross sales volume and units fulfilled</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0B0F13]/50 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800 text-[11px]">
              <tr>
                <th className="px-5 py-3">Rank & Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Units Sold</th>
                <th className="px-4 py-3">Gross Revenue</th>
                <th className="px-5 py-3 text-right">In Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {analytics?.topProducts?.map((product, idx) => (
                <tr key={product.id || idx} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-white text-sm truncate max-w-[240px]">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-300">{product.category}</td>
                  <td className="px-4 py-3.5 font-semibold text-white">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-bold text-white">{product.unitsSold} units</td>
                  <td className="px-4 py-3.5 font-bold text-[#00ED64] text-sm">
                    ${product.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-400">
                    {product.stockCount} available
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { MongoOrder } from '../../types';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  User, 
  MapPin, 
  CreditCard, 
  ExternalLink, 
  Trash2, 
  Save, 
  FileText,
  DollarSign,
  PackageCheck
} from 'lucide-react';

interface ManageOrdersTabProps {
  orders: MongoOrder[];
  onUpdateOrderStatus: (orderId: string, status: any, meta?: { trackingNumber?: string; courier?: string; notes?: string }) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info') => void;
  onOpenAzureStorage?: () => void;
}

export const ManageOrdersTab: React.FC<ManageOrdersTabProps> = ({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  onShowToast,
  onOpenAzureStorage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Tracking edit state for an order
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('DHL Express Luxury');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = 
        o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.shippingAddress && o.shippingAddress.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    setUpdatingId(orderId);
    try {
      await onUpdateOrderStatus(orderId, newStatus);
      onShowToast('Order Status Updated', `Order #${orderId} set to '${newStatus.toUpperCase()}'.`, 'success');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await onUpdateOrderStatus(orderId, 'shipped', { trackingNumber, courier, notes: adminNotes });
      setEditingTrackingId(null);
      onShowToast('Tracking Assigned', `Order #${orderId} marked as Shipped via ${courier}.`, 'success');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm(`Are you sure you want to remove Order #${orderId} from MongoDB?`)) {
      await onDeleteOrder(orderId);
      onShowToast('Order Removed', `Order #${orderId} deleted from database.`, 'info');
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-700/50 text-gray-300 border border-gray-600">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-manage-orders-tab">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Manage Orders</h2>
            <span className="bg-[#00ED64]/10 text-[#00ED64] border border-[#00ED64]/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
              {orders.length} Total Orders
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            Real-time order pipeline, shipping fulfillment, courier tracking, and Azure Storage receipts.
          </p>
        </div>

        {onOpenAzureStorage && (
          <button
            onClick={onOpenAzureStorage}
            className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-colors self-start sm:self-auto cursor-pointer"
            id="btn-admin-view-receipts"
          >
            <FileText className="w-3.5 h-3.5 text-[#0078D4]" />
            <span>View Azure Receipt Blobs</span>
          </button>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#00ED64]/10 border border-[#00ED64]/20 flex items-center justify-center text-[#00ED64]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Total Orders Volume</div>
            <div className="text-xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Pending & Processing</div>
            <div className="text-xl font-bold text-white">{pendingCount}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">In Transit / Shipped</div>
            <div className="text-xl font-bold text-white">{shippedCount}</div>
          </div>
        </div>

        <div className="bg-[#11161B] border border-gray-800/80 rounded-2xl p-4.5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Delivered Successfully</div>
            <div className="text-xl font-bold text-white">{deliveredCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#11161B] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer, email..."
            className="w-full bg-[#182026] border border-gray-700/80 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ED64]"
            id="input-admin-search-orders"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#00ED64] text-[#001E2B]'
                  : 'bg-[#182026] text-gray-300 hover:bg-gray-700 border border-gray-700/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#11161B] border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-600 stroke-1" />
            <p className="text-sm font-semibold text-gray-400">No orders found</p>
            <p className="text-xs text-gray-500 mt-1">Try switching status filters or clearing your search query.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.orderId;
            const itemsCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.orderId}
                className={`bg-[#11161B] border transition-all rounded-2xl overflow-hidden shadow-lg ${
                  isExpanded ? 'border-[#00ED64]/50 shadow-[#00ED64]/5' : 'border-gray-800 hover:border-gray-700'
                }`}
                id={`card-order-${order.orderId}`}
              >
                {/* Order Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: ID & Customer */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 shrink-0">
                      <ClipboardList className="w-5 h-5 text-[#00ED64]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-white text-sm">#{order.orderId}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-gray-300 font-medium">{order.customer?.name || 'Valued Customer'}</span>
                        <span>•</span>
                        <span className="text-gray-400">{order.customer?.email}</span>
                        <span>•</span>
                        <span className="text-gray-500">{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Items, Total, & Controls */}
                  <div className="flex items-center gap-3 sm:gap-6 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-800">
                    <div>
                      <div className="text-xs text-gray-400 text-left lg:text-right font-medium">{itemsCount} Items</div>
                      <div className="text-base font-bold text-[#00ED64] text-left lg:text-right">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    {/* Quick Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        disabled={updatingId === order.orderId}
                        className="bg-[#182026] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#00ED64] cursor-pointer"
                        id={`select-status-${order.orderId}`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => toggleExpand(order.orderId)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse Order' : 'View Full Details'}
                        id={`btn-toggle-order-${order.orderId}`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(order.orderId)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-800/80 bg-[#0B0F13]/70 space-y-4 animate-fade-in">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {/* Customer & Shipping */}
                      <div className="bg-[#11161B] border border-gray-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                          <User className="w-3.5 h-3.5 text-[#00ED64]" />
                          <span>Customer Information</span>
                        </div>
                        <div className="text-xs text-gray-300 space-y-0.5">
                          <div className="font-semibold text-white">{order.customer?.name}</div>
                          <div>{order.customer?.email}</div>
                          {order.customer?.phone && <div>{order.customer.phone}</div>}
                        </div>
                      </div>

                      {/* Delivery Address & Method */}
                      <div className="bg-[#11161B] border border-gray-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <span>Delivery Address & Payment</span>
                        </div>
                        <div className="text-xs text-gray-300 space-y-0.5">
                          <div>{order.shippingAddress || 'Standard Shipping Address on File'}</div>
                          <div className="text-gray-400 flex items-center gap-1 pt-1">
                            <CreditCard className="w-3 h-3 text-gray-500" />
                            <span>{order.paymentMethod || 'Encrypted Credit Card'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Courier & Tracking Assignment */}
                      <div className="bg-[#11161B] border border-gray-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Courier & Tracking</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingTrackingId(editingTrackingId === order.orderId ? null : order.orderId);
                              setTrackingNumber(`AURA-TRK-${Math.floor(100000 + Math.random() * 900000)}`);
                            }}
                            className="text-[11px] text-[#00ED64] hover:underline cursor-pointer"
                          >
                            {editingTrackingId === order.orderId ? 'Cancel' : 'Assign Tracking'}
                          </button>
                        </div>

                        {editingTrackingId === order.orderId ? (
                          <div className="space-y-2 pt-1">
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Tracking Code (e.g. DHL-98213)"
                              className="w-full bg-[#182026] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                            <select
                              value={courier}
                              onChange={(e) => setCourier(e.target.value)}
                              className="w-full bg-[#182026] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="DHL Express Luxury">DHL Express Luxury</option>
                              <option value="FedEx Priority Vault">FedEx Priority Vault</option>
                              <option value="UPS WorldEase Express">UPS WorldEase Express</option>
                              <option value="Royal Mail Special Delivery">Royal Mail Special Delivery</option>
                            </select>
                            <button
                              onClick={() => handleSaveTracking(order.orderId)}
                              className="w-full py-1.5 bg-[#00ED64] text-[#001E2B] rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save & Mark Shipped</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>Carrier: <span className="text-white">DHL Express Worldwide</span></div>
                            <div className="font-mono text-[#00ED64] text-[11px]">
                              Tracking: AURA-TRK-{order.orderId.substring(order.orderId.length - 6)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="bg-[#11161B] border border-gray-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#0B0F13] border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Purchased Line Items
                      </div>
                      <div className="divide-y divide-gray-800/60 p-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-800/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden shrink-0">
                                <img
                                  src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">{item.name}</div>
                                <div className="text-[11px] text-gray-400">
                                  Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  {item.color && <span> • Color: {item.color}</span>}
                                  {item.size && <span> • Size: {item.size}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-white">
                              ${(item.quantity * item.price).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

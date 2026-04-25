'use client';

import { useState, useEffect } from 'react';
import { Wallet, Users, TrendingUp, Plus, RefreshCw, IndianRupee, Zap, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { authManager } from '@/lib/auth';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    credits?: number;
    balance?: number;
    role?: 'admin' | 'user';
    adminId?: string;
    costPerMinute?: number;
    isVerified: boolean;
}

interface CreateSubUserForm {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    amount: number;
    costPerMinute: number;
}

export default function AdminDashboard() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [balance, setBalance] = useState(0);
    const [credits, setCredits] = useState(0);
    const [subUsers, setSubUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [adjustFormData, setAdjustFormData] = useState({
        amount: 100,
        action: 'add' as 'add' | 'deduct',
        description: '',
    });

    const [formData, setFormData] = useState<CreateSubUserForm>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        amount: 500,
        costPerMinute: 5.0,
    });

    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        costPerMinute: 5.0,
        password: '',
    });

    const calculatedCredits = Math.floor(formData.amount / (formData.costPerMinute || 1));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const token = authManager.getToken();

            if (!token) return;

            // Fetch current user profile
            const profileResponse = await api.getProfile(token);
            console.log('👤 Profile response:', profileResponse);

            if (profileResponse.success && profileResponse.data?.user) {
                const userData = profileResponse.data.user;
                console.log('🆔 User data for dashboard:', userData);

                setCurrentUser(userData);
                setBalance(userData.balance || 0);
                setCredits(userData.credits || 0);

                // Only fetch sub-users if user is admin
                if (userData.role === 'admin') {
                    console.log('🛡️ Admin role detected, fetching sub-users...');
                    try {
                        const subUsersResponse = await api.getSubUsers(token);
                        console.log('👥 Sub-users response:', subUsersResponse);
                        if (subUsersResponse.success && subUsersResponse.data) {
                            setSubUsers(subUsersResponse.data);
                        }
                    } catch (err) {
                        console.error('Error fetching sub-users:', err);
                    }
                } else {
                    console.warn('⚠️ Non-admin role detected:', userData.role);
                }
            }
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncHub = async () => {
        try {
            setIsSyncing(true);
            setError(null);

            await fetchData(); // Refresh all data
            setSuccessMessage('Successfully synced with Hub');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error('Error syncing with Hub:', err);
            setError(err.message || 'Failed to sync with Hub');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateSubUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.amount > balance) {
            setError(`Insufficient balance. You have ₹${balance.toLocaleString('en-IN')} available.`);
            return;
        }

        try {
            setIsCreating(true);
            setError(null);
            const token = authManager.getToken();

            if (!token) return;

            const response = await api.createSubUser(token, {
                ...formData,
            });

            if (response.success) {
                setSuccessMessage('Sub-user created successfully!');
                setShowCreateModal(false);
                setFormData({ firstName: '', lastName: '', email: '', password: '', amount: 500, costPerMinute: 5.0 });
                await fetchData();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err: any) {
            console.error('Error creating sub-user:', err);
            setError(err.message || 'Failed to create sub-user');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAdjustCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setIsAdjusting(true);
            setError(null);
            const token = authManager.getToken();
            if (!token) return;

            const response = await api.adjustSubUserCredits(token, selectedUser.id, adjustFormData);

            if (response.success) {
                setSuccessMessage(`Credits ${adjustFormData.action === 'add' ? 'added to' : 'deducted from'} ${selectedUser.firstName} successfully!`);
                setShowAdjustModal(false);
                setAdjustFormData({ amount: 100, action: 'add', description: '' });
                await fetchData();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err: any) {
            console.error('Error adjusting credits:', err);
            setError(err.message || 'Failed to adjust credits');
        } finally {
            setIsAdjusting(false);
        }
    };

    const handleUpdateSubUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setIsUpdating(true);
            setError(null);
            const token = authManager.getToken();
            if (!token) return;

            const updateData: any = {
                firstName: editFormData.firstName,
                lastName: editFormData.lastName,
                costPerMinute: editFormData.costPerMinute
            };

            if (editFormData.password && editFormData.password.trim() !== '') {
                updateData.password = editFormData.password;
            }

            const response = await api.updateSubUser(token, selectedUser.id, updateData);

            if (response.success) {
                setSuccessMessage(`Updated ${selectedUser.firstName} successfully!`);
                setShowEditModal(false);
                await fetchData();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err: any) {
            console.error('Error updating sub-user:', err);
            setError(err.message || 'Failed to update sub-user');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteSubUser = async () => {
        if (!selectedUser) return;
        try {
            setIsDeleting(true);
            setError(null);
            const token = authManager.getToken();
            if (!token) return;

            const response = await api.deleteSubUser(token, selectedUser.id);
            if (response.success) {
                setSuccessMessage(`${selectedUser.firstName} deleted successfully.`);
                setShowDeleteConfirm(false);
                setSelectedUser(null);
                await fetchData();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err: any) {
            console.error('Error deleting sub-user:', err);
            setError(err.message || 'Failed to delete sub-user');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 font-medium">Manage your balance, credits, and sub-users</p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center shadow-sm">
                    <CheckCircle className="w-5 h-5 text-teal-600 mr-3" />
                    <span className="text-sm text-teal-700 font-medium">{successMessage}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="text-sm text-red-700">{error}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Total Balance</h3>
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-teal-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">₹{balance.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-teal-600 mt-2 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Synced from Hub
                    </p>
                </div>

                {/* Credits Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Available Credits</h3>
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-teal-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{credits.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 mt-2">Usage minutes</p>
                </div>

                {/* Sub-Users Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Sub-Users</h3>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{subUsers.length}</p>
                    <p className="text-xs text-gray-500 mt-2">Active accounts</p>
                </div>
            </div>

            {/* Sub-Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Sub-Users</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage provisioned sub-user accounts</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSyncHub}
                            disabled={isSyncing}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Hub'}
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create Sub-User
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Identity</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost/Min</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Credits</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <Users className="w-12 h-12 mb-3 text-gray-300" />
                                            <p className="text-sm font-medium">No sub-users yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Create your first sub-user to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                subUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-semibold text-sm">
                                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                                    {user.isVerified && (
                                                        <span className="text-xs text-blue-600">VERIFIED</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{Number(user.costPerMinute || 5.00).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-teal-600">{(user.credits ?? 0).toLocaleString('en-IN')}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium text-teal-700 bg-teal-100 rounded-full">Active</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowAdjustModal(true);
                                                    setAdjustFormData({ amount: 100, action: 'add', description: '' });
                                                }}
                                                className="text-teal-600 hover:text-teal-700 font-medium mr-4"
                                            >
                                                Adjust Credits
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setEditFormData({
                                                        firstName: user.firstName,
                                                        lastName: user.lastName,
                                                        costPerMinute: user.costPerMinute || 5.0,
                                                        password: '',
                                                    });
                                                    setShowEditModal(true);
                                                }}
                                                className="text-gray-600 hover:text-gray-700 font-medium mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Sub-User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create Sub-User</h3>
                        <p className="text-sm text-gray-600 mb-6">Provision a new sub-user account. Credits will be deducted from your Hub balance.</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSubUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    placeholder="John"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    placeholder="Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost / Minute (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.1"
                                        min="0.1"
                                        value={formData.costPerMinute}
                                        onChange={(e) => setFormData({ ...formData, costPerMinute: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Initial Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={balance}
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-teal-700 font-semibold uppercase tracking-wider">Calculated Credits</p>
                                    <p className="text-2xl font-black text-teal-600">{calculatedCredits} <span className="text-sm font-medium">Minutes</span></p>
                                </div>
                                <Zap className="text-teal-500 w-8 h-8 opacity-20" />
                            </div>

                            <p className="text-xs text-gray-500 mt-1">Available balance: ₹{balance.toLocaleString('en-IN')}</p>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setError(null);
                                    }}
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Sub-User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Sub-User</h3>
                        <p className="text-sm text-gray-600 mb-6 font-medium">{selectedUser.email}</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateSubUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">First Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.firstName}
                                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.lastName}
                                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Cost / Minute (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.1"
                                    min="0.1"
                                    value={editFormData.costPerMinute}
                                    onChange={(e) => setEditFormData({ ...editFormData, costPerMinute: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">New Password (optional)</label>
                                <input
                                    type="password"
                                    minLength={6}
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setError(null);
                                    }}
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg transition-all font-bold shadow-sm disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Credits Modal */}
            {showAdjustModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Adjust Credits</h3>
                        <p className="text-sm text-gray-600 mb-6 font-medium">
                            {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                        </p>

                        <form onSubmit={handleAdjustCredits} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Action</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustFormData({ ...adjustFormData, action: 'add' })}
                                        className={`py-2 px-4 rounded-lg font-bold border-2 transition-all ${adjustFormData.action === 'add'
                                            ? 'bg-teal-50 border-teal-600 text-teal-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        Add Funds
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustFormData({ ...adjustFormData, action: 'deduct' })}
                                        className={`py-2 px-4 rounded-lg font-bold border-2 transition-all ${adjustFormData.action === 'deduct'
                                            ? 'bg-red-50 border-red-600 text-red-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        Deduct Units
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                                {adjustFormData.action === 'add' ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top-up Amount</span>
                                            <div className="flex items-center text-teal-600 font-black">
                                                <IndianRupee className="w-4 h-4 mr-0.5" />
                                                <span className="text-lg">{adjustFormData.amount}</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max={Math.min(balance, 50000)}
                                            step="100"
                                            value={adjustFormData.amount}
                                            onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                        />
                                        <div className="flex justify-between text-[10px] font-black text-gray-400">
                                            <span>MIN ₹100</span>
                                            <span>MAX ₹{balance.toLocaleString()}</span>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Credits to Add</span>
                                            <div className="flex items-center text-teal-600 font-black">
                                                <Zap className="w-4 h-4 mr-1 opacity-50" />
                                                <span className="text-lg">{Math.floor(adjustFormData.amount / (selectedUser.costPerMinute || 5.00))} Units</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Units to Deduct</span>
                                            <div className="flex items-center text-red-600 font-black">
                                                <Zap className="w-4 h-4 mr-1 opacity-50" />
                                                <span className="text-lg">{adjustFormData.amount} Units</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max={selectedUser.credits || 1}
                                            step="1"
                                            value={adjustFormData.amount}
                                            onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                        />
                                        <div className="flex justify-between text-[10px] font-black text-gray-400">
                                            <span>MIN 1 UNIT</span>
                                            <span>MAX {(selectedUser.credits || 0).toLocaleString()} UNITS</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Manual Input</label>
                                <div className="relative">
                                    {adjustFormData.action === 'add' && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>}
                                    <input
                                        type="number"
                                        required
                                        min={adjustFormData.action === 'add' ? 1 : 1}
                                        max={adjustFormData.action === 'add' ? balance : selectedUser.credits}
                                        value={adjustFormData.amount}
                                        onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: Number(e.target.value) })}
                                        className={`w-full px-4 py-2 ${adjustFormData.action === 'add' ? 'pl-7' : ''} border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-black`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">Internal Note</label>
                                <input
                                    type="text"
                                    value={adjustFormData.description}
                                    onChange={(e) => setAdjustFormData({ ...adjustFormData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                    placeholder="e.g. Bonus for performance"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdjustModal(false);
                                        setSelectedUser(null);
                                    }}
                                    disabled={isAdjusting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdjusting || (adjustFormData.action === 'add' && adjustFormData.amount > balance) || (adjustFormData.action === 'deduct' && adjustFormData.amount > (selectedUser.credits || 0))}
                                    className={`flex-1 px-4 py-2 ${adjustFormData.action === 'add' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg transition-all font-bold shadow-sm disabled:opacity-50 flex items-center justify-center`}
                                >
                                    {isAdjusting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        adjustFormData.action === 'add' ? 'Confirm Addition' : 'Confirm Deduction'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Sub-User</h3>
                        <p className="text-sm text-gray-500 text-center mb-2">
                            Are you sure you want to delete <span className="font-semibold text-gray-800">{selectedUser.firstName} {selectedUser.lastName}</span>?
                        </p>
                        <p className="text-xs text-red-500 text-center mb-6">This action cannot be undone. All data associated with this user will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedUser(null);
                                }}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSubUser}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Yes, Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


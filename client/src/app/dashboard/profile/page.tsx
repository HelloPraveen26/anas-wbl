"use client";

import React, { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  authProvider: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

interface BillingData {
  building: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrgData {
  organizationName: string;
  domain: string;
}

export default function ProfilePage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [basicForm, setBasicForm] = useState({ firstName: "", lastName: "", phone: "" });

  const [billingForm, setBillingForm] = useState<BillingData>({
    building: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [orgForm, setOrgForm] = useState<OrgData>({ organizationName: "", domain: "" });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserProfile(userData);
        setBasicForm({ firstName: userData.firstName || "", lastName: userData.lastName || "", phone: userData.phone || "" });
      }

      const savedBilling = localStorage.getItem("billingAddress");
      if (savedBilling) setBillingForm(JSON.parse(savedBilling));

      const savedOrg = localStorage.getItem("organizationDetails");
      if (savedOrg) setOrgForm(JSON.parse(savedOrg));

      const savedPicture = localStorage.getItem("profilePicture");
      if (savedPicture) setProfilePicture(savedPicture);

      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: UserProfile = await response.json();
        setUserProfile(data);
        localStorage.setItem("user", JSON.stringify(data));
        setBasicForm({ firstName: data.firstName || "", lastName: data.lastName || "", phone: data.phone || "" });
        if (data.profilePicture && !savedPicture) setProfilePicture(data.profilePicture);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showMessage("error", "Please upload an image file");
    if (file.size > 5 * 1024 * 1024) return showMessage("error", "Image size must be less than 5MB");

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfilePicture(base64String);
      localStorage.setItem("profilePicture", base64String);
      showMessage("success", "Profile picture updated");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleBasicSave = async () => {
    if (!basicForm.firstName.trim()) return showMessage("error", "First name is required");
    setSaving(true);
    try {
      const token = getToken();
      if (!token) return showMessage("error", "Please login to update profile");

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: basicForm.firstName.trim(), lastName: basicForm.lastName.trim(), phone: basicForm.phone.trim() || undefined }),
      });

      if (response.ok) {
        const updatedData: UserProfile = await response.json();
        setUserProfile(updatedData);
        localStorage.setItem("user", JSON.stringify(updatedData));
        showMessage("success", "Profile updated successfully");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error(error);
      showMessage("error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleBillingSave = () => {
    if (!billingForm.building || !billingForm.street || !billingForm.city || !billingForm.state || !billingForm.zipCode || !billingForm.country) return showMessage("error", "Please fill all billing address fields");
    localStorage.setItem("billingAddress", JSON.stringify(billingForm));
    showMessage("success", "Billing address saved successfully");
  };

  const handleOrgSave = () => {
    if (!orgForm.organizationName || !orgForm.domain) return showMessage("error", "Please fill all organization fields");
    localStorage.setItem("organizationDetails", JSON.stringify(orgForm));
    showMessage("success", "Organization details saved successfully");
  };

  const handleProfileNext = () => {
    if (!basicForm.firstName.trim()) return showMessage("error", "First name is required");
    setActiveTab('billing');
  };

  const handleBillingNext = () => {
    if (!billingForm.building || !billingForm.street || !billingForm.city || !billingForm.state || !billingForm.zipCode || !billingForm.country) return showMessage("error", "Please fill all billing address fields");
    setActiveTab('organization');
  };

  const handleFinalSave = async () => {
    if (!orgForm.organizationName || !orgForm.domain) return showMessage("error", "Please fill all organization fields");
    setSaving(true);
    try {
      await handleBasicSave();
      handleBillingSave();
      handleOrgSave();
    } catch (error) {
      // Error handling is done in handleBasicSave
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = () => {
    if (!passwordForm.currentPassword) return showMessage("error", "Current password is required");
    if (!passwordForm.newPassword) return showMessage("error", "New password is required");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showMessage("error", "New passwords do not match");
    if (passwordForm.newPassword.length < 6) return showMessage("error", "Password must be at least 6 characters");
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) return showMessage("error", "Password must contain uppercase, lowercase, and a number");

    const passwordData = { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword, changedAt: new Date().toISOString() };
    localStorage.setItem("passwordChange", JSON.stringify(passwordData));
    showMessage("success", "Password changed successfully");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-56 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Profile Header Card */}
        <div className="relative -mt-32 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden border-4 border-white shadow-2xl shadow-emerald-500/20 bg-gradient-to-br from-emerald-400 to-teal-500">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl font-bold text-white">{userProfile?.firstName?.[0] || 'U'}</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-2 right-2 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition shadow-lg shadow-emerald-500/30">
                    <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{userProfile?.firstName} {userProfile?.lastName}</h1>

                  </div>
                  <p className="text-gray-600 mb-4 flex items-center gap-2 text-lg">
                    {userProfile?.email}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{orgForm.organizationName || 'No organization'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Joined {userProfile?.createdAt?.split('T')?.[0] || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-white border-2 border-emerald-200 hover:border-emerald-400 text-emerald-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md">
                    Credits
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 shadow-md ${message.type === "success" ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                {message.type === "success" ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 mb-6 p-2">
          <nav className="flex gap-2">
            {[
              { id: 'profile', label: 'Profile Information', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { id: 'billing', label: 'Billing Address', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
              { id: 'organization', label: 'Organization', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16 M3 10h18 M9 21v-8a1 1 0 011-1h4a1 1 0 011 1v8' },
              { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 mb-8 overflow-y-auto max-h-[500px]">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 -mx-8 -mt-8 px-8 py-5 mb-8 border-b border-emerald-100 ">
                <h2 className="text-2xl font-bold text-emerald-900">Profile Information</h2>
                <p className="text-sm text-emerald-700 mt-1">Update your personal details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicForm.firstName}
                    onChange={(e) => setBasicForm({ ...basicForm, firstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={basicForm.lastName}
                    onChange={(e) => setBasicForm({ ...basicForm, lastName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={basicForm.phone}
                      disabled
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="Enter phone number"
                    />
                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setBasicForm({ firstName: userProfile?.firstName || "", lastName: userProfile?.lastName || "", phone: userProfile?.phone || "" })}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileNext}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/30"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Billing Address Tab */}
          {activeTab === 'billing' && (
            <div>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 -mx-8 -mt-8 px-8 py-5 mb-8 border-b border-emerald-100">
                <h2 className="text-2xl font-bold text-emerald-900">Billing Address</h2>
                <p className="text-sm text-emerald-700 mt-1">Manage your billing information</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Building / House No</label>
                  <input
                    type="text"
                    value={billingForm.building}
                    onChange={(e) => setBillingForm({ ...billingForm, building: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Building number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={billingForm.street}
                    onChange={(e) => setBillingForm({ ...billingForm, street: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={billingForm.city}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State / Province</label>
                  <input
                    type="text"
                    value={billingForm.state}
                    onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="State or province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP / Postal Code</label>
                  <input
                    type="text"
                    value={billingForm.zipCode}
                    onChange={(e) => setBillingForm({ ...billingForm, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Postal code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={billingForm.country}
                    onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between gap-3">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBillingForm({ building: "", street: "", city: "", state: "", zipCode: "", country: "" })}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleBillingNext}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 -mx-8 -mt-8 px-8 py-5 mb-8 border-b border-emerald-100">
                <h2 className="text-2xl font-bold text-emerald-900">Organization Details</h2>
                <p className="text-sm text-emerald-700 mt-1">Configure your organization settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={orgForm.organizationName}
                    onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Domain</label>
                  <input
                    type="text"
                    value={orgForm.domain}
                    onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="example.com"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between gap-3">
                <button
                  onClick={() => setActiveTab('billing')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOrgForm({ organizationName: "", domain: "" })}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleFinalSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 -mx-8 -mt-8 px-8 py-5 mb-8 border-b border-emerald-100">
                <h2 className="text-2xl font-bold text-emerald-900">Security Settings</h2>
                <p className="text-sm text-emerald-700 mt-1">Update your password to keep your account secure</p>
              </div>

              <div className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-gray-500 mt-2">Must be at least 6 characters with uppercase, lowercase, and a number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="mt-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                  <div className="flex gap-3">
                    <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 mb-1">Password Security</h4>
                      <p className="text-xs text-amber-800">Make sure your password is strong and unique. Last changed: {localStorage.getItem('passwordChange') ? JSON.parse(localStorage.getItem('passwordChange')!).changedAt.split('T')[0] : 'Never'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSave}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition shadow-lg shadow-red-500/30"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
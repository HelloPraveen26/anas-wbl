'use client';

import { useState } from "react";
import { Search } from "lucide-react";

export default function PhoneNumbersPage() {
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("twilio");

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="text-center max-w-md">
        {/* Phone Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center">
            <div className="w-6 h-1 bg-gray-300 rounded"></div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Phone Numbers</h2>
        <p className="text-gray-500 text-sm mb-4">
          Assistants are able to be connected to phone numbers for calls.
        </p>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">
          You can import from Twilio, Exotel, or create a free number directly from Zenvoice for use with your assistants.
        </p>

        {/* Buttons */}
        <div className="flex justify-center space-x-2 mb-6">
          <button
            onClick={() => setOpenModal(true)}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Create Phone Number
          </button>
          {/* <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
            Documentation
          </button> */}
        </div>
          {/* SIP Search - FIX APPLIED HERE: Added 'text-gray-900' */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search name, number, SIP..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
        {/* Modal */}
        {openModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 " >
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 flex flex-col">


              
              {/* Tabs */}
              <div className="flex space-x-6 border-b mb-4">
                {["twilio", "exotel"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-2 font-medium ${
                      activeTab === tab
                        ? "text-teal-600 border-b-2 border-teal-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

            

              {/* Scrollable Form */}
              <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
                <form className="space-y-4">
                  {/* Common fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Region</label>
                    <select className="w-full mt-1 text-gray-700 border rounded-md px-3 py-2">
                      <option>us-west</option>
                      <option>us-east</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Select the region matching your provider’s account region.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Country</label>
                    <select className="w-full mt-1 border rounded-md text-gray-700 px-3 py-2">
                      <option>United States (+1)</option>
                      <option>India (+91)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+12345678990"
                      // FIX APPLIED HERE: Added 'text-gray-900'
                      className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900"
                    />
                  </div>

                  {/* Conditional Fields */}
                  {activeTab === "twilio" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">API Key</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="Provider API Key" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">API Secret</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="API Secret" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Account SID</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="Account SID" 
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">API Key</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="Provider API Key" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">API Token</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="API Token" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Account SID</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="Account SID" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Subdomain</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="Subdomain" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">App ID</label>
                        <input 
                            // FIX APPLIED HERE: Added 'text-gray-900'
                            className="w-full mt-1 border rounded-md px-3 py-2 text-gray-900" 
                            placeholder="App ID" 
                        />
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6">
                {/* <a href="#" className="text-teal-600 text-sm hover:underline">Tutorials</a> */}
                <div className="space-x-3">
                  <button
                    onClick={() => setOpenModal(false)}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700">
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
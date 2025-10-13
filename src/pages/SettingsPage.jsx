import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Settings, User, Bell, Shield, Palette, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setThemeMode } = useTheme();

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center mb-8">
          <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
              <nav className="p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-2 transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Profile Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.emailAddresses[0]?.emailAddress || ""}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={user?.fullName || ""}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Member Since
                      </label>
                      <input
                        type="text"
                        value={new Date(user?.createdAt).toLocaleDateString()}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Notification Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive email updates about your activity
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Quiz Reminders
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get reminded to take quizzes on your PDFs
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Weekly Summary
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive a weekly summary of your activity
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Privacy Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Data Collection
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Allow collection of usage data to improve the service
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Analytics
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Share anonymous usage statistics
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Data Deletion
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                        You can request deletion of all your data at any time.
                        This action cannot be undone.
                      </p>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                        Request Data Deletion
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Appearance Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setThemeMode("light")}
                          className={`border-2 rounded-lg p-4 text-center transition-all hover:scale-105 ${
                            theme === "light"
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-primary-300"
                          }`}
                        >
                          <div className="w-8 h-8 bg-white border border-gray-300 rounded mx-auto mb-2 flex items-center justify-center">
                            <Sun className="w-4 h-4 text-yellow-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Light
                          </span>
                        </button>
                        <button
                          onClick={() => setThemeMode("dark")}
                          className={`border-2 rounded-lg p-4 text-center transition-all hover:scale-105 ${
                            theme === "dark"
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-primary-300"
                          }`}
                        >
                          <div className="w-8 h-8 bg-gray-800 rounded mx-auto mb-2 flex items-center justify-center">
                            <Moon className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Dark
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

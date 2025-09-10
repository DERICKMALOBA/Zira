// src/pages/relationship-officer/components/ConversionChart.jsx
import React from 'react'

const ConversionChart = ({ stats }) => {
  const { hot, warm, cold } = stats.activeLeads
  const totalLeads = hot + warm + cold

  const getPercentage = (value) => {
    return totalLeads > 0 ? ((value / totalLeads) * 100).toFixed(0) : 0
  }

  return (
    <div className="space-y-4">
      {/* Progress Bars */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-red-600 font-medium">Hot Leads</span>
          <span>{hot} ({getPercentage(hot)}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full"
            style={{ width: `${getPercentage(hot)}%` }}
          ></div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-yellow-600 font-medium">Warm Leads</span>
          <span>{warm} ({getPercentage(warm)}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${getPercentage(warm)}%` }}
          ></div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-medium">Cold Leads</span>
          <span>{cold} ({getPercentage(cold)}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-400 h-2 rounded-full"
            style={{ width: `${getPercentage(cold)}%` }}
          ></div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
          <p className="text-sm text-gray-600">Overall Conversion Rate</p>
        </div>
      </div>
    </div>
  )
}

export default ConversionChart
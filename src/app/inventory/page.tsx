"use client";

import { resources } from "@/lib/mock-data";
import { Package, MapPin, TrendingUp, Gift, DollarSign } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resource Inventory</h1>
        <p className="text-zinc-500">Track books, bibles, and mission materials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((item) => (
          <div key={item.id} className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Category</span>
                  <p className="text-sm font-medium">{item.category}</p>
                </div>
              </div>

              <h2 className="mt-4 text-xl font-bold">{item.title}</h2>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Available</p>
                  <p className="text-2xl font-bold">{item.quantityAvailable}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Price</p>
                  <p className="text-2xl font-bold">${item.price || 0}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <TrendingUp className="h-4 w-4" />
                    <span>Sold</span>
                  </div>
                  <span className="font-bold">{item.quantitySold}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Gift className="h-4 w-4" />
                    <span>Distributed (Free)</span>
                  </div>
                  <span className="font-bold">{item.quantityGiven}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 pt-3 border-t dark:border-zinc-800">
                  <MapPin className="h-4 w-4" />
                  <span>Location: <span className="font-medium text-zinc-900 dark:text-zinc-300">{item.location}</span></span>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-zinc-50 border-t dark:bg-zinc-800/30 dark:border-zinc-800 flex justify-between">
              <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Log Sale
              </button>
              <button className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1">
                <Gift className="h-3 w-3" /> Log Donation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

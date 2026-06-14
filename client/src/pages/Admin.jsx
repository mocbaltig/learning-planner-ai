import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Brain,
  Timer,
  CheckCircle2,
} from "lucide-react";

export default function Admin() {
  const [metrics, setMetrics] = useState({
    total_ai_calls: 0,
    avg_response_time: 0,
    acceptance_rate: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.get("/metrics/summary");

        setMetrics({
          total_ai_calls: data.total_ai_calls,
          avg_response_time: data.avg_response_time,
          acceptance_rate: data.acceptance_rate,
        });
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading admin metrics...
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Admin Dashboard
        </h1>

        <p className="text-gray-400 mt-2">
          Monitor performa AI Learning Plan secara real-time.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Total AI Requests */}
        <div className="bg-[#081336] border border-[#1B2A52] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <Brain className="text-purple-400" size={24} />
            </div>

            <span className="text-xs text-gray-400">
              Today
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Total AI Requests
          </p>

          <h2 className="text-4xl font-bold mt-2 text-purple-400">
            {metrics.total_ai_calls}
          </h2>

          <p className="text-sm text-gray-500 mt-3">
            Total permintaan AI hari ini
          </p>
        </div>

        {/* Average Latency */}
        <div className="bg-[#081336] border border-[#1B2A52] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="bg-cyan-500/20 p-3 rounded-xl">
              <Timer className="text-cyan-400" size={24} />
            </div>

            <span className="text-xs text-gray-400">
              Average
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Response Latency
          </p>

          <h2 className="text-4xl font-bold mt-2 text-cyan-400">
            {metrics.avg_response_time} ms
          </h2>

          <p className="text-sm text-gray-500 mt-3">
            Rata-rata waktu respons AI
          </p>
        </div>

        {/* Acceptance Rate */}
        <div className="bg-[#081336] border border-[#1B2A52] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="bg-green-500/20 p-3 rounded-xl">
              <CheckCircle2
                className="text-green-400"
                size={24}
              />
            </div>

            <span className="text-xs text-gray-400">
              Success
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Acceptance Rate
          </p>

          <h2 className="text-4xl font-bold mt-2 text-green-400">
            {metrics.acceptance_rate}%
          </h2>

          <p className="text-sm text-gray-500 mt-3">
            Persentase rekomendasi diterima
          </p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-[#081336] border border-[#1B2A52] rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6">
          AI Service Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>
            <p className="text-gray-400 text-sm mb-2">
              AI Requests
            </p>

            <p className="text-2xl font-semibold">
              {metrics.total_ai_calls}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-2">
              Avg Response
            </p>

            <p className="text-2xl font-semibold">
              {metrics.avg_response_time} ms
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-2">
              User Acceptance
            </p>

            <p className="text-2xl font-semibold">
              {metrics.acceptance_rate}%
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
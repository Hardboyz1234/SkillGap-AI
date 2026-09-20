import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function Sparkline({ data }) {
  // data: array of numbers (readiness scores over time)
  const chartData = data.map((value, i) => ({ i, value }));

  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

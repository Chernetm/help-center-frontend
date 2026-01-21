import { motion } from "framer-motion";
import {
  FaTicketAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaStar,
  FaUsers,
  FaClock,
  FaCircle,
  FaCalendarWeek,
  FaCalendarAlt,
  FaCalendarCheck
} from "react-icons/fa";

const CardStat = ({ icon, label, value, color }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-xl bg-${color}-50 hover:bg-${color}-100 transition-colors duration-300 group`}>
    <div className={`text-2xl mb-1 text-${color}-500 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="text-xl font-bold text-gray-800">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</span>
  </div>
);

const DurationStat = ({ icon, label, minutes, color }) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const timeStr = `${hours}h ${mins}m`;

  return (
    <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <div className={`p-2 rounded-full bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-gray-700">{timeStr}</p>
      </div>
    </div>
  );
};

const UserPerformanceCard = ({ user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative"
    >
      {/* Header / Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-24 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white text-xs font-medium">
          <FaCircle className={user.isOnline ? "text-green-400" : "text-gray-300"} size={8} />
          {user.isOnline ? "Online" : "Offline"}
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Profile Info */}
        <div className="relative -mt-10 mb-4 flex justify-between items-end">
          <div>
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-500 uppercase">
                {user.name?.[0]}
              </div>
              {/* Use Image if available later */}
            </div>
            <h2 className="mt-3 text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-sm text-indigo-500 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded-full mt-1">
              {user.department || "General"}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-yellow-500">
              <FaStar />
              <span className="text-2xl font-bold text-gray-800">{user.avgRating || "0.0"}</span>
            </div>
            <p className="text-xs text-gray-400">Avg Rating</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <CardStat
            icon={<FaTicketAlt />}
            value={user.totalTickets}
            label="Total"
            color="blue"
          />
          <CardStat
            icon={<FaCheckCircle />}
            value={user.closedTickets}
            label="Closed"
            color="green"
          />
          <CardStat
            icon={<FaUsers />}
            value={user.customersServed}
            label="Served"
            color="purple"
          />
        </div>

        {/* Work Duration Section */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FaClock /> Work Duration
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <DurationStat
              icon={<FaCalendarWeek />}
              label="This Week"
              minutes={user.durationWeekly}
              color="indigo"
            />
            <DurationStat
              icon={<FaCalendarAlt />}
              label="This Month"
              minutes={user.durationMonthly}
              color="pink"
            />
            <DurationStat
              icon={<FaCalendarCheck />}
              label="This Year"
              minutes={user.durationAnnually}
              color="orange"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserPerformanceCard;

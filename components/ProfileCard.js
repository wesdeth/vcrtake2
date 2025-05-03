// /components/ProfileCard.js
export default function ProfileCard({ name, tag, color, border }) {
  return (
    <div
      className={`w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-3`}
    >
      <div className={`bg-white dark:bg-gray-800 border ${border} rounded-xl shadow-md p-4 text-center`}>
        <p className="font-semibold text-lg truncate">{name}</p>
        <p className={`text-sm ${color}`}>{tag}</p>
      </div>
    </div>
  );
}

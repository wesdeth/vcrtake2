// /components/DownloadButton.js
export default function DownloadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition"
    >
      Download PDF
    </button>
  );
}

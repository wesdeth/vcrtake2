export default function handler(req, res) {
  const profiles = [
    {
      name: "vitalik.eth",
      tag: "Recently Updated",
      color: "text-blue-500",
      border: "border-blue-300"
    },
    {
      name: "184.eth",
      tag: "Viewed by Recruiter",
      color: "text-green-500",
      border: "border-green-300"
    },
    {
      name: "zora.eth",
      tag: "New Resume",
      color: "text-yellow-500",
      border: "border-yellow-300"
    }
  ];

  res.status(200).json(profiles);
}

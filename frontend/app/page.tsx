export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen text-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-4">YouMatter</h1>
        <p className="mb-6 text-gray-400">Your AI mental wellness companion</p>

        <div className="space-x-4">
          <a href="/login" className="px-4 py-2 bg-indigo-500 rounded-lg">
            Login
          </a>
          <a href="/register" className="px-4 py-2 bg-gray-700 rounded-lg">
            Register
          </a>
        </div>
      </div>
    </div>
  )
}
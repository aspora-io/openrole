export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Open<span className="text-blue-600">Role</span>.net
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The transparent job platform where every role shows salary ranges, 
          companies are verified, and hiring is fair for everyone.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Salary Transparency</h3>
            <p className="text-gray-600">Every job posting must include salary ranges. No more guessing.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Verified Employers</h3>
            <p className="text-gray-600">Only verified companies with proven track records.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Application Tracking</h3>
            <p className="text-gray-600">Track your applications and get feedback on rejections.</p>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-700">
              🚀 <strong>Coming Soon:</strong> CV & Profile Tools - Create, manage, and optimize your professional profile
            </p>
          </div>
          
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <p className="text-green-700">
              ✨ Based on our comprehensive specification with 31 functional requirements across 5 development phases
            </p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Version 1.0.0 | Built with Next.js 14, TypeScript, and constitutional principles
        </div>
      </div>
    </main>
  )
}
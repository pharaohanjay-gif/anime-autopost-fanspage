export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-400 mb-4">Last updated: January 12, 2026</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-gray-300">
            Weebnesia Bot (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the webnesiabbot application. 
            This page informs you of our policies regarding the collection, use, and disclosure 
            of personal information when you use our Service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Information Collection</h2>
          <p className="text-gray-300">
            Our application is designed to automatically post content to the Weebnesia Facebook Page. 
            We do not collect personal information from users. The only data we access is:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2">
            <li>Facebook Page access tokens (for posting purposes only)</li>
            <li>Public anime/manga data from third-party APIs</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Use of Data</h2>
          <p className="text-gray-300">
            The data accessed is used solely for:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2">
            <li>Posting anime and manga content to the Weebnesia Facebook Page</li>
            <li>Managing scheduled posts</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p className="text-gray-300">
            We value your trust and strive to use commercially acceptable means of protecting 
            any information. Access tokens are stored securely and are never shared with third parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
          <p className="text-gray-300">
            Our application uses the following third-party services:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2">
            <li>Facebook Graph API - for posting to Facebook Pages</li>
            <li>Jikan API - for anime data</li>
            <li>Groq AI - for generating captions</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p className="text-gray-300">
            If you have any questions about this Privacy Policy, please contact us through 
            our Facebook Page: Weebnesia.
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-gray-500 text-sm">
            © 2026 Weebnesia. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

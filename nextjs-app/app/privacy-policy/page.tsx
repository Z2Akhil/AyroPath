import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Ayropath',
    description: 'Privacy Policy for Ayropath Technologies Limited - Learn how we collect, use, and protect your personal and health information.',
};

export default function PrivacyPolicyPage() {
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                Privacy <span className="text-red-600">Policy</span>
            </h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: January 2026</p>

            <div className="space-y-8 text-gray-700 text-base leading-relaxed">
                {/* Introduction */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Introduction
                    </h2>
                    <p>
                        At <span className="font-semibold">Ayropath Technologies Limited</span>,
                        in association with <span className="font-semibold">Thyrocare Technologies Limited</span>,
                        we are committed to protecting your privacy and ensuring the security of your personal
                        and health-related information. This Privacy Policy outlines how we collect, use,
                        disclose, and safeguard your data when you use our website and services.
                    </p>
                </div>

                {/* Information We Collect */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Information We Collect
                    </h2>
                    <p className="mb-3">We may collect the following types of information:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <span className="font-medium">Personal Information:</span> Name, email address,
                            phone number, date of birth, gender, and residential address.
                        </li>
                        <li>
                            <span className="font-medium">Health Information:</span> Medical history,
                            test results, prescriptions, and other health-related data necessary for
                            providing diagnostic services.
                        </li>
                        <li>
                            <span className="font-medium">Payment Information:</span> Billing address,
                            payment method details (processed securely through third-party payment gateways).
                        </li>
                        <li>
                            <span className="font-medium">Usage Data:</span> Browser type, IP address,
                            pages visited, time spent on the website, and other analytical data.
                        </li>
                    </ul>
                </div>

                {/* How We Use Your Information */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        How We Use Your Information
                    </h2>
                    <p className="mb-3">Your information is used for the following purposes:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To provide and manage diagnostic services, including home sample collection and report delivery.</li>
                        <li>To process payments and send order confirmations.</li>
                        <li>To communicate important updates, promotional offers, and health tips (with your consent).</li>
                        <li>To improve our website, services, and customer experience.</li>
                        <li>To comply with legal and regulatory requirements.</li>
                        <li>To prevent fraud and ensure the security of our platform.</li>
                    </ul>
                </div>

                {/* Information Sharing */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Information Sharing and Disclosure
                    </h2>
                    <p className="mb-3">
                        We do not sell, trade, or rent your personal information to third parties.
                        However, we may share your data with:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <span className="font-medium">Thyrocare Technologies Limited:</span> Our laboratory
                            partner for processing and delivering accurate test results.
                        </li>
                        <li>
                            <span className="font-medium">Service Providers:</span> Third-party vendors who
                            assist with payment processing, logistics, and IT services, bound by confidentiality agreements.
                        </li>
                        <li>
                            <span className="font-medium">Legal Authorities:</span> When required by law or
                            to protect our legal rights.
                        </li>
                    </ul>
                </div>

                {/* Data Security */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Data Security
                    </h2>
                    <p>
                        We implement industry-standard security measures to protect your personal and
                        health information. This includes encryption, secure servers, access controls,
                        and regular security audits. However, no method of transmission over the Internet
                        is 100% secure, and we cannot guarantee absolute security.
                    </p>
                </div>

                {/* Your Rights */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Your Rights
                    </h2>
                    <p className="mb-3">You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access, update, or correct your personal information.</li>
                        <li>Request deletion of your data (subject to legal and operational requirements).</li>
                        <li>Opt-out of marketing communications at any time.</li>
                        <li>Withdraw consent for data processing where applicable.</li>
                    </ul>
                </div>

                {/* Cookies */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Cookies and Tracking Technologies
                    </h2>
                    <p>
                        Our website uses cookies and similar technologies to enhance your browsing experience,
                        analyze website traffic, and personalize content. You can manage cookie preferences
                        through your browser settings. Disabling cookies may affect certain functionalities
                        of our website.
                    </p>
                </div>

                {/* Third-Party Links */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Third-Party Links
                    </h2>
                    <p>
                        Our website may contain links to third-party websites. We are not responsible for
                        the privacy practices or content of these external sites. We encourage you to
                        review their privacy policies before providing any personal information.
                    </p>
                </div>

                {/* Changes to Policy */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Changes to This Policy
                    </h2>
                    <p>
                        We may update this Privacy Policy from time to time. Any changes will be posted
                        on this page with an updated &quot;Last Updated&quot; date. We encourage you to review
                        this policy periodically.
                    </p>
                </div>

                {/* Contact */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Contact Us
                    </h2>
                    <p>
                        If you have any questions or concerns about this Privacy Policy or our data practices,
                        please contact us at:
                    </p>
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">Ayropath Technologies Limited</p>
                        <p>Email: admin@ayropath.com</p>
                        <p>Phone: Available on our website</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

const TermsOfServicePage = () => {
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                Terms of <span className="text-red-600">Service</span>
            </h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: January 2026</p>

            <div className="space-y-8 text-gray-700 text-base leading-relaxed">
                {/* Acceptance of Terms */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Acceptance of Terms
                    </h2>
                    <p>
                        By accessing and using the Ayropath website and services, you agree to be bound by
                        these Terms of Service. If you do not agree with any part of these terms, please
                        do not use our services. These terms apply to all users, including visitors,
                        registered users, and customers.
                    </p>
                </div>

                {/* Services Description */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Our Services
                    </h2>
                    <p className="mb-3">
                        Ayropath Technologies Limited, in association with Thyrocare Technologies Limited,
                        provides the following services:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Home sample collection for diagnostic tests.</li>
                        <li>Laboratory testing and analysis through NABL and CAP-accredited facilities.</li>
                        <li>Online access to test reports and health records.</li>
                        <li>Health packages and preventive care solutions.</li>
                        <li>Customer support and consultation services.</li>
                    </ul>
                </div>

                {/* User Responsibilities */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        User Responsibilities
                    </h2>
                    <p className="mb-3">As a user of our services, you agree to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide accurate and complete personal and health information.</li>
                        <li>Keep your account credentials confidential and secure.</li>
                        <li>Use our services only for lawful purposes.</li>
                        <li>Not impersonate any person or entity or misrepresent your affiliation.</li>
                        <li>Not interfere with or disrupt the operation of our website or services.</li>
                        <li>Comply with all applicable local, state, and national laws and regulations.</li>
                    </ul>
                </div>

                {/* Account Registration */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Account Registration
                    </h2>
                    <p>
                        To access certain features of our services, you may need to create an account.
                        You are responsible for maintaining the confidentiality of your account information
                        and for all activities that occur under your account. You must notify us immediately
                        of any unauthorized use of your account.
                    </p>
                </div>

                {/* Booking and Appointments */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Booking and Appointments
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            Appointments for home sample collection are subject to availability and
                            serviceable areas.
                        </li>
                        <li>
                            You must ensure someone is available at the provided address during the
                            scheduled time slot.
                        </li>
                        <li>
                            Failure to be available may result in rescheduling or cancellation of the appointment.
                        </li>
                        <li>
                            We reserve the right to reschedule appointments due to unforeseen circumstances
                            or operational requirements.
                        </li>
                    </ul>
                </div>

                {/* Payments */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Payments and Pricing
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>All prices displayed on our website are in Indian Rupees (INR).</li>
                        <li>Prices are subject to change without prior notice.</li>
                        <li>Payment must be completed at the time of booking or as specified.</li>
                        <li>
                            We accept various payment methods including credit/debit cards, UPI,
                            net banking, and cash on delivery where available.
                        </li>
                        <li>
                            Additional charges may apply for home collection services below a minimum order value.
                        </li>
                    </ul>
                </div>

                {/* Test Reports */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Test Reports and Results
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            Test reports will be made available online within the specified turnaround time.
                        </li>
                        <li>
                            Hard copy reports can be requested for an additional charge where available.
                        </li>
                        <li>
                            Test results are for informational purposes and should be interpreted by
                            qualified healthcare professionals.
                        </li>
                        <li>
                            We are not responsible for any medical decisions made based on test results
                            without proper medical consultation.
                        </li>
                    </ul>
                </div>

                {/* Intellectual Property */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Intellectual Property
                    </h2>
                    <p>
                        All content on the Ayropath website, including but not limited to text, graphics,
                        logos, images, and software, is the property of Ayropath Technologies Limited or
                        its licensors and is protected by copyright and intellectual property laws.
                        You may not reproduce, distribute, or create derivative works without our
                        prior written consent.
                    </p>
                </div>

                {/* Limitation of Liability */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Limitation of Liability
                    </h2>
                    <p className="mb-3">
                        To the fullest extent permitted by law, Ayropath Technologies Limited shall not
                        be liable for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Any indirect, incidental, special, or consequential damages.</li>
                        <li>Loss of profits, data, or business opportunities.</li>
                        <li>
                            Any damages arising from the use or inability to use our services.
                        </li>
                        <li>
                            Medical complications arising from sample collection procedures when
                            performed by certified professionals following standard protocols.
                        </li>
                    </ul>
                </div>

                {/* Disclaimer */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Disclaimer
                    </h2>
                    <p>
                        Our services are provided "as is" without warranties of any kind, either express
                        or implied. We do not guarantee that our services will be uninterrupted,
                        error-free, or completely secure. Diagnostic test results are subject to
                        biological variations and should be correlated with clinical findings.
                    </p>
                </div>

                {/* Governing Law */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Governing Law
                    </h2>
                    <p>
                        These Terms of Service shall be governed by and construed in accordance with
                        the laws of India. Any disputes arising from these terms or your use of our
                        services shall be subject to the exclusive jurisdiction of the courts in
                        Mumbai, Maharashtra.
                    </p>
                </div>

                {/* Changes to Terms */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Changes to Terms
                    </h2>
                    <p>
                        We reserve the right to modify these Terms of Service at any time. Changes will
                        be effective immediately upon posting on this page. Your continued use of our
                        services after any changes constitutes acceptance of the new terms.
                    </p>
                </div>

                {/* Contact */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Contact Us
                    </h2>
                    <p>
                        If you have any questions about these Terms of Service, please contact us at:
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
};

export default TermsOfServicePage;

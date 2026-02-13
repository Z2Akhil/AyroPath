import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund Policy | Ayropath',
    description: 'Refund Policy for Ayropath Technologies Limited - Learn about our refund and cancellation policies for diagnostic services.',
};

export default function RefundPolicyPage() {
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
                Refund <span className="text-red-600">Policy</span>
            </h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: January 2026</p>

            <div className="space-y-8 text-gray-700 text-base leading-relaxed">
                {/* Policy Statement */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Our Policy
                    </h2>
                    <p>
                        At <span className="font-semibold">Ayropath Technologies Limited</span>,
                        we are committed to providing accurate and reliable diagnostic services in
                        association with <span className="font-semibold">Thyrocare Technologies Limited</span>.
                        Due to the nature of our services involving laboratory testing and sample processing,
                        we maintain a strict <span className="font-semibold text-red-600">No Refund Policy</span>.
                    </p>
                </div>

                {/* No Refund Explanation */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Why We Do Not Offer Refunds
                    </h2>
                    <p className="mb-3">
                        Once a sample has been collected, the testing process begins immediately at our
                        laboratory partner&apos;s facilities. This involves:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Immediate processing and handling of biological samples.</li>
                        <li>Use of consumable testing materials and reagents.</li>
                        <li>Laboratory analysis using specialized equipment and trained technicians.</li>
                        <li>Quality control procedures that cannot be reversed.</li>
                    </ul>
                    <p className="mt-3">
                        Given these factors, we are unable to process refunds once a sample has been
                        collected and submitted for testing.
                    </p>
                </div>

                {/* Before Sample Collection */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Cancellations Before Sample Collection
                    </h2>
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg mb-4">
                        <p className="font-medium text-blue-800">
                            Important: Cancellations requested before sample collection may be considered
                            on a case-by-case basis.
                        </p>
                    </div>
                    <p>
                        If you wish to cancel your booking before the phlebotomist arrives for sample
                        collection, please contact our customer support team immediately. While we do
                        not guarantee refunds, we may consider:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-3">
                        <li>Rescheduling your appointment to a more convenient time.</li>
                        <li>Applying the amount as credit for future bookings.</li>
                        <li>Exceptional circumstances evaluated on a case-by-case basis.</li>
                    </ul>
                </div>

                {/* Exceptions */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Limited Exceptions
                    </h2>
                    <p className="mb-3">
                        In rare circumstances, partial or full refunds may be considered only when:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <span className="font-medium">Service Not Delivered:</span> If our phlebotomist
                            fails to arrive at the scheduled appointment and we are unable to reschedule.
                        </li>
                        <li>
                            <span className="font-medium">Technical Failure:</span> If there is a verified
                            laboratory error that prevents report generation and cannot be corrected.
                        </li>
                        <li>
                            <span className="font-medium">Duplicate Payment:</span> If you have been charged
                            multiple times for the same order due to a technical issue.
                        </li>
                    </ul>
                    <p className="mt-3">
                        All exception requests must be submitted within 48 hours of the incident with
                        supporting documentation.
                    </p>
                </div>

                {/* What We Recommend */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Before You Book
                    </h2>
                    <p className="mb-3">To ensure a smooth experience, we recommend:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Carefully reviewing the test packages and individual tests before booking.</li>
                        <li>Confirming the appointment date, time, and address before payment.</li>
                        <li>Following any pre-test instructions (such as fasting requirements).</li>
                        <li>Ensuring someone is available at the collection address during the time slot.</li>
                        <li>Contacting our support team if you have any questions before booking.</li>
                    </ul>
                </div>

                {/* Report Issues */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Report Issues or Concerns
                    </h2>
                    <p>
                        If you encounter any issues with your order, sample collection, or test reports,
                        please reach out to our customer support team. We are committed to resolving
                        any concerns and ensuring you receive quality service.
                    </p>
                </div>

                {/* Contact */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">
                        Contact Us
                    </h2>
                    <p>
                        For any questions regarding this Refund Policy or to report an issue,
                        please contact us at:
                    </p>
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">Ayropath Technologies Limited</p>
                        <p>Email: admin@ayropath.com</p>
                        <p>Phone: Available on our website</p>
                    </div>
                </div>

                {/* Final Note */}
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <p className="font-medium text-red-800">
                        By using our services and completing a booking, you acknowledge and agree to
                        this No Refund Policy.
                    </p>
                </div>
            </div>
        </section>
    );
}

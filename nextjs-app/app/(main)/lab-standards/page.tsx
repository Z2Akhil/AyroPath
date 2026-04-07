import type { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, Award, Microscope } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  title: "Lab Standards & Accreditation – NABL & CAP Certified Thyrocare Labs | Ayropath",
  description:
    "All tests booked through Ayropath are processed at Thyrocare's NABL and CAP accredited laboratories — the gold standard for diagnostic accuracy in India. Learn about our quality processes.",
  keywords: [
    "NABL accredited lab India",
    "CAP accredited laboratory",
    "Thyrocare NABL certification",
    "accredited diagnostic lab",
    "lab standards India",
    "ISO 15189 lab",
    "quality diagnostic testing India",
    "Ayropath lab standards",
  ],
  alternates: { canonical: "/lab-standards" },
  openGraph: {
    title: "Lab Standards & Accreditation – NABL & CAP Certified | Ayropath",
    description:
      "Tests processed at Thyrocare's NABL & CAP accredited labs. The gold standard for diagnostic accuracy in India.",
    type: "website",
    siteName: "Ayropath",
    locale: "en_IN",
  },
};

const certificationJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  name: "Ayropath Technologies Limited",
  url: siteUrl,
  description:
    "India's trusted health diagnostics platform. All tests processed at Thyrocare's NABL & CAP accredited laboratories.",
  medicalSpecialty: "Pathology",
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Accreditation",
      name: "NABL Accreditation",
      recognizedBy: {
        "@type": "Organization",
        name: "National Accreditation Board for Testing and Calibration Laboratories (NABL)",
        url: "https://www.nabl-india.org",
      },
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Accreditation",
      name: "CAP Accreditation",
      recognizedBy: {
        "@type": "Organization",
        name: "College of American Pathologists (CAP)",
        url: "https://www.cap.org",
      },
    },
  ],
};

const accreditations = [
  {
    name: "NABL Accreditation",
    fullName: "National Accreditation Board for Testing and Calibration Laboratories",
    description:
      "NABL is India&apos;s premiere accreditation body for testing labs, operating under the Department for Promotion of Industry and Internal Trade (DPIIT), Government of India. NABL accreditation certifies that a laboratory operates to the highest global standards of quality and technical competence, as defined by ISO/IEC 17025.",
    significance:
      "Only labs that pass rigorous NABL audits are authorised to issue reports used in legal, clinical, and regulatory proceedings. Thyrocare's NABL accreditation ensures your test results are internationally recognised and trusted by doctors nationwide.",
    link: "https://www.nabl-india.org",
  },
  {
    name: "CAP Accreditation",
    fullName: "College of American Pathologists",
    description:
      "CAP is the world&apos;s leading organisation of board-certified pathologists. Its laboratory accreditation programme is recognised globally as the gold standard for diagnostic laboratory quality — more rigorous than ISO certification alone. Thyrocare is among a handful of Indian labs to hold CAP accreditation.",
    significance:
      "CAP-accredited labs undergo unannounced inspections and must demonstrate consistently superior analytical performance. Tests from CAP-accredited Thyrocare labs are accepted by international hospitals and insurance companies.",
    link: "https://www.cap.org",
  },
  {
    name: "ISO 15189",
    fullName: "ISO 15189:2022 – Medical Laboratories Quality Standard",
    description:
      "ISO 15189 is the international standard specifically designed for medical laboratories (as opposed to the generic ISO 17025 for all labs). It defines requirements for quality management systems and technical competence in clinical lab testing.",
    significance:
      "Compliance with ISO 15189 ensures that not just the tests, but also the pre-analytical (sample collection) and post-analytical (report generation) processes meet globally defined quality thresholds.",
    link: "https://www.iso.org/standard/76677.html",
  },
];

const qualityProcesses = [
  {
    icon: Microscope,
    title: "Automated Sample Processing",
    description:
      "Thyrocare's central laboratory in Navi Mumbai processes over 100,000 samples per day using fully automated robotic systems, eliminating manual handling errors.",
  },
  {
    icon: Shield,
    title: "Internal Quality Controls (IQC)",
    description:
      "Every batch of tests is run alongside known control samples. Results outside acceptable control limits trigger immediate recalibration, ensuring every report is accurate.",
  },
  {
    icon: Award,
    title: "External Quality Assurance (EQAS)",
    description:
      "Thyrocare participates in national and international EQAS programmes, such as the Bio-Rad programme, where anonymous samples are tested alongside thousands of labs worldwide and performance graded.",
  },
  {
    icon: CheckCircle,
    title: "Certified Phlebotomists",
    description:
      "All home collection staff are trained, certified phlebotomists who follow strict aseptic and cold-chain protocols to preserve sample integrity from your home to the lab.",
  },
];

export default function LabStandardsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(certificationJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-50 via-white to-blue-50 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">Lab Standards</span>
            </nav>

            <div className="flex items-start gap-4 mb-6">
              <div className="bg-green-100 text-green-700 rounded-full p-3 mt-1">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                  Lab Standards &amp; Accreditation
                </h1>
                <p className="text-lg text-gray-600 mt-3 max-w-2xl leading-relaxed">
                  All tests booked through Ayropath are processed exclusively at{" "}
                  <strong>Thyrocare&apos;s NABL and CAP accredited laboratories</strong>{" "}
                  — the highest certification standards for diagnostic labs in India.
                </p>
              </div>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-3 mt-4">
              {["NABL Accredited", "CAP Accredited", "ISO 15189", "Govt. of India Recognized"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 font-bold text-sm px-4 py-2 rounded-full"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">
          {/* Accreditation Details */}
          <section aria-labelledby="accreditations-heading">
            <h2
              id="accreditations-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-10"
            >
              Our Accreditations — What They Mean for You
            </h2>
            <div className="space-y-8">
              {accreditations.map((acc, i) => (
                <div
                  key={i}
                  className="border border-gray-100 rounded-2xl p-8 hover:border-green-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-green-100 rounded-full p-2 mt-1">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-900">
                        {acc.name}
                      </h3>
                      <p className="text-sm text-gray-500">{acc.fullName}</p>
                    </div>
                  </div>
                  <p
                    className="text-gray-700 leading-relaxed mb-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: acc.description }}
                  />
                  <p className="text-gray-800 font-semibold text-sm leading-relaxed mb-4">
                    {acc.significance}
                  </p>
                  <a
                    href={acc.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                  >
                    Learn more about {acc.name} →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Quality Processes */}
          <section aria-labelledby="quality-heading">
            <h2
              id="quality-heading"
              className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8"
            >
              Quality Control Processes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {qualityProcesses.map((qp, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 rounded-xl p-2">
                      <qp.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-extrabold text-gray-900">{qp.title}</h3>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {qp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-blue-50 rounded-2xl p-10 border border-blue-100 text-center">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              Book Your Next Health Checkup with Confidence
            </h2>
            <p className="text-gray-600 text-sm mb-6 max-w-xl mx-auto">
              Every test you book through Ayropath is backed by NABL &amp; CAP accredited
              Thyrocare labs. Free home collection, digital reports in 24 hrs.
            </p>
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
            >
              <CheckCircle size={18} />
              Browse Health Packages
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

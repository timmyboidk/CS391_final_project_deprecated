import Image from "next/image";
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
// test commit

export default function Home() {
    return (
        <main className="min-h-screen py-12 flex justify-center">
            <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">

                {/* ... (Existing Header, Search, Cache Info, Loading, Error) ... */}

                {/* ... (Existing Table) ... */}

                {/* --- ADD THIS SECTION --- */}
                {/* Analytics Dashboard */}
                {/*{!loading && !error && (*/}
                    <AnalyticsDashboard />
                {/*)}*/}
                {/* ------------------------ */}

                {/* ... (Existing Legend) ... */}

                {/* ... (Existing Footer) ... */}
            </div>
        </main>
    );
}

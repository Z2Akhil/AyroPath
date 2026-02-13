'use client';

const SkeletonPackageDetailed = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-10 bg-gray-200 rounded-lg w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
                    <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
                    <div className="space-y-4">
                        <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="h-[500px] bg-gray-200 rounded-2xl w-full"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonPackageDetailed;

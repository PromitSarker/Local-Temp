import React from 'react';

const stats = [
    { label: 'Active Practices', value: '500+' },
    { label: 'Shifts Filled', value: '10k+' },
    { label: 'Satisfaction Rate', value: '98%' },
    { label: 'Vetted Staff', value: '100%' },
];

export const Stats = () => {
    return (
        <section className="py-12 bg-white border-y border-gray-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center relative">
                            {index !== 0 && (
                                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gray-100" />
                            )}
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#059669] mb-2">{stat.value}</div>
                            <div className="text-xs sm:text-sm font-medium text-[#64748b]">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

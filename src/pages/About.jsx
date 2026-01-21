import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Globe, BookOpen } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <section className="relative bg-gray-50 pt-20 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-extrabold text-gray-900 sm:text-5xl"
                    >
                        About Birhanena Selam
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto"
                    >
                        A legacy of excellence in printing, serving the nation with quality and dedication for over a century.
                    </motion.p>
                </div>
            </section>

            {/* Content Grid */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our History</h2>
                            <div className="prose prose-indigo text-gray-600 space-y-4">
                                <p>
                                    Established with a vision to revolutionize the printing industry in Ethiopia, Birhanena Selam Printing Enterprise has been a cornerstone of information dissemination and educational development.
                                </p>
                                <p>
                                    From our humble beginnings to becoming a modern, high-tech printing facility, our journey has been marked by a relentless pursuit of quality and innovation. We have continuously invested in state-of-the-art technology to meet the evolving needs of our diverse clientele.
                                </p>
                                <p>
                                    Today, we stand proud as a leader in the industry, offering a comprehensive range of printing services from large-scale commercial printing to security printing and publishing.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative h-96 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                alt="Printing Press"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-indigo-900 py-20 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { icon: BookOpen, label: "Years of Service", value: "100+" },
                            { icon: Users, label: "Happy Clients", value: "10k+" },
                            { icon: Award, label: "Awards Won", value: "25+" },
                            { icon: Globe, label: "Nationwide Reach", value: "100%" }
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <stat.icon className="mx-auto h-10 w-10 text-indigo-400 mb-4" />
                                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                                <div className="text-indigo-200">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

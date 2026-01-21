import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Printer, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Footer from '../components/common/Footer';

export default function Home() {
  const features = [
    {
      icon: Printer,
      title: "Premium Quality Printing",
      description: "State-of-the-art equipment ensuring the highest quality for all your printing needs."
    },
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "We understand deadlines. Get your orders processed and delivered in record time."
    },
    {
      icon: ShieldCheck,
      title: "Reliable Service",
      description: "Trusted by thousands of businesses and individuals for consistent, reliable results."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Printing Excellence <br className="hidden md:block" />
            <span className="text-indigo-400">Delivered to You</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mb-10"
          >
            Birhanena Selam Printing Enterprise brings your ideas to life with precision, speed, and unmatched quality. Experience the future of printing today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/customer-register">
              <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 border-none text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm text-lg px-8">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Choose Us</h2>
            <p className="mt-4 text-xl text-gray-600">We don't just print; we partner with you for success.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-indigo-100 w-14 h-14 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Action Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="flex-1 p-12 md:p-16 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to start your next project?</h2>
              <ul className="space-y-4 mb-8 text-indigo-100">
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-indigo-400" /> Professional Support
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-indigo-400" /> Real-time Order Tracking
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-indigo-400" /> Competitive Pricing
                </li>
              </ul>
              <div className="flex gap-4">
                <Link to="/customer-register">
                  <Button className="bg-white text-indigo-900 hover:bg-gray-100 font-bold">Create Account</Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 bg-[url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center min-h-[300px]">
            </div>
          </div>
        </div>
      </section>
      <Footer/>


    </div>
  );
}

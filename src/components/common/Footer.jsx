import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="text-white text-xl font-bold mb-4">Birhanena Selam</h3>
                    <p className="text-sm leading-relaxed max-w-xs">
                        Providing top-tier printing solutions for decades. Committed to quality, innovation, and customer satisfaction.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/home" className="hover:text-white transition">Home</Link></li>
                        <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                        <li><Link to="/help-center" className="hover:text-white transition">Help Center</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li>Privacy Policy</li>
                        <li>Terms of Service</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-sm text-center">
                © {new Date().getFullYear()} Birhanena Selam Printing Enterprise. All rights reserved.
            </div>
        </footer>
    );
}

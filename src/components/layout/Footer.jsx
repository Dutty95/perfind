import React from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">
              © {new Date().getFullYear()} PerFind. All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a 
              href="#" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Support
            </a>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-500 mt-4 md:mt-0">
            <span className="text-sm">Made with</span>
            <HeartIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm">for better financial management</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
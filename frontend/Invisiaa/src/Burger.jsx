import { useState } from 'react';

export default function ModernHamburger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative hover:cursor-pointer">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 flex flex-col justify-between items-center group z-50"
      >
        
        <span
          className={`block h-0.5 w-full bg-purple-200 rounded-sm transition-all duration-300 hover:cursor-pointer ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          } group-hover:bg-black`}
        ></span>
        
        <span
          className={`block h-0.5 w-full bg-purple-200 rounded-sm transition-all duration-300 hover:cursor-pointer ${
            isOpen ? 'opacity-0' : ''
          } group-hover:bg-black`}
        ></span> 
        
        <span
          className={`block h-0.5 w-full bg-purple-200 rounded-sm transition-all duration-300 hover:cursor-pointer ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          } group-hover:bg-black`}
        ></span>
      </button>


      <div
        className={`absolute right-0 top-full mt-2 w-48 bg-purple-200 rounded-lg shadow-lg shadow-purple-900/50 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-60' : 'max-h-0'
        }`}
        style={{ zIndex: 40 }}
      >
        <div className="flex flex-col p-4 space-y-2 ">
          <a href="#" className="hover:font-bold hover:text-purple-700 transition  duration-300">Home</a>
          <a href="#" className="hover:font-bold hover:text-purple-700 transition duration-300">About</a>
          {/* <a href="#" className="hover:font-bold hover:text-purple-700 transition duration-300">Services</a>
          <a href="#" className="hover:font-bold hover:text-purple-700 transition duration-300">Contact</a> */}
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import newlogo from '@/assets/logo1.png';
import newlogo2 from '@/assets/logo2.png';

// Ensure this file is properly configured with your styles
import './Header.css';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();

  const hideNavLinks = pathname.startsWith('/signup') || pathname.startsWith('/login');

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-black border-b border-[#2e2e2e] md:px-8">
      {/* Logo Section */}
      <div
        className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
        onClick={() => router.push('/')}
      >
        <div className="flex items-center">
          <img src={newlogo?.src ?? newlogo} alt="Logo 1" className="h-6" />
        </div>
        <div className="flex items-center">
          <img src={newlogo2?.src ?? newlogo2} alt="Logo 2" className="h-6" />
        </div>
      </div>

      {/* Navigation Links - Hidden on specific pages */}
      {hideNavLinks && (
        <nav className="hidden md:flex gap-x-4">
          {['Home', 'Features', 'Pricing'].map((item) => {
            const href = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
            const isActive = pathname === href;

            return (
              <Link
                key={item}
                href={href}
                className={`w-24 h-9 font-['Barlow'] font-semibold text-base rounded-md text-white flex items-center justify-center hover:bg-[#262626] transition ${isActive ? 'bg-[#333333]' : ''}`}
              >
                {item}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 flex-shrink-0">
        <button className="hidden md:flex w-max px-4 h-9 rounded-md bg-[#00FFDD] text-black border border-black items-center justify-center hover:opacity-90 transition">
          <span className="font-['Barlow'] font-medium text-sm">
            Talk to Sales
          </span>
        </button>
        <button
          onClick={() => router.push('/login')}
          className="w-max px-4 h-9 rounded-md bg-transparent text-white border-[1.5px] border-[#333333] flex items-center justify-center hover:bg-[#42E6D1] hover:text-black hover:border-[#42E6D1]  hover:scale-105 transform transition-all duration-300 ease-out"
        >
          <span className="font-['Barlow'] font-medium text-sm">
            Login
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
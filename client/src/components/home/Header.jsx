import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import newlogo from '@/assets/logo1.png';
import newlogo2 from '@/assets/logo2.png';


import './Header.css'; // Make sure this import is included

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();

  const hideNavLinks = pathname.startsWith('/signup') || pathname.startsWith('/login');

  return (
<header className="flex justify-between items-center px-[-4px] py-3 bg-black border-b border-[#2e2e2e]">

      {/* Logo Section */}
      <div
        className="flex justify-start flex-1 pl-[40px] items-center space-x-10 cursor-pointer"
        onClick={() => router.push('/')}
      >
       <div className="flex items-center">
  <img
    src={newlogo?.src ?? newlogo}
    alt="Logo 1"
    className="custom-logo-class"
  />
</div>
<div className="flex items-center">
  <img
    src={newlogo2?.src ?? newlogo2}
    alt="Logo 1"
    className="custom-logo-class"
  />
</div>

      </div>

      {/* Navigation Links */}
      <div className="flex justify-center flex-1">
        {/*
          The condition hideNavLinks && ... means these NavLinks will ONLY be rendered
          if the path starts with /signup or /login.
          If you intend for these links to always show unless on /signup or /login,
          the condition should be !hideNavLinks.
          Based on the initial code, they are hidden when hideNavLinks is true.
        */}
        {hideNavLinks ? (
          <nav className="flex gap-x-4">
            {['Home', 'Features', 'Pricing'].map((item) => {
              const href = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={item}
                  href={href}
                  className={`w-[90px] h-[35px] font-['Barlow'] font-semibold text-[16px] leading-[150%] rounded-[5.08px] text-white flex items-center justify-center hover:bg-[#262626] ${isActive ? 'bg-[#333333]' : ''}`}
                >
                  {item}
                </Link>
              );
            })}
          </nav>
        ) : (
          <></>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end flex-1 pr-[20px] items-center">
        <button className="w-[100px] h-[33px] rounded-[9.38px] bg-[#00FFDD] text-black border border-black flex items-center justify-center hover:opacity-90 transition mr-[12px]">
          <span className="font-['Barlow'] font-medium text-[14px] leading-[150%]">
            Talk to Sales
          </span>
        </button>
        <button
          onClick={() => router.push('/login')}
          className="w-[100px] h-[33px] rounded-[9.38px] bg-transparent text-white border-[1.5px] flex items-center justify-center hover:bg-white hover:text-black transition duration-200"
          style={{ borderColor: '#333333' }}
        >
          <span className="font-['Barlow'] font-medium text-[14px] leading-[150%]">
            Login
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
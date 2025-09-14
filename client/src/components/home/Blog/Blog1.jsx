// import React, { useState } from 'react';
// import BgDecoration from '../../assets/BgDecoration.jpg';
// import Ellipse from '../../assets/Ellipse.png';
// import BlogLogo from '../../assets/BlogLogo.png';
// import GptImg from '../../assets/GptImg.png';
// import Icons4 from '../../assets/Icons4.png';
// import { FaChevronDown } from 'react-icons/fa';

// const Blog1 = () => {
//   const [dropdown, setDropdown] = useState({
//     agents: false,
//     solutions: false,
//     resources: false,
//   });

//   const toggleDropdown = (key) => {
//     setDropdown((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   return (
//     <div
//       style={{
//         width: '100vw',
//         minHeight: '100vh',
//         backgroundColor: '#000',
//         padding: '0',
//         position: 'relative',
//         overflow: 'hidden',
//         fontFamily: 'sans-serif',
//       }}
//     >
//       {/* Background Decoration */}
//       <img
//         src={BgDecoration}
//         alt="Background Decoration"
//         style={{
//           position: 'absolute',
//           width: '200px',
//           height: '200px',
//           objectFit: 'cover',
//           opacity: 1,
//           zIndex: 1,
//         }}
//       />

//       {/* Navbar */}
//       <div
//         style={{
//           position: 'relative', 
//           zIndex: 3,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: '20px 70px',
//           background: 'rgba(0, 0, 0, 0)',
//           color: 'white',
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
//             <img src={BlogLogo} alt="Logo" style={{ width: '32px', height: '32px' }} />
//             <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>ZenXai</span>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.95rem' }}>
//             <span style={{ cursor: 'pointer', color: '#fff' }}>Zenx Voice</span>
//             {['agents', 'solutions', 'resources'].map((key) => {
//               const label = {
//                 agents: 'Our AI Agents',
//                 solutions: 'Solutions',
//                 resources: 'Resources',
//               }[key];
//               return (
//                 <div key={key} style={{ position: 'relative' }}>
//                   <span
//                     onClick={() => toggleDropdown(key)}
//                     style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#fff' }}
//                   >
//                     {label} <FaChevronDown size={10} />
//                   </span>
//                   <div
//                     style={{
//                       position: 'absolute',
//                       top: '30px',
//                       left: 0,
//                       backgroundColor: '#111',
//                       padding: dropdown[key] ? '10px 20px' : '0 20px',
//                       borderRadius: '5px',
//                       overflow: 'hidden',
//                       maxHeight: dropdown[key] ? '100px' : '0px',
//                       opacity: dropdown[key] ? 1 : 0,
//                       transition: 'all 0.4s ease-in-out',
//                       zIndex: 10,
//                     }}
//                   >
//                     <p style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Coming soon</p>
//                   </div>
//                 </div>
//               );
//             })}
//             <span style={{ cursor: 'pointer', color: '#fff' }}>Pricing</span>
//           </div>
//         </div>

//         <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
//           <button
//             style={{
//               background: 'transparent',
//               color: 'white',
//               padding: '6px 20px',
//               fontSize: '0.85rem',
//               fontWeight: '600',
//               borderRadius: '14px',
//               border: 'none',
//               cursor: 'pointer',
//               height: '32px',
//             }}
//           >
//             Talk to Sales
//           </button>
//           <button
//             style={{
//               background: '#00FFD1',
//               color: '#000',
//               padding: '6px 20px',
//               fontSize: '0.85rem',
//               fontWeight: '600',
//               borderRadius: '14px',
//               border: 'none',
//               cursor: 'pointer',
//               height: '32px',
//             }}
//           >
//             Login
//           </button>
//         </div>
//       </div>

//       {/* Breadcrumb */}
//       <div
//         style={{
//           color: 'white',
//           fontSize: '14px',
//           margin: '40px 250px 10px',
//           fontWeight: 500,
//           zIndex: 3,
//           position: 'relative',
//         }}
//       >
//         <span style={{ color: '#00FFD1' }}>Home</span> / Introduction to chatgpt
//       </div>

//       {/* Banner */}
//       <div
//         style={{
//           maxWidth: '800px',
//           margin: '0 auto',
//           backgroundColor: '#1a1a1a',
//           borderRadius: '16px',
//           padding: '10px',
//           zIndex: 3,
//           position: 'relative',
//         }}
//       >
//         <img
//           src={GptImg}
//           alt="GPT Banner"
//           style={{
//             width: '100%',
//             borderRadius: '12px',
//             display: 'block',
//           }}
//         />
//       </div>

//       {/* Blog Content */}
//       <div
//         style={{
//           maxWidth: '800px',
//           margin: '20px auto',
//           color: '#fff',
//           padding: '0 10px 60px',
//           zIndex: 3,
//           position: 'relative',
//         }}
//       >
//         <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
//           Introduction to Chatgpt
//         </h1>
//         <p style={{ fontSize: '14px', color: '#00FFD1' }}>By Akash &nbsp; 02/06/25</p>
//         <p style={{ marginTop: '20px', fontSize: '16px' }}>
//           Artificial Intelligence (AI) has evolved significantly over the past decade...
//         </p>

//         <h3>What is ChatGPT?</h3>
//         <p>ChatGPT is an AI chatbot...</p>
//         <ul>
//           <li>Answer questions</li>
//           <li>Generate code or essays</li>
//           <li>Draft emails</li>
//           <li>Summarize information</li>
//           <li>Translate languages</li>
//           <li>Simulate human conversation</li>
//         </ul>

//         <h3>How Does ChatGPT Work?</h3>
//         <p>It processes text using tokens and predicts the next token...</p>
//         <ul>
//           <li>Grammar and syntax</li>
//           <li>Context and relevance</li>
//           <li>Reasoning and logic</li>
//         </ul>

//         <h3>Applications of ChatGPT</h3>
//         <p><strong>Use Cases:</strong> education, coding, content, social, etc.</p>

//         <h3>Why is ChatGPT Revolutionary?</h3>
//         <ul>
//           <li>Understands context</li>
//           <li>Multi-turn conversations</li>
//           <li>Creative outputs</li>
//           <li>Boosts productivity</li>
//         </ul>

//         <h3>Limitations</h3>
//         <ul>
//           <li>Outdated info possible</li>
//           <li>Doesn’t think or feel</li>
//           <li>May be biased or incorrect</li>
//         </ul>

//         <h3>Getting Started</h3>
//         <ul>
//           <li><a href="https://chat.openai.com" style={{ color: 'white' }}>ChatGPT by OpenAI</a></li>
//           <li>API and mobile apps</li>
//         </ul>

//         <h3>The Future</h3>
//         <p>With GPT-4.5 and GPT-5, ChatGPT will evolve further...</p>
//       </div>

//       {/* Footer */}
//       <div
//         style={{
//           width: '100%',
//           background: '#0b0b0b',
//           padding: '50px 70px 20px',
//           color: 'white',
//           position: 'relative',
//           zIndex: 2,
//         }}
//       >
//         <div
//           style={{
//             display: 'flex',
//             flexWrap: 'wrap',
//             justifyContent: 'space-between',
//             marginBottom: '40px',
//           }}
//         >
//           {/* Left Section */}
//           <div style={{ maxWidth: '280px' }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//               <img src={BlogLogo} alt="Logo" style={{ width: '36px' }} />
//               <span style={{ fontSize: '18px', fontWeight: 'bold' }}>ZenXai</span>
//             </div>
//             <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
//               <img src={Icons4} alt="Social Icons" style={{ width: '80px' }} />
//             </div>
//             <p style={{ fontWeight: 'bold' }}>Newsletter Sign Up*</p>
//             <div style={{ display: 'flex', marginTop: '10px' }}>
//               <input
//                 type="email"
//                 placeholder="Enter your email here..."
//                 style={{
//                   flex: 1,
//                   padding: '10px',
//                   borderRadius: '6px 0 0 6px',
//                   border: '1px solid #444',
//                   backgroundColor: '#000',
//                   color: 'white',
//                 }}
//               />
//               <button
//                 style={{
//                   backgroundColor: '#00FFD1',
//                   color: '#000',
//                   padding: '10px 20px',
//                   border: 'none',
//                   borderRadius: '0 6px 6px 0',
//                   cursor: 'pointer',
//                 }}
//               >
//                 Submit
//               </button>
//             </div>
//             <p style={{ fontSize: '12px', marginTop: '10px' }}>
//               *By submitting this form, you agree to our Privacy Policy.
//             </p>
//           </div>

//           {/* Right Columns */}
//           <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
//             <div>
//               <h4>Zenxai</h4>
//               <p>Product</p>
//               <p>Pricing</p>
//               <p>Talk to Sales</p>
//             </div>
//             <div>
//               <h4>Solutions</h4>
//               <p>Sales and Marketing</p>
//               <p>Human Resources</p>
//               <p>Finance</p>
//               <p>Operations</p>
//             </div>
//             <div>
//               <h4>Resources</h4>
//               <p>Community</p>
//               <p>Blog</p>
//               <p>Webinars</p>
//               <p>Tutorials</p>
//               <p>Affiliates</p>
//             </div>
//             <div>
//               <h4>Company</h4>
//               <p>About</p>
//               <p>Contact Us</p>
//               <p>Terms & Conditions</p>
//               <p>Privacy Policy</p>
//             </div>
//           </div>
//         </div>

//         {/* Footer Bottom */}
//         <div
//           style={{
//             borderTop: '1px solid #222',
//             paddingTop: '20px',
//             display: 'flex',
//             justifyContent: 'space-between',
//             flexWrap: 'wrap',
//           }}
//         >
//           <p style={{ fontSize: '13px' }}>© 2025 Zenxai. All rights reserved</p>
//           <img src={Icons4} alt="Social Icons" style={{ width: '120px' }} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Blog1;

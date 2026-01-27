import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Zap,
    ShieldCheck,
    PhoneCall,
    Settings2,
    ArrowRight,
    Star,
    TrendingUp,
    Globe2,
    Mic2,
    BarChart3,
    Lock,
    Palette,
    Users,
    DollarSign,
    Database,
    Clock,
    Headphones,
    Share2,
    CreditCard,
    Calendar,
    Stethoscope,
    Home,
    Scale,
    ShoppingBag,
    Briefcase,
    Building2,
    LayoutGrid,
    Activity,
    Shield
} from 'lucide-react';

const Partner = () => {
    const [activeModel, setActiveModel] = useState(0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const hoverCardVariants = {
        initial: { y: 0, opacity: 1 },
        hover: {
            y: -8,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute top-1/2 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
                />
            </div>

            {/* Hero Section */}
            <section className="relative z-10 min-h-screen flex items-center justify-center py-10">
                <div className="w-[90%] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="inline-block mb-4"
                        >

                        </motion.div>

                        <h1 className="text-[6.5rem] md:text-[8rem] lg:text-[9rem] font-black mb-6 max-w-8xl leading-[1.05] tracking-tight">
                            Own Your
                            <br />
                            <motion.span
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] bg-clip-text text-transparent inline-block"
                            >
                                Voice AI Business
                            </motion.span>
                        </h1>


                        <p className="text-xl md:text-2xl text-gray-300 max-w-8xl mx-auto mb-8 leading-relaxed font-light">
                            Launch enterprise-grade voice automation under your brand. Keep customers,
                            <br />
                            own relationships, and build recurring revenue streams.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            {/* Explore Partnership */}
                            <a
                                href="https://moanalisha.fillout.com/11-with-monalisha"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold rounded-xl flex items-center gap-2 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 text-lg"
                                >
                                    Explore Partnership
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </motion.button>
                            </a>

                            {/* Watch Demo */}
                            <motion.a
                                href="https://voice.zenxai.io/login"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 border border-emerald-500/50 text-emerald-300 font-semibold rounded-xl hover:bg-emerald-500/10 transition-all duration-300 backdrop-blur inline-flex items-center justify-center cursor-pointer"
                            >
                                Watch Demo
                            </motion.a>
                        </motion.div>

                    </motion.div>




                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="mt-12 md:mt-16 w-full max-w-3xl mx-auto flex flex-col items-center gap-4"
                    >
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                            ))}
                        </div>
                        <p className="text-gray-300 text-lg md:text-xl italic font-light">
                            "The most reliable voice AI infrastructure we've built on."
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-semibold text-white">Trusted by 200+ Enterprise Partners</span>
                        </div>
                    </motion.div>



                </div>
            </section >

            {/* Stats Section */}
            < section className="relative z-10 py-10 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { icon: TrendingUp, number: "70%", label: "Cost Savings", subtext: "On customer support" },
                            { icon: Zap, number: "24/7", label: "Always Active", subtext: "Unlimited conversations" },
                            { icon: Globe2, number: "5x", label: "Faster Scaling", subtext: "Minutes to deploy" },
                            { icon: BarChart3, number: "60%", label: "Higher Margins", subtext: "SaaS economics" }
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                    className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 backdrop-blur"
                                >
                                    <Icon className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                                    <div className="text-5xl font-black text-emerald-400 mb-2">{stat.number}</div>
                                    <div className="font-bold text-white mb-1">{stat.label}</div>
                                    <div className="text-sm text-gray-400">{stat.subtext}</div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section >

            {/* Platform Overview */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="grid lg:grid-cols-2 gap-12 items-center"
                    >
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <h2 className="text-5xl md:text-6xl font-black mb-6">
                                Complete
                                <br />
                                Platform
                            </h2>
                            <p className="text-lg text-gray-300 mb-8">
                                ZenVoice delivers everything needed to build enterprise voice AI—no infrastructure or models to manage.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: Mic2, title: "Intelligent Voice Recognition", desc: "Intent, context, and nuance in real-time" },
                                    { icon: Zap, title: "Advanced Language Models", desc: "Deep contextual understanding & conversations" },
                                    { icon: Globe2, title: "Natural Voice Synthesis", desc: "Human-like voices that feel genuine" },
                                    { icon: BarChart3, title: "Smart Workflows", desc: "Auto CRM updates, integrations & actions" }
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        variants={itemVariants}
                                        whileHover={{ x: 10, transition: { duration: 0.2 } }}
                                        className="flex gap-4 group cursor-pointer"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/40 transition-colors duration-300">
                                                <feature.icon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors duration-300">{feature.title}</h4>
                                            <p className="text-gray-400 text-sm">{feature.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl animate-pulse" />
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-10 backdrop-blur-xl">
                                {[
                                    { label: "Your Brand", Icon: Palette, text: "Full control over logos, colors & messaging" },
                                    { label: "Your Customers", Icon: Users, text: "Direct relationships & data ownership" },
                                    { label: "Your Revenue", Icon: DollarSign, text: "Set pricing, keep margins, build value" }
                                ].map((item, i) => {
                                    const ItemIcon = item.Icon;
                                    return (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                            className={`mb-6 p-4 -mx-4 rounded-xl transition-colors ${i < 2 ? 'border-b border-white/10' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                    <ItemIcon className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">{item.label}</span>
                                            </div>
                                            <p className="text-gray-300">{item.text}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section >

            {/* Capabilities */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    {/* Add overflow-hidden to prevent scrollbar flicker if headings scale */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-5xl md:text-6xl font-black">
                            Powerful
                            <span className="text-emerald-400 ml-4">Capabilities</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {[
                            {
                                icon: PhoneCall,
                                title: "Voice Automation",
                                items: ["Inbound customer support", "Outbound campaigns", "Multi-language support", "Context-aware conversations"]
                            },
                            {
                                icon: Zap,
                                title: "Workflow Actions",
                                items: ["Automatic CRM creation", "Real-time booking", "Custom integrations", "Database updates"]
                            }
                        ].map((cap, i) => {
                            const Icon = cap.icon;
                            return (
                                <motion.div
                                    key={i}
                                    variants={itemVariants}
                                    whileHover={{ y: -10 }}
                                    className="group bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/40 transition-colors duration-300">
                                            <Icon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                        <h3 className="text-2xl font-bold">{cap.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {cap.items.map((item, j) => (
                                            <li key={j} className="flex gap-3 text-gray-300">
                                                <span className="text-emerald-400 font-bold flex-shrink-0">→</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section >

            {/* Pricing Models */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-4">
                            Seamless
                            <br />
                            <span className="text-emerald-400">Integrations</span>
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Connect ZenVoice with the tools your customers already use.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { icon: Database, category: "CRM", tools: "Salesforce, HubSpot, Zoho" },
                            { icon: CreditCard, category: "Payments", tools: "Stripe, PayPal, Square" },
                            { icon: Calendar, category: "Scheduling", tools: "Cal.com, Calendly, G-Cal" },
                            { icon: Share2, category: "Communication", tools: "Slack, Discord, Teams" },
                            { icon: LayoutGrid, category: "Project Mgmt", tools: "Monday, Asana, Jira" },
                            { icon: Building2, category: "Property", tools: "Yardi, AppFolio, Buildium" },
                            { icon: Stethoscope, category: "EHR", tools: "Epic, Cerner, Athena" },
                            { icon: ShoppingBag, category: "E-commerce", tools: "Shopify, WooCommerce, Wix" }
                        ].map((integration, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.6)" }}
                                className="group p-5 bg-black/40 border border-white/10 rounded-xl hover:border-emerald-500/50 transition-all text-center cursor-default"
                            >
                                <div className="w-10 h-10 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                                    <integration.icon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-white font-bold mb-1">{integration.category}</h3>
                                <p className="text-[10px] text-gray-500">{integration.tools}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section >

            {/* Detailed Use Cases */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-4">
                            Industry
                            <br />
                            <span className="text-cyan-400">Solutions</span>
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Tailored voice AI workflows for high-value sectors.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Stethoscope,
                                title: "Healthcare",
                                color: "emerald",
                                description: "Automate patient intake, appointment reminders, and pre-op instructions while maintaining HIPAA compliance.",
                                outcome: "Reduce no-shows by 40%"
                            },
                            {
                                icon: Home,
                                title: "Real Estate",
                                color: "cyan",
                                description: "Qualify leads instantly, schedule property tours 24/7, and answer common property questions.",
                                outcome: "2x more qualified showings"
                            },
                            {
                                icon: Scale,
                                title: "Legal Services",
                                color: "emerald",
                                description: "Handle client intake, case status updates, and consultation scheduling without billable hour interruption.",
                                outcome: "Save 15 admin hours/week"
                            },
                            {
                                icon: ShoppingBag,
                                title: "Retail & E-comm",
                                color: "cyan",
                                description: "Manage order tracking, returns, and product FAQs during peak seasons without hiring temp staff.",
                                outcome: "Zero hold times during peaks"
                            }
                        ].map((useCase, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -10, boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)" }}
                                className={`group relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-${useCase.color}-500/50 transition-all`}
                            >
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500`}>
                                    <useCase.icon className={`w-24 h-24 text-${useCase.color}-500 group-hover:scale-110 transition-transform duration-500`} />
                                </div>

                                <div className={`w-12 h-12 bg-${useCase.color}-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <useCase.icon className={`w-6 h-6 text-${useCase.color}-400`} />
                                </div>

                                <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                                <p className="text-gray-400 mb-4 leading-relaxed relative z-10 text-sm">
                                    {useCase.description}
                                </p>

                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${useCase.color}-500/10 border border-${useCase.color}-500/20 group-hover:bg-${useCase.color}-500/20 transition-colors`}>
                                    <TrendingUp className={`w-3 h-3 text-${useCase.color}-400`} />
                                    <span className={`text-${useCase.color}-300 text-xs font-semibold`}>{useCase.outcome}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section >

            {/* Pricing Models */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-4">
                            Flexible
                            <br />
                            <span className="text-emerald-400">Business Models</span>
                        </h2>
                        <p className="text-lg text-gray-400">Choose the model that fits your strategy</p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {[
                            {
                                title: "Revenue Share",
                                desc: "Grow together",
                                items: ["No upfront investment", "Shared success", "We support growth", "Aligned incentives"]
                            },
                            {
                                title: "Platform License",
                                desc: "Stay independent",
                                items: ["Fixed monthly fee", "Keep 100% revenue", "Self-operated", "Enterprise support"]
                            },
                            {
                                title: "Usage Based",
                                desc: "Scale freely",
                                items: ["Pay per call minute", "Zero lock-in", "Transparent pricing", "No hidden fees"]
                            }
                        ].map((model, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                onHoverStart={() => setActiveModel(i)}
                                className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${activeModel === i
                                    ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/50'
                                    : 'bg-white/5 border-white/10'
                                    } border group hover:border-emerald-500/50`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
                                <div className="relative">
                                    <h3 className="text-xl font-black mb-1">{model.title}</h3>
                                    <p className="text-emerald-400 text-sm font-semibold mb-6">{model.desc}</p>
                                    <ul className="space-y-2">
                                        {model.items.map((item, j) => (
                                            <li key={j} className="flex gap-2 text-gray-300 text-sm">
                                                <span className="text-emerald-400 font-bold">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section >

            {/* Partnership Structure */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-6xl font-black text-center mb-10"
                    >
                        How It Works
                    </motion.h2>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "We Provide",
                                color: "emerald",
                                items: ["AI & Voice Infrastructure", "Platform Security", "System Reliability", "Product Updates", "Telephony Network", "Compliance & Standards"]
                            },
                            {
                                icon: Settings2,
                                title: "You Control",
                                color: "cyan",
                                items: ["Brand & Design", "Pricing Strategy", "Sales & Marketing", "Customer Support", "Customer Relationships", "Business Direction"]
                            }
                        ].map((section, i) => {
                            const Icon = section.icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: i === 0 ? -40 : 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    whileHover={{ scale: 1.02 }}
                                    className={`bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-${section.color}-500/50 hover:bg-${section.color}-500/5 transition-all`}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`p-3 bg-${section.color}-500/20 rounded-xl`}>
                                            <Icon className={`w-6 h-6 text-${section.color}-400`} />
                                        </div>
                                        <h3 className="text-2xl font-bold">{section.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {section.items.map((item, j) => (
                                            <li key={j} className="flex gap-3 text-gray-300">
                                                <span className={`text-${section.color}-400 font-bold`}>•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section >

            {/* Testimonial */}
            < section className="relative z-10 py-12 px-6" >
                <div className="w-4/5 mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/50 rounded-3xl p-8 md:p-12 text-center backdrop-blur"
                    >
                        <div className="flex justify-center gap-1 mb-6">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-6 h-6 text-emerald-400 fill-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                        <p className="text-xl md:text-2xl font-light mb-6 leading-relaxed">
                            "ZenVoice let us launch in weeks. The white-label setup is seamless, and our customers never know it's not our own technology."
                        </p>
                    </motion.div>
                </div>
            </section >

            {/* Final CTA */}
            <section className="relative z-10 py-12 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-4/5 mx-auto"
                >
                    <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 rounded-3xl p-10 md:p-14 text-center overflow-hidden relative group">
                        <div className="absolute inset-0 opacity-20">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full filter blur-3xl"
                            />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-black mb-4">
                                Ready to Launch?
                            </h2>

                            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                                Join forward-thinking partners building the future of customer communication.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                                {/* Start Application */}
                                <a
                                    href="https://voice.zenxai.io/login"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-black/80 transition-all text-lg"
                                    >
                                        Start Application
                                    </motion.button>
                                </a>

                                {/* Schedule Call */}
                                <a
                                    href="https://moanalisha.fillout.com/11-with-monalisha"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05,
                                            backgroundColor: "rgba(255,255,255,0.1)",
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-8 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all text-lg"
                                    >
                                        Schedule Call
                                    </motion.button>
                                </a>

                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>


            {/* Footer */}
            < footer className="relative z-10 py-8 px-6 border-t border-white/10" >
                <div className="w-4/5 mx-auto text-center text-gray-500 text-sm">
                    <p>© 2026 ZenVoice AI. Intelligent voice automation at scale.</p>
                </div>
            </footer >
        </div >
    );
};

export default Partner;
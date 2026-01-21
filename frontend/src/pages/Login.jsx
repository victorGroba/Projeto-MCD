import React, { useState, useEffect } from "react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Lock, User, Eye, EyeOff, ArrowRight, X as CloseIcon, Menu,
  BarChart3, TrendingUp, Zap, Users, CheckCircle2, Star,
  Upload, Settings, LayoutDashboard, ChevronDown, ChevronUp,
  ShieldCheck, HelpCircle, Mail, Phone, MapPin, FileSpreadsheet,
  PieChart
} from "lucide-react";
import logo from '../assets/logo.png';

// --- COMPONENTE PRINCIPAL: LANDING PAGE ---
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Efeito Scroll Navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="font-sans text-slate-300 bg-[#0B0F19] overflow-x-hidden selection:bg-blue-500 selection:text-white">
      
      {/* ================= NAVBAR ================= */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
               <img src={logo} alt="Qualiview" className="w-6 h-6 object-contain brightness-0 invert" 
                    onError={(e) => {e.target.style.display='none'; e.target.parentElement.innerHTML='<svg class="text-white w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'}} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Quali<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">View</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {["Solução", "Benefícios", "Depoimentos", "Planos"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="text-white font-medium text-sm hover:text-blue-400 transition-colors"
            >
              Área do Cliente
            </button>
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transform hover:-translate-y-0.5"
            >
              Acessar Painel
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <CloseIcon /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-[#0B0F19] border-t border-white/5 p-6 flex flex-col gap-4 shadow-2xl">
            {["Solução", "Benefícios", "Depoimentos", "Planos"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white">
                {item}
              </a>
            ))}
            <hr className="border-white/5 my-2"/>
            <button onClick={() => {setIsLoginOpen(true); setIsMobileMenuOpen(false)}} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">
              Acessar Sistema
            </button>
          </div>
        )}
      </nav>

      {/* ================= HERO SECTION ================= */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] opacity-50"></div>
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-down">
            <Zap className="w-3 h-3 fill-current" />
            <span>Dados Transformados em Ação</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight animate-fade-in-up">
            Suas Planilhas contam histórias.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 animate-gradient">
              Nós damos o Final Feliz.
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-fade-in-up animation-delay-200">
            Chega de perder tempo configurando gráficos. Nossa equipe prepara o ambiente ideal para o seu negócio. Você apenas alimenta os dados e toma as decisões.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Visualizar Meus Dados <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 backdrop-blur-md transition-all">
              Agendar Apresentação
            </button>
          </div>

          <p className="mt-8 text-sm text-slate-500 animate-fade-in-up animation-delay-500">
            <strong className="text-white">Setup personalizado</strong> pela nossa equipe de especialistas.
          </p>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-16 relative rounded-2xl border border-white/10 bg-[#131825] shadow-2xl overflow-hidden animate-fade-in-up animation-delay-500 group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent z-10 opacity-50"></div>
            <img 
              src="https://github.com/victorGroba/Qualiview-assets/blob/main/visao-geral.png?raw=true" 
              alt="Dashboard Preview" 
              className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.01] transition-transform duration-700"
            />
          </div>
        </div>
      </header>

      {/* ================= FUNCIONALIDADES ================= */}
      <section id="solucao" className="py-24 bg-[#0F131F] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sua Visão Gerencial Ampliada</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Uma plataforma robusta preparada para receber seus dados operacionais.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<BarChart3 className="text-blue-400" />} title="Dashboards Personalizados" desc="Gráficos desenhados especificamente para os KPIs que importam para o seu negócio." />
            <FeatureCard icon={<FileSpreadsheet className="text-emerald-400" />} title="Integração Simples" desc="Sua equipe continua usando as planilhas que já conhece. Nós fazemos a mágica visual." />
            <FeatureCard icon={<PieChart className="text-amber-400" />} title="Visão 360º" desc="Centralize vendas, operações e financeiro em uma única tela de comando." />
            <FeatureCard icon={<Users className="text-purple-400" />} title="Acesso Controlado" desc="Defina quem vê o quê. Permissões granulares para gestores e analistas." />
            <FeatureCard icon={<CheckCircle2 className="text-cyan-400" />} title="Relatórios Executivos" desc="Exporte visões macro para reuniões de diretoria com qualidade visual impecável." />
            <FeatureCard icon={<Star className="text-yellow-400" />} title="Setup Consultivo" desc="Não é self-service. Nossa equipe entende sua dor e configura tudo para você." />
          </div>
        </div>
      </section>

      {/* ================= TRANSFORMAÇÃO (BENEFÍCIOS) ================= */}
      <section id="beneficios" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase mb-6">Foco no Resultado</div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Você envia os dados. <br/> <span className="text-blue-500">Nós entregamos a estratégia.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Muitos sistemas exigem que você aprenda a programar ou configurar. O QualiView é diferente. Nós fazemos o "branding" e o alinhamento inicial. Sua única tarefa é manter a operação rodando.
              </p>
              
              <ul className="space-y-6">
                <BenefitItem text="Implantação guiada por especialistas." />
                <BenefitItem text="Interface limpa com a identidade da sua empresa." />
                <BenefitItem text="Identifique gargalos operacionais rapidamente." />
                <BenefitItem text="Tome decisões baseadas em dados, não em 'achismos'." />
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl rotate-3 opacity-10 blur-2xl"></div>
              <div className="relative rounded-2xl bg-[#131825] border border-white/10 p-2 shadow-2xl">
                 <img 
                   src="https://github.com/victorGroba/Qualiview-assets/blob/main/visao-geral.png?raw=true" 
                   alt="Transformação de Dados" 
                   className="rounded-xl opacity-90"
                 />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ESTATÍSTICAS ================= */}
      <section className="py-16 bg-blue-600/5 border-y border-blue-500/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="+200" label="Projetos Entregues" />
            <StatItem number="100%" label="Personalização" />
            <StatItem number="10x" label="Agilidade na Análise" />
            <StatItem number="24/7" label="Disponibilidade" />
          </div>
        </div>
      </section>

      {/* ================= COMO FUNCIONA (FLUXO) ================= */}
      <section className="py-24 bg-[#0F131F] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simples em 3 Etapas</h2>
            <p className="text-slate-400">Sem configurações complexas por parte do cliente.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-center relative">
            {/* Linha conectora (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0"></div>

            <StepCard 
              icon={<Settings className="w-6 h-6" />} 
              step="1" 
              title="Setup & Branding" 
              desc="Nossa equipe alinha seus objetivos e configura o sistema com a sua identidade visual e regras." 
            />
            <StepCard 
              icon={<Upload className="w-6 h-6" />} 
              step="2" 
              title="Input de Dados" 
              desc="Você sobe a planilha padrão ou preenche os dados diretamente no sistema. Rápido e fácil." 
            />
            <StepCard 
              icon={<TrendingUp className="w-6 h-6" />} 
              step="3" 
              title="Insights Prontos" 
              desc="Visualize imediatamente os resultados. Gráficos interativos para apoiar suas decisões." 
            />
          </div>
        </div>
      </section>

      {/* ================= DEPOIMENTOS ================= */}
      <section id="depoimentos" className="py-24 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Parceiros que Confiam</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard 
              name="Roberto Almeida" 
              role="Diretor Operacional" 
              text="O diferencial foi a configuração feita pela equipe da QualiView. Entregaram o sistema pronto, só precisei logar e usar."
            />
            <TestimonialCard 
              name="Fernanda Lima" 
              role="Gerente de Vendas" 
              text="Substituímos reuniões de 2 horas por uma olhada de 5 minutos no dashboard. A visualização é incrivelmente clara."
            />
            <TestimonialCard 
              name="Ricardo Souza" 
              role="CEO - Logistics" 
              text="Transformaram nossas planilhas chatas em uma central de comando profissional. O branding ficou perfeito."
            />
          </div>
        </div>
      </section>

      {/* ================= PREÇOS / PLANOS ================= */}
      <section id="planos" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Investimento Estratégico</h2>
            <p className="text-slate-400">Planos adaptados ao tamanho da sua operação.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Starter" 
              price="Consultar" 
              desc="Para pequenas operações" 
              features={["Setup inicial incluso", "Até 3 Dashboards", "2 Usuários", "Atualização semanal"]} 
            />
            <PricingCard 
              title="Business" 
              price="Consultar" 
              desc="Para empresas em expansão" 
              features={["Setup Personalizado Avançado", "Dashboards Ilimitados", "10 Usuários", "Atualização diária"]} 
              popular 
            />
            <PricingCard 
              title="Enterprise" 
              price="Consultar" 
              desc="Para grandes volumes" 
              features={["API Dedicada", "Ambiente Exclusivo", "Usuários Ilimitados", "Gerente de conta"]} 
            />
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="py-24 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-[#0B0F19] pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sua empresa merece clareza.</h2>
          <p className="text-xl text-slate-400 mb-10">
            Agende uma conversa com nossos consultores para alinharmos o setup do seu ambiente QualiView.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => setIsLoginOpen(true)} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1">
              Falar com Consultor
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="pt-20 pb-10 px-6 border-t border-white/5 bg-[#020617]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <span className="text-2xl font-bold text-white">Quali<span className="text-blue-500">View</span></span>
              <p className="text-slate-500 text-sm mt-4">
                Inteligência de dados aplicada ao seu negócio. Transformamos complexidade em visualização.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Cases</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Institucional</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2"><Mail size={14}/> contato@qualiview.com</li>
                <li className="flex items-center gap-2"><Phone size={14}/> (11) 99999-9999</li>
                <li className="flex items-center gap-2"><MapPin size={14}/> São Paulo, SP</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>© 2025 Qualiview. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacidade</a>
              <a href="#" className="hover:text-white">Termos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= LOGIN MODAL ================= */}
      {isLoginOpen && (
        <LoginModal onClose={() => setIsLoginOpen(false)} />
      )}

      {/* STYLES */}
      <style>{`
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out backwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-gradient { background-size: 200% auto; animation: gradient 4s linear infinite; }
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-2xl bg-[#131825] border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 group">
      <div className="mb-4 p-3 bg-white/5 rounded-xl inline-flex text-white group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function BenefitItem({ text }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 p-0.5 bg-green-500/20 rounded-full">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      </div>
      <span className="text-slate-300">{text}</span>
    </li>
  );
}

function StatItem({ number, label }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">{number}</div>
      <div className="text-sm font-medium text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function TestimonialCard({ name, role, text }) {
  return (
    <div className="p-6 rounded-2xl bg-[#131825] border border-white/5">
      <div className="flex gap-1 text-yellow-500 mb-4">
        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="text-slate-300 text-sm italic mb-6">"{text}"</p>
      <div>
        <p className="font-bold text-white">{name}</p>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  );
}

function StepCard({ icon, step, title, desc }) {
  return (
    <div className="relative p-6 group">
      <div className="w-16 h-16 mx-auto bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20 relative z-10 transition-transform group-hover:scale-110">
        {icon}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-[#0F131F]">
          {step}
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
    </div>
  );
}

function PricingCard({ title, price, desc, features, popular }) {
  return (
    <div className={`p-8 rounded-3xl border flex flex-col relative ${popular ? 'bg-[#131825] border-blue-500/50 shadow-2xl shadow-blue-900/20 scale-105 z-10' : 'bg-[#0B0F19] border-white/5'}`}>
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
          Recomendado
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-slate-400 text-sm mb-4">{desc}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{price}</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feat, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            {feat}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${popular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
        Falar com Vendas
      </button>
    </div>
  );
}

// --- LOGIN MODAL ---
function LoginModal({ onClose }) {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await login(username, password);
    if (!res.success) {
      setError(res.message);
      return;
    }
    onClose();
    navigate("/home"); 
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[420px] bg-[#131825] border border-white/10 rounded-2xl p-8 shadow-2xl relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-full transition-colors">
          <CloseIcon className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
             <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Acessar QualiView</h2>
          <p className="text-slate-400 text-sm mt-1">Sua central de decisão está pronta.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <span className="text-red-400 font-bold">!</span>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail ou Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Senha</label>
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Esqueceu?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 bg-[#0B0F19] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? "Autenticando..." : (
              <>
                Entrar no Painel <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-500">
          Protegido por SSL de 256-bits.
        </div>
      </div>
    </div>
  );
}
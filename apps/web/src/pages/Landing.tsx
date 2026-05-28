import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import DashboardMockup from '../components/landing/DashboardMockup';
import MetricsGrid from '../components/landing/MetricsGrid';
import WorkflowGrid from '../components/landing/WorkflowGrid';
import MidBanner from '../components/landing/MidBanner';
import PortfolioMatrix from '../components/landing/PortfolioMatrix';
import PromptTicker from '../components/landing/PromptTicker';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import PageMeta from '../components/PageMeta';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <PageMeta
        title="AI Voice Sales Engineer for B2B Discovery Calls"
        description="DealPilot AI joins live sales calls, qualifies prospects through voice conversation, answers technical questions, and generates CRM-ready handoffs automatically."
        path="/"
      />
      <header><Navbar /></header>
      <main>
        <Hero />
        <DashboardMockup />
        <article><MetricsGrid /></article>
        <article><WorkflowGrid /></article>
        <aside><MidBanner /></aside>
        <article><PortfolioMatrix /></article>
        <PromptTicker />
        <article><Testimonials /></article>
        <article><FAQ /></article>
      </main>
      <Footer />
    </div>
  );
}

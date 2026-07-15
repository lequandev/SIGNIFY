import React, { useId, useEffect } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  Cpu,
  Globe,
  MessageSquare,
  Shield,
  Zap,
  HandMetal,
  CheckCircle2,
  Star,
  Camera,
  Sparkles,
  Heart,
  Users,
  Clock,
  ChevronRight,
  Play,
} from "lucide-react";

// ─── Google Fonts injection ───────────────────────────────────────────────────

const FontLoader: React.FC = () => {
  useEffect(() => {
    const id = "signify-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

interface Step {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating: number;
  initials: string;
}

// ─── Data (Vietnamese) ────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    icon: <Cpu aria-hidden="true" className="w-6 h-6" />,
    title: "Dịch Thuật AI Thời Gian Thực",
    description:
      "Mạng nơ-ron tiên tiến dịch ngôn ngữ ký hiệu sang văn bản và giọng nói với độ trễ dưới 100ms.",
    accent: "from-blue-500 to-blue-700",
  },
  {
    icon: <Globe aria-hidden="true" className="w-6 h-6" />,
    title: "Hỗ Trợ Đa Ngôn Ngữ Ký Hiệu",
    description:
      "ASL, BSL, VSL và hàng chục ngôn ngữ ký hiệu vùng miền — tất cả trên một nền tảng duy nhất.",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    icon: <MessageSquare aria-hidden="true" className="w-6 h-6" />,
    title: "Giao Tiếp Hai Chiều",
    description:
      "Người dùng ngôn ngữ ký hiệu và không ký hiệu có thể trò chuyện tự nhiên, không rào cản.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    icon: <Shield aria-hidden="true" className="w-6 h-6" />,
    title: "Bảo Mật Tuyệt Đối",
    description:
      "Video được xử lý hoàn toàn trên thiết bị. Không có dữ liệu nào rời thiết bị khi chưa có sự đồng ý.",
    accent: "from-emerald-500 to-teal-500",
  },
];

const STEPS: Step[] = [
  {
    step: "01",
    title: "Mở Ứng Dụng",
    description:
      "Không cần cài đặt phức tạp. Chỉ cần cấp quyền camera và bạn đã sẵn sàng giao tiếp ngay lập tức.",
    icon: <Camera className="w-5 h-5" />,
  },
  {
    step: "02",
    title: "Ra Hiệu Tự Nhiên",
    description:
      "AI của chúng tôi đọc cử chỉ tay theo thời gian thực — không cần găng tay hay thiết bị đặc biệt.",
    icon: <HandMetal className="w-5 h-5" />,
  },
  {
    step: "03",
    title: "Nhận Bản Dịch Ngay",
    description:
      "Văn bản hoặc giọng nói được dịch xuất hiện tức thì trên màn hình để người đối diện đọc và hiểu.",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

const STATS: Stat[] = [
  {
    value: "98%",
    label: "Độ chính xác dịch thuật",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    value: "<100ms",
    label: "Độ trễ xử lý",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    value: "30+",
    label: "Phương ngữ ký hiệu",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    value: "50k+",
    label: "Người dùng đang hoạt động",
    icon: <Users className="w-5 h-5" />,
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Signify đã thay đổi hoàn toàn cách tôi làm việc với đồng nghiệp mỗi ngày. Ứng dụng mượt mà và cực kỳ chính xác, tôi không còn cảm thấy bị cô lập nữa.",
    author: "Nguyễn Minh Anh",
    role: "Kỹ sư phần mềm khiếm thính",
    rating: 5,
    initials: "MA",
  },
  {
    quote:
      "Chúng tôi tích hợp Signify vào bộ phận hỗ trợ khách hàng và thấy mức độ hài lòng của khách hàng khiếm thính tăng 40%. Đây là bước ngoặt thực sự.",
    author: "Trần Đức Minh",
    role: "Trưởng sản phẩm tại TechCorp",
    rating: 5,
    initials: "DM",
  },
  {
    quote:
      "Tốc độ dịch thuật đủ nhanh để duy trì cuộc trò chuyện thực sự. Lần đầu tiên trong nhiều năm, tôi cảm thấy mình thực sự được lắng nghe.",
    author: "Lê Lan Phương",
    role: "Sinh viên & người học ASL",
    rating: 5,
    initials: "LP",
  },
];

const BENEFITS = [
  "Không cần thẻ tín dụng",
  "Gói miễn phí có sẵn",
  "Hủy bất cứ lúc nào",
];

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
  }),
};

// ─── Shared UI ─────────────────────────────────────────────────────────────────

const BadgeLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="lp-badge">
    <Zap aria-hidden="true" className="w-3.5 h-3.5" />
    {children}
  </span>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div
    role="img"
    aria-label={`${rating} trên 5 sao`}
    className="flex items-center gap-0.5"
  >
    {Array.from({ length: rating }).map((_, i) => (
      <Star
        key={i}
        aria-hidden="true"
        className="w-4 h-4 fill-amber-400 text-amber-400"
      />
    ))}
  </div>
);

// ─── Decorative Background Orbs ──────────────────────────────────────────────

const OrbDecor: React.FC = () => (
  <div aria-hidden="true" className="lp-orbs-container">
    <div className="lp-orb lp-orb-1" />
    <div className="lp-orb lp-orb-2" />
    <div className="lp-orb lp-orb-3" />
  </div>
);

// ─── Section: Hero ─────────────────────────────────────────────────────────────

interface HeroProps {
  isAuthenticated: boolean;
  headingId: string;
}

const HeroSection: React.FC<HeroProps> = ({ isAuthenticated, headingId }) => {
  const prefersReduced = useReducedMotion();

  return (
    <section
      aria-labelledby={headingId}
      className="lp-hero"
    >
      <OrbDecor />

      <div className="lp-container lp-hero-grid">
        {/* Copy */}
        <motion.div
          className="lp-hero-copy"
          initial={prefersReduced ? false : "hidden"}
          animate="visible"
          variants={fadeUp}
        >
          <BadgeLabel>Được hỗ trợ bởi AI thế hệ mới</BadgeLabel>

          <h1 id={headingId} className="lp-hero-title">
            Phá Vỡ Rào Cản,{" "}
            <span className="lp-gradient-text">
              Kết Nối Bằng Ngôn Ngữ Ký Hiệu AI
            </span>
          </h1>

          <p className="lp-hero-desc">
            Signify ứng dụng thị giác máy tính và mạng nơ-ron tiên tiến để dịch
            ngôn ngữ ký hiệu tức thì — giúp cộng đồng người khiếm thính giao
            tiếp tự do và tự tin với thế giới xung quanh.
          </p>

          <div className="lp-hero-actions">
            <Link
              to={isAuthenticated ? "/translate" : "/register"}
              className="lp-btn-primary"
              id="hero-cta-primary"
            >
              {isAuthenticated ? "Mở Trình Dịch" : "Bắt đầu miễn phí"}
              <ArrowRight aria-hidden="true" className="w-5 h-5 lp-btn-arrow" />
            </Link>

            <Link
              to="/packages"
              className="lp-btn-ghost"
              id="hero-cta-secondary"
            >
              <Play aria-hidden="true" className="w-4 h-4" />
              Xem Demo
            </Link>
          </div>

          {/* Trust micro-signals */}
          <div className="lp-hero-trust">
            <div className="lp-trust-avatars" aria-hidden="true">
              {["MA", "DM", "LP"].map((initials) => (
                <span key={initials} className="lp-avatar">
                  {initials}
                </span>
              ))}
            </div>
            <p className="lp-trust-text">
              Tham gia cùng <strong>50,000+</strong> người dùng đang kết nối mỗi ngày
            </p>
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          aria-hidden="true"
          className="lp-hero-visual-wrap"
          initial={prefersReduced ? false : { opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.18, ease: "easeOut" }}
        >
          {/* Main mock screen */}
          <div className="lp-hero-screen">
            <div className="lp-screen-topbar">
              <span className="lp-screen-dot lp-dot-red" />
              <span className="lp-screen-dot lp-dot-yellow" />
              <span className="lp-screen-dot lp-dot-green" />
              <span className="lp-screen-title">Signify — Dịch Thuật Trực Tiếp</span>
            </div>

            <div className="lp-screen-body">
              {/* Camera feed mockup */}
              <div className="lp-camera-feed">
                <HandMetal className="w-20 h-20 text-white/20" />
                <div className="lp-hand-scan-ring" />
              </div>

              {/* Live translation card */}
              <div className="lp-glass-card lp-live-card">
                <div className="lp-live-indicator">
                  <span className="lp-ping-dot">
                    <span className="lp-ping-ring" />
                    <span className="lp-ping-core" />
                  </span>
                  <span className="lp-live-label">AI đang hoạt động</span>
                </div>
                <p className="lp-live-text">"Xin chào, bạn có khỏe không?"</p>
                <div className="lp-confidence-bar">
                  <div className="lp-confidence-fill" style={{ width: "97%" }} />
                </div>
                <span className="lp-confidence-pct">Độ tin cậy 97%</span>
              </div>

              {/* Feature tags */}
              <div className="lp-feature-tags">
                {["VSL", "ASL", "BSL"].map((tag) => (
                  <span key={tag} className="lp-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating accent cards */}
          <div className="lp-float-card lp-float-top">
            <Heart className="w-4 h-4 text-pink-400" />
            <span>Thân thiện & Dễ dùng</span>
          </div>
          <div className="lp-float-card lp-float-bottom">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Phản hồi dưới 100ms</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─── Section: Stats ────────────────────────────────────────────────────────────

const StatsSection: React.FC = () => (
  <section aria-label="Số liệu nền tảng" className="lp-stats">
    <div className="lp-container">
      <div className="lp-stats-grid">
        {STATS.map(({ value, label, icon }, idx) => (
          <motion.div
            key={label}
            className="lp-stat-item"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={idx * 0.09}
            variants={fadeUp}
          >
            <div className="lp-stat-icon">{icon}</div>
            <p className="lp-stat-value">{value}</p>
            <p className="lp-stat-label">{label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Features ─────────────────────────────────────────────────────────

const FeaturesSection: React.FC = () => (
  <section aria-labelledby="features-heading" className="lp-section lp-section-light">
    <div className="lp-container">
      <motion.header
        className="lp-section-header"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <BadgeLabel>Tính năng nổi bật</BadgeLabel>
        <h2 id="features-heading" className="lp-section-title">
          Được Xây Dựng Cho Giao Tiếp{" "}
          <span className="lp-gradient-text">Không Rào Cản</span>
        </h2>
        <p className="lp-section-desc">
          Mỗi tính năng được thiết kế xoay quanh tốc độ, độ chính xác và khả năng tiếp cận phổ quát cho mọi người dùng.
        </p>
      </motion.header>

      <ul className="lp-features-grid list-none p-0 m-0">
        {FEATURES.map((feature, idx) => (
          <motion.li
            key={feature.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={idx * 0.1}
            variants={fadeUp}
            className="lp-feature-card group cursor-pointer"
          >
            <div className={`lp-feature-icon-wrap bg-gradient-to-br ${feature.accent}`}>
              {feature.icon}
            </div>
            <h3 className="lp-feature-title">{feature.title}</h3>
            <p className="lp-feature-desc">{feature.description}</p>
            <span className="lp-feature-link">
              Tìm hiểu thêm <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  </section>
);

// ─── Section: How It Works ─────────────────────────────────────────────────────

const HowItWorksSection: React.FC = () => (
  <section aria-labelledby="how-it-works-heading" className="lp-section lp-section-indigo">
    <div className="lp-container">
      <motion.header
        className="lp-section-header"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <BadgeLabel>Chỉ 3 bước đơn giản</BadgeLabel>
        <h2 id="how-it-works-heading" className="lp-section-title">
          Sẵn Sàng Giao Tiếp{" "}
          <span className="lp-gradient-text">Trong Vài Giây</span>
        </h2>
        <p className="lp-section-desc">
          Không cần phần cứng đặc biệt. Không cần cài đặt lâu dài. Chỉ cần mở ứng dụng, ra hiệu và bắt đầu trò chuyện.
        </p>
      </motion.header>

      <ol className="lp-steps-grid list-none p-0 m-0">
        {STEPS.map((item, idx) => (
          <motion.li
            key={item.step}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={idx * 0.14}
            variants={fadeUp}
            className="lp-step-card"
          >
            {/* Connector line (desktop only) */}
            {idx < STEPS.length - 1 && (
              <div aria-hidden="true" className="lp-step-connector" />
            )}
            <div className="lp-step-number-wrap">
              <span className="lp-step-number">{item.step}</span>
              <div className="lp-step-icon">{item.icon}</div>
            </div>
            <h3 className="lp-step-title">{item.title}</h3>
            <p className="lp-step-desc">{item.description}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  </section>
);

// ─── Section: Testimonials ─────────────────────────────────────────────────────

const TestimonialsSection: React.FC = () => (
  <section aria-labelledby="testimonials-heading" className="lp-section lp-section-light">
    <div className="lp-container">
      <motion.header
        className="lp-section-header"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <BadgeLabel>Câu chuyện thực tế</BadgeLabel>
        <h2 id="testimonials-heading" className="lp-section-title">
          Người Dùng Nói Gì Về{" "}
          <span className="lp-gradient-text">Signify</span>
        </h2>
        <p className="lp-section-desc">
          Những câu chuyện có thật từ những người mà cuộc sống đã được thay đổi nhờ Signify.
        </p>
      </motion.header>

      <ul className="lp-testimonials-grid list-none p-0 m-0">
        {TESTIMONIALS.map((item, idx) => (
          <motion.li
            key={item.author}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={idx * 0.12}
            variants={fadeUp}
          >
            <article className="lp-testimonial-card">
              <StarRating rating={item.rating} />
              <blockquote className="lp-testimonial-quote">
                <p>"{item.quote}"</p>
              </blockquote>
              <footer className="lp-testimonial-footer">
                <div
                  aria-hidden="true"
                  className="lp-testimonial-avatar"
                >
                  {item.initials}
                </div>
                <div>
                  <cite className="lp-testimonial-author">{item.author}</cite>
                  <span className="lp-testimonial-role">{item.role}</span>
                </div>
              </footer>
            </article>
          </motion.li>
        ))}
      </ul>
    </div>
  </section>
);

// ─── Section: CTA ──────────────────────────────────────────────────────────────

interface CTAProps {
  isAuthenticated: boolean;
}

const CTASection: React.FC<CTAProps> = ({ isAuthenticated }) => (
  <section aria-labelledby="cta-heading" className="lp-cta-section">
    <div className="lp-container">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="lp-cta-card"
      >
        {/* Background layers */}
        <div aria-hidden="true" className="lp-cta-orb lp-cta-orb-1" />
        <div aria-hidden="true" className="lp-cta-orb lp-cta-orb-2" />
        <div aria-hidden="true" className="lp-cta-grid-overlay" />

        <div className="lp-cta-content">
          <BadgeLabel>Bắt đầu ngay hôm nay</BadgeLabel>
          <h2 id="cta-heading" className="lp-cta-title">
            Giao Tiếp Không Giới Hạn,{" "}
            <br className="hidden sm:block" />
            Kết Nối Không Biên Giới
          </h2>
          <p className="lp-cta-desc">
            Tham gia cùng hơn 50,000 người sử dụng Signify mỗi ngày để thu hẹp khoảng cách giữa cộng đồng nghe và khiếm thính.
          </p>

          <div className="lp-cta-actions">
            <Link
              to={isAuthenticated ? "/translate" : "/register"}
              className="lp-btn-cta"
              id="cta-btn-primary"
            >
              {isAuthenticated ? "Mở Trình Dịch" : "Tạo tài khoản miễn phí"}
              <ArrowRight aria-hidden="true" className="w-5 h-5 lp-btn-arrow" />
            </Link>
            <Link
              to="/packages"
              className="lp-btn-outline-white"
              id="cta-btn-secondary"
            >
              Xem gói dịch vụ
            </Link>
          </div>

          <ul
            aria-label="Lợi ích chính"
            className="lp-cta-benefits list-none p-0"
          >
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="lp-benefit-item">
                <CheckCircle2
                  aria-hidden="true"
                  className="w-4 h-4 text-emerald-400 shrink-0"
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  </section>
);

// ─── Scoped Styles ────────────────────────────────────────────────────────────

const LandingStyles: React.FC = () => (
  <style>{`
    /* ── Font base ── */
    .lp-root {
      font-family: 'Open Sans', system-ui, sans-serif;
      color: #1e3a8a;
      background: #ffffff;
    }

    /* ── Gradient text ── */
    .lp-gradient-text {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1e40af 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* ── Badge ── */
    .lp-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 9999px;
      background: linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(29,78,216,0.10) 100%);
      border: 1px solid rgba(37,99,235,0.20);
      color: #2563EB;
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
    }

    /* ── Container ── */
    .lp-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    @media (min-width: 768px) { .lp-container { padding: 0 4rem; } }

    /* ── Sections ── */
    .lp-section { padding: 7rem 0; }
    .lp-section-light { background: #ffffff; }
    .lp-section-indigo { background: linear-gradient(160deg, #EEF2FF 0%, #F5F3FF 100%); }

    .lp-section-header {
      text-align: center;
      max-width: 640px;
      margin: 0 auto 4rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .lp-section-title {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #1e3a8a;
      margin: 0;
    }
    .lp-section-desc {
      font-size: 1.0625rem;
      color: #1e40af;
      line-height: 1.75;
      max-width: 540px;
      margin: 0;
      opacity: 0.8;
    }

    /* ══════════════════════════════════════════ HERO ═══ */
    .lp-hero {
      position: relative;
      padding: 6rem 0 7rem;
      overflow: hidden;
      background: linear-gradient(155deg, #f0f9ff 0%, #eff6ff 40%, #f0f9ff 100%);
    }

    /* Orbs */
    .lp-orbs-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .lp-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
    }
    .lp-orb-1 {
      top: -10%;
      left: -5%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
    }
    .lp-orb-2 {
      top: 30%;
      right: -8%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%);
    }
    .lp-orb-3 {
      bottom: -10%;
      left: 30%;
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%);
    }

    .lp-hero-grid {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 4rem;
      align-items: center;
    }
    @media (min-width: 1024px) {
      .lp-hero-grid { grid-template-columns: 1fr 1fr; }
    }

    .lp-hero-copy { display: flex; flex-direction: column; gap: 1.25rem; }

    .lp-hero-title {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(2.2rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: #1e3a8a;
      margin: 0;
    }

    .lp-hero-desc {
      font-size: 1.0625rem;
      color: #1e40af;
      line-height: 1.8;
      max-width: 500px;
      margin: 0;
      opacity: 0.85;
    }

    .lp-hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.875rem;
      margin-top: 0.5rem;
    }

    /* ── Buttons ── */
    .lp-btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      border-radius: 14px;
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      color: #ffffff;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 8px 32px rgba(37,99,235,0.35);
      transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
      cursor: pointer;
      border: none;
    }
    .lp-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(37,99,235,0.45);
      filter: brightness(1.06);
    }
    .lp-btn-primary:focus-visible {
      outline: 2px solid #2563EB;
      outline-offset: 3px;
    }

    .lp-btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.75rem;
      border-radius: 14px;
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.20);
      color: #2563EB;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
      cursor: pointer;
    }
    .lp-btn-ghost:hover {
      background: rgba(255,255,255,0.95);
      border-color: rgba(37,99,235,0.40);
      transform: translateY(-1px);
    }
    .lp-btn-ghost:focus-visible {
      outline: 2px solid #2563EB;
      outline-offset: 3px;
    }
    .lp-btn-arrow { transition: transform 200ms ease; }
    .lp-btn-primary:hover .lp-btn-arrow,
    .lp-btn-cta:hover .lp-btn-arrow { transform: translateX(4px); }

    /* Trust bar */
    .lp-hero-trust {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
    .lp-trust-avatars { display: flex; }
    .lp-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      border: 2px solid white;
      margin-left: -8px;
    }
    .lp-avatar:first-child { margin-left: 0; }
    .lp-trust-text {
      font-size: 0.8125rem;
      color: #1e40af;
      margin: 0;
      opacity: 0.8;
    }
    .lp-trust-text strong { color: #1e3a8a; }

    /* ── Hero Visual ── */
    .lp-hero-visual-wrap { position: relative; }

    .lp-hero-screen {
      position: relative;
      z-index: 2;
      background: #0f0e2a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 40px 100px rgba(15,14,42,0.4), 0 0 0 1px rgba(255,255,255,0.08);
    }

    .lp-screen-topbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .lp-screen-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .lp-dot-red { background: #FF5F57; }
    .lp-dot-yellow { background: #FEBC2E; }
    .lp-dot-green { background: #28C840; }
    .lp-screen-title {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.35);
      margin-left: 6px;
      font-family: 'Poppins', monospace;
    }

    .lp-screen-body {
      position: relative;
      aspect-ratio: 16/10;
      background: linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(29,78,216,0.1) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 1.5rem;
    }

    .lp-camera-feed {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lp-hand-scan-ring {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid rgba(37,99,235,0.5);
      animation: scanPulse 2.5s ease-in-out infinite;
    }
    @keyframes scanPulse {
      0%, 100% { transform: scale(0.85); opacity: 0.3; }
      50% { transform: scale(1.15); opacity: 0.7; }
    }

    .lp-glass-card {
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
    }
    .lp-live-card {
      position: absolute;
      bottom: 1.25rem;
      left: 1.25rem;
      right: 1.25rem;
      padding: 0.875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .lp-live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .lp-ping-dot { position: relative; display: flex; height: 10px; width: 10px; }
    .lp-ping-ring {
      position: absolute;
      display: inline-flex;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #34d399;
      opacity: 0.75;
      animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
    }
    @keyframes ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    .lp-ping-core {
      position: relative;
      display: inline-flex;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
    }
    .lp-live-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.5);
    }
    .lp-live-text {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
    }
    .lp-confidence-bar {
      height: 3px;
      background: rgba(255,255,255,0.1);
      border-radius: 9999px;
      overflow: hidden;
    }
    .lp-confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563EB, #1e40af);
      border-radius: 9999px;
    }
    .lp-confidence-pct {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.4);
    }

    .lp-feature-tags {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.4rem;
    }
    .lp-tag {
      padding: 3px 10px;
      border-radius: 9999px;
      background: rgba(37,99,235,0.3);
      border: 1px solid rgba(37,99,235,0.4);
      color: rgba(255,255,255,0.8);
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    /* Floating cards */
    .lp-float-card {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.12);
      box-shadow: 0 8px 32px rgba(0,0,0,0.10);
      font-size: 0.78rem;
      font-weight: 600;
      color: #1e3a8a;
      z-index: 3;
      animation: float 4s ease-in-out infinite;
    }
    .lp-float-top {
      top: -1rem;
      right: -0.75rem;
      animation-delay: 0s;
    }
    .lp-float-bottom {
      bottom: -1rem;
      left: -0.75rem;
      animation-delay: 2s;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    /* ══════════════════════════════════════════ STATS ═══ */
    .lp-stats {
      background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
      padding: 3.5rem 0;
    }
    .lp-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .lp-stats-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .lp-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      text-align: center;
    }
    .lp-stat-icon {
      color: rgba(255,255,255,0.55);
      margin-bottom: 0.25rem;
    }
    .lp-stat-value {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.03em;
    }
    .lp-stat-label {
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.7);
      margin: 0;
      font-weight: 500;
    }

    /* ══════════════════════════════════════════ FEATURES ═══ */
    .lp-features-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }
    @media (min-width: 640px) {
      .lp-features-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
      .lp-features-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .lp-feature-card {
      background: #ffffff;
      border: 1px solid #dbeafe;
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      box-shadow: 0 2px 12px rgba(37,99,235,0.06);
      transition: box-shadow 200ms ease, border-color 200ms ease, transform 200ms ease;
    }
    .lp-feature-card:hover {
      box-shadow: 0 12px 40px rgba(37,99,235,0.14);
      border-color: #bfdbfe;
      transform: translateY(-3px);
    }
    .lp-feature-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }
    .lp-feature-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }
    .lp-feature-desc {
      font-size: 0.875rem;
      color: #1e40af;
      line-height: 1.7;
      margin: 0;
      flex: 1;
      opacity: 0.8;
    }
    .lp-feature-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #2563EB;
      opacity: 0;
      transition: opacity 180ms ease;
    }
    .group:hover .lp-feature-link { opacity: 1; }

    /* ══════════════════════════════════════════ HOW IT WORKS ═══ */
    .lp-steps-grid {
      display: grid;
      gap: 2rem;
      grid-template-columns: 1fr;
    }
    @media (min-width: 768px) {
      .lp-steps-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .lp-step-card {
      position: relative;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(37,99,235,0.12);
      border-radius: 20px;
      padding: 2.25rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      box-shadow: 0 4px 24px rgba(37,99,235,0.06);
      transition: transform 200ms ease, box-shadow 200ms ease;
    }
    .lp-step-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 48px rgba(37,99,235,0.12);
    }
    .lp-step-connector {
      display: none;
    }
    @media (min-width: 768px) {
      .lp-step-connector {
        display: block;
        position: absolute;
        top: 2.5rem;
        right: -1.1rem;
        width: 2.2rem;
        height: 2px;
        background: linear-gradient(90deg, #bfdbfe, transparent);
        z-index: 5;
      }
    }
    .lp-step-number-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .lp-step-number {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 900;
      color: #dbeafe;
      line-height: 1;
      user-select: none;
    }
    .lp-step-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      flex-shrink: 0;
    }
    .lp-step-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.0625rem;
      font-weight: 700;
      color: #1e3a8a;
      margin: 0;
    }
    .lp-step-desc {
      font-size: 0.875rem;
      color: #1e40af;
      line-height: 1.7;
      margin: 0;
      opacity: 0.8;
    }

    /* ══════════════════════════════════════════ TESTIMONIALS ═══ */
    .lp-testimonials-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }
    @media (min-width: 768px) {
      .lp-testimonials-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .lp-testimonial-card {
      background: #fafafe;
      border: 1px solid #dbeafe;
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
      transition: box-shadow 200ms ease, transform 200ms ease;
    }
    .lp-testimonial-card:hover {
      box-shadow: 0 12px 40px rgba(37,99,235,0.10);
      transform: translateY(-2px);
    }
    .lp-testimonial-quote {
      flex: 1;
      font-size: 0.9375rem;
      color: #1e3a8a;
      line-height: 1.75;
      margin: 0;
      font-style: normal;
    }
    .lp-testimonial-quote p { margin: 0; }
    .lp-testimonial-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .lp-testimonial-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .lp-testimonial-author {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1e3a8a;
      font-style: normal;
      display: block;
    }
    .lp-testimonial-role {
      font-size: 0.75rem;
      color: #3b82f6;
      opacity: 0.75;
    }

    /* ══════════════════════════════════════════ CTA ═══ */
    .lp-cta-section {
      padding: 7rem 0;
      background: linear-gradient(160deg, #EEF2FF 0%, #F5F3FF 100%);
    }
    .lp-cta-card {
      position: relative;
      overflow: hidden;
      border-radius: 28px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563EB 40%, #1D4ED8 100%);
      padding: 5rem 2rem;
      text-align: center;
      box-shadow: 0 40px 100px rgba(37,99,235,0.4);
    }
    .lp-cta-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .lp-cta-orb-1 {
      top: -4rem;
      left: -4rem;
      width: 280px;
      height: 280px;
      background: rgba(255,255,255,0.08);
      filter: blur(40px);
    }
    .lp-cta-orb-2 {
      bottom: -4rem;
      right: -4rem;
      width: 280px;
      height: 280px;
      background: rgba(37,99,235,0.25);
      filter: blur(40px);
    }
    .lp-cta-grid-overlay {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
    }
    .lp-cta-content {
      position: relative;
      z-index: 2;
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .lp-cta-title {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(1.875rem, 4vw, 3rem);
      font-weight: 800;
      color: #ffffff;
      line-height: 1.12;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .lp-cta-desc {
      font-size: 1.0625rem;
      color: rgba(191,219,254,0.9);
      line-height: 1.75;
      margin: 0;
      max-width: 520px;
    }
    .lp-cta-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.875rem;
      justify-content: center;
      margin-top: 0.5rem;
    }
    .lp-btn-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2.25rem;
      border-radius: 14px;
      background: #ffffff;
      color: #2563EB;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
      transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
      cursor: pointer;
    }
    .lp-btn-cta:hover {
      transform: translateY(-2px);
      background: #eff6ff;
      box-shadow: 0 14px 40px rgba(0,0,0,0.22);
    }
    .lp-btn-cta:focus-visible {
      outline: 2px solid white;
      outline-offset: 3px;
    }
    .lp-btn-outline-white {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      border-radius: 14px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.30);
      color: #ffffff;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
      cursor: pointer;
    }
    .lp-btn-outline-white:hover {
      background: rgba(255,255,255,0.18);
      border-color: rgba(255,255,255,0.50);
      transform: translateY(-1px);
    }
    .lp-btn-outline-white:focus-visible {
      outline: 2px solid white;
      outline-offset: 3px;
    }
    .lp-cta-benefits {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.25rem 2rem;
      margin-top: 0.25rem;
    }
    .lp-benefit-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: rgba(191,219,254,0.9);
    }

    /* ── Reduced Motion ── */
    @media (prefers-reduced-motion: reduce) {
      .lp-hand-scan-ring,
      .lp-float-card,
      .lp-ping-ring { animation: none !important; }
    }
  `}</style>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  const heroHeadingId = useId();

  return (
    <>
      <FontLoader />
      <LandingStyles />
      <main id="main-content" className="lp-root">
        <HeroSection isAuthenticated={isAuthenticated} headingId={heroHeadingId} />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection isAuthenticated={isAuthenticated} />
      </main>
    </>
  );
};

export default LandingPage;

'use client';
import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import Link from 'next/link';
// Enhanced Keyframe animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(2deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const gradientRotate = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2);
  }
`;

// Sophisticated color palette
const colors = {
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  secondary: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  accent: {
    orange: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  background: {
    dark: '#0A0F1E',
    darker: '#060914',
    light: '#FFFFFF',
  }
};

// Styled Components with Professional Design
const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(180deg, ${colors.background.darker} 0%, ${colors.background.dark} 50%, #0D1421 100%)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 20%, ${colors.primary.glow} 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)
    `,
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    opacity: 0.5,
    pointerEvents: 'none',
  },
}));

const CornerLogo = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2.5),
  left: theme.spacing(2.5),
  zIndex: 3,
  width: 230,
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 255, 0.95))',
  border: '1px solid rgba(255, 255, 255, 0.85)',
  boxShadow: '0 14px 34px rgba(0, 0, 0, 0.28)',
  backdropFilter: 'blur(8px)',
  animation: `${fadeIn} 0.8s ease 0.2s backwards`,
  '& img': {
    display: 'block',
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
    objectPosition: 'left center',
    filter: 'contrast(1.08) saturate(1.05)',
  },
  [theme.breakpoints.down('md')]: {
    width: 195,
    top: theme.spacing(2),
    left: theme.spacing(2),
    padding: theme.spacing(1, 1.25),
  },
}));

const ContentWrapper = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(10),
  [theme.breakpoints.up('lg')]: {
    paddingTop: theme.spacing(10),
  },
  [theme.breakpoints.down('md')]: {
    paddingTop: theme.spacing(10),
    paddingBottom: theme.spacing(8),
  },
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(8),
    paddingBottom: theme.spacing(6),
  },
}));

const MainHeading = styled(Typography)(({ theme }) => ({
  fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
  fontWeight: 700,
  fontSize: 'clamp(2rem, 5vw, 4.5rem)',
  lineHeight: 1.15,
  marginBottom: theme.spacing(2.5),
  color: '#FFFFFF',
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1)`,
  letterSpacing: '-0.03em',
  position: 'relative',
  [theme.breakpoints.up('lg')]: {
    fontSize: 'clamp(3rem, 5.5vw, 5rem)',
  },
  '& .gradient-text': {
    background: `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.secondary.light} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block',
  },
}));

const SubHeading = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)',
  lineHeight: 1.7,
  textAlign: 'center',
  color: colors.neutral[300],
  marginBottom: theme.spacing(4),
  maxWidth: '700px',
  marginLeft: 'auto',
  marginRight: 'auto',
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards`,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(3),
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.95rem',
  fontWeight: 600,
  padding: theme.spacing(1.75, 4),
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  letterSpacing: '0.02em',
  background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})`,
  color: '#FFFFFF',
  border: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 16px ${colors.primary.glow}, 0 2px 4px rgba(0, 0, 0, 0.2)`,
  [theme.breakpoints.up('lg')]: {
    fontSize: '1rem',
    padding: theme.spacing(2, 4.5),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.6s ease',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${colors.primary.main}60, 0 4px 8px rgba(0, 0, 0, 0.3)`,
    background: `linear-gradient(135deg, ${colors.primary.light}, ${colors.primary.main})`,
    '&::before': {
      left: '100%',
    },
  },
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s backwards`,
}));

const StatsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(6),
  marginTop: theme.spacing(7),
  flexWrap: 'wrap',
  justifyContent: 'center',
  animation: `${fadeIn} 1s ease 0.6s backwards`,
  [theme.breakpoints.up('lg')]: {
    gap: theme.spacing(8),
    marginTop: theme.spacing(8),
  },
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(5),
    marginTop: theme.spacing(6),
  },
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(4),
    marginTop: theme.spacing(5),
  },
}));

const StatItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '2px',
    background: `linear-gradient(90deg, transparent, ${colors.primary.main}, transparent)`,
  },
  '& .stat-number': {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${colors.primary.light}, ${colors.secondary.light})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: theme.spacing(1),
  },
  '& .stat-label': {
    fontFamily: '"Inter", sans-serif',
    fontSize: '0.875rem',
    color: colors.neutral[400],
    fontWeight: 500,
    letterSpacing: '0.05em',
  },
}));

const BadgeWrapper = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  background: `linear-gradient(135deg, ${colors.primary.main}20, ${colors.secondary.main}15)`,
  border: `1px solid ${colors.primary.main}40`,
  borderRadius: theme.spacing(4),
  marginBottom: theme.spacing(3),
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards`,
  backdropFilter: 'blur(10px)',
  '& .badge-dot': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: colors.secondary.main,
    animation: `${pulseGlow} 2s ease-in-out infinite`,
  },
  '& .badge-text': {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#FFFFFF',
    letterSpacing: '0.02em',
  },
}));

// Main Component
export default function ImprovedHeroPage() {
  return (
    <HeroSection>
      <CornerLogo>
        <Box
          component="img"
          src="/vedam_logo.webp"
          alt="Vedam School of Technology"
          loading="eager"
          draggable={false}
        />
      </CornerLogo>

      <ContentWrapper>
        {/* Hero Content */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 7, lg: 8 }, maxWidth: '850px', margin: '0 auto' }}>
          <BadgeWrapper>
            <div className="badge-dot" />
            <span className="badge-text">Built for the Voltrix Project Demo</span>
          </BadgeWrapper>

          <MainHeading variant="h1">
            Plan Better Routes with<br />
            <span className="gradient-text">Safety-First Navigation</span>
          </MainHeading>
          
          <SubHeading variant="h2">
            Voltrix combines route planning, alternate-path verdicts, speed-limit awareness, and 
            driver drowsiness monitoring in one real-time Next.js cockpit.
          </SubHeading>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3.5, md: 4, lg: 4.5 } }}>
            <Link href="/navigation?drowsiness=1">
              <CTAButton variant="contained" size="large">
                Start Live Navigation
              </CTAButton>
            </Link>
          </Box>

          {/* Stats */}
          <StatsBox>
            <StatItem>
              <div className="stat-number">4</div>
              <div className="stat-label">Core Modules</div>
            </StatItem>
            <StatItem>
              <div className="stat-number">2</div>
              <div className="stat-label">Safety Monitors</div>
            </StatItem>
            <StatItem>
              <div className="stat-number">Live</div>
              <div className="stat-label">Route Verdict Flow</div>
            </StatItem>
          </StatsBox>
        </Box>

      </ContentWrapper>
    </HeroSection>
  );
}
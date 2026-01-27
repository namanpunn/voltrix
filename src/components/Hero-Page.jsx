'use client';
import React from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, useTheme, useMediaQuery } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import NavigationIcon from '@mui/icons-material/Navigation';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RouteIcon from '@mui/icons-material/Route';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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
  color: colors.neutral[300],
  marginBottom: theme.spacing(4),
  maxWidth: '700px',
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards`,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(3),
  },
}));

const ProblemStatement = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)`,
  border: `1px solid rgba(59, 130, 246, 0.15)`,
  borderRadius: theme.spacing(2.5),
  padding: theme.spacing(4, 5),
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(6),
  position: 'relative',
  overflow: 'hidden',
  animation: `${scaleIn} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards`,
  backdropFilter: 'blur(20px)',
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(5, 6),
    marginTop: theme.spacing(7),
    marginBottom: theme.spacing(7),
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3.5, 4),
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(5),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    background: `linear-gradient(180deg, ${colors.primary.main}, ${colors.secondary.main})`,
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  background: 'rgba(23, 23, 23, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: theme.spacing(2.5),
  height: '100%',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${colors.primary.glow} 0%, transparent 100%)`,
    opacity: 0,
    transition: 'opacity 0.4s ease',
  },
  '&:hover': {
    transform: 'translateY(-12px)',
    border: `1px solid ${colors.primary.main}40`,
    boxShadow: `0 24px 48px ${colors.primary.glow}, 0 8px 16px rgba(0, 0, 0, 0.4)`,
    '&::before': {
      opacity: 1,
    },
    '& .icon-wrapper': {
      transform: 'scale(1.1) rotate(5deg)',
      background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.secondary.main})`,
    },
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${colors.primary.main}30, ${colors.secondary.main}20)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '& svg': {
    fontSize: '1.75rem',
    color: colors.primary.light,
    zIndex: 1,
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

const SecondaryButton = styled(Button)(({ theme }) => ({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.95rem',
  fontWeight: 600,
  padding: theme.spacing(1.75, 4),
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  letterSpacing: '0.02em',
  color: '#FFFFFF',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.up('lg')]: {
    fontSize: '1rem',
    padding: theme.spacing(2, 4.5),
  },
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-2px)',
  },
  animation: `${fadeInUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s backwards`,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <RouteIcon />,
      title: 'Intelligent Route Planning',
      description: 'Advanced AI algorithms analyze multiple path options simultaneously, providing data-driven recommendations for optimal route selection, U-turns, and detour decisions.'
    },
    {
      icon: <VisibilityIcon />,
      title: 'Visual Navigation Aid',
      description: 'Real-time camera integration identifies and highlights the correct path at complex intersections, providing visual confidence in unfamiliar environments.'
    },
    {
      icon: <NavigationIcon />,
      title: 'Live Route Simulation',
      description: 'Instantly preview alternative routes from your current position with real-time traffic data, estimated time savings, and optimal decision points.'
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Adaptive Intelligence',
      description: 'Dynamic response to changing road conditions, traffic patterns, and unexpected obstacles with intelligent recommendations and automatic rerouting.'
    }
  ];

  return (
    <HeroSection>
      <ContentWrapper>
        {/* Hero Content */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 7, lg: 8 }, maxWidth: '850px', margin: '0 auto' }}>
          <BadgeWrapper>
            <div className="badge-dot" />
            <span className="badge-text">Next-Gen Navigation Technology</span>
          </BadgeWrapper>

          <MainHeading variant="h1">
            Navigate Smarter with<br />
            <span className="gradient-text">Vision-Powered Routing</span>
          </MainHeading>
          
          <SubHeading variant="h2">
            Experience the future of navigation with our AI-driven platform that combines intelligent 
            route optimization with real-time visual guidance for confident, efficient travel decisions.
          </SubHeading>

          {/* CTA Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: { xs: 3.5, md: 4, lg: 4.5 } }}>
            <CTAButton variant="contained" size="large">
              Start Your Journey
            </CTAButton>
            <SecondaryButton variant="outlined" size="large">
              Explore Features
            </SecondaryButton>
          </Box>

          {/* Stats */}
          <StatsBox>
            <StatItem>
              <div className="stat-number">40%</div>
              <div className="stat-label">Faster Arrivals</div>
            </StatItem>
            <StatItem>
              <div className="stat-number">Real-Time</div>
              <div className="stat-label">Route Analysis</div>
            </StatItem>
            <StatItem>
              <div className="stat-number">24/7</div>
              <div className="stat-label">Smart Guidance</div>
            </StatItem>
          </StatsBox>
        </Box>

        {/* Problem Statement */}
        <ProblemStatement>
          <Typography 
            variant="h5" 
            sx={{ 
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              color: '#FFFFFF',
              mb: 2,
              fontSize: { xs: '1.15rem', md: '1.3rem', lg: '1.4rem' },
            }}
          >
            Solving the Navigation Challenge
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: '"Inter", sans-serif',
              color: colors.neutral[300],
              lineHeight: 1.75,
              fontSize: { xs: '0.95rem', md: '1rem', lg: '1.05rem' },
              fontWeight: 400,
            }}
          >
            Traditional navigation apps fall short when it matters most. They calculate the shortest or fastest 
            route but leave you guessing at critical decision points. Should you make that U-turn? Is the 
            alternate road actually faster? Existing systems don't allow real-time route simulation from your 
            current position, and map views often fail at complex intersections. Our platform bridges this gap 
            by combining intelligent optimization with camera-based visual guidance, empowering you to make 
            informed decisions on the fly.
          </Typography>
        </ProblemStatement>

      </ContentWrapper>
    </HeroSection>
  );
}
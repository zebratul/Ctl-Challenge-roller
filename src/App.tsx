import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Stack, 
  Chip,
  Fade,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Refresh, 
  Casino, 
  HelpOutline,
  Language
} from '@mui/icons-material';

type OutcomeType = 'good' | 'bad' | 'retry';
type Tier = 'basic' | 'advanced' | 'hard';
type Lang = 'en' | 'ru';

interface Token {
  id: string;
  type: OutcomeType;
  tier: Tier;
  revealed: boolean;
}

interface GameState {
  round: number;
  successes: number;
  tokens: Token[];
  history: (OutcomeType | null)[];
  phase: 'input' | 'playing' | 'summary' | 'end';
  peek: boolean;
}

const translations = {
  en: {
    title: 'RPG RESOLUTION',
    round: 'ROUND',
    complete: 'COMPLETE',
    rollTitle: 'Roll Dice',
    rollDesc: 'Enter the number of successes rolled (0-3)',
    successes: 'Successes',
    reveal: 'Reveal Board',
    victory: 'VICTORY',
    defeat: 'DEFEAT',
    newGame: 'New Game',
    continue: 'Continue',
    unknown: 'UNKNOWN TOKEN',
    basic: 'basic',
    advanced: 'advanced',
    hard: 'hard',
    good: 'Success',
    bad: 'Failure',
    retry: 'Retry'
  },
  ru: {
    title: 'Проверка навыков',
    round: 'РАУНД',
    complete: 'ЗАВЕРШЕНО',
    rollTitle: 'Бросок кубиков',
    rollDesc: 'Введите количество успехов (0-3)',
    successes: 'Успехи',
    reveal: 'Открыть доску',
    victory: 'ПОБЕДА',
    defeat: 'ПОРАЖЕНИЕ',
    newGame: 'Новая игра',
    continue: 'Продолжить',
    unknown: 'НЕИЗВЕСТНО',
    basic: 'базовый',
    advanced: 'продвинутый',
    hard: 'сложный',
    good: 'Успех',
    bad: 'Провал',
    retry: 'Переброс'
  }
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: { default: '#0a0a0a', paper: '#1e1e1e' },
  },
});

const generateTokens = (successes: number): Token[] => {
  const basic: { type: OutcomeType; tier: Tier }[] = [
    { type: 'good', tier: 'basic' },
    { type: 'bad', tier: 'basic' },
    { type: 'retry', tier: 'basic' },
    { type: 'retry', tier: 'basic' },
  ];
  const advanced: { type: OutcomeType; tier: Tier }[] = [
    { type: 'good', tier: 'advanced' },
    { type: 'good', tier: 'advanced' },
    { type: 'bad', tier: 'advanced' },
    { type: 'bad', tier: 'advanced' },
  ];
  const hard: { type: OutcomeType; tier: Tier }[] = [
    { type: 'good', tier: 'hard' },
    { type: 'bad', tier: 'hard' },
  ];

  const removeAdvanced = Math.min(successes, 2);
  const removeHard = Math.max(0, successes - 2);

  const filterBad = (pool: typeof advanced, count: number) => {
    let removed = 0;
    return pool.filter(t => {
      if (t.type === 'bad' && removed < count) {
        removed++;
        return false;
      }
      return true;
    });
  };

  return [
    ...basic,
    ...filterBad(advanced, removeAdvanced),
    ...filterBad(hard, removeHard),
  ]
    .map((t, i) => ({ ...t, id: `token-${Date.now()}-${i}`, revealed: false }))
    .sort(() => Math.random() - 0.5);
};

const outcomeColors: Record<OutcomeType, string> = {
  good: 'success.main',
  bad: 'error.main',
  retry: 'warning.main'
};

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [state, setState] = useState<GameState>({
    round: 0,
    successes: 0,
    tokens: [],
    history: [null, null, null],
    phase: 'input',
    peek: false
  });

  const txt = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setState(p => ({ ...p, peek: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setState(p => ({ ...p, peek: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleStartRound = () => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      tokens: generateTokens(prev.successes)
    }));
  };

  const handleTokenClick = (id: string) => {
    setState(prev => {
      const clickedToken = prev.tokens.find(t => t.id === id);
      if (!clickedToken || clickedToken.revealed) return prev;
      const newTokens = prev.tokens.map(t => t.id === id ? { ...t, revealed: true } : t);
      if (clickedToken.type === 'retry') return { ...prev, tokens: newTokens };
      const newHistory = [...prev.history];
      newHistory[prev.round] = clickedToken.type;
      return { ...prev, tokens: newTokens, history: newHistory, phase: 'summary' };
    });
  };

  const handleNextPhase = () => {
    setState(prev => {
      const isGameOver = prev.round >= 2;
      return {
        ...prev,
        phase: isGameOver ? 'end' : 'input',
        round: isGameOver ? prev.round : prev.round + 1,
        successes: 0,
        peek: false
      };
    });
  };

  const handleReset = () => {
    setState({ round: 0, successes: 0, tokens: [], history: [null, null, null], phase: 'input', peek: false });
  };

  const getIcon = (type: OutcomeType) => 
    type === 'good' ? <CheckCircle color="success" /> :
    type === 'bad' ? <Cancel color="error" /> :
    <Refresh color="warning" />;

  const isInput = state.phase === 'input';
  const isEnd = state.phase === 'end';
  const isSummary = state.phase === 'summary';
  const isPlaying = state.phase === 'playing';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Outer Wrapper: Centering everything */}
      <Box 
        sx={{ 
          minHeight: '100vh', 
          width: '100vw',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3
        }}
      >
        {/* Main Application Container */}
        <Paper 
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: '1000px', // Forces 1000px limit
            minWidth: { md: '1000px' }, // Ensures it stays wide on desktop
            minHeight: '70vh',
            p: 6,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.paper',
            position: 'relative'
          }}
        >
          <Stack spacing={5} width="100%" maxWidth="700px">
            {/* Header Section */}
            <Stack spacing={2} alignItems="center">
              <Typography variant="h2" fontWeight="900" textAlign="center" sx={{ letterSpacing: 2 }}>
                {txt.title}
              </Typography>
              <Chip 
                label={isEnd ? txt.complete : `${txt.round} ${state.round + 1} / 3`} 
                color={isEnd ? "success" : "primary"} 
                sx={{ fontSize: '1.4rem', py: 3, px: 3, fontWeight: 'bold' }}
              />
            </Stack>

            {/* History Tracker */}
            <Stack direction="row" spacing={3} justifyContent="center">
              {state.history.map((res, i) => (
                <Paper 
                  key={i} 
                  variant="outlined"
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderColor: (i === state.round && !isEnd) ? 'primary.main' : 'divider',
                    borderWidth: (i === state.round && !isEnd) ? 4 : 1,
                    borderRadius: 3
                  }}
                >
                  {res ? (
                    <Box sx={{ transform: 'scale(1.5)' }}>{getIcon(res)}</Box>
                  ) : (
                    <Typography variant="h5" color="text.secondary">{i + 1}</Typography>
                  )}
                </Paper>
              ))}
            </Stack>

            {/* Game Content Area */}
            <Box flex={1}>
              {isInput ? (
                <Fade in>
                  <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed', borderRadius: 4 }}>
                    <Casino sx={{ fontSize: 80, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h4" gutterBottom fontWeight="bold">{txt.rollTitle}</Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                      {txt.rollDesc}
                    </Typography>
                    <TextField
                      type="number"
                      fullWidth
                      variant="filled"
                      label={txt.successes}
                      value={state.successes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setState(p => ({ ...p, successes: Math.min(Math.max(val, 0), 3) }));
                      }}
                      inputProps={{ min: 0, max: 3, style: { fontSize: '2rem', textAlign: 'center' } }}
                      sx={{ mb: 4 }}
                    />
                    <Button 
                      variant="contained" 
                      fullWidth 
                      size="large" 
                      onClick={handleStartRound}
                      sx={{ py: 2, fontSize: '1.3rem', fontWeight: 'bold' }}
                    >
                      {txt.reveal}
                    </Button>
                  </Paper>
                </Fade>
              ) : isEnd ? (
                <Fade in>
                  <Paper variant="outlined" sx={{ p: 8, textAlign: 'center', borderStyle: 'dashed', borderRadius: 4 }}>
                    <Typography variant="h1" gutterBottom fontWeight="900" color={state.history.filter(h => h === 'good').length >= 2 ? 'success.main' : 'error.main'}>
                      {state.history.filter(h => h === 'good').length >= 2 ? txt.victory : txt.defeat}
                    </Typography>
                    <Button variant="contained" size="large" onClick={handleReset} sx={{ mt: 4, px: 6, py: 2, fontSize: '1.2rem' }}>
                      {txt.newGame}
                    </Button>
                  </Paper>
                </Fade>
              ) : (
                <Stack spacing={2}>
                  {/* Token List: No maxHeight or Overflow to ensure no scrollbar */}
                  <Stack spacing={1.5}>
                    {state.tokens.map((token) => {
                      const isVisible = token.revealed || (state.peek && isPlaying);
                      return (
                        <Fade in key={token.id}>
                          <Paper
                            onClick={() => !isSummary && !token.revealed && handleTokenClick(token.id)}
                            sx={{
                              p: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: (token.revealed || isSummary) ? 'default' : 'pointer',
                              bgcolor: isVisible ? 'rgba(255,255,255,0.05)' : 'action.hover',
                              borderColor: isVisible ? outcomeColors[token.type] : 'transparent',
                              borderWidth: 2,
                              borderStyle: 'solid',
                              borderRadius: 3,
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                bgcolor: (!isVisible && !isSummary) ? 'action.selected' : undefined,
                                transform: (!isVisible && !isSummary) ? 'translateY(-2px)' : undefined,
                                boxShadow: (!isVisible && !isSummary) ? 4 : 0
                              }
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={3}>
                              {isVisible ? getIcon(token.type) : <HelpOutline color="disabled" sx={{ fontSize: 32 }} />}
                              <Typography 
                                variant="h5"
                                sx={{ 
                                  color: isVisible ? outcomeColors[token.type] : 'text.primary',
                                  fontWeight: isVisible ? 'bold' : '500'
                                }}
                              >
                                {isVisible ? txt[token.type] : txt.unknown}
                              </Typography>
                            </Box>
                            {isVisible && (
                              <Chip 
                                label={txt[token.tier] || token.tier} 
                                variant="filled"
                                sx={{ fontWeight: 'bold' }}
                                color={token.type === 'good' ? 'success' : token.type === 'bad' ? 'error' : 'warning'}
                              />
                            )}
                          </Paper>
                        </Fade>
                      );
                    })}
                  </Stack>
                  {isSummary && (
                    <Fade in>
                      <Button 
                        variant="contained" 
                        color="secondary" 
                        size="large" 
                        fullWidth 
                        onClick={handleNextPhase}
                        sx={{ py: 2.5, mt: 2, fontSize: '1.4rem', fontWeight: 'bold', boxShadow: 6 }}
                      >
                        {txt.continue}
                      </Button>
                    </Fade>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
          
          {/* Language Selector */}
          <Box sx={{ mt: 6, alignSelf: 'flex-end' }}>
             <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
               <Select
                 value={lang}
                 onChange={(e) => setLang(e.target.value as Lang)}
                 startAdornment={<Language sx={{ mr: 1 }} />}
                 sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }}
               >
                 <MenuItem value="en">English</MenuItem>
                 <MenuItem value="ru">Русский</MenuItem>
               </Select>
             </FormControl>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}